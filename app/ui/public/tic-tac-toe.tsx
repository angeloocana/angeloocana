import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

import { Network, O, X, getAiMove, getInitialGame, getPosition, move, type Game } from './tic-tac-toe-ai.ts'

// Plays Tic Tac Toe AI (tic-tac-toe-ai.ts) in every [data-ttt] board on the page. home-page.tsx renders a
// canvas with nine buttons over it, so the squares work with a mouse, a finger or a keyboard, and a press on
// one doesn't start dragging the row. The canvas draws the way the 2017 version did, frame by frame: the
// board's lines one after another, each X stroke by stroke, each O as a growing arc, then the winning line.
// The timing is the original's too: the AI moves a second after you, a new game starts two seconds after
// one ends, and whoever didn't start the last one starts the next. Nothing happens until the board is seen.

type Words = { thinking: string; yourMove: string; aiWon: string; youWon: string; draw: string; cell: string; x: string; o: string; empty: string }
type Point = [number, number]
type Frame = { line: [Point, Point] } | { arc: [number, number, number, number, number] } | null
type Pen = { color: string; width: number; cap: CanvasLineCap }

// sizes are for a 200px board (the original's), scaled to the real one. The board's see-through lines
// get flat ends: drawn in short strokes, round ends would overlap and dot them.
const PEN: Record<'board' | 'piece' | 'win', Pen> = {
  board: { color: 'rgb(236 231 223 / 0.32)', width: 2, cap: 'butt' },
  piece: { color: '#ece7df', width: 4, cap: 'round' },
  win: { color: '#e8b86a', width: 8, cap: 'round' },
}

/** The original's getPercentages: 0, step, 2·step… and always 100 at the end. */
function percentages(step: number) {
  let list = [0]
  while (list[list.length - 1] + step < 100) list.push(list[list.length - 1] + step)
  return [...list, 100]
}

const along = (from: Point, to: Point, percent: number): Point => [from[0] + (to[0] - from[0]) * (percent / 100), from[1] + (to[1] - from[1]) * (percent / 100)]

/** A line in short strokes, then `delay` empty frames. */
function lineFrames(from: Point, to: Point, step: number, delay = 0): Frame[] {
  let points = percentages(step).map((p) => along(from, to, p))
  return [...points.slice(1).map((p, i): Frame => ({ line: [points[i], p] })), ...Array<Frame>(delay).fill(null)]
}

/** A circle in growing arcs. */
function arcFrames(x: number, y: number, r: number, step: number): Frame[] {
  let frames: Frame[] = []
  let start = 0
  for (let i = step; i < 100; i += step) {
    let end = (i * 2 * Math.PI) / 100
    frames.push({ arc: [x, y, r, start, end] })
    start = end
  }
  frames.push({ arc: [x, y, r, start, 2 * Math.PI] })
  return frames
}

