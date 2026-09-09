import Phaser from 'phaser'
import { PALETTE_HEX } from '../../config/palette'
import { AudioManager } from '../systems/AudioManager'
import { CountUp } from '../systems/CountUp'
import { Scout } from '../entities/Scout'
import { Bruiser } from '../entities/Bruiser'
import { Warlord } from '../entities/Warlord'
import { CasinoSession, type RoundResult } from '../sdk/CasinoSession'
import { formatUnits, parseUnits } from '../sdk/guest'
import { PaytablePanel } from '../systems/PaytablePanel'
import { loadStats, recordRound, saveStats, type StatsState } from '../systems/Stats'
import { OUTCOME_NAMES, TANK_NAMES, type TankId } from '../../config/paytables'

type Bot = Scout | Bruiser | Warlord

const BET_LADDER = ['0.1', '0.5', '1', '5', '10', '25', '50', '100']

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

  // Single reusable center banner — one slot, never stacked (see showBanner)
  private bannerText?: Phaser.GameObjects.Text
  // Game Over UI refs
  private gameOverContainer?: Phaser.GameObjects.Container
  private gameOverBackdrop?: Phaser.GameObjects.Rectangle
  private gameOverGainsText?: Phaser.GameObjects.Text
  private countUp?: CountUp
  private gameOverShown = false

  // ---- Casino layer (Phase 3-3) ----
  private casino!: CasinoSession
  private betIdx = 2
  private selectedTank: TankId = 0
  private overdriveOn = false
  private roundInFlight = false
  private tankLabels: Phaser.GameObjects.Text[] = []
  private multTags: Phaser.GameObjects.Text[] = []
  private betText?: Phaser.GameObjects.Text
  private odChip?: Phaser.GameObjects.Text
  private bankText?: Phaser.GameObjects.Text
  private vrfTicker?: Phaser.GameObjects.Text
  private paytable!: PaytablePanel
  private stats: StatsState = loadStats()

  constructor() {
    super('Game')
  }

  create() {
    const { width, height } = this.scale
    // Fix #4: cleanup stale bots from previous run (scene.restart retains this.bots array but destroys display list)
    // Without clearing, bots accumulate and nextFireTime may be in the past, causing enemies to never shoot after RETRY
    if (this.bots && this.bots.length > 0) {
      this.bots.forEach((b: any) => {
        try { b.destroy?.() } catch {}
      })
    }
    this.bots = []
    this.tankLabels = []
    this.multTags = []
    // Fix #3/#4: fully reset Game Over flags and timers before any bot logic can run
    this.isGameOver = false
    this.gameOverShown = false
    this.audio = new AudioManager(this)
    this.audio.initMusic()
    // Casino layer — host bridge if framed, standalone crypto-RNG demo otherwise
    this.casino = new CasinoSession()
    this.casino.init()
    this.roundInFlight = false
    this.paytable = new PaytablePanel(this)
    this.stats = loadStats()
    this.playerHits = this.playerMaxHits
    this.totalGains = 0
    this.gameOverContainer = undefined
    this.gameOverBackdrop = undefined
    this.countUp?.stop()
    this.countUp = undefined as any
    this.nextEnemyFireTime = 0
    this.playerInvulnerableUntil = 0
    this.playerBlinkTween?.stop()
    this.playerBlinkTween = undefined
    // Ensure any leftover health bar refs from destroyed scene are cleared — will be recreated below
    this.playerHealthBarBg = undefined as any
    this.playerHealthBarFill = undefined as any
    this.playerHealthLabel = undefined as any
    this.gainsHudText = undefined as any
    ;(this as any)._retrying = false

    const bg = this.add.image(width / 2, height / 2, 'bg_battlefield')
    bg.setDisplaySize(width, height)
    // Procedural sparse stars (1px, palette white) — replaces the plus-cross
    // tile that read as static noise
    for (let i = 0; i < 42; i++) {
      const x = (i * 97 + 31) % width
      const y = (i * 53 + 11) % (height - 40)
      const dot = this.add.rectangle(x, y, 1, 1, 0xffffff)
      dot.setAlpha(0.15 + ((i * 7) % 4) * 0.1)
      dot.setDepth(0)
      if (i % 6 === 0) {
        this.tweens.add({
          targets: dot,
          alpha: 0.05,
          duration: 1600 + (i % 5) * 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: (i * 61) % 900,
        })
      }
    }
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
      const multTag = this.add
        .text(Math.round(pos.x), Math.round(pos.y + 20), labels[idx].mult, {
          fontFamily: '"Press Start 2P"',
          fontSize: '8px',
          color: labels[idx].mult === '×30' ? PALETTE_HEX.yellow : PALETTE_HEX.white,
          stroke: PALETTE_HEX.outline,
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setResolution(2)
        .setDepth(5)
      this.multTags.push(multTag)
      const nameTag = this.add
        .text(Math.round(pos.x), Math.round(pos.y - 14), labels[idx].name, {
          fontFamily: '"VT323"',
          fontSize: '10px',
          color: PALETTE_HEX.white,
        })
        .setOrigin(0.5)
        .setResolution(2)
        .setDepth(5)
      this.tankLabels.push(nameTag)
      bot.base.setInteractive({ useHandCursor: true })
      bot.turret.setInteractive({ useHandCursor: true })
      const pick = () => this.handlePick(idx)
      bot.base.on('pointerdown', pick)
      bot.turret.on('pointerdown', pick)
    })
    this.refreshTankLabels()

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

    // ---- Casino HUD: BET −/+ , OVERDRIVE toggle, BANK, mode line ----
    const hudStyle = (size: string, color: string) => ({
      fontFamily: '"VT323"',
      fontSize: size,
      color,
      backgroundColor: PALETTE_HEX.outline,
      padding: { x: 4, y: 2 },
    })
    const betDown = this.add
      .text(16, 16, '−', hudStyle('14px', PALETTE_HEX.cyan))
      .setOrigin(0, 0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
    this.betText = this.add
      .text(30, 16, `BET ${BET_LADDER[this.betIdx]}`, hudStyle('12px', PALETTE_HEX.yellow))
      .setOrigin(0, 0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
    const betUp = this.add
      .text(96, 16, '+', hudStyle('14px', PALETTE_HEX.cyan))
      .setOrigin(0, 0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
    this.odChip = this.add
      .text(16, 30, `OD ${this.overdriveOn ? 'ON ×2.5' : 'OFF'}`, hudStyle('10px', this.overdriveOn ? PALETTE_HEX.magenta : PALETTE_HEX.white))
      .setOrigin(0, 0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
    const oddsChip = this.add
      .text(84, 30, 'ODDS', hudStyle('10px', PALETTE_HEX.yellow))
      .setOrigin(0, 0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
    oddsChip.on('pointerdown', () => this.paytable.toggle())
    betDown.on('pointerdown', () => this.adjustBet(-1))
    betUp.on('pointerdown', () => this.adjustBet(1))
    this.betText.on('pointerdown', () => this.toggleOverdrive())
    this.odChip.on('pointerdown', () => this.toggleOverdrive())
    this.bankText = this.add
      .text(width - 16, 28, '', hudStyle('10px', PALETTE_HEX.green))
      .setOrigin(1, 0.5)
      .setDepth(10)
    this.vrfTicker = this.add
      .text(width / 2, 16, '', {
        fontFamily: '"VT323"',
        fontSize: '10px',
        color: PALETTE_HEX.cyan,
        backgroundColor: PALETTE_HEX.outline,
        padding: { x: 4, y: 1 },
      })
      .setOrigin(0.5)
      .setDepth(15)
      .setVisible(false)
    this.refreshCasinoHud()

    // Gains HUD (visible during gameplay) — under the bet/OD row
    this.gainsHudText = this.add
      .text(16, 44, `GAINS x${this.totalGains.toFixed(2)}`, {
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

    // Casino keys: 1/2/3 pick tank, O overdrive, comma/period bet down/up
    this.input.keyboard?.on('keydown-ONE', () => this.handlePick(0))
    this.input.keyboard?.on('keydown-TWO', () => this.handlePick(1))
    this.input.keyboard?.on('keydown-THREE', () => this.handlePick(2))
    this.input.keyboard?.on('keydown-O', () => this.toggleOverdrive())
    this.input.keyboard?.on('keydown-T', () => this.paytable.toggle())
    this.input.keyboard?.on('keydown-COMMA', () => this.adjustBet(-1))
    this.input.keyboard?.on('keydown-PERIOD', () => this.adjustBet(1))

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
      .text(width / 2, height - 5, '1/2/3 TANK • ,/. BET • O OVERDRIVE • T ODDS • SPACE FIRE', {
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

    // Tank name + multiplier tags follow their bots (labels stored per index)
    this.tankLabels.forEach((tag, i) => {
      const b: any = this.bots[i]
      if (b?.base?.active) tag.setPosition(Math.round(b.base.x), Math.round(b.base.y - 14))
    })
    this.multTags.forEach((tag, i) => {
      const b: any = this.bots[i]
      if (b?.base?.active) tag.setPosition(Math.round(b.base.x), Math.round(b.base.y + 20))
    })

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
    // Cosmetic pause while a VRF round resolves — return fire never interacts
    // with the payout path (docs/research/movement_ai_casino.md Option 1).
    if (this.roundInFlight) return false
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
    // Fix #3: guard ensures Game Over appears only once — multiple shells arriving same frame must not trigger twice
    if (this.isGameOver || this.gameOverShown) return
    if (this.gameOverContainer) return
    if (this.playerHits <= 0) return
    const now = this.time.now
    // i-frames: absorb if still invulnerable
    if (now < this.playerInvulnerableUntil) return
    // Re-check after i-frames — another shell may have triggered Game Over during this tick
    if (this.isGameOver || this.gameOverShown) return
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

  private getPlayerBarrelTip(): { x: number; y: number } {
    const rot = this.playerTurret.rotation
    const lx = Math.cos(rot - Math.PI / 2) * 12
    const ly = Math.sin(rot - Math.PI / 2) * 12
    return { x: this.playerTurret.x + lx, y: this.playerTurret.y + ly }
  }

  private handlePick(index: number) {
    if (this.isGameOver) return
    this.selectedTank = index as TankId
    this.audio.playSfx('sfx_ui_blip')
    const labels = TANK_NAMES
    const t = this.add.text(160, 132, `PICKED ${labels[index]}`, {
      fontFamily: '"VT323"',
      fontSize: '10px',
      color: '#fff',
    })
    t.setOrigin(0.5)
    this.tweens.add({ targets: t, alpha: 0, duration: 800, onComplete: () => t.destroy() })
    this.refreshTankLabels()
    const target: any = this.bots[index]
    if (!target) return
    const angle = Phaser.Math.Angle.Between(this.playerTurret.x, this.playerTurret.y, target.turret.x, target.turret.y)
    this.tweens.add({ targets: this.playerTurret, rotation: angle + Math.PI / 2, duration: 140, ease: 'Quad.easeOut' })
  }

  // ---- Casino HUD helpers ----
  private adjustBet(dir: -1 | 1) {
    const next = Phaser.Math.Clamp(this.betIdx + dir, 0, BET_LADDER.length - 1)
    if (next === this.betIdx) return
    this.betIdx = next
    this.audio.playSfx('sfx_ui_blip')
    this.refreshCasinoHud()
  }

  private toggleOverdrive() {
    this.overdriveOn = !this.overdriveOn
    this.audio.playSfx('sfx_ui_blip')
    this.refreshCasinoHud()
  }

  private refreshCasinoHud() {
    this.betText?.setText(`BET ${BET_LADDER[this.betIdx]}`)
    this.odChip
      ?.setText(this.overdriveOn ? 'OD ON ×2.5' : 'OD OFF')
      .setColor(this.overdriveOn ? PALETTE_HEX.magenta : PALETTE_HEX.white)
    if (this.bankText) {
      const bal = this.casino.displayBalance()
      this.bankText.setText(
        this.casino.mode === 'standalone'
          ? `BANK ${formatUnits(bal, this.casino.decimals())} · DEMO`
          : `BANK ${formatUnits(bal, this.casino.decimals())} ${this.casino.symbol()}`,
      )
    }
  }

  private refreshTankLabels() {
    this.tankLabels.forEach((tag, i) => {
      tag.setColor(i === this.selectedTank ? PALETTE_HEX.yellow : PALETTE_HEX.white)
      tag.setScale(i === this.selectedTank ? 1.15 : 1)
    })
  }

  private showBanner(text: string, color: string, holdMs = 1200, laneY = 60) {
    const { width } = this.scale
    // Reuse one slot: a new banner replaces the live one (kill its tween,
    // reset text/color/lane) so center banners can never stack on each other.
    if (!this.bannerText || !this.bannerText.active) {
      this.bannerText = this.add
        .text(width / 2, laneY, text, {
          fontFamily: '"Press Start 2P"',
          fontSize: '10px',
          color,
          stroke: PALETTE_HEX.outline,
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setResolution(2)
        .setDepth(60)
    }
    const banner = this.bannerText
    this.tweens.killTweensOf(banner)
    banner.setText(text).setColor(color).setY(laneY).setAlpha(1)
    this.tweens.add({
      targets: banner,
      alpha: 0,
      y: laneY - 8,
      delay: holdMs,
      duration: 320,
    })
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
    if (this.roundInFlight) return
    if (!this.casino.canBet()) {
      this.showBanner(
        this.casino.mode === 'host' ? 'WALLET NOT READY' : 'STANDALONE DEMO',
        PALETTE_HEX.magenta,
        900,
      )
      return
    }
    const target: any = this.bots[this.selectedTank]
    if (!target) return

    // Wager: ladder value in base units; host mode clamps to risk limits + balance.
    const dec = this.casino.decimals()
    let wager = parseUnits(BET_LADDER[this.betIdx], dec)
    if (this.casino.mode === 'host') {
      const max = this.casino.maxWager(this.selectedTank)
      const bal = this.casino.displayBalance()
      if (max !== undefined && wager > max) wager = max
      if (wager > bal) wager = bal
      if (wager <= 0n) {
        this.showBanner('BET ABOVE LIMIT', PALETTE_HEX.magenta, 900)
        return
      }
    } else if (wager > this.casino.balance) {
      this.showBanner('LOW BANK', PALETTE_HEX.magenta, 900)
      return
    }

    this.roundInFlight = true
    const wagerFinal = wager

    // ---- Presentation: muzzle flash, recoil, shell toward the SELECTED tank ----
    const tip = this.getPlayerBarrelTip()
    this.audio.playSfx('sfx_fire', { volume: 0.25 })
    this.audio.duckMusic(0.6, 120)
    this.cameras.main.shake(120, 0.008)
    this.tweens.add({ targets: [this.playerBase, this.playerTurret], y: this.playerBase.y - 2, duration: 60, yoyo: true, ease: 'Quad.easeOut' })
    const flash = this.add.image(tip.x, tip.y, 'muzzle_1')
    flash.setScale(0.7)
    flash.setRotation(this.playerTurret.rotation)
    flash.setDepth(14)
    this.time.delayedCall(80, () => flash.destroy())

    const destX = target.turret.x
    const destY = target.turret.y
    const shell = this.add.image(tip.x, tip.y, 'shell')
    shell.setScale(0.6)
    shell.setDepth(11)
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

    // ---- Casino brain: VRF decides (host session or standalone crypto word) ----
    const placePromise = this.casino
      .placeRound(wagerFinal, this.selectedTank, this.overdriveOn)
      .catch((err) => {
        console.warn('[casino] round failed:', err)
        return null
      })

    this.tweens.add({
      targets: shell,
      x: destX,
      y: destY,
      duration: 280,
      ease: 'Linear',
      onComplete: () => {
        shell.destroy()
        trailEv.remove()
        // Shell may arrive before settle (host tx ~seconds) — VRF suspense ticker
        this.vrfTicker?.setText('VRF ...').setVisible(true).setAlpha(1)
        this.tweens.add({ targets: this.vrfTicker, alpha: 0.45, duration: 300, yoyo: true, repeat: -1 })
        placePromise.then((result) => {
          this.tweens.killTweensOf(this.vrfTicker ?? [])
          this.vrfTicker?.setVisible(false).setAlpha(1)
          if (result) this.applyOutcome(result, destX, destY, target)
          else {
            this.roundInFlight = false
            this.showBanner('ROUND FAILED', PALETTE_HEX.magenta, 900)
          }
        })
      },
    })
  }

  /** Map a settled VRF outcome to tank-town presentation. Movement/AI never gates payout. */
  private applyOutcome(result: RoundResult, x: number, y: number, target: any) {
    const dec = this.casino.decimals()

    // ---- session stats + streak escalation (cosmetic only — VRF untouched) ----
    const mult = result.wager > 0n ? Number(result.payout) / Number(result.wager) : 0
    const prevStreak = this.stats.streak
    const rec = recordRound(this.stats, result.outcome, mult, OUTCOME_NAMES[result.outcome] || '')
    this.stats = rec.state
    if (result.outcome > 0 && rec.state.streak >= 2) {
      this.time.delayedCall(300, () => {
        this.showBanner(`STREAK ×${rec.state.streak}`, PALETTE_HEX.green, 900, 78)
        this.cameras.main.shake(120, 0.006 + Math.min(rec.state.streak, 6) * 0.001)
        this.audio.playSfx('sfx_coin_tick', { volume: 0.5, rate: Math.min(1 + rec.state.streak * 0.06, 1.5) } as never)
      })
    } else if (result.outcome > 0 && prevStreak === 0) {
      // nothing extra — base win ceremony already handles it
    }
    if (rec.newBest && rec.state.biggestMultX100 > 0 && result.outcome >= 2) {
      this.time.delayedCall(700, () => this.showBanner('NEW BEST!', PALETTE_HEX.yellow, 1400))
    }
    const finish = () => {
      this.casino.reveal(result.sessionId).then(() => {
        this.roundInFlight = false
        this.refreshCasinoHud()
      })
    }

    const payoutText = (txt: string, color: string) => {
      // Float BELOW the tank (count-up ×N lives above at y-30) so the two
      // never drift through each other.
      const t = this.add
        .text(x, y + 22, txt, {
          fontFamily: '"VT323"',
          fontSize: '14px',
          color,
          stroke: PALETTE_HEX.outline,
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setResolution(2)
        .setDepth(20)
      this.tweens.add({ targets: t, y: y + 32, alpha: 0, duration: 900, ease: 'Quad.easeOut', onComplete: () => t.destroy() })
    }

    // MISS — dust puff short of the hull, no contact
    if (result.outcome === 0) {
      this.audio.playSfx('sfx_explosion_small', { volume: 0.3 })
      const dust = this.add.image(x + 10, y - 8, 'explosion_small_1')
      dust.setScale(0.6).setAlpha(0.6).setTint(0xaaaaaa).setDepth(13)
      this.tweens.add({ targets: dust, scale: 1.1, alpha: 0, duration: 240, onComplete: () => dust.destroy() })
      this.showBanner('MISS', PALETTE_HEX.white, 800)
      finish()
      return
    }

    // Overdrive branch — committed at openSession, revealed here.
    if (result.overdriveTaken && !result.overdriveWon) {
      this.audio.playSfx('sfx_miss', { volume: 0.6 })
      const bust = this.add.image(x, y, 'explosion_small_1')
      bust.setScale(0.8).setTint(0xff4f4f).setDepth(14)
      this.tweens.add({ targets: bust, scale: 1.4, alpha: 0, duration: 300, onComplete: () => bust.destroy() })
      this.showBanner('OVERDRIVE BUST', PALETTE_HEX.magenta, 1200)
      payoutText('BUST', PALETTE_HEX.magenta)
      finish()
      return
    }

    // Contact tiers: GLANCE grazes, SOLID/CRIT/JACKPOT kill the tank.
    const killed = result.outcome >= 2
    const names = OUTCOME_NAMES
    const tierColor =
      result.outcome === 4 ? PALETTE_HEX.yellow : result.outcome === 3 ? PALETTE_HEX.magenta : PALETTE_HEX.cyan
    if (result.overdriveTaken && result.overdriveWon) {
      this.showBanner(`OVERDRIVE ${names[result.outcome]}!`, tierColor, 1400)
    } else {
      this.showBanner(names[result.outcome], tierColor, 1000)
    }

    if (killed) {
      // Forced kill: presentation of the VRF tier — aim/movement never gates payout.
      ;(target as any).hits = 1
      ;(target as any).hit(this)
      if (result.outcome === 4) {
        // JACKPOT: lotto fanfare + coin fountain + flash
        this.audio.playSfx('sfx_jackpot', { volume: 0.9 })
        this.cameras.main.flash(200, 255, 217, 79)
        for (let c = 0; c < 12; c++) {
          const cx = x + Phaser.Math.Between(-14, 14)
          const coin = this.add.image(cx, y, 'coin_1')
          coin.setScale(0.55)
          coin.setDepth(12)
          this.time.delayedCall(c * 45, () => this.audio.playSfx('sfx_coin_tick', { volume: 0.5 }))
          this.tweens.add({
            targets: coin,
            y: y - 16 - (c % 4) * 5,
            x: cx + (c % 2 === 0 ? 7 : -7),
            alpha: 0,
            duration: 520,
            ease: 'Quad.easeOut',
            delay: c * 24,
            onComplete: () => coin.destroy(),
          })
        }
        this.time.delayedCall(760, () => this.respawnEnemy(this.selectedTank))
      } else {
        this.audio.playSfx('sfx_win', { volume: 0.55 })
        for (let c = 0; c < 4; c++) this.time.delayedCall(c * 70, () => this.audio.playSfx('sfx_coin_tick', { volume: 0.5 }))
        for (let c = 0; c < 6; c++) {
          const cx = x + Phaser.Math.Between(-8, 8)
          const coin = this.add.image(cx, y, 'coin_1')
          coin.setScale(0.55)
          coin.setDepth(12)
          this.tweens.add({
            targets: coin,
            y: y - 14 - (c % 3) * 4,
            x: cx + (c % 2 === 0 ? 5 : -5),
            alpha: 0,
            duration: 420,
            ease: 'Quad.easeOut',
            delay: c * 18,
            onComplete: () => coin.destroy(),
          })
        }
        this.time.delayedCall(760, () => this.respawnEnemy(this.selectedTank))
      }
    } else {
      // GLANCE — grazed hull: flash + small explosion, tank survives
      target.base.setTint(0xffffff)
      target.turret.setTint(0xffffff)
      this.time.delayedCall(90, () => {
        if (target.base.active) { target.base.clearTint(); target.base.setTint(target.tintColor) }
        if (target.turret.active) { target.turret.clearTint(); target.turret.setTint(target.tintColor) }
      })
      this.audio.playSfx('sfx_explosion_small', { volume: 0.5 })
      const exp = this.add.image(x, y, 'explosion_small_1')
      exp.setScale(1.0).setDepth(14)
      this.tweens.add({ targets: exp, scale: 1.5, alpha: 0, duration: 220, onComplete: () => exp.destroy() })
    }

    // Payout ceremony: glance = instant float; ≥2× = tier-scaled count-up
    // (docs/research/ui_feedback.md §5 durations via CountUp) + token amount.
    if (result.payout > 0n) {
      const amount = formatUnits(result.payout, dec)
      if (result.outcome >= 2) {
        const multText = this.add
          .text(x, y - 30, '×0.00', {
            fontFamily: '"Press Start 2P"',
            fontSize: '11px',
            color: result.outcome === 4 ? PALETTE_HEX.yellow : PALETTE_HEX.green,
            stroke: PALETTE_HEX.outline,
            strokeThickness: 2,
          })
          .setOrigin(0.5)
          .setResolution(2)
          .setDepth(21)
        const mult = Number(result.payout) / Number(result.wager || 1n)
        new CountUp(this, multText).start(mult, {
          playTick: () => this.audio.playSfx('sfx_coin_tick', { volume: 0.5 }),
          playPop: () => this.audio.playSfx('sfx_ui_blip', { volume: 0.5 }),
        })
        payoutText(`+${amount}`, PALETTE_HEX.yellow)
        if (result.outcome === 4) {
          // jackpot camera pulse
          this.cameras.main.zoomTo(1.06, 150, 'Sine.easeOut', true)
          this.time.delayedCall(320, () => this.cameras.main.zoomTo(1, 240, 'Sine.easeIn', true))
        }
      } else {
        payoutText(`+${amount}`, PALETTE_HEX.cyan)
        this.audio.playSfx('sfx_win', { volume: 0.45 })
      }
    }
    if (result.wager > 0n) {
      this.totalGains += Number(result.payout) / Number(result.wager)
      this.updateGainsHud()
    }
    finish()
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

  // ---- Game Over ---- (Fix #3: guard isGameOver + gameOverShown ensures only once, even if multiple shells hit after death)
  private triggerGameOver() {
    if (this.gameOverShown || this.isGameOver) return
    if (this.gameOverContainer) return
    // Set both flags synchronously BEFORE any delayedCall/popup to prevent race from multiple shells
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
    // Fix #3: ensure popup is created only once — guard double trigger from multiple shells
    if (this.gameOverContainer) return
    if (!this.isGameOver && !this.gameOverShown) return
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

    // Play new Game Over jingle sfx_gameover (CC0 GAMEOVER.wav trimmed + loudnorm) — replaces sfx_miss losegamemusic
    // Fallback chain: sfx_gameover -> sfx_gameover_new -> sfx_miss
    if (this.cache.audio.exists('sfx_gameover')) this.audio.playSfx('sfx_gameover', { volume: 0.75 })
    else if (this.cache.audio.exists('sfx_gameover_new')) this.audio.playSfx('sfx_gameover_new', { volume: 0.75 })
    else this.audio.playSfx('sfx_miss', { volume: 0.75 })

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
          this.audio.playSfx('sfx_win', { volume: 0.55 })
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
    // Fix #3: guard RETRY to only once — prevent multiple scene.restart calls from rapid inputs
    if (!this.isGameOver) return
    if ((this as any)._retrying) return
    ;(this as any)._retrying = true
    // Fix #4: reset enemy shooting timers and Game Over flags BEFORE restart so next create starts clean
    // Without this, stale nextFireTime (past) or lingering isGameOver=true can cause bots to not shoot after RETRY
    this.isGameOver = false
    // keep gameOverShown true until create resets it, but prevent further triggers
    this.countUp?.stop()
    this.audio.playSfx('sfx_ui_blip')
    // Reset per-bot nextFireTime to future so enemies shoot endlessly after restart (until player dies again)
    const now = this.time.now
    this.nextEnemyFireTime = now + 900
    this.bots.forEach((b: any, idx: number) => {
      const interval = (b as any).fireInterval ?? 1800
      ;(b as any).nextFireTime = now + interval + idx * 650 + Phaser.Math.Between(150, 400)
      ;(b as any).isWindingUp = false
    })
    this.playerInvulnerableUntil = 0
    this.playerBlinkTween?.stop()
    this.playerBlinkTween = undefined
    // Fade out then restart scene cleanly
    if (this.gameOverContainer) {
      this.tweens.add({
        targets: [this.gameOverContainer, this.gameOverBackdrop],
        alpha: 0,
        scale: 0.96,
        duration: 140,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          ;(this as any)._retrying = false
          this.scene.restart()
        },
      })
    } else {
      ;(this as any)._retrying = false
      this.scene.restart()
    }
    // Also restart via fade
    this.cameras.main.fadeOut(180, 0, 0, 0)
  }
}
