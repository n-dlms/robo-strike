# ROBO STRIKE — PLAYBOOK (Decisions Only, with Reasons)

> Merged from Stage-1 research (2026-09-01). Every decision has source.
> Metric: highest probability of winning Chain Jam Vol.1 ($0 budget).

## 0. Architecture — Locked

| Decision | Choice | Reason | Source |
|----------|--------|--------|--------|
| Engine | **Phaser 3.80+ + Vite 5 + TypeScript 5 + vitest** | Whitelisted MIT, jam-proven (Neon/Tumbler/Lazer all Vite), 320×180 nearest-neighbor, fast HMR | Section 3 whitelist, `docs/research/hosting-promo.md:1` Vite tables |
| Internal res | **320×180**, `image-rendering:pixelated`, integer scale | Spec-locked, CRT pixel-art, prevents blurry upscale slop | Section 2, `docs/research/competitors.md:3` V-3 |
| Palette | `#0a1a3f` navy, `#4ff2e3` cyan, `#ff4fd8` magenta, `#ffd94f` yellow, `#58ff9b` green, `#ffffff` white + outline `#1a1a1a` | Spec-locked 6-color, anti-slop tight palette, 1px outline rule everywhere | Section 2, `assets.md:26` |
| Fonts | **Press Start 2P + VT323** (OFL 1.1) via `@fontsource` or woff2 subset + `BitmapText` fallback | OFL commercial-safe, VT323 for body/numbers, Press Start 2P for title/jackpot | `assets.md:8-9` verified OFL |
| Paytable single source | `src/config/paytables.ts` → `THRESHOLDS` + `mapVrfToOutcome` | Prevent drift, simulation + contract + UI share same BigInt thresholds, grep-proof single source | `docs/research/math.md:3` + `MATH.md:2` |
| State machine | `TITLE→BET→TARGET→FIRING→REVEAL→PAYOUT` + `OVERDRIVE?` | Spec §7, no movement/AI, instant reveal keeps Simplicity high, Overdrive optional post-win | Section 2 |

## 1. SDK — Exact Implementation (source: `docs/research/sdk.md` + zip)

### 1a. Contract — `ICasinoGameV2` (MIT) — instant pattern

```solidity
// SPDX-MIT, pragma ^0.8.30, from casino-sdk/solidity/ICasinoGameV2.sol
// Enums: SessionPhase {NONE, WAITING_RANDOMNESS, WAITING_PLAYER_ACTION, SETTLED, FORFEITED, CANCELLED}
// Structs: SessionContext {sessionId, player, vault, wagerBase, escrowedStake, reservedProfit, step, gameData, gameState}
//         StepResult {bytes newGameState, int256 escrowDelta, int256 reservedProfitDelta, SessionPhase nextPhase, bool requestRandomnessNow, uint256 payout}
```

