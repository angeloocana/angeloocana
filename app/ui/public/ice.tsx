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
    let reducedQuery = matchMedia('(prefers-reduced-motion: reduce)')
    let still = () => root.classList.contains('is-paused') || reducedQuery.matches || saveData
    // the pause, before rails.tsx has marked it, counts only until it has (is-paused then says)
    let marked = () => root.classList.contains('js-rails')
    let off = () => still() || (!marked() && pausedAtLoad())

    // Until the sheet is up, the motion is watched: off, the CSS frost shows and anything queued waits (it
    // checks again when it runs); on again, the wait for idle starts over. The watching ends with the mount.
    let started = false
    let idle = 0
    let loaded = document.readyState === 'complete'
    let start = async () => {
      idle = 0
      if (started || signal.aborted) return
      // paused or reduced since this was queued: no WebGL yet, it waits for the motion to come back
      if (off()) return showOff()
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
    let showOff = () => { root.dataset.ice = 'off' }
    // (Safari has no requestIdleCallback: a short timer there)
    let hasIdle = 'requestIdleCallback' in window
    let cancelIdle = () => {
      if (hasIdle) cancelIdleCallback(idle)
      else clearTimeout(idle)
      idle = 0
    }
    // the motion changed, or the page loaded: the sheet waits for the browser to be idle, if it may come
    let check = () => {
      if (signal.aborted || started) return
      if (off()) { cancelIdle(); showOff(); return }
      if (!loaded || idle) return
      idle = hasIdle ? requestIdleCallback(start, { timeout: 2000 }) : window.setTimeout(start, 200)
    }
    let watch = new MutationObserver(check)
    watch.observe(root, { attributes: true, attributeFilter: ['class'] })
    reducedQuery.addEventListener('change', check, { signal })
    signal.addEventListener('abort', () => { watch.disconnect(); cancelIdle() })
    if (!loaded) addEventListener('load', () => { loaded = true; check() }, { signal, once: true })
    check()
  })

  return () => <canvas class="ice" aria-hidden="true" />
})
