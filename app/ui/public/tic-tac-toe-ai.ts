// The rules and the AI of Tic Tac Toe AI (github.com/angeloocana/tic-tac-toe-ai), which Ângelo wrote by
// hand in 2017 for his interview at Kinaxis. Ported from JavaScript (Ramda, Synaptic) to plain TypeScript,
// keeping what it did: the same bitwise board, the same scoring, the same learning rates, and a small
// neural network that trains on every game. It never learns to play (it's trained toward the board after
// the move, not the square to play, so it settles on one favourite square); simple rules make the moves
// that matter: win, then block, otherwise any free square.
// tic-tac-toe.tsx draws it on a canvas and plays it on the home page.

export const EMPTY = 0
export const X = 1
export const O = 2
export type Cell = typeof EMPTY | typeof X | typeof O

/** Squares 0 to 8, left to right, top to bottom. */
export const INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8]

/** The eight lines that win. */
export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export type Game = {
  /** The whole board in one number: two bits per square, X = 01, O = 10. */
  board: number
  ended: boolean
  started: boolean
  lastMove: number | null
  /** The winning line, when there is one. */
  winners: number[] | null
  isAiTurn: boolean
  aiStarted: boolean
  score: { ai: number; human: number }
}

// ---------- the bitwise board ----------

const bitOf = (index: number) => index * 2
const maskOf = (bit: number) => 3 << bit

export function getPosition(board: number, index: number): Cell | null {
  if (!(index >= 0 && index < 9)) return null
  let bit = bitOf(index)
  return ((board & maskOf(bit)) >> bit) as Cell
}

export const isPositionEmpty = (board: number, index: number) => getPosition(board, index) === EMPTY

/** The board with `value` in an empty square, or null when the square is taken. */
export function setPosition(board: number, index: number, value: Cell): number | null {
  if (!isPositionEmpty(board, index)) return null
  let bit = bitOf(index)
  return (board & ~maskOf(bit)) | (value << bit)
}

/** Build a board from nine values, for tests: getBoard(X, O, EMPTY, …). */
export const getBoard = (...cells: Cell[]) => cells.reduce<number>((board, value, index) => (value ? setPosition(board, index, value)! : board), 0)

export const getEmptyPositions = (board: number) => INDEXES.filter((i) => isPositionEmpty(board, i))

export const getBoardArray = (board: number) => INDEXES.map((i) => getPosition(board, i) as Cell)

export function getWinners(board: number): number[] | null {
  return LINES.find(([a, b, c]) => {
    let p = getPosition(board, a)
    return p !== EMPTY && p === getPosition(board, b) && p === getPosition(board, c)
  }) ?? null
}

// ---------- the game ----------

const INITIAL: Game = {
  board: 0,
  ended: false,
  started: false,
  lastMove: null,
  winners: null,
  isAiTurn: true,
  aiStarted: true,
  score: { ai: 0, human: 0 },
}

/** The first game the AI starts; after that whoever didn't start last time does, and the score carries on. */
export function getInitialGame(old?: Game | null): Game {
  return old ? { ...INITIAL, isAiTurn: !old.aiStarted, aiStarted: !old.aiStarted, score: old.score } : INITIAL
}

/** Play the next piece (X moves first) in a square. Null when the square is taken. */
export function move(old: Game, index: number): Game | null {
  if (old.ended) return old
  let nClicks = 9 - getEmptyPositions(old.board).length
  let board = setPosition(old.board, index, nClicks % 2 ? O : X)
  if (board === null) return null
  let winners = getWinners(board)
  let firstPlayerMoved = nClicks % 2 === 0
  let ended = Boolean(winners) || nClicks > 7
  let point = (score: number, mine: boolean) => score + (winners && mine ? 1 : 0)
  return {
    board,
    ended,
    started: true,
    lastMove: index,
    winners,
    isAiTurn: !old.isAiTurn,
    aiStarted: old.aiStarted,
    score: ended
      ? {
          ai: point(old.score.ai, old.aiStarted ? firstPlayerMoved : !firstPlayerMoved),
          human: point(old.score.human, old.aiStarted ? !firstPlayerMoved : firstPlayerMoved),
        }
      : old.score,
  }
}

// ---------- the AI ----------

