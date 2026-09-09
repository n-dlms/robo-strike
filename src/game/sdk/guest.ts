// ============================================================================
// Guest bridge — Penpal connection to the casino host (vendored pattern from
// casino-sdk src/guest.ts, Penpal 7.x). Runs only when the game is embedded in
// the host iframe; standalone (window.parent === window.self) is a first-class
// mode and never touches this module.
// ============================================================================

import { WindowMessenger, connect, type Connection } from 'penpal'
import type { GuestApiV1, HostApiV1, HostSnapshotV1 } from './types'

/** document.referrer origin when parseable (prod), else '*' (dev fallback) — verbatim SDK behavior. */
const getAllowedParentOrigins = (): string[] => {
  try {
    if (document.referrer) return [new URL(document.referrer).origin]
  } catch {
    /* fall through */
  }
  return ['*']
}

export const connectGameToHost = (methods: GuestApiV1): Connection<HostApiV1> =>
  connect<HostApiV1>({
    messenger: new WindowMessenger({
      remoteWindow: window.parent,
      allowedOrigins: getAllowedParentOrigins(),
    }),
    methods,
  })

export const inHostIframe = (): boolean => {
  try {
    return window.parent !== window.self
  } catch {
    return true // cross-origin access threw — we are framed
  }
}

export interface HostConnection {
  hostApi: HostApiV1 | undefined
  snapshot: HostSnapshotV1 | null
  walletReady: boolean
  destroy(): void
  /** Resolves once the host handshake completes (or rejects on timeout). */
  ready(timeoutMs?: number): Promise<HostApiV1>
}

/**
 * Connect and keep the latest snapshot. The game reads `connection.snapshot`
 * reactively ( polled in scene update or via onChange callback ) and calls
 * hostApi methods for the bet lifecycle. Must call destroy() on scene shutdown
 * (HMR/teardown leak guard per GETTING_STARTED chaos checklist).
 */
export const createHostConnection = (onChange?: (s: HostSnapshotV1 | null) => void): HostConnection => {
  const state: HostConnection = {
    hostApi: undefined,
    snapshot: null,
    walletReady: false,
    destroy: () => connection.destroy(),
    ready: async (timeoutMs = 5000) => {
      const api = await connection.promise
      // penpal returns a promise of methods; race a timeout so the scene can
      // fall back to standalone UI if the host never handshakes.
      if (timeoutMs > 0) {
        return await Promise.race([
          Promise.resolve(api as HostApiV1),
          new Promise<HostApiV1>((_, rej) => setTimeout(() => rej(new Error('host handshake timeout')), timeoutMs)),
        ])
      }
      return api as HostApiV1
    },
  }

  const connection = connectGameToHost({
    setState: async (snapshot) => {
      state.snapshot = snapshot
      state.walletReady = snapshot?.wallet.status === 'ready'
      onChange?.(snapshot)
    },
  })

  // penpal resolves with the host's API methods — store them for placeRound/reveal
  connection.promise
    .then((api) => {
      state.hostApi = api as HostApiV1
    })
    .catch(() => {
      /* handshake failed — CasinoSession falls back to standalone */
    })

  return state
}

// ---- Bet clamping (port of casino-sdk src/bet-limits.ts computeMaxWager) ----

/**
 * Worst-case reserved profit for a wager given the tank's max multiplier.
 * RoboStrike quoteCaps: maxReservedProfit = wager × (maxMult − 1).
 */
export const maxReservedProfitFor = (wager: bigint, maxMultiplierX: number): bigint =>
  (wager * BigInt(Math.round(maxMultiplierX * 100)) - wager * 100n) / 100n

/**
 * Port of computeMaxWager: riskBoundWager = maxAllowedReservedProfit × 10000 /
 * (multiplierBps − 10000), clamped by maxBetAmount when the host sets one.
 * Returns undefined when the host publishes no limits (no ceiling).
 */
export const computeMaxWager = (
  snapshot: HostSnapshotV1 | null,
  maxMultiplierX: number,
): bigint | undefined => {
  if (!snapshot?.casino) return undefined
  const { maxAllowedReservedProfit, maxBetAmount } = snapshot.casino
  const multiplierBps = BigInt(Math.ceil(maxMultiplierX * 10000))
  if (multiplierBps <= 10000n) return undefined
  if (maxAllowedReservedProfit === undefined) {
    // No liquidity ceiling published; still respect maxBetAmount if present.
    return maxBetAmount !== undefined ? BigInt(maxBetAmount) : undefined
  }
  const riskBound = (BigInt(maxAllowedReservedProfit) * 10000n) / (multiplierBps - 10000n)
  if (maxBetAmount !== undefined) {
    const cap = BigInt(maxBetAmount)
    return riskBound < cap ? riskBound : cap
  }
  return riskBound
}

/** parseUnits(18) for wager strings — minimal, no viem dependency. */
export const parseUnits = (human: string, decimals = 18): bigint => {
  const neg = human.trim().startsWith('-')
  const clean = human.trim().replace('-', '')
  const [int, fracRaw = ''] = clean.split('.')
  const frac = (fracRaw + '0'.repeat(decimals)).slice(0, decimals)
  if (!/^\d*$/.test(int) || !/^\d*$/.test(frac)) throw new Error(`invalid wager: ${human}`)
  const v = BigInt((int || '0') + frac)
  return neg ? -v : v
}

/** formatUnits(18) for balance display. */
export const formatUnits = (base: bigint, decimals = 18): string => {
  const neg = base < 0n
  const abs = neg ? -base : base
  const s = abs.toString().padStart(decimals + 1, '0')
  const int = s.slice(0, s.length - decimals)
  const frac = s.slice(s.length - decimals).replace(/0+$/, '')
  return (neg ? '-' : '') + int + (frac ? '.' + frac : '')
}
