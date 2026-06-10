// Overlay the Numbered outlines at the matched positions over ref.jpg (red tint)
// so misaligned matches are obvious (ghosted/offset). Full + quadrants.
import sharp from 'sharp'
import fs from 'node:fs'

const pos = JSON.parse(fs.readFileSync('scripts/_calib/ref-positions.json', 'utf8'))
const base = await sharp('src/assets/Sprites/ref.jpg').resize(1080, 1920, { fit: 'fill' }).grayscale().toColourspace('srgb').toBuffer()
const layers = []
for (const id of Object.keys(pos)) {
  const file = `src/assets/Sprites/Numbered/${id}.png`
  const meta = await sharp(file).metadata()
  // tint the silhouette red, keep alpha
  const red = await sharp(file)
    .ensureAlpha()
    .tint({ r: 255, g: 0, b: 0 })
    .png()
    .toBuffer()
  layers.push({ input: red, left: pos[id][0] - Math.round(meta.width / 2), top: pos[id][1] - Math.round(meta.height / 2), blend: 'over' })
}
const composed = await sharp(base).composite(layers).png().toBuffer()
await sharp(composed).png().toFile('scripts/_calib/match-full.png')
const quads = [['TL', 0, 0], ['TR', 540, 0], ['BL', 0, 960], ['BR', 540, 960]]
for (const [n, l, t] of quads) {
  await sharp(composed).extract({ left: l, top: t, width: 540, height: 960 }).resize({ width: 700 }).png().toFile(`scripts/_calib/match-${n}.png`)
}
console.log('done')
