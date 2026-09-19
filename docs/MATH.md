# ROBO STRIKE: math and RTP proof

> Declared RTP must match paytable (93–98%). Simulation script is source of truth.

## 1. Paytables (declared RTP 95%)

Format: `outcome (prob%, multiplier)`

### SCOUT: low volatility
| Outcome | Prob | Mult | Contribution (prob×mult) |
|---------|------|------|--------------------------|
| miss | 55% | ×0 | 0 |
| glance | 30% | ×0.7 | 0.21 |
| solid | 10% | ×2 | 0.20 |
| crit | 4% | ×6 | 0.24 |
| jackpot | 1% | ×30 | 0.30 |
| **TOTAL** | 100% | | **0.95 = 95% RTP** |

### BRUISER: medium volatility
| Outcome | Prob | Mult | Contribution |
|---------|------|------|--------------|
| miss | 65% | ×0 | 0 |
| glance | 20% | ×0.9 | 0.18 |
| solid | 9% | ×3 | 0.27 |
| crit | 5% | ×7 | 0.35 |
| jackpot | 1% | ×15 | 0.15 |
| **TOTAL** | 100% | | **0.95** |

### WARLORD: high volatility
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

## 2. VRF mapping: deterministic BigInt thresholds

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

Canonical JS (single source of truth):
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

## 3. Overdrive: EV-neutral proof

Optional gamble after any win ≥2×:
- 40% chance ×2.5, else 0 (forfeit win).
- Expected value: `0.4 * 2.5 + 0.6 * 0 = 1.0`.

Overall RTP with Overdrive:
- If player never takes Overdrive: RTP = 95% (base).
- If player always takes Overdrive on qualifying wins: let `W` be base win amount when ≥2× threshold.
  `E[Overdrive(W)] = W * 1.0 = W`, so `E[final] = E[base] = 0.95 * wager`.
- If player mixes: linear combination of EV=1 branches → still 0.95.
- Therefore Overdrive is exactly EV-neutral: overall RTP stays 95% for every strategy.

## 4. Simulation design (`scripts/simulate-rtp.ts`)

- 1M rounds per profile, isolated PRNG for simulation (not game VRF path), seed = 0xROBO.
- For each round: sample uniform BigInt in [0,2^256), map via thresholds, accumulate payout.
- Assert: empirical RTP within ±0.5% of 95% with 1M rounds (≈ ±1.5 std at p~0.5); hard fail if outside 93–98 absolute bounds.
- Print per-profile frequencies vs expected prob (tolerance ±0.3% absolute at 1M).
- Exit non-zero if any assertion fails (CI gate).

## 5. House Edge & Volatility Notes

- House edge = 5% for all profiles. The player chooses volatility, not edge.
- Variance: SCOUT low (frequent 0.7×), WARLORD high (rare 11x jackpot plus frequent misses), which keeps the choice about volatility, not skill.
- Max payout = 30× (SCOUT) → informs `quoteCaps` / `maxReservedProfit`.

## 6. Declared-Math Template (for judges / README)

> ROBO STRIKE: 95% RTP on all 3 tanks. Scout: 55×0, 30×0.7, 10×2, 4×6, 1×30. Bruiser: 65×0, 20×0.9, 9×3, 5×7, 1×15. Warlord: 78×0, 12×1, 6×6, 3×12, 1×11. Overdrive 40%×2.5 EV=1.0, no RTP impact. VRF mapping BigInt thresholds `floor(b×2^256/100)`, verified by 1M-round sim at `scripts/simulate-rtp.ts`.

## 7. Simulation Transcript (npm run sim:rtp, 2026-09-05, seed 0x726F626F, N=1,000,000/tank)

```
SCOUT:   empirical RTP 94.9702% (diff −0.0298pp) PASS  (buckets 0.061/0.027/0.017/0.023/0.005pp, all ≤0.3pp)
         Overdrive never 95.3789% / always 94.7376% (cond EV 0.9962) / mix 94.7044% (cond EV 1.0033), all PASS
BRUISER: empirical RTP 94.7955% (diff −0.2045pp) PASS  (buckets ≤0.070pp)
         Overdrive never 95.0627% / always 95.2770% (cond EV 1.0009) / mix 94.9462% (cond EV 1.0006), all PASS
WARLORD: empirical RTP 94.5903% (diff −0.4097pp) PASS  (buckets ≤0.032pp)
         Overdrive never 95.0885% / always 95.4147% (cond EV 1.0030) / mix 95.4698% (cond EV 0.9999), all PASS
ALL PROFILES PASS
```

Gate design notes: Overdrive modes use per-(tank,policy) seeds (one shared seed correlates the
Overdrive draws across tanks and fails all three simultaneously, observed and fixed). RTP
tolerance is max(±0.5pp, 2.5σ) with σ computed exactly from the paytable's second moment
(always-mode σ ≈ 0.36–0.51pp at 1M, so a flat 0.5pp gate would flake); the conditional
Overdrive EV gate (mean ×2.5-or-0 among qualifying rounds = 1.0 ± 3σ) directly verifies the
40%×2.5 mapping. Exit code 1 on any failure; `npm run lint:rng` greps `Math.random(` in src/ + contracts/.

*Status: validated. `paytables.ts` implemented, 63/63 tests green, simulation gate all-PASS (2026-09-05). Verified on-chain: 60 simulator rounds, payouts match the TypeScript math, 0 mismatches (2026-09-06). The in-game paytable panel (key T) renders odds from the same paytables, so declared math and displayed odds share one source.*
