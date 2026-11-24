// The home page in a real browser, against the built site in dist/ (run `npm run test:browser`, which builds
// first). Media is not in git, so /media answers 404 here; the clip playback test makes its own video.
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import type { Page } from 'playwright'

import { serveDist } from './test-support/serve-dist.ts'

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
  let response = await page.goto(path, { waitUntil: 'load' })
  await page.waitForFunction(() => document.documentElement.classList.contains('js-rails'))
  return response
}
let scrollTo = (page: Page, id: string) => page.evaluate((id) => document.getElementById(id)!.scrollIntoView({ behavior: 'instant' }), id)
// the card at the start of a row: where its first card sits when the row is not scrolled
let firstCard = (page: Page, row: string) => page.evaluate((row) => {
  let track = document.querySelector<HTMLElement>(`#${row} [data-rail-track]`)!
  let cards = ([...track.children] as HTMLElement[]).filter((el) => el.offsetWidth)
  let start = track.getBoundingClientRect().left + cards[0].offsetLeft - track.offsetLeft
  return cards.find((el) => Math.abs(el.getBoundingClientRect().left - start) < 8)?.id
}, row)
let waitForClip = (page: Page, flag: string, clip: string) => page.waitForFunction(({ flag, clip }) => {
  let track = document.querySelector<HTMLElement>('#outside [data-rail-track]')!
  let target = document.getElementById(clip)
  let link = document.querySelector<HTMLAnchorElement>(flag)
  if (!target || track.classList.contains('is-jumping') || link?.hash !== `#${clip}`) return false
  let row = track.getBoundingClientRect()
  let box = target.getBoundingClientRect()
  return Math.min(row.right, box.right) - Math.max(row.left, box.left) >= box.width / 2
}, { flag, clip }, { timeout: 6000 })

// A hobby chip, the way a visitor reaches it: on a phone the chips scroll sideways in their own strip, and one
// out of sight there is brought into view along it, then pressed where it shows. Left to Playwright, the
// click scrolled the page as well, and on a busy machine that took the page off the row. It waits for the
// page's scripts (a language switch has just loaded a new page) and for the career row above to finish
// easing to its height (--lift, rails/rows.ts: once the page is at rest, it moves what follows), and keeps
// the chip on screen meanwhile.
async function pressChip(page: Page, selector: string) {
  await page.waitForFunction(() => document.documentElement.classList.contains('js-rails'))
  let at = await page.locator(selector).first().evaluate((el) => new Promise<{ x: number; y: number }>((done) => {
    let strip = el.closest<HTMLElement>('.clip-chips')!
    let career = document.querySelector<HTMLElement>('#career')!
    let careerRail = career.querySelector<HTMLElement>('[data-rail-track]')!
    let last = ''
    let still = 0
    let tick = () => {
      let box = el.getBoundingClientRect()
      if (box.top < 60 || box.bottom > innerHeight) el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })
      strip.scrollLeft += el.getBoundingClientRect().left - strip.getBoundingClientRect().left - 16
      box = el.getBoundingClientRect()
      let lift = parseFloat(career.style.getPropertyValue('--lift')) || 0
      let eased = Math.abs(parseFloat(getComputedStyle(careerRail).marginBottom) + lift) < 1
      let now = `${box.x},${box.y}`
      still = eased && now === last ? still + 1 : 0
      last = now
      if (still >= 5) done({ x: box.x + box.width / 2, y: box.y + box.height / 2 })
      else requestAnimationFrame(tick)
    }
    tick()
  }))
  await page.mouse.click(at.x, at.y)
}

async function pickTravel(page: Page, flag: string) {
  await scrollTo(page, 'outside')
  await pressChip(page, '#outside [data-rail-cat="travel"]')
  await page.waitForSelector('#outside [data-rail-cat="travel"][aria-pressed="true"]')
  // The chip jumps to the first Travel clip in the shuffled rail, even if another clip shares its view.
  let clip = (await page.locator('#outside [data-rail-track] [data-cat="travel"]').first().getAttribute('id'))!
  await waitForClip(page, flag, clip)
  assert.equal(new URL(page.url()).hash, `#${clip}`)
  return clip
}

