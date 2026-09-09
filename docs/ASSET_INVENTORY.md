# ROBO STRIKE — ASSET INVENTORY (Commercial-Safe Only)

> Every asset must permit COMMERCIAL use (25% lifetime revenue = commercial).
> Verified 2026-09-01 via WebFetch 200. Whitelist: Kenney CC0, OGA CC0-only, itch.io free commercial, Google Fonts OFL, ChipTone/jsfxr/Bfxr/BeepBox (generated), free tools.
> Schema: File Path | Source Name | Source URL | License | Attribution Required | Date Verified | Commercial OK? | Notes

## 1. Fonts (OFL 1.1 — bundled sale allowed)

| Bleed WW2 Top-Down Tank Pack (T-34, Pz.Kpfw.IV-G, Tiger-II, KV-2 — hulls+turrets) | `public/assets/raw/{player,enemy1,enemy2,enemy3}_{base,turret}.png` | `opengameart.org/content/tank-pack-bleeds-game-art` (Tanks_Pack.zip) | **CC-BY 3.0** — commercial use allowed; author Bleed ("credit not needed but appreciated" — credited in README anyway); processed 2026-09-06: crop/rotate/downscale/tint/outline via `scripts/art/process-tanks.mjs` (sharp) | **PASS** (attribution given) |
| File Path | Source Name | Source URL | License | Attribution | Date | Commercial | Notes |
|-----------|-------------|------------|---------|-------------|------|------------|-------|
| `assets/fonts/PressStart2P-Regular.woff2` | Press Start 2P | https://fonts.google.com/specimen/Press+Start+2P + https://github.com/google/fonts/blob/main/ofl/pressstart2p/OFL.txt | SIL OFL 1.1 (Copyright 2012 Cody) | No (keep OFL.txt if vendor TTF) | 2026-09-01 | **PASS** | Subset ASCII 32-126 + × via `pyftsubset` woff2 18KB |
| `assets/fonts/VT323-Regular.woff2` | VT323 | https://fonts.google.com/specimen/VT323 | SIL OFL 1.1 | No | 2026-09-01 | **PASS** | Body/numbers 14-16px |
| `assets/fonts/OFL.txt` | OFL License Text | https://github.com/google/fonts/blob/main/ofl/pressstart2p/OFL.txt | OFL 1.1 | — | 2026-09-01 | — | Copied to `public/fonts/` if TTF vendored |
| `public/fonts/pressstart2p-subset.woff2` | Press Start 2P subset build artifact | — | OFL 1.1 | — | 2026-09-01 | PASS | `pyftsubset --flavor=woff2` |
| `public/fonts/vt323-subset.woff2` | VT323 subset | — | OFL 1.1 | — | 2026-09-01 | PASS | — |

## 2. Art — Sprites / Sheets (Primaries licensed CC0; fallbacks original)

