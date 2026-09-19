// ============================================================================
// ROBO STRIKE, CASINO BRAIN (single source of truth)
// ----------------------------------------------------------------------------
// Paytables + BigInt VRF threshold mapping. Shared by:
//   - the game presentation (src/game/*)
//   - the simulation gate (scripts/simulate-rtp.ts)
//   - the on-chain mirror (contracts/RoboStrike.sol, same literals)
//
// RULES (docs/MATH.md):
//   - Outcome path is BigInt-only: no floats, no Math.random, no Number(v).
//   - T_i = floor(b_i * 2^256 / 100); outcome = first i where v < T_i.
//   - T_last === 2^256 exactly (100 divides 100*2^256), full coverage [0, 2^256).
//   - Multipliers are RATIONALS num/den, payout = wager * num / den (integer).
//   - RTP per tank = sum(interval/100 * mult) = 19/20 exactly (95%).
// ============================================================================

export const TWO_POW_256 = 1n << 256n

export type TankId = 0 | 1 | 2

export const TANK_NAMES = ['SCOUT', 'BRUISER', 'WARLORD'] as const

/** Cumulative boundaries in percent, per tank (docs/MATH.md §1). */
export const BOUNDARIES: Record<TankId, readonly number[]> = {
  0: [55, 85, 95, 99, 100], // SCOUT
  1: [65, 85, 94, 99, 100], // BRUISER
  2: [78, 90, 96, 99, 100], // WARLORD
}

/** Multipliers as exact rationals num/den (no floats in payout math). */
export const MULT_RATIONAL: Record<TankId, readonly (readonly [bigint, bigint])[]> = {
  0: [[0n, 1n], [7n, 10n], [2n, 1n], [6n, 1n], [30n, 1n]], // SCOUT   ×0, ×0.7, ×2, ×6, ×30
  1: [[0n, 1n], [9n, 10n], [3n, 1n], [7n, 1n], [15n, 1n]], // BRUISER ×0, ×0.9, ×3, ×7, ×15
  2: [[0n, 1n], [1n, 1n], [6n, 1n], [12n, 1n], [11n, 1n]], // WARLORD ×0, ×1, ×6, ×12, ×11
}

/** Outcome labels, index-aligned with boundaries/multipliers. */
export const OUTCOME_NAMES = ['MISS', 'GLANCE', 'SOLID', 'CRIT', 'JACKPOT'] as const

/**
 * Precomputed BigInt thresholds. Derived once at module init from BOUNDARIES.
 * The Appendix A literals below are asserted against this derivation in tests
 * (tests/paytables.test.ts) so literals and formula can never drift.
 */
const derive = (boundaries: readonly number[]): bigint[] =>
  boundaries.map((b) => (TWO_POW_256 * BigInt(b)) / 100n)

export const THRESHOLDS: Record<TankId, bigint[]> = {
  0: derive(BOUNDARIES[0]),
  1: derive(BOUNDARIES[1]),
  2: derive(BOUNDARIES[2]),
}

/** Solidity mirror literals (asserted equal in tests) for audit diff. */
export const APPENDIX_A_THRESHOLDS: Record<TankId, bigint[]> = {
  0: [
    63685649080523907482964041754778349319298491566102310221701671204352221301964n,
    98423275851718766110035337257384721675279486965794479433538946406726160193945n,
    110002484775450385652392435758253512460606485432358535837484704807517473157939n,
    114634168344943033469335275158601028774737284818984158399063008167833998343536n,
    115792089237316195423570985008687907853269984665640564039457584007913129639936n,
  ],
  1: [
    75264858004255527025321140255647140104625490032666366625647429605143534265958n,
    98423275851718766110035337257384721675279486965794479433538946406726160193945n,
    108844563883077223698156725908166633382073785585702130197090128967438341861539n,
    114634168344943033469335275158601028774737284818984158399063008167833998343536n,
    115792089237316195423570985008687907853269984665640564039457584007913129639936n,
  ],
  2: [
    90317829605106632430385368306776568125550588039199639950776915526172241119150n,
    104212880313584575881213886507819117067942986199076507635511825607121816675942n,
    111160405667823547606628145608340391539139185279014941477879280647596604454338n,
    114634168344943033469335275158601028774737284818984158399063008167833998343536n,
    115792089237316195423570985008687907853269984665640564039457584007913129639936n,
  ],
}

/** Overdrive: 40% → ×2.5, else 0. T_OD = floor(40 * 2^256 / 100). EV = 0.4·2.5 = 1 exactly. */
export const OVERDRIVE_T = (TWO_POW_256 * 40n) / 100n
export const OVERDRIVE_MULT: readonly [bigint, bigint] = [5n, 2n] // ×2.5
/** Minimum base multiplier that qualifies for Overdrive (wins ≥2×). */
export const OVERDRIVE_MIN_MULT_NUM = 2n

