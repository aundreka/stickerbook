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
    // A tab-switch / ad pause can interrupt a drag mid-flight; drop that drag so
    // Phaser's input isn't left stranded (which froze further dragging on resume).
    this.tray?.cancelDrag()
    // Once the end card is up, keep the scene animating (so the CTA keeps
    // pulsing even after the store opens) — just mute the audio.
    if (!this.gated && !this.scene.isPaused()) this.scene.pause()
  }
  private onAdResume(): void {
    if (this.scene.isPaused()) this.scene.resume()
    this.audioMgr.resume()
    // Make sure the tray is interactive again after a resume (defends against a
    // pause that stranded input state).
    if (!this.gated) this.dragCtl.setEnabled(true)
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
    const def = this.slots.get(id).def
    if (img) this.hand.showTutorial(img, def.cx, def.cy)
  }

  private onDragStart(): void {
    this.hand.cancel()
    this.tutorialDone = true
    this.beginPlay()
    this.resetIdle()
  }

  // The dragged sticker stays under the finger until its box overlaps the target
  // outline by >= SNAP_ON (strict — basically dragged right onto it). At that
  // point it SMOOTHLY eases onto the slot as the COLORED art at the exact outline
  // size and the outline's pulse stops. It stays locked there until pulled back
  // out (overlap < SNAP_OFF — hysteresis so it doesn't flicker), then resumes
  // following the finger. Overlap is measured against the FIXED tray-sticker box
  // at the cursor (independent of the snap state) so it's stable.
  private static readonly SNAP_ON = 0.8
  private static readonly SNAP_OFF = 0.6
  private onDragMove(id: number, px: number, py: number): void {
    const img = this.tray.objectOf(id)
    if (!img) return
    const slot = this.slots.get(id)
    if (!slot.active || slot.placed) return
    const c = slot.center
    const ds = slot.displaySize // outline box (screen px)
    const td = this.tray.normalDisplaySize() // tray sticker box (screen px)
    const overlap = boxOverlapRatio(px, py, td.w, td.h, c.x, c.y, ds.w, ds.h)
    const locked = img.getData('snapLock') === true
    if (!locked && overlap >= GameScene.SNAP_ON) {
      img.setData('snapLock', true)
      slot.setPulsing(false)
      this.tray.snapTo(id, c.x, c.y, ds.w, ds.h)
    } else if (locked && overlap < GameScene.SNAP_OFF) {
      img.setData('snapLock', false)
      slot.setPulsing(true)
      this.tray.clearPreview(id)
    }
  }

  private onDrop(id: number, x: number, y: number): void {
    if (this.gated) return
    this.tray.objectOf(id)?.setData('snapLock', false)
    if (this.match.isCorrect(id, x, y)) this.onCorrect(id)
    else this.onWrong(id)
  }

  private onCorrect(id: number): void {
    const c = this.slots.get(id).center
    const img = this.tray.objectOf(id)
    // If it was already snapped, it's sitting on the slot at the right size, so
    // place it seamlessly (no shrink-then-pop). Otherwise ease it in first.
    if (img && this.tray.isPreviewing(id)) {
      this.commitPlacement(id, false)
    } else if (img) {
      this.tweens.killTweensOf(img)
      this.tweens.add({
        targets: img,
        x: c.x,
        y: c.y,
        duration: 150,
        ease: 'Sine.easeIn',
        onComplete: () => this.commitPlacement(id, true),
      })
    } else {
      this.commitPlacement(id, true)
    }
  }

  private commitPlacement(id: number, pop = true): void {
    const c = this.slots.get(id).center
    this.tray.removeItem(id)
    this.slots.place(id, pop)
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
    const def = this.slots.get(id).def
    if (img) this.hand.armIdle(img, def.cx, def.cy)
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

// Intersection area of two center-anchored boxes as a fraction of the SMALLER
// box's area (0 = apart, 1 = fully overlapping the smaller one). Used to decide
// the drag snap purely from rectangle overlap.
function boxOverlapRatio(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): number {
  const ix = Math.min(ax + aw / 2, bx + bw / 2) - Math.max(ax - aw / 2, bx - bw / 2)
  const iy = Math.min(ay + ah / 2, by + bh / 2) - Math.max(ay - ah / 2, by - bh / 2)
  if (ix <= 0 || iy <= 0) return 0
  return (ix * iy) / Math.min(aw * ah, bw * bh)
}