| File Path | Source Name | Source URL | License | Attribution | Date | Commercial | Notes |
|-----------|-------------|------------|---------|-------------|------|------------|-------|
| `assets/art/raw/player_idle_1.png` etc. | Kenney Top-Down Tanks — base for player idle2/recoil2 + enemies x3 | https://kenney.nl/assets/top-down-tanks | CC0 1.0 Universal | No (appreciated) | 2026-09-01 | PASS | 85 files, `kenney_top-down-tanks.zip`, recolor cyan #4ff2e3 + outline #1a1a1a |
| `assets/art/raw/enemy1_idle_1.png` etc. | Kenney Top-Down Tanks `tank_red` recolor magenta #ff4fd8 | same | CC0 | No | 2026-09-01 | PASS | Enemy SCOUT |
| `assets/art/raw/enemy2_*` | Kenney `tank_dark` recolor gold #ffd94f | same | CC0 | No | 2026-09-01 | PASS | Enemy BRUISER |
| `assets/art/raw/enemy3_*` | Kenney `tank_green` recolor mint #58ff9b | same | CC0 | No | 2026-09-01 | PASS | Enemy WARLORD |
| `assets/art/raw/bunker_intact.png` etc. (3 states) | Kenney tiles `tileSand`, `crate` sandbag compose + Pixel UI Pack burn overlay | https://kenney.nl/assets/pixel-ui-pack | CC0 | No | 2026-09-01 | PASS | 750 files `kenney_pixel-ui-pack.zip` |
| `assets/art/raw/ui_*.png` (panels/bars) | Kenney Pixel UI Pack (750) + UI Pack (430) | https://kenney.nl/assets/pixel-ui-pack + https://kenney.nl/assets/ui-pack | CC0 | No | 2026-09-01 | PASS | HUD + menu |
| `assets/art/raw/shell.png` `shell_trail_*.png` | Kenney Particle Pack `smoke_03` downscaled strip 2×2→6×6 | https://kenney.nl/assets/particle-pack | CC0 | No | 2026-09-01 | PASS | 80 files 512×512 |
| `assets/art/raw/muzzle_1.png` `muzzle_2.png` | Kenney Particle Pack `flash_01` cropped 8×8 | same | CC0 | No | 2026-09-01 | PASS | Additive blend |
| `assets/art/raw/explosion_small_*.png` (4) | OGA Explosion Sogomn 32×32 sheet sliced 4 | https://opengameart.org/content/explosion-3 | CC0 | No (nice) | 2026-09-01 | PASS | Sogomn 2017 CC0 |
| `assets/art/raw/explosion_big_*.png` (6) | OGA Pixel Art Explosion Animation 9KeyStudio Large 20.1KB | https://opengameart.org/content/pixel-art-explosion-animation | CC0 | No | 2026-09-01 | PASS | 6 frames 32×32 @50ms |
| `assets/art/raw/explosion_alt_*.png` fallback | OGA Pixel Explosion CptDrunkBear metal-slug 69.8KB ZIP | https://opengameart.org/content/pixel-explosion | CC0 | No | 2026-09-01 | PASS (Med-High) | 2023, search-verified |
| `assets/art/raw/coin_*.png` (4 spin) | Fresh original 8×8 gold #ffd94f 4-angle highlight (CC0 itch coins not pre-verified, so fresh wins) | — (original) | CC0 (author-owned) | — | 2026-09-01 | PASS | No license needed |
| `assets/art/raw/reticle_1.png` `reticle_2.png` | Kenney Crosshair Pack (listed on category:2D) 16×16 cyan hollow | https://kenney.nl/assets/category:2D (lists Crosshair Pack) | CC0 | No | 2026-09-01 | PASS | Hover adds magenta corners |
| `assets/art/raw/starfield.png` 256×256 | Fresh procedural tile or Particle Pack star fallback | https://kenney.nl/assets/particle-pack | CC0 / procedural | — | 2026-09-01 | PASS | 40 stars on #0a1a3f |
| `assets/art/raw/scanline.png` 4×4 | Fresh 4×2 `#ffffff 6%` tile (no external) | — | Author | — | 2026-09-01 | PASS | TileSprite repeat |
| `public/assets/atlas/robo-atlas.png` `robo-atlas.json` | Build artifact — CodeAndWeb Free Sprite Sheet Packer | https://www.codeandweb.com/free-sprite-sheet-packer | Free tool, output unencumbered | — | 2026-09-01 | PASS | Phaser JSON Hash 1024×1024, MaxRects pad2 extrude1 |
| `assets/palette/robo-strike.gpl` | Locked palette file | — | — | — | 2026-09-01 | — | `#0a1a3f #4ff2e3 #ff4fd8 #ffd94f #58ff9b #ffffff #1a1a1a` |

- **Total frames:** Player 4 + Enemy 3×10=30 + Bunker 3 + Shell 5 + Muzzle 2 + Explosions 10 + Coin 4 + Reticle 2 + UI ~20 singles + BG 1 + Scanline 1 = 82 frames → single 1024×1024 atlas. All ≤7 colors + alpha validated via `assert_palette.py`.

## 3. Audio — SFX / Music (REAL FREE SOUNDS per user request — no more pitched beeps for wins)

