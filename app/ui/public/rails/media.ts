import type { Motion } from './motion.ts'

// Videos play only while on screen, and never for reduced motion or data saver. Clips are stills until they
// come near the screen inside their row; then they get a video player, removed again once they move away.
// The cycling screens of the device stacks step every 2.6 s while on screen.
export interface Media {
  /** New clip slides (appended from the clips JSON) get players like the ones the page rendered. */
  addSlides(slides: HTMLElement[]): void
}

export function setUpMedia(signal: AbortSignal, motion: Motion): Media {
  let media: Media = { addSlides: () => {} }
  loadNear(signal)
  // (data saver can't change while the page is open; reduced motion can, so all of this is set up and
  // checks motion.motion as it goes)
  if (motion.saveData) return media

  // paused, or reduced motion: nothing plays, and no clip gets a player
  let still = () => motion.paused || !motion.motion
  let onScreen = new Set<HTMLVideoElement>()
  let watched = new Set<HTMLVideoElement>()
  let watcher = new IntersectionObserver((entries) => {
    for (let { target, isIntersecting } of entries) {
      let video = target as HTMLVideoElement
      if (isIntersecting) onScreen.add(video)
      else onScreen.delete(video)
      if (isIntersecting && !still()) play(video)
      else video.pause()
    }
  }, { threshold: 0.35 })
  signal.addEventListener('abort', () => watcher.disconnect())
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

  // Paused, or reduced motion: everything stops, and the clips coming near stay posters (a player would
  // fetch its file for nothing). Moving again: observing again reports where each one is now, so the clips
  // near the screen get players, and the videos on screen play.
  let followMotion = () => {
    if (still()) {
      for (let video of document.querySelectorAll('video')) video.pause()
      return
    }
    for (let video of watched) { watcher.unobserve(video); watcher.observe(video) }
    for (let players of playerObservers) for (let slide of playerSlides) {
      if (!slide.querySelector('video.clip-video')) { players.unobserve(slide); players.observe(slide) }
    }
  }
  motion.onChange(followMotion)
  motion.onPause(followMotion)

  // [data-autoplay="idle"] (the hero's clip, the biggest file on the first screen) waits until the page
  // has loaded and the browser is idle, so it never competes with the first paint; its poster shows until then
  let videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-autoplay]')]
  videos.filter((v) => v.dataset.autoplay !== 'idle').forEach(watch)
  let whenIdle = () => {
    let go = () => { if (!signal.aborted) videos.filter((v) => v.dataset.autoplay === 'idle').forEach(watch) }
    if ('requestIdleCallback' in window) {
      let id = requestIdleCallback(go, { timeout: 2000 })
      signal.addEventListener('abort', () => cancelIdleCallback(id))
    } else setTimeout(go, 200)
  }
  if (document.readyState === 'complete') whenIdle()
  else addEventListener('load', whenIdle, { signal, once: true })

  // Only a handful of clip players exist at a time, which keeps phones from running out of memory and
  // closing the page.
  for (let track of document.querySelectorAll<HTMLElement>('[data-rail-track]')) {
    if (!track.querySelector('[data-video]')) continue
    let players = new IntersectionObserver((entries) => {
      for (let { target, isIntersecting } of entries) {
        let slide = target as HTMLElement
        let video = slide.querySelector<HTMLVideoElement>('video.clip-video')
        // only clips near the screen run the slide-in animation: 114 of them scrolling with the page cost frames
        slide.toggleAttribute('data-near', isIntersecting)
        if (isIntersecting && !video && !still()) {
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
    let add = (slide: HTMLElement) => { playerSlides.add(slide); players.observe(slide) }
    // nothing loads until the row itself comes within a screen of view: measured against the row
    // alone, its first clips would get players (posters, metadata) on the first screen
    let rowNear = new IntersectionObserver((entries) => {
      // The initial off-screen entry and the row coming into view can arrive in the same batch.
      if (!entries.at(-1)?.isIntersecting) return
      rowNear.disconnect()
      track.querySelectorAll<HTMLElement>('[data-video]').forEach(add)
      media.addSlides = (slides) => slides.forEach(add)
    }, { rootMargin: '100% 0px' })
    rowNear.observe(track)
    signal.addEventListener('abort', () => rowNear.disconnect())
  }

  let timer = setInterval(() => {
    if (document.hidden || motion.paused || !motion.motion) return
    for (let stack of document.querySelectorAll<HTMLElement>('[data-cycle]')) {
      let rect = stack.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) continue
      advance(stack)
    }
  }, 2600)
  signal.addEventListener('abort', () => clearInterval(timer))
  // the second screen of each stack on screen loads once the page has loaded, ready for the first step
  let preload = () => {
    for (let stack of document.querySelectorAll<HTMLElement>('[data-cycle]')) {
      let rect = stack.getBoundingClientRect()
      if (rect.bottom > 0 && rect.top < innerHeight) loadShot(shotsOf(stack)[1])
    }
  }
  if (document.readyState === 'complete') preload()
  else addEventListener('load', preload, { signal, once: true })
  return media
}

// The project rows' screenshots (devices.tsx Screens near) get their files once they come within a screen
// and a half of view, down the page or along their row: in time to be there when the row arrives, and never
// on the first screen of a phone, 2,400 px above them.
function loadNear(signal: AbortSignal) {
  let near = new IntersectionObserver((entries) => {
    for (let { target, isIntersecting } of entries) {
      if (!isIntersecting) continue
      let img = target as HTMLImageElement
      img.src = img.dataset.near!
      delete img.dataset.near
      near.unobserve(img)
    }
  }, { rootMargin: '150% 100%' })
  for (let img of document.querySelectorAll<HTMLImageElement>('img[data-near]')) near.observe(img)
  signal.addEventListener('abort', () => near.disconnect())
}

// A cycling stack's next screen: shown, and the one after it starts loading (devices.tsx leaves all but
// the first in data-src).
function loadShot(shot: Element | undefined) {
  let img = shot as HTMLImageElement | undefined
  let src = img?.dataset.src ?? img?.dataset.near
  if (img && src) {
    img.src = src
    delete img.dataset.src
    delete img.dataset.near
  }
}

// a stack's screenshots: its own .screen images, not the <noscript> copy that may come first (devices.tsx)
let shotsOf = (stack: Element) => [...stack.querySelectorAll(':scope > img.screen')]

export function advance(stack: Element | null) {
  if (!stack) return
  let shots = shotsOf(stack)
  let i = shots.findIndex((s) => s.classList.contains('on'))
  let next = shots[(i + 1) % shots.length]
  loadShot(next)
  shots[i]?.classList.remove('on')
  next?.classList.add('on')
  loadShot(shots[(i + 2) % shots.length])
}
