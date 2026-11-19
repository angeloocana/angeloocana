// A sheet of river ice over the hero, in plain WebGL (no library). ice.tsx imports this once the page has
// loaded and gone idle. The pointer (or a swiping finger) melts clear holes with a wet rim, which freeze
// back over about 4 s; a click cracks it; a tile under the pointer or the keyboard focus stays melted.
//
// How thick the ice is comes from the page itself (layout()): clear over every line of text, a thin glaze
// inside the tiles, and frost thick at their edges, between them and around the hero, so the words are
// always readable and the frost frames the work instead of covering it.
//
// Two passes: the sheet's grain (frost, the crack network, the surface's tilt for the light) is drawn once
// per size into a texture; each frame lays it over the page with the melt map, the light and fresh cracks.
// Frames stop while the hero is off screen or the tab is hidden, drop to 15 a second when nothing moves,
// and stop altogether while the page's motion is off (html.is-paused: reduced motion or the pause button).

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
// cracks (x, y, when), A how far the sheet has frozen in, T the time
const ICE = `${NOISE}
uniform sampler2D B, L, M;
uniform vec2 R, P;
uniform float S, T, A;
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
  float gz = smoothstep(0., .1, g)*smoothstep(0., 48., c.y);
  a = clamp(a*gz, 0., .9); dark = clamp(dark, 0., .6)*gz;
  gl_FragColor = vec4(min(col, 1.)*a*(1. - dark), a + dark*(1. - a));
}`

const MELT = 6 // CSS px per cell of the melt map
const LAYOUT = 8 // ...and of the thickness map
// where the frost frames the work: each tile, and each half of the split Projects tile
const PANES = '.hero-tiles > .tile, .brand'
// what stays clear: every line of text and every control
const WORDS = '.hi-kicker, .hero-role, .hero-proof, .hero-ctas > *, .tile-kicker, .tile-title, .tile-meta, .tile-label, .tile-projects, .tile-line, .tile-foot, .tile-body, .brand-link, .tile-pause'
// what stays melted while the pointer or the keyboard focus is on it
const HELD = '.tile-career, .tile-life, .brand'

type Rect = [number, number, number, number]

