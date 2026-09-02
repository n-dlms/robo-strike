import Phaser from 'phaser'

export class Bruiser {
  base: Phaser.GameObjects.Image
  turret: Phaser.GameObjects.Image
  targetX: number
  targetY: number
  private speed: number

  readonly baseHP = 3
  readonly barColor = 0xffd94f
  readonly tintColor = 0xffd94f
  maxHits: number = 3
  hits: number = 3
  alive: boolean = true
  private healthBarBg?: Phaser.GameObjects.Rectangle
  private healthBarFill?: Phaser.GameObjects.Rectangle

  readonly fireInterval = 2400
  private nextFireTime = 0
  private isWindingUp = false

  constructor(scene: Phaser.Scene, x: number, y: number, betAmount = 10, maxBet = 100) {
    const pt = { x, y }
    this.base = scene.add.image(pt.x, pt.y, 'enemy2_base').setScale(0.85)
    this.turret = scene.add.image(pt.x, pt.y, 'enemy2_turret').setScale(0.85).setOrigin(0.5, 0.7)
    this.base.setTint(this.tintColor)
    this.turret.setTint(this.tintColor)
    this.speed = Phaser.Math.FloatBetween(0.4, 0.7)
    this.targetX = Phaser.Math.Between(30, 290)
    this.targetY = Phaser.Math.Between(30, 200)
    this.pickNewTarget(scene)

    const wagerFactor = 1 + (betAmount / maxBet) * 1.5
    this.maxHits = Math.ceil(wagerFactor * this.baseHP)
    this.hits = this.maxHits
    this.alive = true
    this.createHealthBar(scene)
    this.nextFireTime = scene.time.now + this.fireInterval + Phaser.Math.Between(450, 850)
  }

  private pickNewTarget(scene: Phaser.Scene) {
    this.targetX = Phaser.Math.Between(30, 290)
    this.targetY = Phaser.Math.Between(30, 200)
    scene.time.delayedCall(Phaser.Math.Between(1800, 2600), () => {
      if (!(scene.scene.isActive())) return
      if (!this.base.active) return
      this.pickNewTarget(scene)
    })
  }

  private createHealthBar(scene: Phaser.Scene) {
    const x = this.base.x
    const y = this.base.y - 16
    this.healthBarBg = scene.add.rectangle(x, y, 24, 3, 0x1a1a1a).setDepth(12).setOrigin(0.5)
    this.healthBarBg.setStrokeStyle(1, 0x1a1a1a)
    this.healthBarFill = scene.add.rectangle(x - 12, y, 24, 3, this.barColor).setDepth(13).setOrigin(0, 0.5)
  }

  private updateHealthBar() {
    if (!this.healthBarBg || !this.healthBarFill) return
    const x = this.base.x
    const y = this.base.y - 16
    this.healthBarBg.setPosition(x, y)
    this.healthBarFill.setPosition(x - 12, y)
    const pct = this.alive ? Math.max(0, this.hits / this.maxHits) : 0
    this.healthBarFill.width = 24 * pct
    this.healthBarFill.setVisible(pct > 0 && this.alive)
    this.healthBarBg.setVisible(this.alive)
  }

  getBarrelTip(): { x: number; y: number } {
    const rot = this.turret.rotation
    const lx = Math.cos(rot - Math.PI / 2) * 12
    const ly = Math.sin(rot - Math.PI / 2) * 12
    return { x: this.turret.x + lx, y: this.turret.y + ly }
  }

