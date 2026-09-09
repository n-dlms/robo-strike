import { describe, it, expect } from 'vitest'
import {
  TWO_POW_256,
  BOUNDARIES,
  MULT_RATIONAL,
  THRESHOLDS,
  APPENDIX_A_THRESHOLDS,
  OVERDRIVE_T,
  OUTCOME_NAMES,
  TANK_NAMES,
  mapVrfToOutcome,
  mapOverdriveWin,
  payoutForOutcome,
  payoutAfterOverdrive,
  qualifiesForOverdrive,
  encodeTankId,
  decodeTankId,
  encodeGameState,
  decodeGameState,
} from '../src/config/paytables'

const TANKS = [0, 1, 2] as const

describe('thresholds', () => {
  it('TWO_POW_256 is exactly 1<<256', () => {
    expect(TWO_POW_256).toBe(
      115792089237316195423570985008687907853269984665640564039457584007913129639936n,
    )
  })

  it.each(TANKS)('tank %i: boundaries strictly increasing, last === 100', (tank) => {
    const bs = BOUNDARIES[tank]
    expect(bs[bs.length - 1]).toBe(100)
    for (let i = 1; i < bs.length; i++) expect(bs[i]).toBeGreaterThan(bs[i - 1])
    expect(bs.length).toBe(5)
  })

  it.each(TANKS)('tank %i: thresholds strictly increasing, T_last === 2^256', (tank) => {
    const ts = THRESHOLDS[tank]
    for (let i = 1; i < ts.length; i++) expect(ts[i]).toBeGreaterThan(ts[i - 1])
    expect(ts[ts.length - 1]).toBe(TWO_POW_256)
  })

  it.each(TANKS)('tank %i: derived thresholds match Appendix A literals exactly', (tank) => {
    expect(THRESHOLDS[tank]).toEqual(APPENDIX_A_THRESHOLDS[tank])
  })

  it('Overdrive threshold matches the documented literal', () => {
    expect(OVERDRIVE_T).toBe(
      46316835694926478169428394003475163141307993866256225615783033603165251855974n,
    )
  })
})

describe('RTP — exact rational proof (no floats)', () => {
  // (a) The declared paytable (boundary fractions, exact rationals) sums to
  //     exactly 19/20: Σ ((b_i - b_{i-1})/100) * (num_i/den_i) === 19/20.
  // (b) The threshold partition (floor(b·2^256/100)) has RTP within 1e-70 of
  //     19/20 — the only error is the ≤1-uint256 floor per threshold (~1e-78),
  //     which is the documented, cryptographically-negligible bias.
  it.each(TANKS)('tank %i (%s): declared paytable Σ interval×mult === 19/20 exactly', (tank) => {
    const bs = BOUNDARIES[tank]
    const D = MULT_RATIONAL[tank].reduce((acc, [, den]) => (acc * den) / gcd(acc, den), 1n)
    let sum = 0n
    let prev = 0
    for (let i = 0; i < bs.length; i++) {
      const [num, den] = MULT_RATIONAL[tank][i]
      sum += BigInt(bs[i] - prev) * num * (D / den)
      prev = bs[i]
    }
    // sum / (100 * D) === 19/20  →  20 * sum === 19 * 100 * D
    expect(20n * sum).toBe(19n * 100n * D)
  })

  it.each(TANKS)('tank %i: threshold-partition RTP within 1e-70 of 19/20', (tank) => {
    const ts = THRESHOLDS[tank]
    const D = MULT_RATIONAL[tank].reduce((acc, [, den]) => (acc * den) / gcd(acc, den), 1n)
    let sum = 0n
    let prev = 0n
    for (let i = 0; i < ts.length; i++) {
      const [num, den] = MULT_RATIONAL[tank][i]
      sum += (ts[i] - prev) * num * (D / den)
      prev = ts[i]
    }
    // |sum/(2^256·D) − 19/20| = |20·sum − 19·2^256·D| / (20·2^256·D) < 1e-70
    const diff = 20n * sum > 19n * TWO_POW_256 * D ? 20n * sum - 19n * TWO_POW_256 * D : 19n * TWO_POW_256 * D - 20n * sum
    expect(diff < (TWO_POW_256 * D) / 10n ** 70n).toBe(true)
  })

  it('every tank has 5 outcomes with labels', () => {
    for (const t of TANKS) expect(MULT_RATIONAL[t].length).toBe(OUTCOME_NAMES.length)
    expect(TANK_NAMES.length).toBe(3)
  })
})

function gcd(a: bigint, b: bigint): bigint {
  while (b) {
    const t = a % b
    a = b
    b = t
  }
  return a
}

describe('mapVrfToOutcome', () => {
  it.each(TANKS)('tank %i: v=0 → bucket 0 (miss)', (tank) => {
    expect(mapVrfToOutcome(0n, tank)).toBe(0)
  })

  it.each(TANKS)('tank %i: v=2^256-1 → last bucket (jackpot)', (tank) => {
    expect(mapVrfToOutcome(TWO_POW_256 - 1n, tank)).toBe(4)
  })

  it.each(TANKS)('tank %i: straddles every threshold boundary', (tank) => {
    const ts = THRESHOLDS[tank]
    for (let i = 0; i < ts.length; i++) {
      expect(mapVrfToOutcome(ts[i] - 1n, tank)).toBe(i)
      if (i + 1 < ts.length) expect(mapVrfToOutcome(ts[i], tank)).toBe(i + 1)
    }
  })

  it('is deterministic for the same input', () => {
    const v = 1234567890123456789012345678901234567890n
    const a = mapVrfToOutcome(v, 1)
    const b = mapVrfToOutcome(v, 1)
    expect(a).toBe(b)
  })
})

