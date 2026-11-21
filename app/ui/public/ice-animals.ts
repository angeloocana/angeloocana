// What swims under the ice (ice-gl.ts): now and then a dark shape passes under the sheet, seen only where
// someone has melted it. A pike, a trout or an otter mostly; a seal now and then; a beaver very rarely.
// At most one at a time, about one a minute of someone using the page, and never before they have: the
// next one comes due only on real input (a pointer or a finger melting), counted in the ice's own time,
// which stands still while nothing moves, the tab is hidden or the motion is off.
//
// The logic (which one, when, along which path) is plain functions, tested in ice-animals.test.ts; the
// silhouettes are drawn, seen from above with the head to the right, into a tiny canvas the shader samples
// in a small box around the animal: R its soft body, G a wider halo of the water it moves.

export type Kind = 'pike' | 'trout' | 'otter' | 'beaver' | 'seal'
export type Point = [number, number]

// how often each comes (weights), how long it is and how fast it swims (CSS px), and how it moves: the
// sideways wave along its body (in half-widths of its box, strongest at the tail) and its beat (per second)
export const SPECIES: Record<Kind, { weight: number; length: number; speed: number; wave: number; beat: number }> = {
  pike: { weight: 0.3, length: 190, speed: 46, wave: 0.12, beat: 0.6 },
  trout: { weight: 0.3, length: 120, speed: 62, wave: 0.2, beat: 1.1 },
  otter: { weight: 0.3, length: 150, speed: 70, wave: 0.18, beat: 0.8 },
  seal: { weight: 0.07, length: 190, speed: 52, wave: 0.14, beat: 0.4 },
  beaver: { weight: 0.03, length: 130, speed: 34, wave: 0.08, beat: 0.5 },
}
export const KINDS = Object.keys(SPECIES) as Kind[]
export const isKind = (s: string | null): s is Kind => !!s && s in SPECIES

// seconds of use between two, and how long one takes to pass
export const DELAY: Point = [45, 75]
export const SWIM = 11
export const RETRY = 5 // due, but no thick ice near the pointer to pass under: try again this much later

// a seeded random number generator (mulberry32), so a test or a review link sees the same thing each time
export function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

export function pick(rng: () => number): Kind {
  let r = rng()
  for (let kind of KINDS) if ((r -= SPECIES[kind].weight) < 0) return kind
  return 'pike'
}

export let delay = (rng: () => number) => DELAY[0] + (DELAY[1] - DELAY[0]) * rng()

// When the next one is due, from real input only. The first input sets the clock (nothing comes before
// someone has used the page for a while); input once it is due says yes and sets the next one.
export function schedule(rng: () => number) {
  let due = -1
  return {
    input(t: number) {
      if (due < 0) { due = t + delay(rng); return false }
      if (t < due) return false
      due = t + delay(rng)
      return true
    },
    retry(t: number) { due = t + RETRY },
    // the motion went off or the tab was hidden: start over (nothing the moment someone comes back)
    reset() { due = -1 },
  }
}

// A path past the pointer: a gentle curve (a quadratic Bézier) through somewhere near it, mostly across
// the screen, kept where the ice is thickest close to the pointer, so a melt there shows it. Null when no
// candidate passes under thick ice.
export function plan(rng: () => number, near: Point, distance: number, thickness: (x: number, y: number) => number): [Point, Point, Point] | null {
  let best: [Point, Point, Point] | null = null, top = 0
  for (let n = 0; n < 12; n++) {
    let a = (rng() - 0.5) * 1.1 + (rng() < 0.5 ? 0 : Math.PI)
    let dx = Math.cos(a), dy = Math.sin(a)
    let mx = near[0] + (rng() - 0.5) * 160, my = near[1] + (rng() - 0.5) * 160
    let bend = (rng() - 0.5) * distance * 0.3
    let path: [Point, Point, Point] = [
      [mx - (dx * distance) / 2, my - (dy * distance) / 2],
      [mx - dy * bend, my + dx * bend],
      [mx + (dx * distance) / 2, my + (dy * distance) / 2],
    ]
    let score = 0
    for (let i = 0; i <= 16; i++) {
      let [x, y] = along(path, i / 16)[0]
      score += thickness(x, y) * Math.exp(-Math.hypot(x - near[0], y - near[1]) / 180)
    }
    if (score > top) { top = score; best = path }
  }
  return top > 1 ? best : null
}

// where along its path it is (u from 0 to 1), and which way it faces
export function along([a, b, c]: [Point, Point, Point], u: number): [Point, Point] {
  let v = 1 - u
  let x = v * v * a[0] + 2 * v * u * b[0] + u * u * c[0], y = v * v * a[1] + 2 * v * u * b[1] + u * u * c[1]
  let tx = v * (b[0] - a[0]) + u * (c[0] - b[0]), ty = v * (b[1] - a[1]) + u * (c[1] - b[1])
  let d = Math.hypot(tx, ty) || 1
  return [[x, y], [tx / d, ty / d]]
}

// The silhouettes, in a TW × TH box with the body across its middle 80% (the shader's box is that much
// longer than the animal). Each body is a width profile along its length (0 the tail, 1 the nose).
export const TW = 160, TH = 64
type Profile = [number, number][]
const X0 = TW * 0.1, LEN = TW * 0.8, CY = TH / 2
let px = (f: number) => X0 + f * LEN

