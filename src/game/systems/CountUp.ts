import Phaser from 'phaser'

/**
 * CountUp: tween from 0.00x to targetMult with coin ticks.
 * easeOutCubic under 6x, Expo at 6x and above. Final pop scale + blip.
 */
export type CountUpTier = 'glance' | 'solid' | 'crit' | 'jackpot'

function tierConfig(mult: number): { duration: number; ease: string; step: number } {
  if (mult >= 15) return { duration: 2800, ease: 'Expo.easeOut', step: 0.5 }
  if (mult >= 6) return { duration: 2000, ease: 'Expo.easeOut', step: 0.3 }
  if (mult >= 2) return { duration: 1200, ease: 'Cubic.easeOut', step: 0.2 }
  return { duration: 800, ease: 'Cubic.easeOut', step: 0.1 }
}

export class CountUp {
  private tween: Phaser.Tweens.Tween | null = null
  private lastTickKey = -1

  constructor(
    private scene: Phaser.Scene,
    private label: Phaser.GameObjects.Text
  ) {}

  /** Count from 0.00x to targetMult inclusive, ticking via audio callbacks. */
  start(
    targetMult: number,
    audio: { playTick(): void; playWin?(): void; playPop?(): void }
  ) {
    this.stop()
    const { duration, ease, step } = tierConfig(targetMult)
    const decimals = 2
    this.lastTickKey = -1
    // start win tail early if provided
    if (audio.playWin) audio.playWin()

    // clamp target to 2 decimals for display, but tween raw value
    this.tween = this.scene.tweens.addCounter({
      from: 0,
      to: targetMult,
      duration,
      ease,
      onUpdate: (tween) => {
        const v: number = tween.getValue()!
        this.label.setText(v.toFixed(decimals) + '×')
        const key = Math.floor(v / step)
        if (key !== this.lastTickKey) {
          this.lastTickKey = key
          if (v > 0.001) audio.playTick()
        }
      },
      onComplete: () => {
        this.label.setText(targetMult.toFixed(decimals) + '×')
        if (audio.playPop) audio.playPop()
        this.scene.tweens.add({
          targets: this.label,
          scale: { from: 1, to: 1.18 },
          duration: 70,
          ease: 'Back.easeOut',
          yoyo: true,
          onComplete: () => this.label.setScale(1),
        })
      },
    })
  }

  /** Fast-forward to the final value on FIRE. */
  skipToEnd() {
    if (!this.tween) return
    try {
      ;(this.tween as any).seek?.((this.tween as any).duration)
      this.tween.complete()
    } catch {
      this.tween.stop()
    }
  }

  stop() {
    if (this.tween) {
      try {
        this.tween.stop()
        this.tween.remove()
      } catch {}
      this.tween = null
    }
  }

  get isPlaying() {
    return (this.tween as any)?.isPlaying?.() ?? false
  }

  get duration() {
    return (this.tween as any)?.duration ?? 0
  }
}
