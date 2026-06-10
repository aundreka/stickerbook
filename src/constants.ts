// Design reference space. ref.jpg is authored at 1080x1920 and the room
// background (1200x1920) is drawn to cover this window with ~60px horizontal
// bleed each side. All gameplay coordinates live in this space and go through
// sx()/sy()/sd() in utils/responsive.ts.
export const DESIGN_W = 1080
export const DESIGN_H = 1920

// The background's native width; it is centred over the design window.
export const BG_W = 1200
export const BG_H = 1920

// Wall/floor split (design y) and colors, sampled from the colored room. Used to
// fill the letterbox bands so the room reads as full-bleed at any aspect.
export const FLOOR_LINE_Y = 637
export const ROOM_COLORS = {
  wallWhite: 0xffffff,
  floorWhite: 0xffffff,
  wallColored: 0xfadaf1,
  floorColored: 0xf8e7ba,
}

// Store pages. NOTE: replace with the real Sticker Book Puzzle store URLs
// before launch (the practice-task PDF links were not resolvable here).
export const STORE_URL = {
  ios: 'https://apps.apple.com/app/id0000000000',
  android: 'https://play.google.com/store/apps/details?id=com.stickerbook.roomdecor',
}

// Depth map. Room stickers compute depth in StickerSlot as
// `zIndex * ROOM_Z + feetY` — zIndex (from the editor) is the primary layer and
// the sprite's bottom (feet) breaks ties, so a sticker lower in the room draws
// in front of one higher up at the same zIndex. UI/VFX bands sit far above the
// whole room range.
export const DEPTH = {
  BG: -1_000_000, // RoomBackground bands at BG, images at BG+1
  ROOM_Z: 3000, // per-zIndex layer separation for room stickers
  OUTLINE_BADGE: 50_000, // small outline numbers, above all room stickers
  TRAY_BG: 99_980,
  TRAY_BADGE: 99_990, // BEHIND the tray sticker (request: badge behind, peeking)
  TRAY_ITEM: 100_000,
  DRAG: 100_050,
  BURST: 100_100,
  LOGO: 100_200,
  HUD: 105_000, // countdown timer — above room/tray, below the end card
  DIM: 110_000,
  HAND: 111_000,
  ENDCARD: 120_000,
  ENDCARD_INPUT: 120_010,
}

// Global sticker scale multiplier; per-sticker `scale` (from the editor)
// multiplies this. The reference is composed at native scale, so 1.0 matches it.
export const STICKER_SCALE = 1.0

// Interaction timings (ms).
export const IDLE_HINT_MS = 5000
export const TUTORIAL_DIM_ALPHA = 0.75

// Tray geometry in design space (blue-cointainer is 1080x389).
export const TRAY_H = 360
export const TRAY_SLOTS = 3
