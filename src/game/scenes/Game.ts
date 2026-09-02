import Phaser from 'phaser'
import { PALETTE_HEX } from '../../config/palette'
import { AudioManager } from '../systems/AudioManager'

export class Game extends Phaser.Scene {
  private audio!: AudioManager
  private playerBase!: Phaser.GameObjects.Image
  private playerTurret!: Phaser.GameObjects.Image
  private enemyBases: Phaser.GameObjects.Image[] = []
  private enemyTurrets: Phaser.GameObjects.Image[] = []
  private enemyData: { base: Phaser.GameObjects.Image; turret: Phaser.GameObjects.Image; dir: number; speed: number; t: number }[] = []
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }
  private borderPath!: Phaser.Curves.Path

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

    // Border path for patrol — inset 20px rectangle perimeter
    this.borderPath = new Phaser.Curves.Path(20, 20)
    this.borderPath.lineTo(width - 20, 20)
    this.borderPath.lineTo(width - 20, height - 40)
    this.borderPath.lineTo(20, height - 40)
    this.borderPath.lineTo(20, 20)
    // Debug: show border faint
    const g = this.add.graphics()
    g.lineStyle(1, 0x1a1a1a, 0.15)
    g.strokeRect(20, 20, width - 40, height - 60)

    // Player — base + turret, movable
    this.playerBase = this.add.image(60, height - 70, 'player_base')
    this.playerBase.setScale(0.85)
    this.playerTurret = this.add.image(60, height - 70, 'player_turret')
    this.playerTurret.setScale(0.85)
    this.playerTurret.setOrigin(0.5, 0.7)
    this.playerBase.setDepth(2)
    this.playerTurret.setDepth(3)

    // Input: cursor + WASD + click-to-move
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      // Click-to-move: lerp player toward pointer (throttled cosmetic)
      this.tweens.add({ targets: [this.playerBase, this.playerTurret], x: Phaser.Math.Clamp(p.x, 24, width - 24), y: Phaser.Math.Clamp(p.y, 40, height - 40), duration: 220, ease: 'Quad.easeOut' })
    })

    // 3 enemies — move around border at random order any direction (deterministic seeded)
    const configs = [
      { base: 'enemy1_base', turret: 'enemy1_turret', name: 'SCOUT', mult: '×30' },
      { base: 'enemy2_base', turret: 'enemy2_turret', name: 'BRUISER', mult: '×15' },
      { base: 'enemy3_base', turret: 'enemy3_turret', name: 'WARLORD', mult: '×11' },
    ]
    configs.forEach((c, idx) => {
      // Random order: deterministic shuffle based on idx
      const t = (idx * 0.33 + 0.17) % 1 // 0.17, 0.5, 0.83
      const dir = idx % 2 === 0 ? 1 : -1 // any direction
      const speed = 0.00018 + (idx * 0.00007) // 0.00018, 0.00025, 0.00032
      const pt = this.borderPath.getPoint(t)
      this.add.image(pt.x, pt.y + 10, 'bunker_intact').setScale(0.9).setOrigin(0.5).setDepth(-1).setAlpha(0.3)
      const base = this.add.image(pt.x, pt.y, c.base)
      base.setScale(0.85)
      const turret = this.add.image(pt.x, pt.y, c.turret)
      turret.setScale(0.85)
      turret.setOrigin(0.5, 0.7)
      this.enemyBases.push(base)
      this.enemyTurrets.push(turret)
      this.enemyData.push({ base, turret, dir, speed, t })

      this.add
        .text(Math.round(pt.x), Math.round(pt.y + 18), c.mult, {
          fontFamily: '"Press Start 2P"',
          fontSize: '8px',
          color: c.mult === '×30' ? PALETTE_HEX.yellow : PALETTE_HEX.white,
          stroke: PALETTE_HEX.outline,
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setResolution(2)
        .setDepth(5)

      this.add
        .text(Math.round(pt.x), Math.round(pt.y - 14), c.name, {
          fontFamily: '"VT323"',
          fontSize: '10px',
          color: PALETTE_HEX.white,
        })
        .setOrigin(0.5)
        .setResolution(2)
        .setDepth(5)

      base.setInteractive({ useHandCursor: true })
      turret.setInteractive({ useHandCursor: true })
      const pick = () => this.handlePick(idx)
      base.on('pointerdown', pick)
      turret.on('pointerdown', pick)
    })

    this.add
      .text(16, 16, 'BET 10', {
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
      .text(width / 2, height - 5, '320×240 4:3 • MOVE WASD/CLICK • AI HUNTS • CASINO', {
        fontFamily: '"VT323"',
        fontSize: '7px',
        color: '#666',
      })
      .setOrigin(0.5)

    this.textures.get('__WHITE').setFilter(Phaser.Textures.FilterMode.NEAREST)
  }

  update(_: number, delta: number) {
    const { width, height } = this.scale
    // Player movement WASD (throttled cosmetic, not skill — 1.6px per frame ~96px/sec)
    const speed = 1.6
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

    // Enemy border patrol — random order any direction (deterministic t + dir*speed)
    this.enemyData.forEach((e) => {
      e.t = (e.t + e.dir * e.speed * delta) % 1
      if (e.t < 0) e.t += 1
      const pt = this.borderPath.getPoint(e.t)
      e.base.x = pt.x
      e.base.y = pt.y
      e.turret.x = pt.x
      e.turret.y = pt.y
      // AI turret aims at player without hesitation
      const angle = Phaser.Math.Angle.Between(e.turret.x, e.turret.y, this.playerBase.x, this.playerBase.y)
      // lerp for snappy but not instant
      const targetRot = angle + Math.PI / 2
      e.turret.rotation = Phaser.Math.Angle.RotateTo(e.turret.rotation, targetRot, 0.18)
    })
    // Player turret aims at closest enemy
    if (this.enemyTurrets[1]) {
      const tx = this.enemyTurrets[1].x
      const ty = this.enemyTurrets[1].y
      const pAngle = Phaser.Math.Angle.Between(this.playerTurret.x, this.playerTurret.y, tx, ty)
      this.playerTurret.rotation = Phaser.Math.Angle.RotateTo(this.playerTurret.rotation, pAngle + Math.PI / 2, 0.22)
    }
  }

  private handlePick(index: number) {
    const labels = ['SCOUT', 'BRUISER', 'WARLORD']
    this.audio.playSfx('sfx_ui_blip')
    const t = this.add.text(160, 100, `PICKED ${labels[index]}`, {
      fontFamily: '"VT323"',
      fontSize: '10px',
      color: '#fff',
    })
    t.setOrigin(0.5)
    this.tweens.add({ targets: t, alpha: 0, duration: 800, onComplete: () => t.destroy() })
    // Snap player turret to picked
    const target = this.enemyTurrets[index]
    const angle = Phaser.Math.Angle.Between(this.playerTurret.x, this.playerTurret.y, target.x, target.y)
    this.tweens.add({ targets: this.playerTurret, rotation: angle + Math.PI / 2, duration: 140, ease: 'Quad.easeOut' })
  }

  private handleFire() {
    this.audio.playSfx('sfx_fire', { volume: 0.85 })
    this.audio.duckMusic()
    this.cameras.main.shake(120, 0.008)
    this.tweens.add({ targets: [this.playerBase, this.playerTurret], y: this.playerBase.y - 2, duration: 60, yoyo: true, ease: 'Quad.easeOut' })
    const flash = this.add.image(this.playerTurret.x, this.playerTurret.y - 10, 'muzzle_1')
    flash.setScale(0.7)
    this.time.delayedCall(80, () => flash.destroy())
    // Find closest enemy for demo hit
    let bestIdx = 0
    let bestDist = Infinity
    this.enemyTurrets.forEach((tur, i) => {
      const d = Phaser.Math.Distance.Between(this.playerTurret.x, this.playerTurret.y, tur.x, tur.y)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    })
    const target = this.enemyTurrets[bestIdx]
    const shell = this.add.image(this.playerTurret.x, this.playerTurret.y - 8, 'shell')
    shell.setScale(0.6)
    this.tweens.add({
      targets: shell,
      x: target.x,
      y: target.y,
      duration: 280,
      onComplete: () => {
        shell.destroy()
        this.audio.playSfx('sfx_explosion_small', { volume: 0.8 })
        const exp = this.add.image(target.x, target.y, 'explosion_small_1')
        exp.setScale(1.2)
        this.tweens.add({ targets: exp, scale: 1.8, alpha: 0, duration: 260, onComplete: () => exp.destroy() })
        // Hit flash
        this.enemyBases[bestIdx].setTint(0xffffff)
        this.enemyTurrets[bestIdx].setTint(0xffffff)
        this.time.delayedCall(80, () => {
          this.enemyBases[bestIdx].clearTint()
          this.enemyTurrets[bestIdx].clearTint()
        })
        // Coin burst
        this.audio.playSfx('sfx_win', { volume: 0.6 })
        for (let c = 0; c < 3; c++) this.time.delayedCall(c * 80, () => this.audio.playSfx('sfx_coin_tick', { volume: 0.5 }))
        // Respawn: when you kill one, different one reappears (cosmetic — keep casino single session)
        this.time.delayedCall(520, () => this.respawnEnemy(bestIdx))
      },
    })
  }

  private respawnEnemy(idx: number) {
    // Fade out and teleport to random border point, fade in as "different" bot (cycle tint)
    const base = this.enemyBases[idx]
    const turret = this.enemyTurrets[idx]
    this.tweens.add({
      targets: [base, turret],
      alpha: 0,
      scale: 0.2,
      duration: 180,
      onComplete: () => {
        const t = (idx * 0.33 + 0.5) % 1 // new random order position
        const pt = this.borderPath.getPoint(t)
        base.x = pt.x
        base.y = pt.y
        turret.x = pt.x
        turret.y = pt.y
        this.enemyData[idx].t = t
        // Slightly change appearance to feel "different bot" — tint cycle
        const tints = [0x4ff2e3, 0xff4fd8, 0xffd94f, 0x58ff9b]
        const tint = tints[(idx + 1) % tints.length]
        base.setTint(tint)
        turret.setTint(tint)
        this.tweens.add({
          targets: [base, turret],
          alpha: 1,
          scale: 0.85,
          duration: 220,
          onComplete: () => {
            base.clearTint()
            turret.clearTint()
          },
        })
      },
    })
  }
}
