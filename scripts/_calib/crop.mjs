import sharp from 'sharp'
// Crop the room area of ref.jpg into 4 overlapping quadrants with a fine grid,
// upscaled, so the small printed sticker numbers are legible for reading positions.
const W = 1080, H = 1920
const quads = [
  { name: 'TL', left: 0, top: 0, w: 580, h: 780 },
  { name: 'TR', left: 500, top: 0, w: 580, h: 780 },
  { name: 'BL', left: 0, top: 740, w: 580, h: 780 },
  { name: 'BR', left: 500, top: 740, w: 580, h: 780 },
]
for (const q of quads) {
  // grid every 54px (x) / 96px (y) labeled in absolute design coords
  let g = ''
  for (let x = Math.ceil(q.left / 54) * 54; x <= q.left + q.w; x += 54) {
    const lx = x - q.left
    g += `<line x1="${lx}" y1="0" x2="${lx}" y2="${q.h}" stroke="red" stroke-width="1" opacity="0.45"/>`
    g += `<text x="${lx + 2}" y="20" fill="red" font-size="20" font-family="sans-serif">${x}</text>`
  }
  for (let y = Math.ceil(q.top / 96) * 96; y <= q.top + q.h; y += 96) {
    const ly = y - q.top
    g += `<line x1="0" y1="${ly}" x2="${q.w}" y2="${ly}" stroke="blue" stroke-width="1" opacity="0.45"/>`
    g += `<text x="2" y="${ly + 18}" fill="blue" font-size="20" font-family="sans-serif">${y}</text>`
  }
  const svg = `<svg width="${q.w}" height="${q.h}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`
  await sharp('src/assets/Sprites/ref.jpg')
    .extract({ left: q.left, top: q.top, width: Math.min(q.w, W - q.left), height: Math.min(q.h, H - q.top) })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .resize({ width: 760 })
    .png()
    .toFile(`scripts/_calib/quad-${q.name}.png`)
}
console.log('done')
