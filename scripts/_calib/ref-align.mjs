import sharp from 'sharp'
// 1) Blend ref.jpg (50%) over the game's center-cropped colored bg (50%) to see
//    whether the reference's room (couch/window/shelf) lines up with the game bg.
// 2) Emit a fine gridded ref for measuring all 50 sticker positions + sizes.
const refMeta = await sharp('src/assets/Sprites/ref.jpg').metadata()
console.log('ref:', refMeta.width + 'x' + refMeta.height)

const bgCrop = await sharp('src/assets/Sprites/Background/Bg-colored-extended_1.png')
  .extract({ left: 60, top: 0, width: 1080, height: 1920 })
  .toBuffer()
const refResized = await sharp('src/assets/Sprites/ref.jpg').resize(1080, 1920, { fit: 'fill' }).ensureAlpha(0.5).toBuffer()
await sharp(bgCrop).composite([{ input: refResized, blend: 'over' }]).png().toFile('scripts/_calib/ref-overlay.png')

// gridded ref for measuring
const W = 1080, H = 1920, stepX = 60, stepY = 60
let g = ''
for (let x = 0; x <= W; x += stepX) {
  const major = x % 120 === 0
  g += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="red" stroke-width="${major ? 2 : 1}" opacity="${major ? 0.6 : 0.3}"/>`
  if (major) g += `<text x="${x + 2}" y="26" fill="red" font-size="24" font-family="sans-serif">${x}</text>`
}
for (let y = 0; y <= H; y += stepY) {
  const major = y % 120 === 0
  g += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="blue" stroke-width="${major ? 2 : 1}" opacity="${major ? 0.6 : 0.3}"/>`
  if (major) g += `<text x="2" y="${y + 22}" fill="blue" font-size="24" font-family="sans-serif">${y}</text>`
}
await sharp('src/assets/Sprites/ref.jpg')
  .resize(1080, 1920, { fit: 'fill' })
  .composite([{ input: Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`), top: 0, left: 0 }])
  .png()
  .toFile('scripts/_calib/ref-measured.png')
console.log('done')
