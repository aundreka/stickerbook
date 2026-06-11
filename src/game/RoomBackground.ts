import Phaser from 'phaser'
import { BG_W, BG_H, DESIGN_W, DESIGN_H, DEPTH, ROOM_COLORS } from '../constants'
import { sx, sy, sd, viewW, viewH, isLandscape } from '../utils/responsive'

// Owns the room backdrops. Three layers:
//  - a solid fill that covers the whole viewport (so the canvas never shows the
//    page colour at the edges);
//  - a COVER backdrop (portrait only) that fills the FIT letterbox with the room
//    continued to every edge, so there is no bare white band at the top/sides;
//  - the crisp FIT room centred on top (what the stickers align to), which is
//    opaque and hides the layers behind it across the play area.
// In landscape the room stays portrait-scaled and centred (approved mockup), so
// the backdrop is hidden and the solid fill shows in the wide side margins.
// Starts white; crossfades the colored room in (fill + backdrop + FIT) as the
// completion payoff. Single WebGL context.
export class RoomBackground {
  private scene: Phaser.Scene
  private fill: Phaser.GameObjects.Rectangle
  private whiteBack: Phaser.GameObjects.Image
  private coloredBack: Phaser.GameObjects.Image
  private white: Phaser.GameObjects.Image
  private colored: Phaser.GameObjects.Image

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.fill = scene.add.rectangle(0, 0, 10, 10, ROOM_COLORS.wallWhite).setOrigin(0, 0).setDepth(DEPTH.BG - 1)
    this.whiteBack = scene.add.image(0, 0, 'bgWhite').setOrigin(0.5).setDepth(DEPTH.BG)
    this.coloredBack = scene.add.image(0, 0, 'bgColored').setOrigin(0.5).setDepth(DEPTH.BG).setAlpha(0)
    this.white = scene.add.image(0, 0, 'bgWhite').setOrigin(0.5).setDepth(DEPTH.BG + 1)
    this.colored = scene.add.image(0, 0, 'bgColored').setOrigin(0.5).setDepth(DEPTH.BG + 1).setAlpha(0)
    this.relayout()
  }

  relayout(): void {
    this.fill.setPosition(0, 0).setSize(viewW(), viewH())
    // Crisp FIT room: design space contained + centred (what stickers align to).
    const cx = sx(DESIGN_W / 2)
    const cy = sy(DESIGN_H / 2)
    for (const img of [this.white, this.colored]) {
      img.setPosition(cx, cy)
      img.setDisplaySize(sd(BG_W), sd(BG_H))
    }
    // COVER backdrop fills the entire viewport so the room bleeds to the top/side
    // edges instead of a white letterbox. Only in portrait (in landscape the
    // margins are wide and a zoomed room slice reads oddly — show the fill there).
    const portrait = !isLandscape()
    const cover = Math.max(viewW() / BG_W, viewH() / BG_H)
    for (const img of [this.whiteBack, this.coloredBack]) {
      img.setVisible(portrait)
      img.setPosition(viewW() / 2, viewH() / 2)
      img.setDisplaySize(BG_W * cover, BG_H * cover)
    }
  }

  /** Fade the fully-colored room in over the white room (fill + both layers). */
  crossfadeToColored(duration = 800): void {
    this.scene.tweens.add({
      targets: [this.colored, this.coloredBack],
      alpha: 1,
      duration,
      ease: 'Sine.easeInOut',
    })
    const c0 = Phaser.Display.Color.IntegerToColor(ROOM_COLORS.wallWhite)
    const c1 = Phaser.Display.Color.IntegerToColor(ROOM_COLORS.floorColored)
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: (tw) => {
        const t = tw.getValue() as number
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(c0, c1, 100, Math.round(t * 100))
        this.fill.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b))
      },
    })
  }
}
