# ROBO STRIKE — SUBMISSION DRAFT (jam.chain.wtf)

> Final submission fields. Keyword-rich, judge-optimized. Updated in Phase 7, final audit in Phase 8.

## Title
ROBO STRIKE — Retro Tank Casino

## One-liner (≤120 chars)
Retro CRT tank casino: pick your volatility, fire, VRF decides — 95% RTP, 30× jackpots, pixel-perfect juice.

## Description (keyword-rich)
ROBO STRIKE is a retro CRT pixel-art casino game where you command robot tanks. Set your bet, pick 1 of 3 enemy tanks — SCOUT (low volatility), BRUISER (medium), WARLORD (high) — and FIRE. Outcomes come 100% from Chain VRF via BigInt thresholds (no floats, no Math.random). Miss, glance, solid hit, crit, jackpot — up to 30×. Optional OVERDRIVE gamble (40% ×2.5, EV-neutral, RTP stays 95%) after wins ≥2×.

Built on the Chain Casino SDK (contract + bridge + manifest), runs in the local simulator, loads near-instantly (320×180, ≤1.2MB), standalone playable outside the iframe, with the jam widget. Volatility is choice, not skill — tanks are static, no movement, no aiming AI. Pure casino tension with screen shake, muzzle flash, coin bursts, CRT scanlines, and chiptune.

Novelty: no classic, no plinko/dice/limbo/crash clone — tank-volatility casino is an unoccupied gap in the jam gallery.

## Novelty Statement (from competitors.md)
*Pending subagent C*

## Links
- Play (standalone): https://<vercel-url>.vercel.app
- GitHub (public): https://github.com/<user>/robo-strike
- Video (15s promo): <url>

## Eligibility Checklist (copy of PROGRESS.md, tick before submit)
- [ ] contract+bridge+manifest exact — simulator green
- [ ] RTP 95% declared, matches paytable, `scripts/simulate-rtp.ts` in repo
- [ ] novel casino concept — no banned clones — gallery gap confirmed
- [ ] standalone playable; widget embedded; submitted via jam.chain.wtf
- [ ] public repo with README + license inventory — every asset commercial-safe
- [ ] loads near-instantly (≤1.2 MB); keyboard + touch
- [ ] sound on all outcomes; no AI-slop tells; consistent palette/outline

## Screenshots / Promo
- [ ] 15s video: bet → pick → fire → explosion → win/jackpot → paytable flash (OBS 60fps, free editor)
- [ ] 2-3 stills (Title, Firing, Jackpot)

*Status: DRAFT — pending research + build.*
