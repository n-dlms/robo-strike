import Phaser from 'phaser'
import { PALETTE_HEX } from '../../config/palette'

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    this.textures.get('__WHITE').setFilter(Phaser.Textures.FilterMode.NEAREST)

    // Real CC0 art — not rectangles — now with separate base+turret for AI aiming
    // Tanks — composite (legacy) + separate base/turret for AI
    this.load.image('player_idle_1', 'assets/raw/player_idle_1.png')
    this.load.image('player_idle_2', 'assets/raw/player_idle_2.png')
    this.load.image('player_recoil_1', 'assets/raw/player_recoil_1.png')
    this.load.image('enemy1_idle_1', 'assets/raw/enemy1_idle_1.png')
    this.load.image('enemy2_idle_1', 'assets/raw/enemy2_idle_1.png')
    this.load.image('enemy3_idle_1', 'assets/raw/enemy3_idle_1.png')
    // AI turrets — separate for aiming
    this.load.image('player_base', 'assets/raw/player_base.png')
    this.load.image('player_turret', 'assets/raw/player_turret.png')
    this.load.image('enemy1_base', 'assets/raw/enemy1_base.png')
    this.load.image('enemy1_turret', 'assets/raw/enemy1_turret.png')
    this.load.image('enemy2_base', 'assets/raw/enemy2_base.png')
    this.load.image('enemy2_turret', 'assets/raw/enemy2_turret.png')
    this.load.image('enemy3_base', 'assets/raw/enemy3_base.png')
    this.load.image('enemy3_turret', 'assets/raw/enemy3_turret.png')
    // Bunkers
    this.load.image('bunker_intact', 'assets/raw/bunker_intact.png')
    // Backgrounds
    this.load.image('bg_battlefield', 'assets/raw/bg_battlefield.png')
    this.load.image('bg_starfield', 'assets/raw/bg_starfield.png')
    // FX
    this.load.image('shell', 'assets/raw/shell.png')
    this.load.image('coin_1', 'assets/raw/coin_1.png')
    this.load.image('explosion_small_1', 'assets/raw/explosion_small_1.png')
    this.load.image('explosion_small_2', 'assets/raw/explosion_small_2.png')
    this.load.image('explosion_small_3', 'assets/raw/explosion_small_3.png')
    this.load.image('explosion_small_4', 'assets/raw/explosion_small_4.png')
    this.load.image('explosion_big_1', 'assets/raw/explosion_big_1.png')
    this.load.image('explosion_big_2', 'assets/raw/explosion_big_2.png')
    this.load.image('explosion_big_3', 'assets/raw/explosion_big_3.png')
    this.load.image('explosion_big_4', 'assets/raw/explosion_big_4.png')
    this.load.image('explosion_big_5', 'assets/raw/explosion_big_5.png')
    this.load.image('explosion_big_6', 'assets/raw/explosion_big_6.png')
    this.load.image('muzzle_1', 'assets/raw/muzzle_1.png')
    this.load.image('muzzle_2', 'assets/raw/muzzle_2.png')
    this.load.image('shell_trail_1', 'assets/raw/shell_trail_1.png')
    this.load.image('shell_trail_2', 'assets/raw/shell_trail_2.png')
    // Arcade border for reference (HTML already shows, but also preload for in-canvas if needed)
    this.load.image('arcade_gui', 'assets/arcade/oga_arcade_gui_sheet.png')

    // Audio — real CC0 SFX + action loop (Phase 1 UI sounds)
    this.load.audio('sfx_fire', ['assets/audio/sfx_fire.ogg', 'assets/audio/sfx_fire.wav'])
    this.load.audio('sfx_fire_scout', ['assets/audio/sfx_fire_scout.ogg', 'assets/audio/sfx_fire_scout.wav'])
    this.load.audio('sfx_fire_bruiser', ['assets/audio/sfx_fire_bruiser.ogg', 'assets/audio/sfx_fire_bruiser.wav'])
    this.load.audio('sfx_fire_warlord', ['assets/audio/sfx_fire_warlord.ogg', 'assets/audio/sfx_fire_warlord.wav'])
    this.load.audio('sfx_explosion_small', ['assets/audio/sfx_explosion_small.ogg', 'assets/audio/sfx_explosion_small.wav'])
    this.load.audio('sfx_explosion_big', ['assets/audio/sfx_explosion_big.ogg', 'assets/audio/sfx_explosion_big.wav'])
    this.load.audio('sfx_win', ['assets/audio/sfx_win.ogg', 'assets/audio/sfx_win.wav'])
    this.load.audio('sfx_jackpot', ['assets/audio/sfx_jackpot.ogg', 'assets/audio/sfx_jackpot.wav'])
    this.load.audio('sfx_miss', ['assets/audio/sfx_miss.ogg', 'assets/audio/sfx_miss.wav'])
    this.load.audio('sfx_gameover', ['assets/audio/sfx_gameover.ogg', 'assets/audio/sfx_gameover.wav'])
    this.load.audio('sfx_gameover_new', ['assets/audio/sfx_gameover_new.ogg', 'assets/audio/sfx_gameover_new.wav'])
    this.load.audio('sfx_coin_tick', ['assets/audio/sfx_coin_tick.ogg', 'assets/audio/sfx_coin_tick.wav'])
    this.load.audio('sfx_ui_blip', ['assets/audio/sfx_ui_blip.ogg', 'assets/audio/sfx_ui_blip.wav'])
    this.load.audio('music_loop', ['assets/audio/music_loop.ogg', 'assets/audio/music_loop.wav'])

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
