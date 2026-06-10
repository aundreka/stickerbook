// Template-match each Numbered/N silhouette against ref.jpg, constrained to a
// window around a rough guess (prevents drift to similar shapes elsewhere) and
// excluding the bottom tray zone. Coarse downsample + full-res refine.
import sharp from 'sharp'
import fs from 'node:fs'

const W = 1080, H = 1920, TRAY_Y = 1520
const DS = 5
const DW = Math.floor(W / DS), DH = Math.floor(H / DS)
const WIN = 140 // search radius (full px) around guess

// rough guesses (design px) read from the gridded reference quadrants
const G = {
  1: [430, 940], 2: [690, 1215], 3: [270, 1320], 4: [120, 820], 5: [440, 280], 6: [870, 100],
  7: [500, 990], 8: [560, 1170], 9: [970, 1330], 10: [120, 900], 11: [360, 470], 12: [785, 90],
  13: [880, 700], 14: [560, 1080], 15: [40, 1120], 16: [400, 660], 17: [440, 85], 18: [710, 490],
  19: [610, 900], 20: [660, 1410], 21: [210, 1110], 22: [90, 670], 23: [745, 300], 24: [590, 880],
  25: [880, 1160], 26: [170, 480], 27: [930, 510], 28: [610, 1020], 29: [290, 670], 30: [600, 270],
  31: [820, 980], 32: [410, 1120], 33: [60, 590], 34: [935, 95], 35: [685, 720], 36: [480, 1380],
  37: [345, 815], 38: [520, 760], 39: [855, 1410], 40: [120, 1280], 41: [515, 765], 42: [625, 90],
  43: [800, 700], 44: [262, 965], 45: [895, 315], 46: [745, 845], 47: [540, 515], 48: [900, 800],
  49: [535, 1050], 50: [440, 380],
}

const refGray = await sharp('src/assets/Sprites/ref.jpg').resize(W, H, { fit: 'fill' }).grayscale().raw().toBuffer()
const refDark = new Uint8Array(W * H)
for (let i = 0; i < W * H; i++) refDark[i] = refGray[i] < 110 ? 1 : 0

const dir = 'src/assets/Sprites/Numbered'
const out = {}
for (let id = 1; id <= 50; id++) {
  const file = `${dir}/${id}.png`
  if (!fs.existsSync(file)) continue
  const meta = await sharp(file).metadata()
  const tw = meta.width, th = meta.height
  const { data } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const tDark = []
  for (let i = 0; i < tw * th; i++) {
    const a = data[i * 4 + 3], lum = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3
    if (a > 128 && lum < 110) tDark.push([i % tw, (i / tw) | 0])
  }
  if (!tDark.length) continue
  const g = G[id] || [W / 2, H / 2]
  const gx = g[0] - tw / 2, gy = g[1] - th / 2 // guess top-left
  // coarse search (step DS) within window, excluding tray
  let best = -1, bx = gx, by = gy
  const x0 = Math.max(0, Math.round(gx - WIN)), x1 = Math.min(W - tw, Math.round(gx + WIN))
  const y0 = Math.max(0, Math.round(gy - WIN)), y1 = Math.min(H - th, Math.round(gy + WIN))
  for (let oy = y0; oy <= y1; oy += DS) {
    if (oy + th / 2 > TRAY_Y) continue
    for (let ox = x0; ox <= x1; ox += DS) {
      let sc = 0
      for (let k = 0; k < tDark.length; k += 3) sc += refDark[(oy + tDark[k][1]) * W + (ox + tDark[k][0])]
      if (sc > best) { best = sc; bx = ox; by = oy }
    }
  }
  // full-res refine +/- DS
  let fbest = -1, fx = bx, fy = by
  for (let oy = Math.max(0, by - DS); oy <= Math.min(H - th, by + DS); oy++) {
    for (let ox = Math.max(0, bx - DS); ox <= Math.min(W - tw, bx + DS); ox++) {
      let sc = 0
      for (let k = 0; k < tDark.length; k++) sc += refDark[(oy + tDark[k][1]) * W + (ox + tDark[k][0])]
      if (sc > fbest) { fbest = sc; fx = ox; fy = oy }
    }
  }
  out[id] = [Math.round(fx + tw / 2), Math.round(fy + th / 2)]
}
fs.writeFileSync('scripts/_calib/ref-positions.json', JSON.stringify(out))
console.log('wrote', Object.keys(out).length, 'positions')
