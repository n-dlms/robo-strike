import Phaser from 'phaser'
import { PALETTE_HEX } from '../../config/palette'

export class Game extends Phaser.Scene {
  constructor() {
    super('Game')
  }

  create() {
    const { width, height } = this.scale

    // Real battlefield background CC0 sand
    const bg = this.add.image(width / 2, height / 2, 'bg_battlefield')
    bg.setDisplaySize(width, height)
    this.add.image(width / 2, height / 2, 'bg_starfield').setAlpha(0.25).setDisplaySize(width, height)

    this.add.rectangle(width / 2, 140, width, 2, 0x1a1a1a).setAlpha(0.5)

    // Player tank — REAL IMAGE
    const player = this.add.image(60, 110, 'player_idle_1')
    player.setScale(0.85)
    player.setOrigin(0.5)

    // 3 enemy tanks — REAL IMAGES
    const enemies = [
      { x: 160, y: 70, key: 'enemy1_idle_1', label: 'SCOUT\n×30' },
      { x: 220, y: 70, key: 'enemy2_idle_1', label: 'BRUISER\n×15' },
      { x: 280, y: 70, key: 'enemy3_idle_1', label: 'WARLORD\n×11' },
    ]

    enemies.forEach((e, idx) => {
      // Bunker behind
      this.add.image(e.x, e.y + 10, 'bunker_intact').setScale(0.9).setOrigin(0.5).setDepth(-1)
      const tank = this.add.image(e.x, e.y, e.key)
      tank.setScale(0.85)
      tank.setInteractive({ useHandCursor: true })
      tank.on('pointerdown', () => this.handlePick(idx))

      this.add
        .text(e.x, e.y + 18, e.label, {
          fontFamily: '"VT323"',
          fontSize: '8px',
          color: PALETTE_HEX.white,
          align: 'center',
        })
        .setOrigin(0.5)
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
      .text(width / 2, 160, 'FIRE', {
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
      .text(width / 2, 175, '320×180 CRT • REAL ART', {
        fontFamily: '"VT323"',
        fontSize: '8px',
        color: '#666',
      })
      .setOrigin(0.5)

    this.textures.get('__WHITE').setFilter(Phaser.Textures.FilterMode.NEAREST)
  }

  private handlePick(index: number) {
    const labels = ['SCOUT', 'BRUISER', 'WARLORD']
    const t = this.add.text(160, 100, `PICKED ${labels[index]}`, {
      fontFamily: '"VT323"',
      fontSize: '10px',
      color: '#fff',
    })
    t.setOrigin(0.5)
    this.tweens.add({ targets: t, alpha: 0, duration: 800, onComplete: () => t.destroy() })
  }

  private handleFire(player: Phaser.GameObjects.Image) {
    this.cameras.main.shake(120, 0.008)
    // Muzzle flash REAL IMAGE
    const flash = this.add.image(player.x + 14, player.y, 'muzzle_1')
    flash.setScale(0.7)
    this.time.delayedCall(80, () => flash.destroy())
    // Shell REAL IMAGE
    const shell = this.add.image(player.x + 8, player.y, 'shell')
    shell.setScale(0.6)
    this.tweens.add({
      targets: shell,
      x: 220,
      y: 70,
      duration: 300,
      onComplete: () => {
        shell.destroy()
        const exp = this.add.image(220, 70, 'explosion_small_1')
        exp.setScale(1.2)
        this.tweens.add({ targets: exp, scale: 1.8, alpha: 0, duration: 260, onComplete: () => exp.destroy() })
      },
    })
  }
}
