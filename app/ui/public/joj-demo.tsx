import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

// Replays real exhibition games (public/data/joj-games.json) the way jumpoverjump.com's home page
// does: before each move the side to play weighs up to two other pieces and then the one it moves,
// lifting each and dotting every square it could land on; then the piece flies its route in arcs
// (a step 230 ms, a jump 320 ms), the piece it hops over ducks, each landing ripples, and the last
// route stays tinted. The caption line says what is happening. Boards only play while on screen.
type Sq = { x: number; y: number }
type Move = { from: Sq; path: Sq[] }
type Piece = { el: HTMLElement; x: number; y: number; white: boolean }

const STEP_MS = 230
const JUMP_MS = 320
const DIRS: Sq[] = [
  { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
  { x: -1, y: 0 }, { x: 1, y: 0 },
  { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 },
]
const key = (p: Sq) => p.y * 8 + p.x
const inside = (p: Sq) => p.x >= 0 && p.x < 8 && p.y >= 0 && p.y < 8
const isJump = (a: Sq, b: Sq) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) > 1

/** Every legal move for one piece: a step in any of 8 directions, or any chain of jumps. */
function movesFor(pieces: Piece[], from: Sq): Move[] {
  let occupied = new Set(pieces.filter((p) => p.x !== from.x || p.y !== from.y).map(key))
  let result: Move[] = []
  for (let d of DIRS) {
    let to = { x: from.x + d.x, y: from.y + d.y }
    if (inside(to) && !occupied.has(key(to))) result.push({ from, path: [to] })
  }
  let seen = new Set([key(from)])
  let queue = [{ at: from, path: [] as Sq[] }]
  for (let i = 0; i < queue.length; i++) {
    let node = queue[i]
    for (let d of DIRS) {
      let bridge = { x: node.at.x + d.x, y: node.at.y + d.y }
      let to = { x: node.at.x + d.x * 2, y: node.at.y + d.y * 2 }
      if (!inside(to) || !occupied.has(key(bridge)) || occupied.has(key(to)) || seen.has(key(to))) continue
      let path = [...node.path, to]
      seen.add(key(to))
      queue.push({ at: to, path })
      result.push({ from, path })
    }
  }
  return result
}

