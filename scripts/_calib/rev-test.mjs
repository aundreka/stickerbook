import puppeteer from 'puppeteer-core'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const url = (f) => pathToFileURL(path.resolve(f)).href
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'] })

async function shot(file, waitMs, out) {
  const pg = await browser.newPage()
  await pg.setViewport({ width: 440, height: 956, deviceScaleFactor: 2 })
  const errs = []
  pg.on('pageerror', (e) => errs.push(e.message))
  await pg.goto(file, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, waitMs))
  await pg.screenshot({ path: out })
  await pg.close()
  return errs.length
}

// 60sec countdown (should show ~0:56 after ~4s)
const e1 = await shot(url('dist/60sec.html'), 4000, 'scripts/_calib/rev-60sec.png')
// 10clk end scene (auto fills, gate at 10, full room behind end card)
const e2 = await shot(url('dist/10clk.html') + '#auto', 9000, 'scripts/_calib/rev-10clk-end.png')
// randomization: two fresh loads of the same version, compare round-1 tray
const e3 = await shot(url('dist/full.html'), 1800, 'scripts/_calib/rev-rand1.png')
const e4 = await shot(url('dist/full.html'), 1800, 'scripts/_calib/rev-rand2.png')
console.log('errors:', e1, e2, e3, e4)
await browser.close()
