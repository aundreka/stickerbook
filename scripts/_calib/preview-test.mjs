// Drag round-1 item 0 toward its slot, stop just inside the snap zone (cursor
// offset), and screenshot the hover preview — should show the COLORED art at the
// exact outline size (perfect fit), then complete the drop.
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const DPR = 2, VW = 440, VH = 956
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'] })
const pg = await b.newPage()
await pg.setViewport({ width: VW, height: VH, deviceScaleFactor: DPR })
await pg.goto(pathToFileURL(path.resolve('dist/index.html')).href + '#dbg', { waitUntil: 'load' })
await new Promise((r) => setTimeout(r, 2500))
const round = await pg.evaluate(() => window.__round)
const slot0 = { x: round[0].x / 2, y: round[0].y / 2 } // canvas px -> CSS (DPR 2)
const s = Math.min((VW * DPR) / 1080, (VH * DPR) / 1920)
const offY = (VH * DPR - 1920 * s) / 2
const home0 = { x: ((VW * DPR - 1080 * s) / 2 + 180 * s) / DPR, y: (offY + (1920 - 180) * s) / DPR }
console.log('item0 id', round[0].id, '| slot CSS', Math.round(slot0.x), Math.round(slot0.y))
await pg.mouse.click(VW / 2, VH / 2)
await new Promise((r) => setTimeout(r, 200))
await pg.mouse.move(home0.x, home0.y)
await pg.mouse.down()
// approach: end at an offset inside the zone (cursor not on slot center)
const off = { x: slot0.x + 45, y: slot0.y - 30 }
await pg.mouse.move(off.x, off.y, { steps: 25 })
for (let i = 0; i < 10; i++) { await pg.mouse.move(off.x + (i % 2), off.y); await new Promise((r) => setTimeout(r, 16)) }
await pg.screenshot({ path: 'scripts/_calib/preview-hover.png' })
await pg.mouse.up()
await new Promise((r) => setTimeout(r, 700))
await pg.screenshot({ path: 'scripts/_calib/preview-placed.png' })
await b.close()
