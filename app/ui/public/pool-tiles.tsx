import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

import { COLORS, clampSize, createTiles, describeTile, getColor, paintTile, resizeTiles, sampleTiles, tilesBetween, type Position, type Size } from './pool-tiles-domain.ts'

// Plays Pool Tile Designer (pool-tiles-domain.ts) in every [data-pool] card on the page. home-page.tsx
// renders the palette, the tiles as buttons (so they work with a mouse, a finger or a keyboard, and a
// press on one doesn't start dragging the row), the size steppers and Clear. A tap paints one tile; a
// mouse can drag across many. A finger dragging over the tiles still scrolls, so the row and the page
// never get stuck under them. The arrow keys move between tiles, and only one of them is in the tab order.

type Words = { cell: string; names: string[] }
type Key = keyof Size

export const PoolTiles = clientEntry(import.meta.url, function PoolTiles(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal
    for (let root of document.querySelectorAll<HTMLElement>('[data-pool]')) setUp(root)

    function setUp(root: HTMLElement) {
      let words = JSON.parse(root.dataset.words ?? '{}') as Words
      let grid = root.querySelector<HTMLElement>('[data-pool-grid]')!
      let swatches = [...root.querySelectorAll<HTMLButtonElement>('[data-pool-color]')]
      let steppers = [...root.querySelectorAll<HTMLButtonElement>('[data-pool-step]')]

      // the same design the page was rendered with
      let tiles = sampleTiles()
      let color = COLORS[0]
      let focus: Position = { x: 0, y: 0 }
      /** While a mouse paints: the last tile it painted. */
      let painting: Position | null = null

      let at = ({ x, y }: Position) => (x < tiles.size.nCols ? (grid.children[y * tiles.size.nCols + x] as HTMLButtonElement | undefined) : undefined)
      let positionOf = (target: EventTarget | null): Position | null => {
        let tile = target instanceof Element ? target.closest<HTMLButtonElement>('button[data-x]') : null
        return tile && grid.contains(tile) ? { x: Number(tile.dataset.x), y: Number(tile.dataset.y) } : null
      }

      function show(tile: HTMLButtonElement, position: Position) {
        let c = getColor(tiles, position)
        tile.style.setProperty('--c', c)
        tile.setAttribute('aria-label', describeTile(words.cell, words.names, { ...position, color: c }))
      }

      /** The whole grid again, after a resize or Clear; the steppers say when a limit is reached. */
      function build() {
        let { nRows, nCols } = tiles.size
        focus = { x: Math.min(focus.x, nCols - 1), y: Math.min(focus.y, nRows - 1) }
        grid.style.setProperty('--rows', String(nRows))
        grid.style.setProperty('--cols', String(nCols))
        grid.replaceChildren(
          ...tiles.rows.flat().map((position) => {
            let tile = document.createElement('button')
            tile.type = 'button'
            tile.dataset.x = String(position.x)
            tile.dataset.y = String(position.y)
            tile.tabIndex = position.x === focus.x && position.y === focus.y ? 0 : -1
            show(tile, position)
            return tile
          }),
        )
        for (let stepper of steppers) {
          let key = stepper.dataset.poolStep as Key
          let next = clampSize({ ...tiles.size, [key]: tiles.size[key] + Number(stepper.dataset.by) })
          stepper.setAttribute('aria-disabled', String(next[key] === tiles.size[key]))
        }
        for (let output of root.querySelectorAll<HTMLElement>('[data-pool-out]')) output.textContent = String(tiles.size[output.dataset.poolOut as Key])
      }

      function paint(position: Position) {
        if (getColor(tiles, position) === color) return
        tiles = paintTile(color, position, tiles)
        let tile = at(position)
        if (tile) show(tile, position)
      }

      function moveFocus(to: Position) {
        let next = at(to)
        if (!next || to.y >= tiles.size.nRows) return
        let current = at(focus)
        if (current) current.tabIndex = -1
        next.tabIndex = 0
        next.focus()
        focus = to
      }

      // ---------- painting ----------

      grid.addEventListener('click', (event) => {
        let position = positionOf(event.target)
        if (!position) return
        paint(position)
        moveFocus(position)
      }, { signal })
      // a mouse paints every tile it crosses, even the ones a quick drag jumps over
      grid.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return
        let position = positionOf(event.target)
        if (!position) return
        painting = position
        paint(position)
      }, { signal })
      grid.addEventListener('pointerover', (event) => {
        if (!painting) return
        let position = positionOf(event.target)
        if (!position) return
        tilesBetween(painting, position).forEach(paint)
        painting = position
      }, { signal })
      for (let type of ['pointerup', 'pointercancel', 'blur'] as const) addEventListener(type, () => (painting = null), { signal })

      grid.addEventListener('keydown', (event) => {
        let step: Record<string, Position> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }
        let by = step[event.key]
        if (!by) return
        event.preventDefault()
        let to = { x: focus.x + by.x, y: focus.y + by.y }
        if (to.x >= 0 && to.y >= 0) moveFocus(to)
      }, { signal })

      // ---------- palette, size and Clear ----------

      for (let swatch of swatches) {
        swatch.addEventListener('click', () => {
          color = swatch.dataset.poolColor ?? color
          for (let other of swatches) other.setAttribute('aria-pressed', String(other === swatch))
        }, { signal })
      }
      for (let stepper of steppers) {
        stepper.addEventListener('click', () => {
          let key = stepper.dataset.poolStep as Key
          let size = clampSize({ ...tiles.size, [key]: tiles.size[key] + Number(stepper.dataset.by) })
          if (size[key] === tiles.size[key]) return
          tiles = resizeTiles(size, tiles)
          build()
        }, { signal })
      }
      root.querySelector('[data-pool-clear]')?.addEventListener('click', () => {
        tiles = createTiles(tiles.size)
        build()
      }, { signal })

      build()
    }
  })

  return () => <span hidden />
})
