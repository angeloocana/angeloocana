import type { Handle, RemixNode } from 'remix/component'
import { statSync } from 'node:fs'
import { ImportMap } from 'remix/component/server'
import { unsafeHTML } from 'remix/component'

import { cursorEntry, scriptEntry } from '../assets.ts'
import { HREF, LANGS, type Lang } from '../copy.ts'
import { MEDIA_VERSIONS } from '../content/clips.ts'
import { bundleHref, type Bundle } from '../styles.ts'

export interface DocumentProps {
  children?: RemixNode
  lang?: Lang
  /** Open Graph locale, like en_CA or pt_BR. */
  locale?: string
  description?: string
  /** The page's one stylesheet (app/styles.ts). */
  bundle?: Bundle
  /** Stylesheets in public/ instead, in order (the review pages). */
  styles?: string[]
  /** Font files in public/ to preload: the ones the first screen shows (their @font-face rules are in a stylesheet). */
  fonts?: string[]
  /**
   * The page's scripts. `islands` (the default) starts the Remix client at once. `after-paint` (the home page)
   * starts it, and the pointer's ring, once the page has painted. `cursor` (a post) loads only the ring: a post
   * has nothing else that runs, so no client, and its links stay plain page loads.
   */
  scripts?: 'islands' | 'after-paint' | 'cursor'
  bodyClass?: string
  themeColor?: string
  title?: string
  /** This page's path, when it is not a home page (posts). */
  url?: string
  /** Paths of the same page in each language; defaults to the two home pages. */
  alternates?: Partial<Record<Lang, string>>
  ogType?: 'website' | 'article'
  /** Show the black title card, on a first visit only (the home pages). */
  intro?: boolean
}

// The link preview: track2.fit on the web, from the media bucket (media never goes in git).
const OG_IMAGE = `/media/t2f/desktop.webp?v=${MEDIA_VERSIONS['t2f/desktop.webp'] ?? '0'}`

// Runs before the first paint: the title card shows once per browser. Later visits (and blocked
// storage, which throws) mark the page seen, so the card never covers it. A key, a focus or a press
// before the scripts have loaded skips it too, so a fast first Tab never lands on the skip link under it.
const INTRO_ONCE = unsafeHTML(
  "(function(d){var h=d.documentElement;try{localStorage.getItem('ao-intro')?h.classList.add('cin-seen'):localStorage.setItem('ao-intro','1')}catch(e){h.classList.add('cin-seen')}" +
    "function s(){h.classList.add('cin-skip')}['keydown','focusin','pointerdown'].forEach(function(t){d.addEventListener(t,s,{once:true,capture:true})})})(document)",
)

// The home page's scripts and fonts wait for its first paint, so nothing competes with the words of the
// first screen: on a phone, the islands' 50-odd modules and five font files racing the page held its first
// paint back by about a second (Lighthouse mobile LCP 2.4 s → 1.1 s without them).
//   - The fonts past Instrument Serif (fonts.css: Inter, the italics, the products' typefaces) are a
//     stylesheet for print until then. The title card covers the page on a first visit, so the switch from
//     the system font happens under it; when no card shows (a later visit, reduced motion) they apply at once.
//   - The Remix client and the pointer's ring start once the page has painted and is parsed (Remix reads the
//     islands from the end of the body), with the islands' modules fetched beside them. Where the browser
//     can't observe paints, the first frame after the page is parsed stands in for the paint. A tab opened
//     in the background never paints until it is shown, so a timer starts them anyway.
//   - Without JS the fonts come from a <noscript> copy of the stylesheet.
function afterPaint(fonts: string | undefined, scripts: string[]) {
  return unsafeHTML(
    `(function(d,f,s){var h=d.documentElement,l=f&&d.getElementById('fonts-more'),n=0;` +
      `function font(){if(l)l.media='all'}` +
      `if(h.classList.contains('cin-seen')||matchMedia('(prefers-reduced-motion: reduce)').matches)font();` +
      `function add(r,u){var e=d.createElement(r?'script':'link');r?(e.type='module',e.src=u):(e.rel='modulepreload',e.href=u);d.head.append(e)}` +
      `function run(){font();try{var x=JSON.parse(d.getElementById('rmx-data').textContent).h;for(var k in x)add(0,x[k].moduleUrl)}catch(e){}s.forEach(function(u){add(1,u)})}` +
      `function go(){if(n++)return;d.readyState=='loading'?d.addEventListener('DOMContentLoaded',run):run()}` +
      `var P=window.PerformanceObserver;if(P&&(P.supportedEntryTypes||[]).indexOf('paint')>=0)new P(function(e,o){if(e.getEntriesByName('first-contentful-paint').length){o.disconnect();go()}}).observe({type:'paint',buffered:true});` +
      `else d.addEventListener('DOMContentLoaded',function(){requestAnimationFrame(function(){setTimeout(go)})});` +
      `setTimeout(go,3000)})(document,${JSON.stringify(fonts ?? '')},${JSON.stringify(scripts)})`,
  )
}

