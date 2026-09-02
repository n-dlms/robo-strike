# ROBO STRIKE — Fire Spam Fix (Bots Burst, Player Locked)

**Subagent O — 2026-09-02 — diagnose and fix bug where 3 bots fire simultaneously, player cannot move, depletes in ~2s.**

## 1. Diagnosis

### 1.1 Firing intervals too high (combined DPS kills 5-HP player in ~1.8s)

| Bot | File | Old `fireInterval` | Jitter | Effective | Avg |
|---|---|---|---|---|---|
| Scout | `src/game/entities/Scout.ts:22` | 800 ms | ±150  `Scout.ts:116` | 650–950 | 800 |
| Bruiser | `src/game/entities/Bruiser.ts:19` | 1200 ms | ±200  `Bruiser.ts:101` | 1000–1400 | 1200 |
| Warlord | `src/game/entities/Warlord.ts:19` | 1500 ms | ±250  `Warlord.ts:101` | 1250–1750 | 1500 |

Combined ≈ 2.75 shells/sec. Player `playerMaxHits=5` `src/game/scenes/Game.ts:25` with 1 dmg per shell → death in `5 / 2.75 ≈ 1.8s`. Health bar 40×4 larger than bots 24×3 is visible (`Game.ts:300-337`), so depletion is immediately fatal.

### 1.2 `tryFire` polled every frame, no global gate → simultaneous burst

- `Game.update()` `Game.ts:249` calls `bot.update(this, playerX, playerY)` every frame (60 Hz).
- Each `bot.update()` `Scout.ts:91-109`, `Bruiser.ts:78-94`, `Warlord.ts:78-94` ends with `tryFire(scene, playerX, playerY)` unconditionally.
- `tryFire` only checks `alive` and `now < nextFireTime` (`Scout.ts:112-119`), then sets `nextFireTime = now + interval + jitter` and calls `fire()`. No `isGameOver` guard at fire *start* (only at shell *impact* `Scout.ts:188` `!gameAny.isGameOver`), no shared cooldown, no telegraph.
- Initial `nextFireTime` seeded with only 0–300/400/500 ms random (`Scout.ts:43`, `Bruiser.ts:38`, `Warlord.ts:38`) → at t=0 up to 3 shells can be queued within first second. Jitter insufficient to desync.
- Shell tween locks predicted `playerX/Y` at fire time (`Scout.ts:162-165` duration 360 ms, Bruiser 420 ms, Warlord 480 ms) but `onComplete` **always damages** regardless of player motion: it shakes, explodes, flashes player tint, then `onEnemyShellHitPlayer(1)` (`Scout.ts:167-190`). Multiple shells in flight before `isGameOver` flips all still resolve because `isGameOver` only checked at impact, and `onEnemyShellHitPlayer` deducts each shell sequentially. Player cannot dodge by moving.

### 1.3 Missing defenses

- No invincibility frames after hit — `Game.ts:340-359` `onEnemyShellHitPlayer` decrements, flashes 60 ms, shakes, but leaves player immediately vulnerable to the next shell landing 1 frame later.
- No aim/range gating — bots fire even while turret still lerping (`Scout.ts:106` lerp 0.24, Bruiser 0.12) and from any distance (no `DistanceBetween` check). `Warlord.ts:91` instant aim but still fires through walls.
- No telegraph — shell spawns instantly after `tryFire` passes; player sees no 250–350 ms charge window to reposition. Burst therefore *feels* unavoidable and locks movement (player trying to dodge is still counted as hit).
- `update()` freezes on `isGameOver` (`Game.ts:232`), preventing *new* shells, but shells already tweening are not cancelled, so death remains queued.

### 1.4 Barrel tip correct, visibility/range wrong

`getBarrelTip()` correctly uses `cos(rot-PI/2)*12, sin(...)*12` (`Scout.ts:83-88` etc.), so muzzle is visibly accurate. Firing *even when not visible or far* is un-gated — no `alive && active` beyond `alive`, no range cap, no aim-cone test.

## 2. Fix

### 2.1 Interval reduction (slower)

| Bot | New `fireInterval` | File | Jitter (new) |
|---|---|---|---|
| Scout | **1800 ms** (was 800) | `Scout.ts:22` | ±220 |
| Bruiser | **2400 ms** (was 1200) | `Bruiser.ts:19` | ±260 |
| Warlord | **3000 ms** (was 1500) | `Warlord.ts:19` | ±320 |

