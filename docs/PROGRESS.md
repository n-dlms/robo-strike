# ROBO STRIKE — PROGRESS LOG

> Single source of truth for build progress. Updated at end of every phase.
> Metric: highest probability of winning Chain Jam Vol. 1 ($0 budget).

## Timeline
- TODAY: 2026-09-01
- Deadline: 2026-09-20 22:58 UTC (hard)
- Judging: Sep 21-30
- Winners: Oct 1

## Stage / Phase Tracker

| Stage | Phase | Status | Date | Commit | Notes |
|-------|-------|--------|------|--------|-------|
| 0 | Workspace + Memory | DONE | 2026-09-01 | stage-0 | git init, structure, skeletons |
| 1 | Research (A-E subagents) | DONE | 2026-09-01 | — | 5 subagents: sdk 1233L, assets 761L, audio 486L, competitors 4 entries, math 724L, hosting-promo 644L; 20 Discord Qs |
| 2 | Consolidation + Asset Download | DONE | 2026-09-01 | stage-2 | PLAYBOOK merged (decisions with reasons), ASSET_INVENTORY verified (27 candidates, 2 FAIL correctly rejected), placeholders: 66 sprites raw + atlas 23KB JSON, 11 wavs + 11 oggs + loop 50.5s 472KB ogg, palette locked |
| 3-1 | Scaffold (Vite+TS+Phaser) | TODO | - | - | 320×180, palette, fonts |
| 3-2 | Casino Brain (paytables + VRF mapper + RTP proof) | TODO | - | - | sim 1M, no Math.random |
| 3-3 | SDK Integration (contract+bridge+manifest) | TODO | - | - | simulator 20x round-trip |
| 3-4 | Presentation (state machine + juice) | TODO | - | - | no manual needed |
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

## Eligibility Checklist (final audit)
- [ ] contract+bridge+manifest exact
- [ ] simulator green, near-instant load
- [ ] RTP 93-98% declared matches paytable
- [ ] novel casino concept, no banned clones
- [ ] standalone playable outside iframe
- [ ] jam widget embedded
- [ ] submitted via jam.chain.wtf with public repo + README
