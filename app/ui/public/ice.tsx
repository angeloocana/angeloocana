import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

// The home page's sheet of ice (ice-gl.ts): one canvas fixed over the screen, the page scrolling under it,
// that never takes a click, a tap or the focus. Nothing of it loads with the page: the WebGL code comes once
// the page has loaded and the browser is idle, so the hero's words paint first, and fades in. While the
// page's motion is off (reduced motion, data saver, or paused with a pause button: html.is-paused, set by
// rails.tsx) it doesn't load at all; the screen's edges get a plain CSS frost (html[data-ice="off"] in
// home.css), as they do without WebGL, and the sheet comes the first time the motion is turned on.
export const Ice = clientEntry(import.meta.url, function Ice(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal
    let canvas = document.querySelector<HTMLCanvasElement>('canvas.ice')
    if (!canvas) return
    let ice = canvas
    let root = document.documentElement
    // what rails.tsx is about to mark, read here too: this script may run before it
    let pausedAtLoad = () => {
      try {
        return sessionStorage.getItem('ao-paused') === '1'
      } catch {
        return false
      }
    }
    let saveData = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    let still = () => root.classList.contains('is-paused') || matchMedia('(prefers-reduced-motion: reduce)').matches || saveData

    let started = false
    let start = async () => {
      if (started || signal.aborted) return
      started = true
      watch.disconnect()
      let on = false
      try {
        let { mountIce } = await import('./ice-gl.ts')
        on = !signal.aborted && (await mountIce(ice, signal))
      } catch {}
      if (on) delete root.dataset.ice
      else root.dataset.ice = 'off'
    }
    // waits while the motion is off, then for the browser to be idle
    let whenIdle = () => {
      if (signal.aborted || started) return
      if (still()) return
      if ('requestIdleCallback' in window) {
        let id = requestIdleCallback(start, { timeout: 2000 })
        signal.addEventListener('abort', () => cancelIdleCallback(id))
      } else setTimeout(start, 200)
    }
    let watch = new MutationObserver(whenIdle)
    signal.addEventListener('abort', () => watch.disconnect())
    if (still() || pausedAtLoad()) {
      root.dataset.ice = 'off'
      watch.observe(root, { attributes: true, attributeFilter: ['class'] })
      matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', whenIdle, { signal })
      return
    }
    if (document.readyState === 'complete') whenIdle()
    else addEventListener('load', whenIdle, { signal, once: true })
  })

  return () => <canvas class="ice" aria-hidden="true" />
})
