import Phaser from 'phaser'
import { IDLE_HINT_MS } from '../constants'
import { ITERATION } from '../iteration'
import { buildRounds } from '../game/layout'
import { CountdownTimer } from '../game/CountdownTimer'
import { RoomBackground } from '../game/RoomBackground'
import { SlotManager } from '../game/SlotManager'
import { Tray } from '../game/Tray'
import { DragController } from '../game/DragController'
import { MatchSystem } from '../game/MatchSystem'
import { StarBurst } from '../game/StarBurst'
import { HandHint } from '../game/HandHint'
import { ProgressTracker } from '../game/ProgressTracker'
import { SoundManager } from '../game/SoundManager'
import { EndCard } from './cta'
import { bindLifecycle, notifyGameStart, notifyGameEnd } from '../networks'
import { trackEvent } from '../analytics'

// Orchestrator. Wires the game/ modules, drives round progression, and is the
// place (with cta.ts) that calls the ad-SDK helpers at the right lifecycle
// moments. game/ modules themselves never touch the SDK.
export class GameScene extends Phaser.Scene {
  private roomBg!: RoomBackground
  private slots!: SlotManager
  private tray!: Tray
  private dragCtl!: DragController
  private match!: MatchSystem
  private starBurst!: StarBurst
  private hand!: HandHint
  private progress!: ProgressTracker
  private audioMgr!: SoundManager
  private endCard!: EndCard

  private roundIndex = 0
  private currentRoundIds: number[] = []
  private placedInRound = 0
  private gated = false
  private started = false
  private solvedOnce = false
  private tutorialDone = false
  private idleTimer?: Phaser.Time.TimerEvent
  private rounds: number[][] = []
  private countdown?: CountdownTimer

  constructor() {
    super('Game')
  }

  create(): void {
    this.roomBg = new RoomBackground(this)
    this.slots = new SlotManager(this)
    this.tray = new Tray(this)
    this.match = new MatchSystem(this.slots)
    this.starBurst = new StarBurst(this)
    this.hand = new HandHint(this)
    this.audioMgr = new SoundManager(this)
    this.endCard = new EndCard(this)
    this.progress = new ProgressTracker(this, () => this.endGame())
    if (ITERATION.mode === 'time') this.countdown = new CountdownTimer(this)
    this.dragCtl = new DragController(this, {
      onStart: () => this.onDragStart(),
      onMove: (id, x, y) => this.onDragMove(id, x, y),
      onDrop: (id, x, y) => this.onDrop(id, x, y),
    })

    // Ad lifecycle: register handlers before bindLifecycle (which may emit cached state).
    this.game.events.on('ad-pause', this.onAdPause, this)
    this.game.events.on('ad-resume', this.onAdResume, this)
    this.game.events.on('ad-mute', this.onAdMute, this)
    this.game.events.on('ad-volume', this.onAdVolume, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this)
    bindLifecycle(this)

    // First interaction unlocks audio and starts the game clock/notifier.
    this.input.on('pointerdown', () => {
      this.audioMgr.unlock()
      this.beginPlay()
      this.resetIdle()
    })

    this.rounds = buildRounds() // randomized each play
    trackEvent('DISPLAYED')
    this.progress.start() // 60s timer (time mode) runs from display
    this.countdown?.show()
    this.startRound()

    // QA-only: auto-play to fill the room / reach the end card. Guarded by the
    // URL hash so it never runs in a real placement.
    if (typeof location !== 'undefined' && location.hash.toLowerCase().includes('auto')) {
      this.time.delayedCall(1200, () => this.autoStep())
    }
  }

  private autoStep(): void {
    if (this.gated) return
    const ids = this.tray.currentIds()
    if (!ids.length) {
      this.time.delayedCall(250, () => this.autoStep())
      return
    }
    this.beginPlay()
    this.hand.cancel()
    this.tutorialDone = true
    this.onCorrect(ids[0])
    this.time.delayedCall(220, () => this.autoStep())
  }

  update(): void {
    // Keep the tray number badges glued to their (draggable) images.
    this.tray?.syncBadges()
    if (this.countdown) this.countdown.set(this.progress.remainingSeconds())
  }

  // -- lifecycle handlers ----------------------------------------------------
  private onAdPause(): void {
    this.audioMgr.pause()
    // Once the end card is up, keep the scene animating (so the CTA keeps
    // pulsing even after the store opens) — just mute the audio.
    if (!this.gated && !this.scene.isPaused()) this.scene.pause()
  }
  private onAdResume(): void {
    if (this.scene.isPaused()) this.scene.resume()
    this.audioMgr.resume()
  }
  private onAdMute(muted: boolean): void {
    this.audioMgr.setAdMuted(muted)
  }
  private onAdVolume(v: number): void {
    this.audioMgr.setHostVolume(v)
  }

  private beginPlay(): void {
    if (this.started) return
    this.started = true
    notifyGameStart()
    trackEvent('CHALLENGE_STARTED')
  }

