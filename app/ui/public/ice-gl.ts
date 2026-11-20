// A sheet of river ice over the whole home page, in plain WebGL (no library). ice.tsx imports this once the
// page has loaded and gone idle. The sheet is fixed to the screen and the page scrolls under it. The
// pointer (or a swiping finger) melts clear holes with a wet rim, which freeze back over about 4 s; a click
// on bare ice cracks it; a card under the pointer or the keyboard focus stays melted.
//
// How thick the ice is comes from the page itself (layout()): clear over every line of text and every card,
// a glaze inside the hero's tiles and over the clips, frost along the screen's edges and in the gaps
// between sections, so the words are always readable and the frost frames the work instead of covering
// it. The boxes it follows are measured once (measure(), again only when the page changes size) and moved
// with the page's scroll and each row's sideways scroll, so a frame never asks the browser for layout.
// Scrolling into a new section, the frost creeps in from the edges and settles.
//
// Two passes: the sheet's grain (frost, the crack network, the surface's tilt for the light) is drawn once
// per size into a texture; each frame lays it over the page with the melt map, the light and fresh cracks.
// Frames stop while the tab is hidden, drop to 12 a second when nothing moves, and stop altogether while
// the page's motion is off (html.is-paused: reduced motion, data saver or the pause button), which leaves
// one still frame of frost along the screen's edges.

const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'

const NOISE = `
precision highp float;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 hash2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }`

// the grain, in CSS pixels (S is the pixel ratio): R frost, G the cracks between plates and trapped
// bubbles, BA the surface's tilt for the light
const BASE = `${NOISE}
uniform float S;
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a*noise(p); p = p*2.03 + 1.7; a *= .5; } return s; }
float vor(vec2 x){ vec2 i = floor(x), f = fract(x), mr; float md = 8.;
  for (int y = -1; y <= 1; y++) for (int k = -1; k <= 1; k++){ vec2 g = vec2(k, y), r = g + hash2(i + g) - f; float d = dot(r, r); if (d < md){ md = d; mr = r; } }
  md = 8.;
  for (int y = -1; y <= 1; y++) for (int k = -1; k <= 1; k++){ vec2 g = vec2(k, y), r = g + hash2(i + g) - f; if (dot(mr - r, mr - r) > .00001) md = min(md, dot(.5*(mr + r), normalize(r - mr))); }
  return md; }
float height(vec2 p){ return fbm(p*2. + 9.); }
void main(){
  vec2 p = gl_FragCoord.xy / S / 260.;
  float w = fbm(p*1.3);
  float f = fbm(p*3.5 + w*1.8);
  float ridge = 1. - abs(2.*fbm(p*7. + w*2.5 + 3.) - 1.);
  float fine = fbm(p*28. + w);
  float frost = clamp(f*.8 + pow(ridge, 10.)*.35 + (fine - .5)*.3 - .1, 0., 1.);
  float cr = max(1. - smoothstep(0., .022, vor(p*2.2 + w*.5)), .5*(1. - smoothstep(0., .018, vor(p*6. + 4. + w*.3))));
  vec2 g = p*40.; float bh = hash(floor(g));
  float bub = step(.975, bh)*(1. - smoothstep(.1, .28, length(fract(g) - .5)));
  float e = .004, h = height(p);
  vec2 tilt = vec2(height(p + vec2(e, 0)) - h, height(p + vec2(0, e)) - h) / e * .06;
  gl_FragColor = vec4(frost, max(cr, bub), clamp(tilt*.5 + .5, 0., 1.));
}`

