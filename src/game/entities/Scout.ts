import Phaser from 'phaser'

export class Scout {
  base: Phaser.GameObjects.Image
  turret: Phaser.GameObjects.Image
  private targetX: number
  private targetY: number
  private speed: number
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const pt = { x, y }
    this.base = scene.add.image(pt.x, pt.y, 'enemy1_base').setScale(0.85)
    this.turret = scene.add.image(pt.x, pt.y, 'enemy1_turret').setScale(0.85).setOrigin(0.5, 0.7)
    this.base.setTint(0x4ff2e3)
    this.turret.setTint(0x4ff2e3)
    // Scout: fastest, jittery, small
    this.speed = Phaser.Math.FloatBetween(0.7, 1.1)
    this.targetX = Phaser.Math.Between(30, 290)
    this.targetY = Phaser.Math.Between(30, 200)
    this.pickNewTarget(scene)
  }
  private pickNewTarget(scene: Phaser.Scene) {
    this.targetX = Phaser.Math.Between(30, 290)
    this.targetY = Phaser.Math.Between(30, 200)
    // Scout picks new target often (every 1.2-1.8s)
    scene.time.delayedCall(Phaser.Math.Between(1200, 1800), () => this.pickNewTarget(scene))
  }
  update(scene: Phaser.Scene, playerX: number, playerY: number) {
    // Move toward target anywhere on free space
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
    // Aim at player without hesitation (fast)
    const turretAngle = Phaser.Math.Angle.Between(this.turret.x, this.turret.y, playerX, playerY)
    this.turret.rotation = Phaser.Math.Angle.RotateTo(this.turret.rotation, turretAngle + Math.PI / 2, 0.24)
  }
  hit(scene: Phaser.Scene) {
    this.base.setTint(0xffffff); this.turret.setTint(0xffffff)
    scene.time.delayedCall(80, () => { this.base.clearTint(); this.turret.clearTint() })
    scene.cameras.main.shake(100, 0.005)
  }
  destroy() { this.base.destroy(); this.turret.destroy() }
}
