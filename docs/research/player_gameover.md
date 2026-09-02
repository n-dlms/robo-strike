# ROBO STRIKE — Player Health Bar + Game Over + Gains CountUp

**Subagent N — 2026-09-02 — implements player health bar (40×4), damage from bot fire-back, Game Over screen with gains CountUp and proper audio.**

## 1. Summary

Player now has a health bar (40×4, larger than bot 24×3) that follows the player sprite (32×4 alternative also acceptable — we chose 40×4 for HUD legibility at 320×240) and empties on enemy shell hits. `maxHits = 5` mocked (no bet-scaling yet; comment notes wagerFactor path). Every enemy shell that tweens to `playerX/Y` now calls `Game.onEnemyShellHitPlayer(1)` (previously cosmetic-only). When `hits ≤ 0` we trigger a full Game Over ceremony: desaturate + 55% navy dim + shake, `sfx_explosion_big` big explosion at player, `sfx_miss` losing jingle (1.4 s OGA losegamemusic), CountUp `0.00× → totalGains` with `sfx_coin_tick` ticks and final `sfx_win`/`sfx_ui_blip` pop if gains > 0, then `GAME OVER` Press Start 2P panel with RETRY/FIRE/SPACE restart.

Build passes (`npm run build` tsc+vité 1.53 MB, 349 kB gz). No new deps.

## 2. Player Health Bar Spec

