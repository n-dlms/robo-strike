# UI — Music & SFX Toggle Spec (Required — Do Not Forget)

> Added 2026-09-01 per user request. Persisted to docs/ so implementation is not missed in Stage 3-4.
> Status: SPEC-LOCKED. Must be implemented before ship (Phase 4 presentation).

## Requirement
- UI must provide **two independent toggles**: **Music** (loop `music_loop`) and **SFX** (all `sfx_*`).
- Player can toggle each **on/off** at any time. Default: **both ON**.
- Toggles visible in-game, not buried in settings. Must work **standalone** and inside **chain.wtf iframe** (no host dependency).
- State persists across reloads and rounds.

## Where in UI
- Top bar or HUD corner (next to bet/tank picker), 2 buttons: `♫` Music, `🔊` SFX.
- Pressing mutes/unmutes instantly. Icon shows state: `♫` vs `♫̸` (or `🔊` vs `🔇`), with `aria-pressed` and tooltip.
- Also accessible via keyboard: `M` = toggle Music, `S` = toggle SFX (or `N` for mute-all). Must not interfere with `Space/C/1-3` game keys.
- On first load, if `snapshot.wallet.status !== 'ready'` still show toggles (they are local UI, not host).

## Behaviour
- **Music toggle OFF**: `music_loop` `this.sound` pauses/stops immediately, `loop` flag kept but not playing. Toggle ON: resumes from current position or restarts if stopped, `volume` from `manifest.json` (`0.45`) × master music gain.
- **SFX toggle OFF**: Every `this.sound.play(key)` checks `sfxEnabled` guard — if off, do not call `play()`. Already-playing SFX allowed to finish or `stop()` immediately (choose `stop()` for instant mute). No new SFX starts while off.
- **Master mute edge**: If both off, icon shows muted but individually toggling one back on must restore only that bus.
- **Gapless**: Toggling must not cause click/pop — use `sound.volume` fade 30ms or `sound.stop()` after fade.
- **Persistence**: Save to `localStorage` under `roboStrike_audio_v1 = { music: bool, sfx: bool }` (JSON). On boot, read and apply. If missing, defaults ON. On toggle, write. Also restore after `setState` reconnect (simulator reload mid-round should not reset).
- **Host mute**: Independent of browser `AudioContext` suspend — if host iframe is muted by browser autoplay policy, show tap-to-unmute banner? Not required, but toggles still control which bus is allowed when context resumes.

## Implementation Notes (Phaser)
- Single source in `src/game/systems/AudioManager.ts` (or `src/game/systems/audio.ts`) — central `AudioManager` with `musicEnabled, sfxEnabled, setMusicEnabled(b), setSfxEnabled(b), playSfx(key)`.
- Load via `this.load.audio` as now, but creation via manager: `manager.addMusic('music_loop', {loop:true, volume:0.45})`, `manager.playSfx('sfx_fire')`.
- On `create()`, `manager.init(this)` and `manager.applyFromStorage()`.
- UI scene or HUD layer: `createToggleButtons()` that call `manager.toggleMusic()` / `toggleSfx()` and update icons.
- Respect `prefers-reduced-motion`? No, audio only.
- Test: mute music keep SFX, mute SFX keep music, mute both, reload page → same state, play win/jackpot/loss/explosion/fire — only correct bus audible.

## A11y & Juice
- Buttons `44×44` min target, `title`/`aria-label` "Toggle music" / "Toggle sound effects", focusable.
- Visual feedback: toggle changes `tint` or icon swap + 80ms `scale` pop, plays `sfx_ui_blip` only if SFX is ON (avoid feedback loop when SFX off).
- Do not auto-play music until user interaction (browser autoplay). First `FIRE` or toggle ON counts as interaction.

## Acceptance Checklist (Phase 4)
- [ ] Two toggles visible, default ON, instant mute/unmute
- [ ] Music pauses/resumes, SFX guard prevents new plays when off
- [ ] `M` / `S` keys work, not clobbering game keys
- [ ] `localStorage` persists across reload
- [ ] Works in standalone and `?ref=chainjam` iframe
- [ ] No host dependence, no extra deps

## References
- Current real sounds: `assets/audio/manifest.json:1` (wins lot 1.6s, jackpot lotto 2.84s, loss 1.4s, grenade 0.62s, fire cannon 0.38s, action loop 50s) — toggles must gate these buses.
- Palette/outline spec still applies to toggle icons (`#4ff2e3` cyan when ON, `#1a1a1a` muted).
