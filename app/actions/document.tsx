import type { Handle, RemixNode } from 'remix/component'
import { statSync } from 'node:fs'
import { ImportMap } from 'remix/component/server'
import { unsafeHTML } from 'remix/component'

import { scriptEntry } from '../assets.ts'
import { HREF, LANGS, type Lang } from '../copy.ts'
import { MEDIA_VERSIONS } from '../content/clips.ts'

export interface DocumentProps {
  children?: RemixNode
  lang?: Lang
  /** Open Graph locale, like en_CA or pt_BR. */
  locale?: string
  description?: string
  /** Extra stylesheets, in order. */
  styles?: string[]
  /** Font files in public/ to preload: the ones the first screen shows (their @font-face rules are in a stylesheet). */
  fonts?: string[]
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
// storage, which throws) mark the page seen, so the card never covers it.
const INTRO_ONCE = unsafeHTML(
  "try{localStorage.getItem('ao-intro')?document.documentElement.classList.add('cin-seen'):localStorage.setItem('ao-intro','1')}catch(e){document.documentElement.classList.add('cin-seen')}",
)

// Cache-busting for files in public/: the version is the file's last-modified time, so editing a
// stylesheet changes its URL right away. Production should switch to content-hashed file names.
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
      children,
      description = '',
      lang = 'en',
      locale = 'en_CA',
      styles = [],
      fonts = [],
      themeColor = '#070707',
      title,
      ogType = 'website',
      intro,
    } = handle.props
    let alternates = handle.props.alternates ?? HREF
    // No <link rel="modulepreload"> for the entry's ~57 modules: on a phone they all raced the stylesheets,
    // fonts and hero images, and held the first paint back by about a second (Lighthouse mobile LCP 3.1 s →
    // 2.1 s without them). The page is prerendered and reads fine before the scripts; the module graph still
    // loads them, just after what the first screen needs.
    let { href, importMap } = scriptEntry
    let fullTitle = title ?? 'Ângelo Ocanã'
    let url = `${ORIGIN}${handle.props.url ?? HREF[lang]}`

    return (
      <html lang={lang === 'pt' ? 'pt-BR' : 'en'}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="dark" />
          <meta name="theme-color" content={themeColor} />
          <meta name="description" content={description} />
          <meta property="og:title" content={fullTitle} />
          <meta property="og:description" content={description} />
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
          <link rel="alternate" hrefLang="x-default" href={`${ORIGIN}/`} />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          {fonts.map((font) => (
            <link key={font} rel="preload" href={font} as="font" type="font/woff2" crossOrigin="anonymous" />
          ))}
          {styles.map((style) => (
            <link key={style} rel="stylesheet" href={versioned(style)} />
          ))}
          <title>{fullTitle}</title>
          <ImportMap value={importMap} />
          <script type="module" src={href}></script>
        </head>
        <body class={bodyClass}>{children}</body>
      </html>
    )
  }
}
