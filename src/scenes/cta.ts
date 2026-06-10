import Phaser from 'phaser'
import { DEPTH } from '../constants'
import { sd, viewW, viewH } from '../utils/responsive'
import { triggerCTA, notifyGameClose } from '../networks'
import { trackEvent } from '../analytics'

// End card + store-redirect sequence. Owns the end-card presentation and is the
// (only) place besides networks.ts that issues the CTA. redirectToStore() fires
// notifyGameClose() before triggerCTA() per AGENTS.md.
export class EndCard {
  private scene: Phaser.Scene
  private dim?: Phaser.GameObjects.Rectangle
  private logo?: Phaser.GameObjects.Image
  private button?: Phaser.GameObjects.Image
  private input?: Phaser.GameObjects.Rectangle
  private shown = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /** Fire the store redirect. Safe to call repeatedly (taps on the card). */
  redirectToStore(): void {
    trackEvent('CTA_CLICKED')
    notifyGameClose()
    triggerCTA()
  }

  show(): void {
    if (this.shown) return
    this.shown = true
    trackEvent('ENDCARD_SHOWN')

    this.dim = this.scene.add
      .rectangle(viewW() / 2, viewH() / 2, viewW(), viewH(), 0x1b1030, 0.55)
      .setDepth(DEPTH.ENDCARD)

    this.logo = this.scene.add.image(0, 0, 'logo').setOrigin(0.5).setDepth(DEPTH.ENDCARD + 0.1)
    this.button = this.scene.add.image(0, 0, 'ctaButton').setOrigin(0.5).setDepth(DEPTH.ENDCARD + 0.1)

    // Full-screen catcher so a tap ANYWHERE redirects (PDF requirement).
    this.input = this.scene.add
      .rectangle(viewW() / 2, viewH() / 2, viewW(), viewH(), 0x000000, 0.001)
      .setDepth(DEPTH.ENDCARD_INPUT)
      .setInteractive({ useHandCursor: true })
    this.input.on('pointerdown', () => this.redirectToStore())

    this.layout()

    // entrance + button pulse
    for (const o of [this.logo, this.button]) {
      o.setScale(o.scaleX * 0.7)
      o.setAlpha(0)
    }
    this.scene.tweens.add({ targets: [this.logo, this.button], alpha: 1, duration: 300 })
    this.scene.tweens.add({
      targets: this.logo,
      scaleX: this.logo.scaleX / 0.7,
      scaleY: this.logo.scaleY / 0.7,
      duration: 420,
      ease: 'Back.easeOut',
    })
    const btnScale = this.button.scaleX / 0.7
    this.scene.tweens.add({
      targets: this.button,
      scaleX: btnScale,
      scaleY: btnScale,
      duration: 420,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.button,
          scaleX: btnScale * 1.06,
          scaleY: btnScale * 1.06,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      },
    })
  }

  private layout(): void {
    if (!this.shown) return
    const cx = viewW() / 2
    this.dim?.setPosition(cx, viewH() / 2).setSize(viewW(), viewH())
    this.input?.setPosition(cx, viewH() / 2).setSize(viewW(), viewH())
    if (this.logo) {
      this.logo.setPosition(cx, viewH() * 0.4)
      const w = sd(560)
      this.logo.setDisplaySize(w, w * (946 / 653))
    }
    if (this.button) {
      this.button.setPosition(cx, viewH() * 0.72)
      const w = sd(620)
      this.button.setDisplaySize(w, w * (236 / 617))
    }
  }

  relayout(): void {
    this.layout()
  }
}
