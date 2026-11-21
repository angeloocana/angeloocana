import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

import { whenNear } from './near.ts'

// The page's Jump Over Jump demo boards: the replays (joj-demo-game.ts) are imported once one of them comes
// near, and not while the system asks for reduced motion (the boards keep their opening position). Reduced
// motion can come and go while the page is open, the import still on its way too: every change tries again
// until the replays have actually started (the same query rails/motion.ts follows).
export const JojDemo = clientEntry(import.meta.url, function JojDemo(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal
    let reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let near = false
    let started = false
    let start = async () => {
      if (!near || started || reduced.matches) return
      // (a failed download is tried again on the next change)
      let { playJojDemo } = await import('./joj-demo-game.ts').catch(() => ({ playJojDemo: undefined }))
      if (!playJojDemo) return
      if (signal.aborted || started || reduced.matches) return
      started = true
      playJojDemo(signal)
    }
    whenNear('[data-joj-demo]', signal, async () => () => { near = true; start() })
    reduced.addEventListener('change', () => { start() }, { signal })
  })

  return () => <span hidden />
})
