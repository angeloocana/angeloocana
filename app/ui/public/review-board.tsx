import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

import type { ReviewPatch } from '../../actions/review-page.tsx'
import type { Clip } from '../../content/clips.ts'
import { guardReviewNavigation } from './review-navigation.ts'

// Behaviour for the local review page (/review): hover to play and save each change.

// Counts report confirmed edits. The controls can show newer, not-yet-saved choices.
const isLive = (card: HTMLElement) => card.dataset.savedRejected === 'false'
const isChecked = (card: HTMLElement) => isLive(card) && (card.dataset.cut === 'edited' || card.dataset.cut === 'kept')
const CUT_FILTERS: Record<string, (card: HTMLElement) => boolean> = {
  all: () => true,
  todo: (card) => card.dataset.cut === 'todo' && isLive(card),
  draft: (card) => card.dataset.cut === 'draft',
  edited: (card) => card.dataset.cut === 'edited',
  kept: (card) => card.dataset.cut === 'kept',
}

type SavedClip = Pick<Clip, 'cat' | 'rejected'>
type Feedback = { state: 'saving' | 'saved' } | { state: 'error'; message: string }

export async function postReviewPatch(id: string, patch: ReviewPatch, signal: AbortSignal, transport = fetch): Promise<SavedClip> {
  let response: Response
  try {
    response = await transport('/review', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...patch }), signal,
    })
  } catch {
    throw new Error('Could not confirm the save. Check your connection.')
  }
  let body = (await response.json().catch(() => null)) as (Partial<Clip> & { error?: string }) | null
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? `Could not save: ${body.error}` : `Could not confirm the save (HTTP ${response.status}).`)
  }
  if (body?.id !== id || typeof body.cat !== 'string' || typeof body.rejected !== 'boolean' ||
      (patch.star !== undefined && body.star !== patch.star) ||
      (patch.rejected !== undefined && body.rejected !== patch.rejected) ||
      (patch.cat !== undefined && body.cat !== patch.cat) ||
      (patch.captionRejected !== undefined && !!body.captionRejected !== patch.captionRejected) ||
      (patch.label && (typeof body.label?.en !== 'string' || typeof body.label?.pt !== 'string'))) {
    throw new Error('Could not confirm the save. The server sent an unexpected reply.')
  }
  return body as SavedClip
}

function mergePatch(older: ReviewPatch | undefined, newer: ReviewPatch | undefined): ReviewPatch {
  return {
    ...older, ...newer,
    ...(older?.label || newer?.label ? { label: { ...older?.label, ...newer?.label } } : {}),
  }
}

