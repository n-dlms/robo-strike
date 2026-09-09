// ============================================================================
// PaytablePanel — one-tap odds panel (key T / "ODDS" chip). Serves Simplicity
// ("no manual needed") + the "recognizably a casino game" eligibility gate:
// players and judges see the exact probabilities and multipliers per tank,
// derived live from the single-source paytables (never hand-typed).
// ============================================================================
import Phaser from 'phaser'
import { PALETTE, PALETTE_HEX } from '../../config/palette'
import { BOUNDARIES, MULT_RATIONAL, TANK_NAMES, type TankId } from '../../config/paytables'

export class PaytablePanel {
  private container?: Phaser.GameObjects.Container
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  get isOpen(): boolean {
    return this.container !== undefined
  }

  toggle(): void {
    if (this.container) this.close()
    else this.open()
  }

  close(): void {
    this.container?.destroy()
    this.container = undefined
  }

  private open(): void {
    const { width, height } = this.scene.scale
    const c = this.scene.add.container(width / 2, height / 2).setDepth(80)
    this.container = c

    // dim backdrop — click anywhere closes
    const backdrop = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.55).setInteractive()
    backdrop.on('pointerdown', () => this.close())
    c.add(backdrop)

    const W = 288
    const H = 120
    const g = this.scene.add.graphics()
    g.fillStyle(PALETTE.navy, 0.96)
    g.lineStyle(1, PALETTE.outline, 1)
    g.fillRoundedRect(-W / 2, -H / 2, W, H, 6)
    g.strokeRoundedRect(-W / 2, -H / 2, W, H, 6)
    g.lineStyle(1, PALETTE.cyan, 0.25)
    g.strokeRoundedRect(-W / 2 + 1, -H / 2 + 1, W - 2, H - 2, 5)
    c.add(g)

    const title = this.scene.add
      .text(0, -H / 2 + 10, 'PAYTABLE — 95% RTP', {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: PALETTE_HEX.yellow,
        stroke: PALETTE_HEX.outline,
        strokeThickness: 1,
      })
      .setOrigin(0.5, 0)
      .setResolution(2)
    c.add(title)

    // three tank columns, derived from the single-source paytable
    const colW = 92
    const accents = [PALETTE_HEX.cyan, PALETTE_HEX.magenta, PALETTE_HEX.green]
    const multColors = [PALETTE_HEX.white, PALETTE_HEX.cyan, PALETTE_HEX.green, PALETTE_HEX.magenta, PALETTE_HEX.yellow]
    for (let t = 0; t < 3; t++) {
      const tank = t as TankId
      const cx = -colW + t * colW
      const name = this.scene.add
        .text(cx, -H / 2 + 26, TANK_NAMES[t], {
          fontFamily: '"Press Start 2P"',
          fontSize: '7px',
          color: accents[t],
          stroke: PALETTE_HEX.outline,
          strokeThickness: 1,
        })
        .setOrigin(0.5, 0)
        .setResolution(2)
      c.add(name)

      const bs = BOUNDARIES[tank]
      let prev = 0
      for (let i = 0; i < bs.length; i++) {
        const pct = bs[i] - prev
        prev = bs[i]
        const [num, den] = MULT_RATIONAL[tank][i]
        const mult = Number(num) / Number(den)
        const line = `${String(pct).padStart(2, ' ')}%  ×${mult % 1 === 0 ? mult.toFixed(0) : mult.toFixed(1)}`
        const row = this.scene.add
          .text(cx, -H / 2 + 42 + i * 12, line, {
            fontFamily: '"VT323"',
            fontSize: '12px',
            color: i === 0 ? PALETTE_HEX.white : multColors[i],
          })
          .setOrigin(0.5, 0)
        c.add(row)
      }
    }

    const footer = this.scene.add
      .text(0, H / 2 - 9, 'VRF SETTLES EVERY ROUND · OVERDRIVE: 40% → ×2.5 ON WINS ≥2× · T / TAP TO CLOSE', {
        fontFamily: '"VT323"',
        fontSize: '8px',
        color: PALETTE_HEX.cyan,
      })
      .setOrigin(0.5, 1)
    c.add(footer)
  }
}
