import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

// The hero's sheet of ice (ice-gl.ts): a canvas over the hero that never takes a click, a tap or the focus.
// It also brings the quiet sound toggle beside the email button (home-page.tsx) to life. Nothing of it loads with the page: the WebGL code comes once
// the page has loaded and the browser is idle, so the hero's words paint first, and fades in. Without WebGL
// the tiles get a plain CSS frost instead (.hero[data-ice="off"] in site.css).
export const Ice = clientEntry(import.meta.url, function Ice(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal
    let canvas = document.querySelector<HTMLCanvasElement>('canvas.ice')
    let sound = document.querySelector<HTMLButtonElement>('.ice-sound')
    if (!canvas) return
    let ice = canvas
    let start = async () => {
      if (signal.aborted) return
      let { mountIce } = await import('./ice-gl.ts')
      let on = false
      try {
        on = !signal.aborted && (await mountIce(ice, sound, signal))
      } catch {}
      if (!on) ice.parentElement!.dataset.ice = 'off'
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
