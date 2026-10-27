import type { Handle, RemixNode } from 'remix/component'
import { statSync } from 'node:fs'
import { ImportMap } from 'remix/component/server'

import { scriptEntry } from '../assets.ts'
import { HREF, LANGS, type Lang } from '../copy.ts'

export interface DocumentProps {
  children?: RemixNode
  lang?: Lang
  /** Open Graph locale, like en_CA or pt_BR. */
  locale?: string
  description?: string
  /** Extra stylesheets, in order. */
  styles?: string[]
  /** A Google Fonts css2 URL for this page. */
  fonts?: string | null
  bodyClass?: string
  themeColor?: string
  title?: string
  /** This page's path, when it is not a home page (posts). */
  url?: string
  /** Paths of the same page in each language; defaults to the two home pages. */
  alternates?: Partial<Record<Lang, string>>
  ogType?: 'website' | 'article'
}

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
      fonts,
      themeColor = '#070707',
      title,
      ogType = 'website',
    } = handle.props
    let alternates = handle.props.alternates ?? HREF
    let { href, importMap, preloads } = scriptEntry
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
          <link rel="canonical" href={url} />
          {LANGS.filter((code) => alternates[code]).map((code) => (
            <link key={code} rel="alternate" hrefLang={code === 'pt' ? 'pt-BR' : 'en'} href={`${ORIGIN}${alternates[code]}`} />
          ))}
          <link rel="alternate" hrefLang="x-default" href={`${ORIGIN}/`} />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          {fonts && <link rel="preconnect" href="https://fonts.googleapis.com" />}
          {fonts && <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />}
          {fonts && <link rel="stylesheet" href={fonts} />}
          {styles.map((style) => (
            <link key={style} rel="stylesheet" href={versioned(style)} />
          ))}
          <title>{fullTitle}</title>
          <ImportMap value={importMap} />
          {preloads.map((preloadHref) => (
            <link key={preloadHref} rel="modulepreload" href={preloadHref} />
          ))}
          <script type="module" src={href}></script>
        </head>
        <body class={bodyClass}>{children}</body>
      </html>
    )
  }
}
