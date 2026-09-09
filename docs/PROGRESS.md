# ROBO STRIKE — PROGRESS LOG

> Single source of truth for build progress. Updated at end of every phase.
> Metric: highest probability of winning Chain Jam Vol. 1 ($0 budget).

## Timeline
- TODAY: 2026-09-01
- Deadline: 2026-09-20 23:59 UTC (hard, per live jam terms)
- Judging: Sep 21-30
- Winners: Oct 1

## Stage / Phase Tracker

| Stage | Phase | Status | Date | Commit | Notes |
|-------|-------|--------|------|--------|-------|
| 0 | Workspace + Memory | DONE | 2026-09-01 | stage-0 | git init, structure, skeletons |
| 1 | Research (A-E subagents) | DONE | 2026-09-01 | — | 5 subagents: sdk 1233L, assets 761L, audio 486L, competitors 4 entries, math 724L, hosting-promo 644L; 20 Discord Qs |
| 2 | Consolidation + Asset Download | DONE | 2026-09-01 | stage-2 | PLAYBOOK merged (decisions with reasons), ASSET_INVENTORY verified (27 candidates, 2 FAIL correctly rejected), placeholders: 66 sprites raw + atlas 23KB JSON, 11 wavs + 11 oggs + loop 50.5s 472KB ogg, palette locked |
| 3-1 | Scaffold (Vite+TS+Phaser) | DONE | 2026-09-02 | phase-1 | Vite 5.4.21 + TS 5.5 + Phaser 3.80 + vitest 2.1, 320×180 NEAREST, palette #0a1a3f…#1a1a1a, Press Start 2P/VT323 OFL, Boot/Title/Game scenes, arcade border 484×258 + marquee ROBO STRIKE, build 1.48M (341K gz) pass, palette test 2/2 pass |
| 3-2 | Casino Brain (paytables + VRF mapper + RTP proof) | DONE | 2026-09-05 | — | `src/config/paytables.ts` single source (BigInt thresholds + rational mults + mapper + ABI helpers); `tests/paytables.test.ts` (exact 19/20 RTP proof, Appendix A literal match, edge values, Overdrive); `scripts/simulate-rtp.ts` 1M/tank gate all-PASS (`npm run sim:rtp`, exit 1 on fail); `npm run lint:rng` bans `Math.random(` in src+contracts |
| 3-3 | SDK Integration (contract+bridge+manifest) | DONE (code) | 2026-09-05 | — | `contracts/ICasinoGameV2.sol` vendored verbatim + `contracts/RoboStrike.sol` instant game (compiles solc 0.8.36 viaIR, 2646B bytecode, `npm run compile:sol`); literals CI-mirrored to TS in tests; bridge `src/game/sdk/{types,guest,manifest,CasinoSession}.ts` (penpal 7.0.6, computeMaxWager port, manifest validator port); `public/game.manifest.json` filled + validated; `tests/sdk-bridge.test.ts` 15 + `tests/casino-session.test.ts` 5 |
| 3-4 | Presentation (state machine + juice) | PARTIAL | 2026-09-05 | — | Game.ts wired: bet ladder HUD (−/+ , /.), tank select 1/2/3+click, OVERDRIVE toggle (O, committed in gameData bit 7), FIRE = casino round (VRF outcome drives MISS/GLANCE/SOLID/CRIT/JACKPOT presentation, forced kill on ≥2×, jackpot coin fountain), VRF ticker during WAITING_RANDOMNESS, standalone crypto-RNG demo mode w/ mock bank, `revealOutcome` after animation, bot fire paused cosmetically during round |
| 3-5 | Overdrive | TODO | - | - | EV-neutral proof |
| 3-6 | Performance + Standalone | TODO | - | - | ≤1.2MB, standalone iframe-free |
| 3-7 | Ship Prep (widget + README + deploy) | TODO | - | - | Vercel, public repo |
| 3-8 | Submit Early + Polish Loop | TODO | - | - | promo video, final audit |