// One writer per card. Changes queued during a request are absolute values and replace older
// values for the same field. An unconfirmed write is kept until retried, without losing newer edits.
export function reviewWrites(
  send: (patch: ReviewPatch) => Promise<SavedClip>,
  onSaved: (clip: SavedClip) => void,
  onFeedback: (feedback: Feedback) => void,
) {
  let pending: ReviewPatch | undefined
  let running = false
  let failed = false
  let active = Promise.resolve()

  async function flush() {
    if (running || failed || !pending) return
    running = true
    onFeedback({ state: 'saving' })
    while (pending) {
      let patch = pending
      pending = undefined
      let clip: SavedClip
      try {
        clip = await send(patch)
      } catch (error) {
        pending = mergePatch(patch, pending)
        running = false
        failed = true
        onFeedback({ state: 'error', message: (error as Error).message })
        return
      }
      onSaved(clip)
    }
    running = false
    onFeedback({ state: 'saved' })
  }

  function drain() {
    if (!running && !failed && pending) active = flush()
    return active
  }

  return {
    get busy() { return running || Boolean(pending) },
    settle: () => active,
    edit(patch: ReviewPatch) {
      pending = mergePatch(pending, patch)
      return drain()
    },
    retry() {
      failed = false
      return drain()
    },
    // Do not race an urgent takedown with pending edits or a subsequent restore.
    exclusive(work: () => Promise<void>) {
      if (running || pending) return
      running = true
      active = (async () => {
        try {
          await work()
        } finally {
          running = false
          await flush()
        }
      })()
      return active
    },
  }
}

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
        // Keep an unsaved rejection reachable for retry, even when the active filter hides rejects.
        let keep = card.matches('.is-saving, .has-save-error')
        let cutMatches = CUT_FILTERS[filters.cut](card) || (keep && filters.cut === 'todo' && card.dataset.cut === 'todo')
        card.hidden = (filters.source !== 'all' && !card.dataset.sources!.split(' ').includes(filters.source)) ||
          !cutMatches || (filters.hideRejected && !isLive(card) && !keep)
      }
      for (let group of document.querySelectorAll<HTMLElement>('.rv-group')) group.hidden = !group.querySelector('.rv:not([hidden])')
      let toggle = document.querySelector<HTMLInputElement>('[data-hide-rejected]')
      if (toggle) toggle.checked = filters.hideRejected
      try {
        localStorage.setItem('rv-filters', JSON.stringify(filters))
      } catch {}
    }

    // the counts in the header, the cut filter and the category tabs (rejecting a clip changes them)
    function tally() {
      let text = (selector: string, value: number) => document.querySelectorAll(selector).forEach((el) => (el.textContent = String(value)))
      let live = cards.filter(isLive)
      let checked = live.filter(isChecked).length
      text('[data-live]', live.length)
      text('[data-rejected-count]', cards.length - live.length)
      text('[data-checkable]', live.length)
      text('[data-checked]', checked)
      let bar = document.querySelector<HTMLElement>('[data-checked-bar]')
      if (bar) bar.style.width = `${live.length ? (checked / live.length) * 100 : 0}%`
      for (let b of document.querySelectorAll<HTMLElement>('[data-cut-filter]')) {
        let count = b.querySelector('span')
        if (count) count.textContent = String(cards.filter(CUT_FILTERS[b.dataset.cutFilter!]).length)
      }
      for (let tab of document.querySelectorAll<HTMLElement>('[data-cat-live]')) {
        let group = cards.filter((card) => card.closest('section')?.id === tab.dataset.catLive)
        tab.textContent = `${group.filter(isLive).length}/${group.length}`
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

    function cardActions(card: HTMLElement) {
      let id = card.dataset.id!
      let status = card.querySelector<HTMLElement>('.rv-saved')!
      let retry = card.querySelector<HTMLButtonElement>('[data-act="retry"]')!
      let takedown = card.querySelector<HTMLButtonElement>('[data-act="takedown"]')
      let savedCategory: string | undefined
      let clearStatus: ReturnType<typeof setTimeout> | undefined

      function feedback(state: Feedback['state'], message: string, retryable = false) {
        if (signal.aborted) return
        clearTimeout(clearStatus)
        card.classList.toggle('is-saving', state === 'saving')
        card.classList.toggle('is-error', state === 'error')
        card.classList.toggle('has-save-error', retryable)
        status.textContent = message
        retry.hidden = !retryable
        if (takedown) takedown.disabled = state === 'saving' || retryable
        applyFilters()
      }

      let writes = reviewWrites(
        (patch) => postReviewPatch(id, patch, signal),
        (clip) => {
          if (signal.aborted) return
          savedCategory = clip.cat
          card.dataset.savedRejected = String(clip.rejected)
          tally()
          window.dispatchEvent(new Event('review:changed'))
        },
        (result) => {
          if (result.state === 'saving') feedback('saving', 'Saving…')
          if (result.state === 'error') feedback('error', result.message, true)
          if (result.state === 'saved') {
            card.toggleAttribute('data-moved', card.closest('section')?.id !== savedCategory)
            feedback('saved', 'Saved')
            clearStatus = setTimeout(() => { status.textContent = '' }, 1400)
          }
        },
      )

      return {
        pending: () => writes.busy,
        settle: writes.settle,
        save(patch: ReviewPatch) {
          // These controls use the latest local choice, not the last reply from the server.
          if (patch.star !== undefined) card.dataset.star = String(patch.star)
          if (patch.rejected !== undefined) card.dataset.rejected = String(patch.rejected)
          if (patch.captionRejected !== undefined) card.dataset.captionRejected = String(patch.captionRejected)
          void writes.edit(patch)
        },
        retry() { void writes.retry() },
        takeDown() {
          if (!takedown || writes.busy || isLive(card) || card.dataset.rejected !== 'true' ||
              !window.confirm('Remove this rejected clip’s public files now? Older pages may still link to them and copies already cached can remain. Your original files on this Mac are not deleted.')) return
          void writes.exclusive(async () => {
            feedback('saving', 'Removing public files…')
            try {
              let response = await fetch(`/review/takedown/${encodeURIComponent(id)}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: true }), signal,
              })
              let result = await response.json().catch(() => null)
              if (!response.ok || !result?.removed) throw new Error(result?.error ?? 'Takedown did not finish. Try again.')
              feedback('saved', 'Public files removed. Cached copies can still remain.')
            } catch (error) {
              feedback('error', (error as Error).message || 'Takedown did not finish. Try again.')
            }
          })
        },
      }
    }
    let actions = new Map(cards.map((card) => [card, cardActions(card)]))
    function editedField() {
      let field = document.activeElement
      return field instanceof HTMLTextAreaElement && field.matches('.rv textarea[data-field]') && field.value !== field.defaultValue ? field : undefined
    }
    guardReviewNavigation(
      () => Boolean(editedField()) || [...actions.values()].some((card) => card.pending()),
      async () => {
        editedField()?.blur()
        await Promise.all([...actions.values()].map((card) => card.settle()))
      },
      signal,
    )

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
      let controls = actions.get(card)!
      if (button.dataset.act === 'star') controls.save({ star: (Number(card.dataset.star) + 1) % 4 })
      if (button.dataset.act === 'reject') controls.save({ rejected: card.dataset.rejected !== 'true' })
      if (button.dataset.act === 'caption') controls.save({ captionRejected: card.dataset.captionRejected !== 'true' })
      if (button.dataset.act === 'retry') controls.retry()
      if (button.dataset.act === 'takedown') controls.takeDown()
    }, { signal })

    document.addEventListener('change', (event) => {
      let target = event.target as HTMLElement
      if (target.matches('[data-hide-rejected]')) {
        filters.hideRejected = (target as HTMLInputElement).checked
        applyFilters()
        return
      }
      let card = target.closest<HTMLElement>('.rv')
      if (!card) return
      let controls = actions.get(card)!
      if (target instanceof HTMLSelectElement && target.dataset.act === 'cat') controls.save({ cat: target.value as Clip['cat'] })
      // Captions and feedback save when the field loses focus (or on Enter for captions).
      if (target instanceof HTMLTextAreaElement) {
        let field = target.dataset.field
        target.defaultValue = target.value // This value is now tracked by the card's write queue.
        if (field === 'en' || field === 'pt') controls.save({ label: { [field]: target.value } })
        if (field === 'note') controls.save({ note: target.value })
      }
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
