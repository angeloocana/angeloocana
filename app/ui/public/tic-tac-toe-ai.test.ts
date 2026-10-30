import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  EMPTY as _,
  Network,
  O,
  X,
  getAiMove,
  getBestPositions,
  getBoard,
  getEmptyPositions,
  getInitialGame,
  getInputLayer,
  getPosition,
  getWinners,
  move,
  setPosition,
  type Game,
} from './tic-tac-toe-ai.ts'

const game = (board: number, extra: Partial<Game> = {}): Game => ({ ...getInitialGame(), board, started: true, ...extra })

describe('tic tac toe board', () => {
  it('keeps each square in two bits', () => {
    let board = getBoard(X, O, _, _, X, _, _, _, O)
    assert.equal(getPosition(board, 0), X)
    assert.equal(getPosition(board, 1), O)
    assert.equal(getPosition(board, 2), _)
    assert.equal(getPosition(board, 8), O)
    assert.equal(getPosition(board, 9), null)
    assert.deepEqual(getEmptyPositions(board), [2, 3, 5, 6, 7])
  })

  it('refuses a square that is taken', () => {
    assert.equal(setPosition(getBoard(X), 0, O), null)
  })

  it('finds the winning line', () => {
    assert.deepEqual(getWinners(getBoard(X, X, X)), [0, 1, 2])
    assert.deepEqual(getWinners(getBoard(O, X, _, X, O, _, _, _, O)), [0, 4, 8])
    assert.equal(getWinners(getBoard(X, O, X)), null)
  })

  it('inputs two neurons per square', () => {
    assert.deepEqual(getInputLayer(getBoard(X, O)).slice(0, 6), [1, 0, 0, 1, 0, 0])
    assert.equal(getInputLayer(0).length, 18)
  })
})

describe('tic tac toe game', () => {
  it('starts with the AI, then takes turns starting and keeps the score', () => {
    let first = getInitialGame()
    assert.equal(first.isAiTurn, true)
    let second = getInitialGame({ ...first, score: { ai: 2, human: 1 } })
    assert.equal(second.isAiTurn, false)
    assert.deepEqual(second.score, { ai: 2, human: 1 })
  })

  it('scores a win for whoever played the line', () => {
    // the AI started, so it plays X; X completes the top row
    let won = move(game(getBoard(X, X, _, O, O)), 2)!
    assert.equal(won.ended, true)
    assert.deepEqual(won.score, { ai: 1, human: 0 })
  })

  it('ends in a draw when the board fills up', () => {
    let drawn = move(game(getBoard(X, O, X, X, O, O, O, X, _)), 8)!
    assert.equal(drawn.ended, true)
    assert.equal(drawn.winners, null)
    assert.deepEqual(drawn.score, { ai: 0, human: 0 })
  })
})

describe('tic tac toe AI', () => {
  it('wins when it can, and blocks when it must', () => {
    assert.deepEqual(getBestPositions(game(getBoard(X, X, _, O, O))), [2])
    // O to play; X threatens the top row
    assert.deepEqual(getBestPositions(game(getBoard(X, X, _, O), { isAiTurn: true, aiStarted: false })), [2])
  })

  it('always picks an empty square, game after game', () => {
    let net = new Network()
    let current = getInitialGame()
    for (let turn = 0; turn < 200; turn++) {
      if (current.ended) current = getInitialGame(current)
      let index = current.isAiTurn ? getAiMove(current, net) : getEmptyPositions(current.board)[0]
      assert.ok(getEmptyPositions(current.board).includes(index))
      current = move(current, index)!
    }
  })
})
