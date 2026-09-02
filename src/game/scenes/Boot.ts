import Phaser from 'phaser'
import { PALETTE_HEX } from '../../config/palette'

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    // Ensure nearest neighbor for pixel art
    this.textures.get('__WHITE').setFilter(Phaser.Textures.FilterMode.NEAREST)

    // Placeholder loading — real CC0 art will be swapped via atlas in Phase 4
    // For scaffold we generate a tiny colored rect so build passes without assets
    const g = this.add.graphics()
    g.fillStyle(0x4ff2e3, 1)
    g.fillRect(0, 0, 32, 32)
    g.generateTexture('placeholder_tank', 32, 32)
    g.clear()
    g.destroy()
  }

  create() {
    // Font loading check (OFL Press Start 2P + VT323 via Google Fonts link in index.html)
    // Add a tiny text to trigger font load
    this.add
      .text(160, 90, 'LOADING', {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: PALETTE_HEX.cyan,
      })
      .setOrigin(0.5)

    // Simulate font load delay then go to Title
    this.time.delayedCall(300, () => this.scene.start('Title'))
  }
}
