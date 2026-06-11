import Phaser from 'phaser'
import { DEPTH, TRAY_H, DESIGN_W, DESIGN_H } from '../constants'
import { texKey } from '../assets'
import { sx, sy, sd, viewW } from '../utils/responsive'

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

  /** While hovering its slot, show the dragged item as the COLORED art at the
   *  EXACT outline size (perfect, crisp fit), hiding its number; else revert. */
  setPreview(id: number, on: boolean, w = 0, h = 0): void {
    const it = this.items.get(id)
    if (!it) return
    if (on) {
      if (!it.preview) {
        it.preview = true
        it.img.setTexture(texKey.colored(id))
        it.badge.setVisible(false)
      }
      it.img.setDisplaySize(w, h)
    } else if (it.preview) {
      it.preview = false
      it.img.setTexture(texKey.draggable(id))
      const d = this.itemDisplay()
      it.img.setDisplaySize(d.w, d.h)
    }
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
    this.setPreview(id, false) // back to the tray draggable look
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
    // Blue bar stretches the FULL viewport width (so it reaches the edges in
    // landscape), but its height + the items stay in portrait design scaling.
    this.bg.setPosition(viewW() / 2, sy(DESIGN_H)).setDisplaySize(viewW(), sd(TRAY_H))
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
