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

// Depth map. Room stickers compute their own depth from their FEET in
// StickerSlot (floor items ~0..1, everything else ~100..2050, painter-sorted by
// where the sprite's bottom rests). The UI/VFX bands below sit clearly above
// that range so they always layer over the room.
export const DEPTH = {
  BG: -10, // RoomBackground draws bands at -10, bg images at -9
  ROOM_MAX: 2100, // top of the room sticker band
  OUTLINE_BADGE: 2200, // active-outline number badges sit above all room stickers
  TRAY_BG: 3000,
  TRAY_ITEM: 3010,
  TRAY_BADGE: 3016,
  DRAG: 3050,
  BURST: 3100,
  LOGO: 3200,
  DIM: 4000,
  HAND: 4100,
  ENDCARD: 5000,
  ENDCARD_INPUT: 5010,
}

// Global sticker scale (the source art is sized for a denser room; scaling down
// gives the lighter spacing we want). Per-sticker `scale` multiplies this.
// The reference (ref.jpg) is composed on this same room at native sticker scale,
// so 1.0 reproduces the reference's sizing/density exactly.
export const STICKER_SCALE = 1.0

// Interaction timings (ms).
export const IDLE_HINT_MS = 5000
export const TUTORIAL_DIM_ALPHA = 0.75

// Tray geometry in design space (blue-cointainer is 1080x389).
export const TRAY_H = 360
export const TRAY_SLOTS = 3
