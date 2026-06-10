import Phaser from 'phaser'
import { STICKERS, stickerById } from './layout'
import { StickerSlot } from './StickerSlot'

// Owns all 50 slots. GameScene drives round progression; this just activates,
// places, and reports the currently-active (open) slots for hit-testing.
export class SlotManager {
  private slots = new Map<number, StickerSlot>()

  constructor(scene: Phaser.Scene) {
    for (const def of STICKERS) {
      this.slots.set(def.id, new StickerSlot(scene, stickerById(def.id)))
    }
  }

  get(id: number): StickerSlot {
    const s = this.slots.get(id)
    if (!s) throw new Error(`No slot ${id}`)
    return s
  }

  activate(ids: number[]): void {
    for (const id of ids) this.get(id).activate()
  }

  place(id: number): void {
    this.get(id).placeColored()
  }

  /** Open (active, not yet placed) slots — what a drop can match against. */
  activeSlots(): StickerSlot[] {
    const out: StickerSlot[] = []
    for (const slot of this.slots.values()) if (slot.active && !slot.placed) out.push(slot)
    return out
  }

  relayout(): void {
    for (const slot of this.slots.values()) slot.relayout()
  }
}
