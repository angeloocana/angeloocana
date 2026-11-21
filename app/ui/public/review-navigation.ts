/** Wait for review writes on ordinary links; do not lose drafts silently on reload or back. */
export function guardReviewNavigation(pending: () => boolean, settle: () => Promise<void>, signal: AbortSignal) {
  let attempt = 0
  let leaving = false
  window.addEventListener('beforeunload', (event) => {
    if (leaving || !pending()) return
    event.preventDefault()
    event.returnValue = ''
  }, { signal })
  document.addEventListener('click', async (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    let link = event.target instanceof Element && event.target.closest<HTMLAnchorElement>('a[href]')
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return
    let url = new URL(link.href)
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return
    if (!pending()) return
    event.preventDefault()
    let current = ++attempt
    let waited = true
    try { await settle() } catch { waited = false }
    if (signal.aborted || current !== attempt) return
    if ((!waited || pending()) && !window.confirm('Some edits still aren’t saved. Leave this page anyway?')) return
    leaving = true
    location.assign(url.href)
  }, { signal })
}