Effective solo rates: Scout 0.56/s, Bruiser 0.42/s, Warlord 0.33/s. Combined theoretical 1.31/s, but global gate throttles further (see 2.2).

### 2.2 Shared global cooldown + stagger (round-robin)

`Game.ts:35-38` adds:

```ts
private nextEnemyFireTime = 0
private readonly globalEnemyFireCooldown = 700
private playerInvulnerableUntil = 0
private readonly playerIFramesMs = 800
```

```ts
public canEnemyFire(now:number){ return !isGameOver && now >= nextEnemyFireTime }
public notifyEnemyFired(now:number){ nextEnemyFireTime = now + 700 }
public isPlayerInvulnerable(now:number){ return now < playerInvulnerableUntil }
```

- Created in `create()` `Game.ts:51-55,139-148`: stagger overrides each bot's `nextFireTime = now + interval + idx*650 + Between(150,400)` and sets `nextEnemyFireTime = now + 900` grace. Idx 0/1/2 gives 0 / 650 / 1300 ms stagger so first 3 shots cannot overlap.
- Each bot's `tryFire` now gates on `canEnemyFire(now)` (`Scout.ts:125`, `Bruiser.ts:109`, `Warlord.ts:109`) and immediately claims `notifyEnemyFired(now)` on windup start, forcing the next bot to wait ≥700 ms. This is true round-robin: at most one windup at a time, spacing bursts to ≥700 ms even if two timers expire together.
- Initial respawn timers widened to `400-800/900/500-1000` (`Scout.ts:295`, `Bruiser.ts:230`, `Warlord.ts:230`) to keep post-respawn desync.

### 2.3 Telegraph (windup before shell)

`private isWindingUp = false` per bot. On eligible fire:

1. `isWindingUp=true`, `base/turret` tint white, scale pulse `0.92 yoyo 110-130 ms`.
2. Charge marker `rectangle 4-6 px #ffff66` attached via `time.addEvent 16 ms` syncing to `base.x, base.y-18`.
3. `delayedCall` 280 ms Scout / 320 ms Bruiser / 360 ms Warlord, then `isWindingUp=false`, clear marker, restore tint, `fire()`.

This gives the player a visible 280–360 ms dodge window per spec. `isWindingUp` also prevents re-entry if `tryFire` polls again during charge. Marker destroyed on early death/`isGameOver`.

### 2.4 Aim + range gates

`tryFire` now requires:

- `isGameOver` false at both gate and delayed-fire recheck.
- Aim cone: computed `desired = Angle.Between(turret, player)+PI/2`, `diff = Wrap(rotation-desired)` must be ≤ 0.45 Scout / 0.55 Bruiser / 0.35 Warlord. Prevents firing through 90° turn.
- Range: `DistanceBetween(turret, player)` must be `18 < dist ≤ 360`. Documents far-range intent (arena 320×240, so 360 is effectively in-bounds but catches off-screen), and rejects point-blank spam.
- `alive` + `!isWindingUp` early returns.

### 2.5 Shell impact: i-frames + dodge (proximity) check

`fire()` now captures `destX/Y = playerX/Y` at fire moment. In `tween.onComplete`:

1. `if(isGameOver) return`
2. **i-frames**: `if(isPlayerInvulnerable(now))` → spawn small blue-tinted puff `scale 0.55 alpha 0.45 #8ecfff`, no shake/damage, no `onEnemyShellHitPlayer`.
3. **Dodge**: `actualDist = Distance(dest, playerBase.x/y)` → if `>38` → spawn gray miss puff `scale 0.5 alpha 0.35 #aaaaaa`, `sfx_explosion_small 0.22`, return without damage.
4. Otherwise full hit path: `sfx_explosion_small 0.45-0.5`, `shake 70-90`, `explosion_small_1 0.9→1.3`, player flash, then `onEnemyShellHitPlayer(1)`.

38 px threshold ≈ 2× tank width at 0.85 scale; moving 38 px in 360–480 ms requires ~80–105 px/s, achievable at player speed 1.4 px/frame (~84 px/s), so dodging is possible but not trivial.

### 2.6 Player i-frames implementation

`Game.ts:371-403` — on actual damage:

