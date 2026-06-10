// Verify the idle hand hint: place one sticker (cancels the tutorial), then sit
// idle for >5s and confirm the hand reappears guiding the next tray item.
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const FILE = pathToFileURL(path.resolve('dist/index.html')).href
const DPR = 2, VW = 440, VH = 956
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files', '--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DPR })
await page.goto(FILE, { waitUntil: 'load' })
await new Promise((r) => setTimeout(r, 2500))

const s = Math.min((VW * DPR) / 1080, (VH * DPR) / 1920)
const offX = (VW * DPR - 1080 * s) / 2, offY = (VH * DPR - 1920 * s) / 2
const toCss = (x, y) => ({ x: (offX + x * s) / DPR, y: (offY + y * s) / DPR })
const home = toCss(180, 1920 - 180), slot = toCss(150, 900)
// place pouf (cancels tutorial)
await page.mouse.move(home.x, home.y); await page.mouse.down()
for (let i = 1; i <= 8; i++) { await page.mouse.move(home.x + (slot.x - home.x) * i / 8, home.y + (slot.y - home.y) * i / 8); await new Promise(r => setTimeout(r, 14)) }
await page.mouse.up()
await new Promise((r) => setTimeout(r, 6500)) // sit idle > 5s
await page.screenshot({ path: 'scripts/_calib/idle-hint.png' })
console.log('done')
await browser.close()
