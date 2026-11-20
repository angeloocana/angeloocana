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
export function setUpRail(rail: HTMLElement, { signal, motion, clips }: { signal: AbortSignal; motion: Motion; clips: Clips }) {
  let track = rail.querySelector<HTMLElement>('[data-rail-track]')!
  let bg = rail.querySelector<HTMLElement>('[data-rail-bg]')
  let slides = () => [...track.children].filter((el) => !(el as HTMLElement).hidden) as HTMLElement[]

  let intro = track.querySelector<HTMLElement>(':scope > .intro-slide')
  let prev = rail.querySelector<HTMLButtonElement>('[data-rail-prev]')
  let next = rail.querySelector<HTMLButtonElement>('[data-rail-next]')
  let more = track.dataset.more
  // a row with more clips to come is dealt once they are all in, before it scrolls into view
  if (track.hasAttribute('data-shuffle') && !more) clips.shuffle(track)
  if (more) {
    let near = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      near.disconnect()
      clips.loadMore(track)
    }, { rootMargin: '150% 0px' })
    near.observe(rail)
    signal.addEventListener('abort', () => near.disconnect())
  }

  // How much of a slide shows inside the row (0 to 1).
  let shown = (el: Element, view: DOMRect) => {
    let r = el.getBoundingClientRect()
    return r.width ? Math.max(0, Math.min(r.right, view.right) - Math.max(r.left, view.left)) / r.width : 0
  }
  // the row's things: the slides of its [data-count] class, or every slide; the page may carry only
  // some of them, and data-total says how many there are in all (the clips: known when the page is built)
  let kind = track.dataset.count
  let things = () => (kind ? ([...track.getElementsByClassName(kind)] as HTMLElement[]) : slides().filter((el) => getComputedStyle(el).display !== 'none'))
  let totalOf = (items: HTMLElement[]) => Math.max(items.length, Number(track.dataset.total) || 0)

  // "12 / 115" under a long row: the last of its things that is mostly in view, out of all of them,
  // and a thin bar that fills as you go
  let count = rail.querySelector<HTMLElement>('[data-rail-count]')
  let showCount = (atEnd: boolean) => {
    if (!count || !kind) return
    let items = things()
    if (!items.length) return
    let total = totalOf(items)
    let right = track.getBoundingClientRect().right
    let seen = atEnd ? items.length : items.filter((el) => el.getBoundingClientRect().left + el.offsetWidth * 0.6 <= right).length
    let text = `${seen} / ${total}`
    if (count.dataset.text === text) return
    count.dataset.text = text
    count.innerHTML = `<span>${text}</span><i></i>`
    count.style.setProperty('--done', `${(seen / total) * 100}%`)
  }

  // Where the row came to rest, for screen readers: "3 to 4 of 9", said once scrolling settles (not on
  // every frame of it), and only while focus is in this row.
  let live = rail.querySelector<HTMLElement>('[data-rail-live]')
  let at = JSON.parse(track.dataset.at ?? '{}') as { one?: string; some?: string }
  let settled = 0
  let announce = () => {
    if (!live || !at.one || !rail.contains(document.activeElement)) return
    let items = things()
    let view = track.getBoundingClientRect()
    let inView = items.map((el, i) => (shown(el, view) >= 0.6 ? i + 1 : 0)).filter(Boolean)
    if (!inView.length) return
    let [a, b] = [inView[0], inView.at(-1)!]
    let text = (a === b ? at.one : at.some!).replace('{a}', String(a)).replace('{b}', String(b)).replace('{n}', String(totalOf(items)))
    if (live.textContent !== text) live.textContent = text
  }
  let settle = () => {
    clearTimeout(settled)
    settled = window.setTimeout(announce, 250)
  }
  track.addEventListener('scroll', settle, { signal, passive: true })
  signal.addEventListener('abort', () => clearTimeout(settled))

  let queued = false
  let lastBg = ''
  function update() {
    queued = false
    let list = slides()
    let max = track.scrollWidth - track.clientWidth
    let atStart = track.scrollLeft < 8
    let atEnd = track.scrollLeft > max - 8
    showCount(atEnd)
    rail.toggleAttribute('data-at-start', atStart)
    rail.toggleAttribute('data-at-end', atEnd)
    // a disabled arrow leaves the Tab order; if it had focus, the other one takes it
    let lost = (atStart && document.activeElement === prev) || (atEnd && document.activeElement === next)
    if (prev) prev.disabled = atStart
    if (next) next.disabled = atEnd
    if (lost) (atStart ? next : prev)?.focus({ preventScroll: true })
    // only a card that peeks in at an edge fades out (--peek-l and --peek-r: how much of it shows); a
    // card that is mostly in view never does
    let view = track.getBoundingClientRect()
    let peekAt = (side: 'left' | 'right') => {
      let x = view[side]
      let edge = list.find((s) => {
        let r = s.getBoundingClientRect()
        return r.left < x - 1 && r.right > x + 1
      })
      if (!edge || shown(edge, view) >= 0.6) return 0
      let r = edge.getBoundingClientRect()
      return Math.round(side === 'right' ? x - r.left : r.right - x)
    }
    track.style.setProperty('--peek-l', `${peekAt('left')}px`)
    track.style.setProperty('--peek-r', `${peekAt('right')}px`)
    // how much shorter the tallest card in view is than the row (which keeps its tallest card's height):
    // the career's "Next" pill moves up by that much (site.css, a transform, so the page never moves)
    let tallest = Math.max(0, ...list.map((s) => s.offsetHeight))
    let inView = Math.max(0, ...list.filter((s) => shown(s, view) > 0).map((s) => s.offsetHeight))
    rail.style.setProperty('--lift', `${tallest - inView}px`)
    // the row's opening card ("More on Instagram"), once scrolled away, leaves the Tab order: Tab into the
    // row goes on from the cards in view instead of scrolling it back to the start
    if (intro) {
      let away = shown(intro, view) < 0.5
      for (let a of intro.querySelectorAll<HTMLElement>('a, button')) {
        if (away && a !== document.activeElement) a.tabIndex = -1
        else if (!away) a.removeAttribute('tabindex')
      }
    }
    if (bg) {
      // backdrop follows the first video slide that is mostly in view
      let shown = list.find((s) => {
        let r = s.getBoundingClientRect()
        return s.dataset.poster && r.left >= view.left - r.width * 0.3 && r.right <= view.right + r.width * 0.3
      })
      let poster = shown?.dataset.poster ?? ''
      if (poster && poster !== lastBg) {
        lastBg = poster
        let layer = document.createElement('i')
        layer.style.backgroundImage = `url("${poster}")`
        bg.append(layer)
        requestAnimationFrame(() => layer.classList.add('on'))
        let old = [...bg.children].slice(0, -2)
        setTimeout(() => old.forEach((el) => el.remove()), 1200)
      }
    }
  }
  let request = () => {
    if (!queued) { queued = true; requestAnimationFrame(update) }
  }
  track.addEventListener('scroll', request, { signal, passive: true })
  addEventListener('resize', request, { signal })
  update()

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
    if (shown(picked, track.getBoundingClientRect()) < 0.5) pick(null)
  }
  let unpickTimer = 0
  if (chips.length) {
    track.addEventListener('scroll', () => {
      clearTimeout(unpickTimer)
      unpickTimer = window.setTimeout(checkPicked, 200)
    }, { signal, passive: true })
  }
  for (let chip of chips) {
    chip.addEventListener('click', async () => {
      chip.setAttribute('aria-busy', 'true')
      await clips.loadMore(track)
      chip.removeAttribute('aria-busy')
      let first = track.querySelector<HTMLElement>(`[data-cat="${chip.dataset.railCat}"]`)
      if (!first) return
      pick(chip, first)
      slideTo(first)
    }, { signal })
  }

  // The clips' Instagram links: one Tab stop for the whole row, on the clip in view (a roving tabindex).
  // From there the left and right arrows move to the clip before or after it, and Enter opens its post.
  let links = () => [...track.querySelectorAll<HTMLAnchorElement>('.clip-ig')]
  let rove = () => {
    let all = links()
    if (!all.length || all.includes(document.activeElement as HTMLAnchorElement)) return
    let view = track.getBoundingClientRect()
    let current = all.find((a) => a.getBoundingClientRect().left >= view.left) ?? all[0]
    for (let a of all) a.tabIndex = a === current ? 0 : -1
  }
  if (track.querySelector('[data-clip]')) {
    track.addEventListener('scroll', () => requestAnimationFrame(rove), { signal, passive: true })
    rove()
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
      to.focus({ preventScroll: true })
      to.closest('.slide')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: motion.reduced ? 'auto' : 'smooth' })
    }, { signal })
  }

  // Slides the row so a card starts at its left edge, the page staying put. Snapping is off for the trip:
  // off screen the card is still shrunk by its slide-in animation, and the browser would line up with
  // that smaller box, a few pixels short.
  function slideTo(slide: HTMLElement) {
    track.classList.add('is-jumping')
    let landed = () => track.classList.remove('is-jumping')
    track.addEventListener('scrollend', landed, { once: true, signal })
    setTimeout(landed, 1500)
    let first = slides()[0]
    track.scrollTo({ left: slide.offsetLeft - first.offsetLeft, behavior: motion.reduced ? 'auto' : 'smooth' })
  }

  // arrows: page by the width of what is visible
  rail.addEventListener('click', (event) => {
    let target = event.target as Element
    let dir = target.closest('[data-rail-next]') ? 1 : target.closest('[data-rail-prev]') ? -1 : 0
    if (dir) track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: motion.reduced ? 'auto' : 'smooth' })

    // a jump link ([data-rail-jump], like the career intro's list) slides the row to its card, page staying put
    let jump = target.closest<HTMLAnchorElement>('a[data-rail-jump]')
    let slide = jump && track.querySelector<HTMLElement>(`[id="${jump.hash.slice(1)}"]`)
    // a row stacked top to bottom (the career on phones) has nothing to slide: the link just scrolls the page
    let sideways = track.scrollWidth > track.clientWidth + 8
    if (slide && sideways) {
      event.preventDefault()
      slideTo(slide)
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
    if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; track.classList.add('is-dragging') }
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
