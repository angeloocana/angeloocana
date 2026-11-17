import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { loadClips } from '../content/clips.ts'
import { router } from '../router.ts'
import { routes } from '../routes.ts'

// The home page's weight on a phone: the clips past the first few come from /data/clips.json instead.
const HOME_BUDGET = 130_000

describe('root controller', () => {
  it('GET / returns the home page', async () => {
    let response = await router.fetch(new URL(routes.home.href(), 'http://localhost'))

    assert.equal(response.status, 200)
    assert.match(response.headers.get('Content-Type') ?? '', /text\/html/)
    let html = await response.text()
    assert.match(html, /<html[\s>]/)
    assert.match(html, /Staff software engineer/)
    // work first: hero, career, projects, then the clips, learning, posts and contact
    let order = ['top', 'career', 'projects', 'outside', 'learning', 'posts', 'contact'].map((id) => html.indexOf(`id="${id}"`))
    assert.ok(order.every((at, i) => at > 0 && (i === 0 || at > order[i - 1])), `sections out of order: ${order}`)
  })

  it('keeps both home pages under the size budget', async () => {
    for (let path of [routes.home.href(), routes.pt.href()]) {
      let html = await (await router.fetch(new URL(path, 'http://localhost'))).text()
      let bytes = new TextEncoder().encode(html).length
      assert.ok(bytes <= HOME_BUDGET, `${path} is ${bytes} bytes, over ${HOME_BUDGET}`)
    }
  })

  it('serves every live clip in /data/clips.json', async () => {
    let response = await router.fetch(new URL(routes.clipsData.href(), 'http://localhost'))
    assert.equal(response.status, 200)
    let { clips } = (await response.json()) as { clips: { id: string }[] }
    let live = loadClips().filter((clip) => !clip.rejected).map((clip) => clip.id).sort()
    assert.deepEqual(clips.map((clip) => clip.id).sort(), live)
  })

  it('GET /pt returns the Portuguese page', async () => {
    let response = await router.fetch(new URL(routes.pt.href(), 'http://localhost'))

    assert.equal(response.status, 200)
    let html = await response.text()
    assert.match(html, /<html lang="pt-BR"/)
    assert.match(html, /Engenheiro de software staff/)
  })

  it('keeps old post URLs, in English, Portuguese and the 2015 tutorials', async () => {
    for (let path of ['/en/blog/git/git-setup/', '/pt/blog/git/git-setup/', '/Tutoriais/DicaRapida_1_Melhorar_Performance_MVC/']) {
      let response = await router.fetch(new URL(path, 'http://localhost'))
      assert.equal(response.status, 200, path)
    }
    let missing = await router.fetch(new URL('/en/blog/does-not-exist/', 'http://localhost'))
    assert.equal(missing.status, 404)
  })

  it('keeps the clip review tools off outside development', async () => {
    for (let path of ['/review', '/review/cut/h-ice', '/review/moments/v226', '/review/sheet/v226', '/review/source?path=ig%3Areels%2Fx.mp4', '/review/publish']) {
      let response = await router.fetch(new URL(path, 'http://localhost'))
      assert.equal(response.status, 404, path)
    }
  })

  it('sends old preview links to the home page', async () => {
    let response = await router.fetch(new URL('/concepts/cinematic', 'http://localhost'))

    assert.equal(response.status, 301)
    assert.equal(response.headers.get('Location'), '/')
  })
})