function outline(ctx: CanvasRenderingContext2D, profile: Profile) {
  let pts: Point[] = [...profile.map(([f, w]): Point => [px(f), CY - w]), ...profile.toReversed().map(([f, w]): Point => [px(f), CY + w])]
  ctx.moveTo((pts[0][0] + pts.at(-1)![0]) / 2, (pts[0][1] + pts.at(-1)![1]) / 2)
  for (let i = 0; i < pts.length; i++) {
    let p = pts[i], q = pts[(i + 1) % pts.length]
    ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
  }
  ctx.closePath()
}
let oval = (ctx: CanvasRenderingContext2D, f: number, dy: number, rx: number, ry: number, rot = 0) => {
  ctx.moveTo(px(f) + rx * Math.cos(rot), CY + dy + rx * Math.sin(rot))
  ctx.ellipse(px(f), CY + dy, rx, ry, rot, 0, Math.PI * 2)
}
// a fish's tail, from where it joins the body (f, half-width w) out to the fork (spread, notched to n)
let tail = (ctx: CanvasRenderingContext2D, f: number, w: number, spread: number, n: number) => {
  // (clockwise on the screen, like every other part, so where parts overlap the fill never cancels out)
  ctx.moveTo(px(f), CY + w)
  ctx.lineTo(px(0), CY + spread)
  ctx.lineTo(px(n), CY)
  ctx.lineTo(px(0), CY - spread)
  ctx.lineTo(px(f), CY - w)
  ctx.closePath()
}
// a pair of fins or limbs, swept back
let pair = (ctx: CanvasRenderingContext2D, f: number, out: number, rx: number, ry: number, sweep: number) => {
  oval(ctx, f, -out, rx, ry, -sweep)
  oval(ctx, f, out, rx, ry, sweep)
}

const SHAPES: Record<Kind, (ctx: CanvasRenderingContext2D) => void> = {
  // long and narrow, the fins far back, a flat duck-bill snout
  pike(ctx) {
    outline(ctx, [[0.1, 1.2], [0.2, 3], [0.38, 5.5], [0.6, 6.5], [0.78, 6], [0.9, 4.6], [0.97, 3], [1, 1.6]])
    tail(ctx, 0.13, 1.5, 7, 0.05)
    pair(ctx, 0.3, 6, 6, 1.8, 0.5)
    pair(ctx, 0.72, 6.5, 6, 2, 0.6)
  },
  // a spindle, a square tail and pectoral fins splayed out
  trout(ctx) {
    outline(ctx, [[0.14, 1.6], [0.28, 5.5], [0.48, 9], [0.68, 9.5], [0.86, 7], [0.96, 4], [1, 2]])
    tail(ctx, 0.17, 2, 10, 0.03)
    pair(ctx, 0.74, 9, 8, 2.6, 0.7)
    pair(ctx, 0.38, 6, 6, 2, 0.6)
  },
  // a long body, a thick tail tapering to a point, small paws tucked back and a round head
  otter(ctx) {
    outline(ctx, [[0, 0.6], [0.14, 2.6], [0.32, 5], [0.42, 8.5], [0.62, 9.5], [0.8, 7.5], [0.86, 6], [0.92, 7.2], [0.98, 5], [1, 2.4]])
    pair(ctx, 0.44, 9, 6, 2.6, 0.8)
    pair(ctx, 0.76, 8, 5, 2.2, 0.9)
  },
  // a heavy body, a flat paddle of a tail, webbed hind feet and a small head
  beaver(ctx) {
    outline(ctx, [[0.28, 3], [0.36, 11], [0.55, 15], [0.74, 13], [0.85, 8], [0.9, 8.5], [0.98, 6], [1, 3]])
    oval(ctx, 0.14, 0, 13, 8.5)
    pair(ctx, 0.36, 13, 7, 4, 0.6)
    pair(ctx, 0.78, 11, 3.5, 2.2, 0.8)
  },
  // a plump torpedo, fore-flippers and the hind flippers held together in a V
  seal(ctx) {
    outline(ctx, [[0.12, 2], [0.24, 7.5], [0.44, 13], [0.64, 14], [0.84, 10.5], [0.95, 7], [1, 3.4]])
    pair(ctx, 0.62, 14, 9, 3, 0.7)
    oval(ctx, 0.05, -4, 9, 3.5, -0.35)
    oval(ctx, 0.05, 4, 9, 3.5, 0.35)
  },
}

// Each shape is drawn twice as a shadow only (the shape itself off the canvas): once blurred wide in green,
// the water around it, then softly in red, the body, added. An opaque black canvas, so no alpha to undo.
export function drawAnimal(canvas: HTMLCanvasElement, kind: Kind) {
  canvas.width = TW
  canvas.height = TH
  let ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, TW, TH)
  ctx.globalCompositeOperation = 'lighter'
  ctx.shadowOffsetX = TW * 4
  for (let [color, blur] of [['#0f0', 9], ['#f00', 2.5]] as const) {
    ctx.shadowColor = color
    ctx.shadowBlur = blur
    ctx.beginPath()
    ctx.save()
    ctx.translate(-TW * 4, 0)
    SHAPES[kind](ctx)
    ctx.restore()
    ctx.fillStyle = '#fff'
    ctx.fill('nonzero')
  }
}
