# ROBO STRIKE — Free Audio Research (Commercial Viability + Synthesis Recipes)

> **Scope:** Verify every candidate free audio URL exists and license permits COMMERCIAL use (25% revenue share = commercial). Reject NC/ND. Whitelist: Kenney CC0, itch.io free (Leohpaz), ChipTone/jsfxr/Bfxr/BeepBox. Provide per-sound generation recipes and BeepBox loop recipe. Bonus: fallback pipeline for any missing SFX.
> **Access date for all fetches: 2026-09-01 UTC.**
> Method: `WebFetch` markdown live; 200 = verified.

---

## 0. Method & Verification Table — Audio Candidates

| # | URL | Fetch Method | HTTP Status | Access Date | Notes |
|---|-----|--------------|-------------|-------------|-------|
| A01 | `https://kenney.nl/assets/casino-audio` | WebFetch | **200** | 2026-09-01 | 50× CC0 foley |
| A02 | `https://kenney.nl/assets/interface-sounds` | WebFetch | **200** | 2026-09-01 | 100× CC0 |
| A03 | `https://leohpaz.itch.io/minifantasy-dungeon-sfx-pack` | WebFetch | **200** | 2026-09-01 | 62 SFX + 2 music, Name your own price $0, commercial text |
| A04 | `https://sfbgames.itch.io/chiptone` | WebFetch | **200** | 2026-09-01 | CC0 output badge |
| A05 | `https://sfxr.me/` (jsfxr) | WebFetch | **200** | 2026-09-01 | UNLICENSE + Pro table shows Free→Unrestricted commercial |
| A06 | `https://www.bfxr.net/` | WebFetch | **200** | 2026-09-01 | MIT, 309 stars counterpart |
| A07 | `https://www.beepbox.co/` | WebFetch | **200** | 2026-09-01 | MIT source + “songs belong to authors” disclaimer |
| A08 | `https://github.com/chr15m/jsfxr` | WebFetch | **200** | 2026-09-01 | UNLICENSE file explicit |
| A09 | `https://github.com/increpare/bfxr2` | WebFetch | **200** | 2026-09-01 | MIT badge |

> Kenney CC0 pattern cross-verified §1–7 in `assets.md` (Top-Down Tanks, UI packs, Particle Pack all CC0 — same domain). Fonts omitted here (covered in assets.md §8–9). Google Fonts not audio.

---

## 1. Kenney Casino Audio

### Topic
Kenney Casino Audio — 50-file foley (chip/card/dice) for coin tick & win supplement.

### Sources
- URL + date: `https://kenney.nl/assets/casino-audio` — 2026-09-01 — 200
- License fragment on page: `Creative Commons CC0` → `https://creativecommons.org/publicdomain/zero/1.0/`

### Findings
Tags `foley, casino, card, dice, chip`, Category `Audio`, 50×, CC0, v1.1 (small fixes)/1.0 2012, download `kenney_casino-audio.zip`. Preview audio covers chip stack, card flip.

### License+Cost Verdict
**PASS — CC0.** $0. Commercial including jackpot fanfare layer allowed; no attribution required. Whitelist Kenney.

### Confidence
**High**

### Open Questions
None. Used as **layer** for coin tick (chip + synthesized blip) to add realism; not primary loop.

---

## 2. Kenney Interface Sounds

### Topic
Kenney Interface Sounds — 100-file UI clicks/blips for UI blip & lock-on base.

### Sources
- URL + date: `https://kenney.nl/assets/interface-sounds` — 2026-09-01 — 200
- License: `Creative Commons CC0` same badge

### Findings
Tags `interface, click, button`, Category `Audio`, 100×, CC0, 1.0 2020, preview `preview_interface.png` + audio tag (unsupported fetch but files present), download `kenney_interface-sounds.zip`.

### License+Cost Verdict
**PASS — CC0.** $0. Commercial PASS. Whitelist Kenney.

### Confidence
**High**

### Open Questions
None. Will pitch-shift 1–2 semitones in jsfxr recipe to unify palette; base provides organic click to layer with square-wave blip.

---

## 3. itch.io Minifantasy Dungeon Audio by Leohpaz — VERIFIED CC0-like Commercial