  update(scene: Phaser.Scene, playerX: number, playerY: number) {
    const angle = Phaser.Math.Angle.Between(this.base.x, this.base.y, this.targetX, this.targetY)
    const dist = Phaser.Math.Distance.Between(this.base.x, this.base.y, this.targetX, this.targetY)
    if (dist < 4) {
      this.targetX = Phaser.Math.Between(30, 290)
      this.targetY = Phaser.Math.Between(30, 200)
    } else {
      this.base.x += Math.cos(angle) * this.speed
      this.base.y += Math.sin(angle) * this.speed
      this.turret.x = this.base.x
      this.turret.y = this.base.y
    }
    const turretAngle = Phaser.Math.Angle.Between(this.turret.x, this.turret.y, playerX, playerY)
    this.turret.rotation = Phaser.Math.Angle.RotateTo(this.turret.rotation, turretAngle + Math.PI / 2, 0.12)

    this.updateHealthBar()
    this.tryFire(scene, playerX, playerY)
  }

  private tryFire(scene: Phaser.Scene, playerX: number, playerY: number) {
    if (!this.alive) return
    if (this.isWindingUp) return
    const gameAny: any = scene as any
    if (gameAny.isGameOver) return
    const now = scene.time.now
    if (now < this.nextFireTime) return
    if (typeof gameAny.canEnemyFire === 'function' && !gameAny.canEnemyFire(now)) return
    // Aim gate — Bruiser turret is slower, allow wider cone so it can still fire but with telegraph
    const desired = Phaser.Math.Angle.Between(this.turret.x, this.turret.y, playerX, playerY) + Math.PI / 2
    const diff = Phaser.Math.Angle.Wrap(this.turret.rotation - desired)
    if (Math.abs(diff) > 0.55) return
    const dist = Phaser.Math.Distance.Between(this.turret.x, this.turret.y, playerX, playerY)
    if (dist < 18) return

    if (typeof gameAny.notifyEnemyFired === 'function') gameAny.notifyEnemyFired(now)
    const jitter = Phaser.Math.Between(-260, 260)
    this.nextFireTime = now + this.fireInterval + jitter
    this.isWindingUp = true

    this.base.setTint(0xffffff)
    this.turret.setTint(0xffffff)
    scene.tweens.add({ targets: [this.base, this.turret], scale: 0.92, duration: 120, yoyo: true, ease: 'Quad.easeOut' })
    const marker = scene.add.rectangle(this.base.x, this.base.y - 18, 5, 5, 0xffff66)
    marker.setDepth(13)
    marker.setAlpha(0.9)
    const syncMarker = scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (!marker.active) { syncMarker.remove(); return }
        if (!this.base.active) { marker.destroy(); syncMarker.remove(); return }
        marker.setPosition(this.base.x, this.base.y - 18)
      },
    })
    scene.time.delayedCall(320, () => {
      syncMarker.remove()
      marker.destroy()
      this.isWindingUp = false
      if (!this.alive || !this.base.active) {
        if (this.base.active) { this.base.clearTint(); this.base.setTint(this.tintColor) }
        if (this.turret.active) { this.turret.clearTint(); this.turret.setTint(this.tintColor) }
        return
      }
      if (gameAny.isGameOver) {
        this.base.clearTint(); this.turret.clearTint()
        if (this.alive) { this.base.setTint(this.tintColor); this.turret.setTint(this.tintColor) }
        return
      }
      this.base.clearTint(); this.turret.clearTint()
      this.base.setTint(this.tintColor); this.turret.setTint(this.tintColor)
      this.fire(scene, playerX, playerY)
    })
  }

  private fire(scene: Phaser.Scene, playerX: number, playerY: number) {
    const tip = this.getBarrelTip()
    const audio: any = (scene as any).audio
    if (audio) audio.playSfx('sfx_fire_bruiser', { volume: 0.55 })
    const flash = scene.add.image(tip.x, tip.y, 'muzzle_1')
    flash.setScale(0.55)
    flash.setDepth(14)
    flash.setRotation(this.turret.rotation)
    scene.time.delayedCall(70, () => flash.destroy())
    const shell = scene.add.image(tip.x, tip.y, 'shell')
    shell.setScale(0.6)
    shell.setDepth(12)
    const destX = playerX
    const destY = playerY
    // Extended border target: ray from tip through player to screen edge
    const w = (scene.scale as any)?.width ?? 320
    const h = (scene.scale as any)?.height ?? 240
    const dx = destX - tip.x
    const dy = destY - tip.y
    let borderX = destX
    let borderY = destY
    if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
      let bestT = Infinity
      if (Math.abs(dx) > 0.001) {
        const t1 = (0 - tip.x) / dx
        const t2 = (w - tip.x) / dx
        if (t1 > 0.001) {
          const y = tip.y + t1 * dy
          if (y >= 0 && y <= h && t1 < bestT) bestT = t1
        }
        if (t2 > 0.001) {
          const y = tip.y + t2 * dy
          if (y >= 0 && y <= h && t2 < bestT) bestT = t2
        }
      }
      if (Math.abs(dy) > 0.001) {
        const t3 = (0 - tip.y) / dy
        const t4 = (h - tip.y) / dy
        if (t3 > 0.001) {
          const x = tip.x + t3 * dx
          if (x >= 0 && x <= w && t3 < bestT) bestT = t3
        }
        if (t4 > 0.001) {
          const x = tip.x + t4 * dx
          if (x >= 0 && x <= w && t4 < bestT) bestT = t4
        }
      }
      if (bestT !== Infinity) {
        borderX = tip.x + bestT * dx
        borderY = tip.y + bestT * dy
        borderX = Phaser.Math.Clamp(borderX, 0, w)
        borderY = Phaser.Math.Clamp(borderY, 0, h)
      }
    }
    const trailEv = scene.time.addEvent({
      delay: 18,
      loop: true,
      callback: () => {
        if (!shell.active) { trailEv.remove(); return }
        const t = scene.add.image(shell.x, shell.y, 'shell')
        t.setScale(0.24)
        t.setAlpha(0.6)
        t.setDepth(11)
        scene.tweens.add({ targets: t, alpha: 0, scale: 0.14, duration: 170, onComplete: () => t.destroy() })
      },
    })
    const baseDuration = 420
    // First leg: tip -> predicted player pos. Bullets only stop on hit; on miss they continue to border edge (raycast to 0,width,0,height).
    // Shell is not destroyed early — persists until final destination.
    scene.tweens.add({
      targets: shell,
      x: destX,
      y: destY,
      duration: baseDuration,
      ease: 'Linear',
      onComplete: () => {
        const gameAny: any = scene as any
        const now = scene.time.now
        // Invulnerability: shield puff at player, stop at player (blocked hit)
        if (typeof gameAny.isPlayerInvulnerable === 'function' && gameAny.isPlayerInvulnerable(now) && !gameAny.isGameOver && !gameAny.gameOverShown) {
          shell.destroy()
          trailEv.remove()
          const puff = scene.add.image(destX, destY, 'explosion_small_1')
          puff.setScale(0.55)
          puff.setAlpha(0.45)
          puff.setTint(0x8ecfff)
          puff.setDepth(13)
          scene.tweens.add({ targets: puff, scale: 0.9, alpha: 0, duration: 180, onComplete: () => puff.destroy() })
          return
        }
        // If Game Over already triggered, continue to border instead of vanishing early at dest
        if (gameAny.isGameOver || gameAny.gameOverShown) {
          const remaining = Phaser.Math.Distance.Between(destX, destY, borderX, borderY)
          const distToPlayer = Phaser.Math.Distance.Between(tip.x, tip.y, destX, destY)
          const speed = distToPlayer > 1 ? distToPlayer / baseDuration : 1
          let extraDuration = speed > 0 ? Math.round(remaining / speed) : 260
          extraDuration = Phaser.Math.Clamp(extraDuration, 80, 800)
          scene.tweens.add({
            targets: shell,
            x: borderX,
            y: borderY,
            duration: extraDuration,
            ease: 'Linear',
            onComplete: () => {
              shell.destroy()
              trailEv.remove()
              const miss = scene.add.image(borderX, borderY, 'explosion_small_1')
              miss.setScale(0.5)
              miss.setAlpha(0.35)
              miss.setTint(0xaaaaaa)
              miss.setDepth(13)
              scene.tweens.add({ targets: miss, scale: 0.85, alpha: 0, duration: 160, onComplete: () => miss.destroy() })
              if (audio) audio.playSfx('sfx_explosion_small', { volume: 0.22 })
            },
          })
          return
        }
        const pb = gameAny.playerBase as Phaser.GameObjects.Image | undefined
        if (pb && pb.active) {
          const actualDist = Phaser.Math.Distance.Between(destX, destY, pb.x, pb.y)
          if (actualDist > 38) {
            // Miss — continue to border edge with proper duration, not disappearing at player
            const remaining = Phaser.Math.Distance.Between(destX, destY, borderX, borderY)
            const distToPlayer = Phaser.Math.Distance.Between(tip.x, tip.y, destX, destY)
            const speed = distToPlayer > 1 ? distToPlayer / baseDuration : 1
            let extraDuration = speed > 0 ? Math.round(remaining / speed) : 260
            extraDuration = Phaser.Math.Clamp(extraDuration, 80, 800)
            // Shell not destroyed early — second leg to border
            scene.tweens.add({
              targets: shell,
              x: borderX,
              y: borderY,
              duration: extraDuration,
              ease: 'Linear',
              onComplete: () => {
                shell.destroy()
                trailEv.remove()
                const miss = scene.add.image(borderX, borderY, 'explosion_small_1')
                miss.setScale(0.5)
                miss.setAlpha(0.35)
                miss.setTint(0xaaaaaa)
                miss.setDepth(13)
                scene.tweens.add({ targets: miss, scale: 0.85, alpha: 0, duration: 160, onComplete: () => miss.destroy() })
                if (audio) audio.playSfx('sfx_explosion_small', { volume: 0.22 })
              },
            })
            return
          }
        }
        // Hit — stop at player
        shell.destroy()
        trailEv.remove()
        if (audio) audio.playSfx('sfx_explosion_small', { volume: 0.45 })
        scene.cameras.main.shake(80, 0.005)
        const exp = scene.add.image(destX, destY, 'explosion_small_1')
        exp.setScale(0.95)
        exp.setDepth(13)
        scene.tweens.add({ targets: exp, scale: 1.35, alpha: 0, duration: 210, onComplete: () => exp.destroy() })
        const pt = gameAny.playerTurret as Phaser.GameObjects.Image | undefined
        if (pb && pb.active) { pb.setTint(0xffffff); scene.time.delayedCall(60, () => { if (pb.active) pb.clearTint() }) }
        if (pt && pt.active) { pt.setTint(0xffffff); scene.time.delayedCall(60, () => { if (pt.active) pt.clearTint() }) }
        if (typeof gameAny.onEnemyShellHitPlayer === 'function' && !gameAny.isGameOver && !gameAny.gameOverShown) {
          gameAny.onEnemyShellHitPlayer(1)
        }
      },
    })
  }

  hit(scene: Phaser.Scene): boolean {
    if (!this.alive) return false
    this.hits -= 1
    if (this.hits <= 0) {
      this.alive = false
      if (this.healthBarBg) this.healthBarBg.setVisible(false)
      if (this.healthBarFill) this.healthBarFill.setVisible(false)
      this.playBigExplosion(scene)
      return true
    } else {
      this.base.setTint(0xffffff); this.turret.setTint(0xffffff)
      scene.time.delayedCall(100, () => {
        if (this.alive && this.base.active) { this.base.clearTint(); this.base.setTint(this.tintColor) }
        if (this.alive && this.turret.active) { this.turret.clearTint(); this.turret.setTint(this.tintColor) }
      })
      scene.cameras.main.shake(140, 0.007)
      const audio: any = (scene as any).audio
      if (audio) audio.playSfx('sfx_explosion_small', { volume: 0.7 })
      const exp = scene.add.image(this.base.x, this.base.y, 'explosion_small_1')
      exp.setScale(1.05); exp.setDepth(14)
      scene.tweens.add({ targets: exp, scale: 1.55, alpha: 0, duration: 230, onComplete: () => exp.destroy() })
      this.updateHealthBar()
      return false
    }
  }

  private playBigExplosion(scene: Phaser.Scene) {
    const audio: any = (scene as any).audio
    if (audio) audio.playSfx('sfx_explosion_big', { volume: 0.9 })
    scene.cameras.main.shake(240, 0.018)
    scene.cameras.main.flash(180, 255, 225, 95)
    const scale = Phaser.Math.FloatBetween(1.5, 2.0)
    const key = scene.textures.exists('explosion_big_1') ? 'explosion_big_1' : 'explosion_small_1'
    const exp = scene.add.image(this.base.x, this.base.y, key)
    exp.setScale(scale); exp.setDepth(15)
    let frame = 1
    const cycle = scene.time.addEvent({
      delay: 60,
      loop: true,
      callback: () => {
        frame++
        if (frame > 6) { cycle.remove(); return }
        const k = `explosion_big_${frame}`
        if (scene.textures.exists(k)) exp.setTexture(k)
        exp.setScale(scale + frame * 0.04)
      },
    })
    scene.tweens.add({ targets: exp, alpha: 0, duration: 460, delay: 260, onComplete: () => { exp.destroy(); cycle.remove() } })
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.25, 0.25)
      const dist = 12 + Phaser.Math.Between(5, 16)
      const px = this.base.x + Math.cos(angle) * dist
      const py = this.base.y + Math.sin(angle) * dist
      const col = i % 2 === 0 ? 0xffd94f : 0xff6b35
      const part = scene.add.rectangle(this.base.x, this.base.y, 3, 3, col)
      part.setStrokeStyle(1, 0x1a1a1a); part.setDepth(14)
      scene.tweens.add({ targets: part, x: px, y: py, alpha: 0, duration: 340, ease: 'Quad.easeOut', onComplete: () => part.destroy() })
    }
    scene.tweens.add({ targets: [this.base, this.turret], alpha: 0, duration: 110 })
  }

  respawn(scene: Phaser.Scene, x: number, y: number, betAmount = 10, maxBet = 100) {
    this.base.setPosition(x, y); this.turret.setPosition(x, y)
    this.base.setAlpha(1); this.turret.setAlpha(1)
    this.base.setScale(0.85); this.turret.setScale(0.85)
    this.base.clearTint(); this.turret.clearTint()
    this.base.setTint(this.tintColor); this.turret.setTint(this.tintColor)
    const wagerFactor = 1 + (betAmount / maxBet) * 1.5
    this.maxHits = Math.ceil(wagerFactor * this.baseHP)
    this.hits = this.maxHits
    this.alive = true
    this.isWindingUp = false
    if (this.healthBarBg) { this.healthBarBg.setVisible(true); this.healthBarBg.setPosition(x, y - 16) }
    if (this.healthBarFill) { this.healthBarFill.setVisible(true); this.healthBarFill.setPosition(x - 12, y - 16); (this.healthBarFill as any).width = 24 }
    this.nextFireTime = scene.time.now + this.fireInterval + Phaser.Math.Between(400, 900)
    this.targetX = Phaser.Math.Between(30, 290)
    this.targetY = Phaser.Math.Between(30, 200)
    this.base.setScale(0.3); this.turret.setScale(0.3)
    this.base.setAlpha(0); this.turret.setAlpha(0)
    scene.tweens.add({
      targets: [this.base, this.turret],
      alpha: 1, scale: 0.85, duration: 240, ease: 'Back.easeOut',
      onComplete: () => { this.base.clearTint(); this.turret.clearTint(); this.base.setTint(this.tintColor); this.turret.setTint(this.tintColor) },
    })
    this.updateHealthBar()
  }

  destroy() { this.healthBarBg?.destroy(); this.healthBarFill?.destroy(); this.base.destroy(); this.turret.destroy() }
}