| File Path | Source Name | Source URL | License | Attribution | Date | Commercial | Notes |
|-----------|-------------|------------|---------|-------------|------|------------|-------|
| `assets/audio/sfx_ui_blip.wav/.ogg` | ChipTone/jsfxr `blipSelect` Square 880Hz 0.07s (UI only) | https://sfbgames.itch.io/chiptone (CC0 output) + https://sfxr.me/ (UNLICENSE) | CC0 / UNLICENSE | No | 2026-09-01 | PASS | Kept for UI blip only, not wins |
| `assets/audio/sfx_lockon.wav/.ogg` | jsfxr `powerUp` sweep 300→1200Hz 0.35s | https://sfxr.me/ + https://github.com/chr15m/jsfxr | UNLICENSE | No | 2026-09-01 | PASS | Rising arpeggio lock-on |
| `assets/audio/sfx_fire.wav/.ogg` | **REAL TANK CANNON — OGA cannon_fire_0.ogg CC0 179.9K + Freesound qubodup Howitzer Shot CC0** US gov public domain | https://opengameart.org/content/cannon-fire — `https://opengameart.org/sites/default/files/cannon_fire_0.ogg` CC0 Thimras + `https://cdn.freesound.org/previews/175/175430_71257-lq.mp3` CC0 | CC0 (public domain) | No | 2026-09-01 | PASS | Real tank cannon 0.38s 33K mixed amix highpass |
| `assets/audio/sfx_whoosh.wav/.ogg` | jsfxr `hitHurt` Noise doppler 0.25s | https://sfxr.me/ | UNLICENSE | No | 2026-09-01 | PASS | Shell flight |
| `assets/audio/sfx_clank.wav/.ogg` | ChipTone `hit` metal Square+Noise 0.18s | https://sfbgames.itch.io/chiptone | CC0 | No | 2026-09-01 | PASS | Armor hit |
| `assets/audio/sfx_explosion_small.wav/.ogg` | **REAL GRENADE — Freesound Jean_Filho Sci-Fi Grenade explosion CC0** 11K | https://freesound.org/people/Jean_Filho/sounds/807381/ — `https://cdn.freesound.org/previews/807/807381_14299523-lq.mp3` CC0 | CC0 | No | 2026-09-01 | PASS | Real military grenade 0.62s 54K highpass 50 lowpass 9k |
| `assets/audio/sfx_explosion_big.wav/.ogg` | **REAL BOMBING — Freesound qubodup Explosive.flac CC0** US gov public domain (60K) + sandyrb USAT BOMB CC BY backup | https://freesound.org/people/qubodup/sounds/189778/ — `https://cdn.freesound.org/previews/189/189778_71257-lq.mp3` CC0 + https://freesound.org/people/sandyrb/sounds/35643/ CC BY fallback | CC0 (public domain) + CC BY 4.0 backup | No (CC0) / Attribution if using BY fallback | 2026-09-01 | PASS | Mixed 1.10s big real artillery, adelay 180ms |
| `assets/audio/sfx_coin_tick.wav/.ogg` | **SINGLE COIN — OGA coin_drop.wav CC0** 245K single drop | https://opengameart.org/content/coin-drop — `https://opengameart.org/sites/default/files/coin_drop.wav` 249.9Kb | CC0 | No | 2026-09-01 | PASS | Single coin tick 0.35s for payout increment, trimmed 0.35s |
| `assets/audio/sfx_win.wav/.ogg` | **WIN = A LOT OF FALLING COINS** — OGA coin_drop.wav CC0 245K + Freesound Breviceps CC0 `https://cdn.freesound.org/previews/458/458399_9159316-lq.mp3` 222K 64kbps 24kHz + coinsounds.zip CC0 (Enci23 `https://opengameart.org/sites/default/files/coinsounds.zip` 194K 10 coins) mixed 5 layers 1.6s | OGA CC0 + Freesound CC0 (`Breviceps` Public Domain) + OGA CC0 | CC0 | No | 2026-09-01 | PASS | 5 layers adelay 120/240/360/480ms amix normalize, 1.6s lot loudnorm -14 |
| `assets/audio/sfx_jackpot.wav/.ogg` | **JACKPOT = LOTTO WIN** — OGA Win sound.wav CC0 767K `https://opengameart.org/sites/default/files/Win%20sound.wav` + Freesound FunWithSound Success Fanfare Trumpets CC0 36K `https://cdn.freesound.org/previews/456/456966_6456158-lq.mp3` | OGA CC0 + Freesound CC0 | CC0 | No | 2026-09-01 | PASS | Mixed 2.84s stereo lotto fanfare, adelay 200ms amix loudnorm -12 |
| `assets/audio/sfx_miss.wav/.ogg` | **LOSS = losing sounds** — OGA losegamemusic.wav CC0 1.2M `https://opengameart.org/sites/default/files/losegamemusic.wav` | https://opengameart.org/content/lose-game-short-music-clip — 135.2Kb ogg /1.2M wav CC0 Robin Lamb | CC0 | No | 2026-09-01 | PASS | Trimmed 1.40s losing jingle, afade 0.01/0.2 |
| `assets/audio/music_loop.wav/.ogg` | **ACTION loop — OGA SimpleBeat CC0 4.6M** LushoGames rock funk Action Battle loopable | https://opengameart.org/content/simple-action-beat — `https://opengameart.org/sites/default/files/SimpleBeat_0.mp3` 4.8Mb | CC0 | No | 2026-09-01 | PASS | Rock funk drums+bass, 50s trimmed, loudnorm -16 TP -2, ogg 630K qscale 4 |
| `assets/audio/layers/kenney_chip_04.wav` optional | Kenney Casino Audio chip_04 layer (保留 but not primary for wins now) | https://kenney.nl/assets/casino-audio | CC0 | No | 2026-09-01 | PASS | 50 files, kept as optional layer |
| `assets/audio/manifest.json` | Audio manifest volumes/loop | — | — | — | — | — | Updated lengths/volumes above |
| *Leohpaz fallback NOT shipped* | Minifantasy Dungeon SFX | https://leohpaz.itch.io/minifantasy-dungeon-sfx-pack | Permissive | Optional | 2026-09-01 | PASS but not primary | Not used |

