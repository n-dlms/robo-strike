# ROBO STRIKE: asset inventory

<div align="center">

[![Commercial safe](https://img.shields.io/badge/COMMERCIAL-SAFE-58ff9b?style=for-the-badge)](ASSET_INVENTORY.md)
[![CC-BY 3.0](https://img.shields.io/badge/CC--BY-3.0_TANKS-ffd94f?style=for-the-badge)](ASSET_INVENTORY.md)
[![CC0 audio](https://img.shields.io/badge/AUDIO-CC0-4ff2e3?style=for-the-badge)](ASSET_INVENTORY.md)
[![OFL fonts](https://img.shields.io/badge/FONTS-OFL_1.1-white?style=for-the-badge)](ASSET_INVENTORY.md)

*Every asset in this game permits commercial use. One exception is credited
below (tank sprites, CC-BY 3.0). Everything else is CC0, SIL OFL 1.1,
public domain, or original work by the author.*

</div>

---

## 1. Tank sprites (CC-BY 3.0, attributed)

| File | Source | License | Attribution | Notes |
|------|--------|---------|-------------|-------|
| `public/assets/raw/{player,enemy1,enemy2,enemy3}_{base,turret}.png` | Bleed WW2 top-down tank pack: T-34, Pz.Kpfw.IV-G, Tiger-II, KV-2, hulls and turrets (`opengameart.org/content/tank-pack-bleeds-game-art`) | **CC-BY 3.0** (commercial use allowed) | "Tanks" by Bleed, CC-BY 3.0, modified; credited in README | Processed 2026-09-06: crop, rotate, downscale, tint, outline via `scripts/art/process-tanks.mjs` |

---

## 2. Fonts (OFL 1.1)

| File | Source | License | Attribution | Notes |
|------|--------|---------|-------------|-------|
| `assets/fonts/PressStart2P-Regular.woff2` | Press Start 2P ([Google Fonts](https://fonts.google.com/specimen/Press+Start+2P)) | SIL OFL 1.1 (Copyright 2012 Cody) | None (keep OFL.txt if TTF vendored) | Subset ASCII 32-126 via `pyftsubset`, woff2 18KB |
| `assets/fonts/VT323-Regular.woff2` | VT323 ([Google Fonts](https://fonts.google.com/specimen/VT323)) | SIL OFL 1.1 | None | Body and numbers at 14-16px |
| `assets/fonts/OFL.txt` | OFL license text | OFL 1.1 | N/A | Copied to `public/fonts/` if TTF vendored |
| `public/fonts/pressstart2p-subset.woff2` | Press Start 2P subset (build artifact) | OFL 1.1 | N/A | Built with `pyftsubset --flavor=woff2` |
| `public/fonts/vt323-subset.woff2` | VT323 subset (build artifact) | OFL 1.1 | N/A | Built with `pyftsubset --flavor=woff2` |

---

## 3. Art: sprites and sheets (CC0 primaries, original fallbacks)

| File | Source | License | Notes |
|------|--------|---------|-------|
| `assets/art/raw/player_idle_1.png` etc. | Kenney Top-Down Tanks ([kenney.nl](https://kenney.nl/assets/top-down-tanks)) | CC0 1.0 Universal | 85 files, recolor cyan `#4ff2e3` with `#1a1a1a` outline |
| `assets/art/raw/enemy1_idle_1.png` etc. | Kenney Top-Down Tanks, `tank_red` recolor magenta `#ff4fd8` | CC0 | Enemy SCOUT |
| `assets/art/raw/enemy2_*` | Kenney `tank_dark` recolor gold `#ffd94f` | CC0 | Enemy BRUISER |
| `assets/art/raw/enemy3_*` | Kenney `tank_green` recolor mint `#58ff9b` | CC0 | Enemy WARLORD |
| `assets/art/raw/bunker_intact.png` etc. (3 states) | Kenney tiles plus Pixel UI Pack burn overlay ([kenney.nl](https://kenney.nl/assets/pixel-ui-pack)) | CC0 | Sandbag compose, 3 damage states |
| `assets/art/raw/ui_*.png` (panels, bars) | Kenney Pixel UI Pack plus UI Pack | CC0 | HUD and menu |
| `assets/art/raw/shell.png`, `shell_trail_*.png` | Kenney Particle Pack `smoke_03`, downscaled ([kenney.nl](https://kenney.nl/assets/particle-pack)) | CC0 | Shell and trail strip |
| `assets/art/raw/muzzle_1.png`, `muzzle_2.png` | Kenney Particle Pack `flash_01`, cropped 8×8 | CC0 | Muzzle flash, additive blend |
| `assets/art/raw/explosion_small_*.png` (4) | OGA Explosion by Sogomn, 32×32 sheet sliced ([opengameart.org](https://opengameart.org/content/explosion-3)) | CC0 | Sogomn 2017 |
| `assets/art/raw/explosion_big_*.png` (6) | OGA pixel art explosion by 9KeyStudio ([opengameart.org](https://opengameart.org/content/pixel-art-explosion-animation)) | CC0 | 6 frames 32×32 at 50ms |
| `assets/art/raw/explosion_alt_*.png` (fallback) | OGA pixel explosion by CptDrunkBear ([opengameart.org](https://opengameart.org/content/pixel-explosion)) | CC0 | Fallback set |
| `assets/art/raw/coin_*.png` (4 spin) | Original 8×8 gold `#ffd94f`, 4-angle highlight | CC0 (author-owned) | No license needed |
| `assets/art/raw/reticle_1.png`, `reticle_2.png` | Kenney Crosshair Pack, 16×16 cyan hollow | CC0 | Hover adds magenta corners |
| `assets/art/raw/starfield.png` 256×256 | Procedural tile | CC0 / procedural | 40 stars on `#0a1a3f` |
| `assets/art/raw/scanline.png` 4×4 | Original 4×2 `#ffffff` 6% tile | Author-owned | TileSprite repeat |
| `public/assets/atlas/robo-atlas.png`, `robo-atlas.json` | Build artifact, CodeAndWeb Free Sprite Sheet Packer | Free tool, output unencumbered | Phaser JSON Hash, 1024×1024 |
| `assets/palette/robo-strike.gpl` | Locked palette file | N/A | `#0a1a3f` `#4ff2e3` `#ff4fd8` `#ffd94f` `#58ff9b` `#ffffff` `#1a1a1a` |

82 frames in a single 1024×1024 atlas: player 4, enemies 3×10, bunkers 3,
shell 5, muzzle 2, explosions 10, coin 4, reticle 2, UI singles, background,
scanline. All sprites use at most 7 colors plus alpha, validated with
`scripts/assert_palette.py`.

---

## 4. Audio: SFX and music (all CC0 or public domain)

| File | Source | License | Notes |
|------|--------|---------|-------|
| `assets/audio/sfx_ui_blip.wav/.ogg` | ChipTone `blipSelect`, square 880Hz 0.07s ([itch.io](https://sfbgames.itch.io/chiptone), CC0 output) plus jsfxr ([sfxr.me](https://sfxr.me/), UNLICENSE) | CC0 / UNLICENSE | UI blip only, never wins |
| `assets/audio/sfx_lockon.wav/.ogg` | jsfxr `powerUp` sweep 300 to 1200Hz, 0.35s | UNLICENSE | Rising lock-on arpeggio |
| `assets/audio/sfx_fire.wav/.ogg` | Real tank cannon: OGA `cannon_fire_0` (CC0, Thimras) plus Freesound qubodup Howitzer Shot (CC0, US public domain) | CC0 | 0.38s mixed, highpass |
| `assets/audio/sfx_whoosh.wav/.ogg` | jsfxr `hitHurt` noise doppler, 0.25s | UNLICENSE | Shell flight |
| `assets/audio/sfx_clank.wav/.ogg` | ChipTone `hit` metal, square plus noise, 0.18s | CC0 | Armor hit |
| `assets/audio/sfx_explosion_small.wav/.ogg` | Real grenade: Freesound Jean_Filho sci-fi grenade explosion (CC0) | CC0 | 0.62s, highpass 50, lowpass 9k |
| `assets/audio/sfx_explosion_big.wav/.ogg` | Real bombing: Freesound qubodup Explosive (CC0, US public domain) | CC0 | 1.10s artillery, 180ms delay |
| `assets/audio/sfx_coin_tick.wav/.ogg` | Single coin: OGA `coin_drop` (CC0) | CC0 | 0.35s payout tick |
| `assets/audio/sfx_win.wav/.ogg` | Falling coins lot: OGA `coin_drop` (CC0) plus Freesound Breviceps coins (CC0) plus `coinsounds.zip` (CC0, Enci23), 5 layers | CC0 | 1.6s, loudnorm -14 |
| `assets/audio/sfx_jackpot.wav/.ogg` | Lotto win: OGA Win sound (CC0) plus Freesound FunWithSound fanfare trumpets (CC0) | CC0 | 2.84s stereo fanfare |
| `assets/audio/sfx_miss.wav/.ogg` | Losing jingle: OGA `losegamemusic` (CC0, Robin Lamb) | CC0 | 1.40s with fade |
| `assets/audio/music_loop.wav/.ogg` | Action loop: OGA SimpleBeat (CC0, LushoGames), rock funk drums and bass | CC0 | 50s loop, ogg 630K |
| `assets/audio/layers/kenney_chip_04.wav` (optional) | Kenney Casino Audio chip_04 ([kenney.nl](https://kenney.nl/assets/casino-audio)) | CC0 | Optional layer, 50 files |
| `assets/audio/manifest.json` | Audio manifest: volumes and loop flag | Generated | Lengths and volumes follow the rows above |

**Size budget:** win 23K ogg, jackpot 59K, miss 30K, explosions 9K/12K,
coin tick 6K, music 630K: about 760K ogg total. Audio streams after boot and
sits outside the initial wire budget (`npm run budget`).

---

## 5. Tools (output unencumbered)

| Tool | License | Cost | Use |
|------|---------|------|-----|
| LibreSprite | GPLv2 | $0 | Pixel art cleanup, palette lock |
| Pixelorama | MIT | $0 | Alt editor, timeline |
| CodeAndWeb Free Sprite Sheet Packer | Free tool | $0 | Phaser JSON Hash atlas |
| pngquant | GPL/commercial dual (CLI) | $0 | Lossy PNG savings |
| oxipng | MIT | $0 | Lossless PNG optimization |
| ChipTone | CC0 output | $0 | SFX generator |
| jsfxr | UNLICENSE | $0 | SFX generator |
| Bfxr | MIT | $0 | SFX generator |
| BeepBox | MIT, author owns song | $0 | Music loop composition |
| fonttools / pyftsubset | MIT | $0 | woff2 subsetting |
| Vite, Phaser, penpal, viem | MIT | $0 | Build and bridge |
| OBS Studio | GPLv2 | $0 | Gameplay capture |
| Vercel Hobby, Cloudflare Workers | Free tier | $0 | Static hosting for `dist/` |

---

## 6. Palette verification

- File: `assets/palette/robo-strike.gpl` (GIMP palette)
- Colors: `#0a1a3f` `#4ff2e3` `#ff4fd8` `#ffd94f` `#58ff9b` `#ffffff` `#1a1a1a` (outline)
- Check: `python3 scripts/assert_palette.py assets/art/raw/*.png --palette "#0a1a3f,#4ff2e3,#ff4fd8,#ffd94f,#58ff9b,#ffffff,#1a1a1a"`, no outside hex
- Rule: every sprite carries a 1px `#1a1a1a` outline on at least 75% of its perimeter
