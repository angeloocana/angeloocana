/** What a write queue can tell navigation after waiting: every write it waited on was confirmed by
 * the server, or at least one was not. Navigation never infers success from `busy`, an empty queue
 * or a card's styling: only a queue that saw every reply can say `acknowledged`. */
export type WriteOutcome = 'acknowledged' | 'unconfirmed'

export const allAcknowledged = (outcomes: WriteOutcome[]): WriteOutcome =>
  outcomes.every((outcome) => outcome === 'acknowledged') ? 'acknowledged' : 'unconfirmed'

/** Leave without asking only when the waited-on writes were acknowledged and nothing new is pending. */
export const leaveWithoutAsking = (outcome: WriteOutcome, pending: boolean) => outcome === 'acknowledged' && !pending

/** Wait for review writes on ordinary links; do not lose drafts silently on reload or back. */
export function guardReviewNavigation(pending: () => boolean, settle: () => Promise<WriteOutcome>, signal: AbortSignal) {
  let attempt = 0
  let leaving = false
  window.addEventListener('pageshow', () => { leaving = false }, { signal })
  window.addEventListener('beforeunload', (event) => {
    if (leaving) { leaving = false; return }
    if (!pending()) return
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
    let outcome: WriteOutcome = 'unconfirmed'
    try { outcome = await settle() } catch {}
    if (signal.aborted || current !== attempt) return
    if (!leaveWithoutAsking(outcome, pending()) && !window.confirm('Some changes could not be confirmed. Leave this page anyway?')) return
    leaving = true
    location.assign(url.href)
  }, { signal })
}
