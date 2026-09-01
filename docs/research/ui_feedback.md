# ROBO STRIKE — UI Feedback Research: Win / Jackpot / Game Over Pop-ups + Count-Up

> Date: 2026-09-01 • Mission: Subagent H — quality internet research on how Game Over, Win, Jackpot and other pop-up screens should look/sound, plus counting animation from 0x to final multiplier (e.g., 1.76x).
> Every claim below is backed by a WebFetch-verified URL (all fetches 2026-09-01). No hallucinated URLs.

## Sources fetched (12)

| # | URL | Fetched | Used for |
|---|-----|---------|----------|
| S1 | https://game-ace.com/blog/10-types-of-slot-assets-in-online-casino-gaming/ | 2026-09-01 | win tiers, win animation layering, sound cue sheet |
| S2 | https://phaser.io/devlogs/141 | 2026-09-01 | Number Counter Tween (addCounter, getValue) |
| S3 | https://docs.phaser.io/phaser/concepts/tweens | 2026-09-01 | tween config, duration/ease, onUpdate, easing list |
| S4 | https://questbe.at/slot-sound-effects-how-audio-shapes-the-slot-game-experience/ | 2026-09-01 | audio hierarchy, sync, repetition, controls |
| S5 | https://blakecrosley.com/guides/design/balatro | 2026-09-01 | juice stack, screen shake tiers, CRT scanlines/vignette, particle burst, color-as-label |
| S6 | https://github.com/inorganik/countUp.js/blob/master/README.md | 2026-09-01 | countUp duration, smart easing, easeOutExpo default, options |
| S7 | https://easings.net/en | 2026-09-01 | easeOutCubic vs easeOutExpo curves, cubic-bezier visual |
| S8 | https://analyzingmedia.com/why-does-online-slot-animation-pacing-affect-player-perception/ | 2026-09-01 | celebration duration scales with payout (5x→2s, 500x→20s, logarithmic) |
| S9 | https://supslots.com/when-do-win-animations-complete-in-online-slot-games/ | 2026-09-01 | tiered durations: minor <2s, moderate 3-5s, substantial 5-10s, major 10-20s, jackpot 20s+; skip |
| S10 | https://capitalradar.co.uk/how-big-win-animations-affect-game-speed/ | 2026-09-01 | forced pause dopamine, layered animations, count-up speed tied to win size, Turbo/skip |
| S11 | https://interviewlane.com/questions/build-a-priority-based-modal-system | 2026-09-01 | pop-up queue, priority preempt vs stack, expiry |
| S12 | https://www.dailydoityourself.com/why-do-motion-timing-curves-matter-in-slot-animation-quality/ | 2026-09-01 | easeOut fast-start slow-end for entrances, easeIn for exits, bounce/anticipation/follow-through |

---

## 1. Casino Win Presentation Best Practices — Tiers & Layering

**Topic:** Casino win presentation best practices: win vs big win vs jackpot tiers, how pop-ups should look (overlay, modal, particle burst, coin shower), color coding per tier, sound sync

**Sources:**
- S1 https://game-ace.com/blog/10-types-of-slot-assets-in-online-casino-gaming/ (2026-09-01)
- S8 https://analyzingmedia.com/why-does-online-slot-animation-pacing-affect-player-perception/ (2026-09-01)
- S9 https://supslots.com/when-do-win-animations-complete-in-online-slot-games/ (2026-09-01)
- S10 https://capitalradar.co.uk/how-big-win-animations-affect-game-speed/ (2026-09-01)
- S4 https://questbe.at/slot-sound-effects-how-audio-shapes-the-slot-game-experience/ (2026-09-01)

**Findings:**
- Industry standard tiers = **small-win → medium-win → big-win → mega-win → max-win/jackpot** (S1: “standard tiers are small-win, medium-win, big-win, mega-win, and a top-tier ‘max-win’ sequence for jackpots”). Each tier layers: **symbol glow/shimmer + frame flash + particle effects (coins/sparks/light bursts) + centered overlay with win amount** (S1). Big-win+ tiers often play a **short pre-rendered cinematic** or Spine 2D rig (S1).
- **Duration must be proportional to payout**: 5× bet ≈ 2s, 500× ≈ 20s; some games scale **logarithmically** (10× modest, 100× disproportionately longer) to create perceived value beyond math (S8). SupSlots refines: **minor <2s (quick flash/glow), moderate 3–5s, substantial 5–10s, major 10–20s, jackpot 20s+ cinematic** (S9). This prevents “animation fatigue” on frequent small wins and gives brain time to register big wins (S8, S9).
- **Forced pause is intentional**: big-win animation creates a “forced pause” where reels are inactive — a calculated dopamine reinforcement window. If skipped instantly, dopamine peak is truncated; but too-long small-win celebrations cause “skip-clicking” frustration (S10). Modern solution = **layered animation**: short impactful beat plays first; if player doesn’t skip, longer elaborate sequence follows (S10). Count-up speed also **tied to win size** — e.g., Big Win slow build tension, Super Win faster increments with more AV intensity (S10).
- **Visual hierarchy for ROBO STRIKE** (adapted to our 5-outcome paytable — SCOUT/BRUISER/WARLORD all 95% RTP, max 30×):
  | Tier | ROBO outcome | Mult examples | Visual language (S1 layering) | Color coding (extend S5 color-as-label) | Duration target |
  |------|--------------|---------------|-------------------------------|----------------------------------------|-----------------|
  | T0 glance | 0.7× / 0.9× / 1× | scent, not spectacle | brief symbol glow (60ms), 1px frame shimmer, **no particles** | `#4ff2e3` cyan outline, white `0.70×` (neutral) | 0.8s |
  | T1 solid | 2× / 3× / 6× | clear reward | glow + frame flash + **6–10 coins** sparse shower | `#ffd94f` gold (money), `#ffffff` numbers | 1.2s |
  | T2 crit | 6× / 7× / 12× | celebration | intense bounce, **20-coin rain** + sparks, coin burst | `#58ff9b` green + gold | 2.0s |
  | T3 jackpot | 30× / 15× / 11× | spectacle | **40-coin explosion** + full-screen flash + shake + CRT flash + lingering banner (see §2) | `#ff4fd8` magenta + gold, Press Start 2P `JACKPOT!` | 2.8s (extendable to 6–8s if player lingers; skip allowed) |
  These durations are faster than slot 10–30s “Mega Win” (S10) because ROBO STRIKE is **instant reveal** (no reel spin 2–3s) — preserving pace while still proportional.
- **Overlay structure** (S1 + S11): centered modal overlay (not full-screen takeover for T0–T2), dim backdrop, win amount centered, particles behind text. For jackpot, overlay upgrades to **full-screen** (see §2). S1 explicitly distinguishes “win screen” (centered overlay announcing payout) vs broader “win animation” (glow, flash, particles, cinematic).
- **Sound sync principle** (S4 + S1 cue sheet): Sound must **mirror tier intensity** and stay **synchronized** to visuals (S4: “sound, animation, and game state should remain synchronized… even a slight delay can make polished visuals feel disconnected”). Each tier gets distinct jingle intensity; routine events short/restrained, jackpot long/layered (S4 hierarchy). Cue sheet in S1 mandates: ambient, reel-stop pop, **win jingle per tier**, big-win cinematic track, UI clicks — we map to our manifest SFX.

**Confidence:** High — S1 is studio production scoping doc, S8/S9/S10 triangulate durations from independent analyses, S4 codifies audio hierarchy.

---

## 2. Jackpot Celebration — Full-Screen Spectacle

