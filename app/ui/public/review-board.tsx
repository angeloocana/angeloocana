import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

// Behaviour for the local review page (/review): hover to play, and save each change to clips.json.
export const ReviewBoard = clientEntry(import.meta.url, function ReviewBoard(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal

    async function save(card: HTMLElement, patch: Record<string, unknown>) {
      // show the change at once, so quick repeated clicks build on it
      if ('star' in patch) card.dataset.star = String(patch.star)
      if ('rejected' in patch) card.dataset.rejected = String(patch.rejected)
      card.classList.add('is-saving')
      let response = await fetch('/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: card.dataset.id, ...patch }) })
      card.classList.remove('is-saving')
      if (!response.ok) {
        card.classList.add('is-error')
        return
      }
      let clip = (await response.json()) as { star: number; rejected: boolean; cat: string }
      card.dataset.moved = card.closest('section')?.id === clip.cat ? undefined : 'true'
      if (card.dataset.moved !== 'true') delete card.dataset.moved
      let saved = card.querySelector<HTMLElement>('.rv-saved')
      if (saved) {
        saved.textContent = 'Saved'
        setTimeout(() => (saved.textContent = ''), 1400)
      }
      let live = document.querySelectorAll('.rv[data-rejected="false"]').length
      let counter = document.querySelector('[data-live]')
      if (counter) counter.textContent = String(live)
    }

    document.addEventListener('click', (event) => {
      let button = (event.target as Element).closest<HTMLElement>('[data-act]')
      let card = button?.closest<HTMLElement>('.rv')
      if (!button || !card || button.tagName === 'SELECT') return
      if (button.dataset.act === 'star') save(card, { star: (Number(card.dataset.star) + 1) % 4 })
      if (button.dataset.act === 'reject') save(card, { rejected: card.dataset.rejected !== 'true' })
      if (button.dataset.act === 'caption') {
        card.dataset.captionRejected = String(card.dataset.captionRejected !== 'true')
        save(card, { captionRejected: card.dataset.captionRejected === 'true' })
      }
    }, { signal })

    document.addEventListener('change', (event) => {
      let target = event.target as HTMLElement
      if (target.matches('[data-hide-rejected]')) {
        document.body.classList.toggle('hide-rejected', (target as HTMLInputElement).checked)
        return
      }
      let card = target.closest<HTMLElement>('.rv')
      if (card && target.matches('select[data-act="cat"]')) save(card, { cat: (target as HTMLSelectElement).value })
      // captions and feedback save when the field loses focus (or on Enter for captions)
      if (card && target.matches('input[data-field]')) {
        let value = (field: string) => card.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)!.value
        save(card, { label: { en: value('en'), pt: value('pt') } })
      }
      if (card && target.matches('textarea[data-field="note"]')) save(card, { note: (target as HTMLTextAreaElement).value })
    }, { signal })

    // hover (or focus) a card to play it
    for (let card of document.querySelectorAll<HTMLElement>('.rv')) {
      let video = card.querySelector('video')!
      card.addEventListener('pointerenter', () => video.play().catch(() => {}), { signal })
      card.addEventListener('pointerleave', () => video.pause(), { signal })
    }
  })

  return () => <span hidden />
})
