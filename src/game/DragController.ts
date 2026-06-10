import Phaser from 'phaser'
import { DEPTH } from '../constants'

interface DragCallbacks {
  onStart?: (id: number) => void
  onMove?: (id: number, x: number, y: number) => void
  onDrop: (id: number, x: number, y: number) => void
}

// Wires pointer dragging for the tray sticker images. Tray items are the only
// draggable objects, so the global drag events route safely by 'stickerId'.
export class DragController {
  private scene: Phaser.Scene
  private images: Phaser.GameObjects.Image[] = []
  private enabled = true

  constructor(scene: Phaser.Scene, cb: DragCallbacks) {
    this.scene = scene

    scene.input.on('dragstart', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
      if (!this.enabled) return
      const img = obj as Phaser.GameObjects.Image
      img.setData('dragging', true)
      // Notify first (cancels any tutorial/hint that may have raised this item),
      // THEN claim the drag depth so it stays on top while dragging.
      cb.onStart?.(img.getData('stickerId') as number)
      img.setDepth(DEPTH.DRAG)
      this.scene.tweens.add({ targets: img, scaleX: img.scaleX * 1.12, scaleY: img.scaleY * 1.12, duration: 120 })
    })

    scene.input.on(
      'drag',
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
        if (!this.enabled) return
        const img = obj as Phaser.GameObjects.Image
        img.x = dragX
        img.y = dragY
        cb.onMove?.(img.getData('stickerId') as number, dragX, dragY)
      },
    )

    scene.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
      const img = obj as Phaser.GameObjects.Image
      img.setData('dragging', false)
      cb.onDrop(img.getData('stickerId') as number, img.x, img.y)
    })
  }

  /** Make the given (new round's) tray items draggable. */
  enable(images: Phaser.GameObjects.Image[]): void {
    this.images = images
    for (const img of images) {
      if (img.active && img.input) this.scene.input.setDraggable(img, true)
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on
    // Items may have been placed/destroyed since enable(); skip those.
    for (const img of this.images) {
      if (img.active && img.input) this.scene.input.setDraggable(img, on)
    }
  }
}
