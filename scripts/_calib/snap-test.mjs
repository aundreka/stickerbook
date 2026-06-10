// Drag the pouf toward its slot, stop at an OFFSET inside the snap zone (cursor
// not on the slot), and screenshot while holding — the sticker should be
// magnetized onto the outline (offset from the cursor) if snap works.
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const FILE = pathToFileURL(path.resolve('dist/index.html')).href
const DPR = 2, VW = 440, VH = 956
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files', '--no-sandbox'] })
const pg = await b.newPage()
await pg.setViewport({ width: VW, height: VH, deviceScaleFactor: DPR })
await pg.goto(FILE, { waitUntil: 'load' })
await new Promise((r) => setTimeout(r, 2500))
const s = Math.min((VW * DPR) / 1080, (VH * DPR) / 1920)
const offY = (VH * DPR - 1920 * s) / 2
const toCss = (x, y) => ({ x: ((VW * DPR - 1080 * s) / 2 + x * s) / DPR, y: (offY + y * s) / DPR })
const slot = toCss(150, 937) // pouf slot (new layout)
const home = toCss(180, 1740) // tray item 0
const off = { x: slot.x + 55, y: slot.y } // cursor offset from slot, inside zone
await pg.mouse.click(VW / 2, VH / 2)
await new Promise((r) => setTimeout(r, 200))
await pg.mouse.move(home.x, home.y)
await pg.mouse.down()
await pg.mouse.move(off.x, off.y, { steps: 25 })
for (let i = 0; i < 12; i++) { await pg.mouse.move(off.x + (i % 2), off.y); await new Promise((r) => setTimeout(r, 16)) }
await pg.screenshot({ path: 'scripts/_calib/snap.png' })
await pg.mouse.up()
await b.close()
console.log('cursor at', Math.round(off.x), Math.round(off.y), '| slot at', Math.round(slot.x), Math.round(slot.y))
