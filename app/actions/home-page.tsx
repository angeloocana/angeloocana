import type { Handle, RemixNode } from 'remix/component'

import { Document } from './document.tsx'
import { careerFor } from '../content/career.ts'
import { CATEGORY_NAMES, clipUrl, homeOrder, instagramUrl } from '../content/clips.ts'
import { postsFor } from '../content/posts.ts'
import { COPY, HREF, type Copy, type Lang } from '../copy.ts'
import { CineCursor } from '../ui/public/cine-cursor.tsx'
import { Rails } from '../ui/public/rails.tsx'
import { FONTS, SiteFoot, SiteNav, SocialLinks } from '../ui/chrome.tsx'
import { AppleWatch, IPad, IPhone, Laptop, Pixel, Screens, WearWatch } from '../ui/devices.tsx'
import { JojDesktop, JojPhone } from '../ui/joj-screens.tsx'
import { JojDemo } from '../ui/public/joj-demo.tsx'
import { SocialIcon } from '../ui/social-icons.tsx'

const M = '/media'

// One section = one row: scroll down between rows, sideways inside one (see app/ui/public/rails.tsx).
// A big arrow on the right edge pulls you along the row; the prompt at the bottom names the next row.
function Row(
  handle: Handle<{
    id?: string
    class: string
    label: string
    t: Copy['rail']
    next?: { href: string; label: string }
    children?: RemixNode
    chapter?: boolean
    backdrop?: boolean
    shuffle?: boolean
  }>,
) {
  return () => {
    let { backdrop, chapter, children, class: className, id, label, next, shuffle, t } = handle.props
    return (
      <section id={id} class={`row ${className}`} data-rail data-chapter={chapter ? '' : undefined} aria-label={label}>
        {backdrop && <div class="row-bg" data-rail-bg aria-hidden="true" />}
        <div class="rail-wrap">
          <ul class="rail" data-rail-track data-shuffle={shuffle ? '' : undefined} tabIndex={0} aria-label={label}>
            {children}
          </ul>
          <button type="button" class="rail-arrow rail-prev" data-rail-prev aria-label={t.prev}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" class="rail-arrow rail-next" data-rail-next aria-label={t.next}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        {next && (
          <a class="row-down" href={next.href}>
            <span>{t.down}</span>
            <b>{next.label}</b>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7" /></svg>
          </a>
        )}
      </section>
    )
  }
}

// A project card: a device (or anything visual) above a short caption.
function Card(handle: Handle<{ class: string; title: string; body: string; children?: RemixNode }>) {
  return () => (
    <li class={`slide card ${handle.props.class}`}>
      <div class="card-visual">{handle.props.children}</div>
      <div class="card-copy">
        <h3>{handle.props.title}</h3>
        <p>{handle.props.body}</p>
      </div>
    </li>
  )
}

export function formatDate(date: string, lang: Lang) {
  return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en-CA', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
}

