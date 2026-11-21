import { clipPoster } from '../clip-card.ts'
import type { Motion } from './motion.ts'
import type { setUpClips } from './clips.ts'

type Clips = ReturnType<typeof setUpClips>

// One row ([data-rail]): scroll down to move between rows, sideways (trackpad, swipe, drag, the arrow
// buttons or the keyboard) to see more inside one. For each row this:
//   - drives the arrows ([data-rail-prev] / [data-rail-next]), disabling the one with nowhere to go, and
//     marks the row's start and end
//   - appends the rest of a row's clips from its [data-more] JSON when the row comes near
//   - lets a mouse drag the row (touch and trackpads scroll natively); a press on text selects it instead
//   - slides the row to a card when a [data-rail-jump] link to it is clicked, and keeps that link lit
//   - shuffles the home row's clips so hobbies take turns ([data-shuffle]); starred clips stay first
//   - fades the row's backdrop ([data-rail-bg]) to the poster of the slide in view
//   - keeps one clip's Instagram link in the Tab order (the arrow keys move it)
// It returns what rails/nav.ts asks of the row, read from the same cached boxes.
export interface Rail {
  /** The card to carry to the other language, from the cached boxes. */
  cardInView(): HTMLElement | undefined
}

export function setUpRail(rail: HTMLElement, { signal, motion, clips }: { signal: AbortSignal; motion: Motion; clips: Clips }): Rail {
  let track = rail.querySelector<HTMLElement>('[data-rail-track]')!
  let bg = rail.querySelector<HTMLElement>('[data-rail-bg]')
  // the cards shown (on phones a row's opening card is display: none: its words sit above the row)
  let slides = () => [...track.children].filter((el) => (el as HTMLElement).offsetWidth) as HTMLElement[]

  let intro = track.querySelector<HTMLElement>(':scope > .intro-slide')
  let prev = rail.querySelector<HTMLButtonElement>('[data-rail-prev]')
  let next = rail.querySelector<HTMLButtonElement>('[data-rail-next]')
  let more = track.dataset.more
  // a row with more clips to come is dealt once they are all in, before it scrolls into view
  if (track.hasAttribute('data-shuffle') && !more) clips.shuffle(track)
  if (more) {
    // the row coming near loads them; after a failed load the row coming near again, or coming to rest
    // after a sideways scroll, tries again (and so does a hobby chip)
    let loaded = false
    let load = async () => {
      if (loaded) return
      loaded = await clips.loadMore(track)
      if (loaded) { near.disconnect(); track.removeEventListener('scrollend', load) }
    }
    let near = new IntersectionObserver((entries) => { if (entries.at(-1)?.isIntersecting) load() }, { rootMargin: '150% 0px' })
    near.observe(rail)
    track.addEventListener('scrollend', load, { signal, passive: true })
    signal.addEventListener('abort', () => near.disconnect())
  }

  // Where each slide sits in the row, measured from the layout (offsetLeft/Width ignore the slide-in
  // animation and the row's sideways scroll) and kept until the row or a card changes size or the row gets
  // new cards. A scroll frame then reads only scrollLeft: no layout, no getBoundingClientRect.
  type Box = { el: HTMLElement; l: number; r: number; h: number; poster: string }
  let kind = track.dataset.count
  let boxes: Box[] = []
  let thingBoxes: Box[] = []
  let byEl = new Map<Element, Box>()
  let tallest = 0
  let width = 0
  let max = 0
  let stale = true
  let measure = () => {
    stale = false
    let origin = track.offsetLeft + track.clientLeft
    boxes = slides().map((el) => ({ el, l: el.offsetLeft - origin, r: el.offsetLeft - origin + el.offsetWidth, h: el.offsetHeight, poster: bg ? clipPoster(el) : '' }))
    byEl = new Map(boxes.map((b) => [b.el, b]))
    // the row's things: the slides of its [data-count] class, or every slide shown; the page may carry only
    // some of them, and data-total says how many there are in all (the clips: known when the page is built)
    thingBoxes = kind ? boxes.filter((b) => b.el.classList.contains(kind!)) : boxes
    tallest = Math.max(0, ...boxes.map((b) => b.h))
    width = track.clientWidth
    max = track.scrollWidth - width
  }
  let invalidate = () => { stale = true; request() }
  let sized = new ResizeObserver(invalidate)
  let observeAll = () => { sized.observe(track); for (let el of track.children) sized.observe(el) }
  observeAll()
  let added = new MutationObserver(() => { observeAll(); invalidate() })
  added.observe(track, { childList: true })
  signal.addEventListener('abort', () => { sized.disconnect(); added.disconnect() })
  // the part of the row in view, in the same coordinates as the boxes
  let view = () => ({ l: track.scrollLeft, r: track.scrollLeft + width })
  // how much of a slide shows inside the row (0 to 1)
  let shownBox = (b: Box | undefined, v: { l: number; r: number }) => (b && b.r > b.l ? Math.max(0, Math.min(b.r, v.r) - Math.max(b.l, v.l)) / (b.r - b.l) : 0)
  let shown = (el: Element) => { if (stale) measure(); return shownBox(byEl.get(el), view()) }
  let totalOf = (n: number) => Math.max(n, Number(track.dataset.total) || 0)

  // The linked card: the one a #job-… / #clip-… in the address, a hobby chip or a jump link asked for. The
  // flag carries it (cardInView) instead of whatever the row shows first, which matters when the row ended
  // before the card could line up at its left edge, and while the row is still on its way there.
  type Linked =
    // nothing asked for: the flag carries the first card mostly in view
    | { state: 'idle' }
    // a #hash is waiting to be shown, maybe for the rest of the clips to load
    | { state: 'arriving'; id: string }
    // the row is sliding to a picked card (a chip, a jump link): that card is the one in view already
    | { state: 'travelling'; card: HTMLElement }
    // the row came to rest on the card: it stays the one to carry while it is at least half in view (moved
    // some other way than by hand, the row lets it go once it has mostly gone)
    | { state: 'settled'; card: HTMLElement; hash: boolean }
  let linked: Linked = { state: 'idle' }
  // rails/nav.ts follows the row's scroll; a change here may come without one
  let setLinked = (next: Linked) => { linked = next; track.dispatchEvent(new Event('linkchange')) }
  // Any sideways move of the visitor's own (a trackpad or a wheel, a drag, a swipe, the arrow keys or the
  // row's buttons) ends all of that, read from the input itself, never from where the row's scroll went.
  let userMoved = () => { if (linked.state !== 'idle') setLinked({ state: 'idle' }) }
  track.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || (event.shiftKey && event.deltaY)) userMoved()
  }, { signal, passive: true })
  let touch: { x: number; y: number } | null = null
  track.addEventListener('touchstart', (event) => { touch = { x: event.touches[0].clientX, y: event.touches[0].clientY } }, { signal, passive: true })
  track.addEventListener('touchmove', (event) => {
    let dx = Math.abs(event.touches[0].clientX - (touch?.x ?? 0))
    if (touch && dx > 6 && dx > Math.abs(event.touches[0].clientY - touch.y)) { touch = null; userMoved() }
  }, { signal, passive: true })
  track.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) userMoved()
  }, { signal })
  // The page scrolled by hand since the #hash came (a wheel, a swipe, the keys): its card still lines up
  // along the row, but the page stays where the visitor took it.
  let pageTouched = false
  let touchPage = () => { pageTouched = true }
  addEventListener('wheel', (event) => { if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) touchPage() }, { signal, passive: true })
  addEventListener('touchmove', touchPage, { signal, passive: true })
  addEventListener('keydown', (event) => { if ([' ', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) touchPage() }, { signal })

  // "12 / 115" under a long row: the last of its things that is mostly in view, out of all of them,
  // and a thin bar that fills as you go
  let count = rail.querySelector<HTMLElement>('[data-rail-count]')
  let countText = (atEnd: boolean, v: { l: number; r: number }) => {
    if (!count || !kind || !thingBoxes.length) return null
    let total = totalOf(thingBoxes.length)
    let seen = atEnd ? thingBoxes.length : thingBoxes.filter((b) => b.l + (b.r - b.l) * 0.6 <= v.r).length
    return { text: `${seen} / ${total}`, done: (seen / total) * 100 }
  }

  // Where the row came to rest, for screen readers: "3 to 4 of 9", said once scrolling settles (not on
  // every frame of it), and only while focus is in this row.
  let live = rail.querySelector<HTMLElement>('[data-rail-live]')
  let at = JSON.parse(document.querySelector<HTMLElement>('main')?.dataset.at ?? '{}') as { one?: string; some?: string; less?: string }
  let settled = 0
  let announce = () => {
    if (!live || !at.one || !rail.contains(document.activeElement)) return
    if (stale) measure()
    let v = view()
    let inView = thingBoxes.map((b, i) => (shownBox(b, v) >= 0.6 ? i + 1 : 0)).filter(Boolean)
    if (!inView.length) return
    let [a, b] = [inView[0], inView.at(-1)!]
    let text = (a === b ? at.one : at.some!).replace('{a}', String(a)).replace('{b}', String(b)).replace('{n}', String(totalOf(thingBoxes.length)))
    if (live.textContent !== text) live.textContent = text
  }
  let settle = () => {
    clearTimeout(settled)
    settled = window.setTimeout(announce, 250)
  }
  track.addEventListener('scroll', settle, { signal, passive: true })
  signal.addEventListener('abort', () => clearTimeout(settled))

  // The career's cards differ a lot in height (on a phone, 360 to 1,330 px), and the row is as tall as its
  // tallest. Where the cards in view are shorter, the row gives the difference back: --lift (home.css) clips
  // the row by that much and pulls what follows it up, so the row ends under its tallest card in view.
  // It changes only once the row comes to rest, never during a swipe, so the page under it never moves while
  // the row scrolls; then it eases to the new height (a taller card swiped in shows cut short until then).
  // No other row uses it.
  let lifts = rail.classList.contains('row-career')
  let liftTimer = 0
  // Nor while the page itself scrolls: opened at a #clip-… further down, the browser is still on its way there
  // when the row is first measured, and the page getting shorter above it would carry it past the clip. At
  // rest, the browser keeps what is on screen in place as the row's height changes above it.
  let pageY = -1
  let settleLift = () => {
    clearTimeout(liftTimer)
    liftTimer = window.setTimeout(function apply() {
      if (scrollY !== pageY) { pageY = scrollY; liftTimer = window.setTimeout(apply, 160); return }
      if (stale) measure()
      let v = view()
      // every card with any of it in view, the slice of one peeking in at a side too: none is ever cut short
      let lift = Math.round(tallest - Math.max(0, ...boxes.filter((b) => shownBox(b, v) > 0).map((b) => b.h)))
      if (lift !== last.lift) rail.style.setProperty('--lift', `${(last.lift = lift)}px`)
    }, 160)
  }
  signal.addEventListener('abort', () => clearTimeout(liftTimer))
  let queued = false
  let lastBg = ''
  let last = { peekL: -1, peekR: -1, lift: -1, start: false, end: false, introAway: false, text: '' }
  function update() {
    queued = false
    // reads: the cached boxes and the row's scroll, nothing else
    if (stale) measure()
    let v = view()
    let atStart = v.l < 8
    let atEnd = v.l > max - 8
    // only a card that peeks in at an edge fades out (--peek-l and --peek-r: how much of it shows); a
    // card that is mostly in view never does
    let peekAt = (side: 'l' | 'r') => {
      let x = v[side]
      let edge = boxes.find((b) => b.l < x - 1 && b.r > x + 1)
      if (!edge || shownBox(edge, v) >= 0.6) return 0
      return Math.round(side === 'r' ? x - edge.l : edge.r - x)
    }
    let peekL = peekAt('l')
    let peekR = peekAt('r')
    let introAway = intro ? shownBox(byEl.get(intro), v) < 0.5 : false
    let counted = countText(atEnd, v)
    // backdrop follows the first video slide that is mostly in view
    let poster = ''
    if (bg) {
      let b = boxes.find((b) => b.poster && b.l >= v.l - (b.r - b.l) * 0.3 && b.r <= v.r + (b.r - b.l) * 0.3)
      poster = b?.poster ?? ''
    }

    // writes, only of what changed
    if (counted && count && counted.text !== last.text) {
      last.text = counted.text
      count.innerHTML = `<span>${counted.text}</span><i></i>`
      count.style.setProperty('--done', `${counted.done}%`)
    }
    if (atStart !== last.start || atEnd !== last.end) {
      last.start = atStart
      last.end = atEnd
      rail.toggleAttribute('data-at-start', atStart)
      rail.toggleAttribute('data-at-end', atEnd)
      // a disabled arrow leaves the Tab order; if it had focus, the other one takes it
      let lost = (atStart && document.activeElement === prev) || (atEnd && document.activeElement === next)
      if (prev) prev.disabled = atStart
      if (next) next.disabled = atEnd
      if (lost) (atStart ? next : prev)?.focus({ preventScroll: true })
    }
    if (peekL !== last.peekL) track.style.setProperty('--peek-l', `${(last.peekL = peekL)}px`)
    if (peekR !== last.peekR) track.style.setProperty('--peek-r', `${(last.peekR = peekR)}px`)
    if (lifts) settleLift()
    // the row's opening card ("More on Instagram"), once scrolled away, leaves the Tab order: Tab into the
    // row goes on from the cards in view instead of scrolling it back to the start
    if (intro && introAway !== last.introAway) {
      last.introAway = introAway
      for (let a of intro.querySelectorAll<HTMLElement>('a, button')) {
        if (introAway && a !== document.activeElement) a.tabIndex = -1
        else if (!introAway) a.removeAttribute('tabindex')
      }
    }
    if (bg && poster && poster !== lastBg) {
      lastBg = poster
      let layer = document.createElement('i')
      layer.style.backgroundImage = `url("${poster}")`
      bg.append(layer)
      requestAnimationFrame(() => layer.classList.add('on'))
      let old = [...bg.children].slice(0, -2)
      setTimeout(() => old.forEach((el) => el.remove()), 1200)
    }
    rove()
  }
  function request() {
    if (!queued) { queued = true; requestAnimationFrame(update) }
  }
  track.addEventListener('scroll', request, { signal, passive: true })
  addEventListener('resize', invalidate, { signal })

  // Hobby chips over the row ([data-rail-cat]): each slides the row to the first clip of its hobby,
  // loading the rest of the clips first when they aren't in yet.
  // The chip stays lit (aria-pressed) only while the clip it jumped to is in view: hobbies take turns
  // in the row, so once you move on it goes out, and never reads as a filter on the whole row.
  let chips = [...rail.querySelectorAll<HTMLButtonElement>('[data-rail-cat]')]
  let picked: HTMLElement | null = null
  let pick = (chip: HTMLButtonElement | null, clip: HTMLElement | null = null) => {
    picked = clip
    for (let other of chips) other.setAttribute('aria-pressed', String(other === chip))
  }
  let checkPicked = () => {
    if (!picked || track.classList.contains('is-jumping')) return
    if (shown(picked) < 0.5) pick(null)
  }
  let unpickTimer = 0
  if (chips.length) {
    track.addEventListener('scroll', () => {
      clearTimeout(unpickTimer)
      unpickTimer = window.setTimeout(checkPicked, 200)
    }, { signal, passive: true })
  }
  // more chips than fit: home.css fades the side where some are out of sight
  let chipRow = rail.querySelector<HTMLElement>('.clip-chips')
  if (chipRow) {
    let row = chipRow
    let edges = () => {
      row.toggleAttribute('data-more-l', row.scrollLeft > 2)
      row.toggleAttribute('data-more-r', row.scrollLeft < row.scrollWidth - row.clientWidth - 2)
    }
    row.addEventListener('scroll', edges, { signal, passive: true })
    let fits = new ResizeObserver(edges)
    fits.observe(row)
    signal.addEventListener('abort', () => fits.disconnect())
  }
  for (let chip of chips) {
    chip.addEventListener('click', async () => {
      chip.setAttribute('aria-busy', 'true')
      await clips.loadMore(track)
      chip.removeAttribute('aria-busy')
      let first = track.querySelector<HTMLElement>(`[data-cat="${chip.dataset.railCat}"]`)
      if (!first) return
      pick(chip, first)
      slideTo(first, true)
    }, { signal })
  }

  // The clips' Instagram links: one Tab stop for the whole row, on the clip in view (a roving tabindex).
  // From there the left and right arrows move to the clip before or after it, and Enter opens its post.
  let links = () => [...track.querySelectorAll<HTMLAnchorElement>('.clip-ig')]
  let roving = !!track.querySelector('[data-clip]')
  let lastRove: HTMLAnchorElement | null = null
  function rove() {
    if (!roving) return
    let v = view()
    // the first clip with a link whose link (in its top right corner) is in view
    let current: HTMLAnchorElement | null = null
    for (let b of boxes) {
      if (b.r - 48 < v.l) continue
      current = b.el.querySelector<HTMLAnchorElement>(':scope > .clip-ig')
      if (current) break
    }
    if (!current || current === lastRove || links().includes(document.activeElement as HTMLAnchorElement)) return
    lastRove?.setAttribute('tabindex', '-1')
    if (!lastRove) for (let a of links()) a.tabIndex = -1
    current.tabIndex = 0
    lastRove = current
  }
  // the page's clip links are ordinary links until now (no JS, no roving); new clips come in out of the Tab
  // order (tabIndex -1), so the one link that has it stays the only one
  if (roving) for (let a of links()) a.tabIndex = -1
  update()
  if (roving) {
    track.addEventListener('keydown', (event) => {
      let link = (event.target as Element).closest<HTMLAnchorElement>('.clip-ig')
      let dir = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
      if (!link || !dir) return
      let all = links()
      let to = all[all.indexOf(link) + dir]
      event.preventDefault()
      if (!to) return
      link.tabIndex = -1
      to.tabIndex = 0
      lastRove = to
      to.focus({ preventScroll: true })
      to.closest('.slide')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: motion.reduced ? 'auto' : 'smooth' })
    }, { signal })
  }

  // Slides the row so a card starts at its left edge, the page staying put. Snapping is off for the trip:
  // off screen the card is still shrunk by its slide-in animation, and the browser would line up with
  // that smaller box, a few pixels short.
  // A picked card (carry: a chip or a jump link) is the one to carry from the start of the trip, and its
  // #id replaces the address's (no new history entry). Any other slide was the visitor's own (Tab).
  function slideTo(slide: HTMLElement, carry = false) {
    track.classList.add('is-jumping')
    let left = slide.offsetLeft - slides()[0].offsetLeft
    let trip: Linked = carry ? { state: 'travelling', card: slide } : { state: 'idle' }
    setLinked(trip)
    let landed = () => {
      track.classList.remove('is-jumping')
      if (linked === trip) setLinked({ state: 'settled', card: slide, hash: false })
    }
    if (carry) history.replaceState(history.state, '', `#${slide.id}`)
    if (Math.abs(Math.min(left, track.scrollWidth - track.clientWidth) - track.scrollLeft) < 2) return landed()
    track.addEventListener('scrollend', landed, { once: true, signal })
    setTimeout(landed, 1500)
    track.scrollTo({ left, behavior: motion.reduced ? 'auto' : 'smooth' })
  }
  // Tab onto a link or a button in a card the row shows only part of (the next job, peeking in at the
  // edge): the browser brings just that link into view, leaving the card a sliver, so the row slides to the
  // card instead. Keyboard focus only (a click on a card's link leaves the row where it is); the clips have
  // their own keys (above), and a jump link moves the row itself.
  track.addEventListener('focusin', (event) => {
    let target = event.target as HTMLElement
    let slide = target.closest<HTMLElement>('.slide')
    if (!slide || slide === target || slide.dataset.clip || !target.matches(':focus-visible')) return
    // (a card wider than the row never shows whole: the browser's own scrolling to the link does better)
    if (shown(slide) < 0.98 && slide.offsetWidth <= track.clientWidth) slideTo(slide)
  }, { signal })

  // The page opened at one of this row's cards (#job-… or #clip-…, carried by the other language's flag),
  // or a link changed the #hash to one. The browser only scrolls the row until the card is somewhere in view,
  // often at its right edge with the card before it taking the screen: the row moves on so the card is its
  // first one, at once. The browser brings the page to the card itself (its top under the menu:
  // scroll-margin-top, home.css), smoothly, and a scroll of ours on top would knock it off course; but a clip
  // not in the page yet it never found, so the page goes to that one here. A clip may wait for the rest of the
  // clips, and the row deals them again once they are all in, so a clip waits for the whole row.
  //
  // Back, forward or a reload: the browser puts the page back where the visitor left it. The #hash is only
  // where the row was on the way there (a chip writes it), so it never moves the page then; if the visitor
  // left from this row, it still lines the row up on that card, sideways only. (A page kept whole in the
  // back/forward cache runs none of this: everything is as it was left.)
  let restoring = ['back_forward', 'reload'].includes((performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type ?? '')
  let toHash = async (opened: boolean) => {
    let id = location.hash.slice(1)
    let find = () => track.querySelector<HTMLElement>(`:scope > [id="${CSS.escape(id)}"]`)
    if (!id.startsWith('clip-') && !id.startsWith('job-')) return
    let missing = !find()
    if (missing && !(more && id.startsWith('clip-'))) return
    let wait: Linked = { state: 'arriving', id }
    setLinked(wait)
    if (more && id.startsWith('clip-')) await clips.loadMore(track)
    let restored = opened && restoring
    if (restored) {
      if (document.readyState !== 'complete') await new Promise((done) => addEventListener('load', done, { once: true, signal }))
      await new Promise(requestAnimationFrame)
    }
    let slide = find()
    if (linked !== wait || !slide || location.hash.slice(1) !== id) return linked === wait ? setLinked({ state: 'idle' }) : undefined
    if (restored) {
      let box = rail.getBoundingClientRect()
      if (box.bottom < innerHeight * 0.25 || box.top > innerHeight * 0.75) return setLinked({ state: 'idle' })
    }
    track.classList.add('is-jumping')
    track.scrollLeft = slide.offsetLeft - slides()[0].offsetLeft
    requestAnimationFrame(() => track.classList.remove('is-jumping'))
    if (missing && !restored && !pageTouched) {
      // measured from the row, not from the card, which may still be growing into place (slide-in)
      let top = track.getBoundingClientRect().top + slide.offsetTop - (slide.offsetParent === track ? 0 : track.offsetTop)
      let margin = parseFloat(getComputedStyle(slide).scrollMarginTop) || 0
      scrollTo({ top: scrollY + top - margin, behavior: opened || motion.reduced ? 'instant' : 'smooth' })
    }
    setLinked({ state: 'settled', card: slide, hash: true })
    for (let link of rail.querySelectorAll<HTMLAnchorElement>('a[data-rail-jump]')) link.toggleAttribute('data-picked', link.hash === location.hash)
  }
  toHash(true)
  // the page's late fonts and images move the cards once it has loaded: a #hash card nobody has moved away
  // from lines up again
  addEventListener('load', () => { if (linked.state === 'settled' && linked.hash && !restoring) toHash(true) }, { signal, once: true })
  addEventListener('hashchange', () => { pageTouched = false; setLinked({ state: 'idle' }); toHash(false) }, { signal })

  // arrows: page by the width of what is visible
  rail.addEventListener('click', (event) => {
    let target = event.target as Element
    let dir = target.closest('[data-rail-next]') ? 1 : target.closest('[data-rail-prev]') ? -1 : 0
    if (dir) {
      userMoved()
      track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: motion.reduced ? 'auto' : 'smooth' })
    }

    // a job's "+12 more" (phones): shows its other tags in place, saying "Show fewer" then, or folds them
    // again (home.css); the card grows, and the row's height follows it (the ResizeObserver above)
    let moreTags = target.closest<HTMLButtonElement>('.tech-more button')
    if (moreTags) {
      let open = moreTags.getAttribute('aria-expanded') !== 'true'
      moreTags.dataset.more ??= moreTags.textContent ?? ''
      moreTags.setAttribute('aria-expanded', String(open))
      moreTags.textContent = open ? at.less ?? '' : moreTags.dataset.more
    }

    // a jump link ([data-rail-jump], like the career intro's list) slides the row to its card, page staying put
    let jump = target.closest<HTMLAnchorElement>('a[data-rail-jump]')
    let slide = jump && track.querySelector<HTMLElement>(`[id="${jump.hash.slice(1)}"]`)
    // a row that fits on the screen has nothing to slide: the link just scrolls the page
    let sideways = track.scrollWidth > track.clientWidth + 8
    if (slide && sideways) {
      event.preventDefault()
      slideTo(slide, true)
      // the last one picked stays lit, so swiping back to the list shows where you were
      for (let link of rail.querySelectorAll('a[data-rail-jump]')) link.toggleAttribute('data-picked', link === jump)
      slide.tabIndex = -1
      slide.focus({ preventScroll: true })
    }
  }, { signal })

  // mouse drag (touch and trackpads already scroll sideways on their own)
  let drag: { x: number; left: number; moved: boolean } | null = null
  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    if ((event.target as Element).closest('a, button, video[controls], input')) return
    if (onText(event)) return
    drag = { x: event.clientX, left: track.scrollLeft, moved: false }
  }, { signal })
  addEventListener('pointermove', (event) => {
    if (!drag) return
    let dx = event.clientX - drag.x
    if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; userMoved(); track.classList.add('is-dragging') }
    if (drag.moved) track.scrollLeft = drag.left - dx
  }, { signal })
  addEventListener('pointerup', () => {
    if (!drag) return
    let moved = drag.moved
    drag = null
    track.classList.remove('is-dragging')
    if (moved) {
      // swallow the click that follows a drag
      track.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation() }, { capture: true, once: true })
    }
  }, { signal })

  // The menu asks on every frame of a page scroll, when the row hasn't moved: the answer is kept until the
  // row's scroll, its cards' boxes or the linked card change.
  let asked: { left: number; boxes: Box[]; linked: Linked; card: HTMLElement | undefined } | undefined
  return {
    cardInView() {
      if (stale) measure()
      let v = view()
      if (asked && asked.left === v.l && asked.boxes === boxes && asked.linked === linked) return asked.card
      let card =
        linked.state === 'travelling' ? linked.card
        : linked.state === 'settled' && shownBox(byEl.get(linked.card), v) >= 0.5 ? linked.card
        : boxes.find((b) => b.r - v.l > (b.r - b.l) * 0.6)?.el
      asked = { left: v.l, boxes, linked, card }
      return card
    },
  }
}

// Is the pointer over the letters of some text (not just inside a box that holds text)?
function onText(event: PointerEvent) {
  let el = event.target as Element
  for (let node of el.childNodes) {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue
    let range = document.createRange()
    range.selectNodeContents(node)
    for (let r of range.getClientRects()) {
      if (event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom) return true
    }
  }
  return false
}