/**
 * Map a raw VRF word to a paytable bucket index.
 * Pure BigInt comparison, linear scan over 5 thresholds (audit-friendly).
 * T_last === 2^256 > any uint256 v, so the fallback is unreachable (defensive).
 */
export function mapVrfToOutcome(v: bigint, tank: TankId): number {
  const ts = THRESHOLDS[tank]
  for (let i = 0; i < ts.length; i++) if (v < ts[i]) return i
  return ts.length - 1
}

/** Overdrive sub-roll: win the 2.5× gamble iff v < T_OD (40%). */
export function mapOverdriveWin(v: bigint): boolean {
  return v < OVERDRIVE_T
}

/**
 * Payout in wager base units: floor(wager * num / den). Integer-only.
 * Outcome 0 (MISS) → 0. Overdrive win multiplies the *base win*, not the wager.
 */
export function payoutForOutcome(wager: bigint, tank: TankId, outcome: number): bigint {
  const [num, den] = MULT_RATIONAL[tank][outcome]
  return (wager * num) / den
}

/** Overdrive payout: floor(baseWin * 5 / 2) when won, else 0. */
export function payoutAfterOverdrive(baseWin: bigint, odWin: boolean): bigint {
  if (!odWin) return 0n
  const [num, den] = OVERDRIVE_MULT
  return (baseWin * num) / den
}

/** Does this base outcome qualify for Overdrive? (multiplier ≥ 2×) */
export function qualifiesForOverdrive(tank: TankId, outcome: number): boolean {
  const [num, den] = MULT_RATIONAL[tank][outcome]
  return num >= OVERDRIVE_MIN_MULT_NUM * den
}

// ---- ABI helpers for gameData/gameState (no viem dep) ----
// gameData: 32-byte ABI word of a single uint8, low bits tankId,
// bit 0x80 = player pre-commits to Overdrive on qualifying wins (matches
// contracts/RoboStrike.sol `_decodeTank`, byte 31 of the word).

/** encodeAbiParameters([{type:'uint8'}],[raw]) equivalent, 32-byte word. */
export function encodeTankId(tank: TankId, wantsOverdrive = false): `0x${string}` {
  if (tank < 0 || tank > 2) throw new Error(`tankId out of range: ${tank}`)
  const raw = wantsOverdrive ? tank | 0x80 : tank
  const hex = raw.toString(16).padStart(2, '0')
  return `0x${'00'.repeat(31)}${hex}` as `0x${string}`
}

/** Decode the 32-byte ABI word back to tank + overdrive commit. */
export function decodeTankId(gameData: string): { tank: TankId; wantsOverdrive: boolean } {
  const body = gameData.startsWith('0x') ? gameData.slice(2) : gameData
  if (body.length !== 64) throw new Error(`gameData must be 32-byte word, got ${body.length} nibbles`)
  for (const ch of body.slice(0, 62)) if (ch !== '0') throw new Error('gameData has dirty padding')
  const raw = parseInt(body.slice(62, 64), 16)
  const tank = raw & 0x7f
  if (tank > 2) throw new Error(`tankId out of range: ${tank}`)
  return { tank: tank as TankId, wantsOverdrive: (raw & 0x80) !== 0 }
}

/**
 * gameState layout (mirrors contracts/RoboStrike.sol abi.encode):
 *   word0: uint8  tankId
 *   word1: uint8  outcome (0..4)
 *   word2: bool   overdriveTaken
 *   word3: bool   overdriveWon
 *   word4: bytes32 randomness (0 => not delivered yet)
 */
export interface RoboStrikeGameState {
  tankId: TankId
  outcome: number
  overdriveTaken: boolean
  overdriveWon: boolean
  randomness: bigint
}

export function encodeGameState(s: RoboStrikeGameState): `0x${string}` {
  const word = (n: bigint) => n.toString(16).padStart(64, '0')
  return (
    '0x' +
    word(BigInt(s.tankId)) +
    word(BigInt(s.outcome)) +
    word(s.overdriveTaken ? 1n : 0n) +
    word(s.overdriveWon ? 1n : 0n) +
    word(s.randomness)
  ) as `0x${string}`
}

export function decodeGameState(hex: string): RoboStrikeGameState | null {
  const body = hex.startsWith('0x') ? hex.slice(2) : hex
  if (body.length < 64 * 5) return null
  const wordAt = (i: number) => BigInt('0x' + body.slice(i * 64, (i + 1) * 64))
  const randomness = wordAt(4)
  if (randomness === 0n) return null // VRF not delivered yet, keep waiting
  const tankId = Number(wordAt(0))
  return {
    tankId: (tankId === 1 ? 1 : tankId === 2 ? 2 : 0) as TankId,
    outcome: Number(wordAt(1)),
    overdriveTaken: wordAt(2) === 1n,
    overdriveWon: wordAt(3) === 1n,
    randomness,
  }
}
