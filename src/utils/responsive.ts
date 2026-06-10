// Coordinate helpers. The design space (DESIGN_W x DESIGN_H = the ref.jpg
// composition) is FIT (contain) into the canvas so EVERY sticker and the tray
// stay fully visible in both portrait and landscape — nothing is cropped. The
// letterbox bands are filled seamlessly by RoomBackground's wall/floor backdrop
// so it still reads as full-bleed. No hardcoded canvas px in game code —
// everything goes through sx()/sy()/sd().
import { DESIGN_W, DESIGN_H } from '../constants'

let _s = 1
let _offX = 0
let _offY = 0
let _vw = DESIGN_W
let _vh = DESIGN_H

let _inset = { top: 0, right: 0, bottom: 0, left: 0 }

/** Recompute the design->canvas transform for a canvas of vw x vh pixels. */
export function computeMetrics(vw: number, vh: number): void {
  _vw = vw
  _vh = vh
  _s = Math.min(vw / DESIGN_W, vh / DESIGN_H)
  _offX = (vw - DESIGN_W * _s) / 2
  _offY = (vh - DESIGN_H * _s) / 2
}

/** Store safe-area insets (already converted to canvas px). */
export function setSafeInsets(top: number, right: number, bottom: number, left: number): void {
  _inset = { top, right, bottom, left }
}

export const sx = (x: number): number => _offX + x * _s
export const sy = (y: number): number => _offY + y * _s
export const sd = (d: number): number => d * _s

export const scale = (): number => _s
export const viewW = (): number => _vw
export const viewH = (): number => _vh
export const insets = () => _inset

/** Whether the canvas is currently wider than tall (landscape). */
export const isLandscape = (): boolean => _vw > _vh
