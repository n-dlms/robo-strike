import Phaser from 'phaser'
import { PALETTE, PALETTE_HEX } from '../../config/palette'
import { AudioManager } from '../systems/AudioManager'
import { PaytablePanel } from '../systems/PaytablePanel'
import { loadStats } from '../systems/Stats'
import { Scout } from '../entities/Scout'
import { Bruiser } from '../entities/Bruiser'
import { Warlord } from '../entities/Warlord'

type Bot = Scout | Bruiser | Warlord

export class Title extends Phaser.Scene {
  private attractIndex = 0
  private attractTimer?: Phaser.Time.TimerEvent
  private playerBase!: Phaser.GameObjects.Image
  private playerTurret!: Phaser.GameObjects.Image
  private bots: Bot[] = []
  private startText!: Phaser.GameObjects.Text
  private orTapText!: Phaser.GameObjects.Text
  private audio!: AudioManager
  private paytable!: PaytablePanel
  // Fix #2: Demo mode player wandering — free space random wandering like enemies, visual only (no health loss / no Game Over)
  private playerTargetX = 160
  private playerTargetY = 200
  private playerSpeed = 0.85
  // Demo flag — ensures no real gameplay effects (health, Game Over) in Title
  public isDemo = true
  public isGameOver = false // for bot tryFire compatibility — demo never Game Over

  constructor() {
    super('Title')
  }

