import Phaser from 'phaser'

export class AudioManager {
  private scene: Phaser.Scene
  private music?: Phaser.Sound.BaseSound
  private sfxEnabled = true
  private musicEnabled = true

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const saved = this.loadState()
    this.sfxEnabled = saved.sfx
    this.musicEnabled = saved.music
  }

  private loadState(): { music: boolean; sfx: boolean } {
    try {
      const raw = localStorage.getItem('roboStrike_audio_v1')
      if (raw) return JSON.parse(raw)
    } catch {}
    return { music: true, sfx: true }
  }

  private saveState() {
    localStorage.setItem('roboStrike_audio_v1', JSON.stringify({ music: this.musicEnabled, sfx: this.sfxEnabled }))
  }

  getState() {
    return { music: this.musicEnabled, sfx: this.sfxEnabled }
  }

  setMusicEnabled(v: boolean) {
    this.musicEnabled = v
    this.saveState()
    if (this.music) {
      if (v) (this.music as any).resume?.()
      else (this.music as any).pause?.()
      ;(this.music as any).setVolume?.(v ? 0.45 : 0)
    }
  }

  setSfxEnabled(v: boolean) {
    this.sfxEnabled = v
    this.saveState()
  }

  toggleMusic() {
    this.setMusicEnabled(!this.musicEnabled)
    return this.musicEnabled
  }

  toggleSfx() {
    this.setSfxEnabled(!this.sfxEnabled)
    return this.sfxEnabled
  }

  initMusic(key = 'music_loop') {
    if (this.scene.cache.audio.exists(key)) {
      this.attachMusic(key)
      return
    }
    // Lazy path — music_loop deferred out of Boot preload for the ≤1.2MB wire
    // budget; fetches in the background while the title screen plays SFX.
    if (this.scene.cache.json.exists('__music_loading_' + key)) return
    this.scene.cache.json.add('__music_loading_' + key, true)
    this.scene.load.audio(key, [`assets/audio/${key}.ogg`, `assets/audio/${key}.wav`])
    this.scene.load.once('complete', () => {
      this.scene.cache.json.remove('__music_loading_' + key)
      this.attachMusic(key)
    })
    this.scene.load.start()
  }

  private attachMusic(key: string) {
    if (!this.scene.cache.audio.exists(key)) return
    this.music = this.scene.sound.add(key, { loop: true, volume: this.musicEnabled ? 0.45 : 0 })
    if (this.musicEnabled) {
      const tryPlay = () => {
        if (this.musicEnabled && !(this.music as any).isPlaying) (this.music as any).play?.()
      }
      tryPlay()
      this.scene.input.once('pointerdown', tryPlay)
      this.scene.input.keyboard?.once('keydown-SPACE', tryPlay)
    }
  }

  playSfx(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    if (!this.sfxEnabled) return
    if (!this.scene.cache.audio.exists(key)) return
    // Clone per play to allow overlap (Phaser handles new instances)
    this.scene.sound.play(key, { volume: config?.volume ?? 0.7, ...config })
  }

  // For Title attract loop: ducks music -6dB 300ms
  duckMusic() {
    if (!this.music || !this.musicEnabled) return
    const m = this.music as any
    const orig = 0.45
    try {
      m.setVolume(orig * 0.25)
      this.scene.time.delayedCall(300, () => {
        if (this.musicEnabled) m.setVolume(orig)
      })
    } catch {}
  }
}
