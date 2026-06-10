import Phaser from 'phaser'
import { DEPTH, DESIGN_W } from '../constants'
import { sx, sy, sd } from '../utils/responsive'

// Top-center M:SS countdown pill, shown only for the 60-second iteration.
// GameScene feeds it the remaining seconds each frame.
export class CountdownTimer {
  private scene: Phaser.Scene
  private bg: Phaser.GameObjects.Graphics
  private text: Phaser.GameObjects.Text
  private shown = false
  private last = -1

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.bg = scene.add.graphics().setDepth(DEPTH.HUD).setVisible(false)
    this.text = scene.add
      .text(0, 0, '', { fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5)
      .setResolution(3)
      .setDepth(DEPTH.HUD + 1)
      .setVisible(false)
  }

  show(): void {
    this.shown = true
    this.bg.setVisible(true)
    this.text.setVisible(true)
  }

  hide(): void {
    this.shown = false
    this.bg.setVisible(false)
    this.text.setVisible(false)
  }

  set(seconds: number): void {
    if (!this.shown) return
    const s = Math.max(0, Math.ceil(seconds))
    if (s !== this.last) {
      this.last = s
      this.text.setText(`${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`)
    }
    this.draw()
  }

  relayout(): void {
    this.last = -1 // force redraw at the new scale
    this.draw()
  }

  private draw(): void {
    if (!this.shown) return
    const cx = sx(DESIGN_W / 2)
    const cy = sy(80)
    this.text.setFontSize(Math.max(20, sd(48)))
    this.text.setPosition(cx, cy)
    const pw = this.text.width + sd(60)
    const ph = this.text.height + sd(16)
    this.bg.clear()
    this.bg.fillStyle(0x1b1030, 0.5)
    this.bg.fillRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, sd(20))
  }
}
