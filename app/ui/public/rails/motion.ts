// One pause stops all of the automatic motion on the page: videos, the cycling screens, the SVG timelines,
// the looping CSS animations (html.is-paused) and the Jump Over Jump demo (it reads html.is-paused).
// Reduced motion (or data saver) counts as paused for all of it, and reduced motion can be turned on or off
// while the page is open: everything here follows it live.

export interface Motion {
  /** The system asks for reduced motion. */
  readonly reduced: boolean
  /** Data saver is on (it can't change while the page is open). */
  readonly saveData: boolean
  /** Neither of those: things may move. */
  readonly motion: boolean
  /** A pause button was pressed (kept across visits in this tab). */
  readonly paused: boolean
  /** Runs after reduced motion is turned on or off. */
  onChange(fn: () => void): void
  /** Runs after a pause button is pressed. */
  onPause(fn: () => void): void
}

export function setUpMotion(signal: AbortSignal): Motion {
  let root = document.documentElement
  let reducedQuery = matchMedia('(prefers-reduced-motion: reduce)')
  let reduced = reducedQuery.matches
  let saveData = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  let motion = !reduced && !saveData
  // a pause button stops all motion on the page, and keeps it stopped across visits in this tab
  let paused = sessionStorage.getItem('ao-paused') === '1'
  let changed: (() => void)[] = []
  let pausedFns: (() => void)[] = []

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

  reducedQuery.addEventListener('change', () => {
    reduced = reducedQuery.matches
    motion = !reduced && !saveData
    showMotion()
    showPauseButtons()
    changed.forEach((fn) => fn())
  }, { signal })

  for (let button of pauseButtons) {
    button.addEventListener('click', () => {
      paused = !paused
      sessionStorage.setItem('ao-paused', paused ? '1' : '0')
      showPaused()
      showMotion()
      pausedFns.forEach((fn) => fn())
    }, { signal })
  }

  return {
    get reduced() { return reduced },
    get saveData() { return saveData },
    get motion() { return motion },
    get paused() { return paused },
    onChange: (fn) => changed.push(fn),
    onPause: (fn) => pausedFns.push(fn),
  }
}
