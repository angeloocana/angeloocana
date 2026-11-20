import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

import { whenNear } from './near.ts'

// The page's Jump Over Jump demo boards: the replays (joj-demo-game.ts) are imported once one of them comes
// near, and not while the system asks for reduced motion (the boards keep their opening position); turned off
// while the page is open, the replays come then (the same query rails/motion.ts follows).
export const JojDemo = clientEntry(import.meta.url, function JojDemo(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal
    let reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let start = () => whenNear('[data-joj-demo]', signal, async () => (await import('./joj-demo-game.ts')).playJojDemo)
    if (!reduced.matches) return start()
    reduced.addEventListener('change', () => { if (!reduced.matches) start() }, { signal, once: true })
  })

  return () => <span hidden />
})