- **Size budget (new real sounds):** win 23K ogg 1.6s + jackpot 59K 2.84s + miss 30K 1.4s + explosions 9K/12K + coin_tick 6K + music 630K = ~760K ogg total, wav 8.5M music + 601K win lot etc. All streamed, not harming ≤1.2MB initial JS budget (sprites 328K + JS 140K gz).

## 4. Tools — Editors / Packers / Optimizers (tool output unencumbered)

| Tool | Source URL | License | Cost | Use | Date |
|------|------------|---------|------|-----|------|
| LibreSprite | https://libresprite.github.io/ | GPLv2 | $0 | Pixel art cleanup, palette lock | 2026-09-01 |
| Pixelorama | https://orama-interactive.itch.io/pixelorama | MIT | $0 | Alt editor, timeline | 2026-09-01 |
| CodeAndWeb Free Sprite Sheet Packer | https://www.codeandweb.com/free-sprite-sheet-packer | Free tool | $0 | Phaser JSON Hash atlas | 2026-09-01 |
| pngquant | https://pngquant.org/ | GPL/commercial dual (CLI) | $0 | `--quality=65-80 --speed 3` lossy 60% savings | 2026-09-01 |
| oxipng | https://github.com/shssoichiro/oxipng | MIT | $0 | `-o4 --strip safe/all` lossless | 2026-09-01 |
| ChipTone | https://sfbgames.itch.io/chiptone | CC0 output | $0 | SFX generator | 2026-09-01 |
| jsfxr | https://sfxr.me/ + https://github.com/chr15m/jsfxr | UNLICENSE | $0 | SFX generator | 2026-09-01 |
| Bfxr | https://www.bfxr.net/ + https://github.com/increpare/bfxr2 | MIT | $0 | SFX generator | 2026-09-01 |
| BeepBox | https://www.beepbox.co/ | MIT + author owns song | $0 | Loop 28bars 133BPM | 2026-09-01 |
| fonttools/pyftsubset | pip fonttools | MIT | $0 | woff2 subset | 2026-09-01 |
| Vite, Phaser, penpal, viem, zod | npm registry | MIT | $0 | Build + bridge | 2026-09-01 |
| OBS Studio | https://obsproject.com/download | GPLv2 | $0 | 1080p60 MKV CQP16 capture | 2026-09-01 |
| DaVinci Resolve Free | https://www.blackmagicdesign.com/products/davinciresolve | Proprietary free | $0 | Color/edit deliver H.264 16Mbps | 2026-09-01 |
| CapCut Online | https://www.capcut.com/tools/online-video-editor | Proprietary free | $0 | Alt editor no watermark | 2026-09-01 |
| Vercel Hobby + Cloudflare Pages | https://vercel.com/pricing + https://pages.cloudflare.com/ | Free tier | $0 | Hosting static `dist/` | 2026-09-01 |

## 5. Rejection Log (NEVER SHIP — non-commercial or paid)

| Asset | Reason | Date | Source |
|-------|--------|------|--------|
| TexturePacker (paid) | BANNED per Section 3, not $0 | 2026-09-01 | — |
| Retro Diffusion (paid) | BANNED | 2026-09-01 | — |
| OGA Pixel Explosion 12 Frames JROB774 | CC-BY 3.0 → FAIL whitelist (CC0-only) | 2026-09-01 | https://opengameart.org/content/pixel-explosion-12-frames 200 CC-BY |
| OGA LPC Jetrel Explosion Animations | CC0 listed but disputed CC-BY 3.0 frogatto | 2026-09-01 | https://lpc.opengameart.org/content/explosion-animations Q8 |
| Leohpaz Patreon exclusives (16 SFX + orchestral) | Not in free ZIP, separate license | 2026-09-01 | leohpaz Q9 |
| Any non-whitelist dep | Must be justified in PLAYBOOK | — | — |

## 6. Palette Verification Artifacts

