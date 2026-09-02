# ROBO STRIKE — Bullets, Demo, Game Over, and Enemy Respawn Fix (Subagent Q)

**2026-09-02 — Fixes 4 issues: bullets border raycast, Title demo wandering, Game Over single-trigger, enemy respawn after RETRY**

## 1. Issue 1 — Bullets stop at predicted player pos; must reach border on miss, only stop on hit, never destroyed early

### Diagnosis

`src/game/entities/Scout.ts:174-276`, `Bruiser.ts:153-227`, `Warlord.ts:155-229` each computed a border raycast correctly:

```ts
const w = scene.scale.width ?? 320
const h = scene.scale.height ?? 240
const dx = destX - tip.x, dy = destY - tip.y
let bestT = Infinity
// t for x=0/w, y=0/h
if (abs(dx)>0.001) { t1=(0-tip.x)/dx, t2=(w-tip.x)/dx -> check y in [0,h], bestT=min }
if (abs(dy)>0.001) { t3=(0-tip.y)/dy, t4=(h-tip.y)/dy -> check x in [0,w], bestT=min }
border = tip + bestT*dx,dy clamped [0,w]x[0,h]  // Scout.ts:197-234, Bruiser.ts:168-206, Warlord.ts:170-208
```

First leg `tip -> dest (player predicted)` with `baseDuration` Scout 360 / Bruiser 420 / Warlord 480 `Scout.ts:259` etc. On its `onComplete` they handled:

1. `if (isGameOver) { shell.destroy(); trailEv.remove(); return }` — **early destroy at dest**, never reaching border if Game Over triggered mid-flight.
2. `if (isPlayerInvulnerable) -> shield puff at dest, destroy` — correct stop at player (blocked).
3. `actualDist>38 -> second tween dest->border` — correct miss continuation, but only when not Game Over.
4. else hit -> explosion at dest + `onEnemyShellHitPlayer`.

Problem: case 1 destroyed shell immediately at predicted player position, violating “miss should go all way to border (raycast to 0,width,0,height)”. Even when `actualDist>38`, if `isGameOver` flipped between fire and arrival (multiple shells landing same frame), shells vanished at `dest` instead of continuing. `shell` was destroyed early before second leg could start. Trail `trailEv` removed prematurely as well.

Task requires: *Bullets should only stop when target has been hit or if miss it should go all way to hit screen border. Fix to ensure on miss shell continues to border edge with proper duration, and on hit stops at player. Ensure shell is not destroyed early.*

### Fix — Scout.ts:259-342, Bruiser.ts:219-290, Warlord.ts:221-292

- Keep border raycast unchanged (already correct to `0,width × 0,height`).
- Reorder and harden `onComplete`:

```ts
const now = scene.time.now
// 1. Invulnerability shield — valid stop at player (blocked hit), only when not Game Over
if (isPlayerInvulnerable(now) && !isGameOver && !gameOverShown) {
  shell.destroy(); trailEv.remove(); // puff #8ecfff at dest
  return
}
// 2. Game Over — do NOT destroy early at dest; continue visually to border without damage
if (isGameOver || gameOverShown) {
  remaining = Distance(dest, border)
  distToPlayer = Distance(tip, dest)
  speed = distToPlayer/baseDuration
  extraDuration = Clamp(remaining/speed, 80, 700/800/900)
  scene.tweens.add({ targets: shell, x: borderX, y: borderY, duration: extraDuration,
    onComplete: () => { shell.destroy(); trailEv.remove(); miss puff #aaaaaa at border } })
  return
}
// 3. Dodge check — miss continues to border edge with proper duration, shell NOT destroyed early
if (pb && actualDist>38) {
  // same remaining/speed/extraDuration logic, second leg to border
  scene.tweens.add({ targets: shell, x: borderX, y: borderY, duration: extraDuration,
    onComplete: () => { shell.destroy(); trailEv.remove(); miss puff at border } })
  return
}
// 4. Hit — only hit stops at player
shell.destroy(); trailEv.remove();
explosion_small_1 at dest, shake, tint, onEnemyShellHitPlayer(1) with guard !isGameOver && !gameOverShown
```

