import type { Handle } from 'remix/component'
import { unsafeHTML } from 'remix/component'

import { SITE, SOCIALS } from '../content.ts'
import { type Copy, type Lang } from '../copy.ts'
import { SocialIcon, SocialSprite } from './social-icons.tsx'

// What every page shares: the fonts, the fixed menu with the language flags, the contact links
// and the footer.

// The pointer's ring (app/ui/public/cursor.ts moves it; hidden until it does).
export function Cursor() {
  return () => (
    <div class="cur" aria-hidden="true">
      <span class="cur-label" />
    </div>
  )
}

export function SocialLinks(handle: Handle<{ class: string; t: Copy['links'] }>) {
  return () => (
    <div class={`links ${handle.props.class}`}>
      <a class="link-email" href={`mailto:${SITE.email}`} data-cursor="none">
        <SocialIcon id="email" />
        <span>{SITE.email}</span>
      </a>
      <ul class="socials" aria-label={handle.props.t.elsewhere}>
        {SOCIALS.map((social) => (
          <li key={social.id}>
            <a href={social.url} rel="me noopener" target="_blank" aria-label={`${social.label} (${handle.props.t.newTab})`}>
              <SocialIcon id={social.id} />
              <span>{social.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Flags for the language switch: Canada for English, Brazil for Portuguese.
// Drawn inline (flag emoji don't render on Windows).
function Flag(handle: Handle<{ lang: Lang }>) {
  return () =>
    handle.props.lang === 'pt' ? (
      <svg class="flag" viewBox="0 0 20 14" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="20" height="14" fill="#009b3a" />
        <path d="M10 1.6 18.4 7 10 12.4 1.6 7Z" fill="#fedf00" />
        <circle cx="10" cy="7" r="3.3" fill="#002776" />
        <path d="M6.9 6.4Q10 5.3 13.2 7.2" fill="none" stroke="#fff" stroke-width="0.6" />
      </svg>
    ) : (
      <svg class="flag" viewBox="0 0 28 14" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="28" height="14" fill="#fff" />
        <rect width="7" height="14" fill="#d52b1e" />
        <rect x="21" width="7" height="14" fill="#d52b1e" />
        <path
          fill="#d52b1e"
          d="M14 1.8 15 3.9 16.3 3.4 15.8 6 17.6 4.9 17.9 5.9 19 5.6 18.2 7.6 18.9 8 16.2 9.9 16.5 10.8 14.3 10.5 14.3 12.4 13.7 12.4 13.7 10.5 11.5 10.8 11.8 9.9 9.1 8 9.8 7.6 9 5.6 10.1 5.9 10.4 4.9 12.2 6 11.7 3.4 13 3.9Z"
        />
      </svg>
    )
}


// A section picked from More closes it, before the page's scripts have come too (the list is the element
// just before this script, More's <details> the one before it)
const MENU_PICK = unsafeHTML("let m=document.currentScript.previousSibling;m.onclick=e=>e.target.closest('a')&&(m.previousSibling.open=0)")

/**
 * The fixed menu. On the home page the links jump to sections; elsewhere they go back home first.
 * Both flags always show; the current language is lit. `langHref` says where each flag leads.
 */
export function SiteNav(handle: Handle<{ lang: Lang; t: Copy; home?: boolean; langHref: Record<Lang, string> }>) {
  return () => {
    let { home, lang, langHref, t } = handle.props
    let base = home ? '' : lang === 'pt' ? '/pt/' : '/'
    // On the home page these are #links within it, and data-rmx-document leaves them to the browser, which
    // only scrolls. Without it Remix's client navigation takes a #link to the URL you are already on
    // (no hash change) and reloads the page's frame from the server: the rows jump back to their start, a picked
    // job goes out, the clips are dealt again. Every in-page link on the home page carries it
    // (controller.test.ts checks). Elsewhere these lead home, and stay client navigations.
    let inPage = home ? true : undefined
    return (
      <header class="cin-nav">
        {home && <a class="skip-link" href="#main" data-rmx-document>{t.nav.skip}</a>}
        <a href={home ? '#top' : base} data-rmx-document={inPage} class="cin-mark" aria-label={`Ângelo Ocanã · ${t.nav.top}`}>ÂO</a>
        {/* Phones show the first two sections and More; the rest open under it as a small list. On the home
            page More is a native <details>, so it opens before the scripts have loaded and without JS;
            rails/nav.ts adds the scrim, Escape, a tap outside and the focus. Wide screens show all six in one
            line: the list is display: contents there and More is hidden (home.css). Posts keep the plain
            links to Career, Projects and Contact on phones. */}
        <nav class="cin-menu" aria-label={t.nav.label}>
          {t.nav.chapters.filter((chapter) => chapter.phone !== false).slice(0, 2).map((chapter) => (
            <a key={chapter.href} href={`${base}${chapter.href}`} data-rmx-document={inPage} data-chapter-link={chapter.href.slice(1)}>{chapter.label}</a>
          ))}
          {/* (the list follows the <details> instead of sitting in it: closed, a <details> hides what it holds,
              and on wide screens the list shows in the line whether it is open or not; aria-controls tells
              screen readers that More opens it). A pick closes it, before the scripts have come too
              (MENU_PICK, scripts or not), so the section's heading lands under the menu, not under the open list. */}
          {home && (
            <details class="menu-drop">
              <summary class="menu-toggle" aria-controls="menu-more">
                {t.nav.more}
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </summary>
            </details>
          )}
          <div id="menu-more" class="menu-more">
            {t.nav.chapters.slice(2).map((chapter) => (
              <a key={chapter.href} href={`${base}${chapter.href}`} data-rmx-document={inPage} class={chapter.phone === false ? 'menu-wide' : undefined} data-chapter-link={chapter.href.slice(1)}>{chapter.label}</a>
            ))}
            {/* the page's one pause, in reach from anywhere: an icon at the end of the line on wide screens, the
                last line of the More list on phones, with its words. Every pause on the page shows the same
                state (rails.tsx), and they hide without motion to pause. */}
            {home && (
              <button type="button" class="menu-pause" data-pause data-play={t.hi.motion.play} data-pause-label={t.hi.motion.pause} aria-label={t.hi.motion.pause} title={t.hi.motion.pause}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-pause" d="M8 5v14M16 5v14" /><path class="i-play" d="M8 5.5v13l11-6.5z" /></svg>
                <span data-pause-text aria-hidden="true">{t.hi.motion.pause}</span>
              </button>
            )}
          </div>
          {home && <script innerHTML={MENU_PICK} />}
        </nav>
        {/* the two flags as a small hand of cards: the current one stands taller and ringed */}
        <p class="cin-langs" role="group" aria-label={t.nav.langsLabel}>
          {(['en', 'pt'] as Lang[]).map((code) => (
            <a
              key={code}
              class={`lang-card lang-${code}`}
              href={langHref[code]}
              // a full page load, not client navigation: the browser then lands on the #section the link
              // carries (rails.tsx keeps it current), where client navigation scrolled back to the top
              data-rmx-document
              hrefLang={code}
              lang={code}
              aria-label={t.nav.langs[code]}
              aria-current={code === lang ? 'true' : undefined}
              // the page you're on: still a link, but not a Tab stop on the way to the content
              tabIndex={code === lang ? -1 : undefined}
            >
              <span class="lang-face"><Flag lang={code} /></span>
            </a>
          ))}
        </p>
      </header>
    )
  }
}

export function SiteFoot(handle: Handle<{ t: Copy }>) {
  return () => (
    <footer id="contact" class="cin-foot" data-chapter>
      <h2>{handle.props.t.foot.title}</h2>
      <SocialLinks class="foot-links" t={handle.props.t.links} />
      <p class="cin-fine">© {new Date().getFullYear()} Ângelo Ocanã · {handle.props.t.foot.built}</p>
      {/* the icons' drawings, once: every SocialIcon on the page points here */}
      <SocialSprite />
    </footer>
  )
}
