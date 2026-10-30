// Prerenders the site to plain files in dist/, ready for any static host (Cloudflare, see wrangler.jsonc).
// Run with `npm run build`. It renders each page through the real router, then follows every
// /assets/ URL (scripts, import maps, chunks) so the browser islands work without a server.
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { MEDIA_VERSIONS, loadClips } from '../app/content/clips.ts'
import { allPosts } from '../app/content/posts.ts'
import { router } from '../app/router.ts'

const ORIGIN = 'http://localhost'
const OUT = 'dist'
const PAGES: Record<string, string> = { '/': 'index.html', '/pt': 'pt/index.html' }
// every post keeps the URL it had on the old site: /en/blog/git/git-setup/ → en/blog/git/git-setup/index.html
for (let post of allPosts()) PAGES[post.url] = `${post.url.slice(1)}index.html`

await rm(OUT, { recursive: true, force: true })
// public/ first, then the rendered pages and scripts on top.
const live = new Set(loadClips().filter((clip) => !clip.rejected).map((clip) => clip.id))
// The videos and screenshots aren't built in: they live in the angeloocana-media R2 bucket, which the
// worker serves at /media (worker.ts), so this runs from git alone (Workers Builds deploys every push).
// app/content/media.json lists what has been uploaded; stop if a live clip hasn't been, rather than
// publish a page with a broken video.
let missing = [...live].flatMap((id) => [`clips/${id}.mp4`, `clips/${id}.jpg`]).filter((key) => !MEDIA_VERSIONS[key])
if (missing.length) {
  throw new Error(`${missing.length} live clip files aren't in the bucket yet (${missing.slice(0, 3).join(', ')}…). Run \`npm run media:push\` and commit app/content/media.json.`)
}
await cp('public', OUT, {
  recursive: true,
  filter: (src) => !src.endsWith('.DS_Store') && !src.endsWith('styles/review.css') && !src.startsWith('public/media'),
})

// Browser modules compiled from .ts/.tsx keep their source names, which static hosts would serve
// with the wrong type. Save them as .js and point every reference at the new name.
const TS_URL = /(\/assets\/[^"'`#?\s]+?\.tsx?)(?=["'`#?\s])/g
// A module that imports a sibling (tic-tac-toe.tsx → ./tic-tac-toe-ai.ts) needs the same rename, or the
// browser asks for the .ts name, which the import map no longer has, and the whole module fails to load.
const RELATIVE_TS_IMPORT = /(\bfrom\s*|\bimport\s*\(?\s*)(["'])(\.{1,2}\/[^"']+?\.tsx?)\2/g
const asJs = (path: string) => (/\.tsx?$/.test(path) ? `${path}.js` : path)
// Cloudflare answers a path with a bare @ (rails.@a1b2c3.tsx) with a redirect to its %40 spelling,
// one extra round trip per script, so references use that spelling from the start.
const ASSET_URL = /\/assets\/[^"'`\s)]+/g

async function save(path: string, body: string | Uint8Array) {
  if (typeof body === 'string') {
    body = body
      .replace(TS_URL, '$1.js')
      .replace(RELATIVE_TS_IMPORT, '$1$2$3.js$2')
      .replace(ASSET_URL, (url) => url.replaceAll('@', '%40'))
  }
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
  for (let [, spec] of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["'](\.{1,2}\/[^"']+)["']/g)) {
    queue.push(new URL(spec, new URL(from, ORIGIN)).pathname)
  }
}

for (let [path, file] of Object.entries(PAGES)) {
  let html = await (await get(path)).text()
  await save(file, html)
  collect(html, path)
}

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
    await save(url, text)
  } else {
    await save(url, new Uint8Array(await response.arrayBuffer()))
  }
}

// Old addresses: preview links, and the old site's pages that now live in a section of the home page.
// French versions go to the English post. Posts themselves are real files, so they need no rule.
await save(
  '_redirects',
  [
    '/concepts/* / 301',
    '/en / 301',
    '/en/ / 301',
    '/en/blog/ /#posts 301',
    '/pt/blog/ /pt#posts 301',
    '/en/tags/* /#posts 301',
    '/pt/tags/* /pt#posts 301',
    '/en/resume/* /#career 301',
    '/pt/resume/* /pt#career 301',
    '/en/about/ / 301',
    '/pt/about/ /pt 301',
    '/en/contact/ /#contact 301',
    '/pt/contact/ /pt#contact 301',
    '/fr/blog/* /en/blog/:splat 301',
    '/fr / 301',
    '/fr/ / 301',
    '/fr/blog/ /#posts 301',
    '/fr/tags/* /#posts 301',
    '/fr/resume/* /#career 301',
    '/fr/about/ / 301',
    '/fr/contact/ /#contact 301',
    '',
  ].join('\n'),
)
// The old site's offline service worker answers page loads with this address. A redirect there makes
// the browser show an error, so it gets the home page itself until those old workers are gone (see public/sw.js).
await save('offline-plugin-app-shell-fallback/index.html', (await (await get('/')).text()))
const SITE_ORIGIN = 'https://angeloocana.com'
await save(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.keys(PAGES)
    .map((path) => `  <url><loc>${SITE_ORIGIN}${path}</loc></url>`)
    .join('\n')}\n</urlset>\n`,
)
await save(
  '_headers',
  // (/media/* gets its headers from worker.ts)
  ['/sw.js', '  Cache-Control: no-cache', '/assets/*', '  Cache-Control: public, max-age=31536000, immutable', ''].join('\n'),
)

console.log(`Built ${Object.keys(PAGES).length} pages, ${live.size} clips and ${seen.size} script files into ${OUT}/`)
