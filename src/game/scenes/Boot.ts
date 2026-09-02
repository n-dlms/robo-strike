import Phaser from 'phaser'
import { PALETTE_HEX } from '../../config/palette'

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    this.textures.get('__WHITE').setFilter(Phaser.Textures.FilterMode.NEAREST)

    // Real CC0 art — not rectangles
    // Tanks
    this.load.image('player_idle_1', 'assets/raw/player_idle_1.png')
    this.load.image('player_idle_2', 'assets/raw/player_idle_2.png')
    this.load.image('player_recoil_1', 'assets/raw/player_recoil_1.png')
    this.load.image('enemy1_idle_1', 'assets/raw/enemy1_idle_1.png')
    this.load.image('enemy2_idle_1', 'assets/raw/enemy2_idle_1.png')
    this.load.image('enemy3_idle_1', 'assets/raw/enemy3_idle_1.png')
    // Bunkers
    this.load.image('bunker_intact', 'assets/raw/bunker_intact.png')
    // Backgrounds
    this.load.image('bg_battlefield', 'assets/raw/bg_battlefield.png')
    this.load.image('bg_starfield', 'assets/raw/bg_starfield.png')
    // FX
    this.load.image('shell', 'assets/raw/shell.png')
    this.load.image('coin_1', 'assets/raw/coin_1.png')
    this.load.image('explosion_small_1', 'assets/raw/explosion_small_1.png')
    this.load.image('muzzle_1', 'assets/raw/muzzle_1.png')
    // Arcade border for reference (HTML already shows, but also preload for in-canvas if needed)
    this.load.image('arcade_gui', 'assets/arcade/oga_arcade_gui_sheet.png')

    // Ensure all textures are NEAREST after load
    this.load.on('complete', () => {
      Object.values(this.textures.list).forEach((t: any) => {
        if (t && t.setFilter) t.setFilter(Phaser.Textures.FilterMode.NEAREST)
      })
    })
  }

  create() {
    this.add
      .text(160, 90, 'LOADING', {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: PALETTE_HEX.cyan,
      })
      .setOrigin(0.5)

    // Wait for fonts + textures
    this.time.delayedCall(300, () => this.scene.start('Title'))
  }
}
