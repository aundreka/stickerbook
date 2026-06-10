import Phaser from 'phaser'
import type { SlotManager } from './SlotManager'

// Pure geometry. A dragged tray sticker of id N is correct when it is dropped
// near slot N's center (within that slot's tolerance radius). No sound/SDK here.
export class MatchSystem {
  constructor(private slots: SlotManager) {}

  /** True if dropping sticker `id` at (x, y) lands on its matching open slot. */
  isCorrect(id: number, x: number, y: number): boolean {
    const slot = this.slots.get(id)
    if (!slot.active || slot.placed) return false
    const c = slot.center
    return Phaser.Math.Distance.Between(x, y, c.x, c.y) <= slot.hitRadius
  }
}
