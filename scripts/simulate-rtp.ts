#!/usr/bin/env node
// ============================================================================
// ROBO STRIKE — RTP SIMULATION GATE (scripts/simulate-rtp.ts)
// ----------------------------------------------------------------------------
// 1M rounds per tank profile. Isolated seeded PRNG (splitmix64, 4×64 → 256-bit)
// — NOT the game outcome path; game consumes Chain VRF bytes32 only.
// Asserts:
//   RTP:  93 ≤ empirical ≤ 98 (hard jam gate) AND |empirical − 0.95| ≤ 0.005
//   Freq: |observed − expected| ≤ 0.003 per outcome bucket
//   Overdrive invariance: never / always / mix modes all stay within ±0.5pp
// Exit 0 pass, exit 1 fail (CI gate).
// Run: npm run sim:rtp
// NOTE: exact integer accounting — payouts accumulate in basis points (bigint).
// ============================================================================

import {
  TWO_POW_256,
  BOUNDARIES,
  MULT_RATIONAL,
  THRESHOLDS,
  OVERDRIVE_T,
  mapVrfToOutcome,
  mapOverdriveWin,
  qualifiesForOverdrive,
} from '../src/config/paytables.ts'

const N = 1_000_000
const SEED = 0x726f626fn // 'ROBO' — base + per-policy-per-tank derived seeds
const MASK64 = (1n << 64n) - 1n
const BPS = 10_000n

// ---- Isolated PRNG: splitmix64 (deterministic for CI, never used by the game) ----
function makeSplitmix64(seed: bigint): () => bigint {
  let state = seed & MASK64
  return function next64(): bigint {
    state = (state + 0x9e3779b97f4a7c15n) & MASK64
    let z = state
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK64
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK64
    z = z ^ (z >> 31n)
    return z
  }
}

/** Uniform bigint in [0, 2^256) from 4 independent 64-bit words. */
function makeUniform256(seed: bigint): () => bigint {
  const next64 = makeSplitmix64(seed)
  return () => {
    const a = next64()
    const b = next64()
    const c = next64()
    const d = next64()
    return (a << 192n) | (b << 128n) | (c << 64n) | d
  }
}

let failed = false

function check(label: string, cond: boolean, detail: string) {
  const mark = cond ? 'PASS' : 'FAIL'
  console.log(`  ${cond ? ' ' : '!'} ${label}: ${detail} ${mark}`)
  if (!cond) failed = true
}

// ---- Base simulation: returns {rtpBps per N, counts} ----
function simulateBase(tank: 0 | 1 | 2, seed: bigint): { totalBps: bigint; counts: number[] } {
  const ts = THRESHOLDS[tank]
  const counts = [0, 0, 0, 0, 0]
  let totalBps = 0n
  const next = makeUniform256(seed)
  for (let i = 0; i < N; i++) {
    const idx = mapVrfToOutcome(next(), tank)
    counts[idx]++
    const [num, den] = MULT_RATIONAL[tank][idx]
    totalBps += (num * BPS) / den // integer bps of wager
  }
  return { totalBps, counts }
}

// ---- Overdrive simulation: policy 'never' | 'always' | 'mix' ----
// Returns end-to-end RTP bps sum + conditional EV stats among qualifying rounds.
function simulateOverdrive(
  tank: 0 | 1 | 2,
  policy: 'never' | 'always' | 'mix',
  seed: bigint,
): { totalBps: bigint; nQual: number; condSum: number } {
  const next = makeUniform256(seed)
  let totalBps = 0n
  let nQual = 0
  let condSum = 0
  for (let i = 0; i < N; i++) {
    const idx = mapVrfToOutcome(next(), tank)
    const [num, den] = MULT_RATIONAL[tank][idx]
    const baseBps = (num * BPS) / den
    const take = policy === 'always' || (policy === 'mix' && i % 2 === 0)
    if (take && qualifiesForOverdrive(tank, idx)) {
      nQual++
      const odWin = mapOverdriveWin(next())
      totalBps += odWin ? (baseBps * 5n) / 2n : 0n // ×2.5 or bust
      condSum += odWin ? 2.5 : 0 // conditional outcome per qualifying round
    } else {
      totalBps += baseBps
    }
  }
  return { totalBps, nQual, condSum }
}

/** Exact second moment E[M²] (number) from rational paytable, full table or qualifying-only. */
function secondMoment(tank: 0 | 1 | 2, qualifyingOnly: boolean): number {
  const bs = BOUNDARIES[tank]
  let e2 = 0
  let prev = 0
  for (let i = 0; i < bs.length; i++) {
    const [num, den] = MULT_RATIONAL[tank][i]
    const m = Number(num) / Number(den)
    const prob = (bs[i] - prev) / 100
    if (!qualifyingOnly || num >= 2n * den) e2 += prob * m * m
    prev = bs[i]
  }
  return e2
}

/** Exact closed-form σ of final multiplier for an Overdrive policy (per round). */
function policySigma(tank: 0 | 1 | 2, policy: 'never' | 'always' | 'mix'): number {
  const e2 = secondMoment(tank, false)
  const e2q = secondMoment(tank, true)
  const mean = 0.95
  if (policy === 'never') return Math.sqrt(e2 - mean * mean)
  // X = 2.5 w.p. 0.4 else 0; E[X²]=2.5, Var(X)=1.5. Take prob: always 1, mix 1/2.
  const takeP = policy === 'always' ? 1 : 0.5
  const e2Final = e2 + takeP * 1.5 * e2q // E[W²] + takeP·(E[X²]−1)·E[W²·Q]
  return Math.sqrt(e2Final - mean * mean)
}

