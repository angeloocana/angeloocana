import type { Media } from './media.ts'

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

  // The rest of a row's clips: the same cards the page renders (ClipSlide in home-page.tsx), skipping the
  // ones already there.
  async function appendClips(track: HTMLElement, url: string) {
    let data: { names: Record<string, Record<string, string>>; clips: { id: string; cat: string; star: number; score: number; label: Record<string, string>; captionRejected?: boolean; ig?: string; poster: string; video: string }[] }
    let response = await fetch(url, { signal })
    if (!response.ok) throw new Error(`${url}: ${response.status}`)
    data = await response.json()
    let lang = root.lang === 'pt-BR' ? 'pt' : 'en'
    let words = JSON.parse(track.dataset.words ?? '{}') as Record<string, string>
    let have = new Set([...track.querySelectorAll<HTMLElement>('[data-clip]')].map((el) => el.dataset.clip))
    let icon = track.querySelector('.clip-ig svg')
    let added: HTMLElement[] = []
    for (let clip of data.clips) {
      if (have.has(clip.id)) continue
      let li = document.createElement('li')
      li.className = 'slide clip'
      Object.assign(li.dataset, { clip: clip.id, cat: clip.cat, star: String(clip.star), score: String(clip.score), poster: clip.poster, video: clip.video })
      let img = document.createElement('img')
      Object.assign(img, { className: 'clip-video', src: clip.poster, alt: clip.label[lang], loading: 'lazy', decoding: 'async', width: 540, height: 960 })
      let copy = document.createElement('div')
      copy.className = 'clip-copy'
      copy.setAttribute('aria-hidden', 'true')
      let cat = document.createElement('p')
      cat.className = 'clip-cat'
      cat.textContent = data.names[lang][clip.cat]
      copy.append(cat)
      if (!clip.captionRejected) {
        let label = document.createElement('p')
        label.className = 'clip-label'
        label.textContent = clip.label[lang]
        copy.append(label)
      }
      li.append(img, copy)
      if (clip.ig) {
        let a = document.createElement('a')
        Object.assign(a, { className: 'clip-ig', href: clip.ig, target: '_blank', rel: 'noopener', tabIndex: -1 })
        a.setAttribute('aria-label', `${words.ig}: ${clip.label[lang]} (${words.newTab})`)
        a.dataset.cursor = 'Instagram'
        if (icon) a.append(icon.cloneNode(true))
        li.append(a)
      }
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
  let pool = clips.filter((c) => !fixed.includes(c)).map((el) => ({ el, rank: Number(el.dataset.score || 0) + Math.random() * 2.2 }))
  let order: HTMLElement[] = []
  while (pool.length) {
    let recent = [...fixed, ...order].slice(-2).map((c) => c.dataset.cat)
    let score = (p: { el: HTMLElement; rank: number }) => p.rank - (recent.includes(p.el.dataset.cat) ? 10 : 0)
    pool.sort((a, b) => score(b) - score(a))
    order.push(pool.shift()!.el)
  }
  let after: Element | null = fixed.at(-1) ?? clips[0]?.previousElementSibling ?? null
  for (let clip of order) {
    if (after) after.after(clip)
    else track.prepend(clip)
    after = clip
  }
}
