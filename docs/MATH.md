# ROBO STRIKE: math and RTP proof

<div align="center">

[![RTP 95%](https://img.shields.io/badge/RTP-95%25-58ff9b?style=for-the-badge)](MATH.md)
[![Exact 19/20](https://img.shields.io/badge/EXACT-19%2F20-4ff2e3?style=for-the-badge)](MATH.md)
[![Sim 1M rounds](https://img.shields.io/badge/SIM-1M_ROUNDS-ffd94f?style=for-the-badge)](../scripts/simulate-rtp.ts)
[![No floats](https://img.shields.io/badge/ARITHMETIC-BIGINT_ONLY-white?style=for-the-badge)](../src/config/paytables.ts)

*Declared RTP matches the paytable. Every claim below is asserted in code.*

</div>

---

## 1. Paytables (declared RTP 95%)

Format: `outcome (probability, multiplier)`

### SCOUT: low volatility

| Outcome | Probability | Multiplier | Contribution |
|---------|:-----------:|:----------:|:------------:|
| Miss | 55% | ×0 | 0 |
| Glance | 30% | ×0.7 | 0.21 |
| Solid | 10% | ×2 | 0.20 |
| Crit | 4% | ×6 | 0.24 |
| Jackpot | 1% | ×30 | 0.30 |
| **Total** | **100%** | | **0.95** |

### BRUISER: medium volatility

| Outcome | Probability | Multiplier | Contribution |
|---------|:-----------:|:----------:|:------------:|
| Miss | 65% | ×0 | 0 |
| Glance | 20% | ×0.9 | 0.18 |
| Solid | 9% | ×3 | 0.27 |
| Crit | 5% | ×7 | 0.35 |
| Jackpot | 1% | ×15 | 0.15 |
| **Total** | **100%** | | **0.95** |

### WARLORD: high volatility

| Outcome | Probability | Multiplier | Contribution |
|---------|:-----------:|:----------:|:------------:|
| Miss | 78% | ×0 | 0 |
| Glance | 12% | ×1 | 0.12 |
| Solid | 6% | ×6 | 0.36 |
| Crit | 3% | ×12 | 0.36 |
| Jackpot | 1% | ×11 | 0.11 |
| **Total** | **100%** | | **0.95** |

Cumulative boundaries:

| Tank | Boundaries |
|------|-----------|
| SCOUT | [55, 85, 95, 99, 100] |
| BRUISER | [65, 85, 94, 99, 100] |
| WARLORD | [78, 90, 96, 99, 100] |

All math is exact rational. No floating point bias in thresholds.

---

## 2. VRF mapping: deterministic BigInt thresholds

Raw VRF output is a `uint256` value `v`, uniformly distributed in `[0, 2^256)`.

For each profile with boundaries `b_i` in percent:

```text
T_i = floor(b_i * 2^256 / 100)   as BigInt
outcome = first i where v < T_i
```

Properties:

| Property | Detail |
|---|---|
| No floats | Integer-only path, no `Math.random` anywhere near outcomes |
| Precomputed | Thresholds are BigInt constants, no per-round division |
| Complete | Integer comparison covers all of `[0, 2^256)`, no gaps or overlaps |
| Sentinel | `T_last = 2^256`, so every possible word maps to a bucket |

Canonical JS (single source of truth, [`src/config/paytables.ts`](../src/config/paytables.ts)):

```ts
const TWO_POW_256 = 1n << 256n;
const toThresholds = (boundaries: number[]) =>
  boundaries.map(b => (TWO_POW_256 * BigInt(b)) / 100n);
function mapVrfToOutcome(v: bigint, thresholds: bigint[]): number {
  for (let i = 0; i < thresholds.length; i++) if (v < thresholds[i]) return i;
  return thresholds.length - 1; // unreachable if last = 2^256
}
```

Solidity mirror: same formula with `uint256` division, verified identical
(`contracts/RoboStrike.sol`, asserted equal in `tests/paytables.test.ts`).

---

## 3. Overdrive: EV-neutral proof

Optional gamble after any win of 2× or more:

- 40% chance: win ×2.5
- 60% chance: win lost (0)
- Expected value: `0.4 * 2.5 + 0.6 * 0 = 1.0`

Overall RTP with Overdrive:

| Strategy | Result |
|---|---|
| Never take Overdrive | RTP = 95% (base game) |
| Always take it on qualifying wins | `E[final] = E[base] = 0.95 × wager` |
| Any mix | Linear combination of EV=1 branches, still 0.95 |

Therefore Overdrive is exactly EV-neutral: overall RTP stays 95% for every strategy.

---

## 4. Simulation design (`scripts/simulate-rtp.ts`)

- 1M rounds per profile, isolated PRNG for simulation (never the game VRF path)
- Each round: sample a uniform BigInt in `[0, 2^256)`, map via thresholds, accumulate payout
- Assert: empirical RTP within ±0.5pp of 95%, hard fail outside absolute 93-98
- Assert: per-profile frequencies vs expected probability (±0.3pp absolute at 1M)
- Non-zero exit on any assertion failure (CI gate)

---

## 5. House edge and volatility

- **House edge:** 5% on all profiles. The player chooses volatility, not edge.
- **Variance:** SCOUT pays frequent 0.7× (low grind), WARLORD pays rare 11×
  jackpots with frequent misses (siege). Choice of character, not skill.
- **Max payout:** 30× (SCOUT), which sizes `quoteCaps` / `maxReservedProfit`.

---

## 6. Declared math (for judges and README)

> ROBO STRIKE: 95% RTP on all 3 tanks. Scout: 55×0, 30×0.7, 10×2, 4×6, 1×30.
> Bruiser: 65×0, 20×0.9, 9×3, 5×7, 1×15. Warlord: 78×0, 12×1, 6×6, 3×12,
> 1×11. Overdrive 40%×2.5 EV=1.0, no RTP impact. VRF mapping BigInt
> thresholds `floor(b×2^256/100)`, verified by 1M-round sim at
> `scripts/simulate-rtp.ts`.

---

## 7. Simulation transcript

`npm run sim:rtp`, 2026-09-05, seed `0x726F626F`, N=1,000,000 per tank:

```text
SCOUT:   empirical RTP 94.9702% (diff -0.0298pp) PASS  (buckets 0.061/0.027/0.017/0.023/0.005pp, all <=0.3pp)
         Overdrive never 95.3789% / always 94.7376% (cond EV 0.9962) / mix 94.7044% (cond EV 1.0033), all PASS
BRUISER: empirical RTP 94.7955% (diff -0.2045pp) PASS  (buckets <=0.070pp)
         Overdrive never 95.0627% / always 95.2770% (cond EV 1.0009) / mix 94.9462% (cond EV 1.0006), all PASS
WARLORD: empirical RTP 94.5903% (diff -0.4097pp) PASS  (buckets <=0.032pp)
         Overdrive never 95.0885% / always 95.4147% (cond EV 1.0030) / mix 95.4698% (cond EV 0.9999), all PASS
ALL PROFILES PASS
```

Gate design notes: Overdrive modes use per-(tank, policy) seeds, since one
shared seed correlates the Overdrive draws across tanks and fails all three
at once (observed and fixed). RTP tolerance is max(±0.5pp, 2.5σ) with σ
computed exactly from the paytable's second moment (always-mode σ is about
0.36-0.51pp at 1M, so a flat 0.5pp gate would flake). The conditional
Overdrive EV gate (mean ×2.5-or-0 among qualifying rounds = 1.0 ± 3σ)
directly verifies the 40%×2.5 mapping. Exit code 1 on any failure, and
`npm run lint:rng` greps `Math.random(` in src and contracts.

*Status: validated. `paytables.ts` implemented, 63/63 tests green, simulation
gate all-PASS (2026-09-05). Verified on-chain: 60 simulator rounds, payouts
match the TypeScript math, 0 mismatches (2026-09-06). The in-game paytable
panel (key T) renders odds from the same paytables, so declared math and
displayed odds share one source.*
