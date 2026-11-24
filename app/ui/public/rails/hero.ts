import { withLatestIntersections } from '../visibility.ts'
import type { Motion } from './motion.ts'
import { advance } from './media.ts'

// The first screen: the title intro, the plane in "Brazil ✈ Ottawa", and the device clusters that follow
// the mouse.
export function setUpHero(signal: AbortSignal, motion: Motion) {
  let root = document.documentElement
  let flight = setUpFlight(signal, motion)

  // Any first interaction skips the title intro.
  let skip = () => {
    root.classList.add('cin-skip')
    flight?.skipped()
  }
  for (let type of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) {
    addEventListener(type, skip, { signal, once: true, passive: true })
  }

  // Hero device clusters follow the mouse: each device tilts and drifts by its own depth, and
  // the one under the pointer lifts and shows its next screen.
  for (let visual of document.querySelectorAll<HTMLElement>('.intro-visual')) {
    visual.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || motion.reduced) return
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
}

// The plane in "Brazil ✈ Ottawa" takes off once the page has settled, so it is the only thing moving:
// 2.5s after load. It waits while the tab is hidden or the route is off screen, and flies again on
// hover or tap. Never while the page's motion is off (paused, reduced motion, data saver): the route then
// shows the plane landed, and it takes off once the motion comes back, if it hasn't flown yet.
function setUpFlight(signal: AbortSignal, motion: Motion) {
  let route = document.querySelector<HTMLElement>('[data-flight]')
  let plane = route?.querySelector('.hi-plane')
  if (!route || !plane) return null
  let el = route
  let due = false
  let flown = false
  let flying = false
  let inView = false
  let still = () => motion.paused || !motion.motion
  // 'landed' has no styles: the plane at the end of its route, as without JS
  let rest = () => {
    if (still()) { flying = false; el.dataset.flight = 'landed' }
    else if (!flown) el.dataset.flight = 'wait'
  }
  rest()
  let motionChanged = () => { rest(); flyIfReady() }
  motion.onPause(motionChanged)
  motion.onChange(motionChanged)

  function fly() {
    if (flying || still()) return
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

  let seen = new IntersectionObserver(withLatestIntersections(({ intersectionRatio }) => {
    inView = intersectionRatio > 0.9
    flyIfReady()
  }), { threshold: [0, 0.5, 0.95, 1], rootMargin: '-64px 0px 0px 0px' }) // below the fixed menu
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
