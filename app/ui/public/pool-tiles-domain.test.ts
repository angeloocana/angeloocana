import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { COLORS, DEFAULT_SIZE, LIMITS, clampSize, createTiles, getColor, paintTile, resizeTiles, sampleTiles, tilesBetween } from './pool-tiles-domain.ts'

const [BLUE, , , WHITE, YELLOW, , RED] = COLORS

describe('pool tiles', () => {
  it('creates white tiles, rows top to bottom and tiles left to right', () => {
    let tiles = createTiles({ nRows: 2, nCols: 3 })
    assert.deepEqual(tiles.size, { nRows: 2, nCols: 3 })
    assert.deepEqual(tiles.rows.map((row) => row.map(({ x, y }) => [x, y])), [
      [[0, 0], [1, 0], [2, 0]],
      [[0, 1], [1, 1], [2, 1]],
    ])
    assert.ok(tiles.rows.flat().every((tile) => tile.color === WHITE))
  })

  it('keeps sizes inside the limits, in whole tiles', () => {
    assert.deepEqual(clampSize({ nRows: 0, nCols: 999 }), { nRows: LIMITS.nRows[0], nCols: LIMITS.nCols[1] })
    assert.deepEqual(clampSize({ nRows: 4.4, nCols: Number.NaN }), { nRows: 4, nCols: LIMITS.nCols[0] })
  })

  it('reads a color, and white outside the tiles', () => {
    let tiles = paintTile(RED, { x: 2, y: 1 }, createTiles({ nRows: 2, nCols: 3 }))
    assert.equal(getColor(tiles, { x: 2, y: 1 }), RED)
    assert.equal(getColor(tiles, { x: 1, y: 2 }), WHITE)
    assert.equal(getColor(tiles, { x: 9, y: 9 }), WHITE)
  })

  it('paints only the tile it is given, and leaves the old tiles alone', () => {
    let before = createTiles({ nRows: 2, nCols: 2 })
    let after = paintTile(BLUE, { x: 1, y: 0 }, before)
    assert.deepEqual(after.rows.map((row) => row.map((tile) => tile.color)), [[WHITE, BLUE], [WHITE, WHITE]])
    assert.equal(getColor(before, { x: 1, y: 0 }), WHITE)
  })

  // the 2017 version read colors back by [column][row], so this lost the yellow and moved the red
  it('keeps every color in place when the grid grows or shrinks, square or not', () => {
    let tiles = createTiles({ nRows: 2, nCols: 5 })
    tiles = paintTile(RED, { x: 1, y: 0 }, tiles)
    tiles = paintTile(YELLOW, { x: 4, y: 1 }, tiles)

    let bigger = resizeTiles({ nRows: 3, nCols: 6 }, tiles)
    assert.equal(getColor(bigger, { x: 1, y: 0 }), RED)
    assert.equal(getColor(bigger, { x: 4, y: 1 }), YELLOW)
    assert.equal(bigger.rows.flat().filter((tile) => tile.color !== WHITE).length, 2)

    let smaller = resizeTiles({ nRows: 2, nCols: 2 }, bigger)
    assert.equal(getColor(smaller, { x: 1, y: 0 }), RED)
    assert.equal(smaller.rows.flat().filter((tile) => tile.color !== WHITE).length, 1)
  })

  it('fills in the tiles a quick drag jumps over', () => {
    assert.deepEqual(tilesBetween({ x: 0, y: 1 }, { x: 4, y: 1 }), [0, 1, 2, 3, 4].map((x) => ({ x, y: 1 })))
    assert.deepEqual(tilesBetween({ x: 2, y: 2 }, { x: 0, y: 0 }), [{ x: 2, y: 2 }, { x: 1, y: 1 }, { x: 0, y: 0 }])
    assert.deepEqual(tilesBetween({ x: 3, y: 3 }, { x: 3, y: 3 }), [{ x: 3, y: 3 }])
  })

  it('opens on a design that uses the palette, at any size', () => {
    let tiles = sampleTiles()
    assert.deepEqual(tiles.size, DEFAULT_SIZE)
    let used = new Set(tiles.rows.flat().map((tile) => tile.color))
    assert.ok(used.size >= 5)
    assert.ok([...used].every((color) => COLORS.includes(color)))
    assert.deepEqual(sampleTiles({ nRows: 2, nCols: 2 }).size, { nRows: 2, nCols: 2 })
  })
})
