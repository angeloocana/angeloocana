import { clientEntry, on } from 'remix/component'
import type { Handle } from 'remix/component'

import type { PublishInfo } from '../../content/publish.ts'

// Whether the review's changes are on the live site yet (app/content/publish.ts), on /review and the cut
// editor. It asks the server again every few seconds while something is on its way, and right away when
// the page saves a change (the 'review:changed' event).
export const PublishStatus = clientEntry(import.meta.url, function PublishStatus(handle: Handle<{ initial: PublishInfo }>) {
  let info = handle.props.initial
  let asking = false

  async function refresh(method: 'GET' | 'POST' = 'GET') {
    if (asking && method === 'GET') return
    asking = true
    try {
      let response = await fetch('/review/publish', { method, signal: handle.signal })
      if (response.ok) info = (await response.json()) as PublishInfo
    } catch {
      // the dev server is restarting (it does after a publish brings in new code); try again later
    }
    asking = false
    handle.update()
  }

  handle.queueTask(() => {
    let signal = handle.signal
    let soon: ReturnType<typeof setTimeout> | undefined
    window.addEventListener('review:changed', () => {
      clearTimeout(soon)
      soon = setTimeout(() => refresh(), 400)
    }, { signal })
    // the countdown ticks every second; the server is asked every 3 s while busy, else every 20 s
    let ticks = 0
    let timer = setInterval(() => {
      ticks += 1
      let busy = info.state === 'waiting' || info.state === 'running'
      if (ticks % (busy ? 3 : 20) === 0) refresh()
      else if (info.state === 'waiting' && info.dueAt) handle.update()
    }, 1000)
    signal.addEventListener('abort', () => {
      clearInterval(timer)
      clearTimeout(soon)
    })
  })

  return () => {
    let text = info.text
    if (info.state === 'waiting' && info.dueAt) {
      let seconds = Math.max(0, Math.round((info.dueAt - Date.now()) / 1000))
      text = seconds ? `Goes live in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'Publishing…'
    }
    return (
      <div class="pub" data-state={info.state} title={info.detail}>
        <span class="pub-dot" aria-hidden="true" />
        <span class="pub-text" aria-live="polite">{text}</span>
        {(info.state === 'waiting' || info.state === 'failed') && (
          <button type="button" class="pub-now" mix={on('click', () => refresh('POST'))}>
            {info.state === 'failed' ? 'Try again' : 'Publish now'}
          </button>
        )}
        {info.state === 'failed' && info.detail && <small class="pub-detail">{info.detail}</small>}
      </div>
    )
  }
})
