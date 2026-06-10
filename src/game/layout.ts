// Room layout data (data only — no Phaser). Each sticker's center + native art
// size in 1080x1920 design space. The outline (empty slot) and the colored art
// share these dims, so one center co-locates both.
//
// Positions are matched to ref.jpg (the reference is composed on this same room
// at native scale, so STICKER_SCALE = 1.0 reproduces its sizing). Derived via
// scripts/_calib/ref-match.mjs (template-matching each Numbered silhouette).
export interface StickerDef {
  id: number
  name: string
  cx: number
  cy: number
  w: number
  h: number
  /** Flat floor covering (rug): render in a back sub-band, always under people. */
  floor?: boolean
  /** Optional explicit feet/base y (design) overriding cy + h*scale/2 for depth. */
  base?: number
  /** Per-sticker size multiplier on top of STICKER_SCALE. */
  scale?: number
  /** Number-badge offset from center (design px) when centers would collide. */
  nx?: number
  ny?: number
}

export const STICKERS: StickerDef[] = [
  { id: 1, name: 'Girl-Pink-Duduk', cx: 449, cy: 958, w: 178, h: 197 },
  { id: 2, name: 'Girl-Duduk', cx: 718, cy: 1219, w: 163, h: 305 },
  { id: 3, name: 'Girl-Tea-2', cx: 281, cy: 1337, w: 157, h: 359 },
  { id: 4, name: 'Telfon', cx: 137, cy: 831, w: 194, h: 116 },
  { id: 5, name: 'Pigora-Gunung', cx: 441, cy: 273, w: 121, h: 145 },
  { id: 6, name: 'Pewangi-Ruangan', cx: 867, cy: 104, w: 71, h: 147 },
  { id: 7, name: 'Meja', cx: 526, cy: 1065, w: 235, h: 170, ny: -45 },
  { id: 8, name: 'Majalah', cx: 579, cy: 1193, w: 136, h: 140 },
  { id: 9, name: 'Ibu-Masak', cx: 879, cy: 1196, w: 191, h: 362 },
  { id: 10, name: 'Kursi', cx: 150, cy: 937, w: 286, h: 179 },
  { id: 11, name: 'Girl-Sleep', cx: 368, cy: 475, w: 179, h: 269 },
  { id: 12, name: 'Buku', cx: 785, cy: 91, w: 163, h: 170 },
  { id: 13, name: 'Cheesecake', cx: 901, cy: 701, w: 147, h: 98 },
  { id: 14, name: 'Karpet', cx: 564, cy: 1082, w: 531, h: 207, floor: true, ny: 45 },
  { id: 15, name: 'Water', cx: 92, cy: 1115, w: 171, h: 103 },
  { id: 16, name: 'Remote', cx: 396, cy: 672, w: 171, h: 157 },
  { id: 17, name: 'Jam-Dinding', cx: 442, cy: 86, w: 139, h: 138 },
  { id: 18, name: 'Bantal', cx: 716, cy: 490, w: 183, h: 161 },
  { id: 19, name: 'Bayi', cx: 745, cy: 978, w: 190, h: 172 },
  { id: 20, name: 'Boy-Kucing', cx: 664, cy: 1418, w: 152, h: 347 },
  { id: 21, name: 'Keys', cx: 218, cy: 1118, w: 184, h: 128 },
  { id: 22, name: 'Bear', cx: 91, cy: 674, w: 119, h: 149 },
  { id: 23, name: 'Pigora-Tulip', cx: 746, cy: 301, w: 105, h: 142 },
  { id: 24, name: 'Balok-Menara', cx: 589, cy: 882, w: 118, h: 153 },
  { id: 25, name: 'Boy-Juice', cx: 885, cy: 1168, w: 143, h: 297 },
  { id: 26, name: 'Pot', cx: 172, cy: 484, w: 293, h: 381 },
  { id: 27, name: 'Boy-Hide-Lamp', cx: 935, cy: 515, w: 141, h: 315 },
  { id: 28, name: 'Dot-Susu', cx: 617, cy: 1029, w: 105, h: 154 },
  { id: 29, name: 'Yarn', cx: 296, cy: 680, w: 284, h: 146 },
  { id: 30, name: 'Dekorasi', cx: 600, cy: 276, w: 118, h: 191 },
  { id: 31, name: 'Ibu-Bayi', cx: 828, cy: 983, w: 199, h: 318 },
  { id: 32, name: 'Boy-Duduk-Sila', cx: 411, cy: 1124, w: 157, h: 258 },
  { id: 33, name: 'Tong-Sampah', cx: 57, cy: 593, w: 100, h: 151 },
  { id: 34, name: 'Kaktus', cx: 939, cy: 97, w: 126, h: 158 },
  { id: 35, name: 'Boy-Cookie', cx: 687, cy: 722, w: 196, h: 313 },
  { id: 36, name: 'Boy-Plane', cx: 482, cy: 1387, w: 264, h: 358 },
  { id: 37, name: 'Boy-Tiduran', cx: 347, cy: 819, w: 253, h: 162 },
  { id: 38, name: 'Boy-Laper', cx: 521, cy: 759, w: 146, h: 295 },
  { id: 39, name: 'Bapak-Mau-Makan', cx: 860, cy: 1413, w: 173, h: 347 },
  { id: 40, name: 'Girl-Tea-1', cx: 123, cy: 1283, w: 246, h: 442 },
  { id: 41, name: 'Boy-Telp', cx: 519, cy: 768, w: 147, h: 318 },
  { id: 42, name: 'Cicak', cx: 629, cy: 91, w: 207, h: 169 },
  { id: 43, name: 'Teh', cx: 804, cy: 704, w: 123, h: 85 },
  { id: 44, name: 'Girl-Read', cx: 262, cy: 969, w: 159, h: 250 },
  { id: 45, name: 'Gantungan-Topi', cx: 897, cy: 318, w: 152, h: 153 },
  { id: 46, name: 'Truck', cx: 747, cy: 846, w: 155, h: 90 },
  { id: 47, name: 'Cat', cx: 540, cy: 517, w: 204, h: 145 },
  { id: 48, name: 'Girl-Boneka', cx: 996, cy: 946, w: 168, h: 315 },
  { id: 49, name: 'Balok-Angka', cx: 539, cy: 1055, w: 144, h: 119 },
  { id: 50, name: 'Blanket', cx: 400, cy: 313, w: 208, h: 122 },
]

// Reveal order, sets of 3 (last set has 2). Round 1 mirrors the ref tray
// (pouf / rug / table). The rest are spread left/center/right so the 3 active
// outlines never clump into one ambiguous blob.
export const ROUNDS: number[][] = [
  [10, 14, 7],
  [26, 50, 12],
  [11, 17, 6],
  [16, 47, 34],
  [29, 18, 45],
  [4, 5, 27],
  [37, 30, 38],
  [44, 42, 13],
  [22, 23, 48],
  [33, 41, 49],
  [15, 35, 31],
  [21, 24, 25],
  [32, 19, 9],
  [46, 1, 39],
  [40, 28, 8],
  [3, 2, 36],
  [20, 43],
]

const BY_ID = new Map<number, StickerDef>(STICKERS.map((s) => [s.id, s]))
export const stickerById = (id: number): StickerDef => {
  const s = BY_ID.get(id)
  if (!s) throw new Error(`Unknown sticker id ${id}`)
  return s
}

export const TOTAL_STICKERS = STICKERS.length
