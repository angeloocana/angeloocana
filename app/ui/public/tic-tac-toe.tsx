import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

import { whenNear } from './near.ts'

// The page's Tic Tac Toe AI boards: the game and its AI (tic-tac-toe-game.ts) are imported once one of them
// comes near.
export const TicTacToe = clientEntry(import.meta.url, function TicTacToe(handle: Handle) {
  handle.queueTask(() => whenNear('[data-ttt]', handle.signal, async () => (await import('./tic-tac-toe-game.ts')).playTicTacToe(handle.signal)))

  return () => <span hidden />
})
