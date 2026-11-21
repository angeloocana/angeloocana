import { clientEntry, on } from 'remix/component'
import type { Handle } from 'remix/component'

import type { PublishInfo } from '../../content/publish.ts'

// Whether the review's changes are on the live site yet (app/content/publish.ts), on /review and the cut
// editor. It asks the server again every few seconds while something is on its way, and right away when
// the page saves a change (the 'review:changed' event).
export const PublishStatus = clientEntry(import.meta.url, function PublishStatus(handle: Handle<{ initial: PublishInfo }>) {
  let info = handle.props.initial
  let asking: 'GET' | 'POST' | undefined
  let requestId = 0

  async function refresh(method: 'GET' | 'POST' = 'GET') {
    if (asking && (method === 'GET' || asking === 'POST')) return
    let id = ++requestId
    asking = method
    if (method === 'POST') handle.update()
    try {
      let action = method === 'POST' ? {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: info.action === 'Recover' ? 'recover' : 'publish' }),
      } : undefined
      let response = await fetch('/review/publish', { method, signal: handle.signal, ...action })
      if (response.ok || (method === 'POST' && response.status === 409)) {
        let next = (await response.json()) as PublishInfo
        if (id === requestId) info = next
      }
    } catch {
      // The dev server may be restarting; try again on the next poll.
    }
    if (id === requestId) {
      asking = undefined
      handle.update()
    }
  }

  handle.queueTask(() => {
    let signal = handle.signal
    let soon: ReturnType<typeof setTimeout> | undefined
    window.addEventListener('review:changed', () => {
      clearTimeout(soon)
      soon = setTimeout(() => refresh(), 400)
    }, { signal })
    let ticks = 0
    let timer = setInterval(() => {
      ticks += 1
      let busy = info.state === 'queued' || info.state === 'running' || info.state === 'pushed'
      if (ticks >= (busy ? 3 : 20)) {
        ticks = 0
        void refresh()
      }
    }, 1000)
    signal.addEventListener('abort', () => {
      clearInterval(timer)
      clearTimeout(soon)
    })
  })

  return () => (
    <div class="pub" data-state={info.state} title={info.detail}>
      <span class="pub-dot" aria-hidden="true" />
      <span class="pub-text" aria-live="polite">{info.text}</span>
      {info.action && (
        <button type="button" class="pub-now" disabled={asking === 'POST'} mix={on('click', () => refresh('POST'))}>
          {info.action}
        </button>
      )}
      {info.state === 'failed' && info.detail && <small class="pub-detail">{info.detail}</small>}
      {info.cleanupWarning && <small class="pub-cleanup" aria-live="polite">Cleanup failed: {info.cleanupWarning}</small>}
    </div>
  )
})
