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
// Frames run only while something changes (a melt freezing back, a crack, the freeze-in, a scroll); once
// the sheet has settled it sleeps until the page moves, someone interacts or an animal swims by.
// Frames stop altogether while the tab is hidden or the page's motion is off (html.is-paused:
// reduced motion, data saver or the pause button), which leaves one still frame of frost along the screen's
// edges. (ice.tsx doesn't even load this while the motion is off.)
//
// While the page scrolls, the parts of the thickness map that come from the page (where the cards are, and
// the clear places around the words) are kept in cells fixed to the page, and only the rows that scroll
// into view are worked out; each frame only adds the screen's own frost to them.
//
// Animals pass under the frost, favoring fresh melts when someone interacts. Each silhouette is a tiny
// texture sampled only inside its own small box. Artwork and timing live in this already delayed chunk;
// another browser module would add an entry to the home page's import map.

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
// settled), T the time. L's cells are fixed to the page (R the page's thickness, G where the cards are, B
// how clear the words keep it); O places it: 1 / its size in CSS px, and how far its top is above the
// screen's. N is the menu's height, Q the screen edge frost (strength, reach in px), V how far the page
// scrolled since the last frame (the clear places reach that much further up and down, so a fast scroll
// never slides words under frost before the next frame). K is the animal's silhouette (R its body, G the
// water it moves), Z its box's middle (CSS px from the top left) and heading, Y the box's half length and
// half width, how much of it shows (0: none here, the box is skipped) and its stroke; X how far it sways.
// D marks an ambient swim, visible even where the ice hasn't melted.
const ICE = `${NOISE}
uniform sampler2D B, L, M, K;
uniform vec2 R, P, Q;
uniform vec3 O;
uniform vec4 Z, Y;
uniform float S, T, A, E, N, V, X, D;
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
  float m = texture2D(M, uv).r;
  vec3 n = normalize(vec3(b.zw*2. - 1., 1.));
  // the thickness: the page's, plus frost on the screen's edges and corners (like frost on a window) outside
  // the cards, faded out under the menu, then cleared around the words. The clear places' edges follow the
  // grain, so they read as ice that melted back, not as boxes.
  float yt = R.y/S - c.y;
  vec2 lp = vec2(c.x, yt + O.z)*O.xy;
  vec3 pg = texture2D(L, lp).rgb;
  float clr = min(pg.b, min(texture2D(L, lp - vec2(0., V*O.y)).b, texture2D(L, lp + vec2(0., V*O.y)).b));
  clr = clamp((clr - .5 + (b.x - .5)*.8)*1.7 + .5, 0., 1.);
  float edge = max(0., min(min(c.x, R.x/S - c.x), min(yt - N, R.y/S - yt)));
  float l = min(1., pg.r + (1. - pg.g)*Q.x*exp(-edge/Q.y))*clr*clamp((yt - N + 16.)/40., 0., 1.);
  // into a new section: a front of frost creeps in from the screen's edges and settles. It only thickens
  // ice that is there (never over the words), and fades as it settles, so nothing flashes.
  float ed = min(min(c.x, R.x/S - c.x), min(c.y, R.y/S - c.y));
  float front = 30. + 230.*(1. - pow(1. - E, 3.));
  float wave = (1. - smoothstep(front - 110., front, ed + (b.x - .5)*90.))*(1. - E);
  l = min(1., l*(1. + 1.3*wave));
  // frost reaches in from the thick edges
  float fr = smoothstep(.3, .78, l + (b.x - .5)*.5);
  float ice = smoothstep(.02, .2, l);
  float a = ice*.04 + fr*(.1 + .45*b.x) + b.y*ice*(.03 + .12*l);
  vec3 col = mix(vec3(.5, .63, .74), vec3(.86, .93, .98), b.x*fr);
  // a breath: faint fog over the sheet
  float fog = noise(c*.003);
  a += fog*fog*.05*ice;
  // the light: the pointer's warmth, or where it rests when the pointer is away
  vec3 H = normalize(normalize(vec3(P - c, 300.)) + vec3(0, 0, 1));
  float sp = pow(max(dot(n, H), 0.), 40.)*(.2 + .8*exp(-length(c - P)/280.));
  col += sp*.6; a += sp*.25*ice;
  // the melt: a clear hole, a bright wet rim and a shadow just inside it; the noisy edge refreezes in crystals.
  // The rim, the shadow and the glints are as strong as the ice under them is thick (th): full in the gaps,
  // gone over the words and the cards, where the ice is cleared
  float th = smoothstep(.02, .2, l);
  float mt = m + (b.x - .5)*.3;
  float hole = smoothstep(.3, .5, mt);
  float rim = smoothstep(.16, .3, mt)*(1. - smoothstep(.3, .44, mt))*th;
  float dark = smoothstep(.44, .5, mt)*(1. - smoothstep(.5, .66, mt))*.2*(.3 + l)*th;
  a *= 1. - hole;
  col = mix(col, vec3(.85, .97, 1.), rim);
  a = max(a, rim*(.16 + .32*l));
  float wet = hole*pow(max(dot(normalize(vec3((b.zw - .5)*.4, 1.)), H), 0.), 90.)*.35*th;
  col += wet; a += wet*.3;
  // something swimming under the ice: a shadow under the frost, blurred more the more frost it is under,
  // and in the open water a darker shape in water lit faintly around it. Only where there is ice (th), so
  // never over the words. An ambient swim casts a more distinct shadow under unmelted ice.
  if (Y.z > 0.){
    vec2 d = vec2(c.x, yt) - Z.xy;
    vec2 lc = vec2(dot(d, Z.zw), dot(d, vec2(-Z.w, Z.z)))/Y.xy;
    if (abs(lc.x) < 1. && abs(lc.y) < 1.){
      float tl = .5 - .5*lc.x;
      lc.y += X*sin(Y.w + lc.x*2.5)*tl*tl;
      vec4 an = texture2D(K, lc*.5 + .5);
      float open = smoothstep(.12, .45, mt);
      float vis = Y.z*th*(.04 + .96*open);
      float bodyShade = an.r*vis*hole*.76;
      float water = smoothstep(.10, .65, an.g)*vis*hole*.29*(1. - an.r*.92);
      float shade = bodyShade + water;
      col = (col*a + vec3(.032, .052, .066)*bodyShade + vec3(.42, .53, .58)*water)/max(a + shade, .001);
      a += shade;
      dark += mix(an.g*.6, an.r, open)*vis*.58*(1. - hole);
      if (D > 0.) {
        // The soft shadow reaches into thin ice, but the unsharpened word mask still cuts it away at text.
        float drift = Y.z*(1. - open)*smoothstep(.03, .34, pg.b)*smoothstep(.025, .17, pg.r);
        float glimmer = drift*(smoothstep(.06, .58, an.g)*(1. - an.r)*.13 + an.r*.30);
        col = (col*a + vec3(.43, .65, .76)*glimmer)/max(a + glimmer, .001);
        a += glimmer;
        dark += drift*an.r*.20;
      }
    }
  }
  // cracks with depth: a dark cut, lit on the side toward the light
  float k = 0., hi = 0., pw = 0.;
  for (int i = 0; i < 4; i++){
    float k0 = crack(c, C[i]);
    k += k0; hi += max(crack(c + vec2(-1.3, 1.3), C[i]) - k0, 0.);
    float age = T - C[i].z;
    if (age > 0. && age < 9.) pw += exp(-length(c - C[i].xy)/16.)*(1. - smoothstep(1., 9., age));
  }
  float body = smoothstep(.02, .4, l)*(1. - hole*.7);
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
const WORDS = '.hi-kicker, .hero-role, .hero-proof, .hero-socials, .tile-kicker, .tile-title, .tile-meta, .tile-label, .tile-projects, .tile-line, .tile-foot, .tile-body, .brand-link, .tile-pause, .row-head, .rail-bar > *, .row-down, .clip-copy, .clip-ig, .cin-foot > *'
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
  let u = uniforms(ice, ['B', 'L', 'M', 'K', 'R', 'P', 'Q', 'O', 'Z', 'Y', 'S', 'T', 'A', 'E', 'N', 'V', 'X', 'D', 'C'])
  let buffer = g.createBuffer()
  g.bindBuffer(g.ARRAY_BUFFER, buffer)
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
  // while the motion is off: no page in the thickness, only the screen's edges (and nothing cleared)
  let plainTex = texture(3)
  g.texImage2D(g.TEXTURE_2D, 0, g.RGB, 1, 1, 0, g.RGB, g.UNSIGNED_BYTE, new Uint8Array([0, 0, 255]))
  let fbo = g.createFramebuffer()

  // sizes: the canvas covers the screen (its tallest, so the phone's toolbar coming and going never resizes
  // it) at a capped pixel ratio (1 on phones); the two maps in coarse cells, the thickness map one row
  // taller than the screen (its cells are fixed to the page, so the screen is rarely level with them)
  let W = 0, H = 0, dpr = 1
  let mw = 0, mh = 0, melt = new Float32Array(0), spare = new Float32Array(0), meltBytes = new Uint8Array(0)
  let lw = 0, lh = 0, win = new Uint8Array(0)
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
    lh = Math.ceil(H / LAYOUT) + 1
    win = new Uint8Array(lw * lh * 3)
    // the two maps' textures, allocated once per size: each frame only writes into them
    g.activeTexture(g.TEXTURE1)
    g.bindTexture(g.TEXTURE_2D, layoutTex)
    g.texImage2D(g.TEXTURE_2D, 0, g.RGB, lw, lh, 0, g.RGB, g.UNSIGNED_BYTE, null)
    g.activeTexture(g.TEXTURE2)
    g.bindTexture(g.TEXTURE_2D, meltTex)
    g.texImage2D(g.TEXTURE_2D, 0, g.LUMINANCE, mw, mh, 0, g.LUMINANCE, g.UNSIGNED_BYTE, null)
    blocks.clear()
    shownAt = -1
    meltDirty = true
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
  }

  // Where things are on the page, measured once (and again only when the page changes size or a row gets
  // new cards), from the layout alone: offsetLeft/Top ignore the cards' entry animation and the rows'
  // sideways scroll. While the page scrolls, each box only moves by the page's scroll and its row's.
  let panes: Box[] = [], words: Box[] = [], sections: (Box & { id: string })[] = [], tracks: Box[] = []
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
    tracks = all('[data-rail-track]')
    byEl = new Map(panes.map((b) => [b.el, b]))
    remeasure = false
    blocks.clear()
    shownAt = -1
  }
  // a box where it is on the screen now
  let shift = (b: Box) => (b.track ? offs.get(b.track) ?? 0 : 0)
  let view = (b: Box): Rect => { let x = shift(b); return [b.l - x, b.t - sy, b.r - x, b.b - sy] }
  let rect = (el: Element): Rect => { let b = byEl.get(el); return b ? view(b) : [0, 0, 0, 0] }

  // The thickness map, in cells fixed to the page, worked out a block of rows at a time as they scroll into
  // view and kept: R the page's own thickness (a sheet over the gaps, thicker over the Outside work row, a
  // glaze in each card with frost along its edges, softened), G where the cards are (no screen-edge frost
  // over them, and less of it in the gaps beside a card peeking in at a side), B how much of it the words
  // leave: cleared over every line of text, every control and inside each card. The screen's own frost
  // (its edges, the menu) is added by the shader. A row scrolling sideways works out its own blocks again.
  const BLOCK = 32 // rows of cells per block
  const PAD = 4 // the softening's reach, in cells
  let blocks = new Map<number, Uint8Array>()
  let shownAt = -1 // the first page row of cells the uploaded map starts at (-1: upload again)
  let moved = new Map<Element, number>() // how far each row scrolled sideways since its blocks were worked out
  let reslack = new Set<Element>() // rows whose blocks were worked out mid-scroll, with wider clear places
  let raw = new Float32Array(0), rawG = new Float32Array(0), tmp = new Float32Array(0), keep = new Float32Array(0)
  function block(n: number) {
    let rows = BLOCK + 2 * PAD, top = (n * BLOCK - PAD) * LAYOUT
    if (raw.length !== lw * rows) { raw = new Float32Array(lw * rows); rawG = new Float32Array(lw * rows); tmp = new Float32Array(lw * rows); keep = new Float32Array(lw * BLOCK) }
    // the gaps' sheet, by section
    for (let j = 0; j < rows; j++) {
      let y = top + (j + 0.5) * LAYOUT
      let v = sections.find((s) => s.t <= y && s.b > y)?.v ?? GAP
      raw.fill(v, j * lw, (j + 1) * lw)
      rawG.fill(0, j * lw, (j + 1) * lw)
    }
    let span = (l: number, t: number, r: number, b: number, pad: number, rowsIn: number, from: number, fn: (k: number, x: number, y: number) => void) => {
      for (let j = Math.max(0, Math.floor((t - pad - from) / LAYOUT)); j < Math.min(rowsIn, Math.ceil((b + pad - from) / LAYOUT)); j++)
        for (let i = Math.max(0, Math.floor((l - pad) / LAYOUT)); i < Math.min(lw, Math.ceil((r + pad) / LAYOUT)); i++) fn(j * lw + i, (i + 0.5) * LAYOUT, from + (j + 0.5) * LAYOUT)
    }
    let bottom = top + rows * LAYOUT
    for (let p of panes) {
      if (p.b < top || p.t > bottom) continue
      let x = shift(p), l = p.l - x, r = p.r - x
      if (r < -80 || l > W + 80) continue
      // a card peeking in at a side of the screen: the gap beside it and the screen's edge past it keep only
      // a thin glaze, so the frost never smears over the slice of it that shows
      let peekR = l > W / 2 && l < W && r > W, peekL = r < W / 2 && r > 0 && l < 0
      if (peekR || peekL) {
        let [a, z] = peekR ? [l - 64, W + 80] : [-80, r + 64]
        span(a, p.t, z, p.b, 0, rows, top, (k) => { raw[k] = Math.min(raw[k], GAP * 0.4); rawG[k] = 1 })
      }
      span(l, p.t, r, p.b, 0, rows, top, (k, cx, cy) => {
        if (cx > l && cx < r && cy > p.t && cy < p.b) { raw[k] = p.v + 0.6 * Math.exp(-Math.min(cx - l, r - cx, cy - p.t, p.b - cy) / 12); rawG[k] = 1 }
      })
    }
    for (let pass = 0; pass < 2; pass++) { soften(raw, rows); soften(rawG, rows) }
    // the clear places, on this block's own rows only (they are not softened)
    let from = n * BLOCK * LAYOUT
    keep.fill(1)
    let slack = (b: Box) => (b.track ? Math.min(64, 2 * (moved.get(b.track) ?? 0)) : 0)
    let clear = (l: number, t: number, r: number, b: number, reach: number) => {
      span(l, t, r, b, reach + 8, BLOCK, from, (k, x, y) => {
        let f = Math.min(1, Math.max(0, (Math.hypot(Math.max(l - x, 0, x - r), Math.max(t - y, 0, y - b)) - 4) / reach))
        keep[k] *= f * f * (3 - 2 * f)
      })
    }
    let end = from + BLOCK * LAYOUT
    for (let w of words) {
      if (w.b < from - 60 || w.t > end + 60 || w.r - w.l <= 1) continue
      let x = shift(w), sl = slack(w)
      if (w.r - x < -60 || w.l - x > W + 60) continue
      clear(w.l - x - sl, w.t - sl, w.r - x + sl, w.b + sl, 52)
    }
    // each card clears inside its frosted edge, the ones peeking in at the screen's sides too
    for (let p of panes) {
      if (!p.el.classList.contains('slide') || p.el.classList.contains('clip') || p.b < from - 40 || p.t > end + 40) continue
      let x = shift(p), sl = slack(p)
      if (p.r - x < -80 || p.l - x > W + 80) continue
      clear(p.l - x + 18 - sl, p.t + 18 - sl, p.r - x - 18 + sl, p.b - 18 + sl, 30)
    }
    let out = new Uint8Array(lw * BLOCK * 3)
    for (let k = 0; k < lw * BLOCK; k++) {
      let src = k + PAD * lw
      out[k * 3] = Math.min(1, raw[src]) * 255
      out[k * 3 + 1] = rawG[src] * 255
      out[k * 3 + 2] = keep[k] * 255
    }
    return out
  }
  // a box blur, two passes, of radius 2 (the rows past the top and bottom count as missing, as at the screen's edges)
  function soften(map: Float32Array, rows: number) {
    for (let pass = 0; pass < 2; pass++) {
      let [from, to] = pass ? [tmp, map] : [map, tmp]
      for (let j = 0; j < rows; j++) for (let i = 0; i < lw; i++) {
        let s = 0, n = 0
        for (let k = -2; k <= 2; k++) {
          let x = pass ? i : i + k, y = pass ? j + k : j
          if (x >= 0 && x < lw && y >= 0 && y < rows) { s += from[y * lw + x]; n++ }
        }
        to[j * lw + i] = s / n
      }
    }
  }
  // a row scrolled sideways: the blocks it covers (and the clear places reaching out of it) again
  let forget = (track: Element) => {
    let b = tracks.find((t) => t.el === track)
    if (!b) return
    let first = Math.floor((b.t - 60) / LAYOUT / BLOCK), lastBlock = Math.floor((b.b + 60) / LAYOUT / BLOCK)
    for (let n = first; n <= lastBlock; n++) blocks.delete(n)
    shownAt = -1
  }
  // the part of the map the screen shows, uploaded only when it moved by a row of cells or changed
  function upload() {
    let j0 = Math.floor(Math.max(0, sy) / LAYOUT)
    if (j0 === shownAt) return
    shownAt = j0
    for (let j = 0; j < lh; j++) {
      let row = j0 + j, n = Math.floor(row / BLOCK)
      let bytes = blocks.get(n)
      if (!bytes) blocks.set(n, (bytes = block(n)))
      win.set(bytes.subarray((row - n * BLOCK) * lw * 3, (row - n * BLOCK + 1) * lw * 3), j * lw * 3)
    }
    g.activeTexture(g.TEXTURE1)
    g.bindTexture(g.TEXTURE_2D, layoutTex)
    g.texSubImage2D(g.TEXTURE_2D, 0, 0, 0, lw, lh, g.RGB, g.UNSIGNED_BYTE, win)
    ahead()
  }
  // the blocks a screen above and below, worked out while the browser is idle, so a scroll seldom has to
  let idle = 0
  function ahead() {
    if (idle || !('requestIdleCallback' in window)) return
    idle = requestIdleCallback((deadline) => {
      idle = 0
      if (signal.aborted || still) return
      let first = Math.floor(Math.max(0, sy - H) / LAYOUT / BLOCK), lastBlock = Math.floor((sy + 2 * H) / LAYOUT / BLOCK)
      for (let n = first; n <= lastBlock; n++) {
        if (blocks.has(n)) continue
        if (deadline.timeRemaining() < 8) return ahead()
        blocks.set(n, block(n))
      }
    })
  }
  // how thick the ice is at a point on the screen (what the shader works out, without the grain)
  let EDGE = 0.6, REACH = 60
  let thickness = (x: number, y: number) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return 0
    let k = (Math.floor((Math.max(0, sy) + y) / LAYOUT) - shownAt) * lw + Math.floor(x / LAYOUT)
    if (k < 0 || k >= lw * lh) return 0
    let edge = Math.max(0, Math.min(x, W - x, y - navH, H - y))
    let fade = Math.min(1, Math.max(0, (y - navH + 16) / 40))
    return Math.min(1, win[k * 3] / 255 + (1 - win[k * 3 + 1] / 255) * EDGE * Math.exp(-edge / REACH)) * (win[k * 3 + 2] / 255) * fade
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
  let last: Point | null = null
  let freshMelt: { point: Point; at: number } | null = null
  let warm = (x: number, y: number) => {
    if (released) return
    let r = phone ? 64 : 80
    if (last) {
      let d = Math.hypot(x - last[0], y - last[1]), steps = Math.min(24, Math.ceil(d / 16))
      for (let i = 1; i <= steps; i++) brush(last[0] + ((x - last[0]) * i) / steps, last[1] + ((y - last[1]) * i) / steps, r, 0.1)
    } else brush(x, y, r, 0.25)
    last = [x, y]
    freshMelt = { point: last, at: t }
    stir()
  }

  // Only one at a time, gone as soon as motion goes off, the tab is hidden or the sheet comes down.
  // Its silhouette goes into a tiny texture, made the first time one comes.
  let rng = Math.random
  let animal: { kind: Kind; path: [Point, Point, Point]; at: number; time: number; ambient: boolean } | null = null
  let animalTex: WebGLTexture | null = null, drawnKind: Kind | null = null
  let swim = (kind: Kind, path: [Point, Point, Point], ambient: boolean) => {
    if (!animalTex) animalTex = texture(4)
    if (drawnKind !== kind) {
      let canvas = document.createElement('canvas')
      drawAnimal(canvas, kind)
      g.activeTexture(g.TEXTURE4)
      g.bindTexture(g.TEXTURE_2D, animalTex)
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, canvas)
      drawnKind = kind
    }
    animal = { kind, path, at: t, time: SWIM * (0.9 + 0.2 * rng()), ambient }
  }
  let nextSwim = () => {
    let kind = pick(rng)
    let distance = SPECIES[kind].speed * SWIM
    if (freshMelt && t - freshMelt.at < 1.5) {
      let path = plan(rng, freshMelt.point, distance, thickness)
      if (path) return swim(kind, path, false)
    }
    // Look for a continuous strip of frost in the visible viewport, not just thick ice at its edges.
    let dx = Math.min(W * 0.46, distance / 2) * (rng() < 0.5 ? -1 : 1)
    let bend = 14 * Math.sign(dx)
    let lane = (y: number): [Point, Point, Point] => [[W / 2 - dx, y - bend / 2], [W / 2, y + bend], [W / 2 + dx, y]]
    let bottom = Math.min(H, innerHeight), best = lane((navH + bottom) / 2), top = -1
    for (let y = navH + 32; y <= bottom - 24; y += 12) {
      let path = lane(y), score = 0
      for (let i = 1; i < 12; i++) {
        let [x, y] = along(path, i / 12)[0]
        score += Math.min(0.16, thickness(x, y - 8), thickness(x, y), thickness(x, y + 8))
      }
      if (score > top) { top = score; best = path }
    }
    swim(kind, best, true)
  }
  // a card held melted: it clears, and the frost just around it. The warmth fades in over FEATHER px from
  // the edge, so the melt's edge falls where the frost's grain puts it (the shader), like the clear places
  // around the words, never along a straight line
  let FEATHER = 40
  let thaw = (el: Element, s: number) => {
    let [l, t, r, b] = rect(el)
    l -= 12; t -= 12; r += 12; b += 12
    for (let j = Math.max(0, Math.floor(t / MELT)); j < Math.min(mh, Math.ceil(b / MELT)); j++)
      for (let i = Math.max(0, Math.floor(l / MELT)); i < Math.min(mw, Math.ceil(r / MELT)); i++) {
        let x = (i + 0.5) * MELT, y = (j + 0.5) * MELT
        let f = Math.min(1, Math.min(x - l, r - x, y - t, b - y) / FEATHER)
        if (f <= 0) continue
        let k = j * mw + i, to = f * f * (3 - 2 * f)
        if (melt[k] < to) melt[k] += (to - melt[k]) * s
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
    if (!(thickness(x, y) > 0.3)) return
    cracks.splice(next * 3, 3, x, H - y, t)
    next = (next + 1) % 4
    brush(x, y, 26, 0.8)
    freshMelt = { point: [x, y], at: t }
    stir()
  }, { signal })

  // the card under the pointer, and the one with the keyboard focus, stay melted
  let hovered: Element | null = null, focused: Element | null = null
  // (a card let go of wakes the frames too: it freezes back over)
  addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return
    let el = (e.target as Element).closest?.(HELD) ?? null
    if (el !== hovered) { hovered = el; stir() }
  }, { signal, passive: true })
  document.documentElement.addEventListener('pointerleave', () => { hovered = null; stir() }, { signal })
  addEventListener('focusin', (e) => { focused = (e.target as Element).closest?.(HELD) ?? null; stir() }, { signal })
  addEventListener('focusout', () => { focused = null; stir() }, { signal })

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
    // the focused card, and the hovered one while the pointer is still over it: a card scrolled out from
    // under the pointer is let go, and refreezes. Nothing thaws while the page is scrolling, so a card
    // moving past leaves no trail of warmth behind it.
    if (t - scrolledAt > 0.15) {
      if (focused) thaw(focused, 0.12)
      if (hovered && hovered !== focused) {
        let [l, top, r, b] = rect(hovered)
        if (ptr.x >= l && ptr.x <= r && ptr.y >= top && ptr.y <= b) thaw(hovered, 0.12)
      }
    }
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
    if (sum || meltSum) meltDirty = true
    if (Math.abs(sum - meltSum) > 0.05 + sum * 0.002) warmUntil = Math.max(warmUntil, t + 0.2)
    meltSum = sum
  }
  let meltSum = 0
  let scrolledAt = -9 // when the page last scrolled

  // one frame: only the maps that changed go up to the GPU
  let meltDirty = true
  let drawnSy = sy
  let draw = () => {
    if (meltDirty) {
      meltDirty = false
      for (let k = 0; k < melt.length; k++) meltBytes[k] = melt[k] * 255
      g.activeTexture(g.TEXTURE2)
      g.bindTexture(g.TEXTURE_2D, meltTex)
      g.texSubImage2D(g.TEXTURE_2D, 0, 0, 0, mw, mh, g.LUMINANCE, g.UNSIGNED_BYTE, meltBytes)
    }
    g.viewport(0, 0, canvas.width, canvas.height)
    g.useProgram(ice)
    g.uniform1i(u.B, 0)
    g.uniform1i(u.L, still ? 3 : 1)
    g.uniform1i(u.M, 2)
    g.uniform2f(u.R, canvas.width, canvas.height)
    g.uniform3f(u.O, 1 / (lw * LAYOUT), 1 / (lh * LAYOUT), Math.max(0, sy) - shownAt * LAYOUT)
    g.uniform2f(u.Q, still ? 0.95 : EDGE, still ? (phone ? 12 : 22) : REACH)
    g.uniform1f(u.N, navH)
    g.uniform1f(u.V, still ? 0 : Math.min(64, 2 * Math.abs(sy - drawnSy)))
    drawnSy = sy
    g.uniform1f(u.S, dpr)
    g.uniform1f(u.T, t)
    g.uniform1f(u.A, still ? 1 : Math.max(0, Math.min(1, (t - frozenAt) / FREEZE)))
    g.uniform1f(u.E, still ? 1 : Math.max(0, Math.min(1, (t - creepAt) / CREEP)))
    // the light follows the pointer for a moment after it moves, then settles where it rests
    let away = Math.min(1, Math.max(0, t - ptr.at - 1.5))
    let dx = W * 0.7, dy = H * 0.4
    g.uniform2f(u.P, ptr.x + (dx - ptr.x) * away, H - (ptr.y + (dy - ptr.y) * away))
    g.uniform3fv(u.C, still ? [0, 0, -99, 0, 0, -99, 0, 0, -99, 0, 0, -99] : cracks)
    if (animal && !still) {
      let age = (t - animal.at) / animal.time
      // Start closer to a fresh melt so the animal gets there before it refreezes.
      let p = animal.ambient ? age : 0.32 + age * 0.68
      let s = SPECIES[animal.kind]
      let [[x, y], [dx, dy]] = along(animal.path, p)
      let half = s.length / 0.8 / 2
      g.uniform1i(u.K, 4)
      g.uniform4f(u.Z, x, y, dx, dy)
      g.uniform4f(u.Y, half, (half * TH) / TW, Math.min(1, age * 6, (1 - p) * 6), t * s.beat * 6.2832)
      g.uniform1f(u.X, s.wave)
      g.uniform1f(u.D, animal.ambient ? 1 : 0)
    } else g.uniform4f(u.Y, 1, 1, 0, 0)
    g.clearColor(0, 0, 0, 0)
    g.clear(g.COLOR_BUFFER_BIT)
    g.drawArrays(g.TRIANGLES, 0, 3)
  }

  let raf = 0, then = 0, acc = 0
  let remeasure = true, released = false
  let still = root.classList.contains('is-paused')
  function go() {
    if (released || raf || still || document.hidden || signal.aborted) return
    raf = requestAnimationFrame(frame)
  }
  let swims = scheduleSwims({
    rng,
    // The class can change before its observer runs, just as a tab can hide before visibilitychange.
    allowed: () => !still && !root.classList.contains('is-paused') && !document.hidden && !signal.aborted,
    requestFrame: go,
    start: nextSwim,
  })
  let finishSwim = () => {
    animal = null
    swims.finish()
  }
  // the page moved: a frame at once, and a few more while it keeps moving
  let kick = () => {
    if (still || document.hidden) return
    warmUntil = Math.max(warmUntil, t + 0.3)
    go()
  }
  function frame(now: number) {
    raf = 0
    if (released || signal.aborted) return
    let dt = then ? Math.min(0.1, (now - then) / 1000) : 1 / 60
    then = now
    t += dt
    if (remeasure) measure()
    // a row that stopped scrolling sideways: its clear places at their usual size again
    for (let track of reslack) if (!moved.has(track)) { forget(track); reslack.delete(track) }
    upload()
    for (let track of moved.keys()) reslack.add(track)
    moved.clear()
    for (acc += dt; acc >= 1 / 60; acc -= 1 / 60) step(1 / 60)
    if (animal && t - animal.at >= animal.time) finishSwim()
    swims.frame()
    draw()
    if (still || document.hidden) { then = 0; return }
    // something melting, cracking, scrolling, freezing in or creeping, or the light still on its way back:
    // the next frame; otherwise the sheet has settled and nothing more is drawn until something moves it
    let busy = t < warmUntil || !!animal || t - ptr.at < 2.6 || t - frozenAt < FREEZE + 2 || t - creepAt < CREEP || cracks.some((c, i) => i % 3 === 2 && t - c < 9)
    if (busy) raf = requestAnimationFrame(frame)
    else {
      then = 0
      swims.settled()
    }
  }
  let halt = () => { cancelAnimationFrame(raf); raf = 0; then = 0; if (idle) cancelIdleCallback(idle); idle = 0 }

  // the page's scroll and each row's sideways scroll, read where the browser hands them over (no layout)
  addEventListener('scroll', (e) => {
    if (still) return
    let target = e.target
    if (target === document) {
      sy = scrollY
      scrolledAt = t
      // the section in the middle of the screen; a new one brings the creep (not again until it settles)
      let mid = sy + H / 2
      let now = sections.find((s) => s.t <= mid && s.b > mid)?.id ?? section
      if (now !== section) {
        if (section && t - creepAt > CREEP) creepAt = t
        section = now
      }
    } else if (offs.has(target as Element)) {
      let el = target as Element
      moved.set(el, Math.max(moved.get(el) ?? 0, Math.abs(el.scrollLeft - offs.get(el)!)))
      offs.set(el, el.scrollLeft)
      forget(el)
    } else return
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
      finishSwim()
      freshMelt = null
      melt.fill(0)
      meltDirty = true
      hovered = focused = null
      draw()
    } else {
      sy = scrollY
      remeasure = true
      swims.resume()
    }
  }
  let paused = new MutationObserver(setStill)
  paused.observe(root, { attributes: true, attributeFilter: ['class'] })
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { halt(); finishSwim(); freshMelt = null }
    else swims.resume()
  }, { signal })
  // the screen changed size: a new sheet; the page changed size, or a row got new cards: measure again
  let sized = new ResizeObserver(() => {
    if (canvas.clientWidth === W && canvas.clientHeight === H) return
    size()
    remeasure = true
    if (still) { measure(); upload(); draw() } else kick()
  })
  sized.observe(canvas)
  let again = () => { remeasure = true; kick() }
  let page = new ResizeObserver(again)
  page.observe(document.body)
  let rows = new MutationObserver(again)
  for (let track of document.querySelectorAll('[data-rail-track]')) rows.observe(track, { childList: true })
  document.fonts?.ready.then(() => { if (!signal.aborted) again() })
  // Lost (the GPU reset, or too many contexts) or taken down: every observer stops, and the GPU's memory
  // goes back at once rather than whenever the canvas is collected.
  let release = () => {
    if (released) return
    released = true
    halt()
    swims.abort()
    animal = null
    sized.disconnect()
    page.disconnect()
    rows.disconnect()
    paused.disconnect()
    if (g.isContextLost()) return
    for (let tex of [grainTex, layoutTex, meltTex, plainTex, animalTex]) g.deleteTexture(tex)
    for (let prog of programs) g.deleteProgram(prog)
    g.deleteFramebuffer(fbo)
    g.deleteBuffer(buffer)
    g.getExtension('WEBGL_lose_context')?.loseContext()
  }
  canvas.addEventListener('webglcontextlost', () => { release(); canvas.hidden = true; root.dataset.ice = 'off' }, { signal })
  signal.addEventListener('abort', release)

  size()
  measure()
  // On a first visit the title card ("Ângelo Ocanã presents") lifts at about 0.7 s: the freeze starts with it.
  let card = !root.matches('.cin-seen, .cin-skip') && !still
  let wait = card ? Math.max(0, 0.7 - performance.now() / 1000) : 0
  frozenAt = still ? -99 : wait
  canvas.dataset.on = ''
  upload()
  if (still) draw()
  else go()
  return true
}

// What swims under the ice: which one, when, and along which path.
type Kind = 'pike' | 'trout' | 'otter' | 'beaver' | 'seal'
type Point = [number, number]

// Length and speed in CSS px; sway in half-widths of the box; beat in cycles per second.
const SPECIES: Record<Kind, { weight: number; length: number; speed: number; wave: number; beat: number }> = {
  pike: { weight: 0.3, length: 190, speed: 46, wave: 0.12, beat: 0.6 },
  trout: { weight: 0.3, length: 120, speed: 62, wave: 0.2, beat: 1.1 },
  otter: { weight: 0.3, length: 150, speed: 70, wave: 0.18, beat: 0.8 },
  seal: { weight: 0.07, length: 190, speed: 52, wave: 0.14, beat: 0.4 },
  beaver: { weight: 0.03, length: 130, speed: 34, wave: 0.08, beat: 0.5 },
}
const KINDS = Object.keys(SPECIES) as Kind[]

const SWIM_GAP: Point = [5_000, 20_000] // ms from first rest or the end of a swim
const SWIM = 11 // seconds in view

export function pick(rng: () => number): Kind {
  let r = rng()
  for (let kind of KINDS) if ((r -= SPECIES[kind].weight) < 0) return kind
  return 'pike'
}

function schedule(rng: () => number) {
  let due: number | null = null
  return {
    wait(now: number) {
      due ??= now + SWIM_GAP[0] + (SWIM_GAP[1] - SWIM_GAP[0]) * rng()
      return Math.max(0, Math.ceil(due - now))
    },
    ready(now: number, allowed: boolean) {
      if (!allowed || due === null || now < due) return false
      due = null
      return true
    },
  }
}

// A timeout only wakes the scheduler; only an eligible frame can consume the deadline.
export function scheduleSwims({ rng, allowed, requestFrame, start }: {
  rng: () => number
  allowed: () => boolean
  requestFrame: () => void
  start: () => void
}, clock = {
  now: () => performance.now(),
  after: (wake: () => void, delay: number) => window.setTimeout(wake, delay),
  cancel: (timer: number) => window.clearTimeout(timer),
}) {
  let visits = schedule(rng)
  let timer: number | undefined
  let active = false, stopped = false
  let resume = () => { if (!stopped && allowed()) requestFrame() }
  let clear = () => {
    if (timer !== undefined) clock.cancel(timer)
    timer = undefined
  }
  let arm = () => {
    if (stopped || active || timer !== undefined) return
    let delay = visits.wait(clock.now())
    if (delay > 0) timer = clock.after(() => { timer = undefined; arm() }, delay)
    else resume()
  }
  return {
    settled: arm,
    resume,
    frame() {
      if (stopped || active || !visits.ready(clock.now(), allowed())) return
      clear()
      active = true
      start()
    },
    finish() {
      if (!active) return
      active = false
      arm()
    },
    abort() {
      stopped = true
      clear()
    },
  }
}

// Pick a gentle arc that passes through the thickest ice close to the pointer.
export function plan(rng: () => number, near: Point, distance: number, thickness: (x: number, y: number) => number): [Point, Point, Point] | null {
  let best: [Point, Point, Point] | null = null, top = 0
  for (let n = 0; n < 12; n++) {
    let a = (rng() - 0.5) * 1.1 + (rng() < 0.5 ? 0 : Math.PI)
    let dx = Math.cos(a), dy = Math.sin(a)
    let mx = near[0] + (rng() - 0.5) * 88, my = near[1] + (rng() - 0.5) * 88
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

// Position on the arc (u from 0 to 1) and direction of travel.
export function along([a, b, c]: [Point, Point, Point], u: number): [Point, Point] {
  let v = 1 - u
  let x = v * v * a[0] + 2 * v * u * b[0] + u * u * c[0], y = v * v * a[1] + 2 * v * u * b[1] + u * u * c[1]
  let tx = v * (b[0] - a[0]) + u * (c[0] - b[0]), ty = v * (b[1] - a[1]) + u * (c[1] - b[1])
  let d = Math.hypot(tx, ty) || 1
  return [[x, y], [tx / d, ty / d]]
}

// Silhouettes seen from above with the head to the right, spanning the middle 80% of the texture.
// Each outline is a width profile along the body (0 the tail, 1 the nose).
const TW = 160, TH = 64
const X0 = TW * 0.1, LEN = TW * 0.8, CY = TH / 2
let px = (f: number) => X0 + f * LEN

function outline(ctx: CanvasRenderingContext2D, profile: Point[]) {
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
// A fish's tail, from where it joins the body (f, half-width w) out to the fork (spread, notched to n).
let tail = (ctx: CanvasRenderingContext2D, f: number, w: number, spread: number, n: number) => {
  // Clockwise on the screen, like every other part, so the parts' fills do not cancel where they overlap.
  ctx.moveTo(px(f), CY + w)
  ctx.lineTo(px(0), CY + spread)
  ctx.lineTo(px(n), CY)
  ctx.lineTo(px(0), CY - spread)
  ctx.lineTo(px(f), CY - w)
  ctx.closePath()
}
let pair = (ctx: CanvasRenderingContext2D, f: number, out: number, rx: number, ry: number, sweep: number) => {
  oval(ctx, f, -out, rx, ry, -sweep)
  oval(ctx, f, out, rx, ry, sweep)
}

const SHAPES: Record<Kind, (ctx: CanvasRenderingContext2D) => void> = {
  // A long narrow body, fins far back, and a flat snout.
  pike(ctx) {
    outline(ctx, [[0.1, 1.2], [0.2, 3], [0.38, 5.5], [0.6, 6.5], [0.78, 6], [0.9, 4.6], [0.97, 3], [1, 1.6]])
    tail(ctx, 0.13, 1.5, 7, 0.05)
    pair(ctx, 0.3, 6, 6, 1.8, 0.5)
    pair(ctx, 0.72, 6.5, 6, 2, 0.6)
  },
  // A spindle, forked tail and splayed fins.
  trout(ctx) {
    outline(ctx, [[0.14, 1.6], [0.28, 5.5], [0.48, 9], [0.68, 9.5], [0.86, 7], [0.96, 4], [1, 2]])
    tail(ctx, 0.17, 2, 10, 0.03)
    pair(ctx, 0.74, 9, 8, 2.6, 0.7)
    pair(ctx, 0.38, 6, 6, 2, 0.6)
  },
  // A long body, tapering tail, tucked paws and a round head.
  otter(ctx) {
    outline(ctx, [[0, 0.6], [0.14, 2.6], [0.32, 5], [0.42, 8.5], [0.62, 9.5], [0.8, 7.5], [0.86, 6], [0.92, 7.2], [0.98, 5], [1, 2.4]])
    pair(ctx, 0.44, 9, 6, 2.6, 0.8)
    pair(ctx, 0.76, 8, 5, 2.2, 0.9)
  },
  // A heavy body, paddle tail, webbed hind feet and a small head.
  beaver(ctx) {
    outline(ctx, [[0.23, 2.3], [0.36, 11], [0.55, 15], [0.74, 13], [0.85, 8], [0.9, 8.5], [0.98, 6], [1, 3]])
    oval(ctx, 0.14, 0, 15, 8.5)
    pair(ctx, 0.36, 13, 7, 4, 0.6)
    pair(ctx, 0.78, 11, 3.5, 2.2, 0.8)
  },
  // A plump torpedo, fore-flippers and a V of hind flippers.
  seal(ctx) {
    outline(ctx, [[0.12, 2], [0.24, 7.5], [0.44, 13], [0.64, 14], [0.84, 10.5], [0.95, 7], [1, 3.4]])
    pair(ctx, 0.62, 14, 9, 3, 0.7)
    oval(ctx, 0.05, -4, 9, 3.5, -0.35)
    oval(ctx, 0.05, 4, 9, 3.5, 0.35)
  },
}

// Draw only the shadows (the shapes themselves are off the canvas): a wide green one is the water
// around it, a sharper red one its body. An opaque black canvas, so no alpha to undo.
function drawAnimal(canvas: HTMLCanvasElement, kind: Kind) {
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