// one frame: B the grain, L the thickness map, M the melt map; P the light (CSS px, y up), C the last
// cracks (x, y, when), A how far the sheet has frozen in, E how far a section's frost has crept in (1:
// settled), T the time
const ICE = `${NOISE}
uniform sampler2D B, L, M;
uniform vec2 R, P;
uniform float S, T, A, E;
uniform vec3 C[4];
// rays out of a point: N sectors, each with one straight, slightly kinked ray of its own length
float rays(vec2 d, float r, float N, float seed, float len, float wd){
  float an = atan(d.y, d.x)/6.2832*N + seed;
  float i = floor(an + .5);
  float th = (i + (hash(vec2(i, seed)) - .5)*.6 - seed)*6.2832/N + .05*sin(r*.06 + i*3.);
  float dist = abs(sin(atan(d.y, d.x) - th))*r;
  float l = len*(.45 + .55*hash(vec2(seed, i)));
  return (1. - smoothstep(0., wd, dist))*(1. - smoothstep(l*.7, l, r));
}
// a crack: a bright point of impact, long rays, shorter branches between them further out, broken rings
float crack(vec2 c, vec3 k){
  float age = T - k.z;
  if (age < 0. || age > 9.) return 0.;
  vec2 d = c - k.xy; float r = length(d) + .001, an = atan(d.y, d.x);
  float wd = mix(1.5, .6, min(r/240., 1.));
  float v = rays(d, r, 7., k.x*.013, 240., wd);
  v += rays(d, r, 15., k.y*.017 + .3, 150., wd*.8)*smoothstep(25., 60., r)*.8;
  float ring1 = (1. - smoothstep(0., .9, abs(r - 30. - 6.*noise(vec2(an*3., k.x)))))*step(.45, noise(vec2(an*4., k.y)));
  float ring2 = (1. - smoothstep(0., .8, abs(r - 78. - 12.*noise(vec2(an*2., k.y)))))*step(.6, noise(vec2(an*6., k.x + 5.)))*.7;
  v += ring1 + ring2;
  float reach = 250.*(1. - exp(-age*9.));
  return clamp(v, 0., 1.)*step(r, reach)*(1. - smoothstep(3., 9., age));
}
void main(){
  vec2 q = gl_FragCoord.xy / R, uv = vec2(q.x, 1. - q.y), c = gl_FragCoord.xy / S;
  vec4 b = texture2D(B, q);
  float l = texture2D(L, uv).r, m = texture2D(M, uv).r;
  vec3 n = normalize(vec3(b.zw*2. - 1., 1.));
  // into a new section: a front of frost creeps in from the screen's edges and settles. It only thickens
  // ice that is there (never over the words), and fades as it settles, so nothing flashes.
  float ed = min(min(c.x, R.x/S - c.x), min(c.y, R.y/S - c.y));
  float front = 30. + 230.*(1. - pow(1. - E, 3.));
  float wave = (1. - smoothstep(front - 110., front, ed + (b.x - .5)*90.))*(1. - E);
  l = min(1., l*(1. + 1.3*wave));
  // frost reaches in from the thick edges, and creeps a little back and forth while nobody touches it
  float creep = .05*sin(T*.09 + b.x*6.);
  float fr = smoothstep(.3, .78, l + (b.x - .5)*.5 + creep);
  float ice = smoothstep(.02, .2, l);
  float a = ice*.04 + fr*(.1 + .45*b.x) + b.y*ice*(.03 + .12*l);
  vec3 col = mix(vec3(.5, .63, .74), vec3(.86, .93, .98), b.x*fr);
  // a breath: faint fog drifting over the sheet
  float fog = noise(c*.003 + vec2(T*.015, T*.006));
  a += fog*fog*.05*ice;
  // the light: the pointer's warmth, or a slow drift when it is away
  vec3 H = normalize(normalize(vec3(P - c, 300.)) + vec3(0, 0, 1));
  float sp = pow(max(dot(n, H), 0.), 40.)*(.2 + .8*exp(-length(c - P)/280.));
  col += sp*.6; a += sp*.25*ice;
  // the melt: a clear hole, a bright wet rim and a shadow just inside it; the noisy edge refreezes in crystals
  float mt = m + (b.x - .5)*.3;
  float hole = smoothstep(.3, .5, mt);
  float rim = smoothstep(.16, .3, mt)*(1. - smoothstep(.3, .44, mt));
  float dark = smoothstep(.44, .5, mt)*(1. - smoothstep(.5, .66, mt))*.2*(.3 + l);
  a *= 1. - hole;
  col = mix(col, vec3(.85, .97, 1.), rim);
  a = max(a, rim*(.16 + .32*l));
  float wet = hole*pow(max(dot(normalize(vec3((b.zw - .5)*.4, 1.)), H), 0.), 90.)*.35;
  col += wet; a += wet*.3;
  // cracks with depth: a dark cut, lit on the side toward the light
  float k = 0., hi = 0., pw = 0.;
  for (int i = 0; i < 4; i++){
    float k0 = crack(c, C[i]);
    k += k0; hi += max(crack(c + vec2(-1.3, 1.3), C[i]) - k0, 0.);
    float age = T - C[i].z;
    if (age > 0. && age < 9.) pw += exp(-length(c - C[i].xy)/16.)*(1. - smoothstep(1., 9., age));
  }
  float body = (.2 + .8*smoothstep(.05, .4, l))*(1. - hole*.7);
  dark += min(k, 1.)*.5*body;
  col += (hi + pw)*.9; a += (min(hi, 1.)*.6 + pw*.5)*body;
  // freezing in from the thick edges, a glint running along the front
  float g = A*1.5 - (1. - l)*.9 - (1. - b.x)*.35;
  col += (smoothstep(0., .05, g) - smoothstep(.05, .2, g))*.6;
  // ...and along the creeping front
  float fg = (1. - smoothstep(0., 14., abs(ed + (b.x - .5)*90. - front)))*(1. - E)*smoothstep(.15, .4, l);
  col += fg*.5; a += fg*.12;
  float gz = smoothstep(0., .1, g);
  a = clamp(a*gz, 0., .9); dark = clamp(dark, 0., .6)*gz;
  gl_FragColor = vec4(min(col, 1.)*a*(1. - dark), a + dark*(1. - a));
}`