export const TicTacToe = clientEntry(import.meta.url, function TicTacToe(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal
    let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    for (let root of document.querySelectorAll<HTMLElement>('[data-ttt]')) setUp(root)

    function setUp(root: HTMLElement) {
      let words = JSON.parse(root.dataset.words ?? '{}') as Words
      let canvas = root.querySelector('canvas')!
      let ctx = canvas.getContext('2d')!
      let cells = [...root.querySelectorAll<HTMLButtonElement>('[data-ttt-cell]')]
      let status = root.querySelector<HTMLElement>('[data-ttt-status]')!
      let human = root.querySelector<HTMLElement>('[data-ttt-human]')!
      let ai = root.querySelector<HTMLElement>('[data-ttt-ai]')!

      let net = new Network()
      let game = getInitialGame()
      let size = 0
      let drawing = 0 // bumps on every redraw, so an old animation stops
      let round = 0 // bumps on every new game, so a timer from the last one does nothing
      let timers: ReturnType<typeof setTimeout>[] = []
      signal.addEventListener('abort', () => timers.forEach(clearTimeout))
      let later = (ms: number, fn: () => void) => {
        let r = round
        timers.push(setTimeout(() => r === round && fn(), ms))
      }

      // ---------- drawing ----------

      function fit() {
        let dpr = devicePixelRatio || 1
        size = canvas.clientWidth
        canvas.width = Math.round(size * dpr)
        canvas.height = Math.round(size * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      let k = () => size / 200
      let third = () => size / 3
      let corner = (i: number): Point => [(i % 3) * third(), Math.floor(i / 3) * third()]

      function drawFrame(frame: Frame, pen: Pen) {
        if (!frame) return
        ctx.strokeStyle = pen.color
        ctx.lineWidth = pen.width * k()
        ctx.lineCap = pen.cap
        ctx.beginPath()
        if ('line' in frame) {
          ctx.moveTo(...frame.line[0])
          ctx.lineTo(...frame.line[1])
        } else ctx.arc(...frame.arc)
        ctx.stroke()
      }

      /** Play frames one per animation frame; all at once when motion is reduced or `now` is set. */
      function animate(frames: Frame[], pen: Pen, now = false) {
        if (reduced || now) return frames.forEach((f) => drawFrame(f, pen))
        let mine = drawing
        let n = 0
        let step = () => {
          if (mine !== drawing) return
          drawFrame(frames[n], pen)
          n += 1
          if (n < frames.length) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }

      let boardLines = (): [Point, Point][] => [
        [[third(), 0], [third(), size]],
        [[third() * 2, 0], [third() * 2, size]],
        [[0, third()], [size, third()]],
        [[0, third() * 2], [size, third() * 2]],
      ]

      function pieceFrames(i: number): Frame[] {
        let [x, y] = corner(i)
        let c = third()
        if (getPosition(game.board, i) === X) {
          return [
            ...lineFrames([x + c * 0.2, y + c * 0.2], [x + c * 0.8, y + c * 0.8], 15, 10),
            ...lineFrames([x + c * 0.2, y + c * 0.8], [x + c * 0.8, y + c * 0.2], 15, 10),
          ]
        }
        return arcFrames(x + c / 2, y + c / 2, 20 * k(), 5)
      }

      /** Edge to edge through the three winning squares, as the original drew it. */
      function winLine([a, , c]: number[]): [Point, Point] {
        let mid = (i: number): Point => [corner(i)[0] + third() / 2, corner(i)[1] + third() / 2]
        if (c - a === 2) return [[0, mid(a)[1]], [size, mid(a)[1]]] // a row
        if (c - a === 6) return [[mid(a)[0], 0], [mid(a)[0], size]] // a column
        if (a === 0) return [[0, 0], [size, size]]
        return [[0, size], [size, 0]]
      }

      function draw(animated: boolean) {
        drawing += 1
        ctx.clearRect(0, 0, size, size)
        let lines = boardLines().flatMap(([from, to]) => lineFrames(from, to, 10, 10))
        if (!game.started) return animate(lines, PEN.board, !animated)
        animate(lines, PEN.board, true)
        for (let i = 0; i < 9; i++) {
          if (getPosition(game.board, i) && i !== game.lastMove) animate(pieceFrames(i), PEN.piece, true)
        }
        if (game.lastMove !== null) animate(pieceFrames(game.lastMove), PEN.piece, !animated)
        let winners = game.winners
        if (winners) {
          let mine = drawing
          let line = () => mine === drawing && animate(lineFrames(...winLine(winners), 10), PEN.win, !animated)
          animated && !reduced ? setTimeout(line, 500) : line()
        }
      }

      // ---------- the words and the squares ----------

      function show() {
        human.textContent = String(game.score.human)
        ai.textContent = String(game.score.ai)
        let aiJustMoved = !game.isAiTurn
        status.textContent = game.ended
          ? game.winners ? (aiJustMoved ? words.aiWon : words.youWon) : words.draw
          : game.isAiTurn ? words.thinking : words.yourMove
        let yourTurn = !game.isAiTurn && !game.ended
        cells.forEach((cell, i) => {
          let p = getPosition(game.board, i)
          let label = words.cell.replace('{r}', String(Math.floor(i / 3) + 1)).replace('{c}', String((i % 3) + 1))
          cell.setAttribute('aria-label', `${label}: ${p === X ? words.x : p === O ? words.o : words.empty}`)
          cell.setAttribute('aria-disabled', String(!yourTurn || p !== 0))
        })
      }

      function update() {
        show()
        draw(true)
      }

      // ---------- the game ----------

      function newGame() {
        round += 1
        game = getInitialGame(game)
        update()
        later(2000, aiMoves)
      }

      function aiMoves() {
        if (!game.isAiTurn || game.ended) return
        let next = move(game, getAiMove(game, net))
        if (!next) return
        game = next
        update()
        if (game.ended) later(2000, newGame)
      }

      function play(index: number) {
        if (game.isAiTurn || game.ended) return
        let next = move(game, index)
        if (!next) return
        game = next
        update()
        later(game.ended ? 2000 : 1000, game.ended ? newGame : aiMoves)
      }

      cells.forEach((cell, i) => cell.addEventListener('click', () => play(i), { signal }))
      root.querySelector('[data-ttt-new]')?.addEventListener('click', newGame, { signal })

      let started = false
      fit()
      show()
      new ResizeObserver(() => {
        if (canvas.clientWidth === size) return
        fit()
        if (started) draw(false)
      }).observe(canvas)

      // the first game starts once half the board is on screen
      let seen = new IntersectionObserver((entries) => {
        if (started || !entries.some((e) => e.isIntersecting)) return
        started = true
        seen.disconnect()
        update()
        later(2000, aiMoves)
      }, { threshold: 0.5 })
      seen.observe(canvas)
      signal.addEventListener('abort', () => seen.disconnect())
    }
  })

  return () => <span hidden />
})
