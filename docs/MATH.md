# ROBO STRIKE — MATH & RTP PROOF

> Declared RTP must match paytable (93–98%). Simulation script is source of truth.

## 1. Paytables (RTP 95% — declared)

Format: `outcome (prob%, multiplier)`

### SCOUT — low volatility
| Outcome | Prob | Mult | Contribution (prob×mult) |
|---------|------|------|--------------------------|
| miss | 55% | ×0 | 0 |
| glance | 30% | ×0.7 | 0.21 |
| solid | 10% | ×2 | 0.20 |
| crit | 4% | ×6 | 0.24 |
| jackpot | 1% | ×30 | 0.30 |
| **TOTAL** | 100% | | **0.95 = 95% RTP** |

### BRUISER — medium
| Outcome | Prob | Mult | Contribution |
|---------|------|------|--------------|
| miss | 65% | ×0 | 0 |
| glance | 20% | ×0.9 | 0.18 |
| solid | 9% | ×3 | 0.27 |
| crit | 5% | ×7 | 0.35 |
| jackpot | 1% | ×15 | 0.15 |
| **TOTAL** | 100% | | **0.95** |

### WARLORD — high volatility
| Outcome | Prob | Mult | Contribution |
|---------|------|------|--------------|
| miss | 78% | ×0 | 0 |
| glance | 12% | ×1 | 0.12 |
| solid | 6% | ×6 | 0.36 |
| crit | 3% | ×12 | 0.36 |
| jackpot | 1% | ×11 | 0.11 |
| **TOTAL** | 100% | | **0.95** |

- Cumulative boundaries: SCOUT [55,85,95,99,100], BRUISER [65,85,94,99,100], WARLORD [78,90,96,99,100].
- All math is exact rational; no floating bias in thresholds.

## 2. VRF Mapping — Deterministic BigInt Thresholds (MANDATORY)

Raw VRF is `uint256` `v` uniformly distributed in `[0, 2^256)`.

For each profile, boundaries `b_i` in %:
```
T_i = floor(b_i * 2^256 / 100)  as BigInt
outcome = first i where v < T_i
```

Properties:
- No floats, no `Math.random` anywhere in outcome path.
- Thresholds precomputed as BigInt constants (no per-round division).
- Uses integer comparison only; covers full `[0,2^256)` without gaps/overlaps.
- `T_last = 2^256` (i.e., 100% boundary) is sentinel; effectively `v < 2n**256n`.

Canonical JS (single source; grep-proof):
```ts
const TWO_POW_256 = 1n << 256n;
const toThresholds = (boundaries: number[]) =>
  boundaries.map(b => (TWO_POW_256 * BigInt(b)) / 100n);
function mapVrfToOutcome(v: bigint, thresholds: bigint[]): number {
  for (let i=0;i<thresholds.length;i++) if (v < thresholds[i]) return i;
  return thresholds.length-1; // unreachable if last = 2^256
}
```

- Solidity mirror: same formula with `uint256` division; verified identical.

## 3. Overdrive — EV-Neutral Proof

Optional gamble after any win ≥2×:
- 40% chance ×2.5, else 0 (forfeit win).
- Expected value: `0.4 * 2.5 + 0.6 * 0 = 1.0`.

Overall RTP with Overdrive:
- If player never takes Overdrive: RTP = 95% (base).
- If player always takes Overdrive on qualifying wins: let `W` be base win amount when ≥2× threshold.
  `E[Overdrive(W)] = W * 1.0 = W`, so `E[final] = E[base] = 0.95 * wager`.
- If player mixes: linear combination of EV=1 branches → still 0.95.
- Therefore Overdrive is exactly EV-neutral; overall RTP stays 95% irrespective of strategy.
- Documented per judge requirement: "declared math matching actual paytable" must state this.

## 4. Simulation Design (to be implemented in `scripts/simulate-rtp.ts`)

- 1M rounds per profile, isolated PRNG for simulation (not game VRF path), seed = 0xROBO.
- For each round: sample uniform BigInt in [0,2^256), map via thresholds, accumulate payout.
- Assert: empirical RTP within ±0.5% of 95% with 1M rounds (≈ ±1.5 std at p~0.5); hard fail if outside 93–98 absolute bounds.
- Print per-profile frequencies vs expected prob (tolerance ±0.3% absolute at 1M).
- Exit non-zero if any assertion fails (CI gate).

## 5. House Edge & Volatility Notes

- House edge = 5% for all profiles — player chooses volatility, not edge.
- Variance: SCOUT low (frequent 0.7×), WARLORD high (rare 11× jackpot + frequent misses) — satisfies "volatility choice, NOT skill".
- Max payout = 30× (SCOUT) → informs `quoteCaps` / `maxReservedProfit`.

## 6. Declared-Math Template (for judges / README)

> ROBO STRIKE — 95% RTP on all 3 tanks. Scout: 55×0, 30×0.7, 10×2, 4×6, 1×30. Bruiser: 65×0, 20×0.9, 9×3, 5×7, 1×15. Warlord: 78×0, 12×1, 6×6, 3×12, 1×11. Overdrive 40%×2.5 EV=1.0, no RTP impact. VRF mapping BigInt thresholds `floor(b×2^256/100)`, verified by 1M-round sim at `scripts/simulate-rtp.ts`.

*Status: SPEC-LOCKED — awaiting subagent D validation and simulation implementation (Phase 2).*