async function carryClip(page: Page, clip: string, flag: string, url: RegExp) {
  await page.click(flag)
  await page.waitForURL(url)
  assert.equal(new URL(page.url()).hash, `#${clip}`)
  await waitForClip(page, `.lang-card:not(${flag})`, clip)
}

// The page's other language opened at a #clip-… gets that clip dealt last, after every Travel clip: the clip
// is not in the page, the row has to load it and the browser has to clamp its scroll to reach it.
async function dealLinkedLast(page: Page) {
  await page.route('**/data/clips.json', async (route) => {
    let hash = new URL(route.request().frame().url()).hash
    if (!hash.startsWith('#clip-')) return route.continue()
    let response = await route.fetch()
    let json = await response.json() as { clips: { id: string; cat: string; score: number }[] }
    let linked = json.clips.find((clip) => `#clip-${clip.id}` === hash)!
    let tail = [...json.clips.filter((clip) => clip.cat === 'travel' && clip !== linked), linked]
    tail.forEach((clip, i) => { clip.score = -25 * (i + 1) })
    await route.fulfill({ response, json })
  })
}
let allClips = (page: Page) => page.waitForFunction(() => {
  let track = document.querySelector<HTMLElement>('#outside [data-rail-track]')!
  return track.querySelectorAll('[data-clip]').length === Number(track.dataset.total)
})
// where a row comes to rest: its scroll unchanged over five frames (snapping included)
let resting = (page: Page, row: string) => page.evaluate((row) => new Promise<number>((done) => {
  let track = document.querySelector<HTMLElement>(`#${row} [data-rail-track]`)!
  let last = -1
  let still = 0
  let tick = () => {
    still = track.scrollLeft === last ? still + 1 : 0
    last = track.scrollLeft
    if (still >= 5) done(last)
    else requestAnimationFrame(tick)
  }
  tick()
}), row)
let frames = (page: Page) => page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))

