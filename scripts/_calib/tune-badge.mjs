// Composite a tray draggable with the number badge BEHIND it (fixed position),
// at several sticker shrink factors, to pick a shrink where the number stays
// visible. Badge stays fixed; only the sticker shrinks.
import sharp from 'sharp'
import fs from 'node:fs'

const ITEM = 250
const BX = 75, BY = 80, R = 40 // badge offset + radius (design px, FIXED)
const dragDir = 'src/assets/Sprites/Draggable'
const fileById = {}
for (const f of fs.readdirSync(dragDir)) {
  const m = f.match(/sticker_(\d+)_/)
  if (m) fileById[+m[1]] = `${dragDir}/${f}`
}

async function cell(id, shrink) {
  const C = 320, cx = 160, cy = 160
  const badge = Buffer.from(
    `<svg width="${C}" height="${C}" xmlns="http://www.w3.org/2000/svg">` +
      `<circle cx="${cx + BX}" cy="${cy - BY}" r="${R}" fill="#fff" stroke="#000" stroke-width="5"/>` +
      `<text x="${cx + BX}" y="${cy - BY + 16}" font-size="46" font-weight="bold" font-family="sans-serif" text-anchor="middle" fill="#000">${id}</text>` +
      `<text x="6" y="24" font-size="22" fill="#c00">${id} @ ${shrink}</text></svg>`,
  )
  const dw = Math.round(ITEM * shrink)
  const dh = Math.round(ITEM * (343 / 339) * shrink)
  const drag = await sharp(fileById[id]).resize(dw, dh).toBuffer()
  return sharp({ create: { width: C, height: C, channels: 4, background: '#d8dde6' } })
    .composite([
      { input: badge, top: 0, left: 0 }, // badge behind
      { input: drag, top: Math.round(cy - dh / 2), left: Math.round(cx - dw / 2) }, // sticker on top
    ])
    .png()
    .toBuffer()
}

const ids = [35, 39, 9, 10]
const shrinks = [1.0, 0.82, 0.72, 0.64]
const layers = []
for (let r = 0; r < ids.length; r++) {
  for (let c = 0; c < shrinks.length; c++) {
    layers.push({ input: await cell(ids[r], shrinks[c]), left: c * 320, top: r * 320 })
  }
}
await sharp({ create: { width: 320 * shrinks.length, height: 320 * ids.length, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
  .composite(layers)
  .resize({ width: 900 })
  .png()
  .toFile('scripts/_calib/tune.png')
console.log('done')
