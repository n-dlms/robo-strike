import Phaser from 'phaser'
import { PALETTE_HEX } from '../../config/palette'

export class Game extends Phaser.Scene {
  constructor() {
    super('Game')
  }

  create() {
    const { width, height } = this.scale

    // Battlefield background placeholder (will be bg_battlefield.png)
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1a3f)
    // Simple ground line
    this.add.rectangle(width / 2, 140, width, 2, 0x1a1a1a)

    // Player tank placeholder
    const player = this.add.rectangle(60, 110, 24, 16, 0x4ff2e3)
    player.setStrokeStyle(1, 0x1a1a1a)

    // 3 enemy tanks — volatility choice, NOT skill
    const enemies = [
      { x: 160, y: 70, color: 0xff4fd8, label: 'SCOUT\n0.7× ~30×' },
      { x: 220, y: 70, color: 0xffd94f, label: 'BRUISER\n0.9× ~15×' },
      { x: 280, y: 70, color: 0x58ff9b, label: 'WARLORD\n1× ~11×' },
    ]

    enemies.forEach((e, idx) => {
      const tank = this.add.rectangle(e.x, e.y, 20, 14, e.color)
      tank.setStrokeStyle(1, 0x1a1a1a)
      tank.setInteractive({ useHandCursor: true })
      tank.on('pointerdown', () => this.handlePick(idx))

      this.add
        .text(e.x, e.y + 16, e.label, {
          fontFamily: '"VT323"',
          fontSize: '8px',
          color: PALETTE_HEX.white,
          align: 'center',
        })
        .setOrigin(0.5)
    })

    // Bet display placeholder
    this.add
      .text(16, 16, 'BET 10', {
        fontFamily: '"VT323"',
        fontSize: '12px',
        color: PALETTE_HEX.yellow,
        backgroundColor: PALETTE_HEX.outline,
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0, 0.5)

    // FIRE button
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

    fireBtn.on('pointerdown', () => this.handleFire())

    // Keyboard FIRE
    this.input.keyboard?.on('keydown-SPACE', () => this.handleFire())
    this.input.keyboard?.on('keydown-ENTER', () => this.handleFire())

    // Vault for hostApi placeholder (SDK bridge will replace in Phase 3)
    this.add
      .text(width / 2, 175, '320×180 CRT • PHASER SCAFFOLD', {
        fontFamily: '"VT323"',
        fontSize: '8px',
        color: '#666',
      })
      .setOrigin(0.5)

    // Ensure NEAREST
    this.textures.get('__WHITE').setFilter(Phaser.Textures.FilterMode.NEAREST)
  }

  private handlePick(index: number) {
    // Volatility choice placeholder — will set gameData tankId in Phase 3
    const labels = ['SCOUT', 'BRUISER', 'WARLORD']
    this.add
      .text(160, 100, `PICKED ${labels[index]}`, {
        fontFamily: '"VT323"',
        fontSize: '10px',
        color: '#fff',
        backgroundColor: '#1a1a1a',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0)
    // quick fade
    const t = this.add.text(160, 100, `PICKED ${labels[index]}`, {
      fontFamily: '"VT323"',
      fontSize: '10px',
      color: '#fff',
    })
    t.setOrigin(0.5)
    this.tweens.add({ targets: t, alpha: 0, duration: 800, onComplete: () => t.destroy() })
  }

  private handleFire() {
    // Placeholder firing animation — real VRF in Phase 2/3
    this.cameras.main.shake(120, 0.008)
    const flash = this.add.rectangle(60, 110, 12, 8, 0xffffff)
    this.time.delayedCall(80, () => flash.destroy())
  }
}
