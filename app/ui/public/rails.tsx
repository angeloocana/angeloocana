import { clientEntry } from 'remix/component'
import type { Handle } from 'remix/component'

import { setUpClips } from './rails/clips.ts'
import { setUpHero } from './rails/hero.ts'
import { setUpMedia } from './rails/media.ts'
import { setUpMotion } from './rails/motion.ts'
import { setUpNav } from './rails/nav.ts'
import { setUpRail } from './rails/rows.ts'

// The home page's one script for its rows and chrome, in focused parts under rails/:
//   motion.ts  one pause for all the automatic motion, and reduced motion followed live
//   rows.ts    each sideways row: arrows, count, edge fades, chips, keyboard, drag, jump links
//   clips.ts   the rest of the clips, appended from the build's JSON, and their shuffle
//   media.ts   videos only while on screen, clip players only near it, the cycling screens
//   nav.ts     the menu's current section, the language flags' #section, the More list on phones
//   hero.ts    the title intro, the plane, the device clusters that follow the mouse
// Without JS the rows still scroll.
export const Rails = clientEntry(import.meta.url, function Rails(handle: Handle) {
  handle.queueTask(() => {
    let signal = handle.signal
    document.documentElement.classList.add('js-rails')
    // [data-reveal] lists (the career menu) roll in once, the first time a quarter of them is on screen.
    // First, so nothing that fails after it can leave them hidden (html.js-rails hides them until then).
    let reveal = new IntersectionObserver((entries) => {
      for (let { target, isIntersecting } of entries) {
        if (!isIntersecting) continue
        target.setAttribute('data-shown', '')
        reveal.unobserve(target)
      }
    }, { threshold: 0.25 })
    for (let list of document.querySelectorAll('[data-reveal]')) reveal.observe(list)
    signal.addEventListener('abort', () => reveal.disconnect())

    let motion = setUpMotion(signal)
    let media = setUpMedia(signal, motion)
    let clips = setUpClips(signal, media)
    let rails = new Map([...document.querySelectorAll<HTMLElement>('[data-rail]')].map((rail) => [rail, setUpRail(rail, { signal, motion, clips })]))
    setUpNav(signal, rails)
    setUpHero(signal, motion)
  })

  return () => <span hidden />
})