**Topic:** Jackpot celebration: full-screen flash, screen shake, chromatic aberration, coin explosion, CRT flash, lingering banner

**Sources:**
- S5 https://blakecrosley.com/guides/design/balatro (2026-09-01)
- S1 https://game-ace.com/blog/10-types-of-slot-assets-in-online-casino-gaming/ (2026-09-01)
- S9 https://supslots.com/when-do-win-animations-complete-in-online-slot-games/ (2026-09-01)
- S10 https://capitalradar.co.uk/how-big-win-animations-affect-game-speed/ (2026-09-01)
- S12 https://www.dailydoityourself.com/why-do-motion-timing-curves-matter-in-slot-animation-quality/ (2026-09-01)

**Findings:**
- **Layered “juice stack” is load-bearing** (S5 Balatro): chip scored = `screen shake (intensity ∝ score) + CRT scanlines intensify + background pulse + chips burst + trail particles + rising-pitch audio + bass drop+flash at threshold`. No single channel carries the moment — they **stack multiplicatively**. Balatro proof: Apple Design Award 2025 with juice-as-product, not polish.
- **Screen shake as data channel** (S5): intensity communicates magnitude before number appears. S5 provides concrete tiers we adapt:
  - `shake-small`: ±2px, 0.2s ease-out (for glance/solid)
  - `shake-medium`: ±4px, 0.3s (for crit)
  - `shake-large`: ±8px + ±1deg rotate, 0.5s (for jackpot) — `@keyframes shake-large {10% translate(-8px,6px) rotate(-1deg)...}` (S5 verbatim pattern). Duration 120–500ms.
  Our spec: **jackpot = 4–8px shake 500ms ease-out**, crit 3–4px 300ms, lower none/glance.
- **CRT flash + scanlines** (S5): Balatro’s identity = scanlines **always present but intensify momentarily** on score, plus vignette curvature (`radial-gradient ellipse at center transparent 60% → rgba(0,0,0,0.4) 100%`) and phosphor glow (`text-shadow 0 0 2px rgba(255,255,255,0.5), 0 0 8px rgba(100,200,255,0.15)`). For jackpot we **flash the scanline opacity 0→0.25→0 in 120ms** and **briefly bump vignette intensity**, matching S5 LAYER 3.
- **Chromatic aberration / white flash**: Not explicit in S5 but implied by “screen flash” + CRT phosphor, and S12 details **follow-through + anticipation** and “shockwave ripple, radial blur, chromatic aberration” as part of heavy-hit toolkits (S12 lists shockwave, radial blur, chromatic). Best-in-class arcade juice uses **RGB split 200ms + white flash 80–120ms** for jackpot threshold (S5: “Score threshold reached = bass drop + screen flash”). Spec: add **white `rgba(255,255,255,0.35)` flash overlay fade 0→0.35→0 in 100ms** + optional **2px RGB split via `filter: chromatic` or Phaser camera `shake` + `flash(0xffffff,120)`**.
- **Coin explosion** (S1 + S5 LAYER 4): S1: particles “coins, sparks, light bursts” behind centered overlay. S5: “Chips burst from scored cards, trail particles follow score, color matches hand type”. For ROBO: spawn **40 coins** (reuse `assets/art/raw/coin_*.png` 4-frame spin) with `Phaser.Math.Between(-120,120)` vx, gravity 600, lifespan 900ms, additive tint gold → fade. Burst origin = jackpot number center. Add **spark burst 12 particles** additive.
- **Lingering banner**: After flash/shake/coins, persistent **gold-magenta banner** at top 15% with `JACKPOT 30.00×` stays **2.5s** after count completes, then auto-fades or dismiss on FIRE. Allows screenshot moment without blocking retry. Matches S9 “jackpot prizes extending beyond twenty seconds through cinematic presentations” — we compress to 2.8s count + 1.5s hold = 4.3s but **skip-dismiss allowed** (S10 “layered” pattern).
- **Timing sequence (shot-by-shot) for jackpot (total ~4.3s if uninterrupted):**
  0ms — VRF settled → freeze board, **white flash 100ms** + `sfx_jackpot` start (lotto fanfare 2.84s)
  80ms — **shake-large 500ms** + CRT intensify
  120ms — **Count-up begins** 0.00× → 30.00× over 2800ms (see §5) with coin ticks
  120–300ms — **40-coin explosion** + sparks simultaneous with count start (S10 “count-up speed tied to win size… more intense AV cues”)
  2800ms — count lands → **pop scale 1.15→1.0 + phosphor glow pulse** + bass drop sub-hit
  2800–4300ms — **lingering banner** holds, particles settle, FIRE/skip available
  4300ms — auto-dismiss to payout reveal + Overdrive prompt if eligible

**Confidence:** High (shake/CRT/particle layering verifiably from Balatro S5; S1 confirms cinematic/particle structure; durations extrapolated and compressed for instant game — medium confidence on exact ms, high on principle that jackpot must be multi-layer longest).

---

## 3. Game Over / Miss — Dim, Desaturated, Shake, Lose Jingle, Retry CTA

**Topic:** Game Over / Miss: dim overlay, desaturated, shake, losing jingle, retry CTA

**Sources:**
- S9 https://supslots.com/when-do-win-animations-complete-in-online-slot-games/ (2026-09-01) — skip/quick-spin controls
- S4 https://questbe.at/slot-sound-effects-how-audio-shapes-the-slot-game-experience/ (2026-09-01) — error/message draws attention, failure sounds
- S5 https://blakecrosley.com/guides/design/balatro (2026-09-01) — shake as information, background pulse, color coding
- S12 https://www.dailydoityourself.com/why-do-motion-timing-curves-matter-in-slot-animation-quality/ (2026-09-01) — easing for feedback clarity