  create() {
    const { width, height } = this.scale
    this.audio = new AudioManager(this)
    this.audio.initMusic()
    this.paytable = new PaytablePanel(this)

    const bg = this.add.image(width / 2, height / 2, 'bg_battlefield')
    bg.setDisplaySize(width, height)
    bg.setAlpha(0.95)
    // Procedural sparse starfield — the plus-cross tile read as static noise
    for (let i = 0; i < 40; i++) {
      const x = (i * 73 + 17) % width
      const y = (i * 41 + 29) % (height - 30)
      const dot = this.add.rectangle(x, y, 1, 1, 0xffffff)
      dot.setAlpha(0.2 + ((i * 7) % 3) * 0.12)
      if (i % 5 === 0) {
        this.tweens.add({
          targets: dot,
          alpha: 0.08,
          duration: 1400 + (i % 4) * 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: (i * 83) % 800,
        })
      }
    }
    this.add.rectangle(width / 2, height - 30, width, 2, PALETTE.outline).setAlpha(0.6)

    // Fix #2: Demo player starts near center-bottom but will wander free space randomly (like enemies)
    this.playerBase = this.add.image(160, height - 32, 'player_base')
    this.playerBase.setScale(0.9)
    this.playerTurret = this.add.image(160, height - 32, 'player_turret')
    this.playerTurret.setScale(0.9)
    this.playerTurret.setOrigin(0.5, 0.7)
    // Demo wandering — random targets anywhere on free space (30,290 / 30,220), speed 0.7-1.0
    this.playerTargetX = Phaser.Math.Between(30, 290)
    this.playerTargetY = Phaser.Math.Between(80, 200)
    this.playerSpeed = Phaser.Math.FloatBetween(0.7, 1.0)
    this.pickNewPlayerTarget()
    // Subtle idle bob removed in favor of wandering; keep tiny breathing if desired but wandering is primary
    // Previously: tweens yoyo 300ms — replaced by free wandering to showcase shooting bots in demo

    for (let i = 0; i < 3; i++) {
      const bx = 64 + i * 96
      const bunker = this.add.image(bx, 78, 'bunker_intact')
      bunker.setScale(1.1)
      bunker.setOrigin(0.5)
    }

    const botClasses: any[] = [Scout, Bruiser, Warlord]
    const labels = [
      { name: 'SCOUT', mult: '×30' },
      { name: 'BRUISER', mult: '×15' },
      { name: 'WARLORD', mult: '×11' },
    ]
    botClasses.forEach((Cls, idx) => {
      const x = Phaser.Math.Between(30, 290)
      const y = Phaser.Math.Between(30, 120)
      const bot: any = new Cls(this, x, y)
      this.bots.push(bot)
      this.add
        .text(Math.round(x), Math.round(y + 18), labels[idx].mult, {
          fontFamily: '"Press Start 2P"',
          fontSize: '8px',
          color: labels[idx].mult === '×30' ? PALETTE_HEX.yellow : PALETTE_HEX.white,
          stroke: PALETTE_HEX.outline,
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setResolution(2)
      this.add
        .text(Math.round(x), Math.round(y - 14), labels[idx].name, {
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
    this.input.keyboard?.on('keydown-M', () => {
      const on = this.audio.toggleMusic()
      musicToggle.setAlpha(on ? 1 : 0.35)
    })
    this.input.keyboard?.on('keydown-S', () => {
      const on = this.audio.toggleSfx()
      sfxToggle.setAlpha(on ? 1 : 0.35)
    })

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

    const stats = loadStats()
    if (stats.rounds > 0) {
      const best = (stats.biggestMultX100 / 100).toFixed(2)
      const marquee = this.add
        .text(modalX, modalY + 38, `ROUNDS ${stats.rounds} · BEST WIN ${best}${stats.biggestWinLabel ? ' (' + stats.biggestWinLabel + ')' : ''} · STREAK ${stats.bestStreak}`, {
          fontFamily: '"VT323"',
          fontSize: '9px',
          color: PALETTE_HEX.yellow,
        })
        .setOrigin(0.5)
        .setDepth(11)
      this.tweens.add({ targets: marquee, alpha: 0.55, duration: 900, yoyo: true, repeat: -1 })
    }
    const oddsHint = this.add
      .text(modalX, modalY + 50, 'T — PAYTABLE / ODDS', {
        fontFamily: '"VT323"',
        fontSize: '8px',
        color: PALETTE_HEX.cyan,
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setAlpha(0.8)
    oddsHint.setInteractive({ useHandCursor: true })
    this.paytable = new PaytablePanel(this)
    oddsHint.on('pointerdown', () => this.paytable.toggle())
    this.input.keyboard?.on('keydown-T', () => this.paytable.toggle())

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

  private getPlayerBarrelTip(): { x: number; y: number } {
    const rot = this.playerTurret.rotation
    const lx = Math.cos(rot - Math.PI / 2) * 12
    const ly = Math.sin(rot - Math.PI / 2) * 12
    return { x: this.playerTurret.x + lx, y: this.playerTurret.y + ly }
  }

  private pickNewPlayerTarget() {
    // Demo wandering — pick new random free space target every 1.4-2.2s (like enemies)
    this.playerTargetX = Phaser.Math.Between(30, 290)
    this.playerTargetY = Phaser.Math.Between(30, 200)
    this.time.delayedCall(Phaser.Math.Between(1400, 2200), () => {
      if ((this as any)._starting) return
      if (!this.scene.isActive()) return
      if (!this.playerBase?.active) return
      // isDemo guard — if demo were disabled, don't wander
      if (!this.isDemo) return
      this.pickNewPlayerTarget()
    })
  }

  update() {
    // Fix #2: Demo player wandering — free space random wandering like enemies, but with demo logic (no health loss)
    // Demo not real gameplay: bots' shells on Title do not cause damage/Game Over; player just visually shoots bots
    if (this.isDemo && this.playerBase?.active) {
      const pAngle = Phaser.Math.Angle.Between(this.playerBase.x, this.playerBase.y, this.playerTargetX, this.playerTargetY)
      const pDist = Phaser.Math.Distance.Between(this.playerBase.x, this.playerBase.y, this.playerTargetX, this.playerTargetY)
      if (pDist < 4) {
        this.playerTargetX = Phaser.Math.Between(30, 290)
        this.playerTargetY = Phaser.Math.Between(30, 200)
      } else {
        this.playerBase.x += Math.cos(pAngle) * this.playerSpeed
        this.playerBase.y += Math.sin(pAngle) * this.playerSpeed
        this.playerTurret.x = this.playerBase.x
        this.playerTurret.y = this.playerBase.y
      }
      // Clamp player inside free space
      const { width: pw, height: ph } = this.scale as any
      this.playerBase.x = Phaser.Math.Clamp(this.playerBase.x, 24, pw - 24)
      this.playerBase.y = Phaser.Math.Clamp(this.playerBase.y, 30, ph - 40)
      this.playerTurret.x = this.playerBase.x
      this.playerTurret.y = this.playerBase.y
    }
    // Each bot own code, random free space, barrel aims at you (demo bots still shoot visually but no damage)
    this.bots.forEach((bot: any) => bot.update(this, this.playerBase.x, this.playerBase.y))
    const minDist = 30
    for (let i = 0; i < this.bots.length; i++) {
      for (let j = i + 1; j < this.bots.length; j++) {
        const a: any = this.bots[i]
        const b: any = this.bots[j]
        const d = Phaser.Math.Distance.Between(a.base.x, a.base.y, b.base.x, b.base.y)
        if (d < minDist && d > 0.1) {
          const angle = Phaser.Math.Angle.Between(b.base.x, b.base.y, a.base.x, a.base.y)
          const push = (minDist - d) / 2
          a.base.x += Math.cos(angle) * push
          a.base.y += Math.sin(angle) * push
          a.turret.x = a.base.x; a.turret.y = a.base.y
          b.base.x -= Math.cos(angle) * push
          b.base.y -= Math.sin(angle) * push
          b.turret.x = b.base.x; b.turret.y = b.base.y
        }
      }
    }
    // Player collision — enemies cannot pass through player (minDist 28, push enemy away, player immovable)
    const playerMinDist = 28
    for (const bot of this.bots as any[]) {
      const d = Phaser.Math.Distance.Between((bot as any).base.x, (bot as any).base.y, this.playerBase.x, this.playerBase.y)
      if (d < playerMinDist && d > 0.1) {
        const angle = Phaser.Math.Angle.Between(this.playerBase.x, this.playerBase.y, (bot as any).base.x, (bot as any).base.y)
        const push = playerMinDist - d
        ;(bot as any).base.x += Math.cos(angle) * push
        ;(bot as any).base.y += Math.sin(angle) * push
        ;(bot as any).turret.x = (bot as any).base.x
        ;(bot as any).turret.y = (bot as any).base.y
      }
    }
    // Keep bots clamped
    const { width, height } = this.scale as any
    for (const bot of this.bots as any[]) {
      ;(bot as any).base.x = Phaser.Math.Clamp((bot as any).base.x, 24, width - 24)
      ;(bot as any).base.y = Phaser.Math.Clamp((bot as any).base.y, 30, height - 40)
      ;(bot as any).turret.x = (bot as any).base.x
      ;(bot as any).turret.y = (bot as any).base.y
    }
    // Player barrel auto-detects closest bot (no mouse needed, casino auto-aim)
    let closest: any = null
    let cDist = Infinity
    this.bots.forEach((b: any) => {
      const d = Phaser.Math.Distance.Between(this.playerTurret.x, this.playerTurret.y, b.turret.x, b.turret.y)
      if (d < cDist) { cDist = d; closest = b.turret }
    })
    if (closest) {
      const pAngle = Phaser.Math.Angle.Between(this.playerTurret.x, this.playerTurret.y, closest.x, closest.y)
      this.playerTurret.rotation = Phaser.Math.Angle.RotateTo(this.playerTurret.rotation, pAngle + Math.PI / 2, 0.28)
    }
  }

  private playAttract() {
    if ((this as any)._starting) return
    const idx = this.attractIndex % this.bots.length
    this.attractIndex++
    const bot: any = this.bots[idx]
    if (!bot) return
    const target = { x: bot.turret.x, y: bot.turret.y }
    // shoot from barrel tip, not center
    const tip = this.getPlayerBarrelTip()

    this.audio.playSfx('sfx_fire', { volume: 0.7 })
    this.audio.duckMusic()

    this.tweens.add({
      targets: [this.playerBase, this.playerTurret],
      y: tip.y - 3,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
    })

    const flash = this.add.image(tip.x, tip.y, 'muzzle_1')
    flash.setScale(0.6)
    flash.setRotation(this.playerTurret.rotation)
    flash.setDepth(5)
    this.time.delayedCall(70, () => flash.destroy())

    const shell = this.add.image(tip.x, tip.y, 'shell')
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
        bot.base.setTint(0xffffff)
        bot.turret.setTint(0xffffff)
        this.time.delayedCall(80, () => {
          bot.base.clearTint()
          bot.turret.clearTint()
        })
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
