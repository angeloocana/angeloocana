import { readFile, readdir } from 'node:fs/promises'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import type { Page } from 'playwright'

import { serveDist } from './test-support/serve-dist.ts'

async function iceFixture(page: Page) {
  let dir = '/assets/app/ui/public/'
  let files = await readdir(`dist${dir}`)
  let asset = (prefix: string) => {
    let name = files.find((file) => file.startsWith(`${prefix}.`) && file.endsWith('.js'))
    assert.ok(name, `missing ${prefix} in the build`)
    return `${dir}${name.replaceAll('@', '%40')}`
  }
  let home = await readFile('dist/index.html', 'utf8')
  let map = home.match(/<script[^>]+type="importmap">[^<]+<\/script>/)?.[0]
  assert.ok(map, 'missing the built import map')
  await page.route('**/ice-fixture', (route) => route.fulfill({
    contentType: 'text/html',
    body: `<html class="cin-seen"><head>${map}</head><body><canvas class="ice" width="64" height="48"></canvas></body></html>`,
  }))
  await page.goto('/ice-fixture')
  return { entry: asset('ice'), gl: asset('ice-gl') }
}

it('starts ice after a pause at load but does not mount from a paused idle or import callback', async (t) => {
  let page = await t.serve(await serveDist())
  let { entry, gl } = await iceFixture(page)
  // Only strip the GPU boundary. The built entry still loads this module via its real dynamic import.
  await page.route((url) => url.pathname === gl, (route) => route.fulfill({
    contentType: 'text/javascript',
    body: 'export const mountIce = (canvas) => { canvas.dataset.mounts = +(canvas.dataset.mounts || 0) + 1; return true }',
  }))
  let result = await page.evaluate(async (entry) => {
    let { Ice } = await import(entry) as typeof import('./ui/public/ice.tsx')
    let root = document.documentElement
    let canvas = document.querySelector('canvas')!
    let mounts = () => Number(canvas.dataset.mounts ?? 0)
    let pause = () => root.classList.add('is-paused')
    let resume = async () => { root.classList.remove('is-paused'); await Promise.resolve() }
    let loaded = false
    Object.defineProperty(document, 'readyState', { get: () => loaded ? 'complete' : 'loading' })
    let idle: (() => Promise<void>) | undefined
    window.requestIdleCallback = (fn) => { idle = () => fn({} as IdleDeadline) as unknown as Promise<void>; return 1 }
    window.cancelIdleCallback = () => { idle = undefined }
    let takeIdle = (reason: string) => {
      if (!idle) throw new Error(reason)
      let callback = idle
      idle = undefined
      return callback
    }
    // Queue just the real client entry's mount task, without hydrating the rest of the home page.
    let signal = new AbortController().signal
    Ice({ signal, queueTask: (task: () => void) => task() } as Parameters<typeof Ice>[0])
    pause()
    loaded = true
    window.dispatchEvent(new Event('load'))
    await resume()
    let dequeued = takeIdle('lost ice start after motion resumed following load')
    pause()
    await dequeued()
    let afterIdlePause = mounts()
    await resume()
    let pendingImport = takeIdle('lost ice start after a paused idle callback')()
    pause() // before the already-started import resolves
    await pendingImport
    let afterImportPause = mounts()
    // The old code had already stopped watching; don't obscure that failure with a missing-idle error.
    if (afterImportPause) return { afterIdlePause, afterImportPause, afterResume: mounts() }
    await resume()
    await takeIdle('lost ice start after a paused import')()
    return { afterIdlePause, afterImportPause, afterResume: mounts() }
  }, entry)
  assert.equal(result.afterIdlePause, 0, 'no mount from an idle callback delivered after pause')
  assert.equal(result.afterImportPause, 0, 'no mount from an import that finishes after pause')
  assert.equal(result.afterResume, 1, 'mounts once when motion returns')
})

