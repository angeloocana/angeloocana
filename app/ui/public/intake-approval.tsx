import { on } from 'remix/component'
import type { Handle } from 'remix/component'

type Props = {
  clipId: string
  revision?: string
  canApprove: boolean
  categories: readonly { key: string; label: string }[]
  onPending: (pending: boolean) => void
}

export function IntakeApproval(handle: Handle<Props>) {
  let pending = false
  let error = ''
  let hideCaptions = false

  async function approve(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
    event.preventDefault()
    let { clipId, revision, canApprove } = handle.props
    if (pending || !revision || !canApprove) return

    let fields = new FormData(event.currentTarget)
    let cat = String(fields.get('cat') ?? '')
    let label = { en: String(fields.get('en') ?? '').trim(), pt: String(fields.get('pt') ?? '').trim() }
    let captionRejected = fields.has('captionRejected')
    if (!captionRejected && (!label.en || !label.pt)) {
      error = 'Write both captions or select Hide captions.'
      handle.update()
      return
    }

    let signal = handle.signal
    pending = true
    handle.props.onPending(true)
    error = ''
    handle.update()
    try {
      let response = await fetch(`/review/cut/${encodeURIComponent(clipId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', revision, cat, label, captionRejected }),
        signal,
      })
      let result = (await response.json().catch(() => null)) as { added?: boolean; error?: string } | null
      if (signal.aborted) return
      if (response.ok && result?.added === true) {
        handle.props.onPending(false)
        window.location.assign(`/review#${encodeURIComponent(clipId)}`)
        return
      }
      error = typeof result?.error === 'string' && result.error ? result.error : 'Couldn’t add the clip. Try again.'
    } catch {
      if (signal.aborted) return
      error = 'Couldn’t reach the review server. Try again.'
    }
    pending = false
    handle.props.onPending(false)
    handle.update()
  }

  return () => {
    let { clipId, revision, canApprove, categories } = handle.props
    let heading = `intake-approval-${clipId}`
    let status = `${heading}-status`
    let blocker = !canApprove ? 'Review publishing is not ready.' : !revision ? 'Render a private preview before adding it to the site.' : ''
    return (
      <form class="ce-intake-approval" method="post" aria-labelledby={heading} mix={on('submit', approve)}>
        <h2 id={heading}>Review for the site</h2>
        <p>Watch the rendered clip and check who appears. Avoid making strangers the focus, and don’t feature strangers’ children.</p>
        <label>
          Category
          <select name="cat" required disabled={pending}>
            <option value="" selected disabled>Choose a category</option>
            {categories.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label>English caption<input name="en" type="text" maxLength={120} required={!hideCaptions} disabled={pending} /></label>
        <label>Portuguese caption<input name="pt" type="text" maxLength={120} required={!hideCaptions} disabled={pending} /></label>
        <label class="ce-intake-hide">
          <input name="captionRejected" type="checkbox" checked={hideCaptions} disabled={pending} mix={on('change', (event) => {
            hideCaptions = event.currentTarget.checked
            handle.update()
          })} /> Hide captions
        </label>
        <div class="ce-intake-action">
          <button type="submit" class="ce-primary" disabled={pending || Boolean(blocker)} aria-describedby={status}>
            {pending ? 'Adding…' : 'Add to site'}
          </button>
          <p id={status} class="rv-intake-status" role="status" data-error={String(Boolean(error) && !blocker)}>
            {pending ? 'Queuing the clip for publishing…' : blocker || error || 'Queues this clip for publishing.'}
          </p>
        </div>
      </form>
    )
  }
}
