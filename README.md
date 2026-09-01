# ROBO STRIKE — Retro Tank Casino (Chain Jam Vol.1)

> Retro CRT tank casino: pick your volatility, fire, VRF decides — 95% RTP, 30× jackpots, pixel-perfect juice. (115c one-liner)

**Play:** https://robo-strike.pages.dev *(Stage 2 placeholder, Phase 7 will deploy)*
**Repo:** https://github.com/<user>/robo-strike *(private during jam, invite review per QUESTIONS_FOR_DISCORD Q1)*
**Video:** pending 15s 1080p60 (OBS→DaVinci per hosting-promo.md)

## Quick Start (local simulator)
See `sdk.chain.wtf/casino/GETTING_STARTED.md` — `npm install && npm start` → http://localhost:3300

## Math & Fairness
95% RTP on all 3 tanks (93–98% compliant). See `docs/MATH.md` §1-3. Verified by `scripts/simulate-rtp.ts` (1M rounds/profile, BigInt thresholds floor(b*2^256/100), no Math.random, exit 1 on fail).

## Assets
All $0 commercial-safe. Inventory at `docs/ASSET_INVENTORY.md`. Tools: LibreSprite, free packer, pngquant+oxipng, ChipTone/jsfxr/Bfxr/BeepBox (generated), OBS/DaVinci.

## License Inventory
See `docs/ASSET_INVENTORY.md` — every asset: file path + source URL + license + date 2026-09-01.

