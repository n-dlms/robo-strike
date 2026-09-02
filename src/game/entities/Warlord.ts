import Phaser from 'phaser'

export class Warlord {
  base: Phaser.GameObjects.Image
  turret: Phaser.GameObjects.Image
  targetX: number
  targetY: number
  private speed: number

  readonly baseHP = 4
  readonly barColor = 0x58ff9b
  readonly tintColor = 0x58ff9b
  maxHits: number = 4
  hits: number = 4
  alive: boolean = true
  private healthBarBg?: Phaser.GameObjects.Rectangle
  private healthBarFill?: Phaser.GameObjects.Rectangle

  readonly fireInterval = 1500
  private nextFireTime = 0

  constructor(scene: Phaser.Scene, x: number, y: number, betAmount = 10, maxBet = 100) {
    const pt = { x, y }
    this.base = scene.add.image(pt.x, pt.y, 'enemy3_base').setScale(0.85)
    this.turret = scene.add.image(pt.x, pt.y, 'enemy3_turret').setScale(0.85).setOrigin(0.5, 0.7)
    this.base.setTint(this.tintColor)
    this.turret.setTint(this.tintColor)
    this.speed = Phaser.Math.FloatBetween(0.5, 0.85)
    this.targetX = Phaser.Math.Between(30, 290)
    this.targetY = Phaser.Math.Between(30, 200)
    this.pickNewTarget(scene)

    const wagerFactor = 1 + (betAmount / maxBet) * 1.5
    this.maxHits = Math.ceil(wagerFactor * this.baseHP)
    this.hits = this.maxHits
    this.alive = true
    this.createHealthBar(scene)
    this.nextFireTime = scene.time.now + this.fireInterval + Phaser.Math.Between(0, 500)
  }

