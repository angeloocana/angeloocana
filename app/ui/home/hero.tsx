import type { Handle } from 'remix/component'

import { careerFor } from '../../content/career.ts'
import { CATEGORY_NAMES, clipUrl, heroClipUrl, type Clip } from '../../content/clips.ts'
import { SITE, SOCIALS } from '../../content.ts'
import type { Copy, Lang } from '../../copy.ts'
import { AppleWatch, IPhone, Screens } from '../devices.tsx'
import { SocialIcon } from '../social-icons.tsx'
import { M, PauseButton } from './shared.tsx'

// The first screen, before any rows: who I am on the left, and three tiles that each open a row further
// down. Career first and widest, then what I build, then one clip from outside work.
export function Hero(handle: Handle<{ lang: Lang; t: Copy; clips: Clip[] }>) {
  return () => {
    let { clips, lang, t } = handle.props
    let career = careerFor(lang)
    let now = career[0]
    let first = Number(career[career.length - 1].start)
    let year = new Date().getFullYear()
    let at = (y: string) => `${(((y === 'Now' ? year : Number(y)) - first) / (year - first)) * 100}%`
    let clip = clips[0]
    let tiles = t.hi.tiles
    return (
      <section id="top" class="hero" aria-labelledby="hero-title">
        <div class="hero-text">
          <p class="cin-kicker hi-kicker">
            <span>{t.hi.role}</span>
            {/* rails.tsx flies the plane once the page has settled, and again on hover or tap */}
            <span class="hi-route" data-flight>
              <span>{t.hi.from}</span>
              <svg class="hi-flight" viewBox="0 0 72 22" role="img" aria-label={t.hi.movedTo}>
                {/* the dashed route appears behind the plane as it flies */}
                <mask id="hi-trail" maskUnits="userSpaceOnUse" x="-4" y="-10" width="80" height="36">
                  <path class="hi-reveal" d="M4 18 Q36 -6 68 18" />
                </mask>
                <path class="hi-arc" d="M4 18 Q36 -6 68 18" mask="url(#hi-trail)" />
                <path class="hi-plane" d="M6 0 2 -1 -1 -5h-1.5l1.6 4H-4l-1.2-1.6H-6.2L-5.4 0l-.8 1.6h1L-4 1h3.1l-1.6 4H-1l3-4Z" />
              </svg>
              <span class="hi-to">{t.hi.place}</span>
            </span>
          </p>
          <h1 id="hero-title" class="hero-role">Ângelo <em>Ocanã</em></h1>
          <p class="hero-proof">{t.hi.proof}</p>
          {/* how to reach me: the email first, then the social links, all the same small icons on one line */}
          <ul class="hero-socials" aria-label={t.links.elsewhere}>
            <li>
              <a href={`mailto:${SITE.email}`} aria-label={`${t.links.email}: ${SITE.email}`} title={SITE.email}>
                <SocialIcon id="email" />
              </a>
            </li>
            {SOCIALS.map((social) => (
              <li key={social.id}>
                <a href={social.url} rel="me noopener" target="_blank" aria-label={`${social.label} (${t.links.newTab})`} title={social.label}>
                  <SocialIcon id={social.id} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <ul class="hero-tiles" aria-label={tiles.label}>
          {/* Career: today's job, its projects, and every company on one line */}
          <li class="tile tile-career">
            <p class="tile-kicker">{tiles.career.kicker}</p>
            <h2 class="tile-title"><a href="#career" class="tile-link" data-rmx-document>{now.company}<span class="tile-go" aria-hidden="true">→</span></a></h2>
            <p class="tile-meta"><span class="tile-now">{tiles.career.now}</span> · {tiles.career.role}</p>
            {/* what I built there, as plain text: the whole tile is one link, to the Career row */}
            <div class="tile-built">
              <p class="tile-label">{t.career.built}</p>
              <ul class="tile-projects">
                {(now.highlights ?? []).map((h) => <li key={h.title}>{h.title}</li>)}
              </ul>
            </div>
            <div class="tile-line" aria-hidden="true">
              <span class="tl-track">
                {career.map((job) => <i key={job.id} class={job.end === 'Now' ? 'tl-now' : ''} style={`left:${at(job.start)}`} />)}
                <b style={`left:${at(now.start)}`} />
              </span>
              <span class="tl-years"><span>{first}</span><span style={`left:${at(now.start)}`}>{now.start}</span><span>{t.career.now}</span></span>
            </div>
            <p class="tile-foot">{tiles.career.since(career.length, String(first))}</p>
          </li>

          {/* What I build: the two products, each named in its own typeface with what it is. The tile is split
              in two halves, one per product, each a link to its own row (the whole half, which lights up on
              hover); track2.fit's devices peek up in its half. */}
          <li class="tile tile-build">
            <div class="build-head">
              <h2 class="tile-kicker">{tiles.build.kicker}</h2>
              <p class="tile-body">{tiles.build.body}</p>
            </div>
            <ul class="tile-brands">
              <li class="brand brand-half-t2f">
                <a href="#track2fit" class="brand-link" data-rmx-document aria-label={`track2.fit: ${tiles.build.t2f}`}>
                  <span class="brand-t2f">track<sup>2</sup>.fit</span>
                  <small>{tiles.build.t2f}</small>
                </a>
                <div class="tile-devices" aria-hidden="true">
                  <IPhone class="td-phone">
                    <Screens srcs={['home', 'session', 'history'].map((s) => `${M}/t2f/phone-${s}.webp`)} alt="" />
                  </IPhone>
                  <AppleWatch class="td-watch">
                    <Screens srcs={['log-set', 'rest', 'record'].map((s) => `${M}/t2f/watch-${s}.webp`)} alt="" />
                  </AppleWatch>
                </div>
              </li>
              <li class="brand brand-half-joj">
                <a href="#jumpoverjump" class="brand-link" data-rmx-document aria-label={`Jump Over Jump: ${tiles.build.joj}`}>
                  <span class="brand-joj">Jump <em>Over</em> Jump</span>
                  <small>{tiles.build.joj}</small>
                </a>
              </li>
            </ul>
          </li>

          {/* Outside work: the row's first clip, playing (the only video on the first screen). rails.tsx
              starts it once the page has loaded and gone idle; the poster shows until then. */}
          {clip && (
            <li class="tile tile-life">
              <video class="tile-video" data-autoplay="idle" muted loop playsInline preload="none" poster={clipUrl(clip.id, 'jpg')} aria-hidden="true">
                {/* phones get the lighter cut when there is one; the browser picks the first source that matches */}
                {heroClipUrl(clip.id, 'phone') && <source src={heroClipUrl(clip.id, 'phone')} type="video/mp4" media="(max-width: 760px)" />}
                <source src={heroClipUrl(clip.id, 'tile') ?? clipUrl(clip.id, 'mp4')} type="video/mp4" />
              </video>
              <div class="tile-life-copy">
                <p class="tile-kicker">{tiles.life.kicker}</p>
                <h2 class="tile-title"><a href="#outside" class="tile-link" data-rmx-document>{CATEGORY_NAMES[lang][clip.cat]}<span class="tile-go" aria-hidden="true">→</span></a></h2>
                <p class="tile-foot">{tiles.life.count(clips.length)}</p>
              </div>
              <PauseButton label={t.hi.motion} class="tile-pause" />
            </li>
          )}
        </ul>
      </section>
    )
  }
}
