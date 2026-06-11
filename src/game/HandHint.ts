import Phaser from 'phaser'
import { DEPTH, TUTORIAL_DIM_ALPHA } from '../constants'
import { sx, sy, sd, viewW, viewH } from '../utils/responsive'

// The pointing-hand helper. Two modes:
//  - tutorial: dim the screen, isolate the target tray sticker (raised above
//    the dim), and animate the hand from the sticker toward its slot.
//  - idle hint: same hand motion, no dim, after 5s of inactivity.
// Cancelled on the first real drag.
export class HandHint {
  private scene: Phaser.Scene
  private hand: Phaser.GameObjects.Image
  private dim?: Phaser.GameObjects.Rectangle
  private tween?: Phaser.Tweens.Tween
  private raised?: Phaser.GameObjects.Image
  private active = false
  // The current target (tray sticker) + slot center in DESIGN space, kept so the
  // hand path can be re-derived on relayout (e.g. rotating into landscape).
  private fromImg?: Phaser.GameObjects.Image
  private toDX = 0
  private toDY = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.hand = scene.add
      .image(0, 0, 'handIcon')
      .setOrigin(0.32, 0.08)
      .setDepth(DEPTH.HAND)
      .setVisible(false)
  }

  get isActive(): boolean {
    return this.active
  }

  private animate(fromX: number, fromY: number, toX: number, toY: number): void {
    this.hand.setVisible(true).setPosition(fromX, fromY).setAlpha(1)
    this.hand.setDisplaySize(sd(150), sd((150 * 180) / 198))
    this.tween?.remove()
    this.tween = this.scene.tweens.add({
      targets: this.hand,
      x: toX,
      y: toY,
      duration: 950,
      ease: 'Sine.easeInOut',
      repeat: -1,
      repeatDelay: 350,
      onRepeat: () => this.hand.setPosition(fromX, fromY),
    })
  }

  /** Full tutorial with dim + isolated target. `slotDX/slotDY` are the slot's
   *  DESIGN-space center (so the hand can be re-aimed correctly after rotation). */
  showTutorial(target: Phaser.GameObjects.Image, slotDX: number, slotDY: number): void {
    if (this.active) return
    this.active = true
    this.dim = this.scene.add
      .rectangle(viewW() / 2, viewH() / 2, viewW(), viewH(), 0x000000, TUTORIAL_DIM_ALPHA)
      .setDepth(DEPTH.DIM)
      .setInteractive()
    this.raised = target
    target.setDepth(DEPTH.DIM + 1) // isolate above the dim
    this.aim(target, slotDX, slotDY)
  }

  /** Lightweight idle nudge (no dim). */
  armIdle(target: Phaser.GameObjects.Image, slotDX: number, slotDY: number): void {
    if (this.active) return
    this.active = true
    this.aim(target, slotDX, slotDY)
  }

  private aim(target: Phaser.GameObjects.Image, slotDX: number, slotDY: number): void {
    this.fromImg = target
    this.toDX = slotDX
    this.toDY = slotDY
    this.animate(target.x, target.y, sx(slotDX), sy(slotDY))
  }

  cancel(): void {
    if (!this.active) return
    this.active = false
    this.tween?.remove()
    this.tween = undefined
    this.hand.setVisible(false)
    this.raised?.setDepth(DEPTH.TRAY_ITEM)
    this.raised = undefined
    this.fromImg = undefined
    this.dim?.destroy()
    this.dim = undefined
  }

  relayout(): void {
    if (this.dim) this.dim.setPosition(viewW() / 2, viewH() / 2).setSize(viewW(), viewH())
    // Re-derive the hand path from the (relaid-out) target + slot so it stays on
    // point after a resize/rotation instead of animating between stale coords.
    if (this.active && this.fromImg) {
      this.animate(this.fromImg.x, this.fromImg.y, sx(this.toDX), sy(this.toDY))
    }
  }
}
