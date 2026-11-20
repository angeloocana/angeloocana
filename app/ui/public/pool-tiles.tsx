import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

import { whenNear } from './near.ts'

// The page's pool tile designers: the designer itself (pool-tiles-game.ts) is imported once one of them comes
// near; until then the card shows its words and the empty frame.
export const PoolTiles = clientEntry(import.meta.url, function PoolTiles(handle: Handle) {
  handle.queueTask(() => whenNear('[data-pool]', handle.signal, async () => (await import('./pool-tiles-game.ts')).playPoolTiles(handle.signal)))

  return () => <span hidden />
})