  private pickNewTarget(scene: Phaser.Scene) {
    this.targetX = Phaser.Math.Between(30, 290)
    this.targetY = Phaser.Math.Between(30, 200)
    scene.time.delayedCall(Phaser.Math.Between(1400, 2100), () => {
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
    this.turret.rotation = turretAngle + Math.PI / 2 // instant, no lerp hesitation

    this.updateHealthBar()
    this.tryFire(scene, playerX, playerY)
  }

  private tryFire(scene: Phaser.Scene, playerX: number, playerY: number) {
    if (!this.alive) return
    const now = scene.time.now
    if (now < this.nextFireTime) return
    const jitter = Phaser.Math.Between(-250, 250)
    this.nextFireTime = now + this.fireInterval + jitter
    this.fire(scene, playerX, playerY)
  }

  private fire(scene: Phaser.Scene, playerX: number, playerY: number) {
    const tip = this.getBarrelTip()
    const audio: any = (scene as any).audio
    if (audio) audio.playSfx('sfx_fire', { volume: 0.6 })
    const flash = scene.add.image(tip.x, tip.y, 'muzzle_1')
    flash.setScale(0.6)
    flash.setDepth(14)
    flash.setRotation(this.turret.rotation)
    scene.time.delayedCall(75, () => flash.destroy())
    const shell = scene.add.image(tip.x, tip.y, 'shell')
    shell.setScale(0.62)
    shell.setDepth(12)
    const trailEv = scene.time.addEvent({
      delay: 20,
      loop: true,
      callback: () => {
        if (!shell.active) { trailEv.remove(); return }
        const t = scene.add.image(shell.x, shell.y, 'shell')
        t.setScale(0.26)
        t.setAlpha(0.65)
        t.setDepth(11)
        scene.tweens.add({ targets: t, alpha: 0, scale: 0.16, duration: 180, onComplete: () => t.destroy() })
      },
    })
    scene.tweens.add({
      targets: shell,
      x: playerX,
      y: playerY,
      duration: 480,
      ease: 'Linear',
      onComplete: () => {
        shell.destroy()
        trailEv.remove()
        if (audio) audio.playSfx('sfx_explosion_small', { volume: 0.5 })
        scene.cameras.main.shake(90, 0.006)
        const exp = scene.add.image(playerX, playerY, 'explosion_small_1')
        exp.setScale(1.0)
        exp.setDepth(13)
        scene.tweens.add({ targets: exp, scale: 1.4, alpha: 0, duration: 220, onComplete: () => exp.destroy() })
        const pb = (scene as any).playerBase as Phaser.GameObjects.Image | undefined
        const pt = (scene as any).playerTurret as Phaser.GameObjects.Image | undefined
        if (pb && pb.active) { pb.setTint(0xffffff); scene.time.delayedCall(70, () => { if (pb.active) pb.clearTint() }) }
        if (pt && pt.active) { pt.setTint(0xffffff); scene.time.delayedCall(70, () => { if (pt.active) pt.clearTint() }) }
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
      scene.time.delayedCall(60, () => {
        if (this.alive && this.base.active) { this.base.clearTint(); this.base.setTint(this.tintColor) }
        if (this.alive && this.turret.active) { this.turret.clearTint(); this.turret.setTint(this.tintColor) }
      })
      scene.cameras.main.shake(160, 0.009)
      const audio: any = (scene as any).audio
      if (audio) audio.playSfx('sfx_explosion_small', { volume: 0.75 })
      const exp = scene.add.image(this.base.x, this.base.y, 'explosion_small_1')
      exp.setScale(1.1); exp.setDepth(14)
      scene.tweens.add({ targets: exp, scale: 1.6, alpha: 0, duration: 240, onComplete: () => exp.destroy() })
      this.updateHealthBar()
      return false
    }
  }

  private playBigExplosion(scene: Phaser.Scene) {
    const audio: any = (scene as any).audio
    if (audio) audio.playSfx('sfx_explosion_big', { volume: 0.95 })
    scene.cameras.main.shake(260, 0.02)
    scene.cameras.main.flash(200, 255, 230, 100)
    const scale = Phaser.Math.FloatBetween(1.5, 2.0)
    const key = scene.textures.exists('explosion_big_1') ? 'explosion_big_1' : 'explosion_small_1'
    const exp = scene.add.image(this.base.x, this.base.y, key)
    exp.setScale(scale); exp.setDepth(15)
    let frame = 1
    const cycle = scene.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        frame++
        if (frame > 6) { cycle.remove(); return }
        const k = `explosion_big_${frame}`
        if (scene.textures.exists(k)) exp.setTexture(k)
        exp.setScale(scale + frame * 0.06)
      },
    })
    scene.tweens.add({ targets: exp, alpha: 0, duration: 480, delay: 280, onComplete: () => { exp.destroy(); cycle.remove() } })
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.3, 0.3)
      const dist = 14 + Phaser.Math.Between(6, 18)
      const px = this.base.x + Math.cos(angle) * dist
      const py = this.base.y + Math.sin(angle) * dist
      const col = i % 2 === 0 ? 0x58ff9b : 0xff4f4f
      const part = scene.add.rectangle(this.base.x, this.base.y, 4, 4, col)
      part.setStrokeStyle(1, 0x1a1a1a); part.setDepth(14)
      scene.tweens.add({ targets: part, x: px, y: py, alpha: 0, duration: 360, ease: 'Quad.easeOut', onComplete: () => part.destroy() })
    }
    scene.tweens.add({ targets: [this.base, this.turret], alpha: 0, duration: 120 })
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
    if (this.healthBarBg) { this.healthBarBg.setVisible(true); this.healthBarBg.setPosition(x, y - 16) }
    if (this.healthBarFill) { this.healthBarFill.setVisible(true); this.healthBarFill.setPosition(x - 12, y - 16); (this.healthBarFill as any).width = 24 }
    this.nextFireTime = scene.time.now + this.fireInterval + Phaser.Math.Between(150, 600)
    this.targetX = Phaser.Math.Between(30, 290)
    this.targetY = Phaser.Math.Between(30, 200)
    this.base.setScale(0.3); this.turret.setScale(0.3)
    this.base.setAlpha(0); this.turret.setAlpha(0)
    scene.tweens.add({
      targets: [this.base, this.turret],
      alpha: 1, scale: 0.85, duration: 260, ease: 'Back.easeOut',
      onComplete: () => { this.base.clearTint(); this.turret.clearTint(); this.base.setTint(this.tintColor); this.turret.setTint(this.tintColor) },
    })
    this.updateHealthBar()
  }

  destroy() { this.healthBarBg?.destroy(); this.healthBarFill?.destroy(); this.base.destroy(); this.turret.destroy() }
}
