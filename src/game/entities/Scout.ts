import Phaser from 'phaser'

export class Scout {
  base: Phaser.GameObjects.Image
  turret: Phaser.GameObjects.Image
  targetX: number
  targetY: number
  private speed: number

  // Bet-scaled health.
  readonly baseHP = 2
  readonly barColor = 0x4ff2e3
  readonly tintColor = 0x4ff2e3
  maxHits: number = 2
  hits: number = 2
  alive: boolean = true
  private healthBarBg?: Phaser.GameObjects.Rectangle
  private healthBarFill?: Phaser.GameObjects.Rectangle
  private healthBarBorder?: Phaser.GameObjects.Rectangle

  // Fire cadence.
  readonly baseScale = 1
  readonly fireInterval = 1800
  private nextFireTime = 0
  private isWindingUp = false

  constructor(scene: Phaser.Scene, x: number, y: number, betAmount = 10, maxBet = 100) {
    const pt = { x, y }
    this.base = scene.add.image(pt.x, pt.y, 'enemy1_base').setScale(this.baseScale)
    this.turret = scene.add.image(pt.x, pt.y, 'enemy1_turret').setScale(this.baseScale).setOrigin(0.5, 0.7)
    this.base.setTint(this.tintColor)
    this.turret.setTint(this.tintColor)
    // Scout: fastest, jittery, small
    this.speed = Phaser.Math.FloatBetween(0.7, 1.1)
    this.targetX = Phaser.Math.Between(30, 290)
    this.targetY = Phaser.Math.Between(30, 200)
    this.pickNewTarget(scene)

    const wagerFactor = 1 + (betAmount / maxBet) * 1.5
    this.maxHits = Math.ceil(wagerFactor * this.baseHP)
    this.hits = this.maxHits
    this.alive = true
    this.createHealthBar(scene)
    this.nextFireTime = scene.time.now + this.fireInterval + Phaser.Math.Between(350, 700)
  }

  private pickNewTarget(scene: Phaser.Scene) {
    this.targetX = Phaser.Math.Between(30, 290)
    this.targetY = Phaser.Math.Between(30, 200)
    // Scout retargets often (every 1.2-1.8s).
    scene.time.delayedCall(Phaser.Math.Between(1200, 1800), () => {
      // Skip if the scene is gone.
      if (!(scene.scene.isActive())) return
      if (!this.base.active) return
      this.pickNewTarget(scene)
    })
  }

  private createHealthBar(scene: Phaser.Scene) {
    const x = this.base.x
    const y = this.base.y - 16
    // 24x3 bar with 1px outline.
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
    // 12px barrel from the turret pivot.
    const lx = Math.cos(rot - Math.PI / 2) * 12
    const ly = Math.sin(rot - Math.PI / 2) * 12
    return { x: this.turret.x + lx, y: this.turret.y + ly }
  }

  update(scene: Phaser.Scene, playerX: number, playerY: number) {
    // Dead bots do not move, aim, or push.
    if (!this.alive) return
    // Move toward the target.
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
    // Track the player.
    const turretAngle = Phaser.Math.Angle.Between(this.turret.x, this.turret.y, playerX, playerY)
    this.turret.rotation = Phaser.Math.Angle.RotateTo(this.turret.rotation, turretAngle + Math.PI / 2, 0.24)

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
    // Global guard: one bot winds up at a time.
    if (typeof gameAny.canEnemyFire === 'function' && !gameAny.canEnemyFire(now)) return
    // Fire only when roughly facing the player.
    const desired = Phaser.Math.Angle.Between(this.turret.x, this.turret.y, playerX, playerY) + Math.PI / 2
    const diff = Phaser.Math.Angle.Wrap(this.turret.rotation - desired)
    if (Math.abs(diff) > 0.45) return
    // Reject point-blank shots only.
    const dist = Phaser.Math.Distance.Between(this.turret.x, this.turret.y, playerX, playerY)
    if (dist < 18) return

    // Claim the global slot so other bots stagger.
    if (typeof gameAny.notifyEnemyFired === 'function') gameAny.notifyEnemyFired(now)
    // Schedule the next attempt with jitter.
    const jitter = Phaser.Math.Between(-220, 220)
    this.nextFireTime = now + this.fireInterval + jitter
    this.isWindingUp = true

    // Telegraph: 280ms windup.
    this.base.setTint(0xffffff)
    this.turret.setTint(0xffffff)
    scene.tweens.add({ targets: [this.base, this.turret], scale: this.baseScale * 0.92, duration: 110, yoyo: true, ease: 'Quad.easeOut' })
    const marker = scene.add.rectangle(this.base.x, this.base.y - 18, 4, 4, 0xffff66)
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
    scene.time.delayedCall(280, () => {
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
      // Re-check before firing.
      this.fire(scene, playerX, playerY)
    })
  }

