# ROBO STRIKE — ASSET INVENTORY

> Every asset must be commercial-safe (25% lifetime revenue = commercial use).
> Schema: File Path | Source Name | Source URL | License | Attribution Required | Date Verified | Commercial OK? | Notes

## Fonts
| File Path | Source Name | Source URL | License | Attribution | Date | Commercial | Notes |
|-----------|-------------|------------|---------|-------------|------|------------|-------|
| `assets/fonts/PressStart2P` | Press Start 2P | https://fonts.google.com/specimen/Press+Start+2P | OFL 1.1 | No | 2026-09-01 | PENDING | Verify fetch |
| `assets/fonts/VT323` | VT323 | https://fonts.google.com/specimen/VT323 | OFL 1.1 | No | 2026-09-01 | PENDING | Verify fetch |

## Art — Sprites / Sheets
| File Path | Source Name | Source URL | License | Attribution | Date | Commercial | Notes |
|-----------|-------------|------------|---------|-------------|------|------------|-------|
| TBD | Kenney Top-Down Tanks (to verify) | https://kenney.nl/assets/top-down-tanks | CC0 | No | - | PENDING | Subagent B to fetch + verify URL exists |

## Audio — SFX / Music
| File Path | Source Name | Source URL | License | Attribution | Date | Commercial | Notes |
|-----------|-------------|------------|---------|-------------|------|------------|-------|
| TBD | Kenney Casino Audio | https://kenney.nl/assets/casino-audio | CC0 | No | - | PENDING | Subagent B |

## Tools / Packer
| Tool | Source URL | License | Cost | Notes |
|------|------------|---------|------|-------|
| LibreSprite | https://libresprite.github.io | GPLv2 | $0 | pixel art |
| CodeAndWeb free sprite-sheet packer | https://www.codeandweb.com/free-sprite-sheet-packer | Free (proprietary, free tier) | $0 | outputs Phaser JSON |
| jsfxr/Bfxr/ChipTone | https://sfxr.me / https://www.drpetter.se/project_sfxr.html | MIT / Apache | $0 | SFX generation |
| BeepBox | https://www.beepbox.co | MIT | $0 | chiptune loop |

## Rejection Log (non-commercial or paid — DO NOT USE)
| Asset | Reason | Date |
|-------|--------|------|
| TexturePacker (paid) | Banned per Section 3 | 2026-09-01 |
| Retro Diffusion (paid) | Banned | 2026-09-01 |

> Status: STUB — Subagent B will populate verified rows. No asset is approved until License+Cost verdict = PASS.

## Proposed Assets Per Material
- **Art pipeline:** Kenney (CC0) as base if exists → recolor to locked palette (#0a1a3f, #4ff2e3, #ff4fd8, #ffd94f, #58ff9b, #ffffff) → LibreSprite cleanup → free packer → pngquant/oxipng
- **Audio pipeline:** jsfxr/Bfxr/ChipTone per SFX recipe + BeepBox loop; alternatively Kenney CC0 / Minifantasy / OGA CC0 if verified.
