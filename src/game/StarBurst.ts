import Phaser from 'phaser'
import { DEPTH } from '../constants'
import { sd } from '../utils/responsive'

// Pooled sparkle shown when a sticker is placed correctly. Reuses a small set
// of images (no per-burst allocation / GC).
const POOL = 4

export class StarBurst {
  private scene: Phaser.Scene
  private pool: Phaser.GameObjects.Image[] = []
  private next = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    for (let i = 0; i < POOL; i++) {
      const img = scene.add
        .image(0, 0, 'starBurst')
        .setOrigin(0.5)
        .setDepth(DEPTH.BURST)
        .setVisible(false)
        .setActive(false)
      this.pool.push(img)
    }
  }

  play(x: number, y: number): void {
    const img = this.pool[this.next]
    this.next = (this.next + 1) % POOL
    this.scene.tweens.killTweensOf(img)
    img.setPosition(x, y).setVisible(true).setActive(true).setAlpha(1).setAngle(0)
    img.setDisplaySize(sd(120), sd(120))
    const big = img.scaleX * 2.4
    this.scene.tweens.add({
      targets: img,
      scaleX: big,
      scaleY: big,
      angle: 45,
      alpha: 0,
      duration: 480,
      ease: 'Cubic.easeOut',
      onComplete: () => img.setVisible(false).setActive(false),
    })
  }
}
