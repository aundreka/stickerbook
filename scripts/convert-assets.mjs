// PNG -> WebP converter for the playable's sprite assets.
//
// Reads src/assets/Sprites/**/*.png and writes WebP into
// src/assets-webp/Sprites/** (mirrored tree). Spaces in path segments are
// replaced with '-' so the output names import cleanly (the source has e.g.
// "End Card/", "Star Burst.png", "sticker_48_Girl Boneka_outline.png").
//
// Flat cartoon art compresses very well as WebP; this is what gets the
// single-file HTML under the 5 MB budget. Run once with `npm run assets`.
import sharp from 'sharp'
import { readdir, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'

const SRC = path.resolve('src/assets/Sprites')
const OUT = path.resolve('src/assets-webp/Sprites')

// Per-folder quality. Numbered = thin line-art (compresses to ~nothing).
// Draggable is the heaviest group, so it gets the most aggressive setting.
const QUALITY = { draggable: 74, numbered: 80, colored: 82, background: 82, default: 82 }

function qualityFor(rel) {
  const p = rel.replace(/\\/g, '/').toLowerCase()
  if (p.startsWith('draggable/')) return QUALITY.draggable
  if (p.startsWith('numbered/')) return QUALITY.numbered
  if (p.startsWith('colored/')) return QUALITY.colored
  if (p.startsWith('background/')) return QUALITY.background
  return QUALITY.default
}

const sanitize = (s) => s.replace(/ /g, '-')

async function walk(dir) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(full)))
    else out.push(full)
  }
  return out
}

const files = await walk(SRC)
let totalIn = 0
let totalOut = 0
let count = 0

for (const file of files) {
  if (path.extname(file).toLowerCase() !== '.png') continue // skip ref .jpg
  const rel = path.relative(SRC, file)
  const outRel = sanitize(rel).replace(/\.png$/i, '.webp')
  const outFile = path.join(OUT, outRel)
  await mkdir(path.dirname(outFile), { recursive: true })
  const q = qualityFor(rel)
  await sharp(file).webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(outFile)
  const inSize = (await stat(file)).size
  const outSize = (await stat(outFile)).size
  totalIn += inSize
  totalOut += outSize
  count++
}

const mb = (b) => (b / 1024 / 1024).toFixed(2)
console.log(`Converted ${count} PNG -> WebP`)
console.log(`  in:  ${mb(totalIn)} MB`)
console.log(`  out: ${mb(totalOut)} MB  (${((1 - totalOut / totalIn) * 100).toFixed(1)}% smaller)`)
