import { clientEntry, on, ref } from 'remix/component'
import type { Handle } from 'remix/component'

export const AddVideo = clientEntry(import.meta.url, function AddVideo(handle: Handle) {
  let picker: HTMLInputElement
  let pending = false
  let error = ''

  async function add(file: File) {
    if (pending) return
    let extension = /\.(mp4|mov)$/i.exec(file.name)?.[1].toLowerCase()
    if (!extension || !file.size) {
      error = 'Choose a nonempty MP4 or MOV video.'
      handle.update()
      return
    }

    let signal = handle.signal
    pending = true
    error = ''
    handle.update()
    try {
      let response = await fetch('/review/intake', {
        method: 'POST',
        headers: { 'X-Video-Extension': extension },
        body: file,
        signal,
      })
      let result = (await response.json().catch(() => null)) as { clipId?: string; error?: string } | null
      if (signal.aborted) return
      if (response.ok && typeof result?.clipId === 'string' && result.clipId) {
        window.location.assign(`/review/cut/${encodeURIComponent(result.clipId)}`)
        return
      }
      error = typeof result?.error === 'string' && result.error ? result.error : 'Couldn’t prepare the video. Choose a file to try again.'
    } catch {
      if (signal.aborted) return
      error = 'Couldn’t reach the review server. Choose the file again to retry.'
    }
    pending = false
    handle.update()
  }

  return () => (
    <span class="rv-add-video">
      <button type="button" disabled={pending} mix={on('click', () => picker.click())}>+ Add video</button>
      <input
        hidden type="file" accept=".mp4,.mov,video/mp4,video/quicktime" disabled={pending}
        mix={[ref((node) => { picker = node }), on('change', (event) => {
          let input = event.currentTarget
          let file = input.files?.[0]
          input.value = '' // Allow another attempt with the same file.
          if (file) void add(file)
        })]}
      />
      <span class="rv-intake-status" role="status" data-error={String(Boolean(error))}>
        {error || (pending ? 'Preparing a private draft on this Mac…' : 'MP4 or MOV · private draft on this Mac')}
      </span>
    </span>
  )
})
