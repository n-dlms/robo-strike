import Phaser from 'phaser'
import { PALETTE, PALETTE_HEX } from '../../config/palette'
import { AudioManager } from '../systems/AudioManager'

export class Title extends Phaser.Scene {
  private attractIndex = 0
  private attractTimer?: Phaser.Time.TimerEvent
  private playerTank!: Phaser.GameObjects.Image
  private enemyTanks: Phaser.GameObjects.Image[] = []
  private enemyPositions: { x: number; y: number }[] = []
  private startText!: Phaser.GameObjects.Text
  private orTapText!: Phaser.GameObjects.Text
  private audio!: AudioManager

  constructor() {
    super('Title')
  }

  create() {
    const { width, height } = this.scale
    this.audio = new AudioManager(this)
    this.audio.initMusic()

    // ---- Background: real battlefield + starfield tile ----
    const bg = this.add.image(width / 2, height / 2, 'bg_battlefield')
    bg.setDisplaySize(width, height)
    bg.setAlpha(0.95)
    const starTile = this.add.tileSprite(width / 2, height / 2 - 20, width, height - 40, 'bg_starfield')
    starTile.setAlpha(0.35)
    starTile.setTileScale(1, 1)
    for (let i = 0; i < 16; i++) {
      const x = (i * 73 + 17) % width
      const y = (i * 41 + 29) % (height - 30)
      const dot = this.add.rectangle(x, y, 1, 1, PALETTE.white)
      dot.setAlpha(0.5 + ((i * 7) % 3) * 0.15)
      if (i % 5 === 0) {
        this.tweens.add({
          targets: dot,
          alpha: 0.2,
          duration: 1200 + (i % 4) * 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: (i * 83) % 800,
        })
      }
    }
    this.add.rectangle(width / 2, height - 30, width, 2, PALETTE.outline).setAlpha(0.6)

    this.playerTank = this.add.image(160, height - 32, 'player_idle_1')
    this.playerTank.setOrigin(0.5)
    this.playerTank.setScale(0.85)
    this.tweens.add({
      targets: this.playerTank,
      y: height - 31,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    for (let i = 0; i < 3; i++) {
      const bx = 64 + i * 96
      const bunker = this.add.image(bx, 78, 'bunker_intact')
      bunker.setScale(1.1)
      bunker.setOrigin(0.5)
    }

    const enemies = [
      { x: 64, y: 66, key: 'enemy1_idle_1', name: 'SCOUT', mult: '×30' },
      { x: 160, y: 66, key: 'enemy2_idle_1', name: 'BRUISER', mult: '×15' },
      { x: 256, y: 66, key: 'enemy3_idle_1', name: 'WARLORD', mult: '×11' },
    ]
    this.enemyPositions = enemies.map((e) => ({ x: e.x, y: e.y }))
    enemies.forEach((e) => {
      const tank = this.add.image(e.x, e.y, e.key)
      tank.setScale(0.85)
      tank.setOrigin(0.5)
      tank.texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
      this.enemyTanks.push(tank)

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

    const scanG = this.add.graphics()
    scanG.fillStyle(0xffffff, 0.04)
    for (let y = 0; y < height; y += 4) {
      scanG.fillRect(0, y, width, 1)
    }
    scanG.setDepth(90)
    const vRect = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
    vRect.setAlpha(0.15)
    vRect.setDepth(90)

    this.textures.get('__WHITE').setFilter(Phaser.Textures.FilterMode.NEAREST)

    const modalW = 220
    const modalH = 96
    const modalX = width / 2
    const modalY = height / 2 + 4
    const modalBg = this.add.graphics()
    modalBg.fillStyle(PALETTE.navy, 0.92)
    modalBg.lineStyle(1, PALETTE.outline, 1)
    modalBg.fillRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 6)
    modalBg.strokeRoundedRect(modalX - modalW / 2, modalY - modalH / 2, modalW, modalH, 6)
    modalBg.setDepth(10)

    this.add
      .text(modalX, modalY - 28, 'ROBO STRIKE', {
        fontFamily: '"Press Start 2P"',
        fontSize: '11px',
        color: PALETTE_HEX.yellow,
        stroke: PALETTE_HEX.outline,
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(11)

    this.add
      .text(modalX, modalY - 12, 'RETRO TANK CASINO', {
        fontFamily: '"VT323"',
        fontSize: '10px',
        color: PALETTE_HEX.cyan,
      })
      .setOrigin(0.5)
      .setDepth(11)

    const state = this.audio.getState()
    const musicToggle = this.add
      .text(modalX + 78, modalY - 38, '♫', {
        fontFamily: '"VT323"',
        fontSize: '13px',
        color: PALETTE_HEX.green,
        backgroundColor: PALETTE_HEX.outline,
        padding: { x: 4, y: 1 },
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setAlpha(state.music ? 1 : 0.35)
      .setInteractive({ useHandCursor: true })
    const sfxToggle = this.add
      .text(modalX + 96, modalY - 38, '🔊', {
        fontFamily: '"VT323"',
        fontSize: '13px',
        color: PALETTE_HEX.green,
        backgroundColor: PALETTE_HEX.outline,
        padding: { x: 4, y: 1 },
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setAlpha(state.sfx ? 1 : 0.35)
      .setInteractive({ useHandCursor: true })

    musicToggle.on('pointerdown', () => {
      const on = this.audio.toggleMusic()
      musicToggle.setAlpha(on ? 1 : 0.35)
      this.audio.playSfx('sfx_ui_blip')
    })
    sfxToggle.on('pointerdown', () => {
      const on = this.audio.toggleSfx()
      sfxToggle.setAlpha(on ? 1 : 0.35)
      this.audio.playSfx('sfx_ui_blip')
    })
    musicToggle.on('pointerdown', (_p: any, _x: any, _y: any, e: any) => e?.stopPropagation?.())
    sfxToggle.on('pointerdown', (_p: any, _x: any, _y: any, e: any) => e?.stopPropagation?.())

    this.startText = this.add
      .text(modalX, modalY + 12, 'PRESS FIRE TO START', {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: PALETTE_HEX.white,
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setAlpha(1)

    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        this.startText.setAlpha(this.startText.alpha === 1 ? 0 : 1)
      },
    })

    this.orTapText = this.add
      .text(modalX, modalY + 24, 'OR TAP', {
        fontFamily: '"VT323"',
        fontSize: '9px',
        color: PALETTE_HEX.white,
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setAlpha(0.65)

    this.attractTimer = this.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => this.playAttract(),
    })
    this.time.delayedCall(1200, () => this.playAttract())

    const startGame = () => {
      if ((this as any)._starting) return
      ;(this as any)._starting = true
      if (this.attractTimer) this.attractTimer.remove()
      this.audio.playSfx('sfx_ui_blip')
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('Game')
      })
    }

    this.input.on('pointerdown', startGame)
    this.input.keyboard?.on('keydown-SPACE', startGame)
    this.input.keyboard?.on('keydown-ENTER', startGame)
    this.input.keyboard?.on('keydown-F', startGame)
  }

  private playAttract() {
    if ((this as any)._starting) return
    const idx = this.attractIndex % this.enemyPositions.length
    this.attractIndex++
    const target = this.enemyPositions[idx]
    const start = { x: this.playerTank.x, y: this.playerTank.y - 4 }

    this.audio.playSfx('sfx_fire', { volume: 0.7 })
    this.audio.duckMusic()

    this.tweens.add({
      targets: this.playerTank,
      y: start.y - 3,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
    })

    const flash = this.add.image(start.x + 10, start.y, 'muzzle_1')
    flash.setScale(0.6)
    flash.setDepth(5)
    this.time.delayedCall(70, () => flash.destroy())

    const shell = this.add.image(start.x, start.y, 'shell')
    shell.setScale(0.7)
    shell.setDepth(6)
    const trailTimer = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (!shell.active) {
          trailTimer.remove()
          return
        }
        const t = this.add.image(shell.x, shell.y, 'shell')
        t.setScale(0.25)
        t.setAlpha(0.7)
        this.tweens.add({
          targets: t,
          alpha: 0,
          scale: 0.2,
          duration: 220,
          onComplete: () => t.destroy(),
        })
      },
    })

    this.tweens.add({
      targets: shell,
      x: target.x,
      y: target.y,
      duration: 420,
      ease: 'Linear',
      onComplete: () => {
        shell.destroy()
        trailTimer.remove()
        const enemy = this.enemyTanks[idx]
        enemy.setTint(0xffffff)
        this.time.delayedCall(80, () => enemy.clearTint())
        this.cameras.main.shake(120, 0.006)
        this.audio.playSfx('sfx_explosion_small', { volume: 0.8 })
        const exp = this.add.image(target.x, target.y, 'explosion_small_1')
        exp.setScale(1.2)
        exp.setDepth(7)
        this.tweens.add({
          targets: exp,
          scale: 1.8,
          alpha: 0,
          duration: 260,
          ease: 'Quad.easeOut',
          onComplete: () => exp.destroy(),
        })
        for (let p = 0; p < 4; p++) {
          const angle = (p * 90) * (Math.PI / 180)
          const dist = 10 + p * 2
          const px = target.x + Math.cos(angle) * dist
          const py = target.y + Math.sin(angle) * dist
          const part = this.add.rectangle(target.x, target.y, 3, 3, p % 2 === 0 ? PALETTE.yellow : PALETTE.magenta)
          part.setStrokeStyle(1, PALETTE.outline)
          part.setDepth(7)
          this.tweens.add({
            targets: part,
            x: px,
            y: py,
            alpha: 0,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => part.destroy(),
          })
        }
        // Coin burst with tick sounds
        this.audio.playSfx('sfx_win', { volume: 0.6 })
        for (let c = 0; c < 6; c++) {
          const cx = target.x + ((c * 7) % 13) - 6
          const coin = this.add.image(cx, target.y, 'coin_1')
          coin.setScale(0.6)
          coin.setDepth(8)
          this.time.delayedCall(c * 40, () => this.audio.playSfx('sfx_coin_tick', { volume: 0.5 }))
          this.tweens.add({
            targets: coin,
            y: target.y - 18 - (c % 3) * 4,
            x: cx + ((c % 2 === 0 ? 1 : -1) * 4),
            alpha: 0,
            duration: 420,
            ease: 'Quad.easeOut',
            delay: c * 22,
            onComplete: () => coin.destroy(),
          })
        }
      },
    })
  }
}