describe('home page in a browser', () => {
  it('boots the static home and its offline fallback under the shipped CSP', async (t) => {
    let page = await t.serve(await serveDist())
    let violations: string[] = []
    await page.exposeFunction('captureViolation', (directive: string, uri: string) => violations.push(`${directive}: ${uri}`))
    await page.addInitScript(() => {
      let capture = (window as Window & { captureViolation?: (directive: string, uri: string) => void }).captureViolation
      document.addEventListener('securitypolicyviolation', (event) => capture?.(event.effectiveDirective, event.blockedURI))
    })
    for (let path of ['/', '/pt/', '/offline-plugin-app-shell-fallback/']) {
      let response = await open(page, path)
      assert.ok(response?.headers()['content-security-policy'], path)
      assert.ok(await page.evaluate(() => document.documentElement.classList.contains('cin-seen')), 'the hashed intro ran')
    }
    assert.deepEqual(violations, [])
  })

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
    // Deal the incoming clip last so the browser clamps its scroll. Put the next Travel pick close
    // enough that the old hash clip stays visible after the visitor asks to carry a different one.
    await page.route('**/data/clips.json', async (route) => {
      let hash = new URL(route.request().frame().url()).hash
      if (!hash.startsWith('#clip-')) return route.continue()
      let response = await route.fetch()
      let json = await response.json() as { clips: { id: string; cat: string; score: number }[] }
      let linked = json.clips.find((clip) => `#clip-${clip.id}` === hash)!
      let nature = json.clips.find((clip) => clip.id === 'cbb1ca253')!
      let tail = [...json.clips.filter((clip) => clip.cat === 'travel' && clip !== linked), nature, linked]
      tail.forEach((clip, i) => { clip.score = -25 * (i + 1) })
      await route.fulfill({ response, json })
    })
    let track = page.locator('#outside [data-rail-track]')
    let atEnd = () => track.evaluate((el) => el.scrollWidth - el.clientWidth - el.scrollLeft < 2)
    await open(page, '/')
    let first = await pickTravel(page, '.lang-pt')
    await carryClip(page, first, '.lang-pt', /\/pt\/#clip-/)
    assert.ok(await atEnd(), 'the Portuguese rail reached its scroll limit')
    let second = await pickTravel(page, '.lang-en')
    assert.notEqual(second, first)
    assert.equal(await track.evaluate((el, id) => {
      let row = el.getBoundingClientRect()
      let box = document.getElementById(id)!.getBoundingClientRect()
      return Math.min(row.right, box.right) - Math.max(row.left, box.left) >= box.width / 2
    }, first), true, 'the previous clip is still in view')
    await carryClip(page, second, '.lang-en', /\/#clip-/)
    assert.ok(await atEnd(), 'the English rail reached its scroll limit')
    await carryClip(page, second, '.lang-pt', /\/pt\/#clip-/)

    // A horizontal wheel gesture moves away from the hash clip; the flag follows the first clip there.
    await track.hover()
    let delta = await track.evaluate((el) => document.getElementById('clip-h-ice')!.offsetLeft - (el.firstElementChild as HTMLElement).offsetLeft - el.scrollLeft)
    await page.mouse.wheel(delta, 0)
    await waitForClip(page, '.lang-en', 'clip-h-ice')
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
    let clip = await pickTravel(page, '.lang-en')
    await carryClip(page, clip, '.lang-en', /\/#clip-/)
  })

  // The linked card (rails/rows.ts): what the visitor does wins over a #clip-… still on its way, the flag
  // carries where a chip is taking the row, Back keeps the page where it was left, and on a phone the page
  // lands on the clip itself.
  it('leaves the row where a sideways wheel took it while a #clip-… waits for the clips', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 1440, height: 900 })
    let release!: () => void
    let held = new Promise<void>((resolve) => (release = resolve))
    await page.route('**/data/clips.json', async (route) => { await held; await route.continue() })
    await open(page, '/#clip-h-ice')
    let track = page.locator('#outside [data-rail-track]')
    await track.hover()
    await page.mouse.wheel(687, 0)
    await page.waitForFunction(() => document.querySelector<HTMLElement>('#outside [data-rail-track]')!.scrollLeft > 400)
    let left = await resting(page, 'outside')
    release()
    await allClips(page)
    let after = await resting(page, 'outside')
    assert.ok(Math.abs(after - left) < 2, `the row went from ${left} to ${after}px`)
  })

  it('carries the clip a chip is sliding to, when the flag is pressed on the way', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 1440, height: 900 })
    // every Travel clip dealt last, so the trip there is long
    await page.route('**/data/clips.json', async (route) => {
      let response = await route.fetch()
      let json = await response.json() as { clips: { cat: string; score: number }[] }
      json.clips.filter((clip) => clip.cat === 'travel').forEach((clip, i) => { clip.score = -25 * (i + 1) })
      await route.fulfill({ response, json })
    })
    await open(page, '/pt/')
    await scrollTo(page, 'outside')
    await allClips(page)
    await pressChip(page, '#outside [data-rail-cat="travel"]')
    let clip = (await page.locator('#outside [data-rail-track] [data-cat="travel"]').first().getAttribute('id'))!
    // still on the way: the row is sliding, and the Travel clip isn't in view yet
    let onTheWay = await page.evaluate((id) => {
      let track = document.querySelector<HTMLElement>('#outside [data-rail-track]')!
      return track.classList.contains('is-jumping') && document.getElementById(id)!.getBoundingClientRect().left > innerWidth
    }, clip)
    assert.ok(onTheWay, 'the flag is pressed while the row is still sliding')
    await frames(page)
    await page.click('.lang-en')
    await page.waitForURL(/\/#clip-/)
    assert.equal(new URL(page.url()).hash, `#${clip}`)
  })

  it('comes back from a post to the posts, not to a clip the chips left in the address', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 1440, height: 900 })
    // every Travel clip dealt last: the clip in the address is not in the page, and has to load
    await page.route('**/data/clips.json', async (route) => {
      let response = await route.fetch()
      let json = await response.json() as { clips: { cat: string; score: number }[] }
      json.clips.filter((clip) => clip.cat === 'travel').forEach((clip, i) => { clip.score = -25 * (i + 1) })
      await route.fulfill({ response, json })
    })
    await open(page, '/')
    let clip = await pickTravel(page, '.lang-pt')
    await scrollTo(page, 'posts')
    let link = page.locator('#posts .post-card a').first()
    let href = (await link.getAttribute('href'))!
    await link.click()
    await page.waitForURL(`**${href}`)
    await page.waitForSelector('main.post-main')
    await page.goBack()
    await page.waitForURL((url) => url.hash === `#${clip}`)
    await page.waitForFunction(() => document.documentElement.classList.contains('js-rails'))
    await allClips(page)
    await frames(page)
    let posts = await page.evaluate(() => {
      let box = document.getElementById('posts')!.getBoundingClientRect()
      return { top: Math.round(box.top), bottom: Math.round(box.bottom) }
    })
    assert.ok(posts.top < 450 && posts.bottom > 450, `Posts at ${posts.top} to ${posts.bottom}px`)
  })

  it('lands the carried clip itself under the menu after a language switch on a phone', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 390, height: 844 })
    await dealLinkedLast(page)
    await open(page, '/')
    let clip = await pickTravel(page, '.lang-pt')
    await page.click('.lang-pt')
    await page.waitForURL(/\/pt\/#clip-/)
    await waitForClip(page, '.lang-en', clip)
    await allClips(page)
    await page.waitForFunction((id) => {
      let top = document.getElementById(id)!.getBoundingClientRect().top
      let header = document.querySelector('.cin-nav')!.getBoundingClientRect().bottom
      return top >= header && top < 200
    }, clip, { timeout: 6000 })
  })

  // the other language's flag carries the clip in view (#clip-…): the page lands with the clip under the menu,
  // and nothing above it (the career's height, its folded tags) moves it on the way
  it('lands a #clip-… under the menu on a phone', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => { try { localStorage.setItem('ao-intro', '1') } catch {} })
    await page.goto('/pt/#clip-h-iron', { waitUntil: 'load' })
    await page.waitForTimeout(2500)
    let { top, header } = await page.evaluate(() => ({ top: document.getElementById('clip-h-iron')!.getBoundingClientRect().top, header: document.querySelector('.cin-nav')!.getBoundingClientRect().bottom }))
    assert.ok(top >= header && top < 200, `the clip's top at ${top}px, the menu ends at ${header}px`)
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

  it('replays a Jump Over Jump move when the board comes into view', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, '/')
    let board = page.locator('#jumpoverjump [data-joj-demo]').first()
    await board.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }))
    await board.locator('.jd-squares [data-route="end"]').waitFor({ state: 'attached', timeout: 8000 })
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
    // each press pages the row along; the next waits for it to come to rest (on a busy machine a fixed pause
    // ran out of presses before the end)
    for (let i = 0; i < 12 && !(await page.locator('#track2fit [data-rail-next]').isDisabled()); i++) {
      await page.keyboard.press('Enter')
      await resting(page, 'track2fit')
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
    await pressChip(page, '#outside [data-rail-cat]')
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
    // a job's tags all show (no "+12 more" to press)
    assert.equal(await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#job-kinaxis .job-tech li')].filter((li) => li.offsetWidth).length), 18)
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