## Done / Next / Blockers (updated per phase)

### After Stage 0 (2026-09-01)
- **Done:** git init (main), directory structure, 6 skeleton docs.
- **Next:** Spawn 5 research subagents in parallel (Stage 1).
- **Blockers:** None.

### After Stage 1 (2026-09-01)
- **Done:** 5 subagents parallel:
  - A sdk.md 1233L — 12 URLs 200, zip 985935 bytes 131 files, widget.js 4328 bytes, full ICasinoGameV2 + bridge + manifest + simulator + VRF BigInt pattern
  - B assets.md 761L + audio.md 486L — 27 candidates all 200, CC0/OFL/MIT/UNLICENSE PASS except 2 FAIL (JROB774 CC-BY 3.0, Jetrel disputed), 17 sprites mapped S01-S17, 11 sounds with jsfxr/Bfxr/ChipTone recipes + BeepBox 28bars 133BPM
  - C competitors.md 481L — Convex `entries:listApproved` 4 entries (Tumbler 56m leader, Lazer 193 plays, Neon, Deadman-switch), gaps: tank 0/4, CRT 0/4, instant reveal underoccupied; positioning statement + anti-slop checklist
  - D math.md 724L — RTP 95% exact Fraction 19/20, thresholds floor(b*2^256/100) proven, sim design 1M splitmix64, Overdrive EV=1 proof, literals appendix
  - E hosting-promo.md 644L — Vercel 100GB vs Netlify 15GB vs Cloudflare unlimited, Vite budgets, OBS 32.2.2 + DaVinci/CapCut, 15s shot list
  - 20 questions appended to QUESTIONS_FOR_DISCORD.md (Q1-20, R1-3 resolved)
- **Next:** Stage 2 consolidation — merge into PLAYBOOK + ASSET_INVENTORY, download assets, generate placeholders
- **Blockers:** None — gallery JS-rendered but recovered via Convex; Kenney ZIPs gated but HTML 200 verified.

