# ROBO STRIKE — Retro Tank Casino (Chain Jam Vol. 1)

> Retro CRT tank casino: pick your volatility, fire, VRF decides — 95% RTP, 30× jackpots, pixel-perfect juice.

**Play:** https://robo-strike.pages.dev *(deploy on submit — see Deploy below)*
**Stack:** Phaser 3.90 · Vite 5 · TypeScript 5 · Chain Casino SDK (`ICasinoGameV2`)

## The game

Command robot tanks in a CRT arcade. Set your bet, pick 1 of 3 enemy tanks — your
**volatility choice, not skill** — and FIRE. Chain VRF settles the round instantly;
the arena, tank movement and return fire are pure presentation and never gate a payout.
Press **T** for the in-game paytable (exact odds per tank). Session stats, biggest win
and win streaks persist between visits — purely cosmetic, never touching the VRF path.

| Tank | Volatility | Paytable (probability × multiplier) | RTP |
|------|-----------|--------------------------------------|-----|
| SCOUT | low | 55%×0 · 30%×0.7 · 10%×2 · 4%×6 · 1%×30 | 95% |
| BRUISER | medium | 65%×0 · 20%×0.9 · 9%×3 · 5%×7 · 1%×15 | 95% |
| WARLORD | high | 78%×0 · 12%×1 · 6%×6 · 3%×12 · 1%×11 | 95% |

**OVERDRIVE** (optional, toggle with `O` before firing): on wins ≥2×, 40% chance to
multiply the win ×2.5, else bust to 0. `E = 0.4 × 2.5 = 1.0` exactly — EV-neutral for
any strategy (martingale side-bet), so RTP stays 95% no matter how you use it.

## Math & fairness (declared math = actual paytable)

- **RTP is exactly 19/20 per tank** — rational proof in `docs/MATH.md`, asserted
  bit-exactly in `tests/paytables.test.ts` (integer arithmetic only, no floats).
- **Outcomes are unbiased BigInt thresholds**: `T_i = floor(b_i·2^256/100)`,
  `outcome = first i where v < T_i`. Full partition of `[0, 2^256)`, no gaps, no
  modulo bias, no `Math.random` in the outcome path (CI-gated: `npm run lint:rng`).
- **Verified by simulation**: `npm run sim:rtp` — 1M rounds/tank, seeded splitmix64
  synthesizing uniform uint256 words, asserts RTP 93–98 hard + ±0.5pp of 95, per-bucket
  frequency ±0.3pp, and Overdrive EV = 1.0 in never/always/mix modes. Exit 1 on any
  failure. Latest run: **ALL PROFILES PASS** (transcript in `docs/MATH.md §7`).
- **Contract mirror**: `contracts/RoboStrike.sol` stores the same thresholds as
  literals — CI-asserted equal to the TypeScript (`npm test`), compiled with solc
  0.8.36 viaIR (`npm run compile:sol`).

## Deliverables (Chain Casino SDK)

| Deliverable | Path |
|-------------|------|
| Contract (`ICasinoGameV2`, instant pattern) | `contracts/RoboStrike.sol` + vendored `contracts/ICasinoGameV2.sol` |
| Static frontend (bridge guest, no wallet code) | `src/` — `src/game/sdk/` hosts the vendored bridge (penpal), `CasinoSession` orchestrator |
| Manifest (same origin, validator-passed) | `public/game.manifest.json` |

Run it:

```sh
npm install
npm run dev        # standalone demo mode at :5173 (mock bank, crypto-RNG outcomes)
npm test              # 63 vitest: paytables math, ABI, bridge, manifest, session loop
npm run sim:rtp       # 1M-round RTP gate (exit 1 on fail)
npm run compile:sol   # solc compile gate for contracts/
npm run budget        # wire-size gate ≤1.2MB (~737KB gz)
npm run gen:bg        # regenerate the procedural battlefield
npm run sim:roundtrip # 60 real on-chain rounds vs TS paytable math (needs local stack)
npm run sim:stuck     # stuck-randomness chaos test (mine past deadline → cancel → refund)
npm run build         # production build to dist/

Verification highlights (2026-09-06): 60/60 on-chain rounds matched the TypeScript
paytable math exactly; full bet → WAITING_RANDOMNESS → reveal flow ran through the
real SDK bridge inside the official simulator harness (`scripts/harness-e2e.mjs`); the
1M-round simulation gate passed for all tanks including Overdrive EV-neutrality.
```

Local casino simulator (full wager round-trips):
see `vendor/casino-sdk` — `npm install && npm start` → harness at `:3300`;
drop `contracts/RoboStrike.sol` into `simulator/contracts/` for auto-deploy.

## Controls

`1/2/3` or click a tank — pick volatility · `,`/`.` — bet down/up · `O` — Overdrive ·
`T` — paytable/odds panel · `SPACE`/`ENTER`/`FIRE` button — fire ·
`WASD`/arrows/click — move (cosmetic) · `M`/`S` — music/SFX toggles.
Touch: tap tanks/buttons.

## Assets & licenses

All assets are $0 commercial-safe — full per-file inventory with source URLs and
verification dates in `docs/ASSET_INVENTORY.md`. Tank sprites are Bleed's WW2
top-down tank pack ([OGA](https://opengameart.org/content/tank-pack-bleeds-game-art)),
**CC-BY 3.0** — attribution: **"Tanks" by Bleed (opengameart.org), CC-BY 3.0,
modified (cropped/recolored/downscaled)**. Fonts: Press Start 2P + VT323 (OFL 1.1).
SFX/music: CC0 (OGA/Freesound/Pixabay) per `docs/PLAYBOOK.md §2e`. Fonts: Press Start 2P + VT323
(OFL 1.1). SFX/music: CC0 (OGA/Freesound/Pixabay) per `docs/PLAYBOOK.md §2e`.
Decisions log: `docs/PROGRESS.md`. Research: `docs/research/`.

## Deploy

- **Primary:** Cloudflare Workers static assets — `npm run build && npx wrangler deploy` (`wrangler.toml` configured, `not_found_handling = "404-page"` so the manifest is never shadowed).
- **Mirror:** Vercel — `npx vercel --prod` (`vercel.json` configured, no SPA rewrite).
- `game.manifest.json` is served same-origin at `/game.manifest.json` on both (SDK `assertSameOriginUrls`).
- The jam widget (`https://jam.chain.wtf/widget.js`) is embedded in `index.html`.

## Load budget

Initial wire ≈ **706 KB gz** (JS 358K + sprites ~80K + SFX 231K + html/manifest);
the 625 KB music loop lazy-loads after boot (`npm run budget` gates this).
