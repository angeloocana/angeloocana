import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

import { whenNear } from './near.ts'

// The page's Jump Over Jump demo boards: the replays (joj-demo-game.ts) are imported once one of them comes
// near, and never for reduced motion, where the boards keep their opening position.
export const JojDemo = clientEntry(import.meta.url, function JojDemo(handle: Handle) {
  handle.queueTask(() => matchMedia('(prefers-reduced-motion: reduce)').matches || whenNear('[data-joj-demo]', handle.signal, async () => (await import('./joj-demo-game.ts')).playJojDemo(handle.signal)))

  return () => <span hidden />
})
