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
  /** Absolute number-label position (design px); defaults to the sticker center. */
  labelX?: number
  labelY?: number
  /** Stacking layer (higher = in front). Negative pushes behind (e.g. the rug). */
  zIndex?: number
  /** Per-sticker size multiplier (on top of STICKER_SCALE). */
  scale?: number
}

export const STICKERS: StickerDef[] = [
  { id: 1, name: 'Girl-Pink-Duduk', cx: 449, cy: 958, w: 178, h: 197, labelX: 428, labelY: 988, scale: 1.03 },
  { id: 2, name: 'Girl-Duduk', cx: 718, cy: 1219, w: 163, h: 305, labelX: 738, labelY: 1216, scale: 1.09 },
  { id: 3, name: 'Girl-Tea-2', cx: 281, cy: 1337, w: 157, h: 359, labelX: 262, labelY: 1357 },
  { id: 4, name: 'Telfon', cx: 132, cy: 832, w: 194, h: 116, labelX: 145, labelY: 826, zIndex: 1, scale: 0.97 },
  { id: 5, name: 'Pigora-Gunung', cx: 441, cy: 273, w: 121, h: 145 },
  { id: 6, name: 'Pewangi-Ruangan', cx: 867, cy: 104, w: 71, h: 147, labelX: 866, labelY: 143 },
  { id: 7, name: 'Meja', cx: 864, cy: 771, w: 235, h: 170, labelX: 860, labelY: 711 },
  { id: 8, name: 'Majalah', cx: 579, cy: 1193, w: 136, h: 140, labelX: 567, labelY: 1185 },
  { id: 9, name: 'Ibu-Masak', cx: 1000, cy: 1320, w: 191, h: 362, labelX: 983, labelY: 1302 },
  { id: 10, name: 'Kursi', cx: 150, cy: 937, w: 286, h: 179, labelX: 153, labelY: 951 },
  { id: 11, name: 'Girl-Sleep', cx: 368, cy: 475, w: 179, h: 269 },
  { id: 12, name: 'Buku', cx: 785, cy: 91, w: 163, h: 170, labelX: 782, labelY: 128 },
  { id: 13, name: 'Cheesecake', cx: 901, cy: 701, w: 147, h: 98, labelX: 905, labelY: 698, zIndex: 1, scale: 0.94 },
  { id: 14, name: 'Karpet', cx: 564, cy: 1082, w: 531, h: 207, labelX: 589, labelY: 1062, zIndex: -1 },
  { id: 15, name: 'Water', cx: 64, cy: 1021, w: 171, h: 103, labelX: 32, labelY: 1003 },
  { id: 16, name: 'Remote', cx: 396, cy: 672, w: 171, h: 157 },
  { id: 17, name: 'Jam-Dinding', cx: 442, cy: 86, w: 139, h: 138 },
  { id: 18, name: 'Bantal', cx: 716, cy: 490, w: 183, h: 161 },
  { id: 19, name: 'Bayi', cx: 745, cy: 978, w: 190, h: 172, labelX: 773, labelY: 993 },
  { id: 20, name: 'Boy-Kucing', cx: 664, cy: 1418, w: 152, h: 347, labelX: 667, labelY: 1432 },
  { id: 21, name: 'Keys', cx: 225, cy: 1125, w: 184, h: 128, labelX: 238, labelY: 1107 },
  { id: 22, name: 'Bear', cx: 91, cy: 674, w: 119, h: 149, labelX: 95, labelY: 702 },
  { id: 23, name: 'Pigora-Tulip', cx: 746, cy: 301, w: 105, h: 142, labelX: 743, labelY: 299 },
  { id: 24, name: 'Balok-Menara', cx: 589, cy: 882, w: 118, h: 153, labelX: 584, labelY: 847 },
  { id: 25, name: 'Boy-Juice', cx: 888, cy: 1188, w: 143, h: 297, labelX: 881, labelY: 1164 },
  { id: 26, name: 'Pot', cx: 172, cy: 484, w: 293, h: 381, labelX: 166, labelY: 559, zIndex: -1 },
  { id: 27, name: 'Boy-Hide-Lamp', cx: 935, cy: 515, w: 141, h: 315 },
  { id: 28, name: 'Dot-Susu', cx: 626, cy: 1023, w: 105, h: 154, labelX: 632, labelY: 1045, zIndex: 1 },
  { id: 29, name: 'Yarn', cx: 296, cy: 680, w: 284, h: 146, labelX: 225, labelY: 676, zIndex: -1 },
  { id: 30, name: 'Dekorasi', cx: 600, cy: 276, w: 118, h: 191, labelX: 597, labelY: 299 },
  { id: 31, name: 'Ibu-Bayi', cx: 828, cy: 983, w: 199, h: 318, labelX: 847, labelY: 982 },
  { id: 32, name: 'Boy-Duduk-Sila', cx: 396, cy: 1125, w: 157, h: 258, labelX: 370, labelY: 1149 },
  { id: 33, name: 'Tong-Sampah', cx: 57, cy: 593, w: 100, h: 151, labelX: 58, labelY: 579 },
  { id: 34, name: 'Kaktus', cx: 939, cy: 97, w: 126, h: 158, labelX: 931, labelY: 130 },
  { id: 35, name: 'Boy-Cookie', cx: 687, cy: 722, w: 196, h: 313, labelX: 667, labelY: 726 },
  { id: 36, name: 'Boy-Plane', cx: 482, cy: 1387, w: 264, h: 358, labelX: 489, labelY: 1352 },
  { id: 37, name: 'Boy-Tiduran', cx: 347, cy: 819, w: 253, h: 162, labelX: 331, labelY: 804 },
  { id: 38, name: 'Boy-Laper', cx: 1035, cy: 602, w: 146, h: 295, labelX: 1033, labelY: 596 },
  { id: 39, name: 'Bapak-Mau-Makan', cx: 860, cy: 1413, w: 173, h: 347, labelX: 838, labelY: 1378 },
  { id: 40, name: 'Girl-Tea-1', cx: 116, cy: 1337, w: 246, h: 442, labelX: 71, labelY: 1320 },
  { id: 41, name: 'Boy-Telp', cx: 522, cy: 715, w: 147, h: 318, labelX: 526, labelY: 700 },
  { id: 42, name: 'Cicak', cx: 629, cy: 91, w: 207, h: 169, labelX: 621, labelY: 76 },
  { id: 43, name: 'Teh', cx: 831, cy: 672, w: 123, h: 85, labelX: 825, labelY: 667, zIndex: 1, scale: 0.94 },
  { id: 44, name: 'Girl-Read', cx: 262, cy: 969, w: 159, h: 250, labelX: 264, labelY: 971 },
  { id: 45, name: 'Gantungan-Topi', cx: 897, cy: 318, w: 152, h: 153 },
  { id: 46, name: 'Truck', cx: 747, cy: 846, w: 155, h: 90, labelX: 769, labelY: 834 },
  { id: 47, name: 'Cat', cx: 540, cy: 517, w: 204, h: 145, labelX: 541, labelY: 501 },
  { id: 48, name: 'Girl-Boneka', cx: 996, cy: 946, w: 168, h: 315, labelX: 987, labelY: 951 },
  { id: 49, name: 'Balok-Angka', cx: 558, cy: 1055, w: 144, h: 119, labelX: 561, labelY: 1029 },
  { id: 50, name: 'Blanket', cx: 428, cy: 440, w: 208, h: 122, labelX: 435, labelY: 423 },
]

// Randomized reveal order, built fresh each play so the sequence of stickers
// (and thus which subset shows in the 10clk / 60sec versions) differs every time.
// Fisher-Yates shuffle of all ids, chunked into sets of 3 (last set may be 2).
export function buildRounds(): number[][] {
  const ids = STICKERS.map((s) => s.id)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  const rounds: number[][] = []
  for (let i = 0; i < ids.length; i += 3) rounds.push(ids.slice(i, i + 3))
  return rounds
}

const BY_ID = new Map<number, StickerDef>(STICKERS.map((s) => [s.id, s]))
export const stickerById = (id: number): StickerDef => {
  const s = BY_ID.get(id)
  if (!s) throw new Error(`Unknown sticker id ${id}`)
  return s
}

export const TOTAL_STICKERS = STICKERS.length
