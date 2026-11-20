// Starts a game once, the first time any element matching `selector` comes within a screen of view (either
// way: the games sit in rows that scroll sideways). Its code is imported only then, not with the page, and
// it starts only if the page is still mounted once the import has come: an unmount during the download
// already ran its cleanup, so a start after it would leave timers and observers behind.
export function whenNear(selector: string, signal: AbortSignal, load: () => Promise<(signal: AbortSignal) => unknown>) {
  let targets = [...document.querySelectorAll(selector)]
  if (!targets.length) return
  let near = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return
    near.disconnect()
    if (signal.aborted) return
    load().then((play) => { if (!signal.aborted) play(signal) }).catch(() => {})
  }, { rootMargin: '100% 100%' })
  for (let el of targets) near.observe(el)
  signal.addEventListener('abort', () => near.disconnect())
}
