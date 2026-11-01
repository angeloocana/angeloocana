import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { router } from '../router.ts'
import { routes } from '../routes.ts'

describe('root controller', () => {
  it('GET / returns the home page', async () => {
    let response = await router.fetch(new URL(routes.home.href(), 'http://localhost'))

    assert.equal(response.status, 200)
    assert.match(response.headers.get('Content-Type') ?? '', /text\/html/)
    let html = await response.text()
    assert.match(html, /<html[\s>]/)
    assert.match(html, /id="projects"/)
  })

  it('GET /pt returns the Portuguese page', async () => {
    let response = await router.fetch(new URL(routes.pt.href(), 'http://localhost'))

    assert.equal(response.status, 200)
    let html = await response.text()
    assert.match(html, /<html lang="pt-BR"/)
    assert.match(html, /Projetos pessoais/)
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
    for (let path of ['/review', '/review/cut/h-ice', '/review/moments/v226', '/review/sheet/v226', '/review/source?path=ig%3Areels%2Fx.mp4']) {
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
