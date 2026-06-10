import Phaser from 'phaser'
import { DEPTH, STICKER_SCALE } from '../constants'
import { texKey } from '../assets'
import { sx, sy, sd } from '../utils/responsive'
import type { StickerDef } from './layout'

// A single placement slot. Shows the (numbered) outline silhouette while active,
// then swaps to the colored art when placed. Depth is keyed off the sprite's
// FEET (bottom) so characters sort by where they stand; `floor` items (rug, etc.)
// render in a back sub-band so they're always under the characters on them.
export class StickerSlot {
  readonly def: StickerDef
  private scene: Phaser.Scene
  private outline?: Phaser.GameObjects.Image
  private badge?: Phaser.GameObjects.Text
  private colored?: Phaser.GameObjects.Image
  private pulse?: Phaser.Tweens.Tween
  placed = false
  active = false

  constructor(scene: Phaser.Scene, def: StickerDef) {
    this.scene = scene
    this.def = def
  }

  private get sc(): number {
    return STICKER_SCALE * (this.def.scale ?? 1)
  }
  private get dispW(): number {
    return this.def.w * this.sc
  }
  private get dispH(): number {
    return this.def.h * this.sc
  }

  /** Depth = zIndex layer (primary) + the sprite's feet (tie-break), so lower-in-
   *  room draws in front within a zIndex; set zIndex negative (e.g. rug) to push
   *  something behind everything. */
  private depthFor(): number {
    const feet = this.def.cy + this.dispH / 2
    return (this.def.zIndex ?? 0) * DEPTH.ROOM_Z + feet
  }

  get center(): { x: number; y: number } {
    return { x: sx(this.def.cx), y: sy(this.def.cy) }
  }

  /** On-screen size of the placed/outline art (for the drag hover-snap preview). */
  get displaySize(): { w: number; h: number } {
    return { w: sd(this.dispW), h: sd(this.dispH) }
  }

  get hitRadius(): number {
    return sd(Math.max(this.dispW, this.dispH) * 0.55 + 60)
  }

  activate(): void {
    if (this.placed) return
    this.active = true
    const d = this.depthFor()
    if (!this.outline) {
      this.outline = this.scene.add.image(0, 0, texKey.outline(this.def.id)).setOrigin(0.5).setDepth(d)
    }
    if (!this.badge) this.badge = this.makeBadge()
    this.layoutImage(this.outline)
    this.layoutBadge()
    this.outline.setVisible(true).setAlpha(0)
    this.badge.setVisible(true).setAlpha(0)
    this.scene.tweens.add({ targets: [this.outline, this.badge], alpha: 1, duration: 280, ease: 'Sine.easeOut' })
    this.pulse = this.makePulse()
  }

  placeColored(animate = true): void {
    if (this.placed) return
    this.active = false
    this.placed = true
    this.pulse?.remove()
    this.pulse = undefined
    this.outline?.destroy()
    this.outline = undefined
    this.badge?.destroy()
    this.badge = undefined

    this.colored = this.scene.add
      .image(0, 0, texKey.colored(this.def.id))
      .setOrigin(0.5)
      .setDepth(this.depthFor())
    this.layoutImage(this.colored)
    // Snap-in: pop up past full size, then settle — a satisfying placement beat.
    if (!animate) return
    const t = this.colored.scaleX
    this.colored.setScale(t * 0.2)
    this.scene.tweens.add({
      targets: this.colored,
      scaleX: t * 1.18,
      scaleY: t * 1.18,
      duration: 190,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.colored) return
        this.scene.tweens.add({
          targets: this.colored,
          scaleX: t,
          scaleY: t,
          duration: 180,
          ease: 'Quad.easeInOut',
        })
      },
    })
  }

  private makePulse(): Phaser.Tweens.Tween | undefined {
    if (!this.outline) return undefined
    return this.scene.tweens.add({
      targets: this.outline,
      scale: { from: this.outline.scaleX, to: this.outline.scaleX * 1.06 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private makeBadge(): Phaser.GameObjects.Text {
    // Small bare number inside the white outline (no border). High depth so it
    // stays readable even when a later round's outline overlaps placed art.
    // High resolution keeps it crisp on high-DPI / scaled canvases.
    return this.scene.add
      .text(0, 0, String(this.def.id), { fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#444444' })
      .setResolution(3)
      .setOrigin(0.5)
      .setDepth(DEPTH.OUTLINE_BADGE)
  }

  private layoutImage(img: Phaser.GameObjects.Image): void {
    img.setPosition(sx(this.def.cx), sy(this.def.cy))
    img.setDisplaySize(sd(this.dispW), sd(this.dispH))
  }

  private layoutBadge(): void {
    if (!this.badge) return
    this.badge.setPosition(sx(this.def.labelX ?? this.def.cx), sy(this.def.labelY ?? this.def.cy))
    this.badge.setFontSize(Math.max(11, sd(30)))
  }

  relayout(): void {
    if (this.outline) {
      this.layoutImage(this.outline)
      if (this.active && this.pulse) {
        this.pulse.remove()
        this.pulse = this.makePulse()
      }
    }
    if (this.badge) this.layoutBadge()
    if (this.colored) {
      this.layoutImage(this.colored)
      this.colored.setDepth(this.depthFor())
    }
  }
}
