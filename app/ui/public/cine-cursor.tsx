import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

// A soft ring that trails the pointer and grows over links, showing the link's data-cursor label
// ("Instagram" on a clip, "Posts" on a post card). Only for fine pointers; the system cursor stays visible
// for accessibility. Labels are only for things without words of their own (cards, images): the filled
// ring would cover a button's label, so the ring hides over buttons (.cin-btn, or data-cursor="none")
// and text links get no label (a thin outline that leaves the words readable). Reduced motion hides the ring, and follows
// the preference live, both ways.
export const CineCursor = clientEntry(import.meta.url, function CineCursor(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal
    if (!matchMedia('(pointer: fine)').matches) return
    let ring = document.querySelector<HTMLElement>('.cur')
    let label = ring?.querySelector<HTMLElement>('.cur-label')
    if (!ring || !label) return
    let cursor = ring
    let text = label
    let reducedQuery = matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = reducedQuery.matches
    let x = innerWidth / 2
    let y = innerHeight / 2
    let tx = x
    let ty = y
    let raf = 0
    let then = 0

    // Eases toward the pointer by elapsed time, not per frame, so a slow or dropped frame doesn't make
    // the ring lag further behind; it stops when it has caught up and starts again on the next move.
    function loop(now: number) {
      let k = 1 - Math.exp(-Math.max(0, now - then) / 28)
      then = now
      x += (tx - x) * k
      y += (ty - y) * k
      if (Math.abs(tx - x) < 0.3 && Math.abs(ty - y) < 0.3) { x = tx; y = ty; raf = 0 }
      else raf = requestAnimationFrame(loop)
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    reducedQuery.addEventListener('change', () => {
      reduced = reducedQuery.matches
      if (!reduced) return
      cancelAnimationFrame(raf)
      raf = 0
      cursor.dataset.on = 'false'
    }, { signal })

    addEventListener(
      'pointermove',
      (event) => {
        tx = event.clientX
        ty = event.clientY
        if (reduced) return
        // back from reduced motion (or the first move): start where the pointer is, not where it was
        if (cursor.dataset.on !== 'true') { x = tx; y = ty }
        if (!raf) { then = performance.now(); raf = requestAnimationFrame(loop) }
        cursor.dataset.on = 'true'
        let target = event.target instanceof Element ? event.target.closest<HTMLElement>('a, button, [data-cursor]') : null
        // a button with its own words (.cin-btn: the email, Open, Play, GitHub...) hides it
        let mode = !target ? '' : target.dataset.cursor || (target.classList.contains('cin-btn') ? 'none' : 'link')
        if (cursor.dataset.mode !== mode) {
          cursor.dataset.mode = mode
          text.textContent = mode && mode !== 'link' && mode !== 'none' ? mode : ''
        }
      },
      { signal, passive: true },
    )
    document.addEventListener('pointerleave', () => { cursor.dataset.on = 'false' }, { signal })
    signal.addEventListener('abort', () => cancelAnimationFrame(raf))
  })

  return () => (
    <div class="cur" aria-hidden="true">
      <span class="cur-label" />
    </div>
  )
})
