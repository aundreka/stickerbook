// Headless smoke test: load the built single-file playable, capture console +
// page errors, screenshot the initial frame, then drag round-1's three stickers
// to their slots and screenshot. Verifies render, no errors, and placement.
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const FILE = pathToFileURL(path.resolve('dist/index.html')).href
const DPR = 2
const VW = Number(process.argv[2] || 440)
const VH = Number(process.argv[3] || 956)
const TAG = process.argv[4] || 'portrait'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DPR })

const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))

await page.goto(FILE, { waitUntil: 'load' })
await new Promise((r) => setTimeout(r, 2500))
await page.screenshot({ path: `scripts/_calib/smoke-${TAG}-initial.png` })

// FIT (contain) transform -> CSS coords
const s = Math.min((VW * DPR) / 1080, (VH * DPR) / 1920)
const offX = (VW * DPR - 1080 * s) / 2
const offY = (VH * DPR - 1920 * s) / 2
const toCss = (x, y) => ({ x: (offX + x * s) / DPR, y: (offY + y * s) / DPR })

const trayY = 1920 - 360 / 2
const round1 = [
  { home: toCss(180, trayY), slot: toCss(150, 900) }, // 10 pouf
  { home: toCss(540, trayY), slot: toCss(540, 1120) }, // 14 rug
  { home: toCss(900, trayY), slot: toCss(430, 980) }, // 7 table
]

await page.mouse.click(VW / 2, VH * 0.5)
await new Promise((r) => setTimeout(r, 200))

for (const { home, slot } of round1) {
  await page.mouse.move(home.x, home.y)
  await page.mouse.down()
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(home.x + ((slot.x - home.x) * i) / 8, home.y + ((slot.y - home.y) * i) / 8)
    await new Promise((r) => setTimeout(r, 14))
  }
  await page.mouse.up()
  await new Promise((r) => setTimeout(r, 500))
}
await new Promise((r) => setTimeout(r, 600))
await page.screenshot({ path: `scripts/_calib/smoke-${TAG}-after.png` })

const errs = logs.filter((l) => l.startsWith('[error]') || l.startsWith('[pageerror]'))
console.log(logs.join('\n'))
console.log('\nERRORS:', errs.length)
await browser.close()