- `extraDuration` derived as `remaining / (distToPlayer/baseDuration)` clamped `80..700 Scout`, `80..800 Bruiser`, `80..900 Warlord` preserves identical px/ms speed on both legs; miss total ≈ `baseDuration * distToBorder/distToPlayer`.
- `trailEv` now persists through second leg and is removed only at final `border` completion, not at `dest` for miss/Game Over.
- `shell` is never destroyed at `dest` for miss or Game Over — only at `border` or at player on hit/shield. Satisfies “Ensure shell is not destroyed early.”

Files touched:
- `src/game/entities/Scout.ts:192-234` border calc retained; `Scout.ts:259-342` two-leg tween hardened
- `src/game/entities/Bruiser.ts:168-206`; `Bruiser.ts:219-290`
- `src/game/entities/Warlord.ts:170-208`; `Warlord.ts:221-292`

Verification: `npm run build` passes; manual expectation miss puff now at `x=0` or `320` or `y=0/240` edge, hit still at player; shells in flight during Game Over continue to border instead of vanishing.

---

## 2. Issue 2 — Title player static idle bob, must wander demo and shoot bots (demo not real gameplay)

### Diagnosis

`src/game/scenes/Title.ts:54-66` and `TitleScene.ts:54-66` created player at `160, height-32` static bottom-center with idle bob:

```ts
this.tweens.add({ targets: [playerBase, playerTurret], y: height-31, duration:300, yoyo:true, repeat:-1 })
```

`Title.update():261-313` moved bots via `bot.update(this, playerX, playerY)`, handled bot-bot push 30 and player collision 28, clamped bots, auto-aimed turret to closest bot, but **never moved player**. Demo visually dead: player sits, bots wander around it.

`playAttract():316-432` shot from `getPlayerBarrelTip()` to `bot.turret` every 4000 ms (`attractTimer`), visual explosion/coins, but player never repositioned. No health logic in Title (correct), but wandering was missing.

Task requires: Title player should move around in demo (free space random wandering like enemies, but with demo logic) and shooting bots. Demo not real gameplay — no health loss, no Game Over, just visual.

### Fix — Title.ts:10-18,34-53,254-332 and TitleScene.ts:10-22,34-53,254-332

Add demo wandering state:

```ts
// Title.ts:13-18
private playerTargetX = 160
private playerTargetY = 200
private playerSpeed = 0.85
public isDemo = true
public isGameOver = false // bot tryFire compatibility — demo never Game Over
```

Replace static bob with wandering init `Title.ts:34-53`:

```ts
this.playerBase = this.add.image(160, height-32, 'player_base').setScale(0.9)
this.playerTurret = this.add.image(160, height-32, 'player_turret').setScale(0.9).setOrigin(0.5,0.7)
this.playerTargetX = Phaser.Math.Between(30,290)
this.playerTargetY = Phaser.Math.Between(80,200)
this.playerSpeed = Phaser.Math.FloatBetween(0.7,1.0)
this.pickNewPlayerTarget()
// bob removed — wandering is primary
```

Add `pickNewPlayerTarget():` `Title.ts:264-275` (and TitleScene):

```ts
private pickNewPlayerTarget() {
  this.playerTargetX = Phaser.Math.Between(30,290)
  this.playerTargetY = Phaser.Math.Between(30,200)
  this.time.delayedCall(Phaser.Math.Between(1400,2200), () => {
    if ((this as any)._starting) return
    if (!this.scene.isActive()) return
    if (!this.playerBase?.active) return
    if (!this.isDemo) return
    this.pickNewPlayerTarget()
  })
}
```

Update movement `Title.ts:277-303` (first block in `update()`):

```ts
if (this.isDemo && this.playerBase?.active) {
  const pAngle = Angle.Between(playerBase, playerTarget)
  const pDist = Distance.Between(playerBase, playerTarget)
  if (pDist<4) { playerTarget = Between(30,290), Between(30,200) }
  else { playerBase.x += cos(pAngle)*playerSpeed; playerBase.y += sin(pAngle)*playerSpeed; turret xy = base xy }
  width,height = this.scale
  playerBase.x = Clamp(x,24,width-24); playerBase.y = Clamp(y,30,height-40); turret synced
}
this.bots.forEach(bot=>bot.update(this, playerBase.x, playerBase.y))
```