/**
 * The squares worth playing (https://en.wikipedia.org/wiki/Tic-tac-toe#Strategy):
 * 1. win, 2. block, otherwise any empty square. (Forks, center and corners were still on the to-do list.)
 */
export function getBestPositions(old: Game): number[] {
  let empty = getEmptyPositions(old.board)

  let wins = empty.filter((p) => move(old, p)!.ended)
  if (wins.length) return wins

  // would the other player end the game there next turn?
  let blocks = empty.filter((p) => {
    let other = empty.find((e) => e !== p)!
    let after = move(old, other)
    return Boolean(after && move(after, p)?.ended)
  })
  if (blocks.length) return blocks

  return empty
}

/** Two inputs per square: X = [1, 0], O = [0, 1], empty = [0, 0]. */
export const getInputLayer = (board: number) =>
  INDEXES.flatMap((i) => {
    let p = getPosition(board, i)
    return p === X ? [1, 0] : p === O ? [0, 1] : [0, 0]
  })

/** The square the network likes best. */
export const getPositionIndex = (output: number[]) => output.reduce((best, value, i) => (value > output[best] ? i : best), 0)

/** How hard each kind of move teaches the network. (The original's TODO: find the best rates.) */
export const LEARNING_RATES = { invalidMove: 0.1, validMove: 0.6, win: 1, lost: 0 }

/**
 * A feed-forward network that learns the way Synaptic's Network does: logistic neurons with a bias,
 * weights and biases starting between -0.1 and 0.1, and propagate(rate, target) adjusting the output
 * layer first, then the hidden one. The original was 18 inputs, 9 hidden and 9 outputs.
 */
export class Network {
  private weights: number[][][] // [layer][to][from]
  private biases: number[][]
  private activations: number[][] = []

  constructor(sizes = [18, 9, 9], random: () => number = Math.random) {
    let start = () => random() * 0.2 - 0.1
    this.weights = sizes.slice(1).map((size, l) => Array.from({ length: size }, () => Array.from({ length: sizes[l] }, start)))
    this.biases = sizes.slice(1).map((size) => Array.from({ length: size }, start))
  }

  activate(input: number[]): number[] {
    this.activations = [input]
    for (let l = 0; l < this.weights.length; l++) {
      let previous = this.activations[l]
      this.activations.push(
        this.weights[l].map((row, j) => 1 / (1 + Math.exp(-(this.biases[l][j] + row.reduce((sum, w, k) => sum + w * previous[k], 0))))),
      )
    }
    return this.activations[this.activations.length - 1]
  }

  propagate(rate: number, target: number[]): void {
    let last = this.weights.length - 1
    // the output layer's error is just how far it was from the target
    let responsibility = this.activations[last + 1].map((a, j) => target[j] - a)
    for (let l = last; l >= 0; l--) {
      let inputs = this.activations[l]
      this.weights[l].forEach((row, j) => {
        row.forEach((_, k) => (row[k] += rate * responsibility[j] * inputs[k]))
        this.biases[l][j] += rate * responsibility[j]
      })
      if (l === 0) break
      // the layer below shares the blame through the (already adjusted) weights, as Synaptic does
      responsibility = inputs.map((a, k) => a * (1 - a) * this.weights[l].reduce((sum, row, j) => sum + responsibility[j] * row[k], 0))
    }
  }
}

/**
 * The AI's move. The network picks a square; a winning pick is rewarded hardest, a sensible one
 * (one of getBestPositions) is reinforced, and anything else is replaced by a sensible square,
 * which the network is then nudged towards. The target is the board after the move, as in 2017.
 */
export function getAiMove(old: Game, net: Network, random: () => number = Math.random): number {
  let index = getPositionIndex(net.activate(getInputLayer(old.board)))
  let next = move(old, index)

  if (next?.ended) {
    net.propagate(LEARNING_RATES.win, getBoardArray(next.board))
    return index
  }

  let best = getBestPositions(old)
  if (next && best.includes(index)) {
    net.propagate(LEARNING_RATES.validMove, getBoardArray(next.board))
    return index
  }

  let pick = best[Math.floor(random() * best.length)]
  net.propagate(LEARNING_RATES.invalidMove, getBoardArray(move(old, pick)!.board))
  return pick
}
