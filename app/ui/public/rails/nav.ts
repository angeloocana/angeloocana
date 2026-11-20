// The fixed menu: the link of the section in view, the language flags that carry it to the other
// language, and the More list on phones.
export function setUpNav(signal: AbortSignal) {
  let root = document.documentElement
  let toggle = document.querySelector<HTMLButtonElement>('.menu-toggle')
  let moreList = document.querySelector<HTMLElement>('#menu-more')

  // The menu link of the section that holds the middle of the screen.
  let chapters = [...document.querySelectorAll<HTMLElement>('[data-chapter][id]')]
  let links = [...document.querySelectorAll<HTMLElement>('[data-chapter-link]')]
  let last = ''
  let pending = false
  let onScroll = () => {
    if (!pending) { pending = true; requestAnimationFrame(highlight) }
  }
  let highlight = () => {
    pending = false
    // nothing is lit on the first screen, above the first chapter; at the very bottom it's the last one
    // (the footer is too short to reach the middle of the screen)
    let current = ''
    for (let chapter of chapters) if (chapter.getBoundingClientRect().top <= innerHeight / 2) current = chapter.id
    if (scrollY > 0 && innerHeight + scrollY >= root.scrollHeight - 4) current = chapters.at(-1)?.id ?? current
    if (current === last) return
    last = current
    for (let link of links) {
      if (link.dataset.chapterLink === current) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    }
    // on phones the More button stands for the sections under it
    toggle?.toggleAttribute('data-current', !!moreList?.querySelector(`[data-chapter-link="${current}"]`))
  }
  addEventListener('scroll', onScroll, { signal, passive: true })

  // The language flags take you to the same section in the other language: their links carry the #id of
  // the row in the middle of the screen, kept up to date as you scroll (so a copied link works too).
  // Without JS they open the other language's page at the top.
  let langLinks = [...document.querySelectorAll<HTMLAnchorElement>('.lang-card')]
  let places = [...document.querySelectorAll<HTMLElement>('main section[id], footer[id]')]
  // In the career, the job in view instead (#job-…): the other language opens at that job. It's the first
  // card mostly in view (the row scrolls sideways); the intro: no job.
  let careerTrack = document.querySelector<HTMLElement>('#career [data-rail-track]')
  let jobInView = () => {
    if (!careerTrack) return ''
    let left = careerTrack.getBoundingClientRect().left
    let card = ([...careerTrack.children] as HTMLElement[]).find((el) => {
      let r = el.getBoundingClientRect()
      return r.width && r.right - left > r.width * 0.6
    })
    return card?.id.startsWith('job-') ? card.id : ''
  }
  let carryPlace = () => {
    let here = ''
    for (let place of places) if (place.getBoundingClientRect().top <= innerHeight / 2) here = place.id
    if (scrollY > 0 && innerHeight + scrollY >= root.scrollHeight - 4) here = places.at(-1)?.id ?? here
    if (here === 'top') here = ''
    if (here === 'career') here = jobInView() || here
    for (let link of langLinks) if (link.hash.slice(1) !== here) link.hash = here
  }
  let placePending = false
  let queuePlace = () => {
    if (!placePending) { placePending = true; requestAnimationFrame(() => { placePending = false; carryPlace() }) }
  }
  addEventListener('scroll', queuePlace, { signal, passive: true })
  careerTrack?.addEventListener('scroll', queuePlace, { signal, passive: true })
  // a page opened at a #section scrolls there after this script has run
  addEventListener('load', queuePlace, { signal, once: true })
  addEventListener('hashchange', queuePlace, { signal })
  carryPlace()

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
  highlight()
}
