import sharp from 'sharp'
// Center-crop the colored bg to the 1080x1920 design window (design x = bg_x-60)
// and overlay a coordinate grid so the couch/floor/shelf/wall anchor regions can
// be read in DESIGN space (the same coords layout.ts uses).
const base = await sharp('src/assets/Sprites/Background/Bg-colored-extended_1.png')
  .extract({ left: 60, top: 0, width: 1080, height: 1920 })
  .toBuffer()
const W = 1080, H = 1920, stepX = 108, stepY = 96
let g = ''
for (let x = 0; x <= W; x += stepX) {
  g += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="red" stroke-width="2" opacity="0.5"/>`
  g += `<text x="${x + 3}" y="34" fill="red" font-size="30" font-family="sans-serif">${x}</text>`
}
for (let y = 0; y <= H; y += stepY) {
  g += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="blue" stroke-width="2" opacity="0.5"/>`
  g += `<text x="4" y="${y + 28}" fill="blue" font-size="26" font-family="sans-serif">${y}</text>`
}
const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`
await sharp(base).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toFile('scripts/_calib/bg-grid.png')
console.log('done')