Retain existing bot-bot 30 push, player-enemy 28 push (player immovable — only enemy pushed), clamp bots, auto-aim turret `RotateTo(...,0.28)`.

Demo not real gameplay guarantees:
- Title has no `playerHealthBar`, no `onEnemyShellHitPlayer`, no `triggerGameOver`, no `playerHits`. `isGameOver` stays false, `isDemo` true.
- Enemy shells fired via `bot.update` arrive at `playerBase` but `Title` has no hit handler, so no damage; `isPlayerInvulnerable` check safely no-ops (`typeof` guard).
- `playAttract` remains visual only (`setTint`, `explosion_small_1`, `coin_1`, `sfx` without `hit()`), so health bars stay full.
- Attract timer 4000 ms loop + 1200 ms initial call continues to showcase shooting while wandering; barrel tip `cos(rot-PI/2)*12` stays accurate as player moves.

Same changes mirrored to `TitleScene.ts` for consistency (unused in `main.ts` but documented).

Files touched:
- `src/game/scenes/Title.ts:10-18` fields, `34-53` wandering init, `254-275` pickNewPlayerTarget, `277-303` update wandering
- `src/game/scenes/TitleScene.ts` identical

---

## 3. Issue 3 — Game Over appears multiple times if multiple shells hit after death

### Diagnosis

`Game.onEnemyShellHitPlayer()` `Game.ts:422-448` and `triggerGameOver()` `Game.ts:616-632` had partial guards:

```ts
// onEnemyShellHitPlayer
if (isGameOver || gameOverShown) return
if (playerHits<=0) return
...
playerHits = max(0, hits-1)
if (playerHits<=0) triggerGameOver()

// triggerGameOver
if (gameOverShown) return
isGameOver=true; gameOverShown=true
```

Race: two shells `A` and `B` both complete tween same frame when `playerHits=1`. `A` passes `!isGameOver`, decrements to 0, calls `triggerGameOver` which sets flags. `B` already passed its initial `!isGameOver` check before `A` set flags (same tick, `time.now` identical), then also decrements (already 0 clamped) and calls `triggerGameOver` again before first `showGameOverPopup` delayedCall fires. Second `showGameOverPopup` would create duplicate backdrop/container, double `sfx_miss`, duplicate countUp.

`showGameOverPopup()` had no guard at all — unconditional creation.

`handleRetry` also not guarded against rapid double FIRE/SPACE.

### Fix — Game.ts:422-448, 616-632, 857-879, 830-855

- `onEnemyShellHitPlayer` hardened `Game.ts:422-435`:
  ```ts
  if (isGameOver || gameOverShown) return
  if (gameOverContainer) return
  if (playerHits<=0) return
  const now = time.now
  if (now < playerInvulnerableUntil) return
  if (isGameOver || gameOverShown) return // re-check after i-frames, another shell may have triggered
  playerHits = max(0, hits-1)
  ```

- `triggerGameOver` now guards both flags and container `Game.ts:616-622`:
  ```ts
  private triggerGameOver() {
    if (gameOverShown || isGameOver) return
    if (gameOverContainer) return
    isGameOver=true; gameOverShown=true // sync before delayedCall
    updatePlayerHealthBar()
    playPlayerBigExplosion()
    cameras.shake...
    time.delayedCall(420, ()=>showGameOverPopup())
  }
  ```

- `showGameOverPopup` idempotent `Game.ts:692-697`:
  ```ts
  private showGameOverPopup() {
    if (gameOverContainer) return
    if (!isGameOver && !gameOverShown) return
    const {width,height}=scale
    ...
  }
  ```

- `handleRetry` single-process guard `Game.ts:857-879`:
  ```ts
  private handleRetry() {
    if (!isGameOver) return
    if ((this as any)._retrying) return
    ;(this as any)._retrying=true
    // ... fade tween onComplete => _retrying=false; scene.restart()
  }
  ```
  Prevents multiple `scene.restart()` from rapid pointerdown/SPACE/ENTER.

