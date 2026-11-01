import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

// Behaviour for the local review page (/review): hover to play, and save each change to clips.json.

// Which clips the cut filter shows (data-cut is set by review-page.tsx: todo, draft, edited or kept).
const CUT_FILTERS: Record<string, (card: HTMLElement) => boolean> = {
  all: () => true,
  todo: (card) => card.dataset.cut === 'todo' && card.dataset.rejected === 'false',
  draft: (card) => card.dataset.cut === 'draft',
  edited: (card) => card.dataset.cut === 'edited',
  kept: (card) => card.dataset.cut === 'kept',
}
const isChecked = (card: HTMLElement) => card.dataset.rejected === 'false' && (card.dataset.cut === 'edited' || card.dataset.cut === 'kept')

export const ReviewBoard = clientEntry(import.meta.url, function ReviewBoard(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal
    let cards = [...document.querySelectorAll<HTMLElement>('.rv')]

    // The filters are remembered (in this browser only), so coming back from Edit cut keeps your place.
    let filters = { source: 'all', cut: 'all', hideRejected: false }
    try {
      Object.assign(filters, JSON.parse(localStorage.getItem('rv-filters') ?? '{}'))
    } catch {}
    function applyFilters() {
      if (!document.querySelector(`[data-source-filter="${filters.source}"]`)) filters.source = 'all'
      if (!CUT_FILTERS[filters.cut]) filters.cut = 'all'
      for (let b of document.querySelectorAll<HTMLElement>('[data-source-filter]')) b.setAttribute('aria-pressed', String(b.dataset.sourceFilter === filters.source))
      for (let b of document.querySelectorAll<HTMLElement>('[data-cut-filter]')) b.setAttribute('aria-pressed', String(b.dataset.cutFilter === filters.cut))
      for (let card of cards) {
        card.hidden = (filters.source !== 'all' && !card.dataset.sources!.split(' ').includes(filters.source)) || !CUT_FILTERS[filters.cut](card)
      }
      for (let group of document.querySelectorAll<HTMLElement>('.rv-group')) group.hidden = !group.querySelector('.rv:not([hidden])')
      document.body.classList.toggle('hide-rejected', filters.hideRejected)
      let toggle = document.querySelector<HTMLInputElement>('[data-hide-rejected]')
      if (toggle) toggle.checked = filters.hideRejected
      try {
        localStorage.setItem('rv-filters', JSON.stringify(filters))
      } catch {}
    }

    // the counts in the header, the cut filter and the category tabs (rejecting a clip changes them)
    function tally() {
      let text = (selector: string, value: number) => document.querySelectorAll(selector).forEach((el) => (el.textContent = String(value)))
      let live = cards.filter((card) => card.dataset.rejected === 'false')
      let checked = live.filter(isChecked).length
      text('[data-live]', live.length)
      text('[data-checkable]', live.length)
      text('[data-checked]', checked)
      let bar = document.querySelector<HTMLElement>('[data-checked-bar]')
      if (bar) bar.style.width = `${live.length ? (checked / live.length) * 100 : 0}%`
      for (let b of document.querySelectorAll<HTMLElement>('[data-cut-filter]')) {
        let count = b.querySelector('span')
        if (count) count.textContent = String(cards.filter(CUT_FILTERS[b.dataset.cutFilter!]).length)
      }
      for (let tab of document.querySelectorAll<HTMLElement>('[data-cat-checked]')) {
        let done = cards.filter((card) => card.closest('section')?.id === tab.dataset.catChecked && isChecked(card)).length
        tab.textContent = `✓${done}`
        tab.hidden = !done
      }
    }
    applyFilters()
    tally()
    // after the filters hide cards, the browser's jump to #clip-id may have missed: do it again
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'center' })

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
      tally()
    }

    // source filter (Instagram, the old phone, …) and cut filter (to check, edited, …)
    document.addEventListener('click', (event) => {
      let button = (event.target as Element).closest<HTMLElement>('[data-source-filter], [data-cut-filter]')
      if (!button) return
      if (button.dataset.sourceFilter) filters.source = button.dataset.sourceFilter
      if (button.dataset.cutFilter) filters.cut = button.dataset.cutFilter
      applyFilters()
    }, { signal })

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
        filters.hideRejected = (target as HTMLInputElement).checked
        applyFilters()
        return
      }
      let card = target.closest<HTMLElement>('.rv')
      if (card && target.matches('select[data-act="cat"]')) save(card, { cat: (target as HTMLSelectElement).value })
      // captions and feedback save when the field loses focus (or on Enter for captions)
      if (card && target.matches('[data-field="en"], [data-field="pt"]')) {
        let value = (field: string) => card.querySelector<HTMLTextAreaElement>(`[data-field="${field}"]`)!.value
        save(card, { label: { en: value('en'), pt: value('pt') } })
      }
      if (card && target.matches('textarea[data-field="note"]')) save(card, { note: (target as HTMLTextAreaElement).value })
    }, { signal })

    // Enter in a caption saves it (captions are one line, even though the box wraps to show it all)
    document.addEventListener('keydown', (event) => {
      let target = event.target as HTMLElement
      if (event.key === 'Enter' && target.matches('.rv-caption textarea')) {
        event.preventDefault()
        target.blur()
      }
    }, { signal })

    // hover (or focus) a card to play it
    for (let card of cards) {
      let video = card.querySelector('video')!
      card.addEventListener('pointerenter', () => video.play().catch(() => {}), { signal })
      card.addEventListener('pointerleave', () => video.pause(), { signal })
    }
  })

  return () => <span hidden />
})
