import type { Handle } from 'remix/component'

import { CATEGORIES, CATEGORY_NAMES, clipUrl, homeOrder, instagramUrl, type Clip } from '../../content/clips.ts'
import { SOCIALS } from '../../content.ts'
import type { Copy, Lang } from '../../copy.ts'
import { clipView, type ClipData, type ClipWords } from '../public/clip-card.ts'
import { SocialIcon } from '../social-icons.tsx'
import { Row } from './shared.tsx'

const INSTAGRAM = SOCIALS.find((social) => social.id === 'instagram')!.url

/** How many clips the page carries; rails/clips.ts fetches the rest from /data/clips.json as the row nears view. */
export const CLIPS_IN_PAGE = 12

/** The hobby chips over the clips row leave out the ones with fewer clips than this. */
const CHIP_MIN = 3

// Outside work: the clips, hobbies taking turns. The page carries the first few; rails/clips.ts fetches the
// rest (data-more) as the row comes near, and fills a copy of the <template> card for each.
export function Outside(handle: Handle<{ lang: Lang; t: Copy; clips: Clip[]; nav: (href: string) => string }>) {
  return () => {
    let { clips, lang, nav, t } = handle.props
    let words: ClipWords = { names: CATEGORY_NAMES[lang], ig: t.hi.onInstagram, newTab: t.links.newTab }
    return (
      <>
      <Row
        id="outside"
        class="row-outside"
        label={nav('#outside')}
        t={t.rail}
        arrows={t.rail.clips}
        count="clip"
        total={clips.length}
        next={{ href: '#learning', label: nav('#learning') }}
        chapter
        backdrop
        shuffle
        more="/data/clips.json"
        words={{ ig: words.ig, newTab: words.newTab }}
        introClass="intro-outside"
        intro={<>
          <p class="cin-kicker">{t.outside.kicker}</p>
          <h2>{t.outside.title[0]}<em>{t.outside.title[1]}</em>{t.outside.title[2]}</h2>
          <p>{t.outside.body(clips.length)}</p>
          <p class="cap-ctas">
            <a class="cin-btn" href={INSTAGRAM} rel="me noopener" target="_blank">{t.outside.instagram} <span aria-hidden="true">↗</span></a>
          </p>
        </>}
        keys={t.outside.keys}
        pause={t.hi.motion}
        head={<HobbyChips clips={clips} lang={lang} t={t} />}
      >
        {clips.slice(0, CLIPS_IN_PAGE).map((clip) => <ClipCard key={clip.id} view={clipView(clipData(clip), lang, words)} />)}
      </Row>
      {/* the card the rest of the clips are made from (rails/clips.ts fills a copy of it with clipView) */}
      <template id="clip-card"><ClipCard /></template>
      </>
    )
  }
}

// Over the clips row: a quiet chip per hobby (the ones with a few clips), each sliding the row to its first
// clip (rails.tsx; it loads the rest of the clips first when it has to). Needs JS, so it is hidden without.
function HobbyChips(handle: Handle<{ clips: Clip[]; lang: Lang; t: Copy }>) {
  return () => {
    let { clips, lang, t } = handle.props
    let counts = new Map(CATEGORIES.map((cat) => [cat, clips.filter((clip) => clip.cat === cat).length]))
    let cats = CATEGORIES.filter((cat) => counts.get(cat)! >= CHIP_MIN).sort((a, b) => counts.get(b)! - counts.get(a)!)
    // a visible name first, so the chips read as places to jump to, not filters; the one picked stays
    // pressed only while the row shows its hobby (rails.tsx)
    return (
      <div class="clip-jump">
        <p class="clip-jump-label" id="clip-jump-label">{t.outside.jump}</p>
        <ul class="clip-chips" aria-labelledby="clip-jump-label">
          {cats.map((cat) => (
            <li key={cat}>
              <button type="button" data-rail-cat={cat} aria-pressed="false">{CATEGORY_NAMES[lang][cat]} <small>{counts.get(cat)}</small></button>
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

/** A clip as /data/clips.json carries it, and as the page's own cards are made from. */
export function clipData(clip: Clip): ClipData {
  return {
    id: clip.id,
    cat: clip.cat,
    star: clip.star,
    score: clip.score,
    label: clip.label,
    captionRejected: clip.captionRejected || undefined,
    ig: instagramUrl(clip),
    poster: clipUrl(clip.id, 'jpg'),
    video: clipUrl(clip.id, 'mp4'),
  }
}

/** Every live clip, for rails/clips.ts to append the ones the page leaves out (served at /data/clips.json). */
export function clipsJson() {
  return { names: CATEGORY_NAMES, clips: homeOrder().map(clipData) }
}

// One clip: a still (rails/media.ts adds the video player only while the clip is near the screen, because
// phones crash with a hundred video players on one page), its hobby and caption, and its Instagram link,
// out of the Tab order: rails/rows.ts makes only the clip in view tabbable (a roving tabindex), and the
// arrow keys move between clips from there. Without a view it is the empty card of the <template>.
function ClipCard(handle: Handle<{ view?: ReturnType<typeof clipView> }>) {
  return () => {
    let { view } = handle.props
    let data = view && Object.fromEntries(Object.entries(view.data).map(([k, v]) => [`data-${k}`, v]))
    // its id (#clip-…) is what the language flags carry, so the other language opens at this clip (rails/nav.ts)
    return (
      <li class="slide clip" id={view && `clip-${view.data.clip}`} {...data}>
        <img class="clip-video" src={view?.poster} alt={view?.alt ?? ''} loading="lazy" decoding="async" width="540" height="960" />
        <div class="clip-copy" aria-hidden="true">
          <p class="clip-cat">{view?.cat}</p>
          {(!view || view.caption) && <p class="clip-label">{view?.caption}</p>}
        </div>
        {(!view || view.ig) && (
          <a class="clip-ig" href={view?.ig?.href} target="_blank" rel="noopener" tabIndex={-1} aria-label={view?.ig?.label} data-cursor="Instagram">
            <SocialIcon id="instagram" />
          </a>
        )}
      </li>
    )
  }
}