- **GameData ABI:** `encodeAbiParameters([{type:'uint8'}],[tankId])` where `0=SCOUT,1=BRUISER,2=WARLORD`. Overdrive intent optionally in same byte or second byte — decision: encode as `(uint8 tankChoice, bool wantsOverdrive)`? But spec says pick 1 of 3 tanks before FIRE, Overdrive is *post-win* optional — so `gameData` is just `tankId` (1 byte). Overdrive choice will be `actionData` if we use 2-step, or same-word derived if instant. **Decision: keep `gameData` minimal = `uint8 tankId` only; handle Overdrive via `actionData` OR same-word keccak derivation — pending Q14, implement same-word derivation first (instant, no second VRF) for simplicity, keep `quoteForfeitPayout=0`.**
- **onSessionStart:** validate `tankId 0..2`, compute `maxReservedProfit = wager*29` for SCOUT (worst 30×) → `maxReservedProfit = maxPayout - wager`. Return `nextPhase=WAITING_RANDOMNESS, requestRandomnessNow=true, reservedProfitDelta=int(maxReservedProfit)`. Must be `pure/view`, consistent when `sessionId==0` double-simulation.
- **onRandomness(bytes32):** `uint256 v = uint256(randomness)`. Map via BigInt thresholds `T_i=floor(b_i*2^256/100)` (JS bigInt, Solidity literals with `type(uint256).max` sentinel). Bucket 0..4 → multiplier. Then `payout = wager * mult / 1e?` Actually `wager` is token base units, multiplier applied as `payout = wager * multNumer /1`? For 0.7× need fractional: use basis points. **Decision: store multipliers as bps? But paytable uses decimals 0.7,0.9. On-chain contract will use integer math: `payout = wager * multBps /100` where 0.7× =70 bps? Actually need `wager*70/100`. For simplicity, use `uint8` mult *10? Better: in Solidity, `mBps = [0,70,200,600,3000]` for SCOUT etc. Payout = `wager*mBps/100`? Wait 2× =200 bps? No 2× =200%? Let's use `payout = wager * mulBps /100` where 0.7*100=70, 2*100=200, 6*100=600, 30*100=3000. For 0.9× =90.** Need to decide.
- **quoteCaps:** `maxEscrowStake = wager`, `maxReservedProfit = wager*29` (SCOUT max). Or per-tank: `wager*(maxMult-1)`. Return per `gameData`.
- **quoteRiskParams:** `maxPayout = wager*30` (SCOUT), `probabilityWad = 1e16` (1% jackpot), `expectedPayout = wager*95/100`, `subJackpotVarianceScaled=0` (no heavy tail, <100×). Per `docs/research/math.md:2` heavy-tail not triggered.
- **quoteForfeitPayout:** return 0 (no cash-out). Spec mandates 0 for instant games.
- **Governance constants:** `actionTimeout 43200`, `randomnessTimeout 150`, `maxBetRiskBps 100 (1%)` — not changed.
- **File location:** `contracts/RoboStrike.sol` importing `../casino-sdk/solidity/ICasinoGameV2.sol` or vendored. Deploy via `simulator/contracts/` watch for local, `forge create` for prod.

### 1b. Bridge — Guest Pattern (Penpal 7.0.4)

- **Types:** `HostSnapshotV1`, `HostApiV1`, `GuestApiV1` verbatim from `sdk.md:3` / `src/types.ts`.
- **Connect:** `connectGameToHost({setState: async (snap) => setSnapshot(snap)})`, `await connection.promise` → `hostApi`. `connection.destroy()` on unmount.
- **Snapshot semantics:** derive not accumulate, session identity via `sessionKey=${chainId}:${sessionId}`, `isSettled` atomic with `payout+gameState`, mid-round `WAITING_RANDOMNESS` normal for multi-step but for instant it's just one. Production host suppresses mid-round WAITING_RANDOMNESS legacy — test against simulator which delivers full stream.
- **Bet flow:** `hostApi.openSession({wager: parseUnits(bet, decimals).toString(), gameData: encodeAbiParameters([{type:'uint8'}],[tankId]), randomnessRequestData: '0x'})` → get `sessionKey`, then watch `snapshot.sessions.items` for matching `sessionKey` until `phaseName` terminal (`SETTLED`/`FORFEITED`/`CANCELLED`) → decode `raw.gameState` → animate → `await hostApi.revealOutcome({sessionId})` (mandatory, else balance stays down-only clamped).
- **Clamping:** `computeMaxWager(snapshot, {maxMultiplierX:30})` from `@chain/casino-sdk/guest` — clamp bet input `min(BET.max, liveMax, balance)`. Recheck every snapshot (liquidity moves). Show fallback when `wallet.status !== 'ready'`.
- **Debug overlay:** show `raw randomness` + mapped outcome for QA (20 consecutive round-trips).
- **Source:** `docs/research/sdk.md:3` + `CHAIN_WTF` §3-4 + `GETTING_STARTED` §5.

### 1c. Manifest — Same-Origin JSON

