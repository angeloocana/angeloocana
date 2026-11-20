import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

// The home page's sheet of ice (ice-gl.ts): one canvas fixed over the screen, the page scrolling under it,
// that never takes a click, a tap or the focus. Nothing of it loads with the page: the WebGL code comes once
// the page has loaded and the browser is idle, so the hero's words paint first, and fades in. Without WebGL
// the screen's edges get a plain CSS frost instead (html[data-ice="off"] in site.css).
export const Ice = clientEntry(import.meta.url, function Ice(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal
    let canvas = document.querySelector<HTMLCanvasElement>('canvas.ice')
    if (!canvas) return
    let ice = canvas
    let start = async () => {
      if (signal.aborted) return
      let { mountIce } = await import('./ice-gl.ts')
      let on = false
      try {
        on = !signal.aborted && (await mountIce(ice, signal))
      } catch {}
      if (!on) document.documentElement.dataset.ice = 'off'
    }
    let whenIdle = () => {
      if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2000 })
      else setTimeout(start, 200)
    }
    if (document.readyState === 'complete') whenIdle()
    else addEventListener('load', whenIdle, { signal, once: true })
  })

  return () => <canvas class="ice" aria-hidden="true" />
})
