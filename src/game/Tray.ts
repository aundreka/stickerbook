import Phaser from 'phaser'
import { DEPTH, TRAY_H, DESIGN_W, DESIGN_H } from '../constants'
import { texKey } from '../assets'
import { sx, sy, sd } from '../utils/responsive'

// Bottom tray. The draggable is a plain Image (reliable pointer/touch dragging);
// the number badge is a separate object synced to the image every frame
// (GameScene.update -> syncBadges), which also makes it dim/raise with its image
// during the tutorial. The number lets the player match sticker #N to outline #N.
const ITEM_SIZE = 250 // design px

interface TrayItem {
  id: number
  img: Phaser.GameObjects.Image
  badge: Phaser.GameObjects.Container
  homeX: number
  homeY: number
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
    return { w: sd(ITEM_SIZE), h: sd(ITEM_SIZE * (343 / 339)) }
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
      const img = this.scene.add.image(home.x, home.y, texKey.draggable(id)).setOrigin(0.5).setDepth(DEPTH.TRAY_ITEM)
      img.setDisplaySize(w, h)
      img.setData('stickerId', id)
      img.setInteractive({ useHandCursor: true })
      const badge = this.makeBadge(id)
      const it: TrayItem = { id, img, badge, homeX: home.x, homeY: home.y }
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
    const dw = it.img.displayWidth
    const dh = it.img.displayHeight
    it.badge.setScale(dw / ITEM_SIZE)
    // Top-right, slightly INSIDE the sticker so it overlaps; depth below the
    // sticker so the sticker covers its lower-left and the badge peeks out.
    it.badge.setPosition(it.img.x + dw * 0.3, it.img.y - dh * 0.32)
    it.badge.setDepth(it.img.depth - 1)
    it.badge.setVisible(it.img.visible)
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
    this.bg.setPosition(sx(DESIGN_W / 2), sy(DESIGN_H)).setDisplaySize(sd(DESIGN_W), sd(TRAY_H))
    const { w, h } = this.itemDisplay()
    const ids = [...this.items.keys()]
    ids.forEach((id, i) => {
      const it = this.items.get(id)!
      const home = this.homeFor(i, ids.length)
      it.homeX = home.x
      it.homeY = home.y
      it.img.setData('restScale', w / it.img.width)
      if (!it.img.getData('dragging')) {
        it.img.setDisplaySize(w, h)
        it.img.setPosition(home.x, home.y)
      }
      this.syncBadge(it)
    })
  }
}
