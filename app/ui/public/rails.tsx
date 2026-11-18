import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

// Every section is a row: scroll down to move between sections, sideways (trackpad, swipe, drag,
// the arrow buttons or the keyboard) to see more inside one. For each [data-rail] this script:
//   - drives the arrows ([data-rail-prev] / [data-rail-next]), disabling the one with nowhere to go, and
//     marks the row's start and end
//   - appends the rest of a row's clips from its [data-more] JSON when the row comes near
//   - lets a mouse drag the row (touch and trackpads scroll natively); a press on text selects it instead
//   - slides the row to a card when a [data-rail-jump] link to it is clicked, and keeps that link lit
//   - shuffles the home row's clips so hobbies take turns ([data-shuffle]); starred clips stay first
//   - fades the row's backdrop ([data-rail-bg]) to the poster of the slide in view
// It also plays [data-autoplay] videos only while they are on screen (and not paused with a [data-pause]
// button), highlights the menu link of the section in view, cross-fades [data-cycle] screen stacks, keeps
// one clip's Instagram link in the Tab order (the arrow keys move it), and opens the career's older jobs
// ([data-career-more]). One pause stops all of the automatic motion: videos, screens, looping animations.
// Without JS the rows still scroll.
export const Rails = clientEntry(import.meta.url, function Rails(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal
    let root = document.documentElement
    root.classList.add('js-rails')
    // reduced motion can be turned on (or off) while the page is open: setMotion() below follows it live
    let reducedQuery = matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = reducedQuery.matches
    let saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    let motion = !reduced && !saveData
    // a pause button stops all motion on the page, and keeps it stopped across visits in this tab;
    // html.is-paused stops the looping CSS animations, and joj-demo.tsx waits while it is there
    let paused = sessionStorage.getItem('ao-paused') === '1'
    // reduced motion (or data saver) counts as paused for everything that moves on its own: the CSS loops,
    // the SVG timelines, the Jump Over Jump demo (it reads html.is-paused) and the cycling screens
    let showMotion = () => {
      let still = paused || !motion
      root.classList.toggle('is-paused', still)
      for (let svg of document.querySelectorAll<SVGSVGElement>('svg.sync-art')) {
        if (still) {
          svg.pauseAnimations()
          // held where the pulses are spread along their lines, not bunched at the start
          if (!motion) svg.setCurrentTime(1.4)
        } else svg.unpauseAnimations()
      }
    }
    showMotion()
    // new clip slides (from [data-more]) are handed to the video code below once it is set up
    let onNewSlides: (slides: HTMLElement[]) => void = () => {}
    // the rest of the clips, loaded once for a row (the row coming near, or a hobby chip, whichever is first)
    let loading = new Map<HTMLElement, Promise<void>>()
    let loadMore = (track: HTMLElement) => {
      let more = track.dataset.more
      if (!more) return Promise.resolve()
      if (!loading.has(track)) {
        loading.set(track, appendClips(track, more).then(() => {
          if (track.hasAttribute('data-shuffle')) shuffle(track)
          track.dispatchEvent(new Event('scroll'))
        }))
      }
      return loading.get(track)!
    }

    for (let rail of document.querySelectorAll<HTMLElement>('[data-rail]')) setUpRail(rail)

    function setUpRail(rail: HTMLElement) {
      let track = rail.querySelector<HTMLElement>('[data-rail-track]')!
      let bg = rail.querySelector<HTMLElement>('[data-rail-bg]')
      let slides = () => [...track.children].filter((el) => !(el as HTMLElement).hidden) as HTMLElement[]

      let prev = rail.querySelector<HTMLButtonElement>('[data-rail-prev]')
      let next = rail.querySelector<HTMLButtonElement>('[data-rail-next]')
      let more = track.dataset.more
      // a row with more clips to come is dealt once they are all in, before it scrolls into view
      if (track.hasAttribute('data-shuffle') && !more) shuffle(track)
      if (more) {
        let near = new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting) return
          near.disconnect()
          loadMore(track)
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
          await loadMore(track)
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
          to.closest('.slide')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
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
        track.scrollTo({ left: slide.offsetLeft - first.offsetLeft, behavior: reduced ? 'auto' : 'smooth' })
      }

      // arrows: page by the width of what is visible
      rail.addEventListener('click', (event) => {
        let target = event.target as Element
        let dir = target.closest('[data-rail-next]') ? 1 : target.closest('[data-rail-prev]') ? -1 : 0
        if (dir) track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' })

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

    // The rest of a row's clips, from the JSON the build writes (scripts/build.ts): the same cards the
    // page renders (ClipSlide in home-page.tsx), skipping the ones already there.
    async function appendClips(track: HTMLElement, url: string) {
      let data: { names: Record<string, Record<string, string>>; clips: { id: string; cat: string; star: number; score: number; label: Record<string, string>; captionRejected?: boolean; ig?: string; poster: string; video: string }[] }
      try {
        data = await (await fetch(url, { signal })).json()
      } catch {
        return
      }
      let lang = root.lang === 'pt-BR' ? 'pt' : 'en'
      let words = JSON.parse(track.dataset.words ?? '{}') as Record<string, string>
      let have = new Set([...track.querySelectorAll<HTMLElement>('[data-clip]')].map((el) => el.dataset.clip))
      let icon = track.querySelector('.clip-ig svg')
      let added: HTMLElement[] = []
      for (let clip of data.clips) {
        if (have.has(clip.id)) continue
        let li = document.createElement('li')
        li.className = 'slide clip'
        Object.assign(li.dataset, { clip: clip.id, cat: clip.cat, star: String(clip.star), score: String(clip.score), poster: clip.poster, video: clip.video })
        let img = document.createElement('img')
        Object.assign(img, { className: 'clip-video', src: clip.poster, alt: clip.label[lang], loading: 'lazy', decoding: 'async', width: 540, height: 960 })
        let copy = document.createElement('div')
        copy.className = 'clip-copy'
        copy.setAttribute('aria-hidden', 'true')
        let cat = document.createElement('p')
        cat.className = 'clip-cat'
        cat.textContent = data.names[lang][clip.cat]
        copy.append(cat)
        if (!clip.captionRejected) {
          let label = document.createElement('p')
          label.className = 'clip-label'
          label.textContent = clip.label[lang]
          copy.append(label)
        }
        li.append(img, copy)
        if (clip.ig) {
          let a = document.createElement('a')
          Object.assign(a, { className: 'clip-ig', href: clip.ig, target: '_blank', rel: 'noopener', tabIndex: -1 })
          a.setAttribute('aria-label', `${words.ig}: ${clip.label[lang]} (${words.newTab})`)
          a.dataset.cursor = 'Instagram'
          if (icon) a.append(icon.cloneNode(true))
          li.append(a)
        }
        added.push(li)
      }
      track.append(...added)
      onNewSlides(added)
      track.dispatchEvent(new Event('scroll'))
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

    // Pause buttons: every one on the page shows the same state, and says what a press does ("Pause motion",
    // or "Play motion" once paused). Without motion there is nothing to pause, so they are hidden (and out
    // of the Tab order) then.
    let pauseButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-pause]')]
    // (no aria-pressed: with a name that changes, "Play motion, pressed" would contradict itself)
    let showPaused = () => pauseButtons.forEach((b) => {
      let label = (paused ? b.dataset.play : b.dataset.pauseLabel) ?? ''
      b.toggleAttribute('data-paused', paused)
      b.setAttribute('aria-label', label)
      b.title = label
    })
    let showPauseButtons = () => pauseButtons.forEach((b) => (b.hidden = !motion))
    showPauseButtons()
    showPaused()
    // Reduced motion can be turned on or off while the page is open; both ways run setMotion(), set up with
    // the videos below: videos, the SVG timelines, the cycling screens, the demo, the CSS loops and the pause
    // buttons all follow the current preference.
    let setMotion = () => {}
    reducedQuery.addEventListener('change', () => {
      reduced = reducedQuery.matches
      motion = !reduced && !saveData
      setMotion()
    }, { signal })

    // The career's older jobs (phones fold them after the recent ones): one tap opens them all and moves
    // focus to the first. Without JS the link's #hash does the same through :target (site.css).
    for (let more of document.querySelectorAll<HTMLAnchorElement>('[data-career-more]')) {
      more.addEventListener('click', (event) => {
        let first = document.getElementById(more.hash.slice(1))
        let row = more.closest('[data-rail]')
        if (!first || !row) return
        event.preventDefault()
        row.setAttribute('data-older', 'open')
        first.tabIndex = -1
        first.focus({ preventScroll: true })
        first.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
      }, { signal })
    }
    // ...and "Hide earlier jobs" folds them again, scrolls back to the fold and gives its button focus.
    // When a #link opened an older job (:target), the link's own #career-more navigation moves the target off it.
    for (let less of document.querySelectorAll<HTMLAnchorElement>('[data-career-less]')) {
      less.addEventListener('click', (event) => {
        let row = less.closest('[data-rail]')
        let button = document.querySelector<HTMLElement>('[data-career-more]')
        if (!row || !button) return
        if (!row.querySelector('.job-older:target')) event.preventDefault()
        row.removeAttribute('data-older')
        requestAnimationFrame(() => {
          button.closest('li')?.scrollIntoView({ block: 'start' })
          button.focus({ preventScroll: true })
        })
      }, { signal })
    }

    // Videos play only while on screen, and never for reduced motion or data saver. (Data saver can't change
    // while the page is open; reduced motion can, so all of this is set up and checks `motion` as it goes.)
    if (!saveData) {
      let onScreen = new Set<HTMLVideoElement>()
      let watched = new Set<HTMLVideoElement>()
      let watcher = new IntersectionObserver((entries) => {
        for (let { target, isIntersecting } of entries) {
          let video = target as HTMLVideoElement
          if (isIntersecting) onScreen.add(video)
          else onScreen.delete(video)
          if (isIntersecting && !paused && motion) play(video)
          else video.pause()
        }
      }, { threshold: 0.35 })
      // a video kept out of the page's first loads ([data-src], the Wear OS one) gets its file the first time it plays
      let play = (video: HTMLVideoElement) => {
        if (video.dataset.src) {
          video.src = video.dataset.src
          delete video.dataset.src
        }
        video.play().catch(() => {})
      }
      let watch = (video: HTMLVideoElement) => { watched.add(video); watcher.observe(video) }
      let unwatch = (video: HTMLVideoElement) => { watched.delete(video); onScreen.delete(video); watcher.unobserve(video) }
      // the clips' players: only near the screen, and only while there is motion
      let playerSlides = new Set<HTMLElement>()
      let playerObservers: IntersectionObserver[] = []
      setMotion = () => {
        showMotion()
        showPauseButtons()
        if (!motion) {
          for (let video of document.querySelectorAll('video')) video.pause()
          return
        }
        // observing again reports where each one is now: the clips near the screen get players, and the
        // videos on screen play
        for (let video of watched) { watcher.unobserve(video); watcher.observe(video) }
        for (let players of playerObservers) for (let slide of playerSlides) {
          if (!slide.querySelector('video.clip-video')) { players.unobserve(slide); players.observe(slide) }
        }
      }
      for (let button of pauseButtons) {
        button.addEventListener('click', () => {
          paused = !paused
          sessionStorage.setItem('ao-paused', paused ? '1' : '0')
          showPaused()
          showMotion()
          for (let video of onScreen) {
            if (paused) video.pause()
            else play(video)
          }
        }, { signal })
      }
      // [data-autoplay="idle"] (the hero's clip, the biggest file on the first screen) waits until the page
      // has loaded and the browser is idle, so it never competes with the first paint; its poster shows until then
      let videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-autoplay]')]
      videos.filter((v) => v.dataset.autoplay !== 'idle').forEach(watch)
      let whenIdle = () => {
        let go = () => videos.filter((v) => v.dataset.autoplay === 'idle').forEach(watch)
        if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2000 })
        else setTimeout(go, 200)
      }
      if (document.readyState === 'complete') whenIdle()
      else addEventListener('load', whenIdle, { signal, once: true })
      signal.addEventListener('abort', () => watcher.disconnect())

      // Clips are stills until they come near the screen inside their row; then they get a video player,
      // which is removed again once they move away. Only a handful of players exist at a time, which
      // keeps phones from running out of memory and closing the page.
      for (let track of document.querySelectorAll<HTMLElement>('[data-rail-track]')) {
        if (!track.querySelector('[data-video]')) continue
        // nothing loads until the row itself comes within a screen of view: measured against the row
        // alone, its first clips would get players (posters, metadata) on the first screen
        let rowNear = new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting) return
          rowNear.disconnect()
          let add = (slide: HTMLElement) => { playerSlides.add(slide); players.observe(slide) }
          track.querySelectorAll<HTMLElement>('[data-video]').forEach(add)
          onNewSlides = (slides) => slides.forEach(add)
        }, { rootMargin: '100% 0px' })
        rowNear.observe(track)
        signal.addEventListener('abort', () => rowNear.disconnect())
        let players = new IntersectionObserver((entries) => {
          for (let { target, isIntersecting } of entries) {
            let slide = target as HTMLElement
            let video = slide.querySelector<HTMLVideoElement>('video.clip-video')
            // only clips near the screen run the slide-in animation: 114 of them scrolling with the page cost frames
            slide.toggleAttribute('data-near', isIntersecting)
            if (isIntersecting && !video && motion) {
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
              watch(video)
            } else if (!isIntersecting && video) {
              unwatch(video)
              video.pause()
              video.removeAttribute('src')
              video.load()
              video.remove()
            }
          }
        }, { root: track, rootMargin: '0px 60%' })
        playerObservers.push(players)
        signal.addEventListener('abort', () => players.disconnect())
      }

      let timer = setInterval(() => {
        if (document.hidden || paused || !motion) return
        for (let stack of document.querySelectorAll<HTMLElement>('[data-cycle]')) {
          let rect = stack.getBoundingClientRect()
          if (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) continue
          advance(stack)
        }
      }, 2600)
      // the second screen of each stack on screen loads once the page has loaded, ready for the first step
      let preload = () => {
        for (let stack of document.querySelectorAll<HTMLElement>('[data-cycle]')) {
          let rect = stack.getBoundingClientRect()
          if (rect.bottom > 0 && rect.top < innerHeight) loadShot(stack.children[1])
        }
      }
      if (document.readyState === 'complete') preload()
      else addEventListener('load', preload, { signal, once: true })
      signal.addEventListener('abort', () => clearInterval(timer))
    }

    // A cycling stack's next screen: shown, and the one after it starts loading (devices.tsx leaves all but
    // the first in data-src).
    function loadShot(shot: Element | undefined) {
      let img = shot as HTMLImageElement | undefined
      if (img?.dataset.src) {
        img.src = img.dataset.src
        delete img.dataset.src
      }
    }
    function advance(stack: Element | null) {
      if (!stack) return
      let shots = [...stack.children]
      let i = shots.findIndex((s) => s.classList.contains('on'))
      let next = shots[(i + 1) % shots.length]
      loadShot(next)
      shots[i]?.classList.remove('on')
      next?.classList.add('on')
      loadShot(shots[(i + 2) % shots.length])
    }

    // Hero device clusters follow the mouse: each device tilts and drifts by its own depth, and
    // the one under the pointer lifts and shows its next screen.
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
    let pending = false
    let onScroll = () => {
      if (!pending) { pending = true; requestAnimationFrame(highlight) }
    }
    let highlight = () => {
      pending = false
      // nothing is lit on the first screen, above the first chapter; at the very bottom it's the last one
      // (the footer is too short to reach the middle of the screen)
      let current = ''
      for (let chapter of chapters) if (chapter.getBoundingClientRect().top <= innerHeight / 2) current = chapter.id
      if (scrollY > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = chapters.at(-1)?.id ?? current
      if (current === last) return
      last = current
      for (let link of links) {
        if (link.dataset.chapterLink === current) link.setAttribute('aria-current', 'location')
        else link.removeAttribute('aria-current')
      }
      // on phones the More button stands for the sections under it
      toggle?.toggleAttribute('data-current', !!moreList?.querySelector(`[data-chapter-link="${current}"]`))
    }
    addEventListener('scroll', onScroll, { signal, passive: true })

    // The language flags take you to the same section in the other language: their links carry the #id of
    // the row in the middle of the screen, kept up to date as you scroll (so a copied link works too).
    // Without JS they open the other language's page at the top.
    let langLinks = [...document.querySelectorAll<HTMLAnchorElement>('.lang-card')]
    let places = [...document.querySelectorAll<HTMLElement>('main section[id], footer[id]')]
    let carryPlace = () => {
      let here = ''
      for (let place of places) if (place.getBoundingClientRect().top <= innerHeight / 2) here = place.id
      if (scrollY > 0 && innerHeight + scrollY >= root.scrollHeight - 4) here = places.at(-1)?.id ?? here
      if (here === 'top') here = ''
      for (let link of langLinks) if (link.hash.slice(1) !== here) link.hash = here
    }
    let placePending = false
    let queuePlace = () => {
      if (!placePending) { placePending = true; requestAnimationFrame(() => { placePending = false; carryPlace() }) }
    }
    addEventListener('scroll', queuePlace, { signal, passive: true })
    // a page opened at a #section scrolls there after this script has run
    addEventListener('load', queuePlace, { signal, once: true })
    addEventListener('hashchange', queuePlace, { signal })
    carryPlace()

    // Phones: the More button in the menu opens the sections after the first two. Escape, a tap outside or
    // picking one closes it; Escape gives focus back to the button.
    let toggle = document.querySelector<HTMLButtonElement>('.menu-toggle')
    let moreList = document.querySelector<HTMLElement>('#menu-more')
    if (toggle && moreList) {
      let button = toggle
      let list = moreList
      button.hidden = false
      let setOpen = (open: boolean) => {
        button.setAttribute('aria-expanded', String(open))
        list.toggleAttribute('data-open', open)
      }
      button.addEventListener('click', () => {
        let open = button.getAttribute('aria-expanded') !== 'true'
        setOpen(open)
        if (open) list.querySelector<HTMLElement>('a:not(.menu-wide), a')?.focus()
      }, { signal })
      list.addEventListener('click', (event) => { if ((event.target as Element).closest('a')) setOpen(false) }, { signal })
      addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || button.getAttribute('aria-expanded') !== 'true') return
        setOpen(false)
        button.focus()
      }, { signal })
      addEventListener('pointerdown', (event) => {
        if (button.getAttribute('aria-expanded') === 'true' && !(event.target as Element).closest('.cin-menu')) setOpen(false)
      }, { signal })
      // focus leaving the menu (Tab past the last section) closes it too
      list.addEventListener('focusout', (event) => {
        let to = event.relatedTarget as Element | null
        if (to && !to.closest('.cin-menu')) setOpen(false)
      }, { signal })
    }
    highlight()

    let flight = reduced ? null : setUpFlight()

    // Any first interaction skips the title intro.
    let skip = () => {
      root.classList.add('cin-skip')
      flight?.skipped()
    }
    for (let type of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) {
      addEventListener(type, skip, { signal, once: true, passive: true })
    }

    // The plane in "Brazil ✈ Ottawa" takes off once the page has settled, so it is the only thing moving:
    // 2.5s after load. It waits while the tab is hidden or the route is off screen, and flies again on
    // hover or tap.
    function setUpFlight() {
      let route = document.querySelector<HTMLElement>('[data-flight]')
      let plane = route?.querySelector('.hi-plane')
      if (!route || !plane) return null
      let el = route
      let due = false
      let flown = false
      let flying = false
      let inView = false
      el.dataset.flight = 'wait'

      function fly() {
        if (flying) return
        flying = true
        flown = true
        el.dataset.flight = 'wait'
        void el.offsetWidth // restarts the animations on a replay
        el.dataset.flight = 'fly'
      }
      let flyIfReady = () => {
        if (due && !flown && inView && document.visibilityState === 'visible') fly()
      }
      plane.addEventListener('animationend', () => { flying = false }, { signal })

      let timer = 0
      let takeOffIn = (ms: number) => {
        clearTimeout(timer)
        timer = window.setTimeout(() => { due = true; flyIfReady() }, Math.max(0, ms))
      }
      takeOffIn(2500 - performance.now())
      signal.addEventListener('abort', () => clearTimeout(timer))

      let seen = new IntersectionObserver((entries) => {
        inView = entries.at(-1)!.intersectionRatio > 0.9
        flyIfReady()
      }, { threshold: [0, 0.5, 0.95, 1], rootMargin: '-64px 0px 0px 0px' }) // below the fixed menu
      seen.observe(el)
      signal.addEventListener('abort', () => seen.disconnect())
      document.addEventListener('visibilitychange', () => setTimeout(flyIfReady, 500), { signal })

      el.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse' && flown) fly()
      }, { signal })
      el.addEventListener('click', fly, { signal })

      return {
        // A skip ends the intro at once, so the plane can go after a short beat.
        skipped() {
          if (!due) takeOffIn(Math.max(performance.now() + 600, 1200) - performance.now())
        },
      }
    }
  })

  return () => <span hidden />
})
