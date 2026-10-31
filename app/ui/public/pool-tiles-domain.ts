// The tiles of Pool Tile Designer (github.com/angeloocana/pool-tile-designer), which Ângelo built in a
// week in July 2017 as "Desenhe suas Pastilhas": pick a color, then paint a pool's mosaic tile by tile.
// Ported from JavaScript (Ramda, Redux) to plain TypeScript, keeping its small immutable functions and
// its palette. One fix: the original read the old colors back by [column][row] when resizing, so a
// resize lost or swapped them on any grid that wasn't square (its tests only tried one tile).
// pool-tiles.tsx plays it on the home page.

/** The original palette, in its order: three blues, white, yellow, orange, red. Names are in copy.ts. */
export const COLORS = ['#0000ff', '#3365ff', '#65ccff', '#ffffff', '#ffff00', '#ff9900', '#ff3300']
const [COBALT, MEDIUM, LIGHT, WHITE, YELLOW, ORANGE] = COLORS

export type Size = { nRows: number; nCols: number }
export type Position = { x: number; y: number }
export type Tile = Position & { color: string }
export type Tiles = { size: Size; rows: Tile[][] }

/** The card's grid starts at 9 rows (the original's) by 18 columns (half its 33, to fit a phone). */
export const DEFAULT_SIZE: Size = { nRows: 9, nCols: 18 }
export const LIMITS = { nRows: [2, 16], nCols: [2, 36] } as const

/** A size inside the limits, in whole tiles. */
export function clampSize(size: Size): Size {
  let clamp = (n: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, Math.round(n) || min))
  return { nRows: clamp(size.nRows, LIMITS.nRows), nCols: clamp(size.nCols, LIMITS.nCols) }
}

/** The color at a position, or white outside the tiles. */
export function getColor(tiles: Tiles, { x, y }: Position): string {
  return tiles.rows[y]?.[x]?.color ?? WHITE
}

/** White tiles: rows top to bottom (y), each tile left to right (x). */
export function createTiles(size: Size): Tiles {
  let { nRows, nCols } = clampSize(size)
  let rows = Array.from({ length: nRows }, (_, y) => Array.from({ length: nCols }, (_, x) => ({ x, y, color: WHITE })))
  return { size: { nRows, nCols }, rows }
}

/** New tiles at a new size; every tile that was there keeps its color. */
export function resizeTiles(size: Size, tiles: Tiles): Tiles {
  let resized = createTiles(size)
  return { ...resized, rows: resized.rows.map((row) => row.map((tile) => ({ ...tile, color: getColor(tiles, tile) }))) }
}

/** The same tiles, with one painted. */
export function paintTile(color: string, { x, y }: Position, tiles: Tiles): Tiles {
  return { ...tiles, rows: tiles.rows.map((row) => row.map((tile) => (tile.x === x && tile.y === y ? { ...tile, color } : tile))) }
}

/** Every tile on a straight line between two, both included: a quick drag skips tiles, and this fills them in. */
export function tilesBetween(from: Position, to: Position): Position[] {
  let steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y))
  return Array.from({ length: steps + 1 }, (_, i) => {
    let k = steps === 0 ? 0 : i / steps
    return { x: Math.round(from.x + (to.x - from.x) * k), y: Math.round(from.y + (to.y - from.y) * k) }
  })
}

/** A tile's label for screen readers, from copy.ts's template ('Row {r}, column {c}: {color}') and color names. */
export function describeTile(template: string, names: string[], { x, y, color }: Tile): string {
  return template
    .replace('{r}', String(y + 1))
    .replace('{c}', String(x + 1))
    .replace('{color}', names[COLORS.indexOf(color)] ?? color)
}

/** What the card opens with, so there's something to change: a sun over water, deeper blue at the bottom. */
export function sampleTiles(size: Size = DEFAULT_SIZE): Tiles {
  let tiles = createTiles(size)
  let { nRows, nCols } = tiles.size
  let surface = (x: number) => Math.round(nRows * 0.42 + Math.sin((x / nCols) * Math.PI * 3) * 1.1)
  let sun = { x: nCols - 4, y: 1 }
  let paint = (x: number, y: number) => {
    let depth = y - surface(x)
    if (depth >= 0) return depth === 0 ? LIGHT : y >= nRows - 2 ? COBALT : MEDIUM
    let dx = Math.abs(x - sun.x)
    let dy = Math.abs(y - sun.y)
    if (dx + dy === 0) return ORANGE
    if (dx + dy === 1) return YELLOW
    return WHITE
  }
  return { ...tiles, rows: tiles.rows.map((row) => row.map((tile) => ({ ...tile, color: paint(tile.x, tile.y) }))) }
}
