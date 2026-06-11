import Phaser from 'phaser'
import { DEPTH, TRAY_H, DESIGN_W, DESIGN_H } from '../constants'
import { texKey } from '../assets'
import { sx, sy, sd, viewW, viewH } from '../utils/responsive'

// Bottom tray. The draggable is a plain Image (reliable pointer/touch dragging);
// the number badge is a separate object synced to the image every frame
// (GameScene.update -> syncBadges), which also makes it dim/raise with its image
// during the tutorial. The number lets the player match sticker #N to outline #N.
const ITEM_SIZE = 250 // tray-cell reference (design px) — drives badge placement
// The sticker art is drawn a bit smaller than the cell so its top-right never
// fully covers the (fixed-position) number badge behind it.
const TRAY_STICKER_SCALE = 0.82
// Per-sticker horizontal nudge of the ART within its tray cell (design px), for
// the few whose shape (e.g. 35's raised arm) would still cover the fixed badge.
const TRAY_NUDGE_X: Record<number, number> = { 35: -36 }

interface TrayItem {
  id: number
  img: Phaser.GameObjects.Image
  badge: Phaser.GameObjects.Container
  homeX: number
  homeY: number
  preview?: boolean
}

export class Tray {
  private scene: Phaser.Scene
  private bg: Phaser.GameObjects.Image
  private items = new Map<number, TrayItem>()

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.bg = scene.add.image(0, 0, 'trayBg').setOrigin(0.5, 1).setDepth(DEPTH.TRAY_BG)
    this.relayout()
  }

  private itemDisplay(): { w: number; h: number } {
    const d = ITEM_SIZE * TRAY_STICKER_SCALE
    return { w: sd(d), h: sd(d * (343 / 339)) }
  }

  /** The resting on-screen size of a tray sticker (for the drag overlap test). */
  normalDisplaySize(): { w: number; h: number } {
    return this.itemDisplay()
  }

  private homeFor(index: number, count: number): { x: number; y: number } {
    const cell = DESIGN_W / count
    return { x: sx(cell * (index + 0.5)), y: sy(DESIGN_H - TRAY_H / 2) }
  }

  private makeBadge(id: number): Phaser.GameObjects.Container {
    // children sized in design px; the container is scaled to screen in syncBadge.
    // White circle, BLACK border, sitting BEHIND the sticker (peeking top-right).
    const circle = this.scene.add.circle(0, 0, 40, 0xffffff).setStrokeStyle(5, 0x000000)
    const text = this.scene.add
      .text(0, 0, String(id), { fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#000000' })
      .setResolution(3)
      .setOrigin(0.5)
    text.setFontSize(46)
    return this.scene.add.container(0, 0, [circle, text]).setDepth(DEPTH.TRAY_BADGE)
  }

  loadRound(ids: number[]): void {
    this.clear()
    const { w, h } = this.itemDisplay()
    ids.forEach((id, i) => {
      const home = this.homeFor(i, ids.length)
      const nudge = sd(TRAY_NUDGE_X[id] || 0)
      const img = this.scene.add.image(home.x + nudge, home.y, texKey.draggable(id)).setOrigin(0.5).setDepth(DEPTH.TRAY_ITEM)
      img.setDisplaySize(w, h)
      img.setData('stickerId', id)
      img.setInteractive({ useHandCursor: true })
      const badge = this.makeBadge(id)
      const it: TrayItem = { id, img, badge, homeX: home.x + nudge, homeY: home.y }
      this.items.set(id, it)
      this.syncBadge(it)
      // entrance
      const restX = w / img.width
      const restY = h / img.height
      img.setData('restScale', restX) // for the drag hover-snap to revert to
      img.setScale(restX * 0.6, restY * 0.6)
      this.scene.tweens.add({ targets: img, scaleX: restX, scaleY: restY, duration: 280, delay: i * 70, ease: 'Back.easeOut' })
    })
  }

  private syncBadge(it: TrayItem): void {
    // Badge keeps a FIXED size + top-right cell offset, behind the sticker. The
    // per-sticker nudge shifts the ART left but compensates here so the badge
    // stays at the cell's top-right (clear of the art). Hidden during preview.
    const nudge = sd(TRAY_NUDGE_X[it.id] || 0)
    it.badge.setScale(sd(1))
    it.badge.setPosition(it.img.x + sd(ITEM_SIZE * 0.3) - nudge, it.img.y - sd(ITEM_SIZE * 0.32))
    it.badge.setDepth(it.img.depth - 1)
    it.badge.setVisible(it.img.visible && !it.preview)
  }

  /** Smoothly snap the dragged sticker onto its outline: swap to the COLORED art
   *  (so it fits the outline exactly + crisp) and EASE position + size to the
   *  slot — a gentle "settle into place", not an instant jump. */
  snapTo(id: number, cx: number, cy: number, w: number, h: number): void {
    const it = this.items.get(id)
    if (!it) return
    const img = it.img
    if (!it.preview) {
      it.preview = true
      const curW = img.displayWidth
      const curH = img.displayHeight
      img.setTexture(texKey.colored(id))
      img.setDisplaySize(curW, curH) // keep size across the swap (no pop)
      it.badge.setVisible(false)
    }
    this.scene.tweens.killTweensOf(img)
    this.scene.tweens.add({
      targets: img,
      x: cx,
      y: cy,
      scaleX: w / img.width,
      scaleY: h / img.height,
      duration: 180,
      ease: 'Cubic.easeOut',
    })
  }

  /** Revert the dragged item from the snapped preview back to the tray look. */
  clearPreview(id: number): void {
    const it = this.items.get(id)
    if (!it || !it.preview) return
    it.preview = false
    this.scene.tweens.killTweensOf(it.img)
    it.img.setTexture(texKey.draggable(id))
    const d = this.itemDisplay()
    it.img.setDisplaySize(d.w, d.h)
  }

  isPreviewing(id: number): boolean {
    return this.items.get(id)?.preview === true
  }

  /** Called every frame by GameScene so badges follow their images. */
  syncBadges(): void {
    for (const it of this.items.values()) this.syncBadge(it)
  }

  itemObjects(): Phaser.GameObjects.Image[] {
    return [...this.items.values()].map((it) => it.img)
  }

  /** The draggable image for an id — used for the snap-to-slot tween. */
  objectOf(id: number): Phaser.GameObjects.Image | null {
    return this.items.get(id)?.img ?? null
  }

  currentIds(): number[] {
    return [...this.items.keys()]
  }

  returnItem(id: number): void {
    const it = this.items.get(id)
    if (!it) return
    this.clearPreview(id) // back to the tray draggable look
    it.img.setData('snapLock', false)
    this.scene.tweens.killTweensOf(it.img)
    it.img.setDepth(DEPTH.TRAY_ITEM)
    const { w, h } = this.itemDisplay()
    this.scene.tweens.add({
      targets: it.img,
      x: it.homeX,
      y: it.homeY,
      scaleX: w / it.img.width,
      scaleY: h / it.img.height,
      duration: 260,
      ease: 'Back.easeOut',
    })
  }

  /** If a sticker is mid-drag when an ad pause / tab-switch interrupts it, drop
   *  the drag state and snap it home so Phaser's input never gets stranded
   *  (which would otherwise freeze further dragging when the ad resumes). */
  cancelDrag(): void {
    const { w, h } = this.itemDisplay()
    for (const it of this.items.values()) {
      if (!it.img.getData('dragging')) continue
      it.img.setData('dragging', false)
      it.img.setData('snapLock', false)
      this.clearPreview(it.id)
      this.scene.tweens.killTweensOf(it.img)
      it.img.setDepth(DEPTH.TRAY_ITEM)
      it.img.setPosition(it.homeX, it.homeY).setDisplaySize(w, h)
    }
  }

  removeItem(id: number): void {
    const it = this.items.get(id)
    if (!it) return
    it.img.destroy()
    it.badge.destroy()
    this.items.delete(id)
  }

  clear(): void {
    for (const it of this.items.values()) {
      it.img.destroy()
      it.badge.destroy()
    }
    this.items.clear()
  }

  setVisible(v: boolean): void {
    this.bg.setVisible(v)
    for (const it of this.items.values()) {
      it.img.setVisible(v)
      it.badge.setVisible(v)
    }
  }

  relayout(): void {
    // Blue bar stretches the FULL viewport width AND down to the real screen
    // bottom (so no white letterbox strip shows under it), while its top edge +
    // the items stay in portrait design scaling.
    const top = sy(DESIGN_H - TRAY_H)
    const bottom = Math.max(viewH(), sy(DESIGN_H))
    this.bg.setPosition(viewW() / 2, bottom).setDisplaySize(viewW(), bottom - top)
    const { w, h } = this.itemDisplay()
    const ids = [...this.items.keys()]
    ids.forEach((id, i) => {
      const it = this.items.get(id)!
      const home = this.homeFor(i, ids.length)
      const nudge = sd(TRAY_NUDGE_X[id] || 0)
      it.homeX = home.x + nudge
      it.homeY = home.y
      if (!it.img.getData('dragging') && !it.preview) {
        it.img.setDisplaySize(w, h)
        it.img.setPosition(it.homeX, it.homeY)
      }
      this.syncBadge(it)
    })
  }
}
