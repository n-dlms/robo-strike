import Phaser from 'phaser'
import { PALETTE_HEX } from '../../config/palette'
import { AudioManager } from '../systems/AudioManager'
import { CountUp } from '../systems/CountUp'
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

  // Player health — mock maxHits 5, bar 40x4 (larger than bots 24x3), visible during gameplay
  private playerMaxHits = 5
  private playerHits = 5
  public isGameOver = false
  private totalGains = 0 // sum of all win multipliers
  private playerHealthBarBg?: Phaser.GameObjects.Rectangle
  private playerHealthBarFill?: Phaser.GameObjects.Rectangle
  private playerHealthLabel?: Phaser.GameObjects.Text
  private gainsHudText?: Phaser.GameObjects.Text

  // Fire-spam fix: shared global cooldown + i-frames
  private nextEnemyFireTime = 0
  private readonly globalEnemyFireCooldown = 700
  private playerInvulnerableUntil = 0
  private readonly playerIFramesMs = 800
  private playerBlinkTween?: Phaser.Tweens.Tween

  // Game Over UI refs
  private gameOverContainer?: Phaser.GameObjects.Container
  private gameOverBackdrop?: Phaser.GameObjects.Rectangle
  private gameOverGainsText?: Phaser.GameObjects.Text
  private countUp?: CountUp
  private gameOverShown = false

  constructor() {
    super('Game')
  }

  create() {
    const { width, height } = this.scale
    this.audio = new AudioManager(this)
    this.audio.initMusic()
    this.isGameOver = false
    this.gameOverShown = false
    this.playerHits = this.playerMaxHits
    this.totalGains = 0
    this.gameOverContainer = undefined
    this.gameOverBackdrop = undefined
    this.countUp?.stop()
    this.nextEnemyFireTime = 0
    this.playerInvulnerableUntil = 0
    this.playerBlinkTween?.stop()
    this.playerBlinkTween = undefined

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

    // Player health bar — 40x4 larger than bots 24x3, near player + HUD mirror
    this.createPlayerHealthBar()

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.isGameOver) {
        // In Game Over, pointerdown is handled by popup — ignore move
        return
      }
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

    // Fire-spam fix: stagger initial fire timers so all 3 don't burst at t=0
    // Scout 1800 / Bruiser 2400 / Warlord 3000 already, but enforce round-robin offset on top
    {
      const now = this.time.now
      this.bots.forEach((b: any, idx: number) => {
        const interval = (b as any).fireInterval ?? 1800
        ;(b as any).nextFireTime = now + interval + idx * 650 + Phaser.Math.Between(150, 400)
      })
      this.nextEnemyFireTime = now + 900 // grace at round start
    }

    this.add
      .text(16, 16, `BET ${this.betAmount}`, {
        fontFamily: '"VT323"',
        fontSize: '12px',
        color: PALETTE_HEX.yellow,
        backgroundColor: PALETTE_HEX.outline,
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0, 0.5)
      .setDepth(10)

    // Gains HUD (visible during gameplay) — top-left under BET
    this.gainsHudText = this.add
      .text(16, 30, `GAINS x${this.totalGains.toFixed(2)}`, {
        fontFamily: '"VT323"',
        fontSize: '10px',
        color: PALETTE_HEX.white,
        backgroundColor: PALETTE_HEX.outline,
        padding: { x: 4, y: 1 },
      })
      .setOrigin(0, 0.5)
      .setDepth(10)
      .setAlpha(0.9)

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
      .setDepth(10)

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
    // Do not update gameplay when Game Over is active (freeze board except popup)
    if (this.isGameOver) {
      this.updatePlayerHealthBar()
      return
    }
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
    // Player collision — enemies cannot pass through player (minDist 28, push enemy away, player immovable)
    const playerMinDist = 28
    for (const bot of this.bots as any[]) {
      if ((bot as any).alive === false) continue
      const d = Phaser.Math.Distance.Between(bot.base.x, bot.base.y, this.playerBase.x, this.playerBase.y)
      if (d < playerMinDist && d > 0.1) {
        const angle = Phaser.Math.Angle.Between(this.playerBase.x, this.playerBase.y, bot.base.x, bot.base.y)
        const push = playerMinDist - d
        bot.base.x += Math.cos(angle) * push
        bot.base.y += Math.sin(angle) * push
        bot.turret.x = bot.base.x
        bot.turret.y = bot.base.y
      }
    }
    // Keep bots inside free space — wander anywhere on free space
    this.bots.forEach((b: any) => {
      b.base.x = Phaser.Math.Clamp(b.base.x, 24, width - 24)
      b.base.y = Phaser.Math.Clamp(b.base.y, 30, height - 40)
      b.turret.x = b.base.x; b.turret.y = b.base.y
    })
    // Also clamp player-tracked turret after push (player stays immovable, but keep synced)
    this.playerTurret.x = this.playerBase.x
    this.playerTurret.y = this.playerBase.y
    // Keep player health bar following player (40x4, larger than bots 24x3)
    this.updatePlayerHealthBar()

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

  // ---- Player health bar (40x4, HUD + follow) ----
  private createPlayerHealthBar() {
    const x = this.playerBase.x
    const y = this.playerBase.y - 18
    // Background 40x4 navy outline #1a1a1a, depth above player
    this.playerHealthBarBg = this.add.rectangle(x, y, 40, 4, 0x1a1a1a).setDepth(12).setOrigin(0.5)
    this.playerHealthBarBg.setStrokeStyle(1, 0x1a1a1a)
    // Fill anchored left
    this.playerHealthBarFill = this.add.rectangle(x - 20, y, 40, 4, 0x58ff9b).setDepth(13).setOrigin(0, 0.5)
    // Label "YOU" VT323 7px above bar
    this.playerHealthLabel = this.add
      .text(x, y - 8, 'YOU', {
        fontFamily: '"VT323"',
        fontSize: '7px',
        color: PALETTE_HEX.white,
        stroke: PALETTE_HEX.outline,
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setDepth(13)
      .setResolution(2)
    this.updatePlayerHealthBar()
  }

  private updatePlayerHealthBar() {
    if (!this.playerHealthBarBg || !this.playerHealthBarFill) return
    const x = this.playerBase.x
    const y = this.playerBase.y - 18
    this.playerHealthBarBg.setPosition(x, y)
    this.playerHealthBarFill.setPosition(x - 20, y)
    if (this.playerHealthLabel) this.playerHealthLabel.setPosition(x, y - 8)
    const pct = this.isGameOver ? 0 : Math.max(0, this.playerHits / this.playerMaxHits)
    // Phaser Rectangle width setter
    ;(this.playerHealthBarFill as any).width = 40 * pct
    // Need to also update display via setSize? For Rectangle, width property controls display; we keep visible handling
    this.playerHealthBarFill.setVisible(pct > 0 && !this.isGameOver)
    this.playerHealthBarBg.setVisible(!this.isGameOver)
    if (this.playerHealthLabel) this.playerHealthLabel.setVisible(!this.isGameOver)
  }

  // ---- Fire-spam fix: global fire gate & i-frames ----
  public canEnemyFire(now: number): boolean {
    if (this.isGameOver) return false
    return now >= this.nextEnemyFireTime
  }

  public notifyEnemyFired(now: number): void {
    this.nextEnemyFireTime = now + this.globalEnemyFireCooldown
  }

  public isPlayerInvulnerable(now: number): boolean {
    return now < this.playerInvulnerableUntil
  }

  private startPlayerIFramesVisual(): void {
    this.playerBlinkTween?.stop()
    this.playerBlinkTween = undefined
    // reset alpha
    this.playerBase.setAlpha(1)
    this.playerTurret.setAlpha(1)
    // blink 800ms: 4 on/off cycles (~100ms each half)
    this.playerBlinkTween = this.tweens.add({
      targets: [this.playerBase, this.playerTurret],
      alpha: 0.35,
      duration: 90,
      yoyo: true,
      repeat: 4,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.playerBase.setAlpha(1)
        this.playerTurret.setAlpha(1)
        this.playerBlinkTween = undefined
      },
    })
  }

  private stopPlayerIFramesVisual(): void {
    this.playerBlinkTween?.stop()
    this.playerBlinkTween = undefined
    this.playerBase.setAlpha(1)
    this.playerTurret.setAlpha(1)
  }

  /** Called by bot fire onComplete — every shell that reaches player counts as hit */
  public onEnemyShellHitPlayer(damage = 1) {
    if (this.isGameOver || this.gameOverShown) return
    if (this.playerHits <= 0) return
    const now = this.time.now
    // i-frames: absorb if still invulnerable
    if (now < this.playerInvulnerableUntil) return
    this.playerHits = Math.max(0, this.playerHits - damage)
    // flash player white (only on actual damage)
    this.playerBase.setTint(0xffffff)
    this.playerTurret.setTint(0xffffff)
    this.time.delayedCall(60, () => {
      if (!this.isGameOver && this.playerBase.active) this.playerBase.clearTint()
      if (!this.isGameOver && this.playerTurret.active) this.playerTurret.clearTint()
    })
    this.updatePlayerHealthBar()
    this.updateGainsHud()
    // i-frames window after a successful hit — 800ms (player can reposition)
    if (this.playerHits > 0) {
      this.playerInvulnerableUntil = now + this.playerIFramesMs
      this.startPlayerIFramesVisual()
      this.cameras.main.shake(90, 0.006)
    }
    if (this.playerHits <= 0) {
      this.stopPlayerIFramesVisual()
      this.triggerGameOver()
    }
  }

  private updateGainsHud() {
    if (this.gainsHudText) {
      this.gainsHudText.setText(`GAINS x${this.totalGains.toFixed(2)}`)
    }
  }

  private getPayoutForBotIdx(idx: number): number {
    // Map bot type to its jackpot multiplier as gains — within 0.7x..30x range
    // SCOUT 30, BRUISER 15, WARLORD 11 per labels; also support fractional 0.7/2/6 variants via small random?
    // For demo, use fixed jackpot but if want variety, could random tier. We'll keep deterministic.
    if (idx === 0) return 30 // Scout
    if (idx === 1) return 15 // Bruiser
    if (idx === 2) return 11 // Warlord
    return 1
  }

  private getPlayerBarrelTip(): { x: number; y: number } {
    const rot = this.playerTurret.rotation
    const lx = Math.cos(rot - Math.PI / 2) * 12
    const ly = Math.sin(rot - Math.PI / 2) * 12
    return { x: this.playerTurret.x + lx, y: this.playerTurret.y + ly }
  }

  private handlePick(index: number) {
    if (this.isGameOver) return
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
    // If Game Over is shown, FIRE fast-forwards count or retries
    if (this.isGameOver && this.gameOverShown) {
      if (this.countUp?.isPlaying) {
        this.countUp.skipToEnd()
        return
      }
      this.handleRetry()
      return
    }
    if (this.isGameOver) return
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
        if (this.isGameOver) return
        const killed = target.hit(this)
        if (killed) {
          // big explosion already handled inside hit (sfx_explosion_big, shake, flash, 1.5-2.0)
          // Accumulate gains — total multiplier sum
          const payout = this.getPayoutForBotIdx(bestIdx)
          this.totalGains += payout
          this.updateGainsHud()
          // Play win jingle for gains if any
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
    if (this.isGameOver) return
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

  // ---- Game Over ----
  private triggerGameOver() {
    if (this.gameOverShown) return
    this.isGameOver = true
    this.gameOverShown = true
    // Hide player health bar
    this.updatePlayerHealthBar()
    // Final big explosion at player
    this.playPlayerBigExplosion()
    // sfx_explosion_big already in explosion, plus additional big explosion sound
    // sfx_miss losing jingle will play in popup (1.4s OGA losegamemusic)
    // Shake + flash for death
    this.cameras.main.shake(220, 0.016)
    this.cameras.main.flash(180, 20, 30, 80)
    // Desaturate effect via tinted overlay + gray flash
    // Dim 55% navy will be added in popup
    this.time.delayedCall(420, () => this.showGameOverPopup())
  }

  private playPlayerBigExplosion(scene: Phaser.Scene = this) {
    const audio: any = (scene as any).audio
    if (audio) audio.playSfx('sfx_explosion_big', { volume: 0.95 })
    else if (scene.sound) scene.sound.play('sfx_explosion_big', { volume: 0.95 } as any)
    scene.cameras.main.shake(260, 0.02)
    scene.cameras.main.flash(200, 255, 230, 100)
    const x = this.playerBase.x
    const y = this.playerBase.y
    const scale = Phaser.Math.FloatBetween(1.6, 2.1)
    const key = scene.textures.exists('explosion_big_1') ? 'explosion_big_1' : 'explosion_small_1'
    const exp = scene.add.image(x, y, key)
    exp.setScale(scale)
    exp.setDepth(15)
    let frame = 1
    const cycle = scene.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        frame++
        if (frame > 6) { cycle.remove(); return }
        const k = `explosion_big_${frame}`
        if (scene.textures.exists(k)) exp.setTexture(k)
        exp.setScale(scale + frame * 0.06)
      },
    })
    scene.tweens.add({
      targets: exp,
      alpha: 0,
      duration: 480,
      delay: 280,
      onComplete: () => { exp.destroy(); cycle.remove() },
    })
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.3, 0.3)
      const dist = 14 + Phaser.Math.Between(6, 18)
      const px = x + Math.cos(angle) * dist
      const py = y + Math.sin(angle) * dist
      const col = i % 2 === 0 ? 0x58ff9b : 0xff4f4f
      const part = scene.add.rectangle(x, y, 4, 4, col)
      part.setStrokeStyle(1, 0x1a1a1a)
      part.setDepth(14)
      scene.tweens.add({
        targets: part,
        x: px,
        y: py,
        alpha: 0,
        duration: 360,
        ease: 'Quad.easeOut',
        onComplete: () => part.destroy(),
      })
    }
    scene.tweens.add({ targets: [this.playerBase, this.playerTurret], alpha: 0, duration: 120 })
    // Hide health bar elements fully
    this.playerHealthBarBg?.setVisible(false)
    this.playerHealthBarFill?.setVisible(false)
    this.playerHealthLabel?.setVisible(false)
  }

  private showGameOverPopup() {
    const { width, height } = this.scale
    // Backdrop dim 55% navy #0a1a3f
    this.gameOverBackdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x0a1a3f, 0.55)
    this.gameOverBackdrop.setDepth(90)
    this.gameOverBackdrop.setAlpha(0)
    this.tweens.add({ targets: this.gameOverBackdrop, alpha: 0.55, duration: 180, ease: 'Cubic.easeOut' })

    // Desaturate: add subtle gray overlay for 55% desaturation feel
    const desat = this.add.rectangle(width / 2, height / 2, width, height, 0xaaaaaa, 0.12)
    desat.setDepth(91)
    desat.setAlpha(0)
    this.tweens.add({ targets: desat, alpha: 0.12, duration: 180, ease: 'Cubic.easeOut' })

    // Shake per spec — miss shake ±2px 150ms
    this.cameras.main.shake(150, 0.009)

    // Play losing jingle sfx_miss (1.4s OGA losegamemusic)
    this.audio.playSfx('sfx_miss', { volume: 0.75 })

    const container = this.add.container(width / 2, height / 2)
    container.setDepth(100)
    container.setAlpha(0)
    container.setScale(0.82)
    this.gameOverContainer = container

    const panelW = 240
    const panelH = 120
    const g = this.add.graphics()
    g.fillStyle(0x0a1a3f, 1)
    g.lineStyle(1, 0x1a1a1a, 1)
    g.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 6)
    g.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 6)
    // subtle inner highlight
    g.lineStyle(1, 0x4ff2e3, 0.18)
    g.strokeRoundedRect(-panelW / 2 + 1, -panelH / 2 + 1, panelW - 2, panelH - 2, 5)

    // Title GAME OVER Press Start 2P
    const title = this.add.text(0, -panelH / 2 + 18, 'GAME OVER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
      color: PALETTE_HEX.white,
      stroke: PALETTE_HEX.outline,
      strokeThickness: 2,
    }).setOrigin(0.5)

    // Gains display VT323 — initially x0.00 then count up to totalGains
    const gainsLabel = this.add.text(0, -2, 'x0.00', {
      fontFamily: '"VT323"',
      fontSize: '24px',
      color: this.totalGains > 0 ? PALETTE_HEX.yellow : PALETTE_HEX.cyan,
      stroke: PALETTE_HEX.outline,
      strokeThickness: 1,
    }).setOrigin(0.5)
    gainsLabel.setResolution(2)
    this.gameOverGainsText = gainsLabel

    // Sub label if no gains vs gains
    const subTextStr = this.totalGains > 0 ? `TOTAL GAINS` : `NO GAINS`
    const subLabel = this.add.text(0, 16, subTextStr, {
      fontFamily: '"VT323"',
      fontSize: '10px',
      color: PALETTE_HEX.white,
    }).setOrigin(0.5)
    subLabel.setAlpha(0.85)

    // RETRY button — gold bg, Press Start 2P
    const btnW = 84
    const btnH = 22
    const btnBg = this.add.rectangle(0, panelH / 2 - 20, btnW, btnH, 0xc0392b)
    btnBg.setStrokeStyle(1, 0x1a1a1a)
    btnBg.setDepth(1)
    // inner gold highlight
    const btnInner = this.add.rectangle(0, panelH / 2 - 21, btnW - 4, 2, 0xffd94f, 0.55)
    btnInner.setDepth(2)
    const retryText = this.add.text(0, panelH / 2 - 20, 'RETRY', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: PALETTE_HEX.white,
    }).setOrigin(0.5)
    retryText.setDepth(3)
    const retryHit = this.add.rectangle(0, panelH / 2 - 20, btnW, btnH, 0x000000, 0).setInteractive({ useHandCursor: true }).setDepth(4)

    const hint = this.add.text(0, panelH / 2 - 4, 'FIRE / SPACE', {
      fontFamily: '"VT323"',
      fontSize: '7px',
      color: PALETTE_HEX.cyan,
    }).setOrigin(0.5)
    hint.setAlpha(0.7)

    container.add([g, title, gainsLabel, subLabel, btnBg, btnInner, retryText, retryHit, hint])
    // Backdrop click to retry as well
    this.gameOverBackdrop.setInteractive({ useHandCursor: true })
    this.gameOverBackdrop.on('pointerdown', () => this.handleRetry())
    retryHit.on('pointerdown', () => this.handleRetry())

    // Keyboard RETRY
    this.input.keyboard?.once('keydown-SPACE', () => this.handleRetry())
    this.input.keyboard?.once('keydown-ENTER', () => this.handleRetry())
    this.input.keyboard?.once('keydown-R', () => this.handleRetry())

    // Tween in: scale 0.82->1 + fade 180ms Cubic.easeOut (spec §4)
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Start CountUp from 0x to gains with tick sounds if gains>0, else no win sound
        if (this.totalGains > 0) {
          this.audio.playSfx('sfx_win', { volume: 0.65 })
          this.countUp = new CountUp(this, gainsLabel)
          this.countUp.start(this.totalGains, {
            playTick: () => this.audio.playSfx('sfx_coin_tick', { volume: 0.55 }),
            playPop: () => this.audio.playSfx('sfx_ui_blip', { volume: 0.5 }),
          })
        } else {
          gainsLabel.setText('x0.00')
          // still pop
          this.tweens.add({ targets: gainsLabel, scale: { from: 1, to: 1.12 }, duration: 70, ease: 'Back.easeOut', yoyo: true, onComplete: () => gainsLabel.setScale(1) })
        }
        // pulse RETRY button
        this.tweens.add({ targets: [btnBg, retryText], y: panelH / 2 - 22, duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      },
    })

    // Also allow FIRE button global to fast-forward count or retry
    // Override handleFire behavior via isGameOver flag — SPACE capture already above, but add pointerdown to fast-forward
    const fireOnce = () => {
      if (this.countUp?.isPlaying) {
        this.countUp.skipToEnd()
      } else {
        // do not auto-retry on first FIRE if counting — only after count done. But spec says FIRE/Space to restart after.
        // We'll keep retry explicit — second press after count triggers retry via handleFire check.
      }
    }
    this.input.once('pointerdown', fireOnce)
    this.input.keyboard?.once('keydown-F', fireOnce)
  }

  private handleRetry() {
    if (!this.isGameOver) return
    this.countUp?.stop()
    this.audio.playSfx('sfx_ui_blip')
    // Fade out then restart scene cleanly
    if (this.gameOverContainer) {
      this.tweens.add({
        targets: [this.gameOverContainer, this.gameOverBackdrop],
        alpha: 0,
        scale: 0.96,
        duration: 140,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          this.scene.restart()
        },
      })
    } else {
      this.scene.restart()
    }
    // Also restart via fade
    this.cameras.main.fadeOut(180, 0, 0, 0)
  }
}
