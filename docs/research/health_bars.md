# ROBO STRIKE — Health Bars, Big Explosion, Fire-Back, Barrel Shooting

**Subagent M — 2026-09-02 — implements per-bot health bars, bet-scaled hitsToKill, big explosion, enemy fire-back, and barrel-tip-accurate shooting.**

## 1. Summary

Each robot now has its own health bar (24×3 px, bg #1a1a1a, fill per bot), bet-scaled hit points, per-bot firing timers, and barrel-tip accurate shell spawn. When health empties, a big explosion (explosion_big_1..6 scaled 1.5–2.0, screen shake, flash) + sfx_explosion_big plays before respawn. All movement stays free-space random wandering with 30 px push separation (casino-cosmetic only). No Math.random touches VRF outcome path.

## 2. Health Bar Spec

| Bot | Fill | Base HP | File |
|-----|------|---------|------|
| SCOUT | cyan #4ff2e3 `0x4ff2e3` | 2 | `src/game/entities/Scout.ts:7-9` |
| BRUISER | gold #ffd94f `0xffd94f` | 3 | `src/game/entities/Bruiser.ts:7-9` |
| WARLORD | mint #58ff9b `0x58ff9b` | 4 | `src/game/entities/Warlord.ts:7-9` |

- Bar geometry: `24×3` rect at `base.x, base.y-16`, bg `0x1a1a1a` depth 12, fill depth 13 anchored left `origin(0,0.5)`. Width = `24 * (hits/maxHits)`. Hidden when `alive==false` or `hits==0`. Updated each `update()` via `updateHealthBar()` and immediately on `hit()`. Creation in `createHealthBar(scene)` called from constructor.

### Bet-scaled hitsToKill

Mock values in `Game.ts:15-16` — `betAmount=10, maxBet=100` (read from scene, real integration will pull from HostSnapshot/chain). Each bot computes:

```ts
const wagerFactor = 1 + (betAmount / maxBet) * 1.5   // 1.0 .. 2.5
maxHits = Math.ceil(wagerFactor * baseHP)
// SCOUT 2 → 3 at bet10/max100 (factor1.15→ceil2.3=3), 5 at max bet
// BRUISER 3 → 4, 8
// WARLORD 4 → 5, 10
```

Stored as `maxHits`/`hits`/`alive`. Health is cosmetic until math subagent wires canonical `thresholds.ts`; grep-ban keeps `Math.random` out of payout path.

### Hit → Kill flow

- `bot.hit(scene): boolean` decrements `hits`. If `hits<=0` → sets `alive=false`, hides bars, calls `playBigExplosion(scene)`, returns `true`. Else flashes white tint, small `explosion_small_1` scale 1.5, `sfx_explosion_small`, updates bar, returns `false`. `Game.handleFire()` (Game.ts:131) only respawns on `killed==true`.

## 3. Big Explosion

Triggered only when health empties. Implementation per bot (e.g. `Scout.ts:playBigExplosion`):

- `audio.playSfx('sfx_explosion_big', {volume:0.9})`
- `cameras.main.shake(220-260, 0.015-0.02)` + `flash(160-200,255,220,90)`
- Uses `explosion_big_1..6` textures, `scale` random `1.5-2.0` via `Phaser.Math.FloatBetween(1.5,2.0)`, cycles frame every 50-60 ms via `time.addEvent`, grows `+0.04-0.06` per frame.
- Particle spray: 6-8 `3×3` rects colored per bot, fly `10-18px` outward, fade `320-360ms`.
- Hides bot `base`/`turret` via `tweens alpha 0` until `respawn()` restores.
- Assets preloaded in `Boot.ts:35-44` — `explosion_big_1..6`, `explosion_small_2..4`, `muzzle_2`, `shell_trail_*`.

Fallback: if `explosion_big_1` missing, uses `explosion_small_1`.

Respawn: `bot.respawn(scene,x,y,betAmount,maxBet)` recomputes `maxHits` from `wagerFactor`, resets `hits`, `alive`, bars, `nextFireTime`, `targetX/Y`, fades in from `scale 0.3→0.85` with `Back.easeOut`.

## 4. Fire Back — Per-Bot Timers

Each bot file owns its firing logic, different base rates + jitter:

| Bot | base interval | jitter | effective |
|-----|---------------|--------|-----------|
| SCOUT | 800 ms | ±150 | 650-950 |
| BRUISER | 1200 ms | ±200 | 1000-1400 |
| WARLORD | 1500 ms | ±250 | 1250-1750 |

Fields: `readonly fireInterval`, `private nextFireTime`. In `update()` calls `tryFire(scene,playerX,playerY)` → if `alive` and `time.now >= nextFireTime` then `nextFireTime = now + fireInterval + Between(-jitter,jitter)` and `fire()`.

`fire()` steps (mirrored across Scout/Bruiser/Warlord with slight trail/duration variance):

1. `getBarrelTip()` → `cos(rot-PI/2)*12, sin(...)*12` added to `turret.x/y`.
2. `sfx_fire`, `muzzle_1` at tip `scale 0.5-0.6` rotated to `turret.rotation`, destroyed 70 ms.
3. `shell` image `scale 0.55-0.62` at tip, trail `time.addEvent 16-20ms` spawning `shell` flecks `alpha 0.55-0.65` fading 160-180 ms.
4. Tween `shell` to `playerX/Y` `360-480ms Linear`; onComplete plays `sfx_explosion_small`, `shake 70-90,0.004-0.006`, `explosion_small_1` scale 0.9→1.3-1.4, flashes player `base`/`turret` white 60-70 ms. Player health not deducted (casino still).

Called from `Game.update()` `bots.forEach(b=>b.update(this,playerX,playerY))` after movement. Title.ts also calls same update, so attract screen shows return fire cosmetically.

## 5. Barrel-Tip Accurate Shooting

Formula per spec (applied to player and enemy):

```ts
getBarrelTip(): {x,y} {
  const rot = turret.rotation
  return {
    x: turret.x + Math.cos(rot - Math.PI/2) * 12,
    y: turret.y + Math.sin(rot - Math.PI/2) * 12
  }
}
```

- Player: `Game.getPlayerBarrelTip()` used in `handleFire()` for `muzzle_1` and `shell` spawn. Previously `playerTurret.x, y-8` center spawn removed. `Title.playAttract()` likewise fixed (`Title.ts:282-300`, `TitleScene.ts:282-300`).
- Enemy: each bot's `getBarrelTip()` used in its `fire()`.

Barrel length 12 px matches 32 px tank sprite (0.85 scale). Turret `origin 0.5,0.7` ensures pivot at base.

## 6. Movement — Free Space Wandering

Unchanged except push distance raised 28→30 px per spec. Each bot: random target `Between(30,290), Between(30,200)`, moves via `angle + speed` (`Scout 0.7-1.1, Bruiser 0.4-0.7, Warlord 0.5-0.85`), picks new target on `dist<4` or timed delayedCall (1.2-1.8s SCOUT, 1.8-2.6s BRUISER, 1.4-2.1s WARLORD). `Game.update()` does 30 px push separation and clamps `24..width-24, 30..height-40`. Cosmetic only, no VRF influence.

## 7. Game.ts Integration

- `Game.ts:10-16` — adds `betAmount/maxBet` mock, imports same.
- `Game.create()` — constructs bots as `new Cls(this,rx,ry,betAmount,maxBet)` (Scout.ts:14).
- `Game.update()` — `minDist=30`, clamps free space, `alive` check for closest target, health bars updated inside `bot.update()`.
- `Game.handleFire()` — barrel tip, trail, `target.hit(this)` bool, big vs small branching, coin spray only on kill, `respawnEnemy` after 760 ms.
- `Game.respawnEnemy()` — delegates to `bot.respawn(this,x,y,betAmount,maxBet)` (Game.ts:214-222). Handles tint/scale/timers internally.
- Player aim: auto-aims at closest alive bot.

## 8. Title.ts / TitleScene.ts

- Fixed muzzle/shell to barrel tip in `playAttract()` (Title.ts:282-308). Update push 30 px, adds `getPlayerBarrelTip()`. Bots still create health bars (demo) but attract hit remains cosmetic tint+small explosion without health deduction, so title bars stay full. Enemy return fire runs via `bot.update()` for liveliness; can be suppressed by setting `nextFireTime=Infinity` if needed.

## 9. Boot.ts Asset Loads

Added `Boot.ts:35-45`:

```ts
this.load.image('explosion_small_2'..'4', 'assets/raw/...')
this.load.image('explosion_big_1'..'6', 'assets/raw/...')
this.load.image('muzzle_2', ...)
this.load.image('shell_trail_1','_2', ...)
```

All map to `public/assets/raw/` via `publicDir`.

## 10. VRF / Math Safety

Health is explicitly cosmetic (`docs/MATH.md` thresholds remain source of truth). No `Math.random` in outcome mapping; only cosmetic `Phaser.Math.Between/FloatBetween` for wandering, jitter, explosion scale/particles, trail. `grep -R "Math.random" src/lib/thresholds` must stay clean; SDK `thresholds.ts` not touched. Bet scaling placeholder `wagerFactor` factored locally, not fed to contract.

## 11. Verification

- `npm run build` — passes (tsc && vite, 1.52 MB, chunk 347 kB gzip).
- `npm test` — 2/2 palette tests pass.
- No new dependencies.

## 12. Future Casino Wiring (for math agent)

Replace `betAmount/maxBet` mock with `hostSnapshot.sessions[0].wager` and `quoteCaps.maxBet`. Make `hitsToKill` deterministic from `sessionId` low bits if needed, but still cosmetic unless paytable declares. Keep `hit()` returning kill bool to trigger `revealOutcome` only on final blow within single-session staged ceremony (instant pattern).

## Files Touched

- `src/game/entities/Scout.ts` — health vars, bar, 800 ms fire, big explosion
- `src/game/entities/Bruiser.ts` — same, 1200 ms
- `src/game/entities/Warlord.ts` — same, 1500 ms
- `src/game/scenes/Game.ts` — barrel tip, health integration, bet mock, respawn delegate, 30 px push
- `src/game/scenes/Title.ts` + `TitleScene.ts` — barrel tip in attract, 30 px
- `src/game/scenes/Boot.ts` — loads `explosion_big_1..6`, `explosion_small_2..4`
- `docs/research/health_bars.md` — this doc

## References

- Assets: `public/assets/raw/explosion_big_*.png` (CC0 bombing), `sfx_explosion_big.wav` (real bombing), `shell.png`, `muzzle_1.png`.
- Config: `320×240 4:3`, palette `#1a1a1a` outline, `0x4ff2e3/0xffd94f/0x58ff9b`.