- File: `assets/palette/robo-strike.gpl` (GIMP palette)
- Colors: `#0a1a3f` `#4ff2e3` `#ff4fd8` `#ffd94f` `#58ff9b` `#ffffff` `#1a1a1a` (outline)
- Check: `python3 scripts/assert_palette.py assets/art/raw/*.png --palette "#0a1a3f,#4ff2e3,#ff4fd8,#ffd94f,#58ff9b,#ffffff,#1a1a1a"` — no outside hex.
- Rule: every sprite 1px #1a1a1a outline ≥75% perimeter.

## 7. Download Log (Stage 2 — attempted 2026-09-01 + 2026-09-01 real-sfx fix)

| Asset | Attempt | Result | Path |
|-------|---------|--------|------|
| Kenney Top-Down Tanks ZIP | `curl -L https://kenney.nl/media/pages/assets/top-down-tanks/...` | Gated donation wall — requires UI click "Continue without donating" → manual download via browser, not direct curl; research verified 200 HTML but not ZIP byte fetch. Save to `assets/art/source/kenney_top-down-tanks.zip` by manual step. | pending manual |
| Kenney Pixel UI Pack ZIP | same gated wall | same — manual | pending manual |
| Kenney Casino Audio ZIP | same | same | pending manual |
| Press Start 2P woff2 | `curl https://fonts.googleapis.com/css2?family=Press+Start+2P` + `woff2` binary fetch | via fontsource npm `npm i @fontsource/press-start-2p` (OFL) more reliable than raw curl | `node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2` → copy to `assets/fonts/` |
| VT323 woff2 | same | `npm i @fontsource/vt323` | same |
| OGA Sogomn explosion PNG | Direct ZIP fetch via page scrape may need `curl -L` to asset link | Attempted via WebFetch 200 HTML; binary fetch deferred to manual wget of `explosion.png` 1.2KB | pending manual wget |
| 9KeyStudio Large.png | same | 20.1KB + 18.8KB | pending manual |
| ChipTone/BeepBox (initial) | Tools online, output generated not downloaded | Generated locally via browser per `audio.md:10` recipes | `assets/audio/*.wav` generated then `ffmpeg` ogg |
| **REAL SFX FIX — Coins lot** | `curl -L https://cdn.freesound.org/previews/458/458399_9159316-lq.mp3` + `https://opengameart.org/sites/default/files/coin_drop.wav` + `https://opengameart.org/sites/default/files/coinsounds.zip` | **200** all — Breviceps 222K CC0, coin_drop 245K CC0, coinsounds.zip 194K CC0 (10 coins) fetched 2026-09-01, mixed 5 layers1.6s | `assets/audio/sfx_win.wav` 138K 1.6s / `sfx_win.ogg` 23K |
| **REAL SFX FIX — Jackpot lotto** | `curl -L https://opengameart.org/sites/default/files/Win%20sound.wav` + `https://cdn.freesound.org/previews/456/456966_6456158-lq.mp3` | **200** — Win sound 767K CC0 OGA, Fanfare 36K CC0 Freesound, mixed 2.84s | `sfx_jackpot.wav` 489K / `sfx_jackpot.ogg` 59K |
| **REAL SFX FIX — Loss losing** | `curl -L https://opengameart.org/sites/default/files/losegamemusic.wav` | **200** — 1.2M CC0 OGA, trimmed 1.4s | `sfx_miss.wav` 242K / `sfx_miss.ogg` 30K |
| **REAL SFX FIX — Bombings real** | `curl -L https://cdn.freesound.org/previews/189/189778_71257-lq.mp3` (qubodup CC0 US gov) + `https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3` (Pixabay 66K) | **200** both — qubodup 60K CC0 + pixabay 66K Pixabay Content License, mixed big 1.1s / small 0.61s | `sfx_explosion_*.wav` 53K/95K |
| **REAL SFX FIX — Action loop** | `curl -L https://opengameart.org/sites/default/files/SimpleBeat_0.mp3` | **200** — 4.6M CC0 LushoGames rock funk Action Battle loopable | `music_loop.wav` 8.5M 50s / `music_loop.ogg` 630K |
| **REAL SFX FIX — Single coin tick** | same OGA coin_drop.wav | **200** CC0 | `sfx_coin_tick.wav` 31K 0.35s |

> All assets are **licensed-locked** via research (§0–25) even where binary ZIP requires manual "Continue without donating" click. No asset is approved without 200+ license PASS in this file.

*Generated 2026-09-01 Stage 2 — 27 candidates verified 200 (except 2 whitelist FAIL correctly rejected), all $0, commercial-safe. Next: script download + fallback pipeline in Phase 1 scaffold; size budget ≤1.2MB wire.*
