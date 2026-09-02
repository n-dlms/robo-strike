import Phaser from 'phaser'
import { PALETTE_HEX } from '../../config/palette'
import { AudioManager } from '../systems/AudioManager'

export class Game extends Phaser.Scene {
  private audio!: AudioManager
  private playerBase!: Phaser.GameObjects.Image
  private playerTurret!: Phaser.GameObjects.Image
  private enemyBases: Phaser.GameObjects.Image[] = []
  private enemyTurrets: Phaser.GameObjects.Image[] = []
  constructor() {
    super('Game')
  }

  create() {
    const { width, height } = this.scale
    this.audio = new AudioManager(this)
    this.audio.initMusic()

    const bg = this.add.image(width / 2, height / 2, 'bg_battlefield')
    bg.setDisplaySize(width, height)
    this.add.image(width / 2, height / 2, 'bg_starfield').setAlpha(0.25).setDisplaySize(width, height)

    this.add.rectangle(width / 2, height - 30, width, 2, 0x1a1a1a).setAlpha(0.5)

    this.playerBase = this.add.image(60, height - 70, 'player_base')
    this.playerBase.setScale(0.85)
    this.playerTurret = this.add.image(60, height - 70, 'player_turret')
    this.playerTurret.setScale(0.85)
    this.playerTurret.setOrigin(0.5, 0.7)

    const enemies = [
      { x: 64, y: 66, base: 'enemy1_base', turret: 'enemy1_turret', name: 'SCOUT', mult: '×30' },
      { x: 160, y: 66, base: 'enemy2_base', turret: 'enemy2_turret', name: 'BRUISER', mult: '×15' },
      { x: 256, y: 66, base: 'enemy3_base', turret: 'enemy3_turret', name: 'WARLORD', mult: '×11' },
    ]

    enemies.forEach((e, idx) => {
      this.add.image(e.x, e.y + 10, 'bunker_intact').setScale(0.9).setOrigin(0.5).setDepth(-1)
      const base = this.add.image(e.x, e.y, e.base)
      base.setScale(0.85)
      const turret = this.add.image(e.x, e.y, e.turret)
      turret.setScale(0.85)
      turret.setOrigin(0.5, 0.7)
      this.enemyBases.push(base)
      this.enemyTurrets.push(turret)
      base.setInteractive({ useHandCursor: true })
      turret.setInteractive({ useHandCursor: true })
      const pick = () => this.handlePick(idx)
      base.on('pointerdown', pick)
      turret.on('pointerdown', pick)

      this.add
        .text(Math.round(e.x), Math.round(e.y + 18), e.mult, {
          fontFamily: '"Press Start 2P"',
          fontSize: '8px',
          color: e.mult === '×30' ? PALETTE_HEX.yellow : PALETTE_HEX.white,
          stroke: PALETTE_HEX.outline,
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setResolution(2)

      this.add
        .text(Math.round(e.x), Math.round(e.y - 14), e.name, {
          fontFamily: '"VT323"',
          fontSize: '10px',
          color: PALETTE_HEX.white,
        })
        .setOrigin(0.5)
        .setResolution(2)
    })

    this.add
      .text(16, 16, 'BET 10', {
        fontFamily: '"VT323"',
        fontSize: '12px',
        color: PALETTE_HEX.yellow,
        backgroundColor: PALETTE_HEX.outline,
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0, 0.5)

    // Audio toggles during gameplay
    const gState = this.audio.getState()
    const gMusic = this.add
      .text(width - 36, 14, '♫', {
        fontFamily: '"VT323"',
        fontSize: '12px',
        color: PALETTE_HEX.green,
        backgroundColor: PALETTE_HEX.outline,
        padding: { x: 4, y: 1 },
      })
      .setOrigin(0.5)
      .setAlpha(gState.music ? 1 : 0.35)
      .setInteractive({ useHandCursor: true })
      .setDepth(20)
    const gSfx = this.add
      .text(width - 16, 14, '🔊', {
        fontFamily: '"VT323"',
        fontSize: '12px',
        color: PALETTE_HEX.green,
        backgroundColor: PALETTE_HEX.outline,
        padding: { x: 4, y: 1 },
      })
      .setOrigin(0.5)
      .setAlpha(gState.sfx ? 1 : 0.35)
      .setInteractive({ useHandCursor: true })
      .setDepth(20)
    gMusic.on('pointerdown', () => {
      const on = this.audio.toggleMusic()
      gMusic.setAlpha(on ? 1 : 0.35)
      this.audio.playSfx('sfx_ui_blip')
    })
    gSfx.on('pointerdown', () => {
      const on = this.audio.toggleSfx()
      gSfx.setAlpha(on ? 1 : 0.35)
      this.audio.playSfx('sfx_ui_blip')
    })
    this.input.keyboard?.on('keydown-M', () => {
      const on = this.audio.toggleMusic()
      gMusic.setAlpha(on ? 1 : 0.35)
    })
    this.input.keyboard?.on('keydown-S', () => {
      const on = this.audio.toggleSfx()
      gSfx.setAlpha(on ? 1 : 0.35)
    })

    const fireBtn = this.add
      .text(width / 2, height - 20, 'FIRE', {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: PALETTE_HEX.white,
        backgroundColor: '#c0392b',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    fireBtn.on('pointerdown', () => this.handleFire())

    this.input.keyboard?.on('keydown-SPACE', () => this.handleFire())
    this.input.keyboard?.on('keydown-ENTER', () => this.handleFire())

    this.add
      .text(width / 2, height - 5, '320×240 4:3 CRT • AI TANKS AIM • REAL ART + SOUNDS', {
        fontFamily: '"VT323"',
        fontSize: '8px',
        color: '#666',
      })
      .setOrigin(0.5)

    this.textures.get('__WHITE').setFilter(Phaser.Textures.FilterMode.NEAREST)
  }

  update() {
    // AI: enemy turrets aim at player
    if (!this.playerBase) return
    const px = this.playerBase.x
    const py = this.playerBase.y
    this.enemyTurrets.forEach((turret) => {
      const angle = Phaser.Math.Angle.Between(turret.x, turret.y, px, py)
      turret.rotation = angle + Math.PI / 2
    })
    // Player turret aims at closest enemy (or mouse if over). For demo, aim at center enemy
    if (this.enemyTurrets[1]) {
      const tx = this.enemyTurrets[1].x
      const ty = this.enemyTurrets[1].y
      const pAngle = Phaser.Math.Angle.Between(this.playerTurret.x, this.playerTurret.y, tx, ty)
      this.playerTurret.rotation = pAngle + Math.PI / 2
    }
  }

  private handlePick(index: number) {
    const labels = ['SCOUT', 'BRUISER', 'WARLORD']
    this.audio.playSfx('sfx_ui_blip')
    // Player turret snaps to picked enemy visually
    const target = this.enemyTurrets[index]
    const angle = Phaser.Math.Angle.Between(this.playerTurret.x, this.playerTurret.y, target.x, target.y)
    this.tweens.add({ targets: this.playerTurret, rotation: angle + Math.PI / 2, duration: 180, ease: 'Quad.easeOut' })
    const t = this.add.text(160, 100, `PICKED ${labels[index]}`, {
      fontFamily: '"VT323"',
      fontSize: '10px',
      color: '#fff',
    })
    t.setOrigin(0.5)
    this.tweens.add({ targets: t, alpha: 0, duration: 800, onComplete: () => t.destroy() })
  }

  private handleFire() {
    this.audio.playSfx('sfx_fire', { volume: 0.85 })
    this.audio.duckMusic()
    this.cameras.main.shake(120, 0.008)
    // Recoil on base+turret
    this.tweens.add({ targets: [this.playerBase, this.playerTurret], y: this.playerBase.y - 2, duration: 60, yoyo: true, ease: 'Quad.easeOut' })
    const flash = this.add.image(this.playerTurret.x, this.playerTurret.y - 10, 'muzzle_1')
    flash.setScale(0.7)
    this.time.delayedCall(80, () => flash.destroy())
    const shell = this.add.image(this.playerTurret.x, this.playerTurret.y - 8, 'shell')
    shell.setScale(0.6)
    // Aim shell at middle enemy for demo
    const target = this.enemyTurrets[1]
    this.tweens.add({
      targets: shell,
      x: target.x,
      y: target.y,
      duration: 300,
      onComplete: () => {
        shell.destroy()
        this.audio.playSfx('sfx_explosion_small', { volume: 0.8 })
        const exp = this.add.image(target.x, target.y, 'explosion_small_1')
        exp.setScale(1.2)
        this.tweens.add({ targets: exp, scale: 1.8, alpha: 0, duration: 260, onComplete: () => exp.destroy() })
        this.audio.playSfx('sfx_win', { volume: 0.6 })
        for (let c = 0; c < 3; c++) this.time.delayedCall(c * 80, () => this.audio.playSfx('sfx_coin_tick', { volume: 0.5 }))
      },
    })
  }
}