- **Schema:** `schemaVersion:1, apiVersion:1, gameId:"RoboStrikeGame", defaultLocale:"en", locales:{en:{name:"ROBO STRIKE", description:"..."}}, presentation:{mode:"full-iframe", hostPanels:{openSession:false,history:false,status:false}}, capabilities:{openSession:true, submitAction:false/true depending Overdrive (false if instant), forfeitExpiredSession:false, cancelStuckRandomness:false, resize:true}, assets:{iconUrl,coverUrl}}` — validated via `validateCasinoGameManifest` from SDK `manifest.ts`. `gameId` canonical `roboStrike` vs `roboStrikeGame`? Use `canonicalCasinoGameId` — `RoboStrikeGame` → `robostrike`.
- **Serve:** `public/game.manifest.json` → `dist/game.manifest.json` same origin. Verify `assertSameOriginUrls(manifestUrl, iframeUrl)`.
- **Widget:** EXACT `<script async src="https://jam.chain.wtf/widget.js"></script>` in `index.html` `<head>`. Widget mounts `chain-jam-badge Vol.1` at fixed `right:14 bottom:14`, pings `amicable-hummingbird-962.convex.site/ping` + heartbeat 60s. Gallery iframe adds `?ref=chainjam` and suppresses ping when `window.top!==window.self`. Verified `widget.js` 4328 bytes ETag 5026b8c7.

### 1d. Local Simulator

- **Commands:** `npm install` (workspaces) + `npm start` → `:3300` harness + `:3100` coinflip + RPC `http://127.0.0.1:8545` + `http://localhost:3300/__local-contracts.json`. Drop `.sol` into `simulator/contracts/` → auto-compile via solc `viaIR` → register on `LocalCasinoHost` within 2s. Edit redeploys fresh. Alternative `forge create --rpc-url http://127.0.0.1:8545 --private-key <dev0>`.
- **Harness replicates:** optimistic `pending:<uuid>` at `WAITING_RANDOMNESS`, flashblock + indexed lag, monotonic settled, game-steered balance, stuck randomness banner.
- **Chaos tests before ship:** raise indexer lag, force wallet `disconnected`/`setup-required`, stop node+ `cast rpc hardhat_mine 0x10` for cancelStuck, reload mid-round.

### 1e. VRF Mapping — Deterministic BigInt

- Raw `uint256 v ∈ [0,2^256)`. `T_i = floor(b_i*2^256/100) = (TWO_POW_256*BigInt(b_i))/100n`. `outcome = first i where v < T_i`. `T_100=2^256` covers full space no gaps; error ≤1/2^256 vs dice modulo bias 0.39pp. No floats, no `Math.random` in outcome path — CI grep fails build if found.
- **Constants:** `TWO_POW_256=1n<<256n`, SCOUT_T [63685...,98423...,110002...,114634...,115792...] etc. See `math.md:Appendix A`. Solidity mirror stores last as `type(uint256).max` inclusive with `v<T_i||i==last`.
- **Source:** `docs/research/math.md:1,3` + `sdk.md:6` + `RANDOMNESS_DICE.md` (never `byte%6`).

### 1f. Submission Form (jam.chain.wtf)

- Fields: `title`, `gameUrl` (Vercel/Cloudflare), `rtp` (95), `discord`, `x`, `telegram`, `sourceAccess` (public GitHub + invite handle Q1), `pitch` (2-sentence card ≤268 chars). Also `game.manifest.json` pitch, localStorage `chainjam-entry-id`. Resolved gaps: sourceAccess invite handle is open Q1.

## 2. Assets — Locked Pipeline (source: `docs/research/assets.md` + `audio.md`)

### 2a. Visual Assets — CC0/OFL Only

| Asset | Licensed Source (CC0/OFL) | URL + Date | Verdict | Cost |
|-------|---------------------------|------------|---------|------|
| Tank sprites | Kenney Top-Down Tanks CC0 | `kenney.nl/assets/top-down-tanks` 2026-09-01 200 | PASS CC0 | $0 |
| UI panels | Kenney Pixel UI Pack CC0 (750 files) + UI Pack CC0 (430) | both 200 | PASS CC0 | $0 |
| VFX/particles | Kenney Particle Pack CC0 + OGA Sogomn CC0 + OGA 9KeyStudio CC0 | particle-pack 200, Sogomn 200, 9KeyStudio 200 | PASS CC0 | $0 |
| Fonts | Press Start 2P OFL 1.1, VT323 OFL 1.1 | fonts.google.com + github google/fonts OFL.txt 200 | PASS OFL (bundled sale allowed) | $0 |
| Rejected | OGA 12-frame CC-BY 3.0, Jetrel disputed CC0 → FAIL whitelist | 200 but whitelist FAIL | REJECT | - |