it('recovers a fractional early wake through the mounted timer and RAF, without page input', async (t) => {
  let page = await t.serve(await serveDist())
  let { gl } = await iceFixture(page)
  let result = await page.evaluate(async (gl) => {
    let { mountIce } = await import(gl) as typeof import('./ui/public/ice-gl.ts')
    let canvas = document.querySelector('canvas')!
    let controller = new AbortController()
    // Keep the real DOM, clock consumers and frame loop. Stub rendering commands and count animal draws.
    let swims = 0
    let gpu = new Proxy({
      getProgramParameter: () => true,
      getExtension: () => null,
      getUniformLocation: (_program: unknown, name: string) => name,
      uniform1i: (name: string, unit: number) => { if (name === 'K' && unit === 4) swims++ },
    }, { get: (target, name: string) => Reflect.get(target, name) ?? (/^[A-Z]/.test(name) ? 0 : () => {}) })
    Object.defineProperty(canvas, 'getContext', { value: () => gpu })
    let rng = 0
    Math.random = () => rng
    let now = 0
    let timer: { wake: () => void; at: number } | undefined
    let frame: FrameRequestCallback | undefined
    Object.defineProperty(performance, 'now', { value: () => now })
    window.requestAnimationFrame = (callback) => { frame = callback; return 1 }
    window.cancelAnimationFrame = () => { frame = undefined }
    Object.defineProperty(window, 'setTimeout', {
      value: (wake: () => void, delay: number) => { timer = { wake, at: now + delay }; return 1 },
    })
    window.clearTimeout = () => { timer = undefined }
    // No resize or idle measurement kicks are needed in the blank fixture.
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
    let draw = (at: number) => { let callback = frame; frame = undefined; now = at; callback?.(at) }
    let wake = (early: number) => {
      if (!timer) return
      let callback = timer.wake
      now = timer.at - early
      timer = undefined
      callback()
    }
    let settle = () => {
      for (let n = 0; frame && n < 150; n++) draw(now + 100)
      return !frame && timer ? timer.at - now : null
    }
    if (!await mountIce(canvas, controller.signal)) throw new Error('ice did not mount')
    let firstGap = settle()
    wake(0.25)
    draw(now)
    let early = swims
    wake(0)
    draw(now)
    let atDeadline = swims
    rng = 0.999
    let nextGap = settle()
    let hidden = true
    Object.defineProperty(document, 'hidden', { get: () => hidden })
    document.dispatchEvent(new Event('visibilitychange'))
    let beforeHide = swims
    wake(0)
    draw(now)
    let whileHidden = swims - beforeHide
    hidden = false
    document.dispatchEvent(new Event('visibilitychange'))
    document.documentElement.classList.add('is-paused')
    draw(now) // the visibility-triggered frame arrives before the pause observer
    let whilePaused = swims - beforeHide
    await Promise.resolve()
    document.documentElement.classList.remove('is-paused')
    await Promise.resolve()
    draw(now)
    let afterResume = swims - beforeHide
    controller.abort()
    return { firstGap, early, atDeadline, nextGap, whileHidden, whilePaused, afterResume, pendingAfterAbort: Boolean(timer || frame) }
  }, gl)
  assert.equal(result.firstGap, 5_000, 'the settled ice sleeps until the first swim')
  assert.equal(result.early, 0, 'a timeout delivered early is not authorization to start')
  assert.equal(result.atDeadline, 1, 'the re-armed timer starts the swim with no page input')
  assert.equal(result.nextGap, 19_985, 'a fresh near-maximum gap begins after the swim ends')
  assert.equal(result.whileHidden, 0, 'no swim while hidden')
  assert.equal(result.whilePaused, 0, 'a pending frame cannot start a swim after pause')
  assert.equal(result.afterResume, 1, 'an overdue swim starts on return')
  assert.equal(result.pendingAfterAbort, false, 'no callback survives teardown')
})
