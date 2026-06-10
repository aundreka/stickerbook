import Phaser from 'phaser'
import { ITERATION } from '../iteration'

// Iteration gate. Counts successful placements / wall-clock / completion per the
// baked-in ITERATION and fires onGate exactly once. Pure counter + timer (the
// scene clock pauses with the scene on ad-pause, so the 60s timer is fair).
export class ProgressTracker {
  private scene: Phaser.Scene
  private onGate: () => void
  private placements = 0
  private gated = false
  private timer?: Phaser.Time.TimerEvent

  constructor(scene: Phaser.Scene, onGate: () => void) {
    this.scene = scene
    this.onGate = onGate
  }

  /** Begin the time-based gate (called at first interaction / gameStart). */
  start(): void {
    if (ITERATION.mode === 'time' && ITERATION.limit) {
      this.timer = this.scene.time.delayedCall(ITERATION.limit * 1000, () => this.gate())
    }
  }

  onPlacement(): void {
    this.placements += 1
    if (ITERATION.mode === 'clicks' && ITERATION.limit && this.placements >= ITERATION.limit) {
      this.gate()
    }
  }

  /** Whole room finished — always ends the run (the 'full' iteration uses this). */
  onAllComplete(): void {
    this.gate()
  }

  private gate(): void {
    if (this.gated) return
    this.gated = true
    this.timer?.remove()
    this.onGate()
  }

  get isGated(): boolean {
    return this.gated
  }

  /** Seconds left on the time-mode timer (0 if not time mode / not started). */
  remainingSeconds(): number {
    return this.timer ? this.timer.getRemainingSeconds() : 0
  }
}
