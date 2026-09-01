# ROBO STRIKE — PLAYBOOK (Decisions Only)

> Merged from Stage-1 research. Every decision has a reason + source.
> Status: STUB — awaiting subagent outputs.

## Architecture Decisions

| Decision | Choice | Reason | Source |
|----------|--------|--------|--------|
| Engine | Phaser 3 + Vite + TS + vitest | Whitelisted MIT, jam-proven, 320×180 support | Section 3 whitelist |
| Internal res | 320×180, nearest-neighbor | Spec-locked, CRT pixel-art | Section 2 |
| Palette | navy #0a1a3f, cyan #4ff2e3, magenta #ff4fd8, yellow #ffd94f, green #58ff9b, white #ffffff | Spec-locked | Section 2 |
| Paytable single source | `src/config/paytables.ts` | Prevent drift, simulation + contract + UI share thresholds | Section 2 |

## SDK Decisions (pending subagent A)
- Contract interface:
- Bridge pattern:
- Manifest shape:
- Widget embed exact line:
- Submission form fields:

## Asset Decisions (pending subagent B)
- Chosen source per sprite/sound:
- Fallback pipeline:

## Competitor / Novelty Positioning (pending subagent C)
- Gallery gap:
- Positioning statement:
- Anti-AI-slop rules:

## Math Validation (pending subagent D)
- Threshold BigInt verified?
- Simulation gate:

## Hosting / Promo Decisions (pending subagent E)
- Host: Vercel / Netlify / Cloudflare — choice + reason
- Load budget plan ≤1.2 MB
- Promo shot list:

## Prohibited Dependencies Justification Log
| Dependency | Justification | Date |
|------------|---------------|------|
| (none yet) | — | — |