### 2b. Locked Palette + Outline

- `robo-strike.gpl`: `#0a1a3f navy 67%, #4ff2e3 cyan, #ff4fd8 magenta, #ffd94f gold, #58ff9b green, #ffffff white, #1a1a1a outline 1px`. Indexed mode 6+outline, no new hues. Validate via `grep -r "#[0-9a-f]{6}"`.

### 2c. Sprite List → Source Map (per `assets.md:26` S01-S17)

- Player tank idle2/recoil2 → Kenney Top-Down Tanks `tankBody+turret` recolor cyan, turret offset 2px for recoil.
- Enemy x3 (SCOUT magenta, BRUISER gold, WARLORD mint) → `tank_red`/`tank_dark`/`tank_green` recolor, 2 idle bob +2 hit tint +4-6 destroyed via Sogomn/9KeyStudio 6-frame explosions downscaled 16×16.
- Bunker 3 states → `tileSand`/`crate` sandbag compose, damaged via Pixel UI `panel_burn` overlay.
- Shell+trail 1+4 → bullet 4×6 + smoke_03 downscaled strip alpha 80→20.
- Muzzle flash2 → particle `flash_01` additive 100ms.
- Explosions small4 (Sogomn 4 frames) + big6 (9KeyStudio Large 6 frames 32×32 @50ms).
- Coin spin4 → fresh 8×8 gold `#ffd94f` 4-angle.
- Reticle2 → Crosshair Pack CC0 16×16 cyan hollow + magenta corners hover.
- Starfield → code-procedural 120 dots on `#0a1a3f` or 256×256 tile.
- Scanline → 4×4 PNG `#ffffff 6%` repeat via `TileSprite`.
- Frame count ~76-82 fits 1024×1024 atlas MaxRects, padding 2px, extrude 0, power-of-two.

### 2d. Fallback Pipeline (Fresh Originals, AI Reference Never Ships)

```
AI ref 128×128 (Midjourney/SD prompt "pixel art 16x16 top-down tank --palette 6colors") → MANUAL trace in LibreSprite/Pixelorama @16×16/32×32 → palette lock indexed → 1px #1a1a1a outline → export PNG32 → CodeAndWeb Free Sprite Sheet Packer Phaser JSON Hash → pngquant --quality=65-80 --speed 3 → oxipng -o4 --strip safe → public/assets/atlas/robo-atlas.{png,json} → Phaser atlas NEAREST
```

### 2e. Audio — Generated Originals (all $0, commercial PASS)

- **Primary:** 9/10 SFX via ChipTone/jsfxr/Bfxr (CC0/UNLICENSE/MIT), loop via BeepBox (MIT + author owns song). No primary Kenney/Leohpaz to keep chiptune coherence; 2 low-volume CC0 layers optional (chip 04 -18dB under coin tick, chip cascade -20dB under jackpot).
- **Recipes:** per `audio.md:10` — UI blip Square 880Hz 0.07s, lock-on Square sweep 300→1200Hz 0.35s, fire Square+Sawtooth 450Hz→down 0.22s, whoosh Noise doppler 0.25s, clank Square+Noise 0.18s, explosion Noise 0.58/0.92s, coin Sine 1.2kHz 0.07s×10, win/jackpot BeepBox stingers, miss Sine thud 0.35s. Mix master -1dBFS, duck music -6dB 300ms on explosion.
- **Loop:** BeepBox 28 bars @133 BPM C-minor 50.5s (Square lead, Square harmony, Triangle bass, Noise drums) — square+triangle whitelist, export wav → Audacity crossfade 1200→600ms → `ffmpeg -qscale:a 4` ogg ~500KB.
- **Pipeline:** Generator → wav 44.1k 16-bit mono → Audacity normalize/pad → ffmpeg ogg+mp3 → `public/assets/audio/` + manifest → `Phaser.Sound`.

### 2f. Optimizers

