import type { Lang } from '../../../copy.ts'
import { clipView, type ClipData } from '../clip-card.ts'
import type { Media } from './media.ts'
import { takeTurns } from '../take-turns.ts'

// The clips row carries its first few clips in the page; the rest come from the JSON the build writes
// (scripts/build.ts), loaded once for a row: the row coming near, or a hobby chip, whichever is first.
export function setUpClips(signal: AbortSignal, media: Media) {
  let root = document.documentElement
  let loading = new Map<HTMLElement, Promise<boolean>>()

  // A failed load is forgotten, so the next try (the row coming near again, a hobby chip) fetches again.
  let loadMore = (track: HTMLElement) => {
    let more = track.dataset.more
    if (!more) return Promise.resolve(true)
    if (!loading.has(track)) {
      let load = appendClips(track, more).then(() => {
        if (track.hasAttribute('data-shuffle')) shuffle(track)
        track.dispatchEvent(new Event('scroll'))
        return true
      }, () => {
        loading.delete(track)
        return false
      })
      loading.set(track, load)
    }
    return loading.get(track)!
  }

  // The rest of a row's clips: copies of the page's own empty card (<template id="clip-card">, the same
  // ClipCard that rendered the first ones), filled from clipView like those were, skipping the ones already there.
  async function appendClips(track: HTMLElement, url: string) {
    let response = await fetch(url, { signal })
    if (!response.ok) throw new Error(`${url}: ${response.status}`)
    let data = (await response.json()) as { names: Record<Lang, Record<string, string>>; clips: ClipData[] }
    let template = document.querySelector<HTMLTemplateElement>('#clip-card')
    if (!template) return
    let lang: Lang = root.lang === 'pt-BR' ? 'pt' : 'en'
    let row = JSON.parse(track.dataset.words ?? '{}') as { ig: string; newTab: string }
    let words = { names: data.names[lang], ig: row.ig, newTab: row.newTab }
    let have = new Set([...track.querySelectorAll<HTMLElement>('[data-clip]')].map((el) => el.dataset.clip))
    let added: HTMLElement[] = []
    for (let clip of data.clips) {
      if (have.has(clip.id)) continue
      let view = clipView(clip, lang, words)
      let li = (template.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement
      Object.assign(li.dataset, view.data)
      li.id = `clip-${clip.id}`
      let img = li.querySelector('img')!
      img.src = view.poster
      img.alt = view.alt
      li.querySelector('.clip-cat')!.textContent = view.cat
      let caption = li.querySelector('.clip-label')!
      if (view.caption) caption.textContent = view.caption
      else caption.remove()
      let ig = li.querySelector<HTMLAnchorElement>('.clip-ig')!
      if (view.ig) {
        ig.href = view.ig.href
        ig.setAttribute('aria-label', view.ig.label)
      } else ig.remove()
      added.push(li)
    }
    track.append(...added)
    media.addSlides(added)
    track.dispatchEvent(new Event('scroll'))
  }

  return { loadMore, shuffle }
}

// Starred clips stay first. The rest are dealt again on every visit: the strongest clips (data-score)
// still lead, with a little chance mixed in, and a category waits until two others have had a turn.
export function shuffle(track: HTMLElement) {
  let clips = [...track.querySelectorAll<HTMLElement>('[data-cat]')]
  let fixed = clips.filter((c) => c.dataset.star && c.dataset.star !== '0')
  let rest = clips.filter((c) => !fixed.includes(c))
  let order = takeTurns(rest, (el) => Number(el.dataset.score || 0) + Math.random() * 2.2, (el) => el.dataset.cat ?? '', fixed)
  let after: Element | null = fixed.at(-1) ?? clips[0]?.previousElementSibling ?? null
  for (let clip of order) {
    if (after) after.after(clip)
    else track.prepend(clip)
    after = clip
  }
}
