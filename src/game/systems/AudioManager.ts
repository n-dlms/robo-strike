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

  initMusic(key = 'music_loop', attempt = 0) {
    if (this.music) return
    if (this.scene.cache.audio.exists(key)) {
      this.attachMusic(key)
      return
    }
    // Lazy path: music_loop is deferred out of Boot preload to protect the
    // 1.2MB wire budget. It fetches in the background while the title plays.
    if (this.scene.cache.json.exists('__music_loading_' + key)) {
      // Another scene is fetching it: retry so this scene attaches to the
      // shared instance instead of missing out entirely.
      if (attempt < 12) {
        this.scene.time.delayedCall(400, () => this.initMusic(key, attempt + 1))
      } else {
        // Stale flag (loader scene died mid-fetch): take over the load.
        this.scene.cache.json.remove('__music_loading_' + key)
        this.initMusic(key, 0)
      }
      return
    }
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
    // Singleton across scenes: Phaser's SoundManager is global, so a loop
    // started in Title survives into Game (and across RETRY restarts).
    // Re-adding would stack a second loop of the same track.
    const existing = this.scene.sound.getAll(key)[0] as any
    if (existing) {
      this.music = existing
      existing.setVolume?.(this.musicEnabled ? 0.45 : 0)
      if (this.musicEnabled && !existing.isPlaying) existing.play?.()
      return
    }
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
    this.scene.sound.play(key, { volume: config?.volume ?? 0.7, ...config })
  }

  // Ducks music under SFX. Idempotent: re-fires while already ducked only
  // extend the window instead of re-dipping, so rapid fire cannot pump the bed.
  private duckedUntil = 0
  duckMusic(depth = 0.25, ms = 300) {
    if (!this.music || !this.musicEnabled) return
    const m = this.music as any
    const orig = 0.45
    const now = this.scene.time.now
    try {
      if (now < this.duckedUntil) {
        // Already ducked: stretch the window, do not re-dip.
        this.duckedUntil = now + ms
        return
      }
      this.duckedUntil = now + ms
      m.setVolume(orig * depth)
      this.scene.time.delayedCall(ms, () => {
        if (this.musicEnabled && this.scene.time.now >= this.duckedUntil) m.setVolume(orig)
      })
    } catch {}
  }
}
