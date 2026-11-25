// Prerenders the site to plain files in dist/, ready for any static host (Cloudflare, see wrangler.jsonc).
// Run with `npm run build`. It renders each page through the real router, then follows every
// /assets/ URL (scripts, import maps, chunks) so the browser islands work without a server.
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { MEDIA_VERSIONS, loadClips } from '../app/content/clips.ts'
import { legacyBlogAssets } from '../app/content/legacy-blog-assets.ts'
import { allPosts } from '../app/content/posts.ts'
import { router } from '../app/router.ts'
import { HOME_HTML_BUDGET, HOME_ROUTES, assertHomeHtmlBudget, type HomeHtmlArtifact } from './home-html-budget.ts'
import { assertMediaReferences, type EmittedFile } from './media-references.ts'

const ORIGIN = 'http://localhost'
const OUT = 'dist'
const OFFLINE = '/offline-plugin-app-shell-fallback/'
const POST_PREFIXES = ['/en/blog/', '/pt/blog/', '/Tutoriais/']
const SCRIPT_TAG = /<script\b/i
// the home pages' clips JSON is built like a page: the router answers it
// /pt/, not /pt: the host serves pt/index.html there, and its own /pt → /pt/ redirect drops any #section
const PAGES: Record<string, string> = { '/': 'index.html', '/pt/': 'pt/index.html', '/data/clips.json': 'data/clips.json' }
// every post keeps the URL it had on the old site: /en/blog/git/git-setup/ → en/blog/git/git-setup/index.html
for (let post of allPosts()) {
  if (!POST_PREFIXES.some((prefix) => post.url.startsWith(prefix))) throw new Error(`${post.url}: no post CSP rule`)
  // Raw rendered Markdown must not bring its own scripts, even if they look like our external modules.
  if (SCRIPT_TAG.test(post.html)) throw new Error(`${post.url}: script tags are not allowed in article content`)
  PAGES[post.url] = `${post.url.slice(1)}index.html`
}
const SITEMAP = Object.keys(PAGES).filter((path) => !path.endsWith('.json'))

await rm(OUT, { recursive: true, force: true })
// public/ first, then the rendered pages and scripts on top.
const live = new Set(loadClips().filter((clip) => !clip.rejected).map((clip) => clip.id))
// The videos and screenshots aren't built in: they live in the angeloocana-media R2 bucket, which the
// worker serves at /media (worker.ts), so this runs from git alone (Workers Builds deploys every push).
// app/content/media.json lists what has been uploaded; stop if a live clip hasn't been, rather than
// publish a page with a broken video.
let missing = [...live].flatMap((id) => [`clips/${id}.mp4`, `clips/${id}.jpg`]).filter((key) => !MEDIA_VERSIONS[key])
if (missing.length) {
  throw new Error(`${missing.length} live clip files aren't in the bucket yet (${missing.slice(0, 3).join(', ')}…). Run \`npm run media:push\` on your branch and commit both clip and media manifests.`)
}
await cp('public', OUT, {
  recursive: true,
  // the pages' stylesheets are put together from public/styles/ (app/styles.ts, saved under /css/ below); the
  // review's only runs in development
  filter: (src) => !src.endsWith('.DS_Store') && !src.startsWith('public/styles') && !src.startsWith('public/media'),
})

// Publish only the original Redux Saga deck and article illustrations, not the legacy image directory.
for (let path of legacyBlogAssets) await cp(join('legacy/static', path), join(OUT, path))
// These prefixes have wildcard CSP rules and are reserved for generated posts, not copied assets.
for (let prefix of POST_PREFIXES) {
  if (existsSync(join(OUT, prefix))) throw new Error(`${prefix}: copied assets overlap a post CSP rule`)
}

