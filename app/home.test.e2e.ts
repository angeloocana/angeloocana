// The home page in a real browser, against the built site in dist/ (run `npm run test:browser`, which builds
// first). Media is not in git, so /media answers 404 here: nothing below depends on it.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import type { Page } from 'playwright'

const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }

// dist/ served the way Cloudflare serves it: a folder answers with its index.html
async function serveDist() {
  let server = createServer(async (req, res) => {
    let file = join(DIST, decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname))
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
      let body = await readFile(file)
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end()
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  let { port } = server.address() as { port: number }
  return { baseUrl: `http://127.0.0.1:${port}`, close: () => new Promise<void>((resolve) => server.close(() => resolve())) }
}

// a returning visitor: no title card in the way
let open = async (page: Page, path: string) => {
  await page.addInitScript(() => { try { localStorage.setItem('ao-intro', '1') } catch {} })
  await page.goto(path, { waitUntil: 'load' })
  await page.waitForFunction(() => document.documentElement.classList.contains('js-rails'))
}
let scrollTo = (page: Page, id: string) => page.evaluate((id) => document.getElementById(id)!.scrollIntoView({ behavior: 'instant' }), id)

describe('home page in a browser', () => {
  it('keeps the section, and the job, when the language changes', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, '/')
    await scrollTo(page, 'learning')
    await page.waitForFunction(() => document.querySelector<HTMLAnchorElement>('.lang-pt')!.hash === '#learning')
    await page.click('.lang-pt')
    await page.waitForURL('**/pt/#learning')
    // the page scrolls there smoothly (base.css): it lands within a couple of seconds
    await page.waitForFunction(() => Math.abs(document.getElementById('learning')!.getBoundingClientRect().top) < 120, null, { timeout: 4000 })

    // a job picked in the career: the other language opens with that job as the row's first card
    await scrollTo(page, 'career')
    await page.click('#career a[href="#job-kinaxis"]')
    await page.waitForFunction(() => document.querySelector<HTMLAnchorElement>('.lang-en')!.hash === '#job-kinaxis')
    await page.click('.lang-en')
    await page.waitForURL(/\/#job-kinaxis$/)
    await page.waitForTimeout(300)
    let first = await page.evaluate(() => {
      let track = document.querySelector('#career [data-rail-track]')!.getBoundingClientRect()
      return [...document.querySelectorAll('#career [data-rail-track] > *')].find((el) => {
        let r = el.getBoundingClientRect()
        return r.left >= track.left - 2 && r.right <= track.right + 2
      })?.id
    })
    assert.equal(first, 'job-kinaxis')
  })

  it('moves along a rail with the keyboard, one Tab stop for the clips', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, '/')
    await scrollTo(page, 'outside')
    let links = () => page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>('#outside .clip-ig')].map((a) => a.tabIndex))
    await page.waitForFunction(() => document.querySelectorAll('#outside .clip-ig[tabindex="0"]').length === 1)
    await page.focus('#outside .clip-ig[tabindex="0"]')
    let before = await page.evaluate(() => [...document.querySelectorAll('#outside .clip-ig')].indexOf(document.activeElement!))
    await page.keyboard.press('ArrowRight')
    let after = await page.evaluate(() => [...document.querySelectorAll('#outside .clip-ig')].indexOf(document.activeElement!))
    assert.equal(after, before + 1)
    assert.equal((await links()).filter((i) => i === 0).length, 1, 'one clip link in the Tab order')

    // the arrow buttons: the way back comes on once the row has moved, and takes the focus when the way on runs out
    await scrollTo(page, 'track2fit')
    let prev = page.locator('#track2fit [data-rail-prev]')
    assert.equal(await prev.isDisabled(), true)
    await page.locator('#track2fit [data-rail-next]').focus()
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>('#track2fit [data-rail-prev]')!.disabled)
    for (let i = 0; i < 12 && !(await page.locator('#track2fit [data-rail-next]').isDisabled()); i++) {
      await page.keyboard.press('Enter')
      await page.waitForTimeout(450)
    }
    assert.equal(await page.evaluate(() => document.activeElement?.matches('#track2fit [data-rail-prev]')), true, 'focus moves to the way back at the end')
  })

  it('loads every clip after a failed fetch, on the next try', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 1440, height: 900 })
    let fails = 1
    await page.route('**/data/clips.json', (route) => (fails-- > 0 ? route.fulfill({ status: 503, body: '' }) : route.continue()))
    let total = 0
    await open(page, '/')
    await scrollTo(page, 'outside')
    await page.waitForTimeout(800)
    total = await page.evaluate(() => Number(document.querySelector<HTMLElement>('#outside [data-rail-track]')!.dataset.total))
    assert.ok(await page.evaluate(() => document.querySelectorAll('#outside [data-clip]').length) < total, 'the failed load added nothing')
    await page.click('#outside [data-rail-cat]')
    await page.waitForFunction((n) => document.querySelectorAll('#outside [data-clip]').length === n, total)
  })

  it('works with storage blocked: controls and the career index show', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 1440, height: 900 })
    let errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(() => {
      for (let key of ['sessionStorage', 'localStorage']) Object.defineProperty(window, key, { get() { throw new DOMException('blocked', 'SecurityError') } })
    })
    await page.goto('/', { waitUntil: 'load' })
    await page.waitForFunction(() => document.documentElement.classList.contains('js-rails'))
    await scrollTo(page, 'career')
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.career-index li')!).opacity === '1')
    assert.equal(await page.locator('#career .rail-bar').evaluate((el) => getComputedStyle(el).visibility), 'visible')
    await page.click('.menu-pause')
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('is-paused')), true, 'the pause still works')
    assert.deepEqual(errors, [])
  })

  it('holds still for reduced motion: no ice, nothing looping, no video', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    let requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await open(page, '/')
    await page.waitForTimeout(3000) // past load and idle, when the ice would come
    assert.deepEqual(requests.filter((url) => url.includes('ice-gl')), [], 'the ice code is never fetched')
    let still = await page.evaluate(() => ({
      paused: document.documentElement.classList.contains('is-paused'),
      ice: document.documentElement.dataset.ice,
      looping: document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity).length,
      playing: [...document.querySelectorAll('video')].filter((v) => !v.paused).length,
      pauses: [...document.querySelectorAll<HTMLButtonElement>('[data-pause]')].filter((b) => !b.hidden).length,
    }))
    assert.deepEqual(still, { paused: true, ice: 'off', looping: 0, playing: 0, pauses: 0 })
  })
})
