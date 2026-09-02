# ROBO STRIKE — Fire Range & Player Collision Fix (Subagent P)

**2026-09-02 — fix enemy shells capped at player position and enemies passing through player, make shells reach border on miss**

## 1. Diagnosis

### 1.1 Enemy shells capped at predicted player position, never reach border

Files read: `src/game/entities/Scout.ts:174-276`, `Bruiser.ts:153-227`, `Warlord.ts:155-229`, `src/game/scenes/Game.ts:251-319`, `Title.ts:255-287`, `TitleScene.ts:255-287`

Before fix each bot's `fire(scene, playerX, playerY)` did:

```ts
const destX = playerX
const destY = playerY // predicted impact == player pos at fire moment Scout.ts:192
scene.tweens.add({ targets: shell, x: destX, y: destY, duration: 360/420/480 })
```

Shell tween target == player. OnComplete exploded at `destX, destY` regardless of hit/miss. Miss case `Scout.ts:242-252` (`Bruiser 202-211`, `Warlord 204-213`) spawned gray puff `0xaaaaaa` at `dest` and returned — shell vanished at player predicted position. Visual: shot disappears where player *was*, not where border is. Task requires miss shots continue to border, only hit should explode at player.

`getBarrelTip()` correctly uses `cos(rot-PI/2)*12, sin(...)*12` `Scout.ts:84-89` etc., so muzzle is accurate.

### 1.2 Range gate prevents distant firing

`tryFire` in all three bots contained:

```ts
const dist = DistanceBetween(turret, player)
if (dist > 360) return // Scout.ts:128, Bruiser.ts:111, Warlord.ts:110
if (dist < 18) return
```

Arena is 320×240 (`INTERNAL_WIDTH/HEIGHT` `src/config/palette.ts:22-23`, `src/main.ts:10-11`). Diagonal ~400. `360` effectively caps firing at far quadrant; player near opposite border is safe but shell should still be able to traverse full arena to border. Spec: "Enemy fire does not reach player as target, capped in distance terms, should reach border or go all way out."

### 1.3 How `onComplete` handled miss vs hit

Previous onComplete `Scout.ts:224-274`:

1. `if (isGameOver) return`
2. `if (isPlayerInvulnerable) → blue puff #8ecfff at dest, no damage`
3. `actualDist = Distance(dest, playerBase)` if `>38 → gray miss puff #aaaaaa at dest, sfx 0.22, return`
4. else hit: `sfx 0.45, shake, explosion_small_1 at dest 0.9→1.3, tint white 60ms, onEnemyShellHitPlayer(1)`

So dodge window 38 px (Scout/Bruiser/Warlord shared) required moving 38 px in 360-480 ms flight + 280-360 ms windup = 640-840 ms window. Achievable at player speed 1.4 px/frame (~84 px/s) per `Game.ts:258`. But miss still vanished at `dest`.

Aim cone gate `Scout 0.45`, `Bruiser 0.55`, `Warlord 0.35` `Scout.ts:124-125` prevents firing while misaligned. Shared global cooldown 700 ms `Game.ts:36-38` and i-frames 800 ms correctly stagger bursts.

### 1.4 Enemy movement passes through player — missing collision

`Game.update()` `Game.ts:273-296` handled bot vs bot push:

```ts
const minDist = 30
for (i<j) if (d<30) push = (30-d)/2 equally to both, sync turret
```

Then clamped bots to `24,width-24` / `30,height-40`. No check vs `playerBase`. `Title.ts:258-275` and `TitleScene.ts:258-275` identical. Result: bots path straight through player position; player cannot block.

Task requires: same `minDist 28` push logic but include player, player immovable (push enemy away only), clamp afterward. Keep bot-bot 30 push.

## 2. Fix

### 2.1 Shell raycast to border — miss continues, hit stops at player

Each bot now computes `borderX/Y` as ray from `tip` through `dest` to screen edge `0,width × 0,height`:

```ts
const w = scene.scale.width ?? 320
const h = scene.scale.height ?? 240
const dx = destX - tip.x, dy = destY - tip.y
let bestT = Infinity
// t for x=0/w, y=0/h where numerator/dx, check y/x inside [0,w/h] and t>0.001
if (abs(dx)>0.001) { t1=(0-tip.x)/dx, t2=(w-tip.x)/dx → check y in bounds, bestT=min }
if (abs(dy)>0.001) { t3=(0-tip.y)/dy, t4=(h-tip.y)/dy → check x in bounds, bestT=min }
border = tip + bestT*dx,dy clamped to [0,w]×[0,h]
```

If `dest==tip` (zero length) fallback keeps `border=dest`.

Trail logic unchanged, `getBarrelTip()` untouched.

### 2.2 Two-leg tween: tip→player (baseDuration) then if miss → player→border

Base durations preserved: Scout 360, Bruiser 420, Warlord 480 `Scout.ts:baseDuration`, `Bruiser.ts`, `Warlord.ts`.

First tween `shell → dest` with `baseDuration`. OnComplete:

- `isGameOver` → destroy + `trailEv.remove()` return
- `isPlayerInvulnerable →` destroy at `dest`, blue puff `0.55 alpha 0.45 #8ecfff` at `dest`, no continued flight (shielded hit stops)
- `actualDist>38 →` **miss**: do NOT destroy yet. Compute `remaining = Distance(dest,border)`, `distToPlayer = Distance(tip,dest)`, `speed = distToPlayer/baseDuration` px/ms, `extraDuration = remaining/speed` clamped `80..700 Scout`, `80..800 Bruiser`, `80..900 Warlord`. Start second tween `shell → border` with `extraDuration`. On its completion destroy, `trailEv.remove()`, spawn miss gray puff `0xaaaaaa` at `border` (not dest), sfx 0.22. Shell visually continues past predicted player position to border edge.
- else **hit**: `shell.destroy()+trailEv.remove()`, `sfx_explosion_small 0.45-0.5`, `shake`, `explosion_small_1 at dest`, tint player white, `onEnemyShellHitPlayer(1)`. Only hit explodes at player.

This satisfies "only on hit should it explode at player; miss should continue to border, not vanish at player." Speed preserved (same px/ms as base leg), extra leg clamped to avoid >900 ms when player is <18 px away (ratio large).

Invulnerability shield puff remains at `dest` (player) — correct because shell is blocked at player, not continuing.

### 2.3 Range gate removal

Deleted `if (dist > 360) return` in all three `tryFire` (`Scout.ts:126-128`, `Bruiser.ts:110-111`, `Warlord.ts:110-111`). Now:

```ts
const dist = DistanceBetween(turret, player)
if (dist < 18) return // only point-blank reject
```

So bot fires at any arena distance; shell ray reaches border even if player is far corner. Keeps `<18` to avoid self-collision / jitter when overlapping.

### 2.4 Player collision — enemies cannot pass through player

`src/game/scenes/Game.ts:291-309` after bot-vs-bot loop, inserted:

```ts
const playerMinDist = 28
for (const bot of this.bots as any[]) {
  if (bot.alive === false) continue
  const d = DistanceBetween(bot.base, playerBase)
  if (d < 28 && d > 0.1) {
    const angle = Angle.Between(playerBase.x, playerBase.y, bot.base.x, bot.base.y)
    const push = 28 - d
    bot.base.x += cos(angle)*push
    bot.base.y += sin(angle)*push
    bot.turret.x = bot.base.x; bot.turret.y = bot.base.y
  }
}
 // clamp bots 24,width-24 / 30,height-40
 this.playerTurret.x = this.playerBase.x; this.playerTurret.y = this.playerBase.y
```

Player is immovable: only enemy is pushed along radial from player. `alive===false` dead bots ignored (still fading via `playBigExplosion`). Same block added to `Title.ts:276-303` and `TitleScene.ts:276-303` with `width,height` fetched from `this.scale` and clamping bots afterwards. Already existing bot-bot 30 push preserved.