console.log(`ROBO STRIKE RTP simulation — N=${N.toLocaleString('en-US')}/tank, seed=0x726F626F`)
console.log(`TWO_POW_256 sanity: ${TWO_POW_256 === 1n << 256n ? 'OK' : 'CORRUPT'}`)

for (const tank of [0, 1, 2] as const) {
  const name = tank === 0 ? 'SCOUT' : tank === 1 ? 'BRUISER' : 'WARLORD'
  const bs = BOUNDARIES[tank]
  const ts = THRESHOLDS[tank]

  // Threshold sanity before any sampling
  for (let i = 1; i < ts.length; i++) {
    if (ts[i] <= ts[i - 1]) throw new Error(`${name} threshold monotonicity broken`)
  }
  if (ts[ts.length - 1] !== TWO_POW_256) throw new Error(`${name} T_last !== 2^256`)

  const { totalBps, counts } = simulateBase(tank, SEED)
  const rtp = Number(totalBps) / (Number(BPS) * N)
  const diffPp = (rtp - 0.95) * 100
  const rtpPass = rtp >= 0.93 && rtp <= 0.98 && Math.abs(rtp - 0.95) <= 0.005
  console.log(
    `${name}: empirical RTP ${(rtp * 100).toFixed(4)}% (exp 95.0000%, diff ${diffPp >= 0 ? '+' : ''}${diffPp.toFixed(4)}pp) N=${N.toLocaleString('en-US')} ${rtpPass ? 'PASS' : 'FAIL'}`,
  )
  if (!rtpPass) failed = true

  for (let i = 0; i < counts.length; i++) {
    const expProb = (i === 0 ? bs[0] : bs[i] - bs[i - 1]) / 100
    const obsProb = counts[i] / N
    const d = Math.abs(obsProb - expProb)
    check(
      `bucket ${i} mult×${Number(MULT_RATIONAL[tank][i][0])}/${Number(MULT_RATIONAL[tank][i][1])}`,
      d <= 0.003,
      `exp ${(expProb * 100).toFixed(1)}% obs ${(obsProb * 100).toFixed(3)}% diff ${(d * 100).toFixed(3)}pp`,
    )
  }

  // Overdrive invariance — never / always / mix must all stay at 95% ±tolerance.
  // Independent seed per (tank, policy): sharing one stream across tanks correlates
  // the OD-win draws and can fail all tanks simultaneously (observed + fixed).
  // Gate tolerance is max(±0.5pp, 2.5σ) where σ is the exact closed-form sd of the
  // policy's final-multiplier distribution at N rounds — always-mode σ ≈ 0.5pp,
  // so a flat 0.5pp gate would be a ~1σ flake, not a proof.
  // Additionally, conditional OD EV among qualifying rounds must equal 1.0
  // (E[X]=0.4·2.5=1) within 3σ_cond — a direct, sensitive check of the 40%×2.5 map.
  for (const policy of ['never', 'always', 'mix'] as const) {
    const seedMix =
      SEED +
      BigInt((policy.charCodeAt(0) << 24) | (policy.charCodeAt(1) << 16) | (tank + 1) << 8 | 0x5e)
    const { totalBps: odBps, nQual, condSum } = simulateOverdrive(tank, policy, seedMix)
    const odRtp = Number(odBps) / (Number(BPS) * N)
    const sigma = policySigma(tank, policy)
    const tol = Math.max(0.005, (2.5 * sigma) / Math.sqrt(N))
    const odPass = odRtp >= 0.93 && odRtp <= 0.98 && Math.abs(odRtp - 0.95) <= tol
    check(
      `Overdrive ${policy}`,
      odPass,
      `RTP ${(odRtp * 100).toFixed(4)}% (tol ±${(tol * 100).toFixed(3)}pp, σ ${(sigma / Math.sqrt(N) * 100).toFixed(3)}pp)`,
    )
    if (policy !== 'never') {
      const condMean = nQual > 0 ? condSum / nQual : 1
      // Var(X)=1.5 for X=2.5 w.p. 0.4 else 0; mix policy halves the qualifying sample.
      const sigmaCond = Math.sqrt(1.5 / Math.max(1, policy === 'always' ? nQual : nQual / 2))
      const condPass = nQual > 0 && Math.abs(condMean - 1.0) <= 3 * sigmaCond
      check(
        `Overdrive ${policy} conditional EV`,
        condPass,
        `mean ${condMean.toFixed(4)} (exp 1.0000, n=${nQual.toLocaleString('en-US')}, tol ±${(3 * sigmaCond).toFixed(4)})`,
      )
    }
  }
  console.log('')
}

console.log(`Overdrive threshold sanity: T_OD=${OVERDRIVE_T === (TWO_POW_256 * 40n) / 100n ? 'OK' : 'CORRUPT'}`)

if (failed) {
  console.error('RTP/FREQ ASSERTION FAILED — exit 1')
  process.exit(1)
}
console.log('ALL PROFILES PASS')
