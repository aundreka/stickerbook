// Boot-check an arbitrary built variant file (used for un/al where transforms or
// external mraid.js/exitapi could break boot). Reports console errors + whether
// the canvas rendered + analytics DISPLAYED fired.
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const FILE = pathToFileURL(path.resolve(process.argv[2])).href

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 2 })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))

await page.goto(FILE, { waitUntil: 'load' })
await new Promise((r) => setTimeout(r, 3500))
const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'))
const displayed = logs.some((l) => l.includes('DISPLAYED'))
const errs = logs.filter((l) => l.startsWith('[error]') || l.startsWith('[pageerror]'))
console.log(path.basename(process.argv[2]))
console.log('  canvas:', hasCanvas, '| DISPLAYED:', displayed, '| errors:', errs.length)
if (errs.length) console.log(errs.join('\n'))
await browser.close()