  // -- round flow ------------------------------------------------------------
  private startRound(): void {
    const ids = this.rounds[this.roundIndex]
    this.currentRoundIds = ids
    this.placedInRound = 0
    this.tray.loadRound(ids)
    this.slots.activate(ids)
    this.dragCtl.enable(this.tray.itemObjects())
    this.resetIdle()
    if (this.roundIndex === 0 && !this.tutorialDone) {
      this.time.delayedCall(550, () => this.maybeTutorial())
    }
    // QA-only: expose this round's slot centers (canvas px) for headless drag tests.
    if (typeof location !== 'undefined' && location.hash.toLowerCase().includes('dbg')) {
      ;(window as unknown as Record<string, unknown>).__round = ids.map((id) => {
        const c = this.slots.get(id).center
        return { id, x: c.x, y: c.y }
      })
    }
  }

  private maybeTutorial(): void {
    if (this.tutorialDone || this.gated) return
    const id = this.currentRoundIds[0]
    const img = this.tray.objectOf(id)
    const c = this.slots.get(id).center
    if (img) this.hand.showTutorial(img, c.x, c.y)
  }

  private onDragStart(): void {
    this.hand.cancel()
    this.tutorialDone = true
    this.beginPlay()
    this.resetIdle()
  }

  // As the dragged sticker nears its slot, preview the COLORED art at the EXACT
  // outline size (so it fits the uncolored outline perfectly + stays crisp) and
  // magnet toward the slot center — progressively stronger the closer it gets.
  private onDragMove(id: number, px: number, py: number): void {
    const img = this.tray.objectOf(id)
    if (!img) return
    const slot = this.slots.get(id)
    if (!slot.active || slot.placed) return
    const c = slot.center
    const ds = slot.displaySize
    const dist = Phaser.Math.Distance.Between(px, py, c.x, c.y)
    const zone = Math.max(ds.w, ds.h) * 0.7 + 60
    if (dist < zone) {
      this.tray.setPreview(id, true, ds.w, ds.h)
      const t = Phaser.Math.Clamp(1 - dist / zone, 0, 1)
      img.x = Phaser.Math.Linear(img.x, c.x, t * 0.9)
      img.y = Phaser.Math.Linear(img.y, c.y, t * 0.9)
    } else {
      this.tray.setPreview(id, false)
    }
  }

  private onDrop(id: number, x: number, y: number): void {
    if (this.gated) return
    if (this.match.isCorrect(id, x, y)) this.onCorrect(id)
    else this.onWrong(id)
  }

  private onCorrect(id: number): void {
    const c = this.slots.get(id).center
    const img = this.tray.objectOf(id)
    if (img) {
      this.tweens.add({
        targets: img,
        x: c.x,
        y: c.y,
        duration: 150,
        ease: 'Sine.easeIn',
        onComplete: () => this.commitPlacement(id),
      })
    } else {
      this.commitPlacement(id)
    }
  }

  private commitPlacement(id: number): void {
    const c = this.slots.get(id).center
    this.tray.removeItem(id)
    this.slots.place(id)
    this.starBurst.play(c.x, c.y)
    this.audioMgr.playCorrect()
    if (!this.solvedOnce) {
      this.solvedOnce = true
      trackEvent('CHALLENGE_SOLVED')
    }
    this.placedInRound += 1
    this.progress.onPlacement()
    if (this.gated) return
    if (this.placedInRound >= this.currentRoundIds.length) this.advanceRound()
    else this.resetIdle()
  }

  private advanceRound(): void {
    this.roundIndex += 1
    if (this.roundIndex >= this.rounds.length) {
      this.progress.onAllComplete()
      return
    }
    this.time.delayedCall(450, () => this.startRound())
  }

  private onWrong(id: number): void {
    this.audioMgr.playWrong()
    this.tray.returnItem(id)
    this.resetIdle()
  }

  // -- idle hint -------------------------------------------------------------
  private resetIdle(): void {
    this.idleTimer?.remove()
    if (this.gated) return
    this.idleTimer = this.time.delayedCall(IDLE_HINT_MS, () => this.showIdleHint())
  }

  private showIdleHint(): void {
    if (this.gated || this.hand.isActive) return
    const ids = this.tray.currentIds()
    if (!ids.length) return
    const id = ids[0]
    const img = this.tray.objectOf(id)
    const c = this.slots.get(id).center
    if (img) this.hand.armIdle(img, c.x, c.y)
  }

  // -- end of run ------------------------------------------------------------
  private endGame(): void {
    if (this.gated) return
    this.gated = true
    this.idleTimer?.remove()
    this.hand.cancel()
    this.dragCtl.setEnabled(false)
    this.countdown?.hide()
    notifyGameEnd()
    // End scene shows the room exactly as the player left it (only what they
    // placed). Hide the tray, crossfade to color, then present the end card.
    this.tray.setVisible(false)
    // The store redirect fires on a tap ANYWHERE on the end card; we don't auto-
    // redirect before it (would navigate away first; networks reject that).
    this.roomBg.crossfadeToColored()
    this.time.delayedCall(800, () => this.endCard.show())
  }

  relayout(): void {
    this.roomBg.relayout()
    this.slots.relayout()
    this.tray.relayout()
    this.hand.relayout()
    this.endCard.relayout()
    this.countdown?.relayout()
  }

  private cleanup(): void {
    this.game.events.off('ad-pause', this.onAdPause, this)
    this.game.events.off('ad-resume', this.onAdResume, this)
    this.game.events.off('ad-mute', this.onAdMute, this)
    this.game.events.off('ad-volume', this.onAdVolume, this)
    this.idleTimer?.remove()
  }
}