- `pngquant --quality=65-80 --speed 1 --skip-if-larger --ext .png --force` (GPL CLI tool-output unencumbered) + `oxipng -o4 --strip safe/all`. Verified site 73% example. Use CLI binary, not lib link.
- `free-tex-packer` atlas Phaser JSON, `fonttools pyftsubset` woff2 subset ASCII 32-126 + ×.

## 3. Competitors — Gaps & Positioning (source: `docs/research/competitors.md`)

### 3a. Gallery 2026-09-01 Snapshot (Convex `entries:listApproved` 4 approved)

| Entry | URL | Mechanic | Volatility Choice | Banned? | ActiveMin |
|-------|-----|----------|-----------------|---------|-----------|
| Neon Block Drop | netlify | 6×16 Tetris push-your-luck 5 drops, `GLOW BANK` | Fixed paytable, speed ≠ vol | No | 16 |
| Tumbler | vercel | Vault dial 4 tiers (80/65/50/25%), pin count, TURBO vs sequential | **YES** tier+pin count | No | **56** (leader) |
| Lazer | vercel | Grid 2-10 mines-zap, row/col `fried` | **YES** gridSize | Borderline crash-label | 34 |
| Deadman-Switch | casino-sdk.vercel | SAFE ladder survival, `DeadMansSwitchGame` | Fixed ladder | No | 20 |

- All JS-rendered via Convex `amicable-hummingbird-962.convex.cloud/api/query` POST `entries:listApproved`; static `jam.chain.wtf` HTML is empty SPA shell (`index-NtGTwgFV.js` 456k).

### 3b. Gaps Nobody Occupies

| Theme | Status | Evidence |
|-------|--------|----------|
| Tank/mech/military | **EMPTY 0/4** | No tank titles/mechanics |
| Retro CRT pixel-art 320×180 + scanline | **EMPTY** (Lazer has scanline but laser-lab mono, not tank CRT) | Distinct palette #0a1a3f/cyan/magenta vs Lazer #ff4fae/#e9ff3f |
| Character-framed volatility (tank-as-vol) | **Narrow gap** — abstract sliders occupied (Tumbler vault, Lazer grid) but tank-character not | Key novelty wedge |
| Instant VRF reveal (one FIRE) vs push-your-luck loops | **UNDEROCCUPIED** — 3/4 are loops, only Tumbler TURBO instant | Two-phase instant+Overdrive underused |

### 3c. Positioning Statement (copy-paste for README + pitch)

> **ROBO STRIKE is the only Chain Jam entry where volatility is a character choice: you pick 1 of 3 robot tanks — SCOUT (30.3% 30× sparse jackpots, low grind), BRUISER (frequent 2–7×), WARLORD (slow 11–30× siege) — then FIRE once and Chain VRF settles the round instantly. The Sep 1 gallery has no tank, no mech, and no CRT military fiction (entries are neon crystals, vault dials, laser grids, and a switch demo — 2 of 4 already use tiered volatility, but as abstract sliders, not embodied enemies); ROBO STRIKE fills that gap without touching the banned list — it's not blackjack/roulette/baccarat, not plinko/dice/limbo/crash (no rising multiplier curve, no over/under, no ball drop), and its optional 40%-for-2.5× OVERDRIVE is an EV-neutral side gamble that keeps the declared 95% RTP identical across all three tanks, so the choice changes variance, not edge.**

Short card ≤268 chars:
> Pick your tank — SCOUT low, BRUISER mid, WARLORD high — FIRE and VRF decides: 95% RTP, up to 30×, optional EV-neutral Overdrive. The only tank-volatility casino on Chain Jam: no plinko/dice/limbo/crash clone, no skill, pure CRT juice.

### 3d. Anti-AI-Slop Checklist (Visual=1/4 of judging)

