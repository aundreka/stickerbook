import sharp from 'sharp'
const W = 1080, H = 1920, stepX = 108, stepY = 192
let lines = ''
for (let x = 0; x <= W; x += stepX) {
  lines += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="red" stroke-width="2" opacity="0.5"/>`
  lines += `<text x="${x + 4}" y="36" fill="red" font-size="32" font-family="sans-serif">${x}</text>`
}
for (let y = 0; y <= H; y += stepY) {
  lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="blue" stroke-width="2" opacity="0.5"/>`
  lines += `<text x="6" y="${y + 32}" fill="blue" font-size="32" font-family="sans-serif">${y}</text>`
}
const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${lines}</svg>`
await sharp('src/assets/Sprites/ref.jpg')
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .png()
  .toFile('scripts/_calib/ref-grid.png')
console.log('done')