// Browser modules compiled from .ts/.tsx keep their source names, which static hosts would serve
// with the wrong type. Save them as .js and point every reference at the new name.
const TS_URL = /(\/assets\/[^"'`#?\s]+?\.tsx?)(?=["'`#?\s])/g
// A module that imports a sibling (tic-tac-toe.tsx → ./tic-tac-toe-ai.ts) needs the same rename, or the
// browser asks for the .ts name, which the import map no longer has, and the whole module fails to load.
// The minifier writes a dynamic import's name in backticks (import(`./ice-gl.ts`)), so those count too.
const RELATIVE_TS_IMPORT = /(\bfrom\s*|\bimport\s*\(?\s*)(["'`])(\.{1,2}\/[^"'`]+?\.tsx?)\2/g
const asJs = (path: string) => (/\.tsx?$/.test(path) ? `${path}.js` : path)
// Cloudflare answers a path with a bare @ (rails.@a1b2c3.tsx) with a redirect to its %40 spelling,
// one extra round trip per script, so references use that spelling from the start.
const ASSET_URL = /\/assets\/[^"'`\s)]+/g

// every page, script and stylesheet as written, for the /media/ reference check at the end
const emittedText: EmittedFile[] = []

async function saveText(path: string, body: string) {
  let emitted = body
    .replace(TS_URL, '$1.js')
    .replace(RELATIVE_TS_IMPORT, '$1$2$3.js$2')
    .replace(ASSET_URL, (url) => url.replaceAll('@', '%40'))
  await save(path, emitted)
  emittedText.push({ file: join(OUT, decodeURIComponent(asJs(path))), text: emitted })
  return emitted
}

async function save(path: string, body: string | Uint8Array) {
  // URLs are percent-encoded (%40remix-run); files on disk are not (@remix-run)
  let file = join(OUT, decodeURIComponent(asJs(path)))
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, body)
}

async function get(path: string) {
  let response = await router.fetch(new URL(path, ORIGIN))
  if (!response.ok) throw new Error(`${path} answered ${response.status}`)
  return response
}

let queue: string[] = []
let seen = new Set<string>()

function collect(text: string, from: string) {
  // absolute /assets/ URLs (import maps, script tags, preloads)
  for (let [url] of text.matchAll(/\/assets\/[^"'`\s)]+/g)) queue.push(url)
  // relative imports inside scripts
  for (let [, spec] of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["'`](\.{1,2}\/[^"'`]+)["'`]/g)) {
    queue.push(new URL(spec, new URL(from, ORIGIN)).pathname)
  }
}

// Recognize the script tags our prerenderer emits, and reject unfamiliar forms instead of silently
// dropping a needed hash. Only the trusted home renderer gets hashes; posts share a hashless policy.
function inlineScriptHashes(path: string, html: string, home: boolean) {
  let hashes = new Set<string>()
  for (let [, attrs, body, close] of html.matchAll(/<script\b([^<>]*)>([^]*?)(<\/script\b[^>]*>)|<script\b/gi)) {
    if (attrs === undefined || close !== '</script>' || SCRIPT_TAG.test(body)) {
      throw new Error(`${path}: unexpected script markup in prerendered HTML`)
    }
    if (body === '' && /^ type="module" src="\/assets\/[^"\s<>]+"$/.test(attrs)) continue
    if (home && attrs === ' type="application/json" id="rmx-data"') continue
    if (!home || !['', ' type="module"', ' data-rmx-import-map type="importmap"'].includes(attrs)) {
      throw new Error(`${path}: unexpected script attributes in prerendered HTML: ${attrs}`)
    }
    if (/[\r\0]/.test(body)) throw new Error(`${path}: inline script would be normalized by the HTML parser`)
    hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`)
  }
  return [...hashes]
}

// each kind of page's one stylesheet (/css/home.Ab12Cd34.css, app/styles.ts), saved as the pages name them
let stylesheets = new Set<string>()
let homeHashes = new Map<string, string[]>()
let homeRoutes = new Set<string>(HOME_ROUTES)
let emittedHomes: HomeHtmlArtifact[] = []
for (let [path, file] of Object.entries(PAGES)) {
  let html = await (await get(path)).text()
  let emitted = await saveText(file, html)
  collect(html, path)
  for (let [url] of html.matchAll(/\/css\/[\w-]+\.[\w-]+\.css/g)) stylesheets.add(url)
  if (!file.endsWith('.html')) continue
  let home = homeRoutes.has(path)
  let hashes = inlineScriptHashes(path, emitted, home)
  if (home) {
    emittedHomes.push({ route: path, file: join(OUT, file), html: emitted })
    homeHashes.set(path, hashes)
  }
  // The old offline service worker answers page loads with this address. It needs the exact home
  // page (and policy), not a redirect, until those old workers are gone (see public/sw.js).
  if (path === '/') {
    await save(`${OFFLINE.slice(1)}index.html`, emitted)
    homeHashes.set(OFFLINE, hashes)
  }
}
let homeBudgets = assertHomeHtmlBudget(emittedHomes)
for (let url of stylesheets) await saveText(url, await (await get(url)).text())

// Every script URL carries a hash of the file (rails.@a1b2c3.tsx, see app/assets.ts), which is what
// lets _headers below cache /assets/ for a year. A URL without one is only a name the import map
// points at the hashed file; browsers never fetch it and the asset server doesn't serve it.
const FINGERPRINTED = /\.@[\w-]+(\.[^./]+)?$/

while (queue.length) {
  let url = queue.shift()!.split('?')[0]
  // import-map prefixes like /assets/npm/ are not files
  if (url.endsWith('/') || seen.has(url) || !FINGERPRINTED.test(url)) continue
  seen.add(url)
  let response = await get(url)
  let type = response.headers.get('Content-Type') ?? ''
  if (/javascript|json|css|text/.test(type)) {
    let text = await response.text()
    collect(text, url)
    await saveText(url, text)
  } else {
    await save(url, new Uint8Array(await response.arrayBuffer()))
  }
}

// Old addresses: preview links, and the old site's pages that now live in a section of the home page.
const legacyHomes = Object.entries({ en: '/', pt: '/pt/', fr: '/' })
const legacySections = Object.entries({ blog: '#posts', tags: '#posts', resume: '#career', about: '', contact: '#contact' })
await save(
  '_redirects',
  [
    '/en / 301',
    '/en/ / 301',
    '/fr / 301',
    '/fr/ / 301',
    // Both spellings go straight to the destination. Keep exact rules ahead of splats:
    // otherwise /fr/blog/ goes to /en/blog/ instead of directly to /#posts.
    ...legacyHomes.flatMap(([lang, home]) => legacySections.flatMap(([page, section]) => [
      `/${lang}/${page} ${home}${section} 301`,
      `/${lang}/${page}/ ${home}${section} 301`,
    ])),
    '/concepts/* / 301',
    ...legacyHomes.flatMap(([lang, home]) => [
      `/${lang}/tags/* ${home}#posts 301`,
      `/${lang}/resume/* ${home}#career 301`,
    ]),
    // French post URLs go to the English posts. Posts themselves are real files, so they need no rule.
    '/fr/blog/* /en/blog/:splat 301',
    '',
  ].join('\n'),
)
const SITE_ORIGIN = 'https://angeloocana.com'
await save(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SITEMAP
    .map((path) => `  <url><loc>${SITE_ORIGIN}${path}</loc></url>`)
    .join('\n')}\n</urlset>\n`,
)
function cspRule(path: string, hashes: string[]) {
  let policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    // Cloudflare injects its Web Analytics beacon at the edge, after the build.
    ["script-src 'self' https://static.cloudflareinsights.com", ...hashes].join(' '),
    "connect-src 'self' https://cloudflareinsights.com",
    "style-src 'self'",
    `img-src 'self' data: https://img.youtube.com ${SITE_ORIGIN}/imgs/`,
    'frame-src https://www.youtube-nocookie.com',
  ].join('; ')
  return [path, `  Content-Security-Policy: ${policy}`]
}

let headers = [
  // These only apply to static assets. /media/* gets its baseline headers from worker.ts.
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Frame-Options: DENY',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  // Cloudflare's absolute URL rules match hostnames, so HSTS does not cover workers.dev.
  `${SITE_ORIGIN}/*`, '  Strict-Transport-Security: max-age=31536000',
  'https://www.angeloocana.com/*', '  Strict-Transport-Security: max-age=31536000',
  ...Array.from(homeHashes, ([path, hashes]) => cspRule(path, hashes)).flat(),
  ...POST_PREFIXES.flatMap((prefix) => cspRule(`${prefix}*`, [])),
  '/sw.js', '  Cache-Control: no-cache',
  '/assets/*', '  Cache-Control: public, max-age=31536000, immutable',
  // Stylesheets carry content hashes; fonts get new filenames when they change.
  '/css/*', '  Cache-Control: public, max-age=31536000, immutable',
  '/fonts/*', '  Cache-Control: public, max-age=31536000, immutable',
  '',
]
for (let line of headers) {
  if (Buffer.byteLength(line) > 2000) throw new Error('Cloudflare _headers lines cannot exceed 2,000 characters')
}
await save('_headers', headers.join('\n'))

assertMediaReferences(emittedText, MEDIA_VERSIONS)

let budgetSummary = homeBudgets
  .map((item) => `${item.route} ${item.emittedBytes.toLocaleString('en-US')} B (${item.projectedBytes.toLocaleString('en-US')} B versioned)`)
  .join(', ')
console.log(`Built ${Object.keys(PAGES).length} pages, ${live.size} clips and ${seen.size} script files into ${OUT}/`)
console.log(`Home HTML budget: ${budgetSummary} / ${HOME_HTML_BUDGET.toLocaleString('en-US')} B`)
