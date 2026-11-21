// The Cloudflare worker in front of the site (wrangler.jsonc). Pages, scripts and styles are static
// files in dist/ and never reach this code. Only /media/* does (run_worker_first): the videos and
// screenshots live in the angeloocana-media R2 bucket, filled by `npm run media:push`, so the site can
// be built and deployed from git alone. Videos need byte ranges: Safari on iPhone asks for a video in
// pieces and won't play one served whole.

import { isPublicMediaKey, versionedMediaKey } from './app/content/media-keys.ts'

/** The few R2 binding types this file uses (the full set lives in @cloudflare/workers-types). */
type R2Range = { offset: number; length?: number } | { offset?: number; length: number } | { suffix: number }
type R2Object = { size: number; httpEtag: string; range?: R2Range; writeHttpMetadata(headers: Headers): void }
type R2ObjectBody = R2Object & { body: ReadableStream }
type R2Bucket = { get(key: string, options: { range?: Headers; onlyIf?: Headers }): Promise<R2Object | R2ObjectBody | null> }
type Env = { MEDIA: R2Bucket; ASSETS: { fetch(request: Request): Promise<Response> } }

// URLs carry a ?v= of the file's content (app/content/media.json), so a week is safe: a re-cut gets a new URL.
const CACHE = 'public, max-age=604800'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    let url = new URL(request.url)
    if (!url.pathname.startsWith('/media/')) return env.ASSETS.fetch(request)

    // _headers only applies to static assets; these are R2 responses, not site documents.
    let headers = new Headers({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    })
    if (url.protocol === 'https:' && (url.hostname === 'angeloocana.com' || url.hostname === 'www.angeloocana.com')) {
      headers.set('Strict-Transport-Security', 'max-age=604800')
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      headers.set('Allow', 'GET, HEAD')
      return new Response(null, { status: 405, headers })
    }

    let key = mediaObjectKey(url)
    if (!key) return notFound(headers)

    let object: R2Object | R2ObjectBody | null
    try {
      object = await env.MEDIA.get(key, { range: request.headers, onlyIf: request.headers })
    } catch {
      // a range past the end of the file
      return new Response(null, { status: 416, headers })
    }
    if (!object) return notFound(headers)

    object.writeHttpMetadata(headers)
    headers.set('ETag', object.httpEtag)
    headers.set('Cache-Control', CACHE)
    headers.set('Accept-Ranges', 'bytes')

    // the browser's copy is still current (If-None-Match and friends)
    if (!('body' in object)) return new Response(null, { status: 304, headers })

    let partial = request.headers.has('Range') && object.range
    if (partial) headers.set('Content-Range', contentRange(object.range!, object.size))
    if (request.method === 'HEAD') {
      if (!partial) headers.set('Content-Length', String(object.size))
      return new Response(null, { status: partial ? 206 : 200, headers })
    }
    return new Response(object.body, { status: partial ? 206 : 200, headers })
  },
}

function mediaObjectKey(url: URL): string | undefined {
  // Every public key has a canonical ASCII path. No decoding means encoded separators and
  // malformed escapes cannot become logical keys, or expose the private versions/ prefix.
  let key = url.pathname.slice('/media/'.length)
  let [version, extra] = url.searchParams.getAll('v')
  if (extra !== undefined) return

  if (version === undefined || version === '0' || /^[0-9a-f]{10}$/.test(version)) {
    return isPublicMediaKey(key) ? key : undefined
  }

  // A versioned URL names one immutable object, even when that object is missing.
  try {
    return versionedMediaKey(key, version)
  } catch {
    return undefined
  }
}

function notFound(headers: Headers) {
  headers.set('Cache-Control', 'no-store')
  return new Response('Not found', { status: 404, headers })
}

// R2 fills in all three keys of the range, the unused ones as undefined, so test the values, not the keys
function contentRange(range: R2Range, size: number) {
  let { offset, length, suffix } = range as { offset?: number; length?: number; suffix?: number }
  let start = suffix !== undefined ? Math.max(size - suffix, 0) : (offset ?? 0)
  let end = suffix !== undefined || length === undefined ? size - 1 : start + length - 1
  return `bytes ${start}-${Math.min(end, size - 1)}/${size}`
}
