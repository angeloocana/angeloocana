import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import worker from './worker.ts'

const ETAG = '"clip-version"'
const MEDIA_URL = 'https://angeloocana.com/media/clips/c12345678.mp4?v=0123456789'

const env: Parameters<typeof worker.fetch>[1] = {
  ASSETS: { async fetch() { throw new Error('Media should not reach the static asset binding') } },
  MEDIA: {
    async get(key, { range, onlyIf }) {
      assert.equal(key, 'clips/c12345678.mp4')
      let object = {
        size: 4,
        httpEtag: ETAG,
        writeHttpMetadata(headers: Headers) { headers.set('Content-Type', 'video/mp4') },
      }
      if (onlyIf?.get('If-None-Match') === ETAG) return object
      if (range?.get('Range') === 'bytes=0-1') {
        return { ...object, range: { offset: 0, length: 2 }, body: new Response('ab').body! }
      }
      return { ...object, body: new Response('abcd').body! }
    },
  },
}

it('adds security headers without changing full, ranged or revalidated media responses', async () => {
  const cases: { status: number; requestHeaders: HeadersInit; content: string; contentRange: string | null }[] = [
    { status: 200, requestHeaders: {}, content: 'abcd', contentRange: null },
    { status: 206, requestHeaders: { Range: 'bytes=0-1' }, content: 'ab', contentRange: 'bytes 0-1/4' },
    { status: 304, requestHeaders: { 'If-None-Match': ETAG }, content: '', contentRange: null },
  ]

  for (let { status, requestHeaders, content, contentRange } of cases) {
    let response = await worker.fetch(new Request(MEDIA_URL, { headers: requestHeaders }), env)
    assert.equal(response.status, status)
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff')
    assert.equal(response.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin')
    assert.equal(response.headers.get('X-Frame-Options'), 'DENY')
    assert.equal(response.headers.get('Permissions-Policy'), 'camera=(), microphone=(), geolocation=()')
    assert.equal(response.headers.get('Strict-Transport-Security'), 'max-age=31536000')
    assert.equal(response.headers.get('Cache-Control'), 'public, max-age=604800')
    assert.equal(response.headers.get('ETag'), ETAG)
    assert.equal(response.headers.get('Accept-Ranges'), 'bytes')
    assert.equal(response.headers.get('Content-Type'), 'video/mp4')
    assert.equal(response.headers.get('Content-Range'), contentRange)
    assert.equal(await response.text(), content)
  }

  for (let [origin, expected] of [
    ['https://www.angeloocana.com', 'max-age=31536000'],
    ['https://angeloocana.angeloocana.workers.dev', null],
    ['http://angeloocana.com', null],
  ] as const) {
    let url = new URL(MEDIA_URL)
    let response = await worker.fetch(new Request(new URL(url.pathname + url.search, origin)), env)
    assert.equal(response.headers.get('Strict-Transport-Security'), expected, origin)
  }
})

const KEY = 'clips/c12345678.mp4'
const VERSION = 'aBb1D-e2G3h4_IJ5'
const VERSIONED_KEY = `versions/${VERSION}/${KEY}`

function mediaWorker() {
  let lookups: string[] = []
  let objects = new Map([[KEY, 'original cut'], [VERSIONED_KEY, 'new cut']])
  let env = {
    ASSETS: { async fetch(): Promise<Response> { throw new Error('Unexpected asset request') } },
    MEDIA: {
      async get(key: string) {
        lookups.push(key)
        let bytes = objects.get(key)
        if (bytes === undefined) return null
        return { size: bytes.length, httpEtag: '"fake"', writeHttpMetadata() {}, body: new Response(bytes).body! }
      },
    },
  }
  return { lookups, fetch: (path: string) => worker.fetch(new Request(`https://example.test/media/${path}`), env) }
}

describe('media worker', () => {
  it('keeps legacy URLs on the original object and serves only exact versioned objects', async () => {
    let worker = mediaWorker()
    for (let suffix of ['', '?v=0123456789', '?v=0']) {
      let response = await worker.fetch(`${KEY}${suffix}`)
      assert.equal(response.status, 200)
      assert.equal(await response.text(), 'original cut')
    }
    let latest = await worker.fetch(`${KEY}?v=${VERSION}`)
    assert.equal(latest.status, 200)
    assert.equal(await latest.text(), 'new cut')

    let missingVersion = 'b'.repeat(16)
    let missing = await worker.fetch(`${KEY}?v=${missingVersion}`)
    assert.equal(missing.status, 404)
    assert.equal(missing.headers.get('Cache-Control'), 'no-store')
    assert.deepEqual(worker.lookups, [KEY, KEY, KEY, VERSIONED_KEY, `versions/${missingVersion}/${KEY}`])
  })

  it('rejects private or malformed media URLs without contacting R2', async () => {
    let worker = mediaWorker()
    for (let path of [
      VERSIONED_KEY,
      `versions%2F${VERSION}/${KEY}`,
      'clips/%ZZ.mp4',
      'joj/unlisted.webp',
      `${KEY}?v=`,
      `${KEY}?v=unexpected`,
      `${KEY}?v=0&v=${VERSION}`,
    ]) {
      let response = await worker.fetch(path)
      assert.equal(response.status, 404, path)
      assert.equal(response.headers.get('Cache-Control'), 'no-store', path)
      assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff', path)
    }
    assert.deepEqual(worker.lookups, [])
  })
})