const MELT = 6 // CSS px per cell of the melt map
const LAYOUT = 8 // ...and of the thickness map
// where the frost frames the work: the hero's tiles (each half of the split Projects tile) and every card
const PANES = '.hero-tiles > .tile, .brand, .slide'
// what stays clear, outside the cards: every line of text and every control
const WORDS = '.hi-kicker, .hero-role, .hero-proof, .hero-ctas > *, .tile-kicker, .tile-title, .tile-meta, .tile-label, .tile-projects, .tile-line, .tile-foot, .tile-body, .brand-link, .tile-pause, .row-head, .rail-bar > *, .row-down, .career-more a, .career-less a, .clip-copy, .clip-ig, .cin-foot > *'
// what stays melted while the pointer or the keyboard focus is on it
const HELD = '.tile-career, .tile-life, .brand, .slide'
// the sections, each with how thick the ice lies in its gaps: the Outside work row (ice swimming) the thickest
const SECTIONS = '.hero, .row, .cin-foot'
const GAP = 0.24
const GAPS: Record<string, number> = { outside: 0.44 }
// the glaze inside a card: thin over the hero's tiles, a real sheet over the clips (they stay in view)
const GLAZE = (el: Element) => (el.classList.contains('clip') ? 0.24 : el.classList.contains('slide') ? 0.03 : 0.06)

type Rect = [number, number, number, number]
// a box measured on the page (CSS px from its top left), as if its row had not scrolled sideways
type Box = { el: HTMLElement; l: number; t: number; r: number; b: number; track: Element | null; v: number }

