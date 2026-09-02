import Phaser from 'phaser'
import { PALETTE_HEX } from '../../config/palette'
import { AudioManager } from '../systems/AudioManager'
import { Scout } from '../entities/Scout'
import { Bruiser } from '../entities/Bruiser'
import { Warlord } from '../entities/Warlord'

type Bot = Scout | Bruiser | Warlord

export class Game extends Phaser.Scene {
  private audio!: AudioManager
  // exposed for bot fire-back via (scene as any).playerBase — keep public-ish
  public playerBase!: Phaser.GameObjects.Image
  public playerTurret!: Phaser.GameObjects.Image
  private bots: Bot[] = []
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }

  // bet-scaled health mock (read from scene in real integration with HostSnapshot)
  private betAmount = 10
  private maxBet = 100

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
    this.playerBase.setDepth(2)
    this.playerTurret.setDepth(3)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.tweens.add({ targets: [this.playerBase, this.playerTurret], x: Phaser.Math.Clamp(p.x, 24, width - 24), y: Phaser.Math.Clamp(p.y, 40, height - 40), duration: 220, ease: 'Quad.easeOut' })
    })

    // Each bot own code — random free space
    const positions = [
      { x: 80, y: 60 },
      { x: 160, y: 60 },
      { x: 240, y: 60 },
    ]
    const ClsList: any[] = [Scout, Bruiser, Warlord]
    const labels = [
      { name: 'SCOUT', mult: '×30' },
      { name: 'BRUISER', mult: '×15' },
      { name: 'WARLORD', mult: '×11' },
    ]
    ClsList.forEach((Cls, idx) => {
      const pos = positions[idx]
      const rx = pos.x + Phaser.Math.Between(-20, 20)
      const ry = pos.y + Phaser.Math.Between(-10, 10)
      const bot: any = new Cls(this, rx, ry, this.betAmount, this.maxBet)
      this.bots.push(bot)
      this.add.image(pos.x, pos.y + 10, 'bunker_intact').setScale(0.9).setOrigin(0.5).setDepth(-1).setAlpha(0.3)
      this.add
        .text(Math.round(pos.x), Math.round(pos.y + 18), labels[idx].mult, {
          fontFamily: '"Press Start 2P"',
          fontSize: '8px',
          color: labels[idx].mult === '×30' ? PALETTE_HEX.yellow : PALETTE_HEX.white,
          stroke: PALETTE_HEX.outline,
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setResolution(2)
        .setDepth(5)
      this.add
        .text(Math.round(pos.x), Math.round(pos.y - 14), labels[idx].name, {
          fontFamily: '"VT323"',
          fontSize: '10px',
          color: PALETTE_HEX.white,
        })
        .setOrigin(0.5)
        .setResolution(2)
        .setDepth(5)
      bot.base.setInteractive({ useHandCursor: true })
      bot.turret.setInteractive({ useHandCursor: true })
      const pick = () => this.handlePick(idx)
      bot.base.on('pointerdown', pick)
      bot.turret.on('pointerdown', pick)
    })

    this.add
      .text(16, 16, `BET ${this.betAmount}`, {
        fontFamily: '"VT323"',
        fontSize: '12px',
        color: PALETTE_HEX.yellow,
        backgroundColor: PALETTE_HEX.outline,
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0, 0.5)

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
      .text(width / 2, height - 5, '320×240 4:3 • MOVE + AIM • EACH BOT OWN CODE', {
        fontFamily: '"VT323"',
        fontSize: '7px',
        color: '#666',
      })
      .setOrigin(0.5)

    this.textures.get('__WHITE').setFilter(Phaser.Textures.FilterMode.NEAREST)
  }

  update() {
    const { width, height } = this.scale
    const speed = 1.4
    let dx = 0, dy = 0
    if (this.cursors.left.isDown || this.wasd.A.isDown) dx = -speed
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx = speed
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy = -speed
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy = speed
    if (dx !== 0 || dy !== 0) {
      this.playerBase.x = Phaser.Math.Clamp(this.playerBase.x + dx, 24, width - 24)
      this.playerBase.y = Phaser.Math.Clamp(this.playerBase.y + dy, 40, height - 40)
      this.playerTurret.x = this.playerBase.x
      this.playerTurret.y = this.playerBase.y
    }

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
    // Keep bots inside free space — wander anywhere on free space
    this.bots.forEach((b: any) => {
      b.base.x = Phaser.Math.Clamp(b.base.x, 24, width - 24)
      b.base.y = Phaser.Math.Clamp(b.base.y, 30, height - 40)
      b.turret.x = b.base.x; b.turret.y = b.base.y
    })
    // Player barrel auto-detects closest alive bot and auto-aims for strike (you move body, barrel auto-aims)
    let closest: any = null
    let closestDist = Infinity
    this.bots.forEach((b: any) => {
      if ((b as any).alive === false) return
      const d = Phaser.Math.Distance.Between(this.playerTurret.x, this.playerTurret.y, b.turret.x, b.turret.y)
      if (d < closestDist) { closestDist = d; closest = b }
    })
    // fallback to any if all dead (during explosion)
    if (!closest) {
      this.bots.forEach((b: any) => {
        const d = Phaser.Math.Distance.Between(this.playerTurret.x, this.playerTurret.y, b.turret.x, b.turret.y)
        if (d < closestDist) { closestDist = d; closest = b }
      })
    }
    if (closest) {
      const ang = Phaser.Math.Angle.Between(this.playerTurret.x, this.playerTurret.y, closest.turret.x, closest.turret.y)
      this.playerTurret.rotation = Phaser.Math.Angle.RotateTo(this.playerTurret.rotation, ang + Math.PI / 2, 0.28)
    }
  }

  private getPlayerBarrelTip(): { x: number; y: number } {
    const rot = this.playerTurret.rotation
    const lx = Math.cos(rot - Math.PI / 2) * 12
    const ly = Math.sin(rot - Math.PI / 2) * 12
    return { x: this.playerTurret.x + lx, y: this.playerTurret.y + ly }
  }

  private handlePick(index: number) {
    const labels = ['SCOUT', 'BRUISER', 'WARLORD']
    this.audio.playSfx('sfx_ui_blip')
    const t = this.add.text(160, 110, `PICKED ${labels[index]}`, {
      fontFamily: '"VT323"',
      fontSize: '10px',
      color: '#fff',
    })
    t.setOrigin(0.5)
    this.tweens.add({ targets: t, alpha: 0, duration: 800, onComplete: () => t.destroy() })
    const target: any = this.bots[index]
    const angle = Phaser.Math.Angle.Between(this.playerTurret.x, this.playerTurret.y, target.turret.x, target.turret.y)
    this.tweens.add({ targets: this.playerTurret, rotation: angle + Math.PI / 2, duration: 140, ease: 'Quad.easeOut' })
  }

  private handleFire() {
    // Find closest alive bot
    let bestIdx = -1
    let bestDist = Infinity
    this.bots.forEach((b: any, i: number) => {
      if ((b as any).alive === false) return
      const d = Phaser.Math.Distance.Between(this.playerTurret.x, this.playerTurret.y, b.turret.x, b.turret.y)
      if (d < bestDist) { bestDist = d; bestIdx = i }
    })
    // if all dead, pick any
    if (bestIdx === -1) {
      this.bots.forEach((b: any, i: number) => {
        const d = Phaser.Math.Distance.Between(this.playerTurret.x, this.playerTurret.y, b.turret.x, b.turret.y)
        if (d < bestDist) { bestDist = d; bestIdx = i }
      })
    }
    if (bestIdx === -1) return
    const target: any = this.bots[bestIdx]
    if (!target || target.alive === false) return

    const tip = this.getPlayerBarrelTip()
    this.audio.playSfx('sfx_fire', { volume: 0.85 })
    this.audio.duckMusic()
    this.cameras.main.shake(120, 0.008)
    this.tweens.add({ targets: [this.playerBase, this.playerTurret], y: this.playerBase.y - 2, duration: 60, yoyo: true, ease: 'Quad.easeOut' })
    const flash = this.add.image(tip.x, tip.y, 'muzzle_1')
    flash.setScale(0.7)
    flash.setRotation(this.playerTurret.rotation)
    flash.setDepth(14)
    this.time.delayedCall(80, () => flash.destroy())

    const shell = this.add.image(tip.x, tip.y, 'shell')
    shell.setScale(0.6)
    shell.setDepth(11)
    // trail
    const trailEv = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (!shell.active) { trailEv.remove(); return }
        const t = this.add.image(shell.x, shell.y, 'shell')
        t.setScale(0.22)
        t.setAlpha(0.55)
        t.setDepth(10)
        this.tweens.add({ targets: t, alpha: 0, scale: 0.12, duration: 160, onComplete: () => t.destroy() })
      },
    })

    // capture target position at launch (target may move, but we tween to where it was — for simplicity track live)
    const destX = target.turret.x
    const destY = target.turret.y
    this.tweens.add({
      targets: shell,
      x: destX,
      y: destY,
      duration: 280,
      ease: 'Linear',
      onComplete: () => {
        shell.destroy()
        trailEv.remove()
        // re-evaluate target still alive and near
        if (!target.alive) return
        const killed = target.hit(this)
        if (killed) {
          // big explosion already handled inside hit (sfx_explosion_big, shake, flash, 1.5-2.0)
          this.audio.playSfx('sfx_win', { volume: 0.65 })
          for (let c = 0; c < 4; c++) this.time.delayedCall(c * 70, () => this.audio.playSfx('sfx_coin_tick', { volume: 0.5 }))
          // coins spray
          for (let c = 0; c < 6; c++) {
            const cx = destX + Phaser.Math.Between(-8, 8)
            const coin = this.add.image(cx, destY, 'coin_1')
            coin.setScale(0.55)
            coin.setDepth(12)
            this.tweens.add({
              targets: coin,
              y: destY - 14 - (c % 3) * 4,
              x: cx + (c % 2 === 0 ? 5 : -5),
              alpha: 0,
              duration: 420,
              ease: 'Quad.easeOut',
              delay: c * 18,
              onComplete: () => coin.destroy(),
            })
          }
          this.time.delayedCall(760, () => this.respawnEnemy(bestIdx))
        } else {
          // not killed — small hit feedback already inside hit, add subtle coin tick for feedback
          this.audio.playSfx('sfx_coin_tick', { volume: 0.35 })
        }
      },
    })
  }

  private respawnEnemy(idx: number) {
    const bot: any = this.bots[idx]
    const x = Phaser.Math.Between(30, 290)
    const y = Phaser.Math.Between(30, 120)
    // delegate to bot's own respawn (handles health reset, bar, tint, scale, fire timer)
    if (typeof bot.respawn === 'function') {
      bot.respawn(this, x, y, this.betAmount, this.maxBet)
    } else {
      // fallback
      bot.base.setPosition(x, y)
      bot.turret.setPosition(x, y)
      bot.targetX = Phaser.Math.Between(30, 290)
      bot.targetY = Phaser.Math.Between(30, 200)
    }
  }
}
