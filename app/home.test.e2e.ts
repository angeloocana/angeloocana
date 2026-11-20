// The home page in a real browser, against the built site in dist/ (run `npm run test:browser`, which builds
// first). Media is not in git, so /media answers 404 here; the clip playback test makes its own video.
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

// A playable clip for the tests: media is not in git, and the test browser (Playwright's Chromium) plays
// no H.264, so the browser records a half-second WebM of a canvas once, and every /media/ video request
// gets it. Nothing is written to disk.
async function recordClip(page: Page): Promise<Buffer> {
  await page.goto('about:blank')
  let bytes = await page.evaluate(async () => {
    let canvas = document.createElement('canvas')
    canvas.width = 54
    canvas.height = 96
    let g = canvas.getContext('2d')!
    let recorder = new MediaRecorder(canvas.captureStream(10), { mimeType: 'video/webm;codecs=vp8' })
    let parts: Blob[] = []
    recorder.ondataavailable = (event) => parts.push(event.data)
    let n = 0
    let draw = setInterval(() => { g.fillStyle = n++ % 2 ? '#2a6f7a' : '#7a2a6f'; g.fillRect(0, 0, 54, 96) }, 50)
    recorder.start()
    await new Promise((resolve) => setTimeout(resolve, 600))
    recorder.stop()
    await new Promise((resolve) => (recorder.onstop = resolve))
    clearInterval(draw)
    return [...new Uint8Array(await new Blob(parts).arrayBuffer())]
  })
  return Buffer.from(bytes)
}