export async function mountIce(canvas: HTMLCanvasElement, signal: AbortSignal) {
  let gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true })
  if (!gl) return false
  let g = gl
  let phone = matchMedia('(max-width: 760px)').matches
  let root = document.documentElement

  let compile = (src: string) => {
    let prog = g.createProgram()!
    for (let [type, code] of [[g.VERTEX_SHADER, VERT], [g.FRAGMENT_SHADER, src]] as const) {
      let s = g.createShader(type)!
      g.shaderSource(s, code)
      g.compileShader(s)
      g.attachShader(prog, s)
    }
    g.bindAttribLocation(prog, 0, 'a')
    g.linkProgram(prog)
    return prog
  }
  let programs = [compile(BASE), compile(ICE)]
  // A cold compile of these shaders takes a phone a good part of a second. Where the browser can compile
  // in the background, wait for it a frame at a time instead of blocking the page on the first question.
  let parallel = g.getExtension('KHR_parallel_shader_compile')
  if (parallel) {
    while (!programs.every((p) => g.getProgramParameter(p, parallel.COMPLETION_STATUS_KHR))) {
      await new Promise(requestAnimationFrame)
      if (signal.aborted) return false
    }
  }
  if (!programs.every((p) => g.getProgramParameter(p, g.LINK_STATUS))) return false
  let [base, ice] = programs
  let uniforms = (prog: WebGLProgram, names: string[]) => Object.fromEntries(names.map((k) => [k, g.getUniformLocation(prog, k)]))
  let ub = uniforms(base, ['S'])
  let u = uniforms(ice, ['B', 'L', 'M', 'R', 'P', 'S', 'T', 'A', 'E', 'C'])
  g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer())
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW)
  g.enableVertexAttribArray(0)
  g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0)
  g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA)
  g.pixelStorei(g.UNPACK_ALIGNMENT, 1)

  let texture = (unit: number) => {
    let tex = g.createTexture()!
    g.activeTexture(g.TEXTURE0 + unit)
    g.bindTexture(g.TEXTURE_2D, tex)
    for (let [k, v] of [[g.TEXTURE_MIN_FILTER, g.LINEAR], [g.TEXTURE_MAG_FILTER, g.LINEAR], [g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE], [g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE]]) g.texParameteri(g.TEXTURE_2D, k, v)
    return tex
  }
  let grainTex = texture(0)
  let layoutTex = texture(1)
  let meltTex = texture(2)
  let fbo = g.createFramebuffer()

  // sizes: the canvas covers the screen (its tallest, so the phone's toolbar coming and going never resizes
  // it) at a capped pixel ratio (1 on phones); the two maps in coarse cells
  let W = 0, H = 0, dpr = 1
  let mw = 0, mh = 0, melt = new Float32Array(0), spare = new Float32Array(0), meltBytes = new Uint8Array(0)
  let lw = 0, lh = 0, map = new Float32Array(0), tmp = new Float32Array(0), mapBytes = new Uint8Array(0)
  function size() {
    W = canvas.clientWidth
    H = canvas.clientHeight
    dpr = Math.min(devicePixelRatio, phone ? 1 : 1.5)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    mw = Math.ceil(W / MELT)
    mh = Math.ceil(H / MELT)
    melt = new Float32Array(mw * mh)
    spare = new Float32Array(mw * mh)
    meltBytes = new Uint8Array(mw * mh)
    lw = Math.ceil(W / LAYOUT)
    lh = Math.ceil(H / LAYOUT)
    map = new Float32Array(lw * lh)
    tmp = new Float32Array(lw * lh)
    mapBytes = new Uint8Array(lw * lh)
    // the grain, drawn once for this size
    g.activeTexture(g.TEXTURE0)
    g.bindTexture(g.TEXTURE_2D, grainTex)
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, canvas.width, canvas.height, 0, g.RGBA, g.UNSIGNED_BYTE, null)
    g.bindFramebuffer(g.FRAMEBUFFER, fbo)
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, grainTex, 0)
    g.viewport(0, 0, canvas.width, canvas.height)
    g.useProgram(base)
    g.uniform1f(ub.S, dpr)
    g.disable(g.BLEND)
    g.drawArrays(g.TRIANGLES, 0, 3)
    g.bindFramebuffer(g.FRAMEBUFFER, null)
    g.enable(g.BLEND)
    dirty = true
  }

  // Where things are on the page, measured once (and again only when the page changes size or a row gets
  // new cards), from the layout alone: offsetLeft/Top ignore the cards' entry animation and the rows'
  // sideways scroll. While the page scrolls, each box only moves by the page's scroll and its row's.
  let panes: Box[] = [], words: Box[] = [], sections: (Box & { id: string })[] = []
  let byEl = new Map<Element, Box>()
  let offs = new Map<Element, number>() // each row's sideways scroll, from its scroll events
  let sy = scrollY, navH = 0
  let box = (el: HTMLElement, v = 0): Box | null => {
    if (!el.offsetParent || !el.offsetWidth) return null
    let x = 0, y = 0
    for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) { x += e.offsetLeft; y += e.offsetTop }
    let track = el.closest('[data-rail-track]')
    return { el, l: x, t: y, r: x + el.offsetWidth, b: y + el.offsetHeight, track, v }
  }
  let all = (sel: string, v?: (el: Element) => number) => [...document.querySelectorAll<HTMLElement>(sel)].map((el) => box(el, v?.(el))).filter((b) => b !== null)
  function measure() {
    for (let track of document.querySelectorAll('[data-rail-track]')) offs.set(track, track.scrollLeft)
    sy = scrollY
    navH = document.querySelector<HTMLElement>('.cin-nav')?.offsetHeight ?? 0
    panes = all(PANES, GLAZE)
    words = all(WORDS)
    sections = all(SECTIONS, (el) => GAPS[el.id] ?? GAP).map((b) => ({ ...b, id: b.el.id }))
    byEl = new Map(panes.map((b) => [b.el, b]))
    remeasure = false
    dirty = true
  }
  // a box where it is on the screen now
  let shift = (b: Box) => (b.track ? offs.get(b.track) ?? 0 : 0)
  let view = (b: Box): Rect => { let x = shift(b); return [b.l - x, b.t - sy, b.r - x, b.b - sy] }
  let rect = (el: Element): Rect => { let b = byEl.get(el); return b ? view(b) : [0, 0, 0, 0] }

  // the thickness map, in screen cells: a sheet over the gaps (thicker over the Outside work row), thick
  // frost at the screen's edges, a glaze in each card with frost along its edges; softened, then cleared
  // over every line of text, every control and each card in view. While the motion is off: only a thin
  // frost at the screen's edges, which nothing on the page can come under.
  let lastSy = 0, lastOffs = new Map<Element, number>()
  function layout() {
    dirty = false
    let fade = (y: number) => Math.min(1, Math.max(0, (y - navH + 16) / 40))
    if (still) {
      let k = phone ? 12 : 22
      for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
        let x = (i + 0.5) * LAYOUT, y = (j + 0.5) * LAYOUT
        map[j * lw + i] = 0.95 * Math.exp(-Math.max(0, Math.min(x, W - x, y - navH, H - y)) / k) * fade(y)
      }
      return upload()
    }
    let near = ([l, t, r, b]: Rect, pad = 0) => r > -pad && l < W + pad && b > -pad && t < H + pad
    let gap = new Float32Array(lh).fill(GAP)
    for (let s of sections) {
      let [, t, , b] = view(s)
      for (let j = Math.max(0, Math.floor(t / LAYOUT)); j < Math.min(lh, Math.ceil(b / LAYOUT)); j++) gap[j] = s.v
    }
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      let x = (i + 0.5) * LAYOUT, y = (j + 0.5) * LAYOUT
      // like frost on a window: thickest at the screen's edges and corners; under the menu it fades out
      let edge = Math.max(0, Math.min(x, W - x, y - navH, H - y))
      map[j * lw + i] = Math.min(1, gap[j] + 0.6 * Math.exp(-edge / 60)) * fade(y)
    }
    let cells = ([l, t, r, b]: Rect, pad: number, fn: (k: number, x: number, y: number) => void) => {
      for (let j = Math.max(0, Math.floor((t - pad) / LAYOUT)); j < Math.min(lh, Math.ceil((b + pad) / LAYOUT)); j++)
        for (let i = Math.max(0, Math.floor((l - pad) / LAYOUT)); i < Math.min(lw, Math.ceil((r + pad) / LAYOUT)); i++) fn(j * lw + i, (i + 0.5) * LAYOUT, (j + 0.5) * LAYOUT)
    }
    let shown: [Box, Rect][] = []
    for (let p of panes) {
      let v = view(p)
      if (!near(v, 80)) continue
      shown.push([p, v])
      let [l, t, r, b] = v
      cells(v, 0, (k, x, y) => { if (x > l && x < r && y > t && y < b) map[k] = p.v + 0.6 * Math.exp(-Math.min(x - l, r - x, y - t, b - y) / 12) })
    }
    blur(2)
    blur(2)
    // A box scrolling fast is cleared a little wider, on all sides, so the words never slip under the frost
    // between a scroll and the next frame.
    let slack = (b: Box) => Math.min(64, 2 * Math.max(Math.abs(sy - lastSy), Math.abs(shift(b) - (b.track ? lastOffs.get(b.track) ?? 0 : 0))))
    let clear = ([l, t, r, b]: Rect, inset: number, reach: number, strength: number) => {
      if (strength <= 0) return
      l += inset; t += inset; r -= inset; b -= inset
      cells([l, t, r, b], reach + 8, (k, x, y) => {
        let f = Math.min(1, Math.max(0, (Math.hypot(Math.max(l - x, 0, x - r), Math.max(t - y, 0, y - b)) - 4) / reach))
        map[k] *= 1 - strength * (1 - f * f * (3 - 2 * f))
      })
    }
    let grow = ([l, t, r, b]: Rect, s: number): Rect => [l - s, t - s, r + s, b + s]
    for (let w of words) {
      let v = view(w)
      if (near(v, 60) && w.r - w.l > 1) clear(grow(v, slack(w)), 0, 52, 1)
    }
    // each card in view clears inside its frosted edge, the ones peeking in at the screen's sides too
    for (let [p, v] of shown) if (p.el.classList.contains('slide') && !p.el.classList.contains('clip')) clear(grow(v, slack(p)), 18, 30, 1)
    lastSy = sy
    lastOffs = new Map(offs)
    upload()
  }
  function upload() {
    for (let k = 0; k < map.length; k++) mapBytes[k] = map[k] * 255
    g.activeTexture(g.TEXTURE1)
    g.bindTexture(g.TEXTURE_2D, layoutTex)
    g.texImage2D(g.TEXTURE_2D, 0, g.LUMINANCE, lw, lh, 0, g.LUMINANCE, g.UNSIGNED_BYTE, mapBytes)
  }
  function blur(r: number) {
    for (let pass = 0; pass < 2; pass++) {
      let [from, to] = pass ? [tmp, map] : [map, tmp]
      for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
        let s = 0, n = 0
        for (let k = -r; k <= r; k++) {
          let x = pass ? i : i + k, y = pass ? j + k : j
          if (x >= 0 && x < lw && y >= 0 && y < lh) { s += from[y * lw + x]; n++ }
        }
        to[j * lw + i] = s / n
      }
    }
  }

  // warmth, painted into the melt map
  let brush = (x: number, y: number, r: number, s: number) => {
    let cx = x / MELT, cy = y / MELT, cr = r / MELT
    for (let j = Math.max(0, Math.floor(cy - cr)); j < Math.min(mh, Math.ceil(cy + cr)); j++)
      for (let i = Math.max(0, Math.floor(cx - cr)); i < Math.min(mw, Math.ceil(cx + cr)); i++) {
        let d = Math.hypot(i - cx, j - cy) / cr
        if (d < 1) { let k = j * mw + i; melt[k] = Math.min(1, melt[k] + s * (1 - d * d)) }
      }
  }
  // a stroke from the last position, so a fast swipe leaves an unbroken trail
  let last: [number, number] | null = null
  let warm = (x: number, y: number) => {
    let r = phone ? 64 : 80
    if (last) {
      let d = Math.hypot(x - last[0], y - last[1]), steps = Math.min(24, Math.ceil(d / 16))
      for (let i = 1; i <= steps; i++) brush(last[0] + ((x - last[0]) * i) / steps, last[1] + ((y - last[1]) * i) / steps, r, 0.1)
    } else brush(x, y, r, 0.25)
    last = [x, y]
    stir()
  }
  // a card held melted: the whole of it clears, and the frost just around it
  let thaw = (el: Element, s: number) => {
    let [l, t, r, b] = rect(el)
    for (let j = Math.max(0, Math.ceil((t - 12) / MELT)); j < Math.min(mh, Math.floor((b + 12) / MELT)); j++)
      for (let i = Math.max(0, Math.ceil((l - 12) / MELT)); i < Math.min(mw, Math.floor((r + 12) / MELT)); i++) {
        let k = j * mw + i
        melt[k] += (1 - melt[k]) * s
      }
  }

  // the sheet is fixed to the screen: the pointer's place on it is its place on the screen
  let ptr = { x: -999, y: -999, at: -9 }
  addEventListener('pointermove', (e) => {
    if (still) return
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.at = t
    if (e.pointerType !== 'touch') warm(e.clientX, e.clientY)
  }, { signal, passive: true })
  // a finger melts as it moves, while the page scrolls under it: passive, the canvas never takes a touch
  for (let type of ['touchstart', 'touchmove'] as const) {
    addEventListener(type, (e) => {
      if (still) return
      if (type === 'touchstart') last = null
      let touch = e.touches[0]
      ptr.x = touch.clientX; ptr.y = touch.clientY; ptr.at = t
      warm(touch.clientX, touch.clientY)
    }, { signal, passive: true })
  }
  // a click (or a tap, not a swipe) on bare ice cracks it where it lands; one on a link, a button or a
  // card's words just does what it says
  let cracks = [0, 0, -99, 0, 0, -99, 0, 0, -99, 0, 0, -99]
  let next = 0
  addEventListener('click', (e) => {
    if (still || (e.target as Element).closest?.('a, button, input, label, video, [role="group"]')) return
    let x = e.clientX, y = e.clientY
    if (!(map[Math.floor(y / LAYOUT) * lw + Math.floor(x / LAYOUT)] > 0.3)) return
    cracks.splice(next * 3, 3, x, H - y, t)
    next = (next + 1) % 4
    brush(x, y, 26, 0.8)
    stir()
  }, { signal })

  // the card under the pointer, and the one with the keyboard focus, stay melted
  let hovered: Element | null = null, focused: Element | null = null
  addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return
    let el = (e.target as Element).closest?.(HELD) ?? null
    if (el !== hovered) { hovered = el; if (el) stir() }
  }, { signal, passive: true })
  document.documentElement.addEventListener('pointerleave', () => (hovered = null), { signal })
  addEventListener('focusin', (e) => { focused = (e.target as Element).closest?.(HELD) ?? null; if (focused) stir() }, { signal })
  addEventListener('focusout', () => (focused = null), { signal })

  // The first look: the sheet freezes in from the edges (as the title card lifts, on a first visit), then a
  // breath of warmth crosses each of the hero's tiles in turn, so people see that it melts.
  let t = 0 // seconds of motion so far (it does not run while the motion is off)
  let frozenAt = 0 // when the freeze starts
  let FREEZE = 1.6
  let breaths = [...document.querySelectorAll('.tile-career, .brand-half-t2f, .brand-half-joj, .tile-life')].map((el, i) => ({ el, at: FREEZE + 0.3 + i * 0.35 }))
  // Into a new section, the frost creeps in from the screen's edges and settles (E in the shader), so going
  // down the page feels like moving along a frozen river.
  let CREEP = 0.8
  let creepAt = -9, section = ''

  // the melt map follows time in fixed steps: the held cards and the breaths add warmth, then it spreads
  // a little, and freezes back at a steady rate (clear water to ice in about 4 s)
  let warmUntil = 0 // something melted or moving until then: full frame rate
  let stir = () => { warmUntil = Math.max(warmUntil, t + 1.5); go() }
  function step(dt: number) {
    for (let el of new Set([hovered, focused])) if (el) thaw(el, 0.12)
    let since = t - frozenAt
    for (let b of breaths) {
      let p = (since - b.at) / 0.7
      if (p < 0 || p > 1) continue
      let [l, top, r, bottom] = rect(b.el)
      let h = bottom - top
      brush(l + (r - l) * p, top + h / 2, Math.min(h * 0.6, 120), 0.07)
      warmUntil = t + 1.5
    }
    // still changing (not a card held melted that has settled): full frame rate a moment longer
    let sum = 0
    for (let j = 0; j < mh; j++) for (let i = 0; i < mw; i++) {
      let k = j * mw + i, m = melt[k]
      if (!m && !(i > 0 && melt[k - 1]) && !(i < mw - 1 && melt[k + 1]) && !(j > 0 && melt[k - mw]) && !(j < mh - 1 && melt[k + mw])) { spare[k] = 0; continue }
      let avg = ((i > 0 ? melt[k - 1] : m) + (i < mw - 1 ? melt[k + 1] : m) + (j > 0 ? melt[k - mw] : m) + (j < mh - 1 ? melt[k + mw] : m)) / 4
      let v = Math.max(0, m + (avg - m) * 0.2 - 0.25 * dt)
      spare[k] = v
      sum += v
    }
    ;[melt, spare] = [spare, melt]
    if (Math.abs(sum - meltSum) > 0.05 + sum * 0.002) warmUntil = Math.max(warmUntil, t + 0.2)
    meltSum = sum
  }
  let meltSum = 0

  let draw = () => {
    for (let k = 0; k < melt.length; k++) meltBytes[k] = melt[k] * 255
    g.activeTexture(g.TEXTURE2)
    g.bindTexture(g.TEXTURE_2D, meltTex)
    g.texImage2D(g.TEXTURE_2D, 0, g.LUMINANCE, mw, mh, 0, g.LUMINANCE, g.UNSIGNED_BYTE, meltBytes)
    g.viewport(0, 0, canvas.width, canvas.height)
    g.useProgram(ice)
    g.uniform1i(u.B, 0)
    g.uniform1i(u.L, 1)
    g.uniform1i(u.M, 2)
    g.uniform2f(u.R, canvas.width, canvas.height)
    g.uniform1f(u.S, dpr)
    g.uniform1f(u.T, t)
    g.uniform1f(u.A, still ? 1 : Math.max(0, Math.min(1, (t - frozenAt) / FREEZE)))
    g.uniform1f(u.E, still ? 1 : Math.max(0, Math.min(1, (t - creepAt) / CREEP)))
    // the light follows the pointer for a moment after it moves, then drifts slowly about the screen
    let away = Math.min(1, Math.max(0, t - ptr.at - 1.5))
    let dx = W * (0.7 + 0.2 * Math.sin(t * 0.07)), dy = H * (0.4 + 0.2 * Math.cos(t * 0.05))
    g.uniform2f(u.P, ptr.x + (dx - ptr.x) * away, H - (ptr.y + (dy - ptr.y) * away))
    g.uniform3fv(u.C, still ? [0, 0, -99, 0, 0, -99, 0, 0, -99, 0, 0, -99] : cracks)
    g.clearColor(0, 0, 0, 0)
    g.clear(g.COLOR_BUFFER_BIT)
    g.drawArrays(g.TRIANGLES, 0, 3)
  }

  let raf = 0, timer = 0, then = 0, acc = 0
  let dirty = true, remeasure = true
  let still = root.classList.contains('is-paused')
  function go() {
    if (raf || timer || still || document.hidden) return
    raf = requestAnimationFrame(frame)
  }
  // the page moved: the next frame comes at once, not at the idle rate, so the clear places keep up
  let kick = () => {
    if (still || document.hidden) return
    if (timer) { clearTimeout(timer); timer = 0 }
    warmUntil = Math.max(warmUntil, t + 0.3)
    go()
  }
  function frame(now: number) {
    raf = 0
    let dt = then ? Math.min(0.1, (now - then) / 1000) : 1 / 60
    then = now
    t += dt
    if (remeasure) measure()
    if (dirty) layout()
    for (acc += dt; acc >= 1 / 60; acc -= 1 / 60) step(1 / 60)
    draw()
    if (still || document.hidden) { then = 0; return }
    // nothing melting, cracking, scrolling or freezing in: 12 frames a second for the slow drift
    let busy = t < warmUntil || t - frozenAt < FREEZE + 2 || t - creepAt < CREEP || cracks.some((c, i) => i % 3 === 2 && t - c < 9)
    if (busy) raf = requestAnimationFrame(frame)
    else timer = window.setTimeout(() => { timer = 0; go() }, 83)
  }
  let halt = () => { cancelAnimationFrame(raf); clearTimeout(timer); raf = timer = 0; then = 0 }

  // the page's scroll and each row's sideways scroll, read where the browser hands them over (no layout)
  addEventListener('scroll', (e) => {
    if (still) return
    let target = e.target
    if (target === document) {
      sy = scrollY
      // the section in the middle of the screen; a new one brings the creep (not again until it settles)
      let mid = sy + H / 2
      let now = sections.find((s) => s.t <= mid && s.b > mid)?.id ?? section
      if (now !== section) {
        if (section && t - creepAt > CREEP) creepAt = t
        section = now
      }
    } else if (offs.has(target as Element)) offs.set(target as Element, (target as Element).scrollLeft)
    else return
    dirty = true
    kick()
  }, { signal, capture: true, passive: true })

  // the page's motion (rails.tsx marks html.is-paused for reduced motion, data saver or the pause button):
  // off, the ice settles into one still frame of frost along the screen's edges; on again, it moves on
  let setStill = () => {
    let now = root.classList.contains('is-paused')
    if (now === still) return
    still = now
    if (still) {
      halt()
      melt.fill(0)
      hovered = focused = null
      layout()
      draw()
    } else {
      sy = scrollY
      remeasure = true
      go()
    }
  }
  new MutationObserver(setStill).observe(root, { attributes: true, attributeFilter: ['class'] })
  document.addEventListener('visibilitychange', () => (document.hidden ? halt() : go()), { signal })
  // the screen changed size: a new sheet; the page changed size, or a row got new cards: measure again
  let sized = new ResizeObserver(() => {
    if (canvas.clientWidth === W && canvas.clientHeight === H) return
    size()
    remeasure = true
    if (still) { measure(); layout(); draw() } else kick()
  })
  sized.observe(canvas)
  let again = () => { remeasure = true; kick() }
  let page = new ResizeObserver(again)
  page.observe(document.body)
  let rows = new MutationObserver(again)
  for (let track of document.querySelectorAll('[data-rail-track]')) rows.observe(track, { childList: true })
  document.fonts?.ready.then(again)
  canvas.addEventListener('webglcontextlost', () => { halt(); canvas.hidden = true; root.dataset.ice = 'off' }, { signal })
  signal.addEventListener('abort', () => { halt(); sized.disconnect(); page.disconnect(); rows.disconnect() })

  size()
  measure()
  // On a first visit the title card ("Ângelo Ocanã presents") lifts at about 0.7 s: the freeze starts with it.
  let card = !root.matches('.cin-seen, .cin-skip') && !still
  let wait = card ? Math.max(0, 0.7 - performance.now() / 1000) : 0
  frozenAt = still ? -99 : wait
  canvas.dataset.on = ''
  layout()
  if (still) draw()
  else go()
  return true
}