  private fire(scene: Phaser.Scene, playerX: number, playerY: number) {
    const tip = this.getBarrelTip()
    const audio: any = (scene as any).audio
    if (audio) audio.playSfx('sfx_fire_scout', { volume: 0.55 })
    else if (scene.sound && (scene as any).cache?.audio?.exists?.('sfx_fire_scout')) scene.sound.play('sfx_fire_scout', { volume: 0.55 } as any)

    const flash = scene.add.image(tip.x, tip.y, 'muzzle_1')
    flash.setScale(0.5)
    flash.setDepth(14)
    flash.setRotation(this.turret.rotation)
    scene.time.delayedCall(70, () => flash.destroy())

    const shell = scene.add.image(tip.x, tip.y, 'shell')
    shell.setScale(0.55)
    shell.setDepth(12)

    // Predicted impact point.
    const destX = playerX
    const destY = playerY

    // Extended border target: ray from tip through player to screen edge.
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

    // Shell trail.
    const trailEv = scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (!shell.active) {
          trailEv.remove()
          return
        }
        const t = scene.add.image(shell.x, shell.y, 'shell')
        t.setScale(0.22)
        t.setAlpha(0.55)
        t.setDepth(11)
        scene.tweens.add({
          targets: t,
          alpha: 0,
          scale: 0.12,
          duration: 160,
          onComplete: () => t.destroy(),
        })
      },
    })

    const baseDuration = 360
    // First leg: tip to predicted player pos. Misses continue to the border.
    scene.tweens.add({
      targets: shell,
      x: destX,
      y: destY,
      duration: baseDuration,
      ease: 'Linear',
      onComplete: () => {
        const gameAny: any = scene as any
        const now = scene.time.now
        // I-framed player: shield puff, no damage.
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
        // Game Over: shells finish their flight to the border.
        if (gameAny.isGameOver || gameAny.gameOverShown) {
          const remaining = Phaser.Math.Distance.Between(destX, destY, borderX, borderY)
          const distToPlayer = Phaser.Math.Distance.Between(tip.x, tip.y, destX, destY)
          const speed = distToPlayer > 1 ? distToPlayer / baseDuration : 1
          let extraDuration = speed > 0 ? Math.round(remaining / speed) : 240
          extraDuration = Phaser.Math.Clamp(extraDuration, 80, 700)
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
        // Dodge check: player moved clear, continue to the border.
        const pb = gameAny.playerBase as Phaser.GameObjects.Image | undefined
        if (pb && pb.active) {
          const actualDist = Phaser.Math.Distance.Between(destX, destY, pb.x, pb.y)
          if (actualDist > 38) {
            const remaining = Phaser.Math.Distance.Between(destX, destY, borderX, borderY)
            const distToPlayer = Phaser.Math.Distance.Between(tip.x, tip.y, destX, destY)
            const speed = distToPlayer > 1 ? distToPlayer / baseDuration : 1
            let extraDuration = speed > 0 ? Math.round(remaining / speed) : 240
            extraDuration = Phaser.Math.Clamp(extraDuration, 80, 700)
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
        // Hit: full effects at the player.
        shell.destroy()
        trailEv.remove()
        if (audio) audio.playSfx('sfx_explosion_small', { volume: 0.45 })
        scene.cameras.main.shake(70, 0.004)
        const exp = scene.add.image(destX, destY, 'explosion_small_1')
        exp.setScale(0.9)
        exp.setDepth(13)
        scene.tweens.add({ targets: exp, scale: 1.3, alpha: 0, duration: 200, onComplete: () => exp.destroy() })
        const pt = gameAny.playerTurret as Phaser.GameObjects.Image | undefined
        if (pb && pb.active) {
          pb.setTint(0xffffff)
          scene.time.delayedCall(60, () => { if (pb.active) pb.clearTint() })
        }
        if (pt && pt.active) {
          pt.setTint(0xffffff)
          scene.time.delayedCall(60, () => { if (pt.active) pt.clearTint() })
        }
        // Notify the scene. Guards in onEnemyShellHitPlayer keep Game Over to once.
        if (typeof gameAny.onEnemyShellHitPlayer === 'function' && !gameAny.isGameOver && !gameAny.gameOverShown) {
          gameAny.onEnemyShellHitPlayer(1)
        }
      },
    })
  }

  /** Returns true on kill. */
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
      this.base.setTint(0xffffff)
      this.turret.setTint(0xffffff)
      scene.time.delayedCall(80, () => {
        if (this.alive && this.base.active) { this.base.clearTint(); this.base.setTint(this.tintColor) }
        if (this.alive && this.turret.active) { this.turret.clearTint(); this.turret.setTint(this.tintColor) }
      })
      scene.cameras.main.shake(100, 0.005)
      const audio: any = (scene as any).audio
      if (audio) audio.playSfx('sfx_explosion_small', { volume: 0.55 })
      const exp = scene.add.image(this.base.x, this.base.y, 'explosion_small_1')
      exp.setScale(1.0)
      exp.setDepth(14)
      scene.tweens.add({ targets: exp, scale: 1.5, alpha: 0, duration: 220, onComplete: () => exp.destroy() })
      this.updateHealthBar()
      return false
    }
  }

  private playBigExplosion(scene: Phaser.Scene) {
    const audio: any = (scene as any).audio
    if (audio) audio.playSfx('sfx_explosion_big', { volume: 0.9 })
    else if (scene.sound) scene.sound.play('sfx_explosion_big', { volume: 0.9 } as any)
    scene.cameras.main.shake(220, 0.016)
    scene.cameras.main.flash(160, 255, 220, 90)
    const scale = Phaser.Math.FloatBetween(1.5, 2.0)
    const key = scene.textures.exists('explosion_big_1') ? 'explosion_big_1' : 'explosion_small_1'
    const exp = scene.add.image(this.base.x, this.base.y, key)
    exp.setScale(scale)
    exp.setDepth(15)
    let frame = 1
    const cycle = scene.time.addEvent({
      delay: 55,
      loop: true,
      callback: () => {
        frame++
        if (frame > 6) { cycle.remove(); return }
        const k = `explosion_big_${frame}`
        if (scene.textures.exists(k)) exp.setTexture(k)
        exp.setScale(scale + frame * 0.05)
      },
    })
    scene.tweens.add({
      targets: exp,
      alpha: 0,
      duration: 420,
      delay: 240,
      onComplete: () => { exp.destroy(); cycle.remove() },
    })
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.2, 0.2)
      const dist = 10 + Phaser.Math.Between(4, 14)
      const px = this.base.x + Math.cos(angle) * dist
      const py = this.base.y + Math.sin(angle) * dist
      const col = i % 2 === 0 ? 0xffd94f : 0xff4f4f
      const part = scene.add.rectangle(this.base.x, this.base.y, 3, 3, col)
      part.setStrokeStyle(1, 0x1a1a1a)
      part.setDepth(14)
      scene.tweens.add({
        targets: part,
        x: px,
        y: py,
        alpha: 0,
        duration: 320,
        ease: 'Quad.easeOut',
        onComplete: () => part.destroy(),
      })
    }
    scene.tweens.add({ targets: [this.base, this.turret], alpha: 0, duration: 100 })
  }

  respawn(scene: Phaser.Scene, x: number, y: number, betAmount = 10, maxBet = 100) {
    this.base.setPosition(x, y)
    this.turret.setPosition(x, y)
    this.base.setAlpha(1)
    this.turret.setAlpha(1)
    this.base.setScale(this.baseScale); this.turret.setScale(this.baseScale)
    this.base.clearTint(); this.turret.clearTint()
    this.base.setTint(this.tintColor); this.turret.setTint(this.tintColor)
    const wagerFactor = 1 + (betAmount / maxBet) * 1.5
    this.maxHits = Math.ceil(wagerFactor * this.baseHP)
    this.hits = this.maxHits
    this.alive = true
    this.isWindingUp = false
    if (this.healthBarBg) { this.healthBarBg.setVisible(true); this.healthBarBg.setPosition(x, y - 16) }
    if (this.healthBarFill) { this.healthBarFill.setVisible(true); this.healthBarFill.setPosition(x - 12, y - 16); (this.healthBarFill as any).width = 24 }
    this.nextFireTime = scene.time.now + this.fireInterval + Phaser.Math.Between(400, 800)
    this.targetX = Phaser.Math.Between(30, 290)
    this.targetY = Phaser.Math.Between(30, 200)
    // Fade in.
    this.base.setScale(0.3); this.turret.setScale(0.3)
    this.base.setAlpha(0); this.turret.setAlpha(0)
    scene.tweens.add({
      targets: [this.base, this.turret],
      alpha: 1,
      scale: this.baseScale,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => { this.base.clearTint(); this.turret.clearTint(); this.base.setTint(this.tintColor); this.turret.setTint(this.tintColor) },
    })
    this.updateHealthBar()
  }

  destroy() {
    this.healthBarBg?.destroy()
    this.healthBarFill?.destroy()
    this.base.destroy()
    this.turret.destroy()
  }
}
