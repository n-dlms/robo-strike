// ============================================================================
// CasinoSession, round orchestrator for both runtime modes.
//
// HOST mode (game embedded in the casino iframe):
//   openSession(gameData=uint8 tankId|OD) → watch snapshots for the settled row
//   → decode gameState (randomness present) → outcome → caller animates →
//   revealOutcome (mandatory: releases withheld credits, 2026.07.02 breaking).
//
// STANDALONE mode (opened directly as a URL):
//   Same paytable + mapper, entropy from crypto.getRandomValues (32 uniform
//   bytes = uint256 in [0, 2^256)). No Math.random anywhere (lint:rng gate).
//   Mock balance so the full loop is playable without a wallet.
// ============================================================================

import { createHostConnection, computeMaxWager, inHostIframe, type HostConnection } from './guest'
import { isTerminalPhase, type HostSnapshotV1 } from './types'
import {
  decodeGameState,
  encodeTankId,
  mapOverdriveWin,
  mapVrfToOutcome,
  payoutAfterOverdrive,
  payoutForOutcome,
  qualifiesForOverdrive,
  type TankId,
} from '../../config/paytables'

export type RoundPhase = 'idle' | 'opening' | 'waiting' | 'reveal' | 'settled'

export interface RoundResult {
  sessionId?: string
  tank: TankId
  outcome: number
  overdriveTaken: boolean
  overdriveWon: boolean
  /** wager in token base units */
  wager: bigint
  /** payout in token base units (already includes Overdrive ×2.5 / bust) */
  payout: bigint
  /** true when resolved from payout heuristic, not full gameState (degraded reveal) */
  degraded?: boolean
}

type Listener = (session: CasinoSession) => void

export class CasinoSession {
  readonly mode: 'host' | 'standalone'
  phase: RoundPhase = 'idle'
  /** standalone mock balance, base units (100.00 tokens) */
  balance = 100n * 10n ** 18n
  snapshot: HostSnapshotV1 | null = null
  walletReady = false

  private conn?: HostConnection
  private listeners: Listener[] = []

  constructor() {
    this.mode = inHostIframe() ? 'host' : 'standalone'
  }