### 2.5 Barrel tip preserved

`getBarrelTip()` in all three entities retains `cos(rot-PI/2)*12, sin(...)*12` `Scout.ts:84-89`, `Bruiser.ts:72-76`, `Warlord.ts:72-76`. Flash still spawns at `tip` and rotated to `turret.rotation`.

## 3. Before/After Metrics

| Metric | Before | After |
|---|---|---|
| Shell tween target | `playerX,Y` (capped) | `borderX,Y` ray from tip through player to `0,width×0,height` on miss; `playerX,Y` on hit |
| Miss shell fate | vanish at `dest` + gray puff at `dest` | continue `dest→border` (80-900 ms extra) + gray puff at `border` |
| Hit shell fate | explode at `dest` + damage | same — explode at `dest` + damage (only hit explodes at player) |
| Range gate | `18 < dist ≤360` | `dist ≥18` (no upper cap) — border reachable from any distance |
| Invulnerable shell | blue puff at `dest`, no damage | same, stops at `dest` |
| Bot vs bot push | 30 px /2 each | unchanged 30 px |
| Bot vs player push | none — pass through | 28 px, enemy pushed away, player immovable, clamped `24,width-24 / 30,height-40`, turret synced |
| Barrel tip | `cos*12, sin*12` correct | unchanged correct |
| Scout/Bruiser/Warlord base durations | 360/420/480 ms to player | same to player + extra clamped to border on miss |

## 4. Files Touched

- `src/game/entities/Scout.ts:126-128` — remove `dist>360` gate, keep `<18` only
- `src/game/entities/Scout.ts:174-...` — add border raycast `w,h,dx,dy,bestT`, two-leg tween, miss→border, hit→player
- `src/game/entities/Bruiser.ts:110-111` — same gate removal
- `src/game/entities/Bruiser.ts:153-...` — same border logic `baseDuration 420`, extra `80..800`
- `src/game/entities/Warlord.ts:110-111` — same gate removal
- `src/game/entities/Warlord.ts:155-...` — same border logic `baseDuration 480`, extra `80..900`
- `src/game/scenes/Game.ts:273-318` — added player collision 28 push after bot-bot loop + clamp + turret sync
- `src/game/scenes/Title.ts:255-303` — added identical player collision 28 push + clamp
- `src/game/scenes/TitleScene.ts:255-303` — same
- `docs/research/fire_range_collide_fix.md` — this doc

## 5. Verification

- `npm run build` — passes `tsc && vite build`, 1.54 MB → 351 kB gzip `Game.ts:build`
- No new dependencies; strict TS passes; `any` bridge for `scene as any` retained
- Manual expectation:
  - Bots alive: shells fired from tip now on miss traverse past player to edge; gray puff appears at border (x=0 or 320 or y=0/240), not at player
  - On hit (player within 38 px of predicted dest and not i-framed) explosion still at player, shake, damage
  - i-frame shield puff still at player
  - Distance no longer blocks firing at far corners; shell still reaches border even at max arena span
  - Bots slide but cannot overlap player; min distance 28 maintained; bots still repel each other at 30; clamped inside free space

## 6. Tuning Notes

- `extraDuration` clamped 80..700/800/900 prevents 3-4 s flight when `distToPlayer` minimal 18 and remaining ~300 (ratio ~16). Without clamp, extra would be ~5800 ms for Scout; clamp keeps feel snappy while still visibly reaching border.
- Speed derived as `distToPlayer/baseDuration` so shell velocity identical on both legs; total miss flight ≈ `distToBorder / speed` ≈ `baseDuration * distToBorder/distToPlayer`.
- If Warlord feels too slow on miss (480+900=1380 ms), reduce clamp upper to 700 same as Scout.
- Player push 28 vs bot-bot 30: player slightly larger exclusion; increase to 30 if want symmetric, decrease to 24 if want tighter squeeze.
- Border computed to `0,width` incl. clamp ensures even diagonal shots hit corner exactly; use `-8`/`+8` if want to go completely off-screen ("go all way out").
