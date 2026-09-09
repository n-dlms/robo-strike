# ROBO STRIKE — AGENTS.md (Agent Onboarding — read this first)

> Canonical context doc for any AI agent or human joining this repo mid-build.
> Chronological build log: `docs/PROGRESS.md`. Submission copy-paste: `docs/SUBMISSION.md`.
> **Deadline: 2026-09-20 23:59 UTC** (Chain Jam Vol. 1, jam.chain.wtf). Judged on four
> pillars: Novelty · Fun · Simplicity · Visual & sound (see docs/SUBMISSION.md table).

## What this is

A retro CRT **tank casino** for the Chain Jam: pick 1 of 3 enemy WW2 tanks (the
volatility choice — SCOUT low / BRUISER mid / WARLORD high), bet, FIRE once, Chain
VRF settles instantly. 95% RTP on every tank (exact 19/20, proven in tests).
Optional OVERDRIVE gamble after wins ≥2× (40% → ×2.5, EV-neutral by design).
Everything in the arena (movement, return fire, explosions) is **presentation only**
and must never gate a payout.

## Current state (2026-09-06) — build COMPLETE, deploy pending

- Casino brain, contract, bridge, manifest, game wiring: **done and verified**.
- 63/63 vitest, tsc clean, production build, solc compile, 1M-round RTP sim,
  60/60 on-chain simulator rounds matching TS math, harness-UI bridge E2E passing.
- **Remaining (needs the human):** `npx wrangler login && npx wrangler deploy`
  (Cloudflare primary; Vercel mirror optional), 15s OBS promo video, submit via
  jam.chain.wtf form (fields ready in docs/SUBMISSION.md), re-scan gallery 24h
  before deadline.

## Architecture map (who does what)

| Path | Role |
|------|------|
| `src/config/paytables.ts` | **SINGLE SOURCE OF TRUTH**: boundaries, rational multipliers (bigint num/den), BigInt VRF thresholds, `mapVrfToOutcome`, Overdrive logic, gameData/gameState ABI encode/decode. Contract literals are CI-asserted equal to this file. |
| `src/game/sdk/types.ts` | Vendored host/guest bridge types (faithful to casino-sdk zip). |
| `src/game/sdk/guest.ts` | Penpal `connectGameToHost`, `createHostConnection` (stores `hostApi` from `connection.promise`!), `computeMaxWager` port, `parseUnits`/`formatUnits`. |
| `src/game/sdk/manifest.ts` | Manifest validator (exact host rejection strings), `canonicalCasinoGameId`. |
| `src/game/sdk/CasinoSession.ts` | Round orchestrator. HOST mode: openSession → watch snapshots → decode gameState → revealOutcome. STANDALONE mode (no iframe): crypto.getRandomValues uint256 + mock bank. |
| `src/game/scenes/{Boot,Title,Game}.ts` | Phaser scenes. Game.ts = bet HUD, tank select, FIRE→casino round, outcome presentation, stats/streaks. |
| `src/game/entities/{Scout,Bruiser,Warlord}.ts` | Cosmetic enemy bots (wander, aim, fire back). `baseScale` = 1 (art carries size). |
| `src/game/systems/{AudioManager,CountUp,PaytablePanel,Stats}.ts` | Audio + toggles, tier count-ups, odds panel (key T), persistent stats. |
| `contracts/RoboStrike.sol` | ICasinoGameV2 instant game: threshold literals (mirrored from TS), bps multipliers, Overdrive committed in gameData bit 7 + same-word keccak sub-roll. gameState = `abi.encode(tank, outcome, odTaken, odWon, randomness)` — randomness 0 ⇒ not settled. |
| `scripts/simulate-rtp.ts` | 1M-round/tank RTP gate (`npm run sim:rtp`), esbuild-bundled. |
| `scripts/simulator-roundtrip.mjs` | 60 real on-chain rounds vs TS math + chaos tests (`npm run sim:roundtrip`; needs local stack). |
| `scripts/harness-e2e.mjs` | GUI E2E through the official harness (playwright + xvfb). |
| `scripts/art/process-tanks.mjs` | Bleed WW2 sprite pipeline (sharp): split/rotate/downscale/tint/outline. |
| `vendor/casino-sdk/` | The SDK zip, extracted + installed (gitignored). The simulator stack lives here. |

## Invariants — do not break

