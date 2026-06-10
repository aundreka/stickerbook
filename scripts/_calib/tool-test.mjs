import puppeteer from 'puppeteer-core'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const FILE = pathToFileURL(path.resolve('tools/sticker-editor.html')).href
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files', '--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1100, height: 900, deviceScaleFactor: 1 })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(FILE, { waitUntil: 'load' })
await new Promise((r) => setTimeout(r, 2500))
const loaded = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('.stk img')]
  return { total: imgs.length, ok: imgs.filter((i) => i.naturalWidth > 0).length }
})
await page.screenshot({ path: 'scripts/_calib/tool.png' })
console.log('imgs:', JSON.stringify(loaded))
console.log(logs.filter((l) => l.startsWith('[error]') || l.startsWith('[pageerror]')).join('\n') || 'no errors')
await browser.close()
