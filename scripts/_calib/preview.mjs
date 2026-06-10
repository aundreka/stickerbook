// Composite the COLORED stickers onto the real (center-cropped) game background
// at the coords in src/game/layout.ts, using the same feet/floor depth sort and
// STICKER_SCALE the game uses. Outputs a labeled + clean image for calibration.
import sharp from 'sharp'
import fs from 'node:fs'

const SCALE = 1.0 // keep in sync with STICKER_SCALE

const src = fs.readFileSync('src/game/layout.ts', 'utf8')
const re = /\{\s*id:\s*(\d+),\s*name:\s*'([^']*)',\s*cx:\s*(-?\d+),\s*cy:\s*(-?\d+),\s*w:\s*(\d+),\s*h:\s*(\d+)([^}]*)\}/g
const items = []
let m
while ((m = re.exec(src))) {
  items.push({
    id: +m[1], name: m[2], cx: +m[3], cy: +m[4], w: +m[5], h: +m[6],
    floor: /floor:\s*true/.test(m[7] || ''),
  })
}

const dir = 'src/assets/Sprites/Colored'
const fileById = {}
for (const f of fs.readdirSync(dir)) {
  const mm = f.match(/sticker_(\d+)_/)
  if (mm) fileById[+mm[1]] = `${dir}/${f}`
}

const base = await sharp('src/assets/Sprites/Background/Bg-colored-extended_1.png')
  .extract({ left: 60, top: 0, width: 1080, height: 1920 })
  .toBuffer()

const feet = (it) => it.cy + (it.h * SCALE) / 2
const depth = (it) => (it.floor ? feet(it) / 10000 : 100 + feet(it))
const sorted = [...items].sort((a, b) => depth(a) - depth(b))

const layers = []
for (const it of sorted) {
  const w = Math.max(1, Math.round(it.w * SCALE))
  const h = Math.max(1, Math.round(it.h * SCALE))
  const buf = await sharp(fileById[it.id]).resize(w, h).toBuffer()
  const left = Math.round(it.cx - w / 2)
  const top = Math.round(it.cy - h / 2)
  layers.push({ input: buf, left: Math.max(0, left), top: Math.max(0, top) })
}
const composed = await sharp(base).composite(layers).png().toBuffer()
await sharp(composed).png().toFile('scripts/_calib/preview-clean.png')

const labels = items.map(
  (it) =>
    `<circle cx="${it.cx}" cy="${it.cy}" r="15" fill="yellow" opacity="0.8"/>` +
    `<text x="${it.cx}" y="${it.cy + 6}" fill="black" font-size="22" font-weight="bold" font-family="sans-serif" text-anchor="middle">${it.id}</text>`,
)
const labelSvg = `<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">${labels.join('')}</svg>`
await sharp(composed).composite([{ input: Buffer.from(labelSvg), top: 0, left: 0 }]).png().toFile('scripts/_calib/preview-full.png')
console.log('done', items.length, 'stickers')
