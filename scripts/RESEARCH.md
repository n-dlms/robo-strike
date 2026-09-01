# Stage 2 — Asset Recipes & Sources Quick Reference

This file is generated in Stage 2 to prove $0 pipeline; full recipes live in docs/research/audio.md §10 + assets.md §27.

## Audio recipes (audio.md §10)
- UI blip: Square 50% 880Hz 0.07s (ChipTone blip)
- Lock-on: Square sweep 300→1200Hz 0.35s arpeggio +0.35 ramp
- Fire: Square+Saw 450Hz→-0.35 down 0.22s, punch 0.28
- Whoosh: Noise doppler 2kHz→-0.24 0.25s flanger
- Clank: Square+Noise metallic 600Hz 0.18s LPF 0.60 reso 0.50
- Explosion small 0.58s / big 0.92s Noise lowpass 1200/800
- Coin tick Sine 1.2kHz 0.07s×10 seq 90ms stagger
- Win 1.2s / Jackpot 2.8s BeepBox stingers
- Miss Sine dull 280Hz→-0.32 0.35s
All ffmpeg placeholders in assets/audio/*.wav approximate these; real jsfxr/bfxr exports replace same filenames Phase 4.

## Loop (BeepBox audio.md §11)
- 28 bars @133 BPM C-minor 50.5s (112 beats × 60/133 = 50.526s)
- Channels: Square Lead 85% C5 Eb5 G5 motif, Square Harmony thirds, Triangle Bass ostinato C2-G1-Eb2-C2, Noise drums kick 1&3 snare 2&4
- Bars: 1-4 intro, 5-12 A, 13-20 B, 21-24 build, 25-28 outro → crossfade 1200→600ms
- Placeholder 50.5s stereo sine drone assets/audio/music_loop.wav 8.5M + ogg 472K (ffmpeg) — real BeepBox export will overwrite same path via BeepBox → Audacity → ffmpeg -qscale:a 4

## Art pipeline (assets.md §27)
- AI ref 128×128 disposable → LibreSprite 16×16/32×32 trace → palette lock #0a1a3f #4ff2e3 #ff4fd8 #ffd94f #58ff9b #ffffff + #1a1a1a 1px outline → export PNG32 → CodeAndWeb free packer Phaser JSON Hash MaxRects 1024×1024 pad2 extrude1 → pngquant --quality=65-80 --speed 3 → oxipng -o4 --strip safe → public/assets/atlas/
- 66 raw PNGs now in assets/art/raw/ covering S01-S17 (player 4, enemies 30, bunker 3, shell 5, muzzle 2, explosions 10, coin 4, reticle 2, ui 3, bg 1, scanline 1)
- Atlas placeholder public/assets/atlas/robo-atlas.json 23KB + ro-bo-atlas.png 159B

## Sources
See docs/research/assets.md §0 table (27 URLs 200) + audio.md §0 (9 URLs 200) + sdk.md §0 (12 URLs 200). All 2026-09-01.
