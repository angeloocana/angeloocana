// What visitors get from Cloudflare's edge, which the build does not produce: the Web Analytics beacon
// injected into each page, and 404.html served for misses under the post wildcards with their CSP.
// Both are simulations: serveDist answers misses like not_found_handling, and the beacon and its
// transport are intercepted requests, never the real Cloudflare scripts.
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { watchCspViolations } from './test-support/csp-violations.ts'
import { serveDist } from './test-support/serve-dist.ts'

const BEACON = 'https://static.cloudflareinsights.com/beacon.min.js'
const RUM = 'https://cloudflareinsights.com/cdn-cgi/rum'

describe('the site as Cloudflare serves it', () => {
  it('lets the edge-injected analytics beacon load and report under the shipped CSP', async (t) => {
    let page = await t.serve(await serveDist())
    let violations = await watchCspViolations(page)
    let reports = 0
    await page.route((url) => url.hostname === '127.0.0.1', async (route) => {
      if (route.request().resourceType() !== 'document') return route.continue()
      let response = await route.fetch()
      let body = (await response.text()).replace('</body>', `<script defer src="${BEACON}" data-cf-beacon='{"token":"test"}'></script></body>`)
      await route.fulfill({ response, body })
    })
    await page.route(BEACON, (route) => route.fulfill({
      contentType: 'text/javascript',
      body: `fetch(${JSON.stringify(RUM)}, { method: 'POST', body: '{}' }).then(() => { window.beaconReported = true })`,
    }))
    await page.route(RUM, (route) => {
      reports++
      return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } })
    })
    for (let path of ['/', '/pt/', '/en/blog/git/git-setup/']) {
      let response = await page.goto(path)
      assert.equal(response?.status(), 200, path)
      assert.ok(response?.headers()['content-security-policy'], path)
      await page.waitForFunction(() => (window as Window & { beaconReported?: boolean }).beaconReported, null, { timeout: 2000 })
        .catch(() => assert.fail(`${path}: the beacon did not report (${violations.join(', ') || 'no CSP violation'})`))
    }
    assert.equal(reports, 3)
    assert.deepEqual(violations, [])
  })

  it('styles the 404 page for misses under the post wildcards, under their CSP', async (t) => {
    let page = await t.serve(await serveDist())
    let violations = await watchCspViolations(page)
    for (let path of ['/en/blog/missing/', '/pt/blog/missing/', '/Tutoriais/missing/']) {
      let response = await page.goto(path)
      assert.equal(response?.status(), 404, path)
      assert.ok(response?.headers()['content-security-policy'], `${path} carries its wildcard CSP`)
      assert.equal(await page.locator('h1').textContent(), 'Page not found')
      let style = await page.evaluate(() => ({
        background: getComputedStyle(document.body).backgroundColor,
        languages: getComputedStyle(document.querySelector('.languages')!).display,
      }))
      assert.deepEqual(style, { background: 'rgb(7, 7, 7)', languages: 'grid' }, `${path} is styled`)
    }
    assert.deepEqual(violations, [])
  })
})