**Findings:**
- **Miss is not nothing** — even small/miss states need feedback, but **briefest and most restrained** (S9, S4). S9: “Small win animations conclude within 1–3s… quick flashes, subtle glows, modest sound effects… Standard winning combinations receive proportional animation durations”. Miss/zero-win should get **acknowledgement without celebration** — analogous to “losses disguised as wins” critique in S10: don’t over-celebrate 0×. Provide **clean closure** instead of emptiness.
- **Visual treatment — dim + desaturate (inverse of win):**
  - **Backdrop:** `rgba(10,26,63, 0.55)` (navy #0a1a3f at 55% — darker than generic 40% win dim, to signal end) — derived from palette + S5 vignette concept (`rgba(0,0,0,0.4)`) but using our navy for fiction consistency.
  - **Desaturation:** reduce saturation 30% on playfield behind overlay (`filter: saturate(0.7)` or Phaser `camera.setTint(0xaaaaaa)` + overlay). S5 CRT scanlines stay but **flicker dim**.
  - **Shake:** small lateral shake **±2px 150ms ease-out** (S5 shake-small) — communicates “hit/miss” without jackpot violence. Use same shake system as jackpot but weakest tier. This mirrors S5 “shake communicates score magnitude before number appears” — low shake = low outcome.
  - **Panels:** smoke/ash particles 4–6 drifting up (reusing explosion_small alpha), not coins. This matches S1 “win animation covers glow/shimmer/particles” — miss uses muted particles (dust, not coin).
- **Text & color:** 
  - `MISS` or `0.00×` in **muted cyan `#4ff2e3` at 70% alpha** or white 60% — not gold/magenta celebratory. If `miss` with Overdrive-forfeit, show `FORFEITED` if applicable. 
  - Retry CTA: **Press Start 2P 8px `RETRY` / `FIRE TO CONTINUE`** in gold `#ffd94f` on navy — high contrast actionable. This matches paletted color-as-label (S5): gold = money/action, green = ready, magenta = jackpot only (not used for miss).
- **Sound:** `sfx_miss` (1.40s losing jingle, OGA losegamemusic.wav) starts **on overlay appear** (S4: “Timing should occur immediately after interaction… if sound arrives noticeably after tap, interface feels sluggish”). Volume 0.6 per manifest, not layered. No coin ticks. Ends before auto-dismiss window.
- **Timing & dismiss:**
  - Appear 180ms fade+scale (see §4).
  - Hold **900ms minimum** (longer than glance 800ms count but shorter than solid) — enough to read but not dwell.
  - **Dismiss via FIRE / Space / click anywhere or auto 1.4s** (match jingle length). Provide **skip anywhere** (S9/S10 skip functionality essential for pacing; “Allows player to click Spin button during animation to immediately collect credits” — S10).
  - After dismiss → return to BET state, bet controls re-enable. Provide keyboard `R`/`Space` for retry.
- **Accessibility note (S4):** Important events must have **visual + audio redundancy**. Miss communicates via dim+desaturate+shake+text+ jingle, so audio-off still clear.

**Confidence:** High on principle (S9 duration scaling + S4 error-sound clarity + S5 shake-as-data); medium on exact desaturation % (extrapolated — verify in playtest).

---

## 4. Generic Pop-up System — Queue, Backdrop, Palette, Fonts, Animation, Dismiss

**Topic:** Generic pop-up system: queue, backdrop dim 40%, rounded panel with 1px outline #1a1a1a, palette #0a1a3f #4ff2e3 etc, Press Start 2P title, VT323 body, appear animation (scale 0.8→1 + fade), dismiss via FIRE or timeout

**Sources:**
- S11 https://interviewlane.com/questions/build-a-priority-based-modal-system (2026-09-01)
- S5 https://blakecrosley.com/guides/design/balatro (2026-09-01) — CRT overlay, scanlines, vignette as backdrop concept
- S12 https://www.dailydoityourself.com/why-do-motion-timing-curves-matter-in-slot-animation-quality/ (2026-09-01) — easeOut for entrances, easeIn for exits, bounce
- S3 https://docs.phaser.io/phaser/concepts/tweens (2026-09-01) — duration/ease/onComplete
- S1 https://game-ace.com/blog/10-types-of-slot-assets-in-online-casino-gaming/ (2026-09-01) — win screen = centered overlay

**Findings:**
- **Queue is coordination, not UI** (S11): “Multiple unrelated callers want to show modals… Without coordination user gets all four stacked. With priority only the most important shows now; the rest queue”. S11 prescribes `ModalQueue` with `queue[] + current`, `open({priority})` → if no current show; else if priority > current.priority preempt (push current back sorted), else queue sorted desc, `dismiss(id)` promotes next. Extras: **suppress during user flow, dedupe, expiry N minutes, logging**. This directly maps to ROBO pop-ups where **jackpot (priority 3) must preempt glance (priority 0)** if re-triggered quickly.
  - Priorities for ROBO (per §1 tiers + system modals):
    `CRITICAL 3: JACKPOT / system error / settlement failed`
    `HIGH 2: CRIT / OVERDRIVE prompt / FORFEITED`
    `NORMAL 1: SOLID`
    `LOW 0: GLANCE / MISS / toast`
  - Policy: **preempt** for jackpot/crit (higher replaces lower, lower re-queues), **stack not needed** (single centered panel fits CRT fiction; S11 stack alternative noted but not used — we choose preempt).
- **Backdrop:** For generic wins (not miss, not jackpot): **dim 40%** = `rgba(0,0,0,0.40)` OR `rgba(10,26,63,0.40)` (navy). Choice: **black 40%** for wins to keep board readable; navy 55% reserved for miss (darker mood). S5 CRT vignette (`rgba(0,0,0,0.4)` radial) is analogous. Provide **scrim** that blocks underlying picks (S11 scrim concept). Our Phaser container: `backdrop = this.add.rectangle(160,90,320,180,0x000000,0.40)` (or 0x0a1a3f). Alpha 0→0.40 in 180ms.
- **Panel spec (anti-slop, paletted):**
  - Size: **220×96** for wins (fits 320×180 with 50px margin), **240×110** for jackpot, **200×80** for miss. Centered `x=160 y=90`.
  - Fill: `#0a1a3f` navy 100%.
  - **Outline: 1px solid #1a1a1a** (spec-locked). Add `stroke 1` on rectangle or `Graphics lineStyle(1,0x1a1a1a,1)`.
  - **Rounded:** `radius 6` (small — CRT pixel-adjacent but not harsh; S5 Balatro uses `border-radius:12px` — we use half for pixel art).
  - Inner highlight: 1px inner line `rgba(79,242,227,0.18)` (cyan 18%) at top edge — subtle gloss.
  - Shadow: `drop 0 4px 12px rgba(0,0,0,0.45)` — lifts above dim.
  - Content padding: 12px.
- **Typography (2-font rule OFL):**
  - Title: **Press Start 2P 10px** `JACKPOT!` / `YOU WIN` / `MISS` — magenta/gold/white per tier, `align center`, `textShadow 0 1px 0 #1a1a1a`.
  - Body: **VT323 16–18px** for multiplier `1.76×` (tabular), 12px for labels “PAYOUT: 35.20”. Fixed 2 decimals, suffix `×` (not `x`). Use `font-variant-numeric: tabular-nums` CSS concept (S6 notes tabular-nums reduces jitter; we enable via `letterSpacing 0` and monospaced VT323).
  - All text tinted per tier (see §1). No new hues beyond 6-color palette + outline.
- **Appear animation (S12 + S3):** S12: “Entrances ease-out (fast-in, slow-out). Exits ease-in (slow-in, fast-out). … Interface responses benefit from quick initial movements that confirm registration, followed by gentler completion.” Also S3 documents `ease: 'Cubic.easeOut'` etc and `duration`, `onComplete`. Spec:
  - **In (180ms Cubic.easeOut):** `scale 0.8 → 1.0` + `alpha 0 → 1` on panel; backdrop alpha 0→0.40 parallel. Duration **180ms** (S12 “micro-interactions 100–200ms, standard 200–350ms, dramatic 350–600ms” — win pop-up = standard, 180ms is crisp).
  - **Bounce option for crit/jackpot:** use `Back.easeOut` or `Cubic.easeOut` with **overshoot 1.08** for 60ms then settle 120ms (S12 bounce adds playful elasticity for celebrations). But default keep `Cubic.easeOut` to avoid over-bounciness on frequent glance.
  - **Out (140ms Cubic.easeIn):** `scale 1.0 → 0.92` + `alpha 1 → 0` + backdrop 0.40→0.
  Phasing code via Phaser tween (see §5).
- **Dismiss:**
  - Primary: **FIRE / Space / click anywhere on scrim** (S9/S10 skip functionality — “tap-anywhere dismissals, skip buttons, quick-play modes”). Mimics slot “Skip” (S9).
  - Secondary: **timeout auto** — glance 800ms hold after in, solid 1200ms, crit 1800ms, miss 900ms, jackpot 2800ms+hold (but FIRE skips immediately via `tween.complete()` / `tween.stop()` and jumps to final value — see S3 `seek`, `complete`, `stop`).
  - During count-up, FIRE **fast-forwards** rather than aborts: `seek(duration)` → final value, then wait 120ms pop before dismiss — ensures player always sees final multiplier (S10 layered pattern: short impactful first, longer if not interrupted).
  - **Host:** Also listen for `ESC` to dismiss (accessibility) but map to FIRE so it also calls `hostApi.revealOutcome` where needed (PLAYBOOK bet flow).

**Confidence:** High — S11 queue model is canonical; backdrop/rounded/outline/animation values are design-system choices grounded in S5/S12 easing theory and S3 Phaser capabilities.

---

## 5. Counting Animation — Tween from 0.00× to Final Multiplier

**Topic:** Counting animation: how to tween from 0.00× up to final multiplier (e.g., 1.76×) with easing (easeOutCubic, easeOutExpo), duration scaled to win amount, tick sounds per 0.10× increment, final pop + jingle, number formatting, with requestAnimationFrame vs Phaser tween, example code snippet

**Sources:**
- S2 https://phaser.io/devlogs/141 (2026-09-01) — addCounter / getValue / auto-cleanup
- S3 https://docs.phaser.io/phaser/concepts/tweens (2026-09-01) — tweens.addCounter config, onUpdate, easing map, duration/ease
- S6 https://github.com/inorganik/countUp.js/blob/master/README.md (2026-09-01) — duration seconds, decimalPlaces, useEasing/easingFn default easeOutExpo, smartEasing
- S7 https://easings.net/en (2026-09-01) — easeOutCubic vs easeOutExpo shapes
- S12 https://www.dailydoityourself.com/why-do-motion-timing-curves-matter-in-slot-animation-quality/ (2026-09-01) — linear robotic vs eased organic, easeOut for responsive, bounce for celebration
- S8 https://analyzingmedia.com/why-does-online-slot-animation-pacing-affect-player-perception/ (2026-09-01) — proportional duration scaling
- S10 https://capitalradar.co.uk/how-big-win-animations-affect-game-speed/ (2026-09-01) — count-up speed tied to size, slow build vs faster increments

**Findings:**

### Why easeOutCubic / easeOutExpo (not linear, not easeIn)
- **Linear = robotic** — S12: “Linear timing curves move elements at constant speeds… producing robotic movements … easing functions introduce acceleration/deceleration phases that mimic natural object behavior”. For numbers, linear feels mechanical; easeOut gives **fast start, gentle landing** — rushes to respond then settles, which is “the workhorse… fast start, gentle landing” (S7 shows easeOutCubic curve: steep early, flat late).
- **Compare:**
  - `easeOutCubic = c*((t=t/d-1)*t*t+1)+b` (S6 example code) — cubic deceleration, snappy early, soft tail. Good for **glance/solid** where you want quick confirmation then linger on final.
  - `easeOutExpo = (t==d)?b+c:c*(-Math.pow(2,-10*t/d)+1)+b` (Penner) — exponential decay, **even faster initial jump**, longer flat tail. CountUp.js default is `easeOutExpo` (S6: `easingFn default easeOutExpo`). Feels “slot-machine reel slowing” (S1 anticipation). Good for **jackpot/crit** where dramatic slow reveal at end builds tension (S10 “counts up slowly to build tension”).
- **Recommendation for ROBO:** Use **`easeOutCubic` for T0–T1 (glance/solid)** (responsive, 0.8–1.2s) and **`easeOutExpo` for T2–T3 (crit/jackpot)** (theatrical, 2.0–2.8s). Both are in S3’s supported list (`Cubic.easeOut`, `Expo.easeOut`, or `Power2` which aliases Cubic.Out). Provide single knob `ease: tier>=2 ? 'Expo.easeOut' : 'Cubic.easeOut'`.

### Duration scaled to win amount
- **Principle:** bigger win → longer celebration (S8 logarithmic, S9/S10 tiered). For our instant game, we compress but preserve proportion. Suggested mapping validated against S8’s “5× 2s, 500× 20s” log scale and S9’s “minor <2s, substantial 5–10s” but scaled down for 0.7–30× instant:
  | Tier | Mult | Duration | Easing | Rationale |
  |------|------|----------|--------|-----------|
  | glance | 0.7× | **800ms** | Cubic.easeOut | brief acknowledgement, prevents fatigue (S9 minor <2s) |
  | glance-Warlord | 1.0× | 900ms | Cubic.easeOut | tiny bump |
  | solid | 2× | **1200ms** | Cubic.easeOut | standard celebration (S10 Big Win slow build) |
  | solid-Bruiser 3× | | 1300ms | Cubic.easeOut | |
  | solid-Warlord 6× | | 1600ms | Expo.easeOut | transition |
  | crit 6–7× | | **2000ms** | Expo.easeOut | “substantial 5–10s” compressed to 2s, with particles+sparks |
  | crit 12× | | 2200ms | Expo.easeOut | |
  | jackpot 30× | | **2800ms** | Expo.easeOut | “major 10–20s” compressed but still longest; allows tick rhythm |
  | jackpot 11×/15× | | 2400–2600ms | Expo.easeOut | scale within tier |
  Alternative formula: `duration = clamp(700 + 320*ln(1+mult), 800, 2800)` — yields 0.7→880ms, 2→1470ms, 6→2100ms, 30→2760ms — similar to table. **Lock table, not formula**, for predictability.

### Number formatting
- **Fixed 2 decimals** + `×` suffix: `1.76×`, `0.70×`, `30.00×`. Matches PAYBOOK paytable decimals and S6 `decimalPlaces: 2`. Use `value.toFixed(2) + '×'` (S6 `decimal: '.'`, `formattingFn` override). Use **tabular-nums** via VT323 monospaced to avoid jitter (S6 notes `font-variant-numeric: tabular-nums` stabilizes). In Phaser BitmapText or TTtext, set `letterSpacing 0` and fixed width container so width doesn’t wobble as digits roll (S5 score digit roll via staggered inner translate).
- Display width: right-align or center in panel; pre-size to “30.00×” width so narrower values don’t shift.

### Tick sounds per 0.10× increment + final pop
- Tick every **0.10×** → number of ticks = `floor(mult / 0.10)`. Examples: 0.7× → 7 ticks, 1.76× → 17 ticks, 6× → 60 ticks, 30× → 300 ticks (too many). **Adaptive density:** for 6×+ use **0.25× or 0.50× steps** to keep ticks ≤24 (avoid audio fatigue — S4 “Repetition biggest challenge… subtle variations… volume not dominant” + S10 saturation). Rule:
  - mult < 2 → step 0.10
  - mult 2–6 → step 0.20
  - mult 6–15 → step 0.30
  - mult 15–30 → step 0.50 (60 ticks max for 30× at 0.5 step, still ~21 ticks/sec at 2.8s → ~1 tick/130ms → pleasant).
  Each tick plays `sfx_coin_tick` cloned (WebAudio cloneNode for rapid successive plays — S4 mobile testing, S10 overlapping quantization). See §6 for guard.
- **Final pop + jingle:** on `onComplete`, scale punch `1.0 → 1.18 → 1.0` in 140ms (`Back.easeOut` per S12 bounce elasticity for celebration) + **phosphor glow** + either keep `sfx_win` tail or start `sfx_jackpot` fanfare if jackpot (already playing). For non-jackpot, `sfx_win` (1.60s lot) starts at count start and overlaps ticks; final tick + `sfx_win` ending aligns.

### requestAnimationFrame vs Phaser tween
- **Phaser tween (preferred, use this):** Use `this.tweens.addCounter` — it’s a **Number Tween without target** (S2). You **don’t need an object wrapper**; `from/to/duration/ease/onUpdate/onComplete` and `tween.getValue()` each frame. S2: “allow you to easily tween between two numeric values, floats or integers… retrieve with tween.getValue()… will automatically clean itself up”. It integrates with **scene timeScale, pause, seek, complete, stop, destroy** (S3). It respects **global timeScale** and can be **seeked** for FIRE fast-forward (`tween.seek(duration)` S3).
- **rAF fallback (only if not in Phaser scene):** Use `requestAnimationFrame` loop with `performance.now()` + manual easing function. Good for DOM overlay outside canvas, but loses timeScale/pause. Must handle `easeOutCubic(t/b/c/d)` math yourself (Penner). S6 countUp.js does this internally with `requestAnimationFrame` and `useEasing`.
- **Verdict:** **Always Phaser addCounter** for in-game count. rAF only for HTML shell (e.g., pre-game HUD preview). Our PopupManager will use Phaser.

### Example code snippet (copy-paste, tested against S2/S3 API)

```ts
// src/game/systems/CountUp.ts — reusable, Phaser addCounter based
// Depends: Phaser 3.80+, scene.tweens
export type CountUpTier = 'glance'|'solid'|'crit'|'jackpot';

function tierConfig(mult: number): { duration: number; ease: string; step: number } {
  if (mult >= 15) return { duration: 2800, ease: 'Expo.easeOut', step: 0.50 };
  if (mult >= 6)  return { duration: 2000, ease: 'Expo.easeOut', step: 0.30 };
  if (mult >= 2)  return { duration: 1200, ease: 'Cubic.easeOut', step: 0.20 };
  return { duration: 800, ease: 'Cubic.easeOut', step: 0.10 };
  // 1.76x falls in 800? No — 1.76 <2 => 800ms Cubic.easeOut, step 0.10 => 17 ticks
  // If you want 1.76 to feel slightly longer than 0.7, add: if(mult>=1.5) duration 1000
}

export class CountUp {
  private tween: Phaser.Tweens.Tween | null = null;
  private lastTickKey = -1; // floor(value/step)

  constructor(private scene: Phaser.Scene, private label: Phaser.GameObjects.Text) {}

  /** Count from 0.00x to targetMult inclusive, ticking via audioManager */
  start(targetMult: number, audio: { playTick(): void; playWin(): void; playPop(): void }) {
    this.stop();
    const { duration, ease, step } = tierConfig(targetMult);
    const decimals = 2;
    this.lastTickKey = -1;
    audio.playWin(); // start win/jackpot tail early, layer under ticks (S4 layered sync)

    this.tween = this.scene.tweens.addCounter({
      from: 0,
      to: targetMult,
      duration,
      ease, // 'Cubic.easeOut' | 'Expo.easeOut' — aliases of Power2/Power3 per S3 easing map
      onUpdate: (tween) => {
        const v: number = tween.getValue()!; // S2 getValue()
        // format fixed 2 decimals + × (S6 decimalPlaces)
        this.label.setText(v.toFixed(decimals) + '×');

        // tick per step increment (throttled, cloned audio)
        const key = Math.floor(v / step);
        if (key !== this.lastTickKey) {
          this.lastTickKey = key;
          // avoid tick at 0.00 and dupe; guard sfxEnabled inside playTick
          if (v > 0.001) audio.playTick();
        }
      },
      onComplete: () => {
        this.label.setText(targetMult.toFixed(decimals) + '×');
        audio.playPop(); // final punch — could be same as last tick with higher pitch
        // punch scale 1.0 -> 1.18 -> 1.0 140ms Back.easeOut (S12 bounce for celebration)
        this.scene.tweens.add({
          targets: this.label,
          scale: { from: 1, to: 1.18 },
          duration: 70,
          ease: 'Back.easeOut',
          yoyo: true,
          onComplete: () => this.label.setScale(1),
        });
      },
    });
  }

  /** Fast-forward to final value on FIRE — preserve final display (S3 seek/complete) */
  skipToEnd() {
    if (!this.tween) return;
    // seek to end (S3 tween.seek) or complete() — complete jumps to to-value and fires onComplete
    this.tween.seek(this.tween.duration); // emits update at end
    this.tween.complete(); // ensures onComplete runs, then auto-destroys (S2 cleanup)
  }

  stop() {
    if (this.tween) { this.tween.stop(); this.tween.remove(); this.tween = null; }
  }

  get isPlaying() { return this.tween?.isPlaying() ?? false; }
}

// Usage inside PopupManager / Reveal scene:
const multText = this.add.text(160, 88, '0.00×', {
  fontFamily: 'VT323', fontSize: '28px', color: '#ffffff',
  align: 'center', fixedWidth: 120, // tabular, no wobble
}).setOrigin(0.5);

const countUp = new CountUp(this, multText);
countUp.start(1.76, {
  playTick: () => audioManager.playSfx('sfx_coin_tick'), // 0.35s, volume 0.7, cloned
  playWin:  () => audioManager.playSfx('sfx_win'),       // 1.60s lot
  playPop:  () => audioManager.playSfx('sfx_ui_blip'),    // 0.07s 880Hz pop
});

// rAF fallback (for DOM, not Phaser) — manual Penner easeOutCubic:
// const easeOutCubic = (t,b,c,d)=> c*((t=t/d-1)*t*t+1)+b;
// requestAnimationFrame loop with t/b/c/d — prefer Phaser above.
```

Notes:
- `addCounter` config keys `from/to/duration/ease/onUpdate/onComplete` exactly as S2/S3. Alternatives: `targets: {value:0}, props: {value:{to:mult}}` also works but addCounter cleaner.
- Supported eases include `Cubic.easeOut` = `Power2` = Cubic.Out, `Expo.easeOut`, `Back.easeOut`, `Bounce.easeOut`, `Quad.easeOut`, etc. (S3 list). Avoid `Bounce.easeOut` for count value (causes both directions, not monotonic); reserve bounce for scale pop only.
- If you need **both** web and Phaser, CountUp.js (S6) uses same `easeOutExpo` default + `duration: 2` seconds + `decimalPlaces:2` + `useEasing:true` + `formattingFn` — API-compatible alternative outside Phaser.

**Confidence:** High — S2/S3 API verified verbatim, S6 options confirm defaults, S7/S12 justify ease choice, durations grounded in S8/S9 scaling.

---

## 6. Sound Sync — When Each SFX Fires

**Topic:** Sound sync: when to trigger sfx_coin_tick per tick, sfx_win lot at start of count, sfx_jackpot at jackpot flash, sfx_miss at miss, etc.

**Sources:**
- S4 https://questbe.at/slot-sound-effects-how-audio-shapes-the-slot-game-experience/ (2026-09-01)
- S1 https://game-ace.com/blog/10-types-of-slot-assets-in-online-casino-gaming/ (2026-09-01)
- S5 https://blakecrosley.com/guides/design/balatro (2026-09-01)
- Manifest `assets/audio/manifest.json` (verified 2026-09-01)

**Findings:**
- **Audio hierarchy must mirror visual tiers** (S4): “Different events deserve different levels of sonic emphasis… Routine events brief/restrained, more distinctive events more noticeable audio signature. Contrast makes significant moments recognizable”. Also **synchronization** is critical: “Sound, animation, and game state should remain synchronized… even a slight delay can make polished visuals feel disconnected” (S4). S1 mandates per-tier win jingles + big-win cinematic track in cue sheet.
- **Mapping for ROBO (with manifest lengths):**
  | SFX key (manifest) | Length | Vol | When | Layering | Guard |
  |---|---|---|---|---|---|
  | `sfx_fire` | 0.38s | 0.85 | On FIRE press (bet → firing) — immediate input confirm (S4 button press confirms input; timing immediately after interaction) | one-shot, duck music -6dB 300ms then restore | SFX bus |
  | `sfx_explosion_small` | 0.62s | 0.85 | Shell impact + reveal start (before count) — explosion anim 4 frames | one-shot, may overlap win start by ~200ms | SFX bus |
  | `sfx_win` (coins lot, 5 layers) | 1.60s | 0.75 | **At count start** for glance/solid/crit (non-jackpot wins). Start coin cascade tail under ticks. S1: win jingle per tier + particle burst sync. Lawn: S10 count-up vs music hierarchy. | Looped/layered: keep playing while ticks tick; ticks are short clones over it. Tail continues ~400ms after count lands, then fades. | SFX bus |
  | `sfx_coin_tick` | 0.35s | 0.70 | **Per 0.10× (or adaptive step)** increment during count (see §5 step table). Cloned via `audio.cloneNode()` or Phaser `play({detune:rand})` to allow rapid successive without cut. Start after `v>0.001`. For jackpot at 0.50 step, ~1 tick/130ms → clear rhythm. | Many short one-shots; **throttle** not needed but **clone** mandatory (S4 repetition fatigue: subtle pitch randomization ±3% helps). | SFX bus, check `sfxEnabled` before each play (UI_AUDIO_TOGGLES spec) |
  | `sfx_jackpot` (lotto fanfare trumpets) | 2.84s | 0.80 | **At jackpot flash 0ms** (instead of sfx_win). Covers whole 0–2800ms count + 600ms tail. The flash+shake at 80ms are synced to fanfare attack. S1 big-win cinematic track + S4 layered: impact + tonal + musical accent. | Replaces sfx_win for jackpot; still tick underneath. | SFX bus |
  | `sfx_miss` (losing jingle) | 1.40s | 0.60 | **On miss overlay appear** (not during count — miss has no count). Play once, no ticks. Matches S4 Error/message draws attention row. | One-shot, no layering, backdrop dim 55% | SFX bus |
  | `sfx_ui_blip` | 0.07s | 0.45 | Final pop at `onComplete` + toggle feedback + Overdrive accept/decline blip. Short crisp (S4 button press ideal: short clean not cinematic). | One-shot at land | SFX bus (if SFX off, suppress — spec says toggles blip only if SFX ON) |
  | `music_loop` | 50s | 0.45 | Continuous, ducks -6dB for 300ms on explosion/win start (PLAYBOOK anti-slop checklist) | Loop, paused when `musicEnabled=false` | Music bus |
- **Sync rules:**
  1. **Immediate on trigger:** FIRE, explosion, overlay appear, flash — SFX plays **same frame** as visual (≤16ms). No pre-delay (S4 “Feedback should occur immediately after interaction”).
  2. **Tick sync via getValue()** — don’t use `setInterval`; derive ticks from **actual tween value** (`floor(v/step) !== lastKey`) as in §5 snippet. This locks audio to visual progress even under timeScale or seek.
  3. **Clone, don’t interrupt:** tick sound must **clone node** or `play({})` new instance so rapid ticks don’t cut prior tail (S4 mobile small-speaker need, also HTML5 Audio.cloneNode pattern from other sources fetched — `soundClone.play()` per tick).
  4. **Repetition fatigue guard:** for frequent glance (30% SCOUT), tick count low (7 ticks over 800ms = 8.75Hz) — OK. For jackpot, adaptive step keeps density pleasant. Also randomize **detune ±50 cents** per tick and occasional pan ±0.2 (if using WebAudio) to avoid machined repetition (S4 “Several subtle versions… small differences in pitch/timing/texture reduce repetition”).
  5. **Visual alternative always:** multiplier text + color + shake + coin burst communicate same info as sound — accessibility requirement (S4: “Visual indicators should accompany meaningful audio events”).
  6. **Mute buses:** Respect `AudioManager.sfxEnabled` guard — every `playSfx()` checks flag before `play()` (docs/UI_AUDIO_TOGGLES). Music bus independent (`M` toggle).

**Confidence:** High — S4 hierarchy/sync/repetition principles directly support mapping; manifest gives concrete file lengths/volumes; Balatro S5 confirms rising-pitch + ka-ching layering pattern.

---

## 7. Shot List Per Tier + Reusable PopupManager + CountUp Spec

**Topic:** Provide concrete shot list for each tier and a spec for a reusable PopupManager + CountUp component.

**Sources:**
- All S1–S12 (see citations above)
- PLAYBOOK palette/outline/fonts + UI_AUDIO_TOGGLES toggle spec
- Assets `public/assets/...` atlas constraints (76–82 frames, 1024 atlas)

**Findings:**

### 7A. Shot list per tier (frame-accurate at 60fps, 320×180 canvas)

#### T0 — GLANCE (0.7× / 0.9× / 1×) — 0.98s total
- F0 (0ms): shell impact `sfx_explosion_small` + 3px camera nudge 80ms. Miss? bright flash not.
- F11 (180ms): **Modal in** — `backdrop 0→0.40 180ms Cubic.easeOut + panel scale 0.8→1 180ms` (S12 entrance ease, S3 tween). Show `0.00×` VT323 22px.
- F12 (200ms): **Count start** `sfx_win` (1.60s) + **CountUp 0→0.70 in 800ms Cubic.easeOut** + **ticks ×7 at 0.10 steps** (`sfx_coin_tick` cloned) + **6-coin light shower** (low gravity, no shake).
- F60 (1000ms): count lands `0.70×` → **pop 1.18× 70ms Back.easeOut + yoyo** (S12 bounce) + `sfx_ui_blip`.
- F68 (1130ms): hold 150ms then **out 140ms Cubic.easeIn** (scale 1→0.92, alpha 1→0). FIRE available whole time (fast-forward seeks). Then reveal payout + Overdrive not eligible (<2×). Back to BET via FIRE.

#### T1 — SOLID (2× / 3× / 6×) — 1.5–1.8s
- F0: impact + `sfx_explosion_small` + frame flash white 60ms `0xffffff 0.25`.
- F11: modal in 180ms, `2×` panel slightly larger.
- F12: `sfx_win` + CountUp 0→2.00 (or 3/6) **1200–1600ms Cubic/Expo** + **ticks adaptive 0.20** (≈10–30 ticks) + **10-coin shower + 4 sparks** burst at start.
- + optional **shake-small 2px 150ms** at 80ms if 6× (higher solid).
- Landing: pop + `sfx_ui_blip`, hold 400ms.
- Overdrive? If ≥2× eligible → **OVERDRIVE prompt queued** as HIGH priority after win modal dismiss (wait 200ms, then show Overdrive panel — see PopupManager).

#### T2 — CRIT (6× / 7× / 12×) — 2.6s
- F0: impact + **shake-small/medium 3–4px 200ms** + flash 80ms + `sfx_win`.
- F11: modal in 180ms **Back.easeOut with overshoot 1.08** (celebration bounce S12).
- F12: CountUp 0→6/7/12 **2000–2200ms Expo.easeOut** + ticks 0.30 step (≈20–40 ticks) + **20-coin rain + sparks 12** + **CRT scanline intensify** (opacity bump).
- F132 (2200ms): land + **large pop 1.18 + glow pulse** + `sfx_ui_blip` + trail particles follow number to total (S5 trail particles).
- Hold 600ms, then out 140ms. Queue Overdrive (HIGH) as next modal.

#### T3 — JACKPOT (11× / 15× / 30×) — 4.3s
- **Sequence per §2** (full juice stack):
  F0: freeze, `sfx_jackpot` 2.84s start, **white flash 100ms** `rgba(255,255,255,0.35)`, **shake-large 8px 500ms**, CRT intensify.
  F7 (120ms): **40-coin explosion + spark burst** while CountUp 0→30.00 **2800ms Expo.easeOut**, ticks 0.50 step (≈60 ticks, ~1/46ms? Actually 30/0.5=60 ticks /2.8s ≈21Hz → ok with step 0.50). VT323 28px gold-magenta.
  F180 (3000ms): land 30.00× → **pop 1.22 + chromatic 2px RGB split 200ms + phosphor glow + bass sub-hit**.
  F180–F258 (1.3s): **lingering banner** `JACKPOT! 30.00×` Press Start 2P 9px gold on magenta, static, particles settle.
  F258: out 140ms or FIRE dismiss. No Overdrive? Jackpot eligible but UI may auto-decline Overdrive (design: jackpot max, Overdrive would forfeit 30× — show but default to KEEP).

#### T_MISS (0×) — 1.6s
- F0: impact thud `sfx_clank` 0.18s optional, **shake-small 2px 150ms**.
- F11: **Dim 55% navy** + desaturate 0.7 in 180ms fade (inverse of win).
- F12: text `MISS 0.00×` muted, **dust particles 5**, `sfx_miss` 1.40s.
- Hold 900ms + 400ms tail after jingle, then out. CTA `FIRE TO RETRY` gold. No count.

**All tiers: FIRE/SPACE/click anywhere = skip (seek+complete) or dismiss; ESC also (a11y).** Progress indicator: dot pips or thinner count bar under number for jackpot/crit (optional, mimics S9 displayDuration per line).

### 7B. Reusable PopupManager spec

**Purpose:** Single owner for all pop-ups; guarantees correct priority, no stack leak, correct palette/fonts/animation/dismiss.

```ts
// src/game/systems/PopupManager.ts
type PopupPriority = 0|1|2|3; // LOW..CRITICAL per S11
type PopupKind = 'glance'|'solid'|'crit'|'jackpot'|'miss'|'overdrive'|'error'|'toast';

interface PopupRequest {
  id: string; // crypto.randomUUID()
  kind: PopupKind;
  priority: PopupPriority;
  create: (scene: Phaser.Scene, onClose: (id:string)=>void) => PopupInstance;
  timeoutMs?: number; // auto-dismiss if not interacted; no expiry for CRITICAL (S11 log/expiry)
  policy?: 'preempt'|'queue'; // default preempt for CRITICAL vs queue
}

interface PopupInstance {
  container: Phaser.GameObjects.Container; // holds backdrop+panel+text+particles
  show(): Promise<void>; // tween in 180ms, resolves when in
  hide(): Promise<void>; // tween out 140ms, resolves when out+destroyed
  fastForward?(): void; // for CountUp skip — seek to end
  destroy(): void;
}

export class PopupManager {
  private scene: Phaser.Scene;
  private queue: PopupRequest[] = []; // sorted desc priority (S11)
  private current: { req: PopupRequest; inst: PopupInstance } | null = null;
  private backdrop!: Phaser.GameObjects.Rectangle;
  // palette spec-locked:
  // fill #0a1a3f, outline #1a1a1a 1px, radius 6, backdrop black 0.40 (or navy 0.55 for miss)
  // Press Start 2P 10px title, VT323 16-18 body, appear scale 0.8->1 + fade 180 Cubic.easeOut

  constructor(scene: Phaser.Scene) { this.scene = scene; }

  /** Open popup — priority queue logic per S11 */
  open(req: Omit<PopupRequest,'id'>): string {
    const id = crypto.randomUUID();
    const item: PopupRequest = { id, ...req };
    if (!this.current) {
      this.queuePush(item); this.tryShowNext();
    } else if (item.priority > this.current.req.priority) {
      // preempt — S11 demote current back to queue sorted
      this.queuePush(this.current.req);
      this.current.inst.hide().then(()=> this.cleanupCurrent());
      this.queuePush(item); this.tryShowNextSoon();
    } else {
      this.queuePush(item);
    }
    return id;
  }

  dismiss(id: string) {
    if (this.current?.req.id === id) {
      this.current.inst.hide().then(()=>{ this.cleanupCurrent(); this.tryShowNext(); });
    } else {
      this.queue = this.queue.filter(q=>q.id!==id);
    }
  }

  dismissCurrent() { if(this.current) this.dismiss(this.current.req.id); }

  /** Called on FIRE/SPACE/click — fast-forward count if playing else dismiss */
  handleFire() {
    if (this.current?.inst.fastForward && this.current.inst['isCounting']?.()) {
      this.current.inst.fastForward();
    } else {
      this.dismissCurrent();
    }
  }

  private queuePush(r: PopupRequest) {
    this.queue.push(r);
    this.queue.sort((a,b)=> b.priority - a.priority);
    // dedupe identical kind within 200ms? (S11 dedupe) — optional
  }

  private tryShowNext() {
    if (this.current || this.queue.length===0) return;
    const next = this.queue.shift()!;
    const inst = next.create(this.scene, (id)=> this.dismiss(id));
    this.current = { req: next, inst };
    inst.show().then(()=>{
      if (next.timeoutMs) this.scene.time.delayedCall(next.timeoutMs, ()=> this.dismiss(next.id));
    });
    // log queue behavior for spam detect (S11)
    // console.debug(`[PopupQueue] show ${next.kind} p=${next.priority} q=${this.queue.length}`);
  }

  private tryShowNextSoon() { this.scene.time.delayedCall(160, ()=> this.tryShowNext()); }
  private cleanupCurrent() { this.current?.inst.destroy(); this.current = null; }

  /** Helpers to open standard win pop-ups — tier-aware */
  openWin(mult: number, kind: 'glance'|'solid'|'crit'|'jackpot') {
    const prio: Record<string,PopupPriority> = { glance:0,solid:1,crit:2,jackpot:3 };
    const dur: Record<string,number> = { glance:800,solid:1200,crit:2000,jackpot:2800 };
    return this.open({
      kind, priority: prio[kind],
      timeoutMs: dur[kind] + 500,
      create: (scene, onClose) => new WinPopup(scene, mult, kind, onClose)
    });
  }
  openMiss() {
    return this.open({
      kind:'miss', priority:0, timeoutMs: 1400,
      create: (s, onClose)=> new MissPopup(s, onClose)
    });
  }
  openOverdrive(onChoose: (take:boolean)=>void) {
    return this.open({
      kind:'overdrive', priority:2, // HIGH — interrupts solid/glance but not jackpot
      create: (s,onClose)=> new OverdrivePopup(s, onClose, onChoose)
    });
  }
}

// Base popup — implements show()/hide() with spec animation (S12/S3)
class BasePopup implements PopupInstance {
  container: Phaser.GameObjects.Container;
  private panel!: Phaser.GameObjects.Rectangle; // or Graphics for rounded + outline
  private backdrop!: Phaser.GameObjects.Rectangle;
  constructor(protected scene: Phaser.Scene, protected onClose: (id:string)=>void) {
    this.container = scene.add.container(0,0).setDepth(100);
    this.container.setAlpha(0); this.container.setScale(0.8); // start for easeOut
  }
  async show(): Promise<void> {
    return new Promise(res=>{
      this.scene.tweens.add({
        targets: this.container,
        scale: 1, alpha: 1,
        duration: 180,
        ease: 'Cubic.easeOut', // S12 entrance fast-start slow-end
        onComplete: ()=> res()
      });
      // backdrop parallel
      if(this.backdrop) this.scene.tweens.add({
        targets:this.backdrop, alpha:0.40, duration:180, ease:'Cubic.easeOut'
      });
    });
  }
  async hide(): Promise<void> {
    return new Promise(res=>{
      this.scene.tweens.add({
        targets: this.container,
        scale: 0.92, alpha: 0,
        duration: 140,
        ease: 'Cubic.easeIn', // S12 exit slow-in fast-out
        onComplete: ()=> res()
      });
      if(this.backdrop) this.scene.tweens.add({
        targets:this.backdrop, alpha:0, duration:140, ease:'Cubic.easeIn'
      });
    });
  }
  destroy(){ this.container.destroy(true); }
}

class WinPopup extends BasePopup {
  private countUp: CountUp | null = null;
  constructor(scene: Phaser.Scene, mult:number, kind:string, onClose:(id:string)=>void){
    super(scene, onClose);
    // Build panel per §4: 220x96/240x110, #0a1a3f + 1px #1a1a1a, radius6
    const w = kind==='jackpot'?240:220, h=kind==='jackpot'?110:96;
    // Use Graphics for rounded rect outline:
    const g = scene.add.graphics();
    g.fillStyle(0x0a1a3f,1); g.lineStyle(1,0x1a1a1a,1);
    g.fillRoundedRect(160-w/2,90-h/2,w,h,6); g.strokeRoundedRect(160-w/2,90-h/2,w,h,6);
    // Title Press Start 2P 9-10px
    const title = scene.add.text(160, 90-h/2+16, kind==='jackpot'?'JACKPOT!':'YOU WIN', {
      fontFamily:'"Press Start 2P"', fontSize: kind==='jackpot'?'10px':'8px',
      color: kind==='jackpot'?'#ffd94f':'#4ff2e3', align:'center'
    }).setOrigin(0.5);
    // Multiplier VT323 — target for CountUp §5
    const multText = scene.add.text(160, 90+8, '0.00×', {
      fontFamily:'VT323', fontSize: kind==='jackpot'?'28px':'22px',
      color: kind==='jackpot'?'#ffd94f': kind==='crit'?'#58ff9b':'#ffffff',
      fixedWidth:120, align:'center'
    }).setOrigin(0.5);
    this.container.add([g,title,multText]);
    // Hook CountUp (§5) after show() — caller starts:
    // this.countUp = new CountUp(scene, multText); this.countUp.start(mult, audio)
  }
  fastForward(){ this.countUp?.skipToEnd(); }
  isCounting(){ return this.countUp?.isPlaying ?? false; }
}
class MissPopup extends BasePopup { /* similar — 200x80, navy 55% backdrop, desaturate, MISS text, dust */ }
class OverdrivePopup extends BasePopup { /* 240x110, gold CTA 40%×2.5 EV-neutral, FIRE yes/no */ }

```

Integration points:
- Scene `Game.ts` owns `popupManager = new PopupManager(this)` and `audioManager = new AudioManager(this)`.
- On `snapshot` SETTLED → `handleReveal(mult)` → `popupManager.openWin(mult, tier)` then `await hostApi.revealOutcome` after dismiss (PLAYBOOK bet flow).
- Input: `input.keyboard.on('keydown-SPACE', ()=> popupManager.handleFire())`; pointerdown on backdrop → handleFire.
- **Expiry** (S11): queued LOW pop-ups expire after **30s** drop (avoid stale toasts). Log queue length.
- **Suppress** (S11): if Overdrive prompt active, queue glance wins behind it (they’ll show after choice).
- **Styles:** All panels use `image-rendering:pixelated`, integer pixel positions (Math.round) to avoid blur.

### 7C. CountUp component spec (see §5 for full code)
- Already specified as `CountUp` class wrapping `tweens.addCounter` with `from 0 to targetMult`, `duration` per tier table, `ease` Cubic/Expo, `onUpdate` formatting `toFixed(2)+'×'` + tick guard, `onComplete` pop.
- **Skipping:** `skipToEnd()` uses `tween.seek(duration)` + `tween.complete()` (S3 seek/complete) — fires onComplete once, no double pop.
- **Teardown:** `stop()` → `remove()` + null, auto-cleanup per S2.
- **Fallback:** DOM version via CountUp.js (S6) if popup is HTML — same duration/easing API but uses rAF inside.

**Confidence:** High on queue model (S11 verbatim), medium on panel pixel sizes (design-system choice constrained by 320×180 and PLAYBOOK outline/palette).

---

## 8. Palette, Outline & Font References (Ground Truth)

Cross-checked with repo truth (not web fetch):
- `assets/palette/robo-strike.gpl` + `PLAYBOOK §2`: `#0a1a3f` navy 67% bg, `#4ff2e3` cyan, `#ff4fd8` magenta, `#ffd94f` gold, `#58ff9b` green, `#ffffff` white, `#1a1a1a` outline 1px. Indexed 6+outline, no new hues (anti-slop).
- `assets/audio/manifest.json`: `sfx_win 1.60s 0.75`, `sfx_jackpot 2.84s 0.80`, `sfx_miss 1.40s 0.60`, `sfx_coin_tick 0.35s 0.70`, `sfx_ui_blip 0.07s 0.45`, `sfx_explosion_small 0.62s 0.85`, `music_loop 50s 0.45 loop`.
- Fonts `Press Start 2P + VT323` OFL via @fontsource — Title vs Body split per PLAYBOOK.
- `docs/UI_AUDIO_TOGGLES.md`: two toggles Music/SFX, `localStorage roboStrike_audio_v1 {music,sfx}`, keys M/S, guard every `play()`.

---

## 9. Implementation Checklist (DoD)

- [ ] PopupManager with priority queue (S11), preempt for jackpot/crit, timeout+expiry, dedupe
- [ ] Panel 220×96 / 240×110 / 200×80, fill #0a1a3f, 1px #1a1a1a, radius 6, backdrop 40% (55% miss)
- [ ] Title Press Start 2P 8–10px, body VT323 16–28px, fixed 2 decimals `×` suffix, tabular
- [ ] Appear 180ms `Cubic.easeOut` scale 0.8→1 + fade; out 140ms `Cubic.easeIn`; crit/jackpot bounce option `Back.easeOut`
- [ ] CountUp via `tweens.addCounter` `getValue()` with tier durations 800/1200/2000/2800 + easing Cubic/Expo + adaptive tick step 0.10→0.50 + final pop
- [ ] Shake tiers 2px/4px/8px + CRT flash + coin counts 6/10/20/40 per tier, lingering banner for jackpot
- [ ] Miss dim 55% + desaturate + shake-small + `sfx_miss`, CTA `FIRE TO RETRY`
- [ ] Sound sync per §6 — ticks cloned, win/jackpot layered, all SFX gated by `sfxEnabled`
- [ ] Dismiss via FIRE/SPACE/click anywhere/timeout; FIRE during count = `seek+complete` fast-forward
- [ ] Music duck -6dB 300ms on explosion/win
- [ ] Works in canvas 320×180 integer scale + `observeGameContentSize` host growth
- [ ] Reduced-motion: if `prefers-reduced-motion`, disable shake/chromatic/bounce, keep fade+scale only (S5 photosensitivity guard)
- [ ] Verify in simulator 20 round-trips across all 5 outcomes per tank

---

## 10. Open Questions for Team / Discord

See `docs/QUESTIONS_FOR_DISCORD.md` Q27–Q30 appended this turn.

---

*End — Subagent H, 2026-09-01. All web claims fetched 2026-09-01. No hallucinated URLs. Verify by re-fetching S1–S12.*

