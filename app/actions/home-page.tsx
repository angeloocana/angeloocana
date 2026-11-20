import type { Handle } from 'remix/component'

import { Document } from './document.tsx'
import { homeOrder } from '../content/clips.ts'
import { COPY, HREF, type Lang } from '../copy.ts'
import { Ice } from '../ui/public/ice.tsx'
import { Rails } from '../ui/public/rails.tsx'
import { JojDemo } from '../ui/public/joj-demo.tsx'
import { TicTacToe } from '../ui/public/tic-tac-toe.tsx'
import { PoolTiles } from '../ui/public/pool-tiles.tsx'
import { Cursor, SiteFoot, SiteNav } from '../ui/chrome.tsx'
import { Career } from '../ui/home/career.tsx'
import { Hero } from '../ui/home/hero.tsx'
import { Learning } from '../ui/home/learning.tsx'
import { Outside } from '../ui/home/outside.tsx'
import { Posts } from '../ui/home/posts.tsx'
import { Projects } from '../ui/home/projects.tsx'

export { clipsJson, CLIPS_IN_PAGE } from '../ui/home/outside.tsx'
export { formatDate } from '../ui/home/posts.tsx'

// The home page: the hero, then one row per section (each section's renderer is in app/ui/home/), the
// work first: Career, the personal projects, then Outside work, Learning and Posts.
export function HomePage(handle: Handle<{ lang: Lang }>) {
  return () => {
    let { lang } = handle.props
    let t = COPY[lang]
    let clips = homeOrder()
    // each section's name, the same in the menu and on the row
    let nav = (href: string) => t.nav.chapters.find((chapter) => chapter.href === href)!.label
    return (
      <Document
        lang={lang}
        title={t.meta.title}
        description={t.meta.description}
        locale={t.meta.locale}
        bodyClass="cin"
        bundle="home"
        scripts="after-paint"
        themeColor="#070707"
        intro
      >
        <Rails />
        <JojDemo />
        <TicTacToe />
        <PoolTiles />
        <Cursor />

        <div class="cin-intro" aria-hidden="true">
          <p>
            <span>Ângelo Ocanã</span>
            <em>{t.intro}</em>
          </p>
        </div>

        <SiteNav lang={lang} t={t} home langHref={HREF} />

        {/* what a row says to screen readers once it settles, for every row (rails/rows.ts) */}
        <main id="main" tabIndex={-1} data-at={JSON.stringify(t.rail.at)}>
          <Hero lang={lang} t={t} clips={clips} />
          <Career lang={lang} t={t} nav={nav} />
          <Projects lang={lang} t={t} nav={nav} />
          <Outside lang={lang} t={t} clips={clips} nav={nav} />
          <Learning lang={lang} t={t} nav={nav} />
          <Posts lang={lang} t={t} nav={nav} />
        </main>

        <SiteFoot t={t} />

        {/* one sheet of ice over the whole page, fixed to the screen: frost on its edges and in the gaps
            between sections, clear over the words and the cards (ice.tsx) */}
        <Ice />
      </Document>
    )
  }
}