describe('payout math (integer only)', () => {
  it('SCOUT glance is 0.7× exactly: 10 → 7', () => {
    expect(payoutForOutcome(10n, 0, 1)).toBe(7n)
  })
  it('SCOUT jackpot is 30× exactly', () => {
    expect(payoutForOutcome(123n, 0, 4)).toBe(3690n)
  })
  it('BRUISER glance is 0.9×: 10 → 9', () => {
    expect(payoutForOutcome(10n, 1, 1)).toBe(9n)
  })
  it('floor rounding on odd wagers: 1 × 0.9 → 0', () => {
    expect(payoutForOutcome(1n, 1, 1)).toBe(0n)
  })
  it('miss pays 0', () => {
    expect(payoutForOutcome(1000n, 2, 0)).toBe(0n)
  })
  it('Overdrive ×2.5 exactly: 2 → 5, floor on odd', () => {
    expect(payoutAfterOverdrive(2n, true)).toBe(5n)
    expect(payoutAfterOverdrive(3n, true)).toBe(7n) // floor(7.5)
    expect(payoutAfterOverdrive(3n, false)).toBe(0n)
  })
  it('Overdrive qualification = multiplier ≥ 2×', () => {
    expect(qualifiesForOverdrive(0, 1)).toBe(false) // 0.7× glance
    expect(qualifiesForOverdrive(1, 1)).toBe(false) // 0.9× glance
    expect(qualifiesForOverdrive(2, 1)).toBe(false) // 1× glance
    expect(qualifiesForOverdrive(0, 2)).toBe(true) // 2× solid
    expect(qualifiesForOverdrive(2, 2)).toBe(true) // 6× solid
  })
  it('mapOverdriveWin is 40% threshold', () => {
    expect(mapOverdriveWin(0n)).toBe(true)
    expect(mapOverdriveWin(OVERDRIVE_T - 1n)).toBe(true)
    expect(mapOverdriveWin(OVERDRIVE_T)).toBe(false)
    expect(mapOverdriveWin(TWO_POW_256 - 1n)).toBe(false)
  })
})

describe('ABI encode/decode', () => {
  it('encodeTankId produces 32-byte word, round-trips', () => {
    for (const t of TANKS) {
      const hex = encodeTankId(t)
      expect(hex).toMatch(/^0x[0-9a-f]{64}$/)
      expect(decodeTankId(hex)).toEqual({ tank: t, wantsOverdrive: false })
    }
  })

  it('overdrive commit bit round-trips and never leaks into tankId', () => {
    for (const t of TANKS) {
      const hex = encodeTankId(t, true)
      expect(BigInt(hex)).toBe(BigInt(t) | 0x80n)
      expect(decodeTankId(hex)).toEqual({ tank: t, wantsOverdrive: true })
    }
  })

  it('rejects invalid tankIds and dirty words', () => {
    expect(() => encodeTankId(3 as never)).toThrow()
    expect(() => decodeTankId('0x' + '00'.repeat(31) + 'ff')).toThrow()
    expect(() => decodeTankId('0x1234')).toThrow()
  })

  it('gameState round-trips; zero randomness decodes to null (not delivered)', () => {
    const s = {
      tankId: 1 as const,
      outcome: 3,
      overdriveTaken: true,
      overdriveWon: true,
      randomness: 0xdeadbeefn,
    }
    const hex = encodeGameState(s)
    expect(hex).toMatch(/^0x[0-9a-f]{320}$/)
    expect(decodeGameState(hex)).toEqual(s)
    expect(decodeGameState(encodeGameState({ ...s, randomness: 0n }))).toBeNull()
  })
})

describe('Solidity mirror', () => {
  it('contracts/RoboStrike.sol threshold literals === TS THRESHOLDS + T_OD', async () => {
    const { readFileSync } = await import('node:fs')
    const sol = readFileSync(new URL('../contracts/RoboStrike.sol', import.meta.url), 'utf8')
    // Pull every `..._T<n> =\n <literal>` and the OVERDRIVE_T literal out of the contract.
    const grab = (name: string): bigint => {
      const m = sol.match(new RegExp(`${name}\\s*=\\s*\\n?\\s*(\\d+)`))
      if (!m) throw new Error(`constant ${name} not found in contract`)
      return BigInt(m[1])
    }
    for (const t of TANKS) {
      const name = t === 0 ? 'SCOUT' : t === 1 ? 'BRUISER' : 'WARLORD'
      const ts = THRESHOLDS[t]
      for (let i = 0; i < 4; i++) expect(grab(`${name}_T${i}`)).toBe(ts[i])
      // T3 is the last sub-sentinel; the JS T4 sentinel 2^256 is the inclusive
      // top bucket in Solidity — no literal exists for it (2^256 overflows uint256).
    }
    expect(grab('OVERDRIVE_T')).toBe(OVERDRIVE_T)
  })
})
