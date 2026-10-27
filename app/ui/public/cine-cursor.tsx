import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

// A soft ring that trails the pointer and grows over links, showing the link's data-cursor label
// ("Play", "Open"...). Only for fine pointers; the system cursor stays visible for accessibility.
export const CineCursor = clientEntry(import.meta.url, function CineCursor(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let ring = document.querySelector<HTMLElement>('.cur')
    let label = ring?.querySelector<HTMLElement>('.cur-label')
    if (!ring || !label) return
    let cursor = ring
    let text = label
    let x = innerWidth / 2
    let y = innerHeight / 2
    let tx = x
    let ty = y
    let raf = 0

    function loop() {
      x += (tx - x) * 0.18
      y += (ty - y) * 0.18
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    addEventListener(
      'pointermove',
      (event) => {
        tx = event.clientX
        ty = event.clientY
        cursor.dataset.on = 'true'
        let target = event.target instanceof Element ? event.target.closest<HTMLElement>('a, button, [data-cursor]') : null
        let mode = target ? target.dataset.cursor || 'link' : ''
        if (cursor.dataset.mode !== mode) {
          cursor.dataset.mode = mode
          text.textContent = mode && mode !== 'link' ? mode : ''
        }
      },
      { signal, passive: true },
    )
    document.addEventListener('pointerleave', () => { cursor.dataset.on = 'false' }, { signal })
    raf = requestAnimationFrame(loop)
    signal.addEventListener('abort', () => cancelAnimationFrame(raf))
  })

  return () => (
    <div class="cur" aria-hidden="true">
      <span class="cur-label" />
    </div>
  )
})
