import Phaser from 'phaser'
import { PALETTE_HEX } from '../../config/palette'

export class Title extends Phaser.Scene {
  constructor() {
    super('Title')
  }

  create() {
    const { width, height } = this.scale

    // Background: battlefield 320x180 (will be bg_battlefield.png in Phase 4, fallback navy)
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1a3f)

    // Title text — Press Start 2P, 1px outline rule implied via shadow
    this.add
      .text(width / 2, 48, 'ROBO STRIKE', {
        fontFamily: '"Press Start 2P"',
        fontSize: '14px',
        color: PALETTE_HEX.yellow,
        stroke: PALETTE_HEX.outline,
        strokeThickness: 2,
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, 72, 'RETRO TANK CASINO', {
        fontFamily: '"VT323"',
        fontSize: '14px',
        color: PALETTE_HEX.cyan,
      })
      .setOrigin(0.5)

    // Start prompt
    const startText = this.add
      .text(width / 2, 130, 'PRESS FIRE TO START', {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: PALETTE_HEX.white,
      })
      .setOrigin(0.5)

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Audio toggles placeholder (spec in docs/UI_AUDIO_TOGGLES.md)
    const musicToggle = this.add
      .text(280, 16, '♫', {
        fontFamily: '"VT323"',
        fontSize: '16px',
        color: PALETTE_HEX.green,
        backgroundColor: PALETTE_HEX.outline,
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    musicToggle.on('pointerdown', () => {
      musicToggle.setColor(musicToggle.style.color === PALETTE_HEX.green ? '#666' : PALETTE_HEX.green)
    })

    const sfxToggle = this.add
      .text(300, 16, '🔊', {
        fontFamily: '"VT323"',
        fontSize: '16px',
        color: PALETTE_HEX.green,
        backgroundColor: PALETTE_HEX.outline,
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    sfxToggle.on('pointerdown', () => {
      sfxToggle.setColor(sfxToggle.style.color === PALETTE_HEX.green ? '#666' : PALETTE_HEX.green)
    })

    // Input: FIRE / Space / click to start
    const startGame = () => this.scene.start('Game')

    this.input.keyboard?.once('keydown-SPACE', startGame)
    this.input.keyboard?.once('keydown-ENTER', startGame)
    this.input.once('pointerdown', startGame)

    // Touch-friendly: also listen for any key 1/2/3 as start
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (['1', '2', '3'].includes(e.key)) startGame()
    })
  }
}