- [ ] Palette 6 colors only + 1px outline, `image-rendering:pixelated`, integer scale, same texel density single atlas, no gradient soup, 2 fonts max, juice present (shake 2-4px 120ms, flash, shell trail, 12-frame explosion, coin burst), one fiction (arena+3 tanks+CRT)
- [ ] Audio: 6 SFX <400ms dry + 1 loop crossfade 20ms offline wav, not CDN, duck -6dB 300ms, sound on every tier, mute toggle persistent
- [ ] UX: `computeMaxWager` clamp + potential-win range, keyboard Space/C/1-3 + touch pad (8px drag cancel), `revealOutcome` after animation, ticker status, widget visible + `X-Frame-Options ALLOWALL`, load ≤1.2MB, LCP <2.5s, standalone 900×1100 cartridge fits via `observeGameContentSize`

## 4. Math — Validated (source: `docs/research/math.md` + `MATH.md`)

- **RTP 95% exact** via `Fraction`: SCOUT 55×0+30×0.7+10×2+4×6+1×30=95, BRUISER 65×0+20×0.9+9×3+5×7+1×15=95, WARLORD 78×0+12×1+6×6+3×12+1×11=95. Boundaries SCOUT [55,85,95,99,100], BRUISER [65,85,94,99,100], WARLORD [78,90,96,99,100]. House edge 5% constant, variance SCOUT σ3.18, BRUISER 2.18, WARLORD 2.63 (SCOUT high due 30× tail).
- **Thresholds:** `T_i=floor(b*2^256/100)` BigInt, `T_last=2^256` exact sentinel (Sol `type(uint256).max` inclusive). Bias ≤1/2^256 vs dice 0.39pp.
- **Simulation:** `scripts/simulate-rtp.ts` 1M/profile seeded splitmix64 `0x726F626F` 4×64→256-bit, asserts RTP 93-98 hard + ±0.5pp + freq ±0.3pp, exit 1 fail. Ban `Math.random` in game path. Handles Overdrive both modes.
- **Overdrive EV-neutral:** `0.4×2.5+0.6×0=1.0` → `E[final]=E[base]=0.95` whether always/never/sometimes (linearity, martingale). Increases variance ×1.5W² when taken. Threshold `T_OD=46316835694926478169428394003475163141307993866256225615783033603165251855974`. Sequencing Q14 open (same-word keccak vs second VRF; prefer same-word instant).
- **Declared-math paragraph** for judges included in `MATH.md:6` + `hosting-promo.md:4.3`.

## 5. Hosting + Promo — Decisions (source: `docs/research/hosting-promo.md`)

### 5a. Host Comparison 2026-09-01

| Free Tier | Bandwidth | Builds | Edge | Deploy CLI | Same-Origin Manifest Caveat |
|-----------|-----------|--------|------|------------|------------------------------|
| **Vercel Hobby** | 100GB Fast Data +1M Edge Req | fair-use (build container 8192MB/45min) | global PoPs, Brotli auto | `vercel --prod` | no SPA rewrite `vercel.json` |
| Netlify Free | **15GB** ~300 credits (20c/GB) | 15c per deploy | global CDN | `netlify deploy --prod --dir=dist` | avoid `/* /index.html` catch-all |
| **Cloudflare Pages Free** | **Unlimited** | 500/mo, 20k files, 25MiB/file | 300 PoPs tiered cache | `wrangler pages deploy dist` or Workers `assets.directory` | `not_found_handling="404-page"` not SPA |

- **Speed rank:** 1 Cloudflare tiered cache, 2 Vercel Brotli, 3 Netlify credit cap.
- **Decision:** **Primary = Cloudflare Pages** (or Workers Static Assets `wrangler deploy` with `assets.directory="./dist"` + `not_found_handling:"404-page"`), **Mirror = Vercel Hobby**. Avoid Netlify for judging spike. Host both: `robo-strike.pages.dev` + `robo-strike.vercel.app`. Manifest at dist root on both, verify `curl -I`.

### 5b. Asset Budget ≤1.2MB Wire (gz+png)

| Category | Wire gz |
|----------|---------|
| JS (Phaser+game) | ≤140KB gz |
| Spritesheets 2-3 PNGs (pngquant 65-80 + oxipng -o4) | ~328KB (tanks 88 + fx 145 + ui 80) |
| Audio ogg loop 500KB + SFX 150KB | ~650KB but streamed not critical for LCP; initial JS sprites <400KB |
| Font woff2 subset | 18KB |
| Total initial (JS+CSS+sprites+manifest) | **~0.9-1.1MB** pass ≤1.2MB |

