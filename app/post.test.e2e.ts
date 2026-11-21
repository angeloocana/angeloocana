import { fileURLToPath } from 'node:url'
import * as assert from 'remix/assert'
import { staticFiles } from 'remix/middleware/static'
import { createTestServer } from 'remix/node-fetch-server/test'
import { createRouter } from 'remix/router'
import { describe, it } from 'remix/test'

function serveDist() {
  let router = createRouter({ middleware: [staticFiles(fileURLToPath(new URL('../dist/', import.meta.url)))] })
  return createTestServer((request) => {
    // Wrangler resolves the URL-encoded @ in a fingerprint to the filename on disk.
    let url = new URL(request.url)
    if (url.pathname.startsWith('/assets/')) url.pathname = url.pathname.replaceAll('%40', '@')
    return router.fetch(new Request(url, request))
  })
}

const gitPost = 'blog/git/git-setup/'
const tutorial = '/Tutoriais/DicaRapida_1_Melhorar_Performance_MVC/'

describe('posts in a browser', () => {
  it('lets readers switch languages and reach the whole article at 320px', async (t) => {
    let page = await t.serve(await serveDist())
    await page.setViewportSize({ width: 320, height: 720 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/en/${gitPost}`)
    await page.evaluate(() => document.fonts.ready)

    await page.keyboard.press('Tab')
    assert.equal(await page.locator(':focus').textContent(), 'Skip to content')
    await page.keyboard.press('Enter')
    assert.equal(await page.locator(':focus').getAttribute('id'), 'main')
    let code = page.locator('.post-body pre').first()
    assert.ok(await code.evaluate((el) => el.scrollWidth <= el.clientWidth))

    for (let lang of ['pt', 'en']) {
      let face = page.locator(`.lang-${lang} .lang-face`)
      await page.evaluate(() => document.fonts.ready)
      let box = await face.boundingBox()
      assert.ok(box && box.x >= 0 && box.x + box.width <= 320, `flag ${lang} fits`)
      await face.click()
      await page.waitForURL(`**/${lang}/${gitPost}`)
    }
  })

  it('starts an inline tutorial only on Play and keeps a normal YouTube link', async (t) => {
    let page = await t.serve(await serveDist())
    let requests: string[] = []
    await page.route('https://www.youtube-nocookie.com/**', (route) => {
      requests.push(route.request().url())
      return route.fulfill({ contentType: 'text/html', body: '<title>Video player</title>' })
    })
    for (let key of ['Space', 'Enter']) {
      requests.length = 0
      await page.goto(tutorial)
      let play = page.getByRole('button', { name: 'Tocar o vídeo (carrega o YouTube)' })
      await play.scrollIntoViewIfNeeded()
      assert.equal(await page.locator('.post-video iframe').count(), 0)
      assert.equal(requests.length, 0)
      assert.equal(await page.locator('.post-video figcaption a').getAttribute('href'), 'https://www.youtube.com/watch?v=HG8WBYvoOdA')

      let box = await play.boundingBox()
      let embed = 'https://www.youtube-nocookie.com/embed/HG8WBYvoOdA?autoplay=1'
      await Promise.all([page.waitForResponse(embed), play.press(key)])
      assert.deepEqual(requests, [embed])
      let player = await page.locator('.post-video iframe').boundingBox()
      assert.equal(player?.height, box?.height)
      assert.equal(player?.width, box?.width)
    }
  })
})