// Cache-busting for files in public/: the version is the file's last-modified time, so editing a
// stylesheet changes its URL right away.
function versioned(path: string): string {
  try {
    return `${path}?v=${Math.round(statSync(`public${path}`).mtimeMs).toString(36)}`
  } catch {
    return path
  }
}

const ORIGIN = 'https://angeloocana.com'

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    let {
      bodyClass,
      bundle,
      children,
      description = '',
      lang = 'en',
      locale = 'en_CA',
      styles = [],
      fonts = [],
      scripts = 'islands',
      themeColor = '#070707',
      title,
      ogType = 'website',
      intro,
    } = handle.props
    let alternates = handle.props.alternates ?? HREF
    // No <link rel="modulepreload"> for the entry's modules or the islands' (app/router.ts leaves those out):
    // on a phone they raced the stylesheet, the fonts and the hero, and held the first paint back. The page is
    // prerendered and reads fine before the scripts.
    let { href, importMap } = scriptEntry
    let fullTitle = title ?? 'Ângelo Ocanã'
    let url = `${ORIGIN}${handle.props.url ?? HREF[lang]}`
    let lateFonts = scripts === 'after-paint' ? bundleHref('fonts') : undefined

    return (
      <html lang={lang === 'pt' ? 'pt-BR' : 'en'}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="dark" />
          <meta name="theme-color" content={themeColor} />
          {(description || ogType !== 'article') && <meta name="description" content={description} />}
          <meta property="og:title" content={fullTitle} />
          {(description || ogType !== 'article') && <meta property="og:description" content={description} />}
          <meta property="og:type" content={ogType} />
          <meta property="og:url" content={url} />
          <meta property="og:locale" content={locale} />
          <meta property="og:image" content={`${ORIGIN}${OG_IMAGE}`} />
          <meta property="og:image:width" content="1600" />
          <meta property="og:image:height" content="1000" />
          <meta name="twitter:card" content="summary_large_image" />
          {intro && <script innerHTML={INTRO_ONCE} />}
          <link rel="canonical" href={url} />
          {LANGS.filter((code) => alternates[code]).map((code) => (
            <link key={code} rel="alternate" hrefLang={code === 'pt' ? 'pt-BR' : 'en'} href={`${ORIGIN}${alternates[code]}`} />
          ))}
          {ogType !== 'article' && <link rel="alternate" hrefLang="x-default" href={`${ORIGIN}/`} />}
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          {fonts.map((font) => (
            <link key={font} rel="preload" href={font} as="font" type="font/woff2" crossOrigin="anonymous" />
          ))}
          {bundle && <link rel="stylesheet" href={bundleHref(bundle)} />}
          {styles.map((style) => (
            <link key={style} rel="stylesheet" href={versioned(style)} />
          ))}
          {lateFonts && <link rel="stylesheet" id="fonts-more" href={lateFonts} media="print" />}
          {lateFonts && <noscript><link rel="stylesheet" href={lateFonts} /><link rel="stylesheet" href={bundleHref('home-noscript')} /></noscript>}
          <title>{fullTitle}</title>
          {scripts !== 'cursor' && <ImportMap value={importMap} />}
          {scripts === 'islands' && <script type="module" src={href}></script>}
          {scripts === 'after-paint' && <script innerHTML={afterPaint(lateFonts, [href, cursorEntry.href])} />}
          {scripts === 'cursor' && <script type="module" src={cursorEntry.href}></script>}
        </head>
        <body class={bodyClass}>{children}</body>
      </html>
    )
  }
}
