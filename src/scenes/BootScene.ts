import Phaser from 'phaser'
import { IMAGES, AUDIO, COLORED, OUTLINE, DRAGGABLE, texKey } from '../assets'
import { STICKERS } from '../game/layout'

// Loads every texture/sound from the inlined base64 data URIs, then starts the
// game. Assets are embedded (no network), so a single load phase is fast; a
// lightweight progress label covers the brief decode.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload(): void {
    const label = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Loading…', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '44px',
        color: '#8a6d3b',
      })
      .setOrigin(0.5)
    this.load.on('progress', (p: number) => label.setText(`Loading… ${Math.round(p * 100)}%`))

    this.load.image('bgWhite', IMAGES.bgWhite)
    this.load.image('bgColored', IMAGES.bgColored)
    this.load.image('trayBg', IMAGES.trayBg)
    this.load.image('handIcon', IMAGES.handIcon)
    this.load.image('starBurst', IMAGES.starBurst)
    this.load.image('ctaButton', IMAGES.ctaButton)
    this.load.image('logo', IMAGES.logo)

    for (const s of STICKERS) {
      this.load.image(texKey.outline(s.id), OUTLINE[s.id])
      this.load.image(texKey.colored(s.id), COLORED[s.id])
      this.load.image(texKey.draggable(s.id), DRAGGABLE[s.id])
    }

    this.load.audio('bgm', AUDIO.bgm)
    this.load.audio('sfxCorrect', AUDIO.sfxCorrect)
    this.load.audio('sfxWrong', AUDIO.sfxWrong)
    this.load.audio('sfxFinished', AUDIO.sfxFinished)
  }

  create(): void {
    this.scene.start('Game')
  }
}
