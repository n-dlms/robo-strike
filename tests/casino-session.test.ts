import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CasinoSession } from '../src/game/sdk/CasinoSession'
import { decodeGameState, encodeGameState, mapVrfToOutcome, payoutForOutcome, qualifiesForOverdrive, payoutAfterOverdrive } from '../src/config/paytables'

// Standalone detection reads window.parent === window.self — make both undefined
// so the try/catch falls through as framed=false... actually ReferenceError is
// caught and returns true (host). Stub a window object with identical parent/self
// so inHostIframe() returns false → standalone mode deterministically.
beforeEach(() => {
  ;(globalThis as any).window = { parent: null, self: null }
  ;(globalThis as any).window.parent = (globalThis as any).window
  ;(globalThis as any).window.self = (globalThis as any).window
  ;(globalThis as any).document = { referrer: '' }
  vi.stubGlobal('crypto', globalThis.crypto) // Node 22 webcrypto
})

describe('CasinoSession — standalone round loop', () => {
  it('detects standalone mode outside a host iframe', async () => {
    const s = new CasinoSession()
    await s.init()
    expect(s.mode).toBe('standalone')
    expect(s.canBet()).toBe(true)
  })

  it('plays 200 rounds: outcome validity, balance conservation, phase returns to idle', async () => {
    const s = new CasinoSession()
    await s.init()
    const start = s.balance
    const wager = 10n ** 17n // 0.1 tokens
    let misses = 0
    let wins = 0
    let totalPayout = 0n

    for (let i = 0; i < 200; i++) {
      const tank = (i % 3) as 0 | 1 | 2
      const res = await s.placeRound(wager, tank, false)
      expect(res.wager).toBe(wager)
      expect(res.outcome).toBeGreaterThanOrEqual(0)
      expect(res.outcome).toBeLessThanOrEqual(4)
      if (res.outcome === 0) misses++
      if (res.outcome >= 1) wins++

      // payout must equal the paytable math for the reported outcome
      const expected = payoutForOutcome(wager, tank, res.outcome)
      expect(res.payout).toBe(expected)
      totalPayout += res.payout

      await s.reveal(res.sessionId)
      expect(s.phase).toBe('idle')
    }

    // balance moved exactly by Σpayout − Σwager
    expect(s.balance).toBe(start - wager * 200n + totalPayout)
    expect(misses + wins).toBe(200)
  })

  it('overdrive commits round with independent roll and exact ×2.5 math', async () => {
    const s = new CasinoSession()
    await s.init()
    const wager = 10n ** 18n
    for (let i = 0; i < 100; i++) {
      const res = await s.placeRound(wager, 0, true)
      if (res.overdriveTaken) {
        // qualifying outcome (≥2×)
        expect(qualifiesForOverdrive(0, res.outcome)).toBe(true)
        const base = payoutForOutcome(wager, 0, res.outcome)
        expect(res.payout).toBe(res.overdriveWon ? payoutAfterOverdrive(base, true) : 0n)
        if (res.overdriveWon) expect(res.payout).toBe((base * 5n) / 2n)
      } else {
        expect(res.payout).toBe(payoutForOutcome(wager, 0, res.outcome))
      }
      await s.reveal(res.sessionId)
    }
  })

  it('gameState decode path mirrors the contract layout (randomness gate)', () => {
    const st = decodeGameState(
      encodeGameState({ tankId: 2, outcome: 4, overdriveTaken: true, overdriveWon: false, randomness: 42n }),
    )
    expect(st).toEqual({
      tankId: 2,
      outcome: 4,
      overdriveTaken: true,
      overdriveWon: false,
      randomness: 42n,
    })
    // host sends pre-VRF state → null → UI keeps waiting
    expect(decodeGameState(encodeGameState({ tankId: 0, outcome: 0, overdriveTaken: false, overdriveWon: false, randomness: 0n }))).toBeNull()
  })

  it('mapper is distribution-consistent with thresholds on crypto words', () => {
    // quick smoke: 10k crypto words, jackpot freq within loose bound (0.5%–2%)
    let jackpots = 0
    const N = 10000
    for (let i = 0; i < N; i++) {
      const buf = new Uint8Array(32)
      crypto.getRandomValues(buf)
      let v = 0n
      for (const b of buf) v = (v << 8n) | BigInt(b)
      if (mapVrfToOutcome(v, 1) === 4) jackpots++
    }
    expect(jackpots / N).toBeGreaterThan(0.005)
    expect(jackpots / N).toBeLessThan(0.02)
  })
})
