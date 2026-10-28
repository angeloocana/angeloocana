import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

// Every section is a row: scroll down to move between sections, sideways (trackpad, swipe, drag,
// the arrow buttons or the keyboard) to see more inside one. For each [data-rail] this script:
//   - drives the arrows ([data-rail-prev] / [data-rail-next]) and marks the row's start and end
//   - lets a mouse drag the row (touch and trackpads scroll natively); a press on text selects it instead
//   - slides the row to a card when a [data-rail-jump] link to it is clicked, and keeps that link lit
//   - shuffles the home row's clips so hobbies take turns ([data-shuffle]); starred clips stay first
//   - fades the row's backdrop ([data-rail-bg]) to the poster of the slide in view
// It also plays [data-autoplay] videos only while they are on screen, highlights the menu link of the
// section in view, and cross-fades [data-cycle] screen stacks. Without JS the rows still scroll.
export const Rails = clientEntry(import.meta.url, function Rails(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal
    let root = document.documentElement
    root.classList.add('js-rails')
    let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

    for (let rail of document.querySelectorAll<HTMLElement>('[data-rail]')) setUpRail(rail)

    function setUpRail(rail: HTMLElement) {
      let track = rail.querySelector<HTMLElement>('[data-rail-track]')!
      let bg = rail.querySelector<HTMLElement>('[data-rail-bg]')
      let slides = () => [...track.children].filter((el) => !(el as HTMLElement).hidden) as HTMLElement[]

      if (track.hasAttribute('data-shuffle')) shuffle(track)

      let queued = false
      let lastBg = ''
      function update() {
        queued = false
        let list = slides()
        let max = track.scrollWidth - track.clientWidth
        rail.toggleAttribute('data-at-start', track.scrollLeft < 8)
        rail.toggleAttribute('data-at-end', track.scrollLeft > max - 8)
        if (bg) {
          // backdrop follows the first video slide that is mostly in view
          let view = track.getBoundingClientRect()
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

      // arrows: page by the width of what is visible
      rail.addEventListener('click', (event) => {
        let target = event.target as Element
        let dir = target.closest('[data-rail-next]') ? 1 : target.closest('[data-rail-prev]') ? -1 : 0
        if (dir) track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' })

        // a jump link ([data-rail-jump], like the career intro's list) slides the row to its card, page staying put
        let jump = target.closest<HTMLAnchorElement>('a[data-rail-jump]')
        let slide = jump && track.querySelector<HTMLElement>(`[id="${jump.hash.slice(1)}"]`)
        if (slide) {
          event.preventDefault()
          // snapping is off for the trip: off screen the card is still shrunk by its slide-in animation,
          // and the browser would line up with that smaller box, a few pixels short
          track.classList.add('is-jumping')
          let landed = () => track.classList.remove('is-jumping')
          track.addEventListener('scrollend', landed, { once: true, signal })
          setTimeout(landed, 1500)
          let first = slides()[0]
          track.scrollTo({ left: slide.offsetLeft - first.offsetLeft, behavior: reduced ? 'auto' : 'smooth' })
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

    // Starred clips stay first. The rest are dealt again on every visit: the strongest clips (data-score)
    // still lead, with a little chance mixed in, and a category waits until two others have had a turn.
    function shuffle(track: HTMLElement) {
      let clips = [...track.querySelectorAll<HTMLElement>('[data-cat]')]
      let fixed = clips.filter((c) => c.dataset.star && c.dataset.star !== '0')
      let pool = clips.filter((c) => !fixed.includes(c)).map((el) => ({ el, rank: Number(el.dataset.score || 0) + Math.random() * 2.2 }))
      let order: HTMLElement[] = []
      while (pool.length) {
        let recent = [...fixed, ...order].slice(-2).map((c) => c.dataset.cat)
        let score = (p: { el: HTMLElement; rank: number }) => p.rank - (recent.includes(p.el.dataset.cat) ? 10 : 0)
        pool.sort((a, b) => score(b) - score(a))
        order.push(pool.shift()!.el)
      }
      let after: Element | null = fixed.at(-1) ?? clips[0]?.previousElementSibling ?? null
      for (let clip of order) {
        if (after) after.after(clip)
        else track.prepend(clip)
        after = clip
      }
    }

    // Posters past the first screen load when they come within two row-widths of view.
    let posters = new IntersectionObserver((entries) => {
      for (let { target, isIntersecting } of entries) {
        let video = target as HTMLVideoElement
        if (!isIntersecting || !video.dataset.lazyPoster) continue
        video.poster = video.dataset.lazyPoster
        delete video.dataset.lazyPoster
        posters.unobserve(video)
      }
    }, { rootMargin: '50% 200%' })
    for (let video of document.querySelectorAll<HTMLVideoElement>('video[data-lazy-poster]')) posters.observe(video)
    signal.addEventListener('abort', () => posters.disconnect())

    // [data-reveal] lists (the career menu) roll in once, the first time a quarter of them is on screen.
    let reveal = new IntersectionObserver((entries) => {
      for (let { target, isIntersecting } of entries) {
        if (!isIntersecting) continue
        target.setAttribute('data-shown', '')
        reveal.unobserve(target)
      }
    }, { threshold: 0.25 })
    for (let list of document.querySelectorAll('[data-reveal]')) reveal.observe(list)
    signal.addEventListener('abort', () => reveal.disconnect())

    // Videos play only while on screen, and never for reduced motion or data saver.
    let saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (!reduced && !saveData) {
      let watcher = new IntersectionObserver((entries) => {
        for (let { target, isIntersecting } of entries) {
          let video = target as HTMLVideoElement
          if (isIntersecting) video.play().catch(() => {})
          else video.pause()
        }
      }, { threshold: 0.35 })
      for (let video of document.querySelectorAll<HTMLVideoElement>('video[data-autoplay]')) watcher.observe(video)
      signal.addEventListener('abort', () => watcher.disconnect())

      // Clips are stills until they come near the screen inside their row; then they get a video player,
      // which is removed again once they move away. Only a handful of players exist at a time, which
      // keeps phones from running out of memory and closing the page.
      for (let track of document.querySelectorAll<HTMLElement>('[data-rail-track]')) {
        if (!track.querySelector('[data-video]')) continue
        let players = new IntersectionObserver((entries) => {
          for (let { target, isIntersecting } of entries) {
            let slide = target as HTMLElement
            let video = slide.querySelector<HTMLVideoElement>('video.clip-video')
            if (isIntersecting && !video) {
              video = document.createElement('video')
              video.className = 'clip-video'
              video.muted = true
              video.loop = true
              video.playsInline = true
              video.setAttribute('playsinline', '')
              video.setAttribute('aria-hidden', 'true')
              video.preload = 'metadata'
              video.poster = slide.dataset.poster ?? ''
              video.src = slide.dataset.video!
              slide.querySelector('img.clip-video')?.after(video)
              watcher.observe(video)
            } else if (!isIntersecting && video) {
              watcher.unobserve(video)
              video.pause()
              video.removeAttribute('src')
              video.load()
              video.remove()
            }
          }
        }, { root: track, rootMargin: '0px 60%' })
        for (let slide of track.querySelectorAll<HTMLElement>('[data-video]')) players.observe(slide)
        signal.addEventListener('abort', () => players.disconnect())
      }

      let timer = setInterval(() => {
        for (let stack of document.querySelectorAll<HTMLElement>('[data-cycle]')) {
          let rect = stack.getBoundingClientRect()
          if (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) continue
          let shots = [...stack.children] as HTMLElement[]
          let i = shots.findIndex((s) => s.classList.contains('on'))
          shots[i]?.classList.remove('on')
          shots[(i + 1) % shots.length]?.classList.add('on')
        }
      }, 2600)
      signal.addEventListener('abort', () => clearInterval(timer))
    }

    // Hero device clusters follow the mouse: each device tilts and drifts by its own depth, and
    // the one under the pointer lifts and shows its next screen.
    let advance = (stack: Element | null) => {
      if (!stack) return
      let shots = [...stack.children]
      let i = shots.findIndex((s) => s.classList.contains('on'))
      shots[i]?.classList.remove('on')
      shots[(i + 1) % shots.length]?.classList.add('on')
    }
    for (let visual of document.querySelectorAll<HTMLElement>('.intro-visual')) {
      visual.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse' || reduced) return
        let r = visual.getBoundingClientRect()
        visual.style.setProperty('--mx', (((event.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
        visual.style.setProperty('--my', (((event.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
      }, { signal })
      visual.addEventListener('pointerleave', () => {
        visual.style.setProperty('--mx', '0')
        visual.style.setProperty('--my', '0')
      }, { signal })
      for (let device of visual.querySelectorAll<HTMLElement>('.hv')) {
        device.addEventListener('pointerenter', (event) => {
          if (event.pointerType === 'mouse') advance(device.querySelector('[data-cycle]'))
        }, { signal })
      }
    }

    // The menu link of the section that holds the middle of the screen.
    let chapters = [...document.querySelectorAll<HTMLElement>('[data-chapter][id]')]
    let links = [...document.querySelectorAll<HTMLElement>('[data-chapter-link]')]
    let last = ''
    let onScroll = () => {
      let current = chapters[0]?.id ?? ''
      for (let chapter of chapters) if (chapter.getBoundingClientRect().top <= innerHeight / 2) current = chapter.id
      if (current === last) return
      last = current
      for (let link of links) link.toggleAttribute('aria-current', link.dataset.chapterLink === current)
    }
    addEventListener('scroll', onScroll, { signal, passive: true })
    onScroll()

    // Any first interaction skips the title intro.
    let skip = () => root.classList.add('cin-skip')
    for (let type of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) {
      addEventListener(type, skip, { signal, once: true, passive: true })
    }
  })

  return () => <span hidden />
})