- `playerInvulnerableUntil = now + 800`
- `startPlayerIFramesVisual()` tweens `playerBase/turret` alpha `1→0.35 yoyo repeat 4 duration 90 ease Sine`, restoring at complete. Re-entrant call stops prior tween.
- `onEnemyShellHitPlayer` early-returns if `now < playerInvulnerableUntil` (absorbs stacked shells landing inside window).
- `triggerGameOver` calls `stopPlayerIFramesVisual()` to restore alpha before death explosion.
- Health bar update unchanged but `pct` uses `isGameOver ? 0 : hits/max` so bar hides only on death, not during i-frames.

Result: max damage rate limited to `1 per 800 ms = 1.25/s` even if burst passes global gate, stretching 5-HP time-to-death to ≥4 s with dodging extending further — player can now move.

### 2.7 `isGameOver` guard hardening

Both windup start and delayed `fire()` re-check `gameAny.isGameOver` before spawning shell, preventing new shells after freeze. `Game.update` early-return `Game.ts:239` remains, but now also no queued windup will complete post-freeze.

## 3. Before/After Metrics

| Metric | Before | After |
|---|---|---|
| Fire intervals | 800/1200/1500 | **1800/2400/3000** |
| Combined shells/sec (theory) | 2.75 | 0.57 avg (global gate 700 ms caps burst, intervals cap sustain) |
| Burst at t=0 (3 shells) | ~0–500 ms window (simultaneous) | Staggered 0 / 650 / 1300 + 900 grace, ≥700 ms spacing |
| Telegraph | 0 ms | 280 / 320 / 360 ms per bot |
| Can fire while turret misaligned? | Yes | No (0.35–0.55 rad cone) |
| Shell hits even if dodged? | Yes (always) | No — 38 px miss radius → no damage |
| Hits per sec while standing still | 2.75 | ≤1.25 (i-frames) |
| Time to kill 5 HP (standing) | ~1.8 s | ~4–6 s (i-frames) + dodge extends to 6–10 s |
| Can move to avoid? | No meaningful (hit guaranteed) | Yes — 280–360 ms windup + 360–480 ms flight = 640–840 ms dodge window |

## 4. Files Touched

- `src/game/entities/Scout.ts:22-23,125-180,182-250` — interval 1800, `isWindingUp`, gated `tryFire`, telegraph, dodge/i-frame-aware `fire`, widened jitter/respawn.
- `src/game/entities/Bruiser.ts:19-20,107-178,180-230` — same, interval 2400.
- `src/game/entities/Warlord.ts:19-20,107-188,188-237` — same, interval 3000.
- `src/game/scenes/Game.ts:35-38,51-55,139-148,365-403,407-441,546` — `nextEnemyFireTime/globalEnemyFireCooldown/playerInvulnerableUntil/playerIFramesMs`, `canEnemyFire/notifyEnemyFired/isPlayerInvulnerable`, stagger in `create()`, i-frame blink visuals, guarded `onEnemyShellHitPlayer`, `isGameOver` rechecks.
- `docs/research/fire_spam_fix.md` — this doc.

## 5. Verification

- `npm run build` — passes (`tsc && vite build`, 1.538 MB → 350 kB gzip) `Game.ts:build`.
- No new dependencies.
- `strict` TypeScript passes; `isWindingUp` and global gate types use `any` bridge to keep `Scene` ↔ `Game` coupling without circular import.
- Manual expectation: with 3 bots alive, successive shells arrive ≥700 ms apart, each preceded by yellow charge marker; player taking a hit blinks 800 ms and can traverse ~70 px before next vulnerable shell; standing still dies in ~5–6 s vs 1.8 s before; moving/dodging survives significantly longer.

## 6. Tuning Notes

- `globalEnemyFireCooldown = 700` and `playerIFramesMs = 800` with `Scout 1800/Bruiser 2400/Warlord 3000` are intentionally conservative for testing per task; can be softened to 500–600 ms global and 1500/2100/2600 intervals for faster pace without reintroducing burst.
- Dodge radius 38 px and windup 280–360 ms were chosen to match player speed 1.4 px/frame; tightening radius to 28 px or lengthening windup to 350–400 ms both increase survivability further.
- If Warlord feels too slow at 3000 ms, 2700 ms keeps threat ordering (Scout still fastest) while shaving 300 ms.