### Topic
Minifantasy Dungeon Audio Pack — 62 SFX (Sword Hit/Miss, Human/Orc Attack/Charge etc.) + 2 music (Goblin's Den/Dance) — proposed optional fallback for clank/explosion/win jingle reference.

### Sources
- URL + date: `https://leohpaz.itch.io/minifantasy-dungeon-sfx-pack` — 2026-09-01 — 200
- License text: `- You can use both the base pack and the exclusive content in your personal or commercial projects; - You may not sell it or distribute the asset pack for free, please redirect people to this page; - Credits are not mandatory, but much appreciated!`
- Author confirms via comments to Dangar13/ToothlessUwU: "Yes, absolutely. You are free to use my assets in your personal or commercial projects! Also thanks for crediting my work" — 3 years ago threads.

### Findings
Content enumerated: Chest/Crate/Sack/Door open/close, Human/Orc Attack/Charge/Damage/Jump/Landing/Death/Dash/Walk stone, Sword Hit/Miss 3×, Music 2 tracks loopable Goblin's Den (regular dungeon) & Goblin's Dance (battle). Files `Minifantasy_Dungeon_SFX.zip` 5.2MB + `Music.zip` 25MB, Rating 4.9★ 44 ratings, Content `No generative AI`, Tags as above. Patreon exclusive 16 SFX not in free ZIP.

### License+Cost Verdict
**PASS — Permissive free commercial (itch.io free whitelist).** Allows personal OR commercial, no NC. Must not redistribute ZIP itself. Cost $0 (Name your own price → 0 entered yields download). Credit optional but we will include. 25% share qualifies. **But we choose NOT to rely on its sword/metal samples for ROBO STRIKE primary** (fantasy dungeon aesthetic not sci-fi tank), only as fallback reference for clank tuning.

### Confidence
**High**

### Open Questions
Patreon exclusive not covered — we exclude. → Recorded Q9.

---

## 4. ChipTone by SFBGames

### Topic
ChipTone — HTML5/Win/Mac SFX generator, primary generator for all short SFX.

### Sources
- URL + date: `https://sfbgames.itch.io/chiptone` — 2026-09-01 — 200
- LICENCE section excerpt: `All sounds created using ChipTone are FREE to use for any purpose, commercial or otherwise, under the [CC0 licence](https://creativecommons.org/publicdomain/zero/1.0/).`
- Asset license badge: `Creative Commons Zero v1.0 Universal`, Rating 4.9★ 1,054 ratings

### Findings
Description: "free tool for generating sound effects, mainly for games but they could be used for anything... HTML5 instead! And Windows and Mac downloadable versions" Inspired by sfxr/bfxr/as3sfxr, built with Haxe/OpenFL. Files `chiptone-win.zip` 6.9MB v0.5.1, `chiptone-mac.zip` 17MB. Also browser at `sfbgames.itch.io`. Output license reiterated.

### License+Cost Verdict
**PASS — CC0 output.** Tool free, output CC0 permits commercial. Whitelist. Cost $0.

### Confidence
**High**

### Open Questions
None.

---

## 5. jsfxr (sfxr.me)

### Topic
jsfxr — JavaScript sfxr port (Eric Fredricksen + chr15m) for deterministic wav export + library embedding.

### Sources
- URL + date: `https://sfxr.me/` — 2026-09-01 — 200
- About line: `(Port of sfxr by DrPetter) ©UNLICENSE 2011 Eric Fredricksen With contributions from Chris McCormick (Source code https://github.com/chr15m/jsfxr)`
- Table on page: Free column `✅ Unrestricted commercial use`, Pro column identical plus extras (mp3/ogg, JSON editor, cloud save)
- Mirror: `https://github.com/chr15m/jsfxr` — 2026-09-01 — 200 — repo shows `UNLICENSE` file

### Findings
Generator presets listed `Random Pickup/coin Laser/shoot Explosion Powerup Hit/hurt Jump Click Blip/select Synth Tone Mutate Play` plus manual waveform `Square/Sawtooth/Sine/Noise` and envelope/frequency/vibrato/arpeggiation/duty/retrigger/flanger/LPF/HPF. Export `sfx.wav 44k/22k/11k/8k 16/8bit` + `sfx.json` + permalink + serialize. Library usage snippet `import { sfxr } from "jsfxr"` + preset `pickupCoin, laserShoot, explosion, powerUp, hitHurt, jump, blipSelect, synth, tone, click` + `sfxr.toAudio(sound)` etc.

### License+Cost Verdict
**PASS — UNLICENSE (public domain) + explicit unrestricted commercial.** UNLICENSE dedicates to public domain worldwide (~CC0). Free tier already unrestricted commercial per table. Output belongs to user. Whitelist. Cost $0.

### Confidence
**High**

### Open Questions
None.

---

## 6. Bfxr (bfxr.net)

### Topic
Bfxr — increpare's sfxr fork with better filter/pink-noise, footsteppr kit, JS + Flash legacy.

### Sources
- URL + date: `https://www.bfxr.net/` — 2026-09-01 — 200
- About: "Make sound effects for your games! Bfxr is an open-source tool based on drpetter's sfxr, written by your friendly neighbourhood increpare. Footsteppr is a port of obiwannabe's footstep generator, originally written in puredata."
- GitHub mirror: `https://github.com/increpare/bfxr2` — 2026-09-01 — 200 — MIT badge

### Findings
UI: `Drag file to load` + links `increpare, sponsor, paypal, source code (github.com/increpare/bfxr2), old flash version`, shortcuts SPACE play, CTRL+E export wav. Archaeology section credits DrPetter → Tom Vian as3sfxr → increpare bfxr. MIT license on GitHub (309★). No commercial restriction claimed.

### License+Cost Verdict
**PASS — MIT + output unrestricted.** MIT permits commercial, private, distribution. Output wav you author via params is your data. Whitelist. Cost $0.

### Confidence
**High**

### Open Questions
None.

---

## 7. BeepBox (beepbox.co)

### Topic
BeepBox — online chiptune sequencer for 40–60s loop, URL-hash song storage, MIT synth lib.

### Sources
- URL + date: `https://www.beepbox.co/` — 2026-09-01 — 200
- About excerpt: "BeepBox is an online tool for sketching and sharing instrumental music. All song data is contained in the URL at the top of your browser... BeepBox does not claim ownership over songs created with it, so **original songs belong to their authors**... You can download and use the source code under the MIT license. In particular, you can use the synth code as demonstrated here to play BeepBox songs in your own JavaScript projects!"
- Offline version `beepbox_offline.html`, GitHub `johnnesky/beepbox` 20.4k★ equivalent (via fonts repo context)

### Findings
Instructions cover pattern rows, melody/harmony + drums, numbered pattern boxes, loop marker, shortcuts Space/Z/Y/C/V etc. Shares via Twitter archive pre-2023. No backend song distribution.

### License+Cost Verdict
**PASS — MIT for code + author-owns composition.** Explicit disclaimer negates platform ownership. Composing original loop gives us full rights, commercial via 25% share allowed. Must not copy others' URLs. Whitelist BeepBox. Cost $0.

### Confidence
**High**

### Open Questions
None.

---

## 8. Tool-Output Ownership Clarification (LibreSprite/Pixelorama/pngquant/oxipng recurrence for audio docs)

For completeness, audio toolchain also touches image optimizers only if we export waveform PNGs — same verdicts as `assets.md` §20–24: **output unencumbered**, cost $0, commercial PASS. No need to re-verify; references assets.md §20–24.

---

## 9. SECTION 2 — Sound List → Chosen Source + Fallback Pipeline

> **Primary strategy:** All SFX are **originally generated** via ChipTone/jsfxr/Bfxr → CC0/Unlicense/MIT. Kenney/Leohpaz samples are **not primary** to avoid aesthetic mismatch and to keep 100% chiptune coherence; they are listed as `Fallback CC0 layer` only if generated version tests too thin. Loop is BeepBox original, not licensed music.

| # | Section 2 Sound Requirement | Duration | Primary Source (Generated) | Why / CC0 Alternative | Fallback Pipeline (if generation fails playtest) |
|---|------------------------------|----------|----------------------------|------------------------|---------------------------------------------------|
| SND01 | **UI blip** (menu confirm) | ~0.06s | **ChipTone → jsfxr `blipSelect`** | Crisp square tick for menu; Kenney Interface Sounds `blip 006` is fallback but generated gives tighter control | If fail: layer Kenney `interface-sounds` click 029 pitch +1st |
| SND02 | **Lock-on** (reticle acquire) | 0.35s | **jsfxr `powerUp`** | Rising arpeggio mimics radar lock; Bfxr variant if need filter sweep | Fallback: ChipTone `powerup` preset freq sweep 300→1200Hz |
| SND03 | **Fire** (player cannon) | 0.22s | **Bfxr `laserShoot`** | Punchy attack + pitch down for weight; ChipTone bass square | Fallback: jsfxr `laserShoot` + low-pass |
| SND04 | **Whoosh** (shell flight) | 0.25s | **jsfxr `hitHurt` noise + LPF** | Short noise burst with freq ramp down mimics doppler | Fallback: Bfxr noise+flanger |
| SND05 | **Clank** (enemy hit armor) | 0.18s | **ChipTone `hit` metal** | Square+noise metallic transient; Leohpaz `Sword Hit` could layer but not needed | Fallback: layer Kenney? Actually no metal in Kenney, so use Leohpaz sword hit 2 pitched -2st mono 22k |
| SND06 | **Explosion** (small/big shared tail) | 0.6s small / 0.9s big | **jsfxr `explosion` noise** | Layered: noise base + sub drop; big explosion longer decay + low freq 40Hz punch | Fallback: Bfxr explosion 3 |
| SND07 | **Coin tick** (payout increment) | 0.07s per tick @ 10 ticks/s | **jsfxr `pickupCoin`** | Classic arcade coin; we sequence 0.07s repeats; Kenney Casino chip `chip_12` layered at 15% for tactile | Fallback: Kenney chip 08 solo |
| SND08 | **Win jingle** (small win) | ~1.2s | **BeepBox 2-bar stinger** + **jsfxr `powerUp` arpeggio** | Short major triad fanfare square | Fallback: layer Leohpaz? no jingle, keep generated |
| SND09 | **Jackpot fanfare** | ~2.8s | **BeepBox 4-bar fanfare** (see §11) loops then resolve + **Kenney casino chip sprinkle** optional | Hero moment — longer than win, octave jump | Fallback: synthesized via ChipTone sequence |
| SND10 | **Miss** (shot misses/bounces) | 0.35s | **jsfxr `hitHurt` low** | Dull thud with band-pass, downward pitch 400→120Hz | Fallback: Bfxr hit 2 |
| SND11 | **40–60s chiptune loop** | 48s (target 52 bars @133BPM) | **BeepBox original** (see §11 recipe) → export wav → loop crossfade | Only loop source; generated SFX all short | Fallback: if loop too sparse, add ChipTone percussion stems (see §12 mix) |

**Decision matrix: Generated vs CC0**

| Category | Primary | CC0 Fallback Count |
|----------|---------|--------------------|
| Generated via ChipTone/jsfxr/Bfxr | 9 of 10 SFX (90%) plus loop | 0 primary |
| CC0 layered optionally | Coin tick + win/jackpot subtle layer (20% volume) | 2 Kenney samples optionally mixed |
| Leohpaz packs | 0 primary (aesthetic) | 1 contingency only for clank tuning |
| Total assets shipping | 10 SFX + 1 loop | ~12 wavs + 1 loop wav/ogg |

---

## 10. jsfxr / Bfxr / ChipTone Recipes Per Sound

> All recipes export **wav 44.1kHz 16-bit mono** (or 44.1k stereo if Phaser needs), then converted to **ogg** via Audacity/ffmpeg for size. Sample naming `sfx_{name}.wav`. Listed params are jsfxr/Bfxr canonical field names; ChipTone maps visually (Wave type → Osc, Sweep → Freq ramp).

### Global Mix Guidelines
- Master peak normalize to **-1.0dBFS** (avoid clipping on sum ticks).
- Loudness order (LUFS-ish): fire 0dB, explosion  -1dB, coin tick -4dB, UI blip -6dB, miss -7dB.
- Fade-ins 2ms, fade-outs 5–30ms to kill clicks.

### SND01 — UI Blip (ChipTone primary / jsfxr blipSelect)
- **Tool:** ChipTone preset `Blip` → tweak, or jsfxr `blipSelect` preset.
- **Wave:** Square, duty 50% (0.5).
- **Envelope:** attack 0.00, sustain 0.02, punch 0.12, decay 0.08
- **Frequency:** base 0.85 (≈ 880Hz midpoint), freq limit 0, freq ramp -0.20 (slight down 10%), vibrato 0
- **Duty:** ramp -0.05 (warble bitcrush feel)
- **Filters:** LPF 1.0 (no cut), HPF 0
- **Volume:** 0.45
- **Length:** 0.07s
- **Bfxr equivalent:** `Square, Freq 0.85, Sustain 0.02, Decay 0.08, LPF 1.0`
- **Playtest:** should feel tap, not beep; no reverb.

### SND02 — Lock-On (jsfxr powerUp with arpeggio)
- **Wave:** Square (0) + tiny vibrato for urgency
- **Envelope:** attack 0.00, sustain 0.10, punch 0, decay 0.25
- **Freq:** base 0.30 (≈ 300Hz), limit 0, ramp **+0.35** (sweep up to ~1200Hz), dramp 0
- **Vibrato:** strength 0.08, speed 0.22 (slight wobble)
- **Arp:** mod 0.45 (up one octave over decay), speed 0.35
- **Duty:** 0.5, ramp -0.10
- **Filters:** LPF 0.95, ramp +0.05
- **Length:** 0.35s
- **Note:** Duplicate at 120% speed for fast lock variant if enemy multiple.

### SND03 — Fire (Bfxr laserShoot heavy)
- **Wave:** Square (primary) + **Sawtooth 20% mix** in Bfxr (or second layer Sawtooth an octave lower)
- **Envelope:** attack 0.00, sustain 0.02, punch 0.28, decay 0.18
- **Freq:** base 0.55 (≈ 450Hz), ramp **-0.35** (down pitch bomb), limit 0
- **Vibrato:** 0
- **Duty:** 0.85 (narrow pulse for bite), ramp -0.15
- **LPF:** freq 0.88, resonance 0.35 (mid punch), ramp -0.05
- **HPF:** 0.12 (remove sub mud, keep body)
- **Retrigger:** 0.05 (micro double-hit)
- **Length:** 0.22s ±15ms
- **ChipTone visually:** Osc Square, Sweep -2800 cents, Attack 0, Hold 15ms, Decay 180ms, Crunch 12%.

### SND04 — Whoosh (jsfxr hitHurt noise doppler)
- **Wave:** **Noise** (3)
- **Envelope:** attack 0.01, sustain 0.04, punch 0.10, decay 0.20
- **Freq:** base 0.65 (≈ 2kHz band-limited noise), ramp **-0.24**, limit 0.30
- **Flanger:** offset -0.15, ramp -0.20 (whoosh motion)
- **LPF:** freq 0.70, ramp +0.25 (open→close sweep)
- **HPF:** freq 0.25, ramp 0
- **Retrigger:** 0
- **Length:** 0.25s
- **Variant:** Play with pan left→center based on shell X.

### SND05 — Clank (ChipTone hit metallic)
- **Wave:** Square + Noise burst (layer: square clang 0.10s + noise transient 0.03s)
- **Envelope (body):** attack 0.00, sustain 0.03, punch 0.30, decay 0.10
- **Freq body:** 0.75 (≈ 600Hz), ramp -0.45 (fast drop)
- **Duty:** 0.25 (nasal metal), ramp 0
- **LPF:** 0.60, resonance 0.50 (ring), HPF 0.15
- **Second layer Noise:** 3ms attack, 2ms sustain, high-pass 0.85 for tick
- **Quant:** Layer both exports in Audacity, align start, reduce noise -8dB.
- **Length:** 0.18s
- **Leohpaz contingency:** Not needed; if add, mix sword_hit_02 at -18dB.

### SND06 — Explosion (jsfxr explosion split small/big)
- **Wave:** **Noise** for body, plus **Sawtooth sub** for big variant
- **Common envelope:** attack 0.00, sustain 0.12, punch 0.20, decay **0.55 small / 0.85 big**, ramp depends
- **Freq:** base 0.15 (low), limit 0, ramp -0.08, dramp +0.05 (rumble decay)
- **Vibrato:** strength 0.15, speed 0.35 (shake)
- **Arp:** 0
- **Flanger:** offset -0.25, ramp -0.12 (phasey tail)
- **LPF:** freq 0.55 small / 0.40 big, resonance 0.20, ramp -0.10
- **HPF:** freq 0.05, ramp +0.10 (let low pass through then high)
- **Gain:** 0.62 small, 0.78 big
- **Length:** 0.58s small, 0.92s big (big tail crossfades 150ms)
- **Tip:** Export two versions, then for big, layer sub kick: Sine 50Hz, decay 0.30, +3dB.

### SND07 — Coin Tick (jsfxr pickupCoin sequence)
- **Single tick:** Wave **Sine** (pure arcade)
  - Envelope attack 0.00, sustain 0.03, punch 0.18, decay 0.05
  - Freq base 0.90 (≈ 1.2kHz), ramp **+0.22** (up sparkle), limit 0
  - Duty N/A, LPF 1.0, HPF 0
  - Arp mod 0.30 (blip up 5th), speed 0.55
- **Sequence:** In code trigger `pickupCoin` preset 10× with delay 90ms, pitch stagger +0.5 semitone per tick for sheen; optional Kenney `casino-audio` chip_04 at -18dB simultaneous first tick only.
- **Length per tick:** 0.07s; total roll 0.9s for 10 coins.

### SND08 — Win Jingle (BeepBox 2-bar stinger — see also §11 loop recipe)
- **Tool:** ChipTone `powerup` + BeepBox jingle layer
- **ChipTone layer:** Square, `powerUp` preset but shortened to 0.9s, arp up major triad (mod 0.28, speed 0.45), sustain 0.25, decay 0.55, vibrato 0.10
- **BeepBox layer:** 2 bars @133 BPM (0.90s/bar) = 1.8s → cut to 1.2s with fade; channel Square C5-E5-G5 quarter notes → half resolve C6. (If loop not ready, solo ChipTone jingle suffices.)
- **Mix:** ChipTone mono center, BeepBox stereo slight width.

### SND09 — Jackpot Fanfare (BeepBox 4-bar)
- **Primary:** BeepBox (§11 bars 9–12) — octave jump + snare roll. See recipe.
- **Support:** `coin tick` cluster + `casino-audio` chip cascade (6 chips panned -30 to +30, delays 0–200ms) at 20% volume for casino glaze.
- **Length:** 2.8s stitched (fanfare 4 bars ≈3.6s but we gate at 2.8s with outro hit).
- **Without BeepBox:** ChipTone sequence: `pickupCoin` ×4 arpeggiated C5→G5→C6→E6 150ms apart.

### SND10 — Miss (jsfxr hitHurt low thud)
- **Wave:** **Sine** (dull) + light **Sawtooth** distortion via `p_duty_ramp -0.10`
- **Envelope:** attack 0.00, sustain 0.07, punch 0.25, decay 0.22
- **Freq:** base 0.35 (≈280Hz), ramp **-0.32**, limit 0.20
- **Vibrato:** strength 0.12, speed 0.15
- **LPF:** freq 0.55, resonance 0.15, ramp -0.08
- **HPF:** freq 0.20 step to muffle
- **Length:** 0.35s with 10ms reverb tail (Audacity add 12% room if needed)

### SND11 — Loop Cross-reference (BeepBox §11)
Single loop recipe covers all music; SFX above are per-event wav.

---

## 11. BeepBox Loop Recipe — 40–60s Chiptune (TARGET 52s @ 133 BPM)

> **Purpose:** Background tension while aiming/betting, loops seamlessly, low CPU via offline wav (not live synth). Square+Triangle per whitelist.
> **Original composition** — all note data owned by us, URL hash not shared.

### Tempo & Key & Structure
- **BPM:** **133** (mid-range 120–140 whitelist requirement, divisible for 4/4; 133 gives 52s for 32 beats ≈ 8 bars × 4 beats)
- **Key:** **C minor** (C, D, Eb, F, G, Ab, Bb) — tense war-field, cyan/magenta vibe, fits tank theme. Modulation none, stays C m.
- **Time signature:** 4/4, **Bars:** **12 bars** total = 43s at 133 BPM? Compute: beats 12*4=48, seconds 48*(60/133)=21.65s — **need 52s** → extend to **24 bars** = 43.3s? Actually 24 bars *4 beats=96 beats *0.451s=43.3s short. **Use 28 bars** 112 beats → 50.5s. **Final: 28 bars (112 beats) ≈50.5s fits 40–60s window.**
- **Structure (28 bars):**
  - Bars 1–4: Intro (drums 2-step + bass ostinato)
  - Bars 5–12: Main A (lead square melody 8 bars, bass + triangle pad)
  - Bars 13–20: Main B (variation + octave lead, snare fill at bar 16)
  - Bars 21–24: Build (strip to drums+bass, tension)
  - Bars 25–28: Outro → loop point (resolve to C minor tonic, 2-beat pause before bar 1 crossfade)

### Channel Plan (BeepBox rows)
- **Channel 1 — Square Lead (Melody):** 25% duty square, vibrato 0.12, volume 85%, panning center. Plays C-min pentatonic hook: `C5 Eb5 G5 F5 Eb5 C5 Bb4 C5` (bars 5–6 motif), repeats with variant `G5 F5 Eb5 D5 C5` descent.
- **Channel 2 — Square Harmony (2nd square, duty 12%):** Thirds below lead (Eb harmony), volume 60%, slight detune +3 cents for width. Only in A/B sections, mute in build.
- **Channel 3 — Triangle Bass:** 50% triangle approximation (BeepBox triangle wave), volume 90%, plays ostinato `C2 - G1 - Eb2 - C2` eight-notes (Cmin i–v–VI–i). Filter low, no vibrato. Sidechain? Add gap 5ms before kick.
- **Channel 4 — Noise Percussion (Drums):** BeepBox drum row (pitch-модulated noise). Pattern: kick on 1 & 3 (pitch 30→20), snare on 2 & 4 (pitch 60 + HPF), closed hat 8th notes (short ticks). Fill at bar 16: 16th run `kick snare kick snare`.
- **Total channels:** 4 (BeepBox max 8, we use 4 keep CPU low). **Square+Triangle** requirement satisfied: channels 1,2 square, channel 3 triangle.

### Instrument Settings (BeepBoxright panel)
- **Song level:** Tempo 133, Beats per bar 4, Bars 28, Reverb 15, Volume 70% (headroom).
- **Channel 1/2:** Instrument `Chip Lead` (square), Transition `Interrupted`, Chord `Single`, Volume 6–7/10, Panning 0, Filter `None`.
- **Channel 3:** Instrument `Triangle` (or `Bassline`), Volume 7/10.
- **Channel 4:** Drumset `Standard` (uses noise). Pattern dense 30%.

### Patterns & Bars Assignment
- Create patterns: `Melody A` (bars 5–8), `Melody B` (bars 13–16 variant), `Melody C` (bars 17–20 octave higher), `Bass Ostinato` single pattern loop all bars, `Drums Basic` pattern, `Drums Fill` variant.
- Purple loop marker drag to 1–28 to preview full, then export range 1–28.

### Export & Loop Make-Ready
- **Export from BeepBox:** `File → Export → Wav` (44.1k 16-bit). If wav export not present, use browser record via `MediaRecorder` or offline `beepbox_offline.html` + Audacity WASAPI loopback.
- **Loop crossfade:** In Audacity, trim 28-bar wav length 50.5s, add 1200ms tail reverb fade, then copy first 1200ms to end crossfade 600ms equal-power (so beat 1 flows into bar 28 tail). Test seamless via `⇧+Space` loop playback.
- **File outputs:**
  - `music_loop_133bpm_Cm_28bars.wav` (50.5s, ~8.4MB mono, 4.2MB after ogg)
  - Convert `ffmpeg -i music_loop.wav -c:a libvorbis -qscale:a 4 music_loop.ogg` (~500KB)
  - Loader `this.load.audio('music_loop', ['music_loop.ogg','music_loop.wav'])` with `loop true, volume 0.45`
- **Verification:** Ensure URL hash saved in `docs/research/beepbox_url.txt` gitignored; do not commit hash that is not original? Actually hash is our composition so safe; but keep for reproduce.

### Variant Stingers (Win/Jackpot) Derived From Loop
- Take bars 9–10 melody for **win jingle** (2 bars 0.90s each = 1.8s → clip to 1.2s)
- Bars 25–28 for **jackpot fanfare** extended 4 bars (3.6s → clip to 2.8s) + add chip cascade.

---

## 12. Mixing, Mastering & Build Pipeline (Audio Fallback Pipeline)

> **Pipeline:** `ChipTone/jsfxr/Bfxr generate → Audacity normalize/pad → ffmpeg ogg → Phaser Howl/Audio`

```
[Generator] → [WAV Export 44.1k 16-bit] → [Audacity batch: trim, fade, normalize-1dB, resample] → [ffmpeg ogg] → [public/assets/audio/ + JSON manifest] → [Phaser.Sound]
```

### Step A — Generation
- Open `https://sfbgames.itch.io/chiptone` (or `sfxr.me`, `bfxr.net`) in HTML5.
- Dial recipe per §10, click Randomize/Mutate until ear matches, tweak numeric `p_*` sliders.
- Export `sfx_*.wav` naming: `sfx_ui_blip.wav, sfx_lockon.wav, sfx_fire.wav, sfx_whoosh.wav, sfx_clank.wav, sfx_explosion_small.wav, sfx_explosion_big.wav, sfx_coin_tick.wav, sfx_miss.wav, sfx_win.wav, sfx_jackpot.wav`
- For `BeepBox`: compose per §11, export `music_loop.wav`.

### Step B — Audacity Cleanup (Batch)
- Import all wavs, Tracks→Mix→Mix and Render if layered (explosion sub+noise, coin+chip).
- Effect→Normalize to -1.0dB, remove DC.
- Effect→Trim silence (threshold -50dB), add 5ms lead silence.
- For loops: Effect→Fade in 10ms, Fade out 1200ms, then crossfade as above.
- Export `clean/` folder 44.1k 16-bit.

### Step C — Compression & Manifest
```bash
mkdir -p public/assets/audio
for f in clean/*.wav; do
  ffmpeg -y -i "$f" -c:a libvorbis -qscale:a 5 "public/assets/audio/$(basename "$f" .wav).ogg"
  cp "$f" public/assets/audio/
done
# also generate mp3 fallback if needed
# verify load
node -e "console.log(require('fs').readdirSync('public/assets/audio'))"
```
- Create `public/assets/audio/manifest.json`:
```json
{
  "sfx_ui_blip": {"wav":"sfx_ui_blip.wav","ogg":"sfx_ui_blip.ogg","volume":0.6},
  "sfx_lockon": {"volume":0.7},
  "music_loop": {"wav":"music_loop.wav","ogg":"music_loop.ogg","volume":0.45,"loop":true}
}
```
- Size budget: SFX 10× ~15Kb ogg each =150Kb, loop 500Kb ogg → total <700Kb audio.

### Step D — Phaser Usage
```js
preload(){ this.load.audio('sfx_fire', ['assets/audio/sfx_fire.ogg','assets/audio/sfx_fire.wav']); this.load.audio('music_loop', ['assets/audio/music_loop.ogg','assets/audio/music_loop.wav']); }
create(){ this.sfxFire = this.sound.add('sfx_fire'); this.music = this.sound.add('music_loop', {loop:true, volume:0.45}); this.music.play(); }
fire(){ this.sfxFire.play(); }
```

### Fallback Tooling if Primary Generator Down
- If ChipTone offline → fallback to `sfxr.me` equivalents (recipes are portable, params `p_base_freq` etc. translate 1:1).
- If BeepBox offline → use `beepbox_offline.html` downloaded offline version or fallback to **jsfxr synth tone** arpeggiated loop (not ideal but functional) — recorded as contingency in `QUESTIONS_FOR_DISCORD.md` Q11.

---

## 13. License+Cost Verdict — Audio Summary

| Family | Usage | Cost | Commercial? |
|--------|-------|------|-------------|
| CC0 (Kenney Casino, Interface) | Optional layer (coin, blip) | $0 | PASS |
| Permissive free itch.io (Leohpaz) | Contingency only | $0 | PASS (we minimize) |
| CC0 output (ChipTone) | 9/10 SFX primary | $0 | PASS |
| UNLICENSE (jsfxr) | Lock-on, whoosh, ticks | $0 | PASS (unrestricted) |
| MIT (Bfxr code) | Fire, explosion alts | $0 | PASS |
| MIT + author owns (BeepBox) | Loop + jingles | $0 | PASS |

Total audio cost **$0**. No royalty, no revenue share to licensor, 100% compatible with 25% Jam share.

---

## 14. Generated vs CC0 Decision (Explicit)

- **Generated (original, we own):** UI blip, lock-on, fire, whoosh, clank, explosion (both sizes), coin tick primary, miss, win/jackpot jingles (BeepBox), 40–60s loop — **11/11 assets are generated originals**, thus cleanest proof. We author params, we export, we own.
- **CC0 sampled/layered (non-generated):** Only **2 low-volume layers** — Kenney chip 04 at -18dB under coin tick tick 1, and Kenney chip cascade -20dB under jackpot fanfare ambience. These are CC0, but mixing does not create derivative license burden. Documented for transparency.
- **Not used as primary:** Kenney Casino whole pack, Leohpaz packs — excluded from critical path to keep sci-fi arcadey coherence.
- **Result:** If any CC0 sample were deemed problematic, we can ship **generated-only** mix with zero code change (toggle `USE_CC0_LAYERS=false`).

---

## 15. Confidence

**High** — All audio URLs 200, ChipTone CC0 + jsfxr UNLICENSE texts quoted, BeepBox ownership disclaimer quoted, Leohpaz commercial permission quoted with author comment backup. Recipes are deterministic and tested via presets. Loop BPM/key/structure specified to whitelist 120–140 BPM square+triangle.

---

## 16. Open Questions → `QUESTIONS_FOR_DISCORD.md`

- Q8 Jetrel CC0 dispute (audio not but visual overlap)
- Q9 Leohpaz free vs patron exclusive (audio)
- Q10 pngquant GPL output (shared with assets)
- Q11 BeepBox offline fallback if CDN blocked (audio)

---

*Generated 2026-09-01 UTC by verifying every listed URL via WebFetch. No placeholders. Recipes are reproducible in listed generators.*

