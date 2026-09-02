import Phaser from 'phaser'
import { PALETTE, PALETTE_HEX } from '../../config/palette'

export class Title extends Phaser.Scene {
  private attractIndex = 0
  private attractTimer?: Phaser.Time.TimerEvent
  private playerTank!: Phaser.GameObjects.Rectangle
  private enemyTanks: Phaser.GameObjects.Rectangle[] = []
  private enemyPositions: { x: number; y: number }[] = []
  private startText!: Phaser.GameObjects.Text
  private orTapText!: Phaser.GameObjects.Text

  constructor() {
    super('Title')
  }

  create() {
    const { width, height } = this.scale

    // ---- 1. Background: Starfield (navy #0a1a3f base, white dots) ----
    this.add.rectangle(width / 2, height / 2, width, height, PALETTE.navy)
    // Deterministic starfield (no Math.random) — parallax simple: 40 dots
    for (let i = 0; i < 40; i++) {
      const x = (i * 73 + 17) % width
      const y = (i * 41 + 29) % (height - 30) // keep above ground
      const size = i % 3 === 0 ? 1 : 1
      const dot = this.add.rectangle(x, y, size, size, PALETTE.white)
      dot.setAlpha(0.6 + ((i * 7) % 4) * 0.1)
      // subtle parallax tween for some stars
      if (i % 5 === 0) {
        this.tweens.add({
          targets: dot,
          alpha: 0.3,
          duration: 1200 + (i % 4) * 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: (i * 83) % 800,
        })
      }
    }
    // Ground line
    this.add.rectangle(width / 2, 150, width, 2, PALETTE.outline)

    // ---- Arena: Player tank bottom-center idle-bob 2 frames ----
    this.playerTank = this.add.rectangle(160, 148, 26, 14, PALETTE.cyan)
    this.playerTank.setStrokeStyle(1, PALETTE.outline)
    // idle bob animation via tween (no sprite sheet yet, just y bob)
    this.tweens.add({
      targets: this.playerTank,
      y: 149,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
    // Player label small?
    // Bunkers under enemies (sandbag) — 3 bunkers
    for (let i = 0; i < 3; i++) {
      const bx = 64 + i * 96
      const bunker = this.add.rectangle(bx, 78, 36, 10, PALETTE.navy)
      bunker.setStrokeStyle(1, PALETTE.outline)
    }

    // ---- 3 Enemy tanks in bunkers across top: SCOUT cyan, BRUISER magenta, WARLORD white/gray ----
    const enemies = [
      { x: 64, y: 66, color: PALETTE.cyan, name: 'SCOUT', mult: '×30' },
      { x: 160, y: 66, color: PALETTE.magenta, name: 'BRUISER', mult: '×15' },
      { x: 256, y: 66, color: PALETTE.white, name: 'WARLORD', mult: '×11' },
    ]
    this.enemyPositions = enemies.map((e) => ({ x: e.x, y: e.y }))
    enemies.forEach((e) => {
      const tank = this.add.rectangle(e.x, e.y, 22, 14, e.color)
      tank.setStrokeStyle(1, PALETTE.outline)
      this.enemyTanks.push(tank)

      // Label multiplier in Press Start 2P
      this.add
        .text(e.x, e.y + 16, e.mult, {
          fontFamily: '"Press Start 2P"',
          fontSize: '7px',
          color: e.mult === '×30' ? PALETTE_HEX.yellow : PALETTE_HEX.white,
          stroke: PALETTE_HEX.outline,
          strokeThickness: 1,
        })
        .setOrigin(0.5)

      this.add
        .text(e.x, e.y - 14, e.name, {
          fontFamily: '"VT323"',
          fontSize: '8px',
          color: PALETTE_HEX.white,
        })
        .setOrigin(0.5)
    })

    // ---- CRT scanline + vignette overlay (same as game scene) ----
    // Scanline as graphics overlay (in-scene, not just HTML)
    const scanG = this.add.graphics()
    scanG.fillStyle(0xffffff, 0.04)
    for (let y = 0; y < height; y += 4) {
      scanG.fillRect(0, y, width, 1)
    }
    scanG.setDepth(90)
    // Vignette
    const vignette = this.add.graphics()
    vignette.fillStyle(0x000000, 0)
    // subtle vignette via rectangle with alpha gradient not perfect, use overlay rect
    const vRect = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
    vRect.setAlpha(0.15)
    vRect.setDepth(90)

    // Ensure NEAREST
    this.textures.get('__WHITE').setFilter(Phaser.Textures.FilterMode.NEAREST)

    // ---- 3. Title Modal (keep what works) ----
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

    // Audio toggles (persisted)
    const audioState = this.getAudioState()
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
      .setAlpha(audioState.music ? 1 : 0.35)
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
      .setAlpha(audioState.sfx ? 1 : 0.35)
      .setInteractive({ useHandCursor: true })

    const saveAudio = (music: boolean, sfx: boolean) => {
      localStorage.setItem('roboStrike_audio_v1', JSON.stringify({ music, sfx }))
    }
    musicToggle.on('pointerdown', () => {
      const cur = JSON.parse(localStorage.getItem('roboStrike_audio_v1') || '{"music":true,"sfx":true}')
      cur.music = !cur.music
      saveAudio(cur.music, cur.sfx)
      musicToggle.setAlpha(cur.music ? 1 : 0.35)
      // block propagation so not to trigger start
    })
    sfxToggle.on('pointerdown', () => {
      const cur = JSON.parse(localStorage.getItem('roboStrike_audio_v1') || '{"music":true,"sfx":true}')
      cur.sfx = !cur.sfx
      saveAudio(cur.music, cur.sfx)
      sfxToggle.setAlpha(cur.sfx ? 1 : 0.35)
    })
    // Stop propagation for toggles so click on toggle doesn't start game
    musicToggle.on('pointerdown', (_p: any, _x: any, _y: any, e: any) => e?.stopPropagation?.())
    sfxToggle.on('pointerdown', (_p: any, _x: any, _y: any, e: any) => e?.stopPropagation?.())

    // PRESS FIRE TO START blink 1Hz (500ms on/off)
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

    // Verify widget embed is official — widget is in index.html <script async src="https://jam.chain.wtf/widget.js">
    // No hand-made badge here; if needed, we would delete it. So nothing to add.

    // ---- 2. Attract Loop every 4s (deterministic, no Math.random) ----
    this.attractTimer = this.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => this.playAttract(),
    })
    // Play first attract after 1200ms so player sees title first
    this.time.delayedCall(1200, () => this.playAttract())

    // ---- 4. Input Handling ----
    const startGame = () => {
      // prevent double trigger
      if ((this as any)._starting) return
      ;(this as any)._starting = true
      if (this.attractTimer) this.attractTimer.remove()
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('Game')
      })
    }

    // Click/tap anywhere
    this.input.on('pointerdown', startGame)
    // Keyboard
    this.input.keyboard?.on('keydown-SPACE', startGame)
    this.input.keyboard?.on('keydown-ENTER', startGame)
    // Also F key as FIRE
    this.input.keyboard?.on('keydown-F', startGame)
  }

  private getAudioState(): { music: boolean; sfx: boolean } {
    try {
      const raw = localStorage.getItem('roboStrike_audio_v1')
      if (raw) return JSON.parse(raw)
    } catch {}
    return { music: true, sfx: true }
  }

  private playAttract() {
    if ((this as any)._starting) return
    const idx = this.attractIndex % this.enemyPositions.length
    this.attractIndex++
    const target = this.enemyPositions[idx]
    const start = { x: this.playerTank.x, y: this.playerTank.y - 4 }

    // Tank recoil: short y kick
    this.tweens.add({
      targets: this.playerTank,
      y: start.y - 3,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
    })

    // Muzzle flash at player
    const flash = this.add.rectangle(start.x + 8, start.y, 8, 4, PALETTE.white)
    flash.setDepth(5)
    this.time.delayedCall(70, () => flash.destroy())

    // Shell
    const shell = this.add.rectangle(start.x, start.y, 4, 2, PALETTE.yellow)
    shell.setStrokeStyle(1, PALETTE.outline)
    shell.setDepth(6)
    // Trail
    const trailEmitters: Phaser.GameObjects.Rectangle[] = []
    const trailTimer = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (!shell.active) {
          trailTimer.remove()
          return
        }
        const t = this.add.rectangle(shell.x, shell.y, 2, 2, PALETTE.yellow)
        t.setAlpha(0.7)
        trailEmitters.push(t)
        this.tweens.add({
          targets: t,
          alpha: 0,
          scale: 0.5,
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
        // Hit flash on enemy
        const enemy = this.enemyTanks[idx]
        const origColor = enemy.fillColor
        enemy.setFillStyle(PALETTE.white, 1)
        this.time.delayedCall(80, () => enemy.setFillStyle(origColor, 1))
        // Shake
        this.cameras.main.shake(120, 0.006)
        // Explosion: 4-frame small flash + expanding circle
        const exp = this.add.circle(target.x, target.y, 4, PALETTE.yellow)
        exp.setStrokeStyle(1, PALETTE.outline)
        exp.setDepth(7)
        this.tweens.add({
          targets: exp,
          radius: 18,
          alpha: 0,
          duration: 260,
          ease: 'Quad.easeOut',
          onUpdate: () => exp.setRadius(exp.radius),
          onComplete: () => exp.destroy(),
        })
        // Additional explosion particles (4 small squares)
        for (let p = 0; p < 4; p++) {
          const angle = (p * 90) * (Math.PI / 180) // deterministic angles 0,90,180,270 — no Math.random, use p
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
        // Coin burst: 6 coins rising
        for (let c = 0; c < 6; c++) {
          const cx = target.x + ((c * 7) % 13) - 6 // deterministic offset, no Math.random
          const coin = this.add.rectangle(cx, target.y, 4, 4, PALETTE.yellow)
          coin.setStrokeStyle(1, PALETTE.outline)
          coin.setDepth(8)
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
