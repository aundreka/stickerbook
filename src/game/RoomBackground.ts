import Phaser from 'phaser'
import { BG_W, BG_H, DESIGN_W, DESIGN_H, FLOOR_LINE_Y, ROOM_COLORS, DEPTH } from '../constants'
import { sx, sy, sd, viewW, viewH } from '../utils/responsive'

// Owns the room backdrops. The design space is FIT into the canvas, so to keep a
// full-bleed look the letterbox bands are filled by two rectangles (wall on top,
// floor on bottom) split at the room's wall/floor line and color-matched to the
// background edges. Starts on the white line-art room; crossfades the colored
// room (and the band colors) in as the completion payoff. Single WebGL context.
export class RoomBackground {
  private scene: Phaser.Scene
  private wall: Phaser.GameObjects.Rectangle
  private floor: Phaser.GameObjects.Rectangle
  private white: Phaser.GameObjects.Image
  private colored: Phaser.GameObjects.Image

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.wall = scene.add.rectangle(0, 0, 10, 10, ROOM_COLORS.wallWhite).setOrigin(0, 0).setDepth(DEPTH.BG)
    this.floor = scene.add.rectangle(0, 0, 10, 10, ROOM_COLORS.floorWhite).setOrigin(0, 0).setDepth(DEPTH.BG)
    this.white = scene.add.image(0, 0, 'bgWhite').setOrigin(0.5).setDepth(DEPTH.BG + 1)
    this.colored = scene.add.image(0, 0, 'bgColored').setOrigin(0.5).setDepth(DEPTH.BG + 1).setAlpha(0)
    this.relayout()
  }

  relayout(): void {
    const cx = sx(DESIGN_W / 2)
    const cy = sy(DESIGN_H / 2)
    for (const img of [this.white, this.colored]) {
      img.setPosition(cx, cy)
      img.setDisplaySize(sd(BG_W), sd(BG_H))
    }
    // Bands fill the whole viewport; the bg images sit on top of the centre.
    const split = sy(FLOOR_LINE_Y)
    this.wall.setPosition(0, 0).setSize(viewW(), Math.max(0, split))
    this.floor.setPosition(0, split).setSize(viewW(), Math.max(0, viewH() - split))
  }

  /** Fade the fully-colored room (and band colors) in over the white room. */
  crossfadeToColored(duration = 800): void {
    this.scene.tweens.add({ targets: this.colored, alpha: 1, duration, ease: 'Sine.easeInOut' })
    this.tweenColor(this.wall, ROOM_COLORS.wallWhite, ROOM_COLORS.wallColored, duration)
    this.tweenColor(this.floor, ROOM_COLORS.floorWhite, ROOM_COLORS.floorColored, duration)
  }

  private tweenColor(
    rect: Phaser.GameObjects.Rectangle,
    from: number,
    to: number,
    duration: number,
  ): void {
    const c0 = Phaser.Display.Color.IntegerToColor(from)
    const c1 = Phaser.Display.Color.IntegerToColor(to)
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: (tw) => {
        const t = tw.getValue() as number
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(c0, c1, 100, Math.round(t * 100))
        rect.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b))
      },
    })
  }
}
