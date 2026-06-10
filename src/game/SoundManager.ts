import Phaser from 'phaser'

// Audio. Muted until the first pointerdown (autoplay policy + AGENTS rule).
// Responds to host mute/volume and to page/ad visibility (suspends the
// AudioContext when hidden so nothing plays behind a closed/hidden ad).
export class SoundManager {
  private scene: Phaser.Scene
  private bgm: Phaser.Sound.BaseSound
  private correct: Phaser.Sound.BaseSound
  private wrong: Phaser.Sound.BaseSound
  private finished: Phaser.Sound.BaseSound
  private unlocked = false
  private adMuted = false
  private hostVolume = 1

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.bgm = scene.sound.add('bgm', { loop: true, volume: 0.35 })
    this.correct = scene.sound.add('sfxCorrect', { volume: 0.85 })
    this.wrong = scene.sound.add('sfxWrong', { volume: 0.7 })
    this.finished = scene.sound.add('sfxFinished', { volume: 0.9 })
    scene.sound.mute = true
    document.addEventListener('visibilitychange', this.onVisibility)
  }

  /** Called on the first pointerdown — starts BGM and lifts the autoplay mute. */
  unlock(): void {
    if (this.unlocked) return
    this.unlocked = true
    this.resumeContext()
    this.applyState()
    if (!this.bgm.isPlaying) this.bgm.play()
  }

  private applyState(): void {
    const muted = !this.unlocked || this.adMuted || this.hostVolume <= 0
    this.scene.sound.mute = muted
    this.scene.sound.volume = this.hostVolume
  }

  playCorrect(): void {
    if (this.unlocked) this.correct.play()
  }
  playWrong(): void {
    if (this.unlocked) this.wrong.play()
  }
  playFinished(): void {
    if (this.unlocked) this.finished.play()
  }

  setAdMuted(muted: boolean): void {
    this.adMuted = muted
    this.applyState()
  }

  setHostVolume(vol: number): void {
    this.hostVolume = Phaser.Math.Clamp(vol, 0, 1)
    this.applyState()
  }

  /** Ad hidden/paused: stop everything and suspend the context. */
  pause(): void {
    this.scene.sound.pauseAll()
    this.suspendContext()
  }

  resume(): void {
    if (!this.unlocked) return
    this.resumeContext()
    this.scene.sound.resumeAll()
  }

  private onVisibility = (): void => {
    if (document.hidden) this.pause()
    else this.resume()
  }

  private ctx(): AudioContext | undefined {
    return (this.scene.sound as unknown as { context?: AudioContext }).context
  }
  private resumeContext(): void {
    const c = this.ctx()
    if (c && c.state === 'suspended') void c.resume()
  }
  private suspendContext(): void {
    const c = this.ctx()
    if (c && c.state === 'running') void c.suspend()
  }
}