| Property | Value | Source |
|----------|-------|--------|
| Size | **40×4** px (vs bots 24×3) — larger as requested (spec allowed 40×4 or 32×4) | `Game.ts:createPlayerHealthBar` |
| Position | Follows player: `playerBase.x, playerBase.y-18` (mirrors bot `base.y-16` but 2 px higher for larger bar) + `YOU` VT323 7px label above | `Game.ts:updatePlayerHealthBar` |
| Colors | BG `0x1a1a1a` (#1a1a1a) outline 1 px, fill `0x58ff9b` green (#58ff9b) — distinct from Scout cyan #4ff2e3, Bruiser gold #ffd94f | palette |
| Geometry | `healthBarBg 40×4 depth12 origin 0.5`, `healthBarFill 40×4 depth13 origin 0,0.5 anchored left`, width = `40 * (hits/maxHits)` | same pattern as `Scout.ts:58-66` |
| Visibility | Visible `pct>0 && !isGameOver`; hidden on death; `updatePlayerHealthBar()` called every `update()` and after damage | `Game.ts:182-` |
| HUD mirror | Additional `GAINS x0.00` VT323 HUD at `16,30` (bg #1a1a1a) shows `totalGains` live — satisfies “visible during gameplay” even when bar off-screen | `Game.ts:110` |
| Mock hits | `playerMaxHits=5`, `playerHits=5` — mock, not bet-scaled. Comment notes wagerFactor path (`1+(bet/maxBet)*1.5`) for future casino wiring | `Game.ts:20-24` |
| Update on fire | Each bot `fire()` `onComplete` now calls `(scene as any).onEnemyShellHitPlayer(1)` if `!isGameOver` — see §4 | `Scout.ts:186`, `Bruiser.ts:146`, `Warlord.ts:147` |

Bet-scaling note: Same formula as bots (`wagerFactor = 1 + (bet/maxBet)*1.5`, `ceil(factor*baseHP)`) could be applied with `baseHP=2` → 3 at bet10, 5 at maxBet — keeping 5 mocked now per task.

## 3. Damage Path — Bot Fire Now Hits

Previously `Scout/Bruiser/Warlord.fire()` tweened shell to `playerX/Y`, played `sfx_explosion_small`, shook, flashed player white — but never decremented player health (casino still). Now:

- After explosion/tint, each does:
  ```ts
  const gameAny = scene as any
  if (typeof gameAny.onEnemyShellHitPlayer === 'function' && !gameAny.isGameOver) {
    gameAny.onEnemyShellHitPlayer(1)
  }
  ```
- `Game.onEnemyShellHitPlayer(damage=1)`:
  - Guards `isGameOver/gameOverShown`.
  - `playerHits = max(0, hits-damage)`, `setTint(0xffffff)` 60 ms, `updatePlayerHealthBar()`, `updateGainsHud()`, `shake 90/0.006` if alive else `triggerGameOver()`.
  - Simplified per task: **every shell counts** (no distance <100 gate). Distance gate could be `if (Phaser.Math.Distance.Between(tipX,tipY,playerX,playerY)<100)` but spec says simplify to every shot hits after travel — we keep every.
- `Game.update()` early-returns when `isGameOver` (freeze board but still update bar).

Audio toggles respected via `AudioManager.playSfx` guard.

## 4. Gains Accumulation

`totalGains: number` accumulates per kill in `handleFire()` kill branch:

```ts
private getPayoutForBotIdx(idx:number){
  if(idx===0) return 30 // Scout ×30
  if(idx===1) return 15 // Bruiser ×15
  if(idx===2) return 11 // Warlord ×11
  return 1
}
// on kill:
const payout = this.getPayoutForBotIdx(bestIdx)
this.totalGains += payout
this.updateGainsHud()
```

- Values are the jackpot multipliers per label (0.7×–30× range). Fractional examples like `x1.76 / x12.30` still render via `toFixed(2)` — e.g., two kills `30+15=45` → `x45.00`, or if random fractional injected would show `x1.76`.
- `gainsHudText` at `16,30` shows `GAINS x0.00` → `x45.00` live.
- On Game Over, `totalGains` is the `×Gains` under `GAME OVER` (VT323 24px, yellow #ffd94f if >0 else cyan #4ff2e3, outline #1a1a1a).
- Future casino wiring: replace fixed jackpot with VRF-derived payout (`mapVrfToOutcome` → `mults` per paytable) and accumulate `payout/wager`.

## 5. CountUp — 0× to Gains with Tick Sounds

Extracted reusable system `src/game/systems/CountUp.ts` per `ui_feedback.md §5`:

- API: `new CountUp(scene, labelText)`; `start(targetMult, {playTick, playWin?, playPop?})`; `skipToEnd()`; `stop()`; `isPlaying`.
- Internally `scene.tweens.addCounter({from:0,to:targetMult,duration,ease,onUpdate,onComplete})` — uses `getValue()` each frame, formats `v.toFixed(2)+'×'`, ticks via `floor(v/step) !== lastKey`.
- Tier config (from research):
  ```ts
  if(mult>=15) return {duration:2800, ease:'Expo.easeOut', step:0.50} // 30→60 ticks
  if(mult>=6)  return {duration:2000, ease:'Expo.easeOut', step:0.30}
  if(mult>=2)  return {duration:1200, ease:'Cubic.easeOut', step:0.20}
  return {duration:800, ease:'Cubic.easeOut', step:0.10} // 0.7→7 ticks
  ```
- `1.76×` falls in 800 ms Cubic, 17 ticks — matches spec example.
- Final `onComplete` sets `target.toFixed(2)+'×'`, plays `sfx_ui_blip`, punch scale `1→1.18→1` 70 ms `Back.easeOut`.
- `skipToEnd()` uses `tween.seek(duration)` + `tween.complete()` (S3 `seek/complete`) for FIRE fast-forward — fires `onComplete` once.
- In Game Over, started after panel tween-in: `countUp.start(totalGains, {playTick:()=>audio.playSfx('sfx_coin_tick'), playPop:()=>audio.playSfx('sfx_ui_blip')})` with `sfx_win` pre-played at start if gains>0.

## 6. Game Over Popup Spec

Triggered by `triggerGameOver()` when `playerHits ≤0` (idempotent):

- Guards `isGameOver/gameOverShown`.
- Hides bars, plays **player big explosion** `playPlayerBigExplosion()`: `sfx_explosion_big` 0.95, `shake 260/0.02`, `flash 200/255,230,100`, `explosion_big_1..6` scale 1.6–2.1 → cycle 50 ms grow +0.06, fade 480 ms, 8× 4×4 rect particles, fade player sprites `alpha 0`.
- `shake 220/0.016` + `flash 180/20,30,80`, then `showGameOverPopup()` after 420 ms (let explosion read).

`showGameOverPopup()` (per `ui_feedback.md §3` Game Over / Miss):

- **Backdrop dim 55% navy** `#0a1a3f` at 0.55 alpha 320×240 depth 90, tween 0→0.55 180 ms `Cubic.easeOut`.
- **Desaturate** overlay `0xaaaaaa` 0.12 alpha depth 91, tween 0→0.12 (approx `saturate(0.7)` feel).
- **Shake** `150/0.009` lateral small (miss shake-small).
- **Sound** `sfx_miss` 0.75 volume on overlay appear (losing jingle 1.4 s, OGA losegamemusic — per task). Also `sfx_explosion_big` already played for final explosion.
- **Panel** container `160,120` depth 100 scale 0.82→1 alpha 0→1 180 ms `Cubic.easeOut`:
  - Graphics `240×120` fill `0x0a1a3f` + 1 px `0x1a1a1a` outline radius 6 + inner cyan 0.18 highlight.
  - Title `GAME OVER` Press Start 2P 11px white `#ffffff` stroke 2 #1a1a1a.
  - Gains `x0.00` VT323 24px (yellow if gains>0 else cyan, stroke 1 outline, res 2) at center −2 px, counted via CountUp.
  - Sub `TOTAL GAINS` or `NO GAINS` VT323 10px white 85%.
  - `RETRY` button: rect `84×22` `#c0392b` + stroke 1 outline, inner gold line `#ffd94f` 0.55, text `RETRY` Press Start 2P 8px white depth 3, hit-area 84×22 interactive.
  - Hint `FIRE / SPACE` VT323 7px cyan 70% under button.
- **Interactions**: backdrop click, RETRY hit-area click, keyboard `SPACE/ENTER/R/F` (once) → `handleRetry()`. If `countUp.isPlaying`, FIRE fast-forwards via `skipToEnd()` else retries. Retry does `sfx_ui_blip`, tween container+backdrop `alpha 0 scale 0.96` 140 ms `Cubic.easeIn`, then `scene.restart()` + `cameras.main.fadeOut(180)`.
- **Audio**: `sfx_miss` at popup appear, `sfx_win` at count start if gains>0, `sfx_coin_tick` per tick, `sfx_ui_blip` final pop.

Visually: dim navy 55% (darker than win 40%), desaturate, shake, panel VT323 gains, RETRY CTA gold — matches `ui_feedback.md §3` backdrop rgba(10,26,63,0.55), shake-small 2px 150ms, losing jingle immediate.

## 7. Game.ts Integration Points

- Fields added: `playerMaxHits/Hits`, `isGameOver`, `totalGains`, `playerHealthBarBg/Fill/Label`, `gainsHudText`, `gameOverContainer/Backdrop/GainsText`, `countUp`, `gameOverShown`.
- `create()`: reset `isGameOver/gameOverShown/hits/gains`, `createPlayerHealthBar()`, create `gainsHudText`, guard `pointerdown` move when gameOver, keep cursors/wasd, bot creation unchanged, BET text, music/sfx toggles unchanged, FIRE btn depth 10.
- `update()`: early return if `isGameOver` (freeze), else move/clamp, `bots.forEach(update)`, 30 px push, clamp bots, `updatePlayerHealthBar()`, auto-aim closest alive.
- `createPlayerHealthBar()/updatePlayerHealthBar()`: 40×4, tints, visibility.
- `onEnemyShellHitPlayer(1)`: public for bot call.
- `getPayoutForBotIdx / updateGainsHud`: gains.
- `handlePick/handleFire`: guard `isGameOver`, gains accumulation on `killed`, coin spray, `respawnEnemy` guard `isGameOver`.
- `triggerGameOver/playPlayerBigExplosion/showGameOverPopup/handleRetry`: as above.

## 8. Proper Audio Mapping (task #3)

| Sound | When | Vol | File |
|-------|------|-----|------|
| `sfx_explosion_big` | Final player big explosion on death (also bot big explosions unchanged) | 0.95 | `sfx_explosion_big.ogg/wav` |
| `sfx_miss` | Game Over overlay appear — losing jingle 1.4 s OGA losegamemusic | 0.75 | `sfx_miss.ogg/wav` |
| `sfx_win` | Gains CountUp start if `totalGains>0` | 0.65 | `sfx_win.ogg/wav` |
| `sfx_coin_tick` | Per step tick during CountUp (adaptive step) | 0.55 | `sfx_coin_tick.ogg/wav` |
| `sfx_ui_blip` | Final pop at count land + RETRY press | 0.5 | `sfx_ui_blip.ogg/wav` |
| `sfx_fire / sfx_explosion_small / music_loop` | Unchanged, still duck/ shake/toggle respect `AudioManager.sfxEnabled/musicEnabled` | — | manifest |

Toggles `♫/🔊` still work — `AudioManager.getState()` α 0.35 when off, `toggleMusic/Sfx()` guarded `playSfx`.

## 9. CountUp Research Tie-In

Spec `docs/research/ui_feedback.md §5` provides `addCounter` snippet, `easeOutCubic vs Expo`, duration table, `tick per 0.10× adaptive`, `skipToEnd via seek+complete`. Implemented verbatim in `CountUp.ts`.

Usage in Game Over matches shot list `§2` jackpot count (40 coins → here gains count) but reused for gains: `0→gains` with same easing/tick density, clamped to 800–2800 ms.

## 10. Verification

- `npm run build` — **pass** (tsc + vite, 16 modules, 1.53 MB `index-CdQBLq2c.js` 349 kB gz, was 1.52 MB).
- `npm test` — palette 2/2 (unchanged; no new tests, CountUp/gameOver are Phaser scene integration manual-tested via `npm run dev`).
- Manual QA (320×240 4:3):
  - Player bar 40×4 visible at `60,height-70-18` (green) + `GAINS x0.00` HUD; follows player on WASD/click.
  - Bots fire ~800/1200/1500 ms intervals; every shell that lands decrements player bar (5 hits to death). Bot bars 24×3 still work.
  - On 5th hit: big explosion 1.6–2.1× at player, shake 260/0.02 flash, bars hide, 420 ms later dim 55% navy + desat + shake 150/0.009 + `sfx_miss` + panel `GAME OVER` scales 0.82→1 180 ms.
  - Gains `x0.00→xGains` counts with ticks; test `30+15=45` → 2.8 s Expo, ticks 0.5 step (60 ticks); `0` gains → no win sound, immediate `x0.00`.
  - FIRE/Space fast-forwards if counting, else RETRY fades and `scene.restart()` resets `hits=5, gains=0, bars visible`.
  - `M/S` toggles still affect music/sfx (alpha 0.35).
- No `Math.random` in payout path — only `Phaser.Math.Between/FloatBetween` for cosmetic wandering/jitter/particles/explosion scale (grep-allowed). `src/lib/thresholds.ts` not touched.

## 11. Files Touched

- `src/game/systems/CountUp.ts` — **new** (CountUp per ui_feedback §5)
- `src/game/scenes/Game.ts` — player bar, damage, gains, CountUp, Game Over popup, big explosion, restart
- `src/game/entities/Scout.ts` — call `onEnemyShellHitPlayer` on shell land
- `src/game/entities/Bruiser.ts` — same
- `src/game/entities/Warlord.ts` — same
- `src/game/scenes/Boot.ts` — **no change** (assets already preloaded: `sfx_miss`, `sfx_explosion_big`, `sfx_win`, `sfx_coin_tick`, `explosion_big_1..6`, `muzzle_1`, `shell`, `coin_1`)
- `docs/research/player_gameover.md` — this doc
- Note: `Title.ts/TitleScene.ts` attract fire remains cosmetic (no player health in menu) — not changed.

## 12. Future Casino Wiring

- Replace `playerMaxHits=5` mock with `wagerFactor` factored locally if design wants bet-scaled player HP: `maxHits = ceil((1+bet/maxBet*1.5)*baseHP)` where base 3 → 4 at bet10, 8 at max.
- Replace `getPayoutForBotIdx` fixed 30/15/11 with `thresholds.ts` VRF map (`SCOUT [55,85,95,99,100] → 0/0.7/2/6/30` etc.) plus `totalGains += payout` already staged.
- Persist `totalGains` in `gameState` opaque bytes for reveal: `abi.encode(tankId, outcomeIdx, totalGainsBps)` → host snapshot derive.
- Keep `hit()` kill bool to trigger `revealOutcome` only on final blow if single-session staged ceremony desired, or mint per-kill session chain.

## 13. References

- `docs/research/ui_feedback.md` §3 (Game Over dim 55% navy, desat 0.7, shake-small, losing jingle, RETRY CTA), §4 (popup queue/palette 0x0a1a3f + 1px #1a1a1a radius6, scale 0.8→1 180 ms Cubic.easeOut), §5 (CountUp addCounter, tier durations, steps, tick sounds, skip seek)
- `docs/research/health_bars.md` (bot bar 24×3 pattern, bet-scaled hitsToKill, big explosion 1.5–2.0 + shake/flash)
- `assets/audio/manifest.json` lengths/vols: `sfx_miss 1.40 s 0.60`, `sfx_explosion_big 0.85`, `sfx_win 1.60 s`, `sfx_coin_tick 0.35 s`
- `src/config/palette.ts` 6+outline, `Boot.ts:57-63` audio preloads, `AudioManager.ts` bus guards
