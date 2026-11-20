// Runs `start` once, the first time any element matching `selector` comes within a screen of view (either
// way: the games sit in rows that scroll sideways). Their code is imported only then, not with the page.
export function whenNear(selector: string, signal: AbortSignal, start: () => Promise<unknown>) {
  let targets = [...document.querySelectorAll(selector)]
  if (!targets.length) return
  let near = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return
    near.disconnect()
    if (!signal.aborted) start().catch(() => {})
  }, { rootMargin: '100% 100%' })
  for (let el of targets) near.observe(el)
  signal.addEventListener('abort', () => near.disconnect())
}