  onChange(fn: Listener): void {
    this.listeners.push(fn)
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this)
  }

  /** Connect to host if framed. Never throws, falls back to standalone demo. */
  async init(): Promise<void> {
    if (this.mode !== 'host') return
    try {
      this.conn = createHostConnection((snapshot) => {
        this.snapshot = snapshot
        this.walletReady = snapshot?.wallet.status === 'ready'
        this.emit()
      })
      await this.conn.ready(5000)
    } catch {
      // Host never handshaked (opened standalone / dev server), degrade quietly.
      this.conn?.destroy()
      this.conn = undefined
      ;(this as { mode: 'host' | 'standalone' }).mode = 'standalone'
      this.emit()
    }
  }

  destroy(): void {
    this.conn?.destroy()
    this.conn = undefined
  }

  /** Display token symbol/decimals from host, or mock defaults. */
  decimals(): number {
    return this.snapshot?.token.decimals ?? 18
  }

  symbol(): string {
    return this.snapshot?.token.symbol ?? 'DEMO'
  }

  /** Host balance (display only), falls back to the standalone mock. */
  displayBalance(): bigint {
    const b = this.snapshot?.balances.smartVaultBalance
    return b !== undefined ? BigInt(b) : this.balance
  }

  /** Host risk clamp for a tank: computeMaxWager with that tank's jackpot multiplier. */
  maxWager(tank: TankId): bigint | undefined {
    if (this.mode !== 'host') return undefined
    const maxMult = tank === 0 ? 30 : tank === 1 ? 15 : 12
    return computeMaxWager(this.snapshot, maxMult)
  }

  canBet(): boolean {
    if (this.phase !== 'idle') return false
    if (this.mode === 'standalone') return true
    return this.walletReady
  }

  /** Uniform uint256 from crypto, the standalone stand-in for Chain VRF. */
  private static randomWord(): bigint {
    const buf = new Uint8Array(32)
    crypto.getRandomValues(buf)
    let v = 0n
    for (const b of buf) v = (v << 8n) | BigInt(b)
    return v
  }

  /**
   * Place one round. Resolves with the VRF outcome (host) or crypto outcome
   * (standalone). The caller owns presentation + revealOutcome timing.
   */
  async placeRound(wager: bigint, tank: TankId, wantsOverdrive: boolean): Promise<RoundResult> {
    if (this.phase !== 'idle') throw new Error('round already in flight')
    this.phase = 'opening'
    this.emit()
    try {
      if (this.mode === 'host') return await this.placeHostRound(wager, tank, wantsOverdrive)
      return this.placeStandaloneRound(wager, tank, wantsOverdrive)
    } catch (err) {
      this.phase = 'idle'
      this.emit()
      throw err
    }
  }

  private placeStandaloneRound(wager: bigint, tank: TankId, wantsOverdrive: boolean): RoundResult {
    if (wager > this.balance) throw new Error('insufficient demo balance')
    this.phase = 'waiting'
    this.emit()
    const v = CasinoSession.randomWord()
    const outcome = mapVrfToOutcome(v, tank)
    let payout = payoutForOutcome(wager, tank, outcome)
    let odTaken = false
    let odWon = false
    if (wantsOverdrive && qualifiesForOverdrive(tank, outcome)) {
      odTaken = true
      odWon = mapOverdriveWin(CasinoSession.randomWord())
      payout = payoutAfterOverdrive(payout, odWon)
    }
    this.balance = this.balance - wager + payout
    this.phase = 'reveal'
    this.emit()
    return { tank, outcome, overdriveTaken: odTaken, overdriveWon: odWon, wager, payout }
  }

  private placeHostRound(wager: bigint, tank: TankId, wantsOverdrive: boolean): Promise<RoundResult> {
    const hostApi = this.conn?.hostApi
    if (!hostApi) return Promise.reject(new Error('host api unavailable'))

    const gameData = encodeTankId(tank, wantsOverdrive)
    return hostApi
      .openSession({ wager: wager.toString(), gameData, randomnessRequestData: '0x' })
      .then(({ sessionKey }) => {
        this.phase = 'waiting'
        this.emit()
        return this.awaitSettledRow(sessionKey).then(async (row) => {
          this.phase = 'reveal'
          this.emit()
          const result = this.resultFromRow(row, wager, tank)
          return result
        })
      })
  }

  /** Poll snapshots until the session row settles. */
  private awaitSettledRow(sessionKey: string): Promise<HostSnapshotV1['sessions']['items'][number]> {
    const check = (): HostSnapshotV1['sessions']['items'][number] | undefined => {
      const row = this.snapshot?.sessions.items.find((i) => i.sessionKey === sessionKey)
      if (row && isTerminalPhase(row)) return row
      return undefined
    }
    const immediate = check()
    if (immediate) return Promise.resolve(immediate)
    return new Promise((resolve) => {
      const timer = setInterval(() => {
        const row = check()
        if (row) {
          clearInterval(timer)
          resolve(row)
        }
      }, 100)
    })
  }

  /**
   * Outcome resolution priority (per coinflip pattern):
   * decodeGameState(randomness in state) → raw.randomness mapping → payout heuristic.
   */
  private resultFromRow(
    row: HostSnapshotV1['sessions']['items'][number],
    wager: bigint,
    tank: TankId,
  ): RoundResult {
    const sessionId = row.sessionId
    const fromState = row.raw.gameState ? decodeGameState(row.raw.gameState) : null
    if (fromState) {
      let payout = payoutForOutcome(wager, fromState.tankId, fromState.outcome)
      if (fromState.overdriveTaken) {
        payout = payoutAfterOverdrive(payout, fromState.overdriveWon)
      }
      return {
        sessionId,
        tank: fromState.tankId,
        outcome: fromState.outcome,
        overdriveTaken: fromState.overdriveTaken,
        overdriveWon: fromState.overdriveWon,
        wager,
        payout,
      }
    }
    if (row.raw.randomness && row.raw.randomness !== '0x' + '00'.repeat(32)) {
      const v = BigInt(row.raw.randomness)
      const outcome = mapVrfToOutcome(v, tank)
      const payout = payoutForOutcome(wager, tank, outcome)
      return {
        sessionId,
        tank,
        outcome,
        overdriveTaken: false,
        overdriveWon: false,
        wager,
        payout,
        degraded: true,
      }
    }
    // Last resort: trust the settled payout (host is authoritative on amount).
    const payout = BigInt(row.payout ?? '0')
    const outcome = payout >= wager ? 2 : payout > 0n ? 1 : 0
    return {
      sessionId,
      tank,
      outcome,
      overdriveTaken: false,
      overdriveWon: false,
      wager,
      payout,
      degraded: true,
    }
  }

  /** Mandatory after the win animation, releases host-withheld credits. */
  async reveal(sessionId: string | undefined): Promise<void> {
    try {
      if (this.mode === 'host' && sessionId && this.conn?.hostApi) {
        await this.conn.hostApi.revealOutcome({ sessionId })
      }
    } finally {
      this.phase = 'idle'
      this.emit()
    }
  }
}
