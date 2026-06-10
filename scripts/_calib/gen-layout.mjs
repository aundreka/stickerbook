import fs from 'node:fs'
const pos = JSON.parse(fs.readFileSync('scripts/_calib/ref-positions.json', 'utf8'))
const META = {
  1: ['Girl-Pink-Duduk', 178, 197], 2: ['Girl-Duduk', 163, 305], 3: ['Girl-Tea-2', 157, 359],
  4: ['Telfon', 194, 116], 5: ['Pigora-Gunung', 121, 145], 6: ['Pewangi-Ruangan', 71, 147],
  7: ['Meja', 235, 170], 8: ['Majalah', 136, 140], 9: ['Ibu-Masak', 191, 362], 10: ['Kursi', 286, 179],
  11: ['Girl-Sleep', 179, 269], 12: ['Buku', 163, 170], 13: ['Cheesecake', 147, 98], 14: ['Karpet', 531, 207],
  15: ['Water', 171, 103], 16: ['Remote', 171, 157], 17: ['Jam-Dinding', 139, 138], 18: ['Bantal', 183, 161],
  19: ['Bayi', 190, 172], 20: ['Boy-Kucing', 152, 347], 21: ['Keys', 184, 128], 22: ['Bear', 119, 149],
  23: ['Pigora-Tulip', 105, 142], 24: ['Balok-Menara', 118, 153], 25: ['Boy-Juice', 143, 297],
  26: ['Pot', 293, 381], 27: ['Boy-Hide-Lamp', 141, 315], 28: ['Dot-Susu', 105, 154], 29: ['Yarn', 284, 146],
  30: ['Dekorasi', 118, 191], 31: ['Ibu-Bayi', 199, 318], 32: ['Boy-Duduk-Sila', 157, 258],
  33: ['Tong-Sampah', 100, 151], 34: ['Kaktus', 126, 158], 35: ['Boy-Cookie', 196, 313], 36: ['Boy-Plane', 264, 358],
  37: ['Boy-Tiduran', 253, 162], 38: ['Boy-Laper', 146, 295], 39: ['Bapak-Mau-Makan', 173, 347],
  40: ['Girl-Tea-1', 246, 442], 41: ['Boy-Telp', 147, 318], 42: ['Cicak', 207, 169], 43: ['Teh', 123, 85],
  44: ['Girl-Read', 159, 250], 45: ['Gantungan-Topi', 152, 153], 46: ['Truck', 155, 90], 47: ['Cat', 204, 145],
  48: ['Girl-Boneka', 168, 315], 49: ['Balok-Angka', 144, 119], 50: ['Blanket', 208, 122],
}
const FLOOR = new Set([14])
const lines = []
for (let id = 1; id <= 50; id++) {
  const m = META[id], p = pos[id]
  if (!p) continue
  const floor = FLOOR.has(id) ? ', floor: true' : ''
  lines.push(`  { id: ${id}, name: '${m[0]}', cx: ${p[0]}, cy: ${p[1]}, w: ${m[1]}, h: ${m[2]}${floor} },`)
}
fs.writeFileSync('scripts/_calib/stickers-array.txt', lines.join('\n'))
console.log(lines.join('\n'))
