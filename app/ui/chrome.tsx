import type { Handle } from 'remix/component'

import { SITE, SOCIALS } from '../content.ts'
import { type Copy, type Lang } from '../copy.ts'
import { SocialIcon } from './social-icons.tsx'

// What every page shares: the fonts, the fixed menu with the language flags, the contact links
// and the footer.

// Instrument Serif + Inter carry the film; each project borrows its product's own type:
// Barlow Condensed for track2.fit, Fraunces for Jump Over Jump.
export const FONTS =
  'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&family=Barlow+Condensed:ital,wght@1,700;1,800&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&display=swap'

export function SocialLinks(handle: Handle<{ class: string; t: Copy['links'] }>) {
  return () => (
    <div class={`links ${handle.props.class}`}>
      <a class="link-email" href={`mailto:${SITE.email}`} data-cursor={handle.props.t.write}>
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


/**
 * The fixed menu. On the home page the links jump to sections; elsewhere they go back home first.
 * Both flags always show; the current language is lit. `langHref` says where each flag leads.
 */
export function SiteNav(handle: Handle<{ lang: Lang; t: Copy; home?: boolean; langHref: Record<Lang, string> }>) {
  return () => {
    let { home, lang, langHref, t } = handle.props
    let base = home ? '' : lang === 'pt' ? '/pt' : '/'
    return (
      <header class="cin-nav">
        <a href={home ? '#top' : base} class="cin-mark" data-cursor={t.nav.top}>ÂO</a>
        <nav class="cin-menu" aria-label={t.nav.label}>
          {t.nav.chapters.map((chapter) => (
            <a key={chapter.href} href={`${base}${chapter.href}`} data-chapter-link={chapter.href.slice(1)}>
              <span class="ch-long">{chapter.label}</span>
              <span class="ch-short">{chapter.short}</span>
            </a>
          ))}
        </nav>
        {/* the two flags as a small hand of cards: the current one stands taller and ringed */}
        <p class="cin-langs" role="group" aria-label={t.nav.langsLabel}>
          {(['en', 'pt'] as Lang[]).map((code) => (
            <a
              key={code}
              class={`lang-card lang-${code}`}
              href={langHref[code]}
              hrefLang={code}
              lang={code}
              aria-label={t.nav.langs[code]}
              aria-current={code === lang ? 'true' : undefined}
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
    <footer id="contact" class="cin-foot">
      <h2>{handle.props.t.foot.title}</h2>
      <SocialLinks class="foot-links" t={handle.props.t.links} />
      <p class="cin-fine">© {new Date().getFullYear()} Ângelo Ocanã · {handle.props.t.foot.built}</p>
    </footer>
  )
}