1. **Outcome path is VRF-only BigInt**: no floats, no `Math.random` in `src/` or
   `contracts/` (`npm run lint:rng` fails the build). Standalone demo uses
   `crypto.getRandomValues` → same mapper.
2. **Single-source paytables**: every displayed odds number (paytable panel, sim,
   contract) derives from `src/config/paytables.ts`. Never hand-type odds.
3. **Cosmetic separation**: bots/movement/fire-back must never influence payouts
   (research doc `docs/research/movement_ai_casino.md` Option 1, Q38–41).
4. **Palette lock**: `#0a1a3f #4ff2e3 #ff4fd8 #ffd94f #58ff9b #ffffff #1a1a1a` +
   1px outline. Terrain/desert shades allowed for backgrounds only.
5. **Wire budget ≤1.2MB gz initial** (`npm run budget`; currently ~737KB — music
   625KB lazy-loads after boot, do NOT re-add it to Boot preload).
6. **Licenses**: CC0/OFL preferred; the one CC-BY item (Bleed WW2 tanks) is
   attributed in README + ASSET_INVENTORY — keep that attribution when editing.
7. **Standalone-first**: opening the URL directly must boot the playable demo
   (judges do exactly that). Host-bridge failure must silently fall back.

## Verification — what green means

```sh
npm test          # 63 vitest (paytables exactness, ABI, bridge, manifest, session loop)
npm run sim:rtp   # 1M rounds/tank: RTP 93–98 hard + ±0.5pp + freq ±0.3pp + OD EV=1
npm run compile:sol   # solc 0.8.36 viaIR
npm run lint:rng      # no Math.random( in src/ or contracts/
npm run budget        # initial wire ≤1229 KB gz
npm run build         # tsc + vite dist/
```

Full stack verification (optional, heavier): boot `vendor/casino-sdk` (`npm start`
in that dir), then `npm run sim:roundtrip` (60 on-chain rounds) and
`xvfb-run -a node scripts/harness-e2e.mjs` (GUI through the real bridge).

## Environment landmines (learned the hard way)

- **GUI tests need `xvfb-run -a`** with headed chromium: the headless shell
  throttles rAF to ~1.4fps and the loader appears stuck. Also pass
  `--enable-unsafe-swiftshader` when headless.
- **Node here cannot strip TS types** — run .ts scripts via esbuild bundle
  (see `sim:rtp` script in package.json for the pattern).
- **Simulator harness gotchas**: the game picker defaults to CoinflipGame —
  select RoboStrikeGame then click **Restart harness** (rebinds the integration;
  the old iframe detaches, re-acquire it). `/__local-contracts.json` is the live
  deployment registry.
- **Local VRF strand quirk**: the router occasionally no-ops a fulfillment
  (tx succeeds, host stays WAITING_RANDOMNESS, then the request expires →
  `InvalidRequestId`). This is the SDK's own documented stuck-randomness scenario:
  recover via `hardhat_mine` past the deadline + `cancelStuckRandomness`
  (`npm run sim:stuck`). Don't "fix" the game for it.
- **viem tuple decode**: named components → object access (`s.phase`); unnamed →
  array (`s[12]`). Always defensively use both.
- **Stack**: `vendor/casino-sdk` + `npm start` boots chain (:8545) + harness (:3300)
  + coinflip (:3100). Fresh chains redeploy deterministically (same addresses).
  Drop contracts into `vendor/casino-sdk/simulator/contracts/` for auto-deploy —
  keep copies in sync with `contracts/` (diff before assuming).
- **`window.__ROBO`** is exposed on the Phaser game for E2E scripts.

## Doc index

- `docs/PROGRESS.md` — chronological build log + decisions (append-only).
- `docs/SUBMISSION.md` — form fields, pillar arguments, pre-submit checklist.
- `docs/MATH.md` — RTP proof + sim transcript (VALIDATED).
- `docs/PLAYBOOK.md` — original plan/decisions + as-built deviations banner.
- `docs/ASSET_INVENTORY.md` — per-asset license inventory (Bleed = CC-BY, credited).
- `docs/UI_AUDIO_TOGGLES.md` — audio toggle spec (implemented).
- `docs/QUESTIONS_FOR_DISCORD.md` — open questions; Q14/Q27/Q31-34/Q38-41 resolved
  by implementation (see banner).
- `docs/research/*.md` — Stage-1 research archive (sdk/math/assets/audio/competitors/
  hosting). `docs/screenshots/` — verification + submission shots.
