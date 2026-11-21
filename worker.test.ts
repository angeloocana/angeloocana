import * as assert from 'remix/assert'
import { it } from 'remix/test'

import worker from './worker.ts'

const ETAG = '"clip-version"'
const MEDIA_URL = 'https://angeloocana.com/media/clips/test.mp4?v=clip-version'

const env: Parameters<typeof worker.fetch>[1] = {
  ASSETS: { async fetch() { throw new Error('Media should not reach the static asset binding') } },
  MEDIA: {
    async get(key, { range, onlyIf }) {
      assert.equal(key, 'clips/test.mp4')
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
    assert.equal(response.headers.get('Strict-Transport-Security'), 'max-age=604800')
    assert.equal(response.headers.get('Cache-Control'), 'public, max-age=604800')
    assert.equal(response.headers.get('ETag'), ETAG)
    assert.equal(response.headers.get('Accept-Ranges'), 'bytes')
    assert.equal(response.headers.get('Content-Type'), 'video/mp4')
    assert.equal(response.headers.get('Content-Range'), contentRange)
    assert.equal(await response.text(), content)
  }

  let preview = new URL(MEDIA_URL)
  preview.hostname = 'angeloocana.angeloocana.workers.dev'
  let response = await worker.fetch(new Request(preview), env)
  assert.equal(response.headers.get('Strict-Transport-Security'), null)
})