export const JojDemo = clientEntry(import.meta.url, function JojDemo(handle: Handle) {
  handle.queueTask(async () => {
    let signal = handle.signal
    let boards = [...document.querySelectorAll<HTMLElement>('[data-joj-demo]')]
    if (!boards.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let games: Move[][] = []
    try {
      let raw = (await (await fetch('/data/joj-games.json', { signal })).json()).games as number[][][]
      games = raw.map((game) =>
        game.map(([fx, fy, ...rest]) => ({
          from: { x: fx, y: fy },
          path: Array.from({ length: rest.length / 2 }, (_, i) => ({ x: rest[i * 2], y: rest[i * 2 + 1] })),
        })),
      )
    } catch {
      return
    }
    if (!games.length) return
    boards.forEach((board, i) => run(board, i % games.length))

    function run(board: HTMLElement, first: number) {
      let screen = board.closest<HTMLElement>('.jd-screen')
      let line = screen?.querySelector<HTMLElement>('.jd-line-text')
      let dot = screen?.querySelector<HTMLElement>('.jd-turn')
      let words = JSON.parse(screen?.dataset.lines ?? '{}') as Record<string, string>
      let say = (text: string, white: boolean) => {
        if (line) line.textContent = text
        dot?.classList.toggle('jd-turn-black', !white)
      }

      // pause while off screen or in a background tab
      let visible = false
      let wake: (() => void) | null = null
      let watcher = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        if (visible && wake) wake()
      })
      watcher.observe(board)
      signal.addEventListener('abort', () => watcher.disconnect())
      let sleep = (ms: number) =>
        new Promise<void>((resolve) => {
          let finish = () => {
            if (signal.aborted || (visible && !document.hidden)) return resolve()
            wake = () => { wake = null; resolve() }
          }
          setTimeout(finish, ms)
        })

      let squares = [...board.querySelectorAll<HTMLElement>('[data-sq]')]
      let pieces: Piece[] = [...board.querySelectorAll<HTMLElement>('.jd-piece')].map((el, i) => ({ el, x: i % 8, y: i < 8 ? 0 : 7, white: i >= 8 }))
      let at = (p: Sq) => pieces.find((q) => q.x === p.x && q.y === p.y)
      let place = (piece: Piece, p: Sq) => {
        piece.x = p.x
        piece.y = p.y
        piece.el.style.setProperty('--x', String(p.x))
        piece.el.style.setProperty('--y', String(p.y))
      }
      let clearDots = () => board.querySelectorAll('.jd-dot').forEach((d) => d.remove())
      let clearRoute = () => squares.forEach((s) => delete s.dataset.route)

      function select(piece: Piece | null) {
        pieces.forEach((p) => p.el.classList.toggle('jd-active', p === piece))
        clearDots()
        if (!piece) return
        movesFor(pieces, piece).forEach((m, i) => {
          let end = m.path[m.path.length - 1]
          let mark = document.createElement('i')
          mark.className = 'jd-dot'
          mark.style.setProperty('--delay', `${i * 35}ms`)
          squares[key(end)]?.append(mark)
        })
      }

      async function fly(piece: Piece, move: Move) {
        let points = [move.from, ...move.path]
        let starts: number[] = []
        let t = 0
        for (let i = 1; i < points.length; i++) {
          starts.push(t)
          t += isJump(points[i - 1], points[i]) ? JUMP_MS : STEP_MS
        }
        let settle = 160
        let total = t + settle
        // keyframes in board percentages: cell = 12.5%, the piece sits 1.25% into its cell
        let frames: Keyframe[] = []
        let pos = (x: number, y: number) => ({ left: `${x * 12.5 + 1.25}%`, top: `${y * 12.5 + 1.25}%` })
        for (let i = 0; i < points.length - 1; i++) {
          let a = points[i]
          let b = points[i + 1]
          let jump = isJump(a, b)
          let duration = jump ? JUMP_MS : STEP_MS
          let rise = jump ? 0.55 + Math.min(i, 5) * 0.05 : 0.22
          for (let k = i ? 1 : 0; k <= 16; k++) {
            let u = k / 16
            let e = u * u * (3 - 2 * u)
            let arc = Math.sin(Math.PI * u)
            frames.push({
              offset: (starts[i] + duration * u) / total,
              ...pos(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e - arc * rise),
              transform: `scale(${1 + arc * 0.14 - (k === 0 ? 0.05 : 0)})`,
              filter: `drop-shadow(0 ${(arc * 2.4).toFixed(2)}cqmin ${(arc * 2).toFixed(2)}cqmin rgb(0 0 0 / ${0.5 - arc * 0.15}))`,
            })
          }
          // the piece hopped over ducks, the landing square ripples
          if (jump) {
            let bridge = at({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
            bridge?.el.animate([{ transform: 'none' }, { transform: 'scale(0.9)' }, { transform: 'none' }], { duration: duration * 0.55, delay: starts[i] + duration * 0.22 })
          }
          let ripple = document.createElement('i')
          ripple.className = 'jd-ripple'
          squares[key(b)]?.append(ripple)
          let last = i === points.length - 2
          ripple
            .animate(
              [
                { opacity: 0, transform: 'scale(0.9)' },
                { opacity: last ? 1 : 0.6, transform: 'scale(1)', offset: 0.12 },
                { opacity: 0, transform: `scale(${last ? 1.55 : 1.35})` },
              ],
              { duration: 620, delay: starts[i] + duration * 0.9, easing: 'ease-out' },
            )
            .finished.then(() => ripple.remove(), () => ripple.remove())
        }
        let end = points[points.length - 1]
        frames.push({ offset: (t + settle * 0.35) / total, ...pos(end.x, end.y), transform: 'scale(0.94)' })
        frames.push({ offset: (t + settle * 0.7) / total, ...pos(end.x, end.y), transform: 'scale(1.015)' })
        frames.push({ offset: 1, ...pos(end.x, end.y), transform: 'none' })
        piece.el.classList.add('jd-flying')
        let flight = piece.el.animate(frames, { duration: total, easing: 'linear' })
        await flight.finished.catch(() => {})
        place(piece, end)
        flight.cancel()
        piece.el.classList.remove('jd-flying')
        // the route stays tinted until the next piece is chosen
        clearRoute()
        squares[key(move.from)].dataset.route = 'start'
        move.path.forEach((p, i) => (squares[key(p)].dataset.route = i === move.path.length - 1 ? 'end' : 'hop'))
      }

      ;(async () => {
        let g = first
        while (!signal.aborted) {
          pieces.forEach((p, i) => place(p, { x: i % 8, y: i < 8 ? 0 : 7 }))
          select(null)
          clearRoute()
          say(words.goal ?? '', true)
          await sleep(1400)
          let white = true
          for (let ply = 0; ply < games[g].length && !signal.aborted; ply++) {
            let move = games[g][ply]
            let piece = at(move.from)
            if (!piece) break
            // weigh 0-2 other pieces first, then the one that moves (same rhythm as the site)
            let others: Sq[] = []
            for (let p of pieces) {
              if (p.white !== white || (p.x === move.from.x && p.y === move.from.y)) continue
              if (movesFor(pieces, p).length) others.push({ x: p.x, y: p.y })
            }
            let count = Math.min((ply + 1) % 3, others.length)
            let offset = (ply * 5 + g) % (others.length || 1)
            let candidates = [...Array.from({ length: count }, (_, i) => others[(offset + i) % others.length]), move.from]
            await sleep(450)
            for (let i = 0; i < candidates.length; i++) {
              clearRoute()
              select(at(candidates[i]) ?? null)
              say(white ? words.weighWhite : words.weighBlack, white)
              await sleep(i < candidates.length - 1 ? 700 : 950)
            }
            select(null)
            let jumps = [move.from, ...move.path].filter((p, i, all) => i > 0 && isJump(all[i - 1], p)).length
            say(jumps > 1 ? (words.chain ?? '').replace('{n}', String(jumps)) : jumps ? words.jump : words.leap, white)
            await fly(piece, move)
            await sleep(400)
            white = !white
          }
          say(white ? words.blackWins : words.whiteWins, !white)
          await sleep(2600)
          g = (g + 1) % games.length
        }
      })()
    }
  })

  return () => <span hidden />
})
