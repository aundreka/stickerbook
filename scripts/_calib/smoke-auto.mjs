// Auto-play QA: load with #auto so the game fills the whole room, then end card.
// Screenshots a mid-fill frame, the completed room, and the end card.
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const FILE = pathToFileURL(path.resolve('dist/index.html')).href + '#auto'
const VW = Number(process.argv[2] || 440)
const VH = Number(process.argv[3] || 956)
const TAG = process.argv[4] || 'portrait'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 2 })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))

await page.goto(FILE, { waitUntil: 'load' })
await new Promise((r) => setTimeout(r, 7000))
await page.screenshot({ path: `scripts/_calib/auto-${TAG}-mid.png` })
await new Promise((r) => setTimeout(r, 18000)) // finish all 50 + crossfade + endcard
await page.screenshot({ path: `scripts/_calib/auto-${TAG}-end.png` })
// tap anywhere on the end card -> should fire the CTA
await page.mouse.click(VW / 2, VH / 2)
await new Promise((r) => setTimeout(r, 400))
const hasEndcard = logs.some((l) => l.includes('ENDCARD_SHOWN'))
const hasCta = logs.some((l) => l.includes('CTA_CLICKED'))
console.log('endcard shown:', hasEndcard, '| cta fired:', hasCta)

const errs = logs.filter((l) => l.startsWith('[error]') || l.startsWith('[pageerror]'))
console.log(logs.join('\n'))
console.log('\nERRORS:', errs.length)
await browser.close()
