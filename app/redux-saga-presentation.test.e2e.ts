import { fileURLToPath } from 'node:url'
import * as assert from 'remix/assert'
import { staticFiles } from 'remix/middleware/static'
import { createTestServer } from 'remix/node-fetch-server/test'
import { createRouter } from 'remix/router'
import { it } from 'remix/test'

it('publishes the archived Redux Saga deck and its five illustrations', async (t) => {
  let router = createRouter({ middleware: [staticFiles(fileURLToPath(new URL('../dist/', import.meta.url)))] })
  let page = await t.serve(await createTestServer(router.fetch))
  // Test the built paths without relying on a CDN in the test suite.
  let deck = await page.request.get('/redux-saga-presentation.html')
  assert.equal(deck.status(), 200)
  let html = await deck.text()
  assert.equal(html.split(/^---$/m).length, 32)
  assert.match(html, /^# Thank you!$/m)

  let images = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(([, src]) => src)
  assert.deepEqual(images, [
    './imgs/Redux-Saga-Logo-Landscape.png',
    './imgs/redux-saga-stars.png',
    './imgs/redux-2.png',
    './imgs/positive.svg',
    './imgs/negative.svg',
  ])
  for (let src of images) {
    let image = await page.request.get(new URL(src, deck.url()).href)
    assert.equal(image.status(), 200)
    assert.match(image.headers()['content-type'], /^image\//)
  }
})
