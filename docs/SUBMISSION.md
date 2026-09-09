# ROBO STRIKE — SUBMISSION (jam.chain.wtf)

> Final submission fields, ready to paste into the official form. All claims below
> are verified in this repo — see docs/PROGRESS.md for the full evidence log.
> Deadline: **2026-09-20 23:59 UTC**. Judging Sep 21–30, winners ~Oct 1.

## Form fields

**Title**
```
ROBO STRIKE — Retro Tank Casino
```

**RTP** (form accepts 93–98)
```
95
```

**Pitch** (≤2 sentences — also the gallery card copy)
```
Pick your tank — SCOUT low, BRUISER mid, WARLORD high volatility — FIRE once and
Chain VRF settles the round instantly: 95% RTP, up to 30×, optional EV-neutral
Overdrive gamble. The only war-arena casino on the jam: real WW2 tanks fight back,
but nothing you do in the arena ever touches the provably-fair payout.
```

**Description** (full, keyword-rich)
```
ROBO STRIKE is a retro CRT pixel-art casino game where you command a WW2 tank in a
live arena. Set your bet, pick 1 of 3 enemy tanks — SCOUT (low volatility),
BRUISER (medium), WARLORD (high) — and FIRE. Outcomes come 100% from Chain VRF via
BigInt thresholds (floor(b·2^256/100), no floats, no Math.random). Miss, glance,
solid hit, crit, jackpot — up to 30×. Optional OVERDRIVE gamble after wins ≥2×
(40% → ×2.5, EV-neutral, RTP stays 95% for any strategy).

Built on the Chain Casino SDK (ICasinoGameV2 contract + penpal bridge + manifest),
verified in the local simulator: 60 on-chain rounds with payouts matching the
declared paytable exactly, plus a 1M-round Monte Carlo gate (npm run sim:rtp) and
the full bet → WAITING_RANDOMNESS → reveal flow through the real host bridge.

Novelty: the entire jam gallery is abstract shapes and sliders — ROBO STRIKE is the
only entry where volatility is a character choice between machines that visibly
fight back. Pure chance, pure tension: screen shake, muzzle flash, coin bursts,
CRT scanlines, real CC0 explosions and chiptune-action audio. Standalone demo mode
with a simulated bank runs the moment you open the URL.
```

**Links** (fill at deploy time)
- Play (standalone): `https://robo-strike.pages.dev` *(Cloudflare Workers deploy: `npx wrangler deploy`)* — mirror `https://robo-strike.vercel.app`
- GitHub: `<your repo URL>` — include `ATTRIBUTION` credit (see README Assets section)

**sourceAccess**: private repo URL + invite the Chain review account (Q1 pending on Discord — ask which handle, grant Read).

**Discord / X / Telegram**: your handles.

## Why it wins each pillar (judge's four scores)

| Pillar | Question | ROBO STRIKE's answer |
|--------|----------|----------------------|
| 🆕 Novelty | Similar game on the market? | Gallery scan 2026-09-06: 16 approved entries, all abstract shapes/sliders (nearest: Chain Arena d20 duel, Grudge Lab set-your-odds). Zero characters, war, or arenas anywhere. Volatility-as-character is unoccupied — on the jam and in mainstream crypto casinos. |
| 😃 Fun | Still playing after 10 hours? | Persistent session stats (rounds, biggest win, best streak) + title-screen marquee + STREAK ×N escalation banners/audio; OVERDRIVE gamble for risk-lovers; three tanks = three luck profiles to chase jackpots on. |
| 🌀 Simplicity | No manual needed? | Title → FIRE to play. Bet `,/.`, tank `1/2/3`, odds `T` — one footer line explains everything; in-game PAYTABLE shows exact odds so nobody wonders what they can win. |
| 🔊 Visual & sound | Real game, no AI slop? | Real rendered WW2 tanks (Bleed's OGA pack, CC-BY, credited), procedural desert battlefield, CRT scanlines/vignette, real CC0 explosions/coin showers/jingles, action music loop, persisted ♫/🔊 toggles. Zero AI-generated art. |

## Pre-submit checklist (tick before submitting)

- [x] contract (ICasinoGameV2) + bridge + manifest — compiles, 63 tests, manifest validator
- [x] runs correctly in local simulator — 60 RPC rounds 0 mismatches + harness-UI bridge rounds (opening → WAITING_RANDOMNESS → reveal → idle, balance credited) — `docs/screenshots/simulator-harness-round.png`
- [x] RTP 95 declared, matches paytable — exact rational proof + 1M-round gate (`npm run sim:rtp` ALL PASS)
- [x] novel concept — 16-entry gallery scan, no tank/war/character entry (re-scan 24h before deadline!)
- [x] standalone playable outside iframe — crypto-RNG demo mode, mock bank, auto-fallback
- [x] jam widget embedded — `<script async src="https://jam.chain.wtf/widget.js"></script>` in index.html
- [x] loads near-instantly — 737 KB gz initial, music lazy-loaded (`npm run budget`)
- [x] sound on all outcomes + toggles — `docs/UI_AUDIO_TOGGLES.md` (IMPLEMENTED)
- [ ] **deploy** to Cloudflare (`npx wrangler login && npx wrangler deploy`) + Vercel mirror — needs your login
- [ ] verify `curl -s https://YOUR-URL | grep widget.js` and `/game.manifest.json` same-origin after deploy
- [ ] record 15s promo video (OBS shot list: docs/PLAYBOOK.md §5c) — include the in-game PAYTABLE flash
- [ ] submit via official form; save `chainjam-entry-id` from localStorage
- [ ] 24h before deadline: re-scan gallery (`entries:listApproved`) for copycats, confirm game still live
