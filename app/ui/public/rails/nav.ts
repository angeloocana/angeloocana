// The fixed menu: the link of the section in view, the language flags that carry it to the other
// language, and the More list on phones.
import type { Rail } from './rows.ts'

export function setUpNav(signal: AbortSignal, rails: Map<HTMLElement, Rail>) {
  let root = document.documentElement
  let toggle = document.querySelector<HTMLButtonElement>('.menu-toggle')
  let moreList = document.querySelector<HTMLElement>('#menu-more')

  // Two things follow the scroll: the menu link of the section that holds the middle of the screen, and
  // the language flags, whose links carry the #id of the row there (so the other language opens at the same
  // row; a copied link works too; without JS they open the other page at the top). In the career, the
  // flags carry the job in view (#job-…), and in Outside work the clip in view (#clip-…): the other language
  // opens at that card.
  let chapters = [...document.querySelectorAll<HTMLElement>('[data-chapter][id]')]
  let places = [...document.querySelectorAll<HTMLElement>('main section[id], footer[id]')]
  let links = [...document.querySelectorAll<HTMLElement>('[data-chapter-link]')]
  let langLinks = [...document.querySelectorAll<HTMLAnchorElement>('.lang-card')]
  let careerTrack = document.querySelector<HTMLElement>('#career [data-rail-track]')
  let clipsTrack = document.querySelector<HTMLElement>('#outside [data-rail-track]')

  // Where each section starts on the page, measured once and again only when the page changes size (rows
  // growing, fonts, clips appended): a scroll frame then reads scrollY and nothing else.
  let tops = new Map<HTMLElement, number>()
  let pageHeight = 0
  let stale = true
  let measure = () => {
    stale = false
    for (let el of new Set([...chapters, ...places])) tops.set(el, el.getBoundingClientRect().top + scrollY)
    pageHeight = root.scrollHeight
  }
  let sized = new ResizeObserver(() => { stale = true; queue() })
  sized.observe(document.body)
  signal.addEventListener('abort', () => sized.disconnect())
  addEventListener('resize', () => { stale = true; queue() }, { signal })

  // the last section whose top has passed the middle of the screen; at the very bottom, the last one (the
  // footer is too short to reach the middle)
  let at = (list: HTMLElement[]) => {
    let mid = scrollY + innerHeight / 2
    let here = ''
    for (let el of list) if (tops.get(el)! <= mid) here = el.id
    if (scrollY > 0 && innerHeight + scrollY >= pageHeight - 4) here = list.at(-1)?.id ?? here
    return here
  }
  // the first card mostly in view in a sideways row, by its id: a job, a clip; the row's opening card: none.
  // rails/rows.ts keeps where each card sits, so a frame here reads only the row's scroll.
  let cardInView = (track: HTMLElement | null, prefix: string) => {
    let rail = track?.closest<HTMLElement>('[data-rail]')
    let card = rail && rails.get(rail)?.cardInView()
    return card?.id.startsWith(prefix) ? card.id : ''
  }

  // one pass a frame: the reads first, then only the writes that change something
  let lastChapter: string | null = null
  let pending = false
  let queue = () => {
    if (!pending) { pending = true; requestAnimationFrame(update) }
  }
  let update = () => {
    pending = false
    if (stale) measure()
    // nothing is lit on the first screen, above the first chapter
    let chapter = at(chapters)
    let place = at(places)
    if (place === 'top') place = ''
    if (place === 'career') place = cardInView(careerTrack, 'job-') || place
    if (place === 'outside') place = cardInView(clipsTrack, 'clip-') || place

    for (let link of langLinks) if (link.hash.slice(1) !== place) link.hash = place
    if (chapter === lastChapter) return
    lastChapter = chapter
    for (let link of links) {
      if (link.dataset.chapterLink === chapter) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    }
    // on phones the More button stands for the sections under it
    toggle?.toggleAttribute('data-current', !!moreList?.querySelector(`[data-chapter-link="${chapter}"]`))
  }
  addEventListener('scroll', queue, { signal, passive: true })
  careerTrack?.addEventListener('scroll', queue, { signal, passive: true })
  clipsTrack?.addEventListener('scroll', queue, { signal, passive: true })
  // a page opened at a #section scrolls there after this script has run
  addEventListener('load', queue, { signal, once: true })
  addEventListener('hashchange', queue, { signal })

  // Phones: the More button in the menu opens the sections after the first two. Escape, a tap outside or
  // picking one closes it; Escape gives focus back to the button.
  if (toggle && moreList) {
    let button = toggle
    let list = moreList
    button.hidden = false
    // a faint scrim under the header while the list is open: the page reads as covered, and a tap on it
    // closes the list (and only that: the tap doesn't reach the page under it)
    let scrim = document.createElement('div')
    scrim.className = 'menu-scrim'
    scrim.setAttribute('aria-hidden', 'true')
    document.body.append(scrim)
    // a remount builds its own: this one goes with the script that made it
    signal.addEventListener('abort', () => scrim.remove())
    let setOpen = (open: boolean) => {
      button.setAttribute('aria-expanded', String(open))
      list.toggleAttribute('data-open', open)
      scrim.toggleAttribute('data-open', open)
    }
    // focus was in the list, which hides: it goes back to the button
    scrim.addEventListener('click', () => { setOpen(false); button.focus({ preventScroll: true }) }, { signal })
    button.addEventListener('click', () => {
      let open = button.getAttribute('aria-expanded') !== 'true'
      setOpen(open)
      if (open) list.querySelector<HTMLElement>('a:not(.menu-wide), a')?.focus()
    }, { signal })
    list.addEventListener('click', (event) => { if ((event.target as Element).closest('a')) setOpen(false) }, { signal })
    addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || button.getAttribute('aria-expanded') !== 'true') return
      setOpen(false)
      button.focus()
    }, { signal })
    addEventListener('pointerdown', (event) => {
      if (button.getAttribute('aria-expanded') === 'true' && !(event.target as Element).closest('.cin-menu, .menu-scrim')) setOpen(false)
    }, { signal })
    // focus leaving the menu (Tab past the last section) closes it too
    list.addEventListener('focusout', (event) => {
      let to = event.relatedTarget as Element | null
      if (to && !to.closest('.cin-menu')) setOpen(false)
    }, { signal })
  }
  update()
}