// a returning visitor: no title card in the way
let open = async (page: Page, path: string) => {
  await page.addInitScript(() => { try { localStorage.setItem('ao-intro', '1') } catch {} })
  await page.goto(path, { waitUntil: 'load' })
  await page.waitForFunction(() => document.documentElement.classList.contains('js-rails'))
}
let scrollTo = (page: Page, id: string) => page.evaluate((id) => document.getElementById(id)!.scrollIntoView({ behavior: 'instant' }), id)
// the card at the start of a row: where its first card sits when the row is not scrolled
let firstCard = (page: Page, row: string) => page.evaluate((row) => {
  let track = document.querySelector<HTMLElement>(`#${row} [data-rail-track]`)!
  let cards = ([...track.children] as HTMLElement[]).filter((el) => el.offsetWidth)
  let start = track.getBoundingClientRect().left + cards[0].offsetLeft - track.offsetLeft
  return cards.find((el) => Math.abs(el.getBoundingClientRect().left - start) < 8)?.id
}, row)
// Travel picked in Outside work, then the other language's flag: it opens with that clip first in the row
async function carryClip(page: Page, flag: string, url: RegExp) {
  await scrollTo(page, 'outside')
  await page.click('#outside [data-rail-cat="travel"]')
  await page.waitForFunction(() => document.querySelector('#outside [data-rail-cat="travel"]')!.getAttribute('aria-pressed') === 'true')
  // the row has slid to the hobby: its first card is a Travel clip, and the row is at rest
  await page.waitForFunction(() => {
    let track = document.querySelector<HTMLElement>('#outside [data-rail-track]')!
    let cards = ([...track.children] as HTMLElement[]).filter((el) => el.offsetWidth)
    let start = track.getBoundingClientRect().left + cards[0].offsetLeft - track.offsetLeft
    let first = cards.find((el) => Math.abs(el.getBoundingClientRect().left - start) < 8)
    return first?.dataset.cat === 'travel' && !track.classList.contains('is-jumping')
  }, null, { timeout: 6000 })
  let clip = (await firstCard(page, 'outside'))!
  await page.waitForFunction(({ flag, clip }) => document.querySelector<HTMLAnchorElement>(flag)!.hash === `#${clip}`, { flag, clip })
  await page.click(flag)
  await page.waitForURL(url)
  assert.equal(new URL(page.url()).hash, `#${clip}`)
  await page.waitForTimeout(1500) // the rest of the clips load, then the row moves to it
  assert.equal(await firstCard(page, 'outside'), clip)
}

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
    assert.equal(await firstCard(page, 'career'), 'job-kinaxis')
  })

  it('keeps the clip in view when the language changes, both ways', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, '/')
    await carryClip(page, '.lang-pt', /\/pt\/#clip-/)
    await carryClip(page, '.lang-en', /\/#clip-/)
  })

  it('works at phone width: the menu, More, Career sideways, and the switch keeps a job and a clip', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 390, height: 844 })
    await open(page, '/')
    // the menu: two sections and More; More opens the rest, a pick goes there and closes it
    let toggle = page.locator('.menu-toggle')
    assert.equal(await toggle.isVisible(), true)
    assert.equal(await page.locator('#menu-more a[data-chapter-link="learning"]').isVisible(), false)
    await toggle.click()
    assert.equal(await page.locator('.menu-drop').evaluate((d) => (d as HTMLDetailsElement).open), true)
    await page.locator('#menu-more a[data-chapter-link="learning"]').click()
    assert.equal(await page.locator('.menu-drop').evaluate((d) => (d as HTMLDetailsElement).open), false)
    await page.waitForFunction(() => Math.abs(document.getElementById('learning')!.getBoundingClientRect().top) < 120, null, { timeout: 4000 })
    // Escape closes it and gives the focus back to the button
    await toggle.click()
    await page.keyboard.press('Escape')
    assert.equal(await page.evaluate(() => document.activeElement?.matches('.menu-toggle')), true)

    // Career scrolls sideways, a card at a time; the hero's Shopify tile lands on the job itself
    await scrollTo(page, 'career')
    let track = page.locator('#career [data-rail-track]')
    assert.ok(await track.evaluate((el) => el.scrollWidth > el.clientWidth * 3), 'the career is a sideways row')
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.click('.tile-career .tile-link')
    await page.waitForFunction(() => location.hash === '#job-shopify')
    await page.waitForTimeout(300)
    assert.equal(await firstCard(page, 'career'), 'job-shopify')

    // the switch keeps a job, then a clip, at phone width too
    await scrollTo(page, 'career')
    // swiped to Kinaxis: the row's scroll puts it where the first card starts
    await track.evaluate((el) => { el.scrollLeft = document.getElementById('job-kinaxis')!.offsetLeft - (el.firstElementChild as HTMLElement).offsetLeft })
    await page.waitForFunction(() => document.querySelector<HTMLAnchorElement>('.lang-pt')!.hash === '#job-kinaxis')
    await page.click('.lang-pt')
    await page.waitForURL(/\/pt\/#job-kinaxis$/)
    await page.waitForTimeout(300)
    assert.equal(await firstCard(page, 'career'), 'job-kinaxis')
    await carryClip(page, '.lang-en', /\/#clip-/)
  })

  it('plays a clip near the screen, takes its player away once it is far, and gives it back', async (t) => {
    let page = await t.serve(await serveDist())
    let clip = await recordClip(page)
    await page.route('**/media/**', (route) => {
      let url = route.request().url()
      if (/\.mp4(\?|$)/.test(url)) return route.fulfill({ body: clip, contentType: 'video/webm' })
      return route.fulfill({ status: 404, body: '' })
    })
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, '/')
    await scrollTo(page, 'outside')
    // the first clips get players and play (muted, looping)
    let firstClip = page.locator('#outside [data-clip]').first()
    let id = await firstClip.getAttribute('data-clip')
    let player = page.locator(`#outside [data-clip="${id}"] video.clip-video`)
    await player.waitFor({ state: 'attached', timeout: 5000 })
    await page.waitForFunction((id) => {
      let v = document.querySelector<HTMLVideoElement>(`#outside [data-clip="${id}"] video.clip-video`)
      return !!v && !v.paused && v.currentTime > 0
    }, id, { timeout: 8000 })
    // far along the row: its player goes, and only a handful exist at once
    let track = page.locator('#outside [data-rail-track]')
    await track.evaluate((el) => { el.scrollLeft = el.scrollWidth })
    await page.waitForFunction((id) => !document.querySelector(`#outside [data-clip="${id}"] video`), id, { timeout: 5000 })
    let players = await page.locator('#outside video.clip-video').count()
    assert.ok(players > 0 && players <= 12, `${players} players at once`)
    // back again: a new player, playing
    await track.evaluate((el) => { el.scrollLeft = 0 })
    await page.waitForFunction((id) => {
      let v = document.querySelector<HTMLVideoElement>(`#outside [data-clip="${id}"] video.clip-video`)
      return !!v && !v.paused && v.currentTime > 0
    }, id, { timeout: 8000 })
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

  // a post runs no Remix client, only its pointer ring: the home page's post links load it in full, so the
  // ring starts there (with a client navigation the home page's runtime stayed and the ring never came)
  it('opens a post from the home page as its own page, where the pointer ring follows, and comes back', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, '/')
    await scrollTo(page, 'posts')
    let link = page.locator('#posts .post-card a').first()
    let href = (await link.getAttribute('href'))!
    await page.evaluate(() => { (window as Window & { homeRuntime?: boolean }).homeRuntime = true })
    let documents: string[] = []
    page.on('request', (request) => { if (request.resourceType() === 'document') documents.push(new URL(request.url()).pathname) })
    await link.click()
    await page.waitForURL(`**${href}`)
    await page.waitForSelector('main.post-main')
    // a full page load: a new window (the home page's runtime is gone) with the post's own document
    assert.deepEqual(documents, [href])
    assert.equal(await page.evaluate(() => (window as Window & { homeRuntime?: boolean }).homeRuntime), undefined)
    assert.equal(await page.evaluate(() => !!document.getElementById('rmx-data')), false)
    await page.mouse.move(300, 300)
    await page.mouse.move(420, 360, { steps: 4 })
    await page.waitForFunction(() => document.querySelector<HTMLElement>('.cur')?.dataset.on === 'true')
    await page.goBack()
    await page.waitForURL((url) => url.pathname === '/')
    await page.waitForFunction(() => document.documentElement.classList.contains('js-rails'))
  })

  // Without JS: More (a native <details>) opens the sections under it on a phone, and every clip's Instagram
  // link is an ordinary Tab stop (the one-stop roving tabindex comes with the script)
  it('works without JS: More opens on a phone, and the clip links are in the Tab order', async (t) => {
    let page = await t.serve(await serveDist())
    let cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setScriptExecutionDisabled', { value: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'load' })
    await page.waitForTimeout(1200) // the title card's own CSS fade
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('js-rails')), false)
    let learning = page.locator('#menu-more a[data-chapter-link="learning"]')
    assert.equal(await learning.isVisible(), false)
    await page.click('.menu-toggle')
    assert.equal(await learning.isVisible(), true)
    await learning.click()
    await page.waitForURL('**/#learning')
    let clips = await page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>('#outside .clip-ig')].map((a) => a.tabIndex))
    assert.ok(clips.length >= 10, `${clips.length} clip links`)
    assert.deepEqual(clips.filter((i) => i !== 0), [], 'every clip link is a Tab stop')
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
