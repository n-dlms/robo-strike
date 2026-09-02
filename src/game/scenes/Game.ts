import Phaser from 'phaser'
import { PALETTE_HEX } from '../../config/palette'
import { AudioManager } from '../systems/AudioManager'

export class Game extends Phaser.Scene {
  private audio!: AudioManager
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

    const player = this.add.image(60, height - 70, 'player_idle_1')
    player.setScale(0.85)
    player.setOrigin(0.5)
    player.texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
    player.setTint(0x4ff2e3)

    const enemies = [
      { x: 64, y: 66, key: 'enemy1_idle_1', name: 'SCOUT', mult: '×30' },
      { x: 160, y: 66, key: 'enemy2_idle_1', name: 'BRUISER', mult: '×15' },
      { x: 256, y: 66, key: 'enemy3_idle_1', name: 'WARLORD', mult: '×11' },
    ]

    enemies.forEach((e, idx) => {
      this.add.image(e.x, e.y + 10, 'bunker_intact').setScale(0.9).setOrigin(0.5).setDepth(-1)
      const tank = this.add.image(e.x, e.y, e.key)
      tank.setScale(0.85)
      tank.setOrigin(0.5)
      tank.texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
      tank.setInteractive({ useHandCursor: true })
      tank.on('pointerdown', () => this.handlePick(idx))

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

    fireBtn.on('pointerdown', () => this.handleFire(player))

    this.input.keyboard?.on('keydown-SPACE', () => this.handleFire(player))
    this.input.keyboard?.on('keydown-ENTER', () => this.handleFire(player))

    this.add
      .text(width / 2, height - 5, '320×240 4:3 CRT • REAL ART + SOUNDS', {
        fontFamily: '"VT323"',
        fontSize: '8px',
        color: '#666',
      })
      .setOrigin(0.5)

    this.textures.get('__WHITE').setFilter(Phaser.Textures.FilterMode.NEAREST)
  }

  private handlePick(index: number) {
    const labels = ['SCOUT', 'BRUISER', 'WARLORD']
    this.audio.playSfx('sfx_ui_blip')
    const t = this.add.text(160, 100, `PICKED ${labels[index]}`, {
      fontFamily: '"VT323"',
      fontSize: '10px',
      color: '#fff',
    })
    t.setOrigin(0.5)
    this.tweens.add({ targets: t, alpha: 0, duration: 800, onComplete: () => t.destroy() })
  }

  private handleFire(player: Phaser.GameObjects.Image) {
    this.audio.playSfx('sfx_fire', { volume: 0.85 })
    this.audio.duckMusic()
    this.cameras.main.shake(120, 0.008)
    const flash = this.add.image(player.x + 14, player.y, 'muzzle_1')
    flash.setScale(0.7)
    this.time.delayedCall(80, () => flash.destroy())
    const shell = this.add.image(player.x + 8, player.y, 'shell')
    shell.setScale(0.6)
    this.tweens.add({
      targets: shell,
      x: 220,
      y: 70,
      duration: 300,
      onComplete: () => {
        shell.destroy()
        this.audio.playSfx('sfx_explosion_small', { volume: 0.8 })
        const exp = this.add.image(220, 70, 'explosion_small_1')
        exp.setScale(1.2)
        this.tweens.add({ targets: exp, scale: 1.8, alpha: 0, duration: 260, onComplete: () => exp.destroy() })
        // coin ticks for win demo
        this.audio.playSfx('sfx_win', { volume: 0.6 })
        for (let c = 0; c < 3; c++) this.time.delayedCall(c * 80, () => this.audio.playSfx('sfx_coin_tick', { volume: 0.5 }))
      },
    })
  }
}