export async function mountIce(canvas: HTMLCanvasElement, sound: HTMLButtonElement | null, signal: AbortSignal) {
  let hero = canvas.parentElement!
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
  let u = uniforms(ice, ['B', 'L', 'M', 'R', 'P', 'S', 'T', 'A', 'C'])
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

  // sizes: the canvas at a capped pixel ratio (1 on phones), and the two maps in coarse cells
  let W = 0, H = 0, dpr = 1
  let mw = 0, mh = 0, melt = new Float32Array(0), spare = new Float32Array(0), meltBytes = new Uint8Array(0)
  function size() {
    W = hero.clientWidth
    H = hero.clientHeight
    dpr = Math.min(devicePixelRatio, phone ? 1 : 1.5)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    mw = Math.ceil(W / MELT)
    mh = Math.ceil(H / MELT)
    melt = new Float32Array(mw * mh)
    spare = new Float32Array(mw * mh)
    meltBytes = new Uint8Array(mw * mh)
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
    layout()
  }

  let local = (el: Element): Rect => {
    let r = el.getBoundingClientRect(), o = hero.getBoundingClientRect()
    return [r.left - o.left, r.top - o.top, r.right - o.left, r.bottom - o.top]
  }
  // where the tiles are in the hero, measured with the layout (it changes only with the hero's size,
  // which runs layout() again), so frames never ask the browser for layout
  let rects = new Map<Element, Rect>()
  let rect = (el: Element) => rects.get(el) ?? [0, 0, 0, 0]
  // the thickness map: thin over the words' column, thick around the hero, between the tiles and along
  // their edges, a glaze inside them; softened, then cleared over each line of text
  function layout() {
    let lw = Math.ceil(W / LAYOUT), lh = Math.ceil(H / LAYOUT)
    let map = new Float32Array(lw * lh)
    let column = local(hero.querySelector('.hero-text')!)
    for (let el of hero.querySelectorAll(`${PANES}, ${HELD}`)) rects.set(el, local(el))
    let panes = [...hero.querySelectorAll(PANES)].map(rect)
    let inside = ([l, t, r, b]: Rect, x: number, y: number, pad = 0) => x > l - pad && x < r + pad && y > t - pad && y < b + pad
    let top = Math.min(...panes.map((p) => p[1]), column[1]) - 24
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      let x = (i + 0.5) * LAYOUT, y = (j + 0.5) * LAYOUT
      // like frost on a window: thickest at the hero's edges and corners, under the menu it fades out
      let edge = Math.min(x, W - x, y - top, H - y)
      let v = (0.3 + 0.7 * Math.exp(-Math.max(0, edge) / 70)) * Math.min(1, Math.max(0, (y - top + 40) / 80))
      // the words' column: a thin sheet that fades in over 90 px, so it has no visible edge
      let out = Math.hypot(Math.max(column[0] - x, 0, x - column[2]), Math.max(column[1] - y, 0, y - column[3])) / 90
      v *= 0.35 + 0.65 * Math.min(1, out) ** 2
      for (let p of panes) if (inside(p, x, y)) v = 0.06 + 0.6 * Math.exp(-Math.min(x - p[0], p[2] - x, y - p[1], p[3] - y) / 12)
      map[j * lw + i] = v
    }
    blur(map, lw, lh, 2)
    blur(map, lw, lh, 2)
    for (let w of hero.querySelectorAll(WORDS)) {
      let [l, t, r, b] = local(w)
      if (r - l < 1) continue
      for (let j = Math.max(0, Math.floor((t - 60) / LAYOUT)); j < Math.min(lh, Math.ceil((b + 60) / LAYOUT)); j++)
        for (let i = Math.max(0, Math.floor((l - 60) / LAYOUT)); i < Math.min(lw, Math.ceil((r + 60) / LAYOUT)); i++) {
          let x = (i + 0.5) * LAYOUT, y = (j + 0.5) * LAYOUT
          let d = Math.hypot(Math.max(l - x, 0, x - r), Math.max(t - y, 0, y - b)) - 4
          let f = Math.min(1, Math.max(0, d / 52))
          map[j * lw + i] *= f * f * (3 - 2 * f)
        }
    }
    let bytes = Uint8Array.from(map, (v) => v * 255)
    g.activeTexture(g.TEXTURE1)
    g.bindTexture(g.TEXTURE_2D, layoutTex)
    g.texImage2D(g.TEXTURE_2D, 0, g.LUMINANCE, lw, lh, 0, g.LUMINANCE, g.UNSIGNED_BYTE, bytes)
    still ? draw() : go()
  }
  function blur(map: Float32Array, w: number, h: number, r: number) {
    let tmp = new Float32Array(map.length)
    for (let pass = 0; pass < 2; pass++) {
      let [from, to] = pass ? [tmp, map] : [map, tmp]
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        let s = 0, n = 0
        for (let k = -r; k <= r; k++) {
          let x = pass ? i : i + k, y = pass ? j + k : j
          if (x >= 0 && x < w && y >= 0 && y < h) { s += from[y * w + x]; n++ }
        }
        to[j * w + i] = s / n
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
  // a tile held melted: the whole of it clears, the rim along its edges
  let thaw = (el: Element, s: number) => {
    let [l, t, r, b] = rect(el)
    for (let j = Math.max(0, Math.ceil(t / MELT)); j < Math.min(mh, Math.floor(b / MELT)); j++)
      for (let i = Math.max(0, Math.ceil(l / MELT)); i < Math.min(mw, Math.floor(r / MELT)); i++) {
        let k = j * mw + i
        melt[k] += (1 - melt[k]) * s
      }
  }

  let ptr = { x: -999, y: -999, at: -9 }
  let near = (x: number, y: number) => x > -40 && y > -40 && x < W + 40 && y < H + 40
  let at = (cx: number, cy: number) => { let o = hero.getBoundingClientRect(); return [cx - o.left, cy - o.top] as const }
  addEventListener('pointermove', (e) => {
    if (still) return
    let [x, y] = at(e.clientX, e.clientY)
    if (!near(x, y)) { last = null; return }
    ptr.x = x; ptr.y = y; ptr.at = t
    if (e.pointerType !== 'touch') warm(x, y)
  }, { signal, passive: true })
  // a finger melts as it moves, while the page scrolls under it: passive, the canvas never takes a touch
  for (let type of ['touchstart', 'touchmove'] as const) {
    addEventListener(type, (e) => {
      if (still) return
      if (type === 'touchstart') last = null
      let touch = e.touches[0]
      let [x, y] = at(touch.clientX, touch.clientY)
      if (near(x, y)) { ptr.x = x; ptr.y = y; ptr.at = t; warm(x, y) }
    }, { signal, passive: true })
  }
  // a click (or a tap, not a swipe) on the ice itself cracks it where it lands; one on a link or a button
  // just does what it says
  let cracks = [0, 0, -99, 0, 0, -99, 0, 0, -99, 0, 0, -99]
  let next = 0
  addEventListener('click', (e) => {
    if (still || (e.target as Element).closest?.('a, button')) return
    let [x, y] = at(e.clientX, e.clientY)
    if (x < 0 || y < 0 || x > W || y > H) return
    cracks.splice(next * 3, 3, x, H - y, t)
    next = (next + 1) % 4
    brush(x, y, 26, 0.8)
    ping()
    stir()
  }, { signal })

  let held = new Set<Element>()
  for (let el of hero.querySelectorAll(HELD)) {
    el.addEventListener('pointerenter', (e) => { if ((e as PointerEvent).pointerType !== 'touch') { held.add(el); stir() } }, { signal })
    el.addEventListener('pointerleave', () => held.delete(el), { signal })
    el.addEventListener('focusin', () => { held.add(el); stir() }, { signal })
    el.addEventListener('focusout', () => held.delete(el), { signal })
  }

  // The first look: the sheet freezes in from the edges (as the title card lifts, on a first visit), then a
  // breath of warmth crosses each tile in turn, so people see that it melts.
  let t = 0 // seconds of motion so far (it does not run while the motion is off)
  let frozenAt = 0 // when the freeze starts
  let FREEZE = 1.6
  let breaths = [...hero.querySelectorAll('.tile-career, .brand-half-t2f, .brand-half-joj, .tile-life')].map((el, i) => ({ el, at: FREEZE + 0.3 + i * 0.35 }))

  // the melt map follows time in fixed steps: the held tiles and the breaths add warmth, then it spreads
  // a little, and freezes back at a steady rate (clear water to ice in about 4 s)
  let warmUntil = 0 // something melted or moving until then: full frame rate
  let stir = () => { warmUntil = t + 1.5; go() }
  function step(dt: number) {
    for (let el of held) thaw(el, 0.12)
    let since = t - frozenAt
    for (let b of breaths) {
      let p = (since - b.at) / 0.7
      if (p < 0 || p > 1) continue
      let [l, top, r, bottom] = rect(b.el)
      let h = bottom - top
      brush(l + (r - l) * p, top + h / 2, Math.min(h * 0.6, 120), 0.07)
      warmUntil = t + 1.5
    }
    let any = false
    for (let j = 0; j < mh; j++) for (let i = 0; i < mw; i++) {
      let k = j * mw + i, m = melt[k]
      let avg = ((i > 0 ? melt[k - 1] : m) + (i < mw - 1 ? melt[k + 1] : m) + (j > 0 ? melt[k - mw] : m) + (j < mh - 1 ? melt[k + mw] : m)) / 4
      let v = Math.max(0, m + (avg - m) * 0.2 - 0.25 * dt)
      spare[k] = v
      if (v > 0) any = true
    }
    ;[melt, spare] = [spare, melt]
    if (any) warmUntil = Math.max(warmUntil, t + 0.2)
  }

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
    // the light follows the pointer for a moment after it moves, then drifts slowly about the tiles
    let away = Math.min(1, Math.max(0, t - ptr.at - 1.5))
    let dx = W * (0.7 + 0.2 * Math.sin(t * 0.07)), dy = H * (0.4 + 0.2 * Math.cos(t * 0.05))
    g.uniform2f(u.P, ptr.x + (dx - ptr.x) * away, H - (ptr.y + (dy - ptr.y) * away))
    g.uniform3fv(u.C, still ? [0, 0, -99, 0, 0, -99, 0, 0, -99, 0, 0, -99] : cracks)
    g.clearColor(0, 0, 0, 0)
    g.clear(g.COLOR_BUFFER_BIT)
    g.drawArrays(g.TRIANGLES, 0, 3)
  }

  let visible = true
  let raf = 0, timer = 0, then = 0, acc = 0
  let still = root.classList.contains('is-paused')
  function go() {
    if (raf || timer || still || !visible || document.hidden) return
    raf = requestAnimationFrame(frame)
  }
  function frame(now: number) {
    raf = 0
    let dt = then ? Math.min(0.1, (now - then) / 1000) : 1 / 60
    then = now
    t += dt
    for (acc += dt; acc >= 1 / 60; acc -= 1 / 60) step(1 / 60)
    draw()
    if (still || !visible || document.hidden) { then = 0; return }
    // nothing melting, cracking or freezing in: 15 frames a second for the slow drift
    let busy = t < warmUntil || t - frozenAt < FREEZE + 2 || cracks.some((c, i) => i % 3 === 2 && t - c < 9)
    if (busy) raf = requestAnimationFrame(frame)
    else timer = window.setTimeout(() => { timer = 0; then = performance.now() - 66; go() }, 66)
  }
  let halt = () => { cancelAnimationFrame(raf); clearTimeout(timer); raf = timer = 0; then = 0 }

  // the page's motion (rails.tsx marks html.is-paused for reduced motion, data saver or the pause button):
  // off, the ice settles into one still frame of frosted edges; on again, it moves on from there
  let setStill = () => {
    let now = root.classList.contains('is-paused')
    if (now === still) return
    still = now
    if (sound) sound.hidden = still
    if (still) {
      halt()
      melt.fill(0)
      held.clear()
      draw()
    } else go()
  }
  new MutationObserver(setStill).observe(root, { attributes: true, attributeFilter: ['class'] })
  let seen = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    visible ? go() : halt()
  })
  seen.observe(hero)
  document.addEventListener('visibilitychange', () => (document.hidden ? halt() : go()), { signal })
  let resize = new ResizeObserver(() => {
    if (hero.clientWidth === W && hero.clientHeight === H) return
    size()
    if (still) draw()
  })
  resize.observe(hero)
  document.fonts?.ready.then(layout)
  canvas.addEventListener('webglcontextlost', () => { halt(); canvas.hidden = true; hero.dataset.ice = 'off' }, { signal })
  signal.addEventListener('abort', () => { halt(); seen.disconnect(); resize.disconnect() })

  size()
  // On a first visit the title card ("Ângelo Ocanã presents") lifts at about 0.7 s: the freeze starts with it.
  let card = !root.matches('.cin-seen, .cin-skip') && !still
  let wait = card ? Math.max(0, 0.7 - performance.now() / 1000) : 0
  frozenAt = still ? -99 : wait
  canvas.dataset.on = ''
  if (sound) sound.hidden = still
  if (still) draw()
  else go()

  // sound, off until asked: a short glassy crack (a burst of filtered noise and three bright partials)
  let audio: AudioContext | null = null
  let soundOn = false
  function ping() {
    if (!soundOn) return
    audio ??= new AudioContext()
    let ctx = audio, now = ctx.currentTime
    let noise = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
    let data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3
    let src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), ng = ctx.createGain()
    src.buffer = noise
    hp.type = 'highpass'
    hp.frequency.value = 2400
    ng.gain.value = 0.12
    src.connect(hp).connect(ng).connect(ctx.destination)
    src.start(now)
    for (let [f, d] of [[1975, 0], [3135, 0.02], [4186, 0.05]]) {
      let o = ctx.createOscillator(), gain = ctx.createGain()
      o.frequency.value = f
      gain.gain.setValueAtTime(0.0001, now + d)
      gain.gain.exponentialRampToValueAtTime(0.035, now + d + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + d + 0.45)
      o.connect(gain).connect(ctx.destination)
      o.start(now + d)
      o.stop(now + d + 0.5)
    }
  }
  sound?.addEventListener('click', () => {
    soundOn = sound.getAttribute('aria-pressed') !== 'true'
    sound.setAttribute('aria-pressed', String(soundOn))
    if (soundOn) ping()
  }, { signal })
  return true
}