export function HomePage(handle: Handle<{ lang: Lang }>) {
  return () => {
    let { lang } = handle.props
    let t = COPY[lang]
    let career = careerFor(lang)
    let clips = homeOrder()
    let names = CATEGORY_NAMES[lang]
    return (
      <Document
        lang={lang}
        title={t.meta.title}
        description={t.meta.description}
        locale={t.meta.locale}
        bodyClass="cin"
        fonts={FONTS}
        styles={['/styles/base.css', '/styles/devices.css', '/styles/site.css']}
        themeColor="#070707"
      >
        <Rails />
        <JojDemo />
        <CineCursor />

        <div class="cin-intro" aria-hidden="true">
          <p>
            <span>Ângelo Ocanã</span>
            <em>{t.intro}</em>
          </p>
        </div>

        <SiteNav lang={lang} t={t} home langHref={HREF} />

        <main>
          {/* Hi: who I am, then everything I do outside work, one clip after another */}
          <Row id="top" class="row-hi" label={t.nav.hi} t={t.rail} next={{ href: '#track2fit', label: 'track2.fit' }} chapter backdrop shuffle>
            <li class="slide hi">
              <p class="cin-kicker hi-kicker">
                <span>{t.hi.role}</span>
                <span class="hi-route">
                  <span>{t.hi.from}</span>
                  <svg class="hi-flight" viewBox="0 0 72 22" role="img" aria-label={t.hi.movedTo}>
                    <path class="hi-arc" d="M4 18 Q36 -6 68 18" />
                    <path class="hi-plane" d="M6 0 2 -1 -1 -5h-1.5l1.6 4H-4l-1.2-1.6H-6.2L-5.4 0l-.8 1.6h1L-4 1h3.1l-1.6 4H-1l3-4Z" />
                  </svg>
                  <span>{t.hi.place}</span>
                </span>
              </p>
              <h1>Ângelo <em>Ocanã</em></h1>
              <p class="hi-tldr">{t.hi.tldr}</p>
              <ul class="hi-values" aria-label={t.hi.valuesLabel}>
                {t.hi.values.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
              <SocialLinks class="hi-links" t={t.links} />
            </li>
            {clips.map((clip, i) => (
              <li key={clip.id} class="slide clip" data-cat={clip.cat} data-star={String(clip.star)} data-score={String(clip.score)} data-poster={clipUrl(clip.id, 'jpg')}>
                {/* the first few posters load right away; the rest as they come near (rails.tsx) */}
                <video
                  class="clip-video"
                  data-autoplay
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster={i < 6 ? clipUrl(clip.id, 'jpg') : undefined}
                  data-lazy-poster={i < 6 ? undefined : clipUrl(clip.id, 'jpg')}
                  aria-label={clip.label[lang]}
                >
                  <source src={clipUrl(clip.id, 'mp4')} type="video/mp4" />
                </video>
                <div class="clip-copy" aria-hidden="true">
                  <p class="clip-cat">{names[clip.cat]}</p>
                  {!clip.captionRejected && <p class="clip-label">{clip.label[lang]}</p>}
                </div>
                {instagramUrl(clip) && (
                  <a class="clip-ig" href={instagramUrl(clip)} target="_blank" rel="noopener" aria-label={`${t.hi.onInstagram}: ${clip.label[lang]} (${t.links.newTab})`} data-cursor="Instagram">
                    <SocialIcon id="instagram" />
                  </a>
                )}
              </li>
            ))}
          </Row>

          {/* Personal projects: one row each */}
          <div id="projects" data-chapter>
            <Row id="track2fit" class="row-t2f" label="track2.fit" t={t.rail} next={{ href: '#jumpoverjump', label: 'Jump Over Jump' }}>
              {/* the hero card: what it is, and every device it runs on, before any scrolling */}
              <li class="slide intro intro-wide intro-t2f">
                <div class="intro-text">
                  <p class="cin-kicker">{t.t2f.kickerFirst}</p>
                  <h2>{t.t2f.captions[0].title}</h2>
                  <p>{t.t2f.captions[0].body}</p>
                  <p class="cap-ctas">
                    <a class="cin-btn" href="https://track2.fit" data-cursor="Open">{t.t2f.open} <span aria-hidden="true">→</span></a>
                    <span class="cin-soon">{t.t2f.soon}</span>
                  </p>
                </div>
                <div class="intro-visual hv-t2f">
                  <Laptop class="hv hv-laptop" label={t.t2f.web}>
                    <Screens srcs={[`${M}/t2f/desktop.webp`]} alt={t.t2f.webAlt} />
                  </Laptop>
                  <IPhone class="hv hv-phone" label={t.t2f.iphone}>
                    <Screens srcs={['session', 'home', 'history', 'records'].map((s) => `${M}/t2f/phone-${s}.webp`)} alt={t.t2f.iphoneAlt} />
                  </IPhone>
                  <AppleWatch class="hv hv-watch" label={t.t2f.watch}>
                    <Screens srcs={['log-set', 'rest', 'record', 'go'].map((s) => `${M}/t2f/watch-${s}.webp`)} alt={t.t2f.watchAlt} />
                  </AppleWatch>
                </div>
              </li>
              <Card class="card-phone" title={t.t2f.cards.phone.title} body={t.t2f.cards.phone.body}>
                <IPhone class="c-dev" label={t.t2f.iphone}>
                  <Screens srcs={['home', 'session', 'history', 'body', 'records'].map((s) => `${M}/t2f/phone-${s}.webp`)} alt={t.t2f.iphoneAlt} />
                </IPhone>
              </Card>
              <Card class="card-watch" title={t.t2f.cards.watch.title} body={t.t2f.cards.watch.body}>
                <AppleWatch class="c-dev" label={t.t2f.watch}>
                  <Screens srcs={['go', 'log-set', 'rest', 'record'].map((s) => `${M}/t2f/watch-${s}.webp`)} alt={t.t2f.watchAlt} />
                </AppleWatch>
              </Card>
              <Card class="card-ipad" title={t.t2f.cards.ipad.title} body={t.t2f.cards.ipad.body}>
                <IPad class="c-dev" label={t.t2f.ipad}>
                  <Screens srcs={[`${M}/t2f/ipad-history.webp`]} alt={t.t2f.ipadAlt} />
                </IPad>
              </Card>
              <Card class="card-laptop" title={t.t2f.cards.web.title} body={t.t2f.cards.web.body}>
                <Laptop class="c-dev" label={t.t2f.web}>
                  <Screens srcs={[`${M}/t2f/desktop.webp`]} alt={t.t2f.webAlt} />
                </Laptop>
              </Card>
              <Card class="card-sync" title={t.t2f.cards.sync.title} body={t.t2f.cards.sync.body}>
                <svg class="sync-art" viewBox="0 0 240 200" aria-hidden="true">
                  <path class="sync-line" id="sl-1" d="M40 156 Q 60 90 120 58" />
                  <path class="sync-line" id="sl-2" d="M120 156 L 120 58" />
                  <path class="sync-line" id="sl-3" d="M200 156 Q 180 90 120 58" />
                  {['#sl-1', '#sl-2', '#sl-3'].map((id, i) => (
                    <circle key={id} class="sync-pulse" r="4">
                      <animateMotion dur={`${1.8 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.5}s`}>
                        <mpath href={id} />
                      </animateMotion>
                    </circle>
                  ))}
                  <g class="sync-cloud"><rect x="84" y="20" width="72" height="34" rx="17" /><text x="120" y="42">SYNC</text></g>
                  <g class="sync-node"><rect x="20" y="156" width="40" height="30" rx="8" /><text x="40" y="175">WATCH</text></g>
                  <g class="sync-node"><rect x="100" y="156" width="40" height="30" rx="8" /><text x="120" y="175">PHONE</text></g>
                  <g class="sync-node"><rect x="180" y="156" width="40" height="30" rx="8" /><text x="200" y="175">WEB</text></g>
                </svg>
              </Card>
              <Card class="card-soon" title={t.t2f.cards.soon.title} body={t.t2f.cards.soon.body}>
                <div class="pair">
                  <Pixel class="c-dev" label={t.t2f.android}>
                    <div class="soon-screen"><b>TRACK<sup>2</sup>.FIT</b><span>Android</span><small>{t.t2f.androidSoon}</small></div>
                  </Pixel>
                  <WearWatch class="c-dev" label={t.t2f.wear}>
                    <video data-autoplay muted loop playsInline preload="none" aria-hidden="true">
                      <source src={`${M}/t2f/wear.mp4`} type="video/mp4" />
                    </video>
                  </WearWatch>
                </div>
              </Card>
            </Row>

            <Row id="jumpoverjump" class="row-joj" label="Jump Over Jump" t={t.rail} next={{ href: '#career', label: t.nav.chapters[1].label }}>
              <li class="slide intro intro-wide intro-joj">
                <div class="intro-text">
                  <p class="cin-kicker">{t.joj.kickerFirst}</p>
                  <h2>{t.joj.title[0]}<em>{t.joj.title[1]}</em></h2>
                  <p>{t.joj.body}</p>
                  <p class="intro-note">{t.joj.title2}</p>
                  <p class="cap-ctas">
                    <a class="cin-btn cin-btn-joj" href="https://jumpoverjump.com" data-cursor="Play">{t.joj.play} <span aria-hidden="true">→</span></a>
                    <span class="cin-soon">{t.t2f.soon}</span>
                  </p>
                </div>
                <div class="intro-visual hv-joj">
                  <Laptop class="hv hv-laptop" label={t.joj.desktop}>
                    <JojDesktop title={t.joj.title as [string, string]} play={t.joj.play} label={t.joj.demo} lines={t.joj.lines} />
                  </Laptop>
                  <IPhone class="hv hv-phone" label={t.joj.iphone}>
                    <JojPhone title={t.joj.title as [string, string]} play={t.joj.play} label={t.joj.demo} lines={t.joj.lines} />
                  </IPhone>
                </div>
              </li>
              <Card class="card-bots" title={t.joj.cards.bots.title} body={t.joj.cards.bots.body}>
                <ol class="bots">
                  {t.joj.bots.map(([name, hint, level]) => (
                    <li key={name} class={name === 'Neural' ? 'bot-neural' : ''}>
                      <b>{name}</b>
                      <small>{hint}</small>
                      <span class="bot-level" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map((n) => <i key={n} class={n <= level ? 'on' : ''} />)}
                      </span>
                    </li>
                  ))}
                </ol>
              </Card>
              <Card class="card-online" title={t.joj.cards.online.title} body={t.joj.cards.online.body}>
                <div class="online-art">
                  <IPhone class="c-dev" label={t.joj.iphone}>
                    <JojPhone title={t.joj.title as [string, string]} play={t.joj.play} label={t.joj.demo} lines={t.joj.lines} />
                  </IPhone>
                  <p class="room-chip room-copied"><i aria-hidden="true">✓</i>{t.joj.room.copied}</p>
                  <p class="room-chip room-vs"><b>{t.joj.room.you}</b> vs <b>{t.joj.room.friend}</b></p>
                </div>
              </Card>
              <Card class="card-ranks" title={t.joj.cards.ranks.title} body={t.joj.cards.ranks.body}>
                <div class="ranks" aria-hidden="true">
                  <p class="ranks-tabs">{t.joj.ranks.tabs.map((tab, i) => <span key={tab} class={i === 0 ? 'on' : ''}>{tab}</span>)}</p>
                  <ol>
                    <li class="ranks-you"><span>1</span><b>{t.joj.ranks.you}</b><i>🏆</i></li>
                    {['Neural', 'Master', 'Expert'].map((bot, i) => (
                      <li key={bot}><span>{i + 2}</span><b>{bot}</b><small>{t.joj.ranks.ai}</small></li>
                    ))}
                  </ol>
                  <p class="ranks-points">{t.joj.ranks.points}</p>
                </div>
              </Card>
              <Card class="card-learn" title={t.joj.cards.learn.title} body={t.joj.cards.learn.body}>
                <ul class="learn-chips">
                  {t.joj.learn.map((chip) => <li key={chip}>{chip}</li>)}
                </ul>
              </Card>
              <li class="slide intro intro-reel">
                <p class="cin-kicker">{t.reel.kicker}</p>
                <h2>{t.reel.title[0]}<em>{t.reel.title[1]}</em></h2>
                <p>{t.reel.body}</p>
                <p class="intro-note">{t.joj.body2}</p>
              </li>
              {t.reel.frames.map((frame) => (
                <li key={frame.year + frame.tech} class={`slide reel-frame rf-${frame.kind}`}>
                  <div class="rf-shot">
                    {frame.kind === 'git' && (
                      <pre class="rf-code">{`$ git log --reverse --date=short
2014-10-25  Init
2014-10-27  Board
          …
c_sharp_phaser/JumpOverJump`}</pre>
                    )}
                    {frame.kind === 'logo' && <img src={`${M}/joj/2015-logo.webp`} alt={t.reel.logoAlt} loading="lazy" />}
                    {frame.kind === 'board' && <img src={`${M}/joj/2016-board.webp`} alt={t.reel.boardAlt} loading="lazy" />}
                    {frame.kind === 'terminal' && (
                      <pre class="rf-code rf-term">{`  a b c d e f g h
8 ● ● ● ● ● ● ● ●
7 · · · · · · · ·
6 · · · ● · · · ·
5 · · · · · · · ·
4 · · ○ · · · · ·
3 · · · · · · · ·
2 · · · · · · · ·
1 ○ ○ · ○ ○ ○ ○ ○
> c1 → c4`}</pre>
                    )}
                    {frame.kind === 'code' && (
                      <pre class="rf-code">{`JumpOverJump/
├── bend/   # massively parallel
├── c/      # tiny + fast
├── typescript/
├── c_sharp_angularjs/
└── c_sharp_phaser/`}</pre>
                    )}
                    {frame.kind === 'neural' && <img src={`${M}/joj/2026-neural.webp`} alt={t.reel.neuralAlt} loading="lazy" />}
                  </div>
                  <p class="rf-year">{frame.year}</p>
                  <h3>{frame.tech}</h3>
                  <p>{frame.text}</p>
                </li>
              ))}
            </Row>
          </div>

          {/* Career: today first, then back to the start */}
          <Row id="career" class="row-career" label={t.nav.chapters[1].label} t={t.rail} next={{ href: '#posts', label: t.nav.chapters[2].label }} chapter>
            <li class="slide intro intro-career">
              <p class="cin-kicker">{t.career.kicker}</p>
              <h2>{t.career.title[0]}<em>{t.career.title[1]}</em>{t.career.title[2]}</h2>
              <p>{t.career.sub(career.length, career[career.length - 1].start)}</p>
            </li>
            {career.map((job) => (
              <li key={job.id} class={`slide job${job.featured ? ' job-featured' : ''}${job.highlights?.length ? ' job-wide' : ''}`}>
                <p class="job-years">
                  <span>{job.start}</span>
                  {job.start !== job.end && <i aria-hidden="true" />}
                  {job.start !== job.end && <span>{job.end === 'Now' ? t.career.now : job.end}</span>}
                  {job.featured && <span class="job-badge">{t.career.today}</span>}
                </p>
                <h3>{job.url ? <a href={job.url} data-cursor={t.career.visit}>{job.company}</a> : job.company}</h3>
                {(job.role || job.place) && <p class="job-meta">{[job.role, job.place].filter(Boolean).join(' · ')}</p>}
                <p class="job-label">{t.career.built}</p>
                {job.built ? <p class="job-built">{job.built}</p> : <p class="job-built job-empty">{t.career.empty}</p>}
                {(job.featured || !!job.highlights?.length) && (
                  <ol class="job-highlights">
                    {(job.highlights?.length ? job.highlights : [null, null, null]).map((h, n) => (
                      <li key={n} class={h ? '' : 'is-empty'}>
                        <b>{h ? (h.url ? <a href={h.url} rel="noopener" target="_blank">{h.title} <i aria-hidden="true">↗</i></a> : h.title) : t.career.highlightTitle}</b>
                        <small>{h ? h.body : t.career.highlightBody}</small>
                      </li>
                    ))}
                  </ol>
                )}
                {job.clients && <p class="job-clients"><span>{t.career.for}</span> {job.clients.join(' · ')}</p>}
                {job.tech.length > 0 && (
                  <ul class="job-tech" aria-label={t.career.tech}>
                    {job.tech.map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </Row>

          {/* Posts: everything published on the old site, newest first */}
          <Row id="posts" class="row-posts" label={t.nav.chapters[2].label} t={t.rail} next={{ href: '#contact', label: t.foot.title }} chapter>
            <li class="slide intro intro-posts">
              <p class="cin-kicker">{t.posts.kicker}</p>
              <h2>{t.posts.title[0]}<em>{t.posts.title[1]}</em></h2>
              <p>{t.posts.body}</p>
            </li>
            {postsFor(lang).map((post) => (
              <li key={post.key} class="slide post-card">
                <a href={post.url} hrefLang={post.lang} data-cursor={t.posts.kicker}>
                  <p class="post-year">{post.date.slice(0, 4)}</p>
                  <p class="post-meta">
                    <span>{formatDate(post.date, lang)}</span>
                    <span>{post.youtubeId ? t.posts.video : t.posts.read(post.minutes)}</span>
                    {post.lang !== lang && <span class="post-lang">{t.posts.other[post.lang]}</span>}
                  </p>
                  <h3>{post.title}</h3>
                  <p class="post-excerpt">{post.excerpt}</p>
                  {post.tags.length > 0 && (
                    <ul class="post-tags">
                      {post.tags.slice(0, 3).map((tag) => <li key={tag}>{tag}</li>)}
                    </ul>
                  )}
                </a>
              </li>
            ))}
          </Row>
        </main>

        <SiteFoot t={t} />
      </Document>
    )
  }
}
