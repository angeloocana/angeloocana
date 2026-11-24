import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { HOME_HTML_BUDGET, assertHomeHtmlBudget, projectVersionedMediaHtml } from './home-html-budget.ts'

describe('emitted home HTML budget', () => {
  it('passes when both emitted home pages stay within 130,000 bytes after versioned-media projection', () => {
    let results = assertHomeHtmlBudget([
      { route: '/', file: 'dist/index.html', html: '<img src="/media/clips/c01d58aac.jpg?v=0318306f03">' },
      { route: '/pt/', file: 'dist/pt/index.html', html: '<img src="/media/clips/c01d58aac.jpg?v=aBb1D-e2G3h4_IJ5">' },
    ])
    assert.equal(results[0].legacyMediaUrls, 1)
    assert.equal(results[0].projectedBytes - results[0].emittedBytes, 6)
    assert.equal(results[1].legacyMediaUrls, 0)
    assert.equal(results[1].projectedBytes, results[1].emittedBytes)
  })

  it('projects only 10-character legacy hex versions, not 16-character or sha256 versions', () => {
    let html = [
      '<img src="/media/clips/a.jpg?v=0318306f03">',
      '<img src="/media/clips/b.jpg?v=0123456789abcdef">',
      '<img src="/media/clips/c.jpg?v=aBb1D-e2G3h4_IJ5">',
      `<img src="/media/clips/d.jpg?v=sha256-${'a'.repeat(64)}">`,
    ].join('')
    let projected = projectVersionedMediaHtml(html)
    assert.equal(projected.legacyMediaUrls, 1)
    assert.match(projected.html, /a\.jpg\?v=abcdefghijklmnop/)
    assert.match(projected.html, /b\.jpg\?v=0123456789abcdef/)
    assert.match(projected.html, /c\.jpg\?v=aBb1D-e2G3h4_IJ5/)
    assert.match(projected.html, new RegExp(`d\\.jpg\\?v=sha256-${'a'.repeat(64)}`))
  })

  it('rejects an over-budget emitted page with route, byte count, overage, and where to start looking', () => {
    let oversized = `<section id="outside">${'x'.repeat(180)}</section><svg><path d="M0 0"/></svg><script>1</script>`
    assert.throws(
      () =>
        assertHomeHtmlBudget(
          [
            { route: '/', file: 'dist/index.html', html: '<section id="top">ok</section>' },
            { route: '/pt/', file: 'dist/pt/index.html', html: oversized },
          ],
          { budget: 200 },
        ),
      (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.match(error.message, /\/pt\/ \(dist\/pt\/index\.html\)/)
        assert.match(error.message, /\+\d+ B over 200 B limit/)
        assert.match(error.message, /Largest sections: #outside/)
        assert.match(error.message, /Cross-cutting: <svg>/)
        assert.match(error.message, /Start looking in:/)
        return true
      },
    )
  })

  it('rejects a page that crosses the budget only after projecting legacy media URLs', () => {
    let mediaTags = '<img src="/media/clips/c01d58aac.jpg?v=0318306f03">'.repeat(3) // +18 B projected
    let emittedBytes = Buffer.byteLength(mediaTags, 'utf8')
    let budget = emittedBytes + 10
    assert.throws(
      () =>
        assertHomeHtmlBudget(
          [
            { route: '/', file: 'dist/index.html', html: 'ok' },
            { route: '/pt/', file: 'dist/pt/index.html', html: mediaTags },
          ],
          { budget },
        ),
      (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.match(error.message, /\/pt\/ \(dist\/pt\/index\.html\)/)
        assert.match(error.message, /\+8 B over /)
        assert.match(error.message, /3 legacy/)
        return true
      },
    )
  })

  it('keeps the 130,000-byte limit and fails if a required home route is missing', () => {
    assert.equal(HOME_HTML_BUDGET, 130_000)
    assert.throws(
      () => assertHomeHtmlBudget([{ route: '/', file: 'dist/index.html', html: 'ok' }]),
      /missed required home routes: \/pt\//,
    )
  })
})
