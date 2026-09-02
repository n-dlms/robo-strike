import Phaser from 'phaser'

export class Warlord {
  base: Phaser.GameObjects.Image
  turret: Phaser.GameObjects.Image
  private targetX: number
  private targetY: number
  private speed: number
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const pt = { x, y }
    this.base = scene.add.image(pt.x, pt.y, 'enemy3_base').setScale(0.85)
    this.turret = scene.add.image(pt.x, pt.y, 'enemy3_turret').setScale(0.85).setOrigin(0.5, 0.7)
    this.base.setTint(0x58ff9b)
    this.turret.setTint(0x58ff9b)
    this.speed = Phaser.Math.FloatBetween(0.5, 0.85)
    this.targetX = Phaser.Math.Between(30, 290)
    this.targetY = Phaser.Math.Between(30, 200)
    this.pickNewTarget(scene)
  }
  private pickNewTarget(scene: Phaser.Scene) {
    this.targetX = Phaser.Math.Between(30, 290)
    this.targetY = Phaser.Math.Between(30, 200)
    scene.time.delayedCall(Phaser.Math.Between(1400, 2100), () => this.pickNewTarget(scene))
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
  }
  hit(scene: Phaser.Scene) {
    this.base.setTint(0xffffff); this.turret.setTint(0xffffff)
    scene.time.delayedCall(60, () => { this.base.clearTint(); this.turret.clearTint() })
    scene.cameras.main.shake(160, 0.009)
  }
  destroy() { this.base.destroy(); this.turret.destroy() }
}