- `create()` resets `gameOverShown/isGameOver` synchronously at top before any bot update can read them.

Result: only first shell reaching 0 triggers `triggerGameOver` → `showGameOverPopup` once; subsequent shells in flight continue to border (Issue 1) but do not damage or spawn second popup.

Files touched:
- `src/game/scenes/Game.ts:422-435` double guard, container check, re-check after i-frames
- `Game.ts:616-622` trigger guard both flags + container, sync set
- `Game.ts:692-697` popup idempotent
- `Game.ts:857-879` retry once guard

---

## 4. Issue 4 — Enemies shoot endlessly until player dies, but after Game Over → RETRY they never shoot again

### Diagnosis

`Game.create()` `Game.ts:52-148` initialized:

```ts
isGameOver=false; gameOverShown=false; playerHits=5; totalGains=0
// bots creation
positions.forEach((pos, idx)=>{
  const bot:any = new Cls(this, rx,ry,betAmount,maxBet) // constructor sets nextFireTime = now+interval+Between(350..1000)
  this.bots.push(bot)
})
// stagger
const now = time.now
this.bots.forEach((b,idx)=>{
  b.nextFireTime = now + interval + idx*650 + Between(150,400)
})
this.nextEnemyFireTime = now+900
```

But `this.bots` was **never cleared** on `scene.restart()`. Phaser `scene.restart()` destroys display list (all `Image`, `Rectangle`, `Container`) but retains the scene instance’s `this.bots` array. After first Game Over → RETRY, `create()` pushed 3 new bots onto the old 3, length 6; after n retries length 3n. Old bots held destroyed `base`/`turret` handles (`.active==false`) but still in loop, and their `nextFireTime` values were stale (past, e.g. 1200) while `now` was ~5000. New bots’ timers were staggered correctly, but old dead bots still occupied `isWindingUp` and `canEnemyFire` global slot, causing burst suppression. More critically, `isGameOver` was reset to `false` in `create()` *after* old bots’ `pickNewTarget` delayedCalls still fired with `scene.isActive()` false check but not `isGameOver`, and `nextEnemyFireTime` could remain in past if not reset before bots’ `tryFire` poll.

Observed after restart: `nextFireTime` in past should make bots fire immediately, but with `isGameOver` lingering true during fadeOut tween (handleRetry did `fadeOut(180)` then `scene.restart()` in tween onComplete 140 ms) there was a 40 ms window where `isGameOver` still true and `canEnemyFire` returned false, so no windup claimed. After restart `isGameOver` reset, but `nextEnemyFireTime` still past could cause immediate staggered burst not sustained, or if not past could be far future `+3000` causing silence for 3s feeling like “do not shoot”.

Task requires: when you lose and come back via RETRY, enemies should be reset and shooting again — reset enemy timers and `isGameOver`.

### Fix — Game.ts:52-95, 139-155, 857-879

`create()` now fully resets before bot creation `Game.ts:52-95`:

```ts
create() {
  const {width,height}=this.scale
  // Fix #4: cleanup stale bots from previous run
  if (this.bots && this.bots.length>0) {
    this.bots.forEach((b:any)=>{ try{b.destroy?.()}catch{} })
  }
  this.bots=[]
  this.isGameOver=false
  this.gameOverShown=false
  this.audio = new AudioManager(this); this.audio.initMusic()
  this.playerHits = this.playerMaxHits
  this.totalGains=0
  this.gameOverContainer=undefined; this.gameOverBackdrop=undefined
  this.countUp?.stop(); this.countUp=undefined as any
  this.nextEnemyFireTime=0
  this.playerInvulnerableUntil=0
  this.playerBlinkTween?.stop(); this.playerBlinkTween=undefined
  this.playerHealthBarBg=undefined as any; this.playerHealthBarFill=undefined as any
  this.playerHealthLabel=undefined as any; this.gainsHudText=undefined as any
  ;(this as any)._retrying=false
  // ... bg, playerBase/Turret, healthBar creation, bots push, stagger as before
}
```

Stagger preserved exactly `Game.ts:139-155`:

```ts
const now = this.time.now
this.bots.forEach((b:any, idx:number)=>{
  const interval = (b as any).fireInterval ?? 1800
  ;(b as any).nextFireTime = now + interval + idx*650 + Phaser.Math.Between(150,400)
})
this.nextEnemyFireTime = now+900
```

`handleRetry()` now pre-resets timers before restart `Game.ts:857-879`:

```ts
private handleRetry() {
  if (!isGameOver) return
  if ((this as any)._retrying) return
  ;(this as any)._retrying=true
  this.isGameOver=false // clear before restart so bots' tryFire gate opens immediately after create
  this.countUp?.stop()
  this.audio.playSfx('sfx_ui_blip')
  const now = this.time.now
  this.nextEnemyFireTime = now+900
  this.bots.forEach((b:any, idx:number)=>{
    const interval = (b as any).fireInterval ?? 1800
    ;(b as any).nextFireTime = now + interval + idx*650 + Between(150,400)
    ;(b as any).isWindingUp=false
  })
  this.playerInvulnerableUntil=0
  this.playerBlinkTween?.stop(); this.playerBlinkTween=undefined
  // fade tween -> onComplete _retrying=false; scene.restart() (which re-clears and re-staggers)
  if (gameOverContainer) tweens.add(..., onComplete: ()=>{ _retrying=false; scene.restart() })
  else { _retrying=false; scene.restart() }
  cameras.main.fadeOut(180)
}
```

Each bot’s `respawn()` already does `nextFireTime = scene.time.now + fireInterval + Between(400,800/900/1000)` `Scout.ts:441`, `Bruiser.ts:366`, `Warlord.ts:368`, so mid-game kill-respawn also stays live. Combined with global `canEnemyFire`/`notifyEnemyFired` 700 ms cooldown `Game.ts:379-386` and per-bot `isWindingUp` + aim cone `0.45/0.55/0.35` + `dist>=18`, firing is endless until player dies, then fully revived after RETRY.

Files touched:
- `src/game/scenes/Game.ts:52-95` cleanup stale bots, reset `isGameOver`/`gameOverShown`/`nextEnemyFireTime`/`playerInvulnerableUntil` before creation
- `Game.ts:139-155` stagger ensures `nextFireTime` future `now+interval+idx*650`
- `Game.ts:857-879` handleRetry pre-reset timers and `isWindingUp`, guard `_retrying`

---

## Verification

- `npm run build` — `tsc && vite build` passes, 16 modules, 1.54 MB → 351 kB gzip `Game.ts:build`
- `npm test` — 2/2 palette tests pass
- Manual expectation:
  - Bots alive: miss shells now traverse past predicted player to edge `0/320,0/240` and miss puff appears at border, not at player; hit still explodes at player and damages; shield puff still at player.
  - Title: player visibly wanders free space (30,290 × 30,200) at 0.7-1.0 px/frame, turret auto-aims, attract shots continue, no health bar/Game Over.
  - Game Over: only one `GAME OVER` panel, one `sfx_miss`, CountUp once, even if 2-3 shells land same frame after death.
  - RETRY: after Game Over, RETRY/SPACE restarts, new game immediately has bots shooting on same intervals (Scout 1800, Bruiser 2400, Warlord 3000) endless until death, no silence window.

## Files Touched Summary

- `src/game/entities/Scout.ts:192-234` border calc; `259-342` two-leg tween, Game Over continues to border, shell not destroyed early
- `src/game/entities/Bruiser.ts:168-206`; `219-290` same
- `src/game/entities/Warlord.ts:170-208`; `221-292` same
- `src/game/scenes/Game.ts:52-95` create cleanup + reset; `139-155` stagger; `379-386` global gate unchanged; `422-435` hit guard; `616-632` trigger guard; `692-697` popup guard; `857-879` retry guard + timer reset
- `src/game/scenes/Title.ts:10-18`, `34-53`, `254-275`, `277-332` demo wandering, isDemo/isGameOver, free wandering, no health
- `src/game/scenes/TitleScene.ts` mirrored Title fixes
- `docs/research/bullets_demo_gameover_fix.md` — this doc