### After Stage 2 (2026-09-01)
- **Done:** PLAYBOOK.md merged with reasons/sources (7 sections: arch, SDK, assets, competitors, math, hosting, prohibited deps). ASSET_INVENTORY.md locks every asset file path + source URL + license + commercial verdict (fonts OFL, Kenney CC0 ×7, OGA CC0 ×2, tools GPL/MIT, output unencumbered). Downloaded/Generated:
  - palette `assets/palette/robo-strike.gpl`
  - art raw placeholders 66 PNGs (1x1 → 32×32) covering S01-S17, atlas `public/assets/atlas/robo-atlas.json` 23KB + `robo-atlas.png` 159B + `scanline.png` 77B
  - audio placeholders 11 wavs (8.5M loop + 51-242K SFX) + 11 oggs (472KB loop + 3.9-9.5K SFX) via ffmpeg approximating recipes, manifests `assets/audio/manifest.json` + `public/assets/audio/manifest.json`, layers chip
  - fetch log `assets/fetch.log` + verify scripts `scripts/fetch-assets.sh`, `generate-sfx.sh`, `generate-art.sh`
  - All research files persisted docs/research/*.md (5 files, 3000L+)
- **Next:** Stage 3 Phase 1 scaffold — Vite+TS+Phaser 320×180, palette constants, fonts, scene skeleton (DO NOT start until stage-2 commit)
- **Blockers:** Kenney ZIPs require manual browser click "Continue without donating" to fetch actual bytes (HTML 200 verified, ZIP not directly curlable) — placeholders in place, real sheets will replace before Phase 4. Real jsfxr/Bfxr exports & BeepBox loop export will replace ffmpeg placeholders in Phase 4/5 — filenames stable.

### After Phase 1 (2026-09-02)
- **Done:** Vite 5.4.21 + TS 5.5.4 + Phaser 3.80.0 + vitest 2.1.8 scaffold via `phaserjs/template-vite-ts` pattern; `320×180` `pixelArt:true` `FilterMode.NEAREST` `Scale.NONE`; palette `src/config/palette.ts` `#0a1a3f…#1a1a1a` + `INTERNAL_WIDTH/HEIGHT`; fonts `Press Start 2P` + `VT323` OFL via Google Fonts link in `index.html`; scenes `Boot.ts` (placeholder tank + font load → Title), `Title.ts` (ROBO STRIKE + arcade border 484×258 + marquee + music/sfx toggles `♫/🔊` + FIRE/Space/Enter → Game), `Game.ts` (320×180 battlefield + 3 tanks SCOUT/BRUISER/WARLORD + bet + FIRE + shake); `index.html` arcade-wrap `900px` border + `320×180` screen + CRT `scanline+vignette`; `vite.config.ts` + `tsconfig.json`; `npm run build` **pass** `1.48M (341K gz)` in 13.23s, `npm test` **2/2 pass** `palette.test.ts`.
- **Next:** Phase 2 Casino Brain — `src/config/paytables.ts` single source + BigInt mapper + `scripts/simulate-rtp.ts` 1M + vitest, no Math.random, exit non-zero outside 93-98.
- **Blockers:** None — scaffold is standalone, no SDK yet, no heavy deps, `assets/art` + `arcade` not yet wired (Phase 4), `RTP` math still in `docs/MATH.md` will be code-ified.

### After Title Fix (2026-09-02)
- **Done:** TitleScene fixed: arena backdrop (navy #0a1a3f + 40 starfield dots, 3 bunkers), player tank bottom-center cyan idle-bob, 3 enemy tanks SCOUT cyan ×30 / BRUISER magenta ×15 / WARLORD white ×11 (Press Start 2P labels), CRT scanline+vignette in-scene, attract loop every 4s (shell → explosion → coin burst, deterministic cycle, no Math.random, FX shake/hit-stop), modal keeps ROBO STRIKE/RETRO TANK CASINO + audio toggles (localStorage `roboStrike_audio_v1`), PRESS FIRE blinks 1Hz (500ms) + OR TAP, widget verified official `https://jam.chain.wtf/widget.js` in `index.html` (no hand-made badge), input click/tap/SPACE/ENTER/F → 0.5s black fade → GameScene, mobile touch via pointerdown, palette strict.
- **Next:** Re-run build + manual browser check (no soccer/camo), then proceed to Phase 2 Casino Brain.
- **Blockers:** None.

### After Phases 3-5/3-6/3-7 + Simulator (2026-09-05, session 2)
- **Done:**
  - **3-5 Overdrive UX:** tier-scaled payout count-up via `CountUp` (×2/×6/×12 auto-duration per ui_feedback §5) + token amount float; JACKPOT camera zoom pulse + 12-coin fountain; OD chip shows `OD ON ×2.5`; OVERDRIVE WIN/BUST banners.
  - **3-6 Budget:** deleted ~19MB unreferenced assets (pexels 12.3MB, pxhere 6.4MB, pixabay 466K, extra buttons 188K) — index.html only referenced `bg_outside_blur.jpg` + OGA GUI sheet; music_loop (625K gz) moved OUT of Boot preload → runtime lazy-load in `AudioManager.initMusic` (initial wire = JS+sprites+SFX only). **`npm run budget` gate: 706KB gz initial ≤ 1.2MB** (JS 358K + sprites ~85K + SFX 231K + html/manifest). Starfield plus-cross tile (slop risk) replaced with procedural 1px stars in Title+Game; battlefield art desaturated 50% (ffmpeg) to match CRT navy fiction; HUD collisions fixed (BANK top-right, DEMO tag merged into bank line, name+mult tags follow wandering bots).
  - **Headless GUI verification:** playwright + xvfb-run (headless-shell rAF throttles to 1.4fps → headed chromium under xvfb required). `scripts/gui-smoke.mjs`: Title → Game → 3 full rounds incl. WARLORD+OD+bet-up, fire-spam guard — zero console/page errors, rounds settle, bank decrements correctly (100→99 after 1-credit MISS verified on screenshot).
  - **3-7 Deploy:** `vercel.json` (no SPA rewrite, manifest content-type) + `wrangler.toml` (Workers static assets, `not_found_handling="404-page"`) written; README rewritten (math paragraph, deliverables table, controls, licenses, deploy, budget). **wrangler/vercel not authenticated in this workspace** — `npx wrangler deploy` / `npx vercel --prod` need user login.
  - **Simulator:** casino-sdk zip downloaded → `vendor/casino-sdk` (gitignored), workspaces installed, stack booted (chain 31337 :8545, harness :3300). Dropped `RoboStrike.sol`+`ICasinoGameV2.sol` into `simulator/contracts/` → **auto-compiled viaIR, deployed and registered as `RoboStrikeGame`** by the watcher (exact jam drop-in flow).
  - **`scripts/simulator-roundtrip.mjs` (`npm run sim:roundtrip`):** 20 real wager rounds over RPC (cycling SCOUT/BRUISER/WARLORD, every 4th with Overdrive commit, 1/5 chUSD wagers) — asserts per round: settled phase, tank echo in gameState, outcome range, OD coherence (OD only on ≥2×), and **on-chain settled payout == TS paytable math on the on-chain randomness word**; plus chaos: invalid gameData, tankId=3, over-balance wager, cancelStuckRandomness on settled session.
- **Next:** final full-suite green + submit-prep (screenshots for SUBMISSION.md, promo video per shot list, re-check gallery 24h pre-deadline).
- **Blockers:** actual hosting deploy needs user's wrangler/vercel auth; VRF fulfillment latency on the local watcher is minutes-scale when idles (all requests eventually fulfill — production VRF is separate infra).

### After Judging-Pillar Pass (2026-09-06, session 3)
- **Live jam intel re-verified from bundle (`assets/index-BjLV39gu.js`):** four pillars verbatim; prizes 500/350/150 USDC; **deadline 2026-09-20 23:59 UTC** (typo 22:58 corrected); eligibility gate includes "recognizably a casino game (wager in, outcome, payout)" and standalone demo mode for judges ("the jam gallery and the judges open the URL directly").
- **Gallery re-scan: 16 approved entries** (was 4 at Stage 1). Still zero tank/war/character entries — novelty wedge holds. Closest rival: Chain Arena (d20 duel) — different mechanic + presentation. Grudge Lab = player-set-odds (abstract slider variant of volatility choice).
- **Paytable panel** (`src/game/systems/PaytablePanel.ts`, key T / ODDS chip, Title + Game): per-tank probability × multiplier columns derived live from `paytables.ts` (never hand-typed), Overdrive footer. Serves Simplicity + "recognizably a casino" + promo shot list.
- **Session stats + streaks** (`src/game/systems/Stats.ts`, localStorage `roboStrike_stats_v1`): rounds/wins/biggest-win/best-streak persist; title-screen marquee; STREAK ×N banners + escalating shake + coin-tick pitch on 2+ streaks; NEW BEST! banner. Cosmetic only — VRF outcome path untouched.
- **Harness-UI bridge E2E — the organizer's own bar — PASS** (`scripts/harness-e2e.mjs`, screenshots `docs/screenshots/simulator-harness-*.png`): our game inside the official harness at :3300, real penpal bridge → LocalCasinoHost → VRF → settle → revealOutcome. Phases observed: `opening → WAITING_RANDOMNESS → reveal → idle`; host sessions SETTLED; real chUSD balance debited/credited (1,000,000 → 999,996/5). **Fixed a real bridge bug found by this test:** `createHostConnection` never stored the penpal `hostApi` handle (`host api unavailable` on every host bet) — now resolved from `connection.promise`. Harness gotchas handled in-script: contract picker defaults to coinflip (must select RoboStrikeGame + click **Restart harness** to rebind the integration); stale-frame re-acquire after remount.
- **Next:** submit early via jam.chain.wtf (rtp=95, pitch from SUBMISSION.md), re-scan gallery 24h pre-deadline, record 15s promo per PLAYBOOK §5c.

### After Real-War Art Upgrade (2026-09-06)
- **Tank art replaced with real WW2 machines** — user direction: "real war, beautiful, boys and men will like". Source: **Bleed's Top-Down Tank Pack** ([OGA](https://opengameart.org/content/tank-pack-bleeds-game-art), Tanks_Pack.zip, **CC-BY 3.0**, credited in README + ASSET_INVENTORY): player = **T-34** (cyan cast), SCOUT = **Pz.Kpfw.IV-G** (magenta, smallest), BRUISER = **Tiger-II** (gold), WARLORD = **KV-2** (green, massive howitzer turret — 12× monster reads as one).
- Pipeline `scripts/art/process-tanks.mjs` (sharp): alpha-gap component split (hull/turret from each strip), barrels rotated up, downscaled (hull 30-48px by class), WW2 camo kept intact — class identity via neon rim outline + light hull cast + turret tint (full recolor was tried first and washed out the detail). `npm i sharp` added (devDependency? runtime build-time tool only).
- Code: entity `baseScale` normalized to 1 (art carries size classes); verified in-game via gui-smoke — team colors legible at a glance, KV-2 turret visible, zero console errors, 63/63 tests, BUDGET OK.

### After Art Pass (2026-09-05, session 2 cont.)
- **Battlefield replaced:** procedural 320×240 desert arena (`scripts/gen-battlefield.mjs`, seeded LCG — deterministic, no Math.random): organic tonal blobs (no more placeholder rectangles), worn road band with cracks, craters with rim highlights, dashed tread tracks, grass tufts, smooth vignette. Regenerable via `npm run gen:bg`.
- **Tank silhouette differentiation** (volatility-as-character made visible): SCOUT ×0.70 small/twitchy, BRUISER ×0.95 midweight, WARLORD ×1.15 heavy with ×1.12-wide turret. `baseScale` field per entity class; constructor, windup pulse tween and respawn tween all relative to it (was absolute 0.85 everywhere — pulse would have grown the small tank).
- Verified in-game via `scripts/gui-smoke.mjs` (xvfb): arena reads as terrain, size classes legible at a glance, jackpot flash/coin fountain intact, zero console errors. 63/63 tests, BUDGET OK 737KB gz.
- **Simulator round-trips — COMPLETE (2026-09-06):** **60 real wager rounds over RPC, 0 mismatches** — every on-chain settled payout equals TS paytable math on the on-chain randomness word, across all 3 tanks, wagers 1/5 chUSD, incl. on-chain **Overdrive BUST (WARLORD SOLID 6× → 0.00) MATCH**. Chaos verified live: invalid gameData / tankId=3 / over-balance wager / cancel-on-settled all revert; **stuck-randomness recovery PASS** (`sim:stuck` — hardhat_mine past deadline → cancelStuckRandomness → phase CANCELLED + wager refunded); 12 fulfillment strands self-healed in-run by the same cancel+retry flow. Found + fixed real bug: contract gameState lacked the outcome word (`abi.encode(tank, outcome, odTaken, odWon, randomness)`) — caught because frontend decode showed MISS every round; redeployed via watcher drop-in. Infra note: local router occasionally no-ops fulfillment (silently succeeds without settling) — strands are the SDK's own documented stuck-randomness scenario, handled by cancelStuckRandomness; `sim:roundtrip` fulfills in-script with the SDK's `fulfillLocalVrfRequest` and self-heals.

### After Phase 2+3 (2026-09-05)
- **Done:**
  - **Casino Brain (3-2):** `src/config/paytables.ts` — BOUNDARIES per MATH.md, rational multipliers (no float payout math), precomputed BigInt thresholds, `mapVrfToOutcome`, Overdrive `T_OD`/`mapOverdriveWin`/`qualifiesForOverdrive` (denominator-normalized — test caught raw-numerator bug), 32-byte gameData/gameState ABI helpers matching the contract layout. Tests: exact rational RTP `19/20`, threshold-partition RTP within 1e-70 of 19/20 (floor-error property), Appendix A literal equality, mapper edge straddles, ABI round-trips.
  - **Sim gate:** `scripts/simulate-rtp.ts` (esbuild bundle → node) — 1M rounds/tank seeded splitmix64 (4×64→256-bit), bps-exact payout accumulation. Fixed statistical flaw found by first run: sharing one seed across tanks correlated Overdrive draws and failed all tanks simultaneously → per-(tank,policy) seeds. Gate now: hard 93–98 + max(±0.5pp, 2.5σ) with exact closed-form σ per policy + conditional Overdrive EV = 1.0 ± 3σ (measured 0.996–1.003). ALL PROFILES PASS. `npm run sim:rtp`.
  - **Contract (3-3a):** `contracts/ICasinoGameV2.sol` vendored verbatim from SDK zip; `contracts/RoboStrike.sol` instant pattern — per-tank threshold literals (CI-tested equal to TS), bps multipliers, `quoteCaps maxReservedProfit = wager×(maxMult−1)`, `quoteRiskParams probabilityWad=1e16 / expectedPayout=0.95×wager / subJackpot 0` (30× < 100× heavy-tail), `quoteForfeitPayout=0`, `onPlayerAction` reverts, Overdrive committed in gameData bit 7 + same-word keccak sub-roll (`keccak256(abi.encode(randomness,"ROBO_OVERDRIVE"))`, Q14 pending — swap point isolated). gameData = 32-byte ABI word (byte 31 = tankId|0x80) matching `encodeAbiParameters` output — initial 1-byte design was fixed before compile. solc 0.8.36 viaIR optimizer 200: PASS, 2646B.
  - **Bridge (3-3b):** `src/game/sdk/types.ts` (HostSnapshotV1/HostApiV1/GuestApiV1 vendored-faithful), `guest.ts` (penpal 7.0.6 `connectGameToHost`, referrer-origin allowlist, `createHostConnection` with handshake timeout → silent standalone fallback, `computeMaxWager` + `maxReservedProfitFor` port, parseUnits/formatUnits), `manifest.ts` (validator port with exact host rejection strings, `canonicalCasinoGameId`, `assertSameOriginUrls`).
  - **Manifest (3-3c):** `public/game.manifest.json` filled (gameId RoboStrikeGame → canonical `robostrike`, full-iframe, openSession-only instant capabilities, resize:true) — validated by tests.
  - **Wiring (3-4 partial):** `CasinoSession` orchestrator (host: openSession→settled-row watch→decode gameState→randomness-fallback→payout-fallback priority; standalone: crypto.getRandomValues uint256, mock bank, balance conservation test). Game.ts: bet ladder HUD, tank selection (1/2/3 + click, yellow highlight, labels follow bots), OD toggle, FIRE = one casino round targeting the selected tank; outcome presentation MISS(dust)/GLANCE(graze)/SOLID+CRIT(forced kill)/JACKPOT(fanfare+12-coin fountain+flash); OVERDRIVE BUST/WIN banners; payout float text; GAINS = Σ(payout/wager); `revealOutcome` after animation; bots hold fire during round (cosmetic, never gates payout).
- **Tests:** 63/63 vitest green (palette 2, paytables 20, sdk-bridge 15, casino-session 5, + contract mirror). tsc clean. build pass. solc pass. lint:rng pass.
- **Next:** Phase 3-5 Overdrive UX polish (post-win prompt vs pre-commit toggle decision after Q14), Phase 3-6 performance/standalone polish, then simulator round-trips (drop contract in `simulator/contracts/`, 20 consecutive rounds, chaos tests).
- **Blockers:** Local simulator not yet run in this workspace (needs `casino-sdk` zip unzip + `npm install` workspaces) — contract + bridge are written to spec but the 20× simulator round-trip is unverified. Browser GUI smoke test not possible in this session (no browser bridge tool); game verified via HTTP 200s + headless session tests.

## Decisions Log (append-only)
- 2026-09-01: Locked game spec to SECTION 2 — no scope creep.
- 2026-09-01: Enforced $0 budget whitelist only.
- 2026-09-01: Research confirms SDK free MIT, no Chainlink relevance, zip canonical (HTTP 404s are Vocs routing).
- 2026-09-01: Palette locked 6+outline, 1px rule, indexed mode, no new hues without PLAYBOOK justification.
- 2026-09-01: Volatility = character choice (tank), not slider — defensible novelty gap vs Tumbler/Lazer.
- 2026-09-01: Paytable single source `paytables.ts` + BigInt thresholds, no Math.random in outcome path, Solidity sentinel `type(uint256).max` inclusive.
- 2026-09-01: Host primary Cloudflare Pages unlimited + mirror Vercel 100GB; manifest same-origin, `not_found_handling=404-page`, widget EXACT `https://jam.chain.wtf/widget.js`.
- 2026-09-01: Audio generated originals 90% + 2 low-vol CC0 layers optional (toggle `USE_CC0_LAYERS`).
- 2026-09-01: Stage 2 placeholders generated via ffmpeg/python to keep build green until manual asset pulls.
- 2026-09-01: **SFX FIX per user request** — replaced pitched beeps with REAL free sounds: wins = a lot of falling coins (OGA coin_drop CC0 + Breviceps CC0 + coinsounds.zip CC0 lot 1.6s), jackpot = lotto win (OGA Win sound CC0 + FunWithSound CC0 fanfare 2.84s), loss = losing jingle (OGA losegamemusic CC0 1.4s), explosions = real world bombings (qubodup CC0 US gov + Pixabay 66K real explosion 0.61/1.1s), music loop = action rock (OGA SimpleBeat CC0 50s loudnorm). Old sfx still available as layers but primary now real.
- 2026-09-05: Casino Brain single source is `src/config/paytables.ts` — rational multipliers (bigint num/den) so payout math is integer-exact; thresholds derived by formula and CI-asserted against Appendix A literals.
- 2026-09-05: Sim gate uses per-(tank,policy) seeds — one shared seed correlated Overdrive draws across tanks and failed all three simultaneously; tolerance is max(±0.5pp, 2.5σ) with exact closed-form σ + conditional Overdrive EV=1.0 gate.
- 2026-09-05: `gameData` = 32-byte ABI word (byte 31 = tankId, bit 7 = Overdrive pre-commit) — matches `encodeAbiParameters([{type:'uint8'}],…)` like the SDK coinflip example; contract reads `gameData[31]`.
- 2026-09-05: Overdrive committed at `openSession` (gameData bit 7) + same-word keccak sub-roll — instant single-VRF pattern per PLAYBOOK §1a; Q14 answer only changes `RoboStrikeGame.onRandomness`.
- 2026-09-05: Standalone mode = first-class (jam "standalone playable" gate): crypto.getRandomValues uint256 → same mapper; mock bank 100 tokens; host-bridge failure silently degrades to standalone.
- 2026-09-05: FIRE = one casino round on the SELECTED tank; VRF tier drives presentation (kill forced on ≥2×); bot movement/return fire is cosmetic and paused while a round resolves — never gates payout (movement_ai_casino Option 1 separation).

## Eligibility Checklist (final audit)
- [ ] contract+bridge+manifest exact
- [ ] simulator green, near-instant load
- [ ] RTP 93-98% declared matches paytable
- [ ] novel casino concept, no banned clones
- [ ] standalone playable outside iframe
- [ ] jam widget embedded
- [ ] submitted via jam.chain.wtf with public repo + README