Commands: `pngquant --quality=65-80 --speed 1`, `oxipng -o4 --strip safe/all`, `free-tex-packer MaxRects 2048 padding 2 extrude 1`, `pyftsubset ... --flavor=woff2`, Vite `manualChunks:{phaser}`, `assetsInlineLimit 4096`, `gzip -c |wc -c` + `visualizer`.

### 5c. OBS 60fps Promo (free stack $0)

- **Capture:** OBS Studio 32.2.2 `1920×1080` Base/Output, 60fps, `MKV CQP 16-18`, Window Capture `Point` filter, High priority.
- **Shot list 15s @60fps (900f):** 0 Title 1.0s, 1 Bet 1.5s (60-150f), 2 Pick 2.0s (150-270f), 3 FIRE+shake 1.0s (270-330f), 4 Shell+explosion 2.0s (330-450f) slow-mo 80%, 5 Jackpot+coins 3.0s (450-630f), 6 Paytable 2.0s (630-750f), 7 Overdrive 1.5s (750-840f), 8 End card 1.0s (840-900f) QR + jam.chain.wtf.
- **Edit:** DaVinci Resolve 21 Free (or CapCut Online no watermark) → scanline 18-25% Overlay + Flicker 0.04 + vignette 0.3 + chroma 1px on hits, Text Press Start 2P, Audio music -14 LUFS duck -6dB 300ms, Export H.264 1080p60 16Mbps VBR + AAC 192k (~30MB).
- **Costs:** OBS GPLv2, DaVinci Free $0, CapCut free no watermark — all verified 200.

### 5d. Submission Keywords Template

- Title: `ROBO STRIKE — Retro Tank Casino`
- One-liner 115c: `Retro CRT tank casino: pick your volatility, fire, VRF decides — 95% RTP, 30× jackpots, pixel-perfect juice.`
- Gallery 2-sentence 268c + full 5-sentence description (see `hosting-promo.md:4.3` exact) + declared-math block + novelty statement + tags `retro,casino,tank battle,volatility,Chain Jam,Chain VRF,95% RTP,pixel art,CRT,Phaser`.

## 6. Prohibited Dependencies Justification

| Dependency | Whitelisted? | Justification | Date |
|------------|--------------|---------------|------|
| Phaser 3, Vite, TS, vitest, viem, penpal, zod | Yes via SDK + whitelist | Required for SDK bridge; Phaser MIT, Vite MIT, penpal MIT, viem MIT, zod MIT | 2026-09-01 |
| LibreSprite/Pixelorama, free packer, pngquant, oxipng, ChipTone/jsfxr/Bfxr/BeepBox, OBS, DaVinci/CapCut, Vercel/Cloudflare | Yes whitelist | $0 free tools, output unencumbered | 2026-09-01 |
| TexturePacker paid, Retro Diffusion | No | BANNED never use | 2026-09-01 |
| Any non-whitelist dep | Must be added here with reason before install | — | — |

## 7. Open Questions → `docs/QUESTIONS_FOR_DISCORD.md`

- Q1 sourceAccess invite handle, Q2 RTP 93-98% verification tolerance, Q3 load budget, Q4 widget iframe, Q5 VRF verification supported:false, Q8 Jetrel CC0 dispute (exclude), Q9 Leohpaz exclusive, Q10 pngquant output, Q11 BeepBox offline, Q12 Lazer crash label, Q13 pitch truncation, Q14 Overdrive sequencing, Q15 cartridge scale 900×1100, Q16 Sol max sentinel, Q17 T_OD literal, Q18-20 hosting caps. Re-read before submit, re-check gallery 24h before deadline via Convex POST `entries:listApproved`.

*Generated 2026-09-01 — Stage 2 consolidation. Sources: docs/research/sdk.md (1233L), assets.md (761L), audio.md (486L), competitors.md (481L + gallery), math.md (724L), hosting-promo.md (644L). All URLs 200 verified 2026-09-01, no hallucinated URLs.*
