// Regenerate src/game/layout.ts's STICKERS array from a layout.json exported by
// tools/sticker-editor.html. Usage: node scripts/gen-layout.mjs [path/to/layout.json]
import fs from 'node:fs'
import path from 'node:path'

const jsonPath = process.argv[2] || 'layout.json'
const items = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

const NAMES = { 1: 'Girl-Pink-Duduk', 2: 'Girl-Duduk', 3: 'Girl-Tea-2', 4: 'Telfon', 5: 'Pigora-Gunung', 6: 'Pewangi-Ruangan', 7: 'Meja', 8: 'Majalah', 9: 'Ibu-Masak', 10: 'Kursi', 11: 'Girl-Sleep', 12: 'Buku', 13: 'Cheesecake', 14: 'Karpet', 15: 'Water', 16: 'Remote', 17: 'Jam-Dinding', 18: 'Bantal', 19: 'Bayi', 20: 'Boy-Kucing', 21: 'Keys', 22: 'Bear', 23: 'Pigora-Tulip', 24: 'Balok-Menara', 25: 'Boy-Juice', 26: 'Pot', 27: 'Boy-Hide-Lamp', 28: 'Dot-Susu', 29: 'Yarn', 30: 'Dekorasi', 31: 'Ibu-Bayi', 32: 'Boy-Duduk-Sila', 33: 'Tong-Sampah', 34: 'Kaktus', 35: 'Boy-Cookie', 36: 'Boy-Plane', 37: 'Boy-Tiduran', 38: 'Boy-Laper', 39: 'Bapak-Mau-Makan', 40: 'Girl-Tea-1', 41: 'Boy-Telp', 42: 'Cicak', 43: 'Teh', 44: 'Girl-Read', 45: 'Gantungan-Topi', 46: 'Truck', 47: 'Cat', 48: 'Girl-Boneka', 49: 'Balok-Angka', 50: 'Blanket' }
const SIZE = { 1: [178, 197], 2: [163, 305], 3: [157, 359], 4: [194, 116], 5: [121, 145], 6: [71, 147], 7: [235, 170], 8: [136, 140], 9: [191, 362], 10: [286, 179], 11: [179, 269], 12: [163, 170], 13: [147, 98], 14: [531, 207], 15: [171, 103], 16: [171, 157], 17: [139, 138], 18: [183, 161], 19: [190, 172], 20: [152, 347], 21: [184, 128], 22: [119, 149], 23: [105, 142], 24: [118, 153], 25: [143, 297], 26: [293, 381], 27: [141, 315], 28: [105, 154], 29: [284, 146], 30: [118, 191], 31: [199, 318], 32: [157, 258], 33: [100, 151], 34: [126, 158], 35: [196, 313], 36: [264, 358], 37: [253, 162], 38: [146, 295], 39: [173, 347], 40: [246, 442], 41: [147, 318], 42: [207, 169], 43: [123, 85], 44: [159, 250], 45: [152, 153], 46: [155, 90], 47: [204, 145], 48: [168, 315], 49: [144, 119], 50: [208, 122] }

items.sort((a, b) => a.id - b.id)
const lines = items.map((it) => {
  const [w, h] = SIZE[it.id]
  let s = `  { id: ${it.id}, name: '${NAMES[it.id]}', cx: ${Math.round(it.x)}, cy: ${Math.round(it.y)}, w: ${w}, h: ${h}`
  if (Math.round(it.labelX) !== Math.round(it.x)) s += `, labelX: ${Math.round(it.labelX)}`
  if (Math.round(it.labelY) !== Math.round(it.y)) s += `, labelY: ${Math.round(it.labelY)}`
  if (it.zIndex) s += `, zIndex: ${it.zIndex}`
  if (it.scale && it.scale !== 1) s += `, scale: ${it.scale}`
  return s + ' },'
})

const file = path.resolve('src/game/layout.ts')
let src = fs.readFileSync(file, 'utf8')
const block = `export const STICKERS: StickerDef[] = [\n${lines.join('\n')}\n]`
src = src.replace(/export const STICKERS: StickerDef\[\] = \[[\s\S]*?\n\]/, block)
fs.writeFileSync(file, src)
console.log(`Updated ${items.length} stickers in src/game/layout.ts from ${jsonPath}`)
