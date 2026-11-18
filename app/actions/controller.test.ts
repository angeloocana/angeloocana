import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { loadClips } from '../content/clips.ts'
import { plain, postsFor } from '../content/posts.ts'
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
    assert.match(html, /<h1[^>]*>Ângelo <em>Ocanã<\/em><\/h1>/)
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

  it('keeps HTML out of the post cards’ excerpts', async () => {
    assert.equal(plain('Hi <img style="max-width: 100%" src="x.png" /> there <!-- note -->'), 'Hi there')
    for (let lang of ['en', 'pt'] as const) {
      for (let post of postsFor(lang)) {
        assert.ok(!/[<>]|src=|style=/.test(post.excerpt), `${post.url}: ${post.excerpt}`)
      }
    }
    let html = await (await router.fetch(new URL(routes.home.href(), 'http://localhost'))).text()
    for (let [, excerpt] of html.matchAll(/<p class="post-excerpt">([^]*?)<\/p>/g)) {
      assert.ok(!/&lt;|src=/.test(excerpt), excerpt)
    }
  })

  it('names the menu’s sections in page order, each one on the page', async () => {
    let html = await (await router.fetch(new URL(routes.home.href(), 'http://localhost'))).text()
    let menu = html.match(/<nav [^>]*class="cin-menu"[^]*?<\/nav>/)![0]
    let ids = [...menu.matchAll(/data-chapter-link="([^"]+)"/g)].map((m) => m[1])
    assert.deepEqual(ids, ['career', 'projects', 'outside', 'learning', 'posts', 'contact'])
    let at = ids.map((id) => html.indexOf(`id="${id}"`))
    assert.ok(at.every((pos, i) => pos > 0 && (i === 0 || pos > at[i - 1])), `menu out of page order: ${at}`)
  })

  it('links each product in the hero to its own row, with its own name', async () => {
    for (let path of [routes.home.href(), routes.pt.href()]) {
      let html = await (await router.fetch(new URL(path, 'http://localhost'))).text()
      let tile = html.match(/<li class="tile tile-build"[^]*?<\/ul>/)![0]
      let links = [...tile.matchAll(/<a href="([^"]+)"[^>]*aria-label="([^"]+)"/g)].map(([, href, name]) => ({ href, name }))
      assert.deepEqual(links.map((link) => link.href), ['#track2fit', '#jumpoverjump'], path)
      assert.match(links[0].name, /^track2\.fit: /)
      assert.match(links[1].name, /^Jump Over Jump: /)
      for (let { href } of links) assert.ok(html.includes(`id="${href.slice(1)}"`), `${path}: no ${href} on the page`)
    }
  })

  it('points the language flags at /pt/ and /, with full page loads, so a #section survives the switch', async () => {
    for (let path of [routes.home.href(), routes.pt.href()]) {
      let html = await (await router.fetch(new URL(path, 'http://localhost'))).text()
      let flags = [...html.matchAll(/<a ([^>]*class="lang-card[^"]*"[^>]*)>/g)].map(([, attrs]) => attrs)
      assert.deepEqual(flags.map((attrs) => attrs.match(/href="([^"]+)"/)![1]), ['/', '/pt/'], path)
      for (let attrs of flags) assert.match(attrs, /data-rmx-document/, path)
    }
    // the static host serves /pt/ (and redirects /pt there, losing the #section)
    assert.equal(routes.pt.href(), '/pt/')
  })

  it('names the hero’s second button for where it goes, the projects', async () => {
    let expected = { [routes.home.href()]: 'See my projects', [routes.pt.href()]: 'Ver meus projetos' }
    for (let [path, label] of Object.entries(expected)) {
      let html = await (await router.fetch(new URL(path, 'http://localhost'))).text()
      let cta = html.match(/<a ([^>]*hero-projects[^>]*)>([^<]+)/)
      assert.ok(cta, `${path}: no projects button in the hero`)
      assert.match(cta[1], /href="#projects"/)
      assert.equal(cta[2].trim(), label)
    }
  })

  it('plays the lighter cuts of the hero clip: the phone one first, then the tile one', async () => {
    let html = await (await router.fetch(new URL(routes.home.href(), 'http://localhost'))).text()
    let video = html.match(/<video [^>]*tile-video[\s\S]*?<\/video>/)?.[0] ?? ''
    let sources = [...video.matchAll(/<source ([^>]*)>/g)].map((m) => m[1])
    assert.equal(sources.length, 2, 'the hero video should have a phone source and a tile source')
    assert.match(sources[0], /src="\/media\/hero\/[^"]+-phone\.mp4\?v=/)
    assert.match(sources[0], /media="\(max-width: 760px\)"/)
    assert.match(sources[1], /src="\/media\/hero\/[^"]+-tile\.mp4\?v=/)
  })

  it('names every row’s list and arrows for that row, never the same words twice', async () => {
    for (let path of [routes.home.href(), routes.pt.href()]) {
      let html = await (await router.fetch(new URL(path, 'http://localhost'))).text()
      let rows = [...html.matchAll(/<section [^>]*data-rail[^>]*aria-label="([^"]+)"[^]*?<\/section>/g)]
      assert.ok(rows.length >= 8, `${path}: ${rows.length} rows`)
      let names: string[] = []
      for (let [section, label] of rows) {
        let rail = section.match(/<ul [^>]*data-rail-track[^>]*>/)![0]
        assert.match(rail, new RegExp(`aria-label="${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${path}: the ${label} list is not named ${label}`)
        for (let [button] of section.matchAll(/<button [^>]*data-rail-(?:prev|next)[^>]*>/g)) names.push(button.match(/aria-label="([^"]+)"/)![1])
      }
      assert.equal(new Set(names).size, names.length, `${path}: arrows share a name: ${names}`)
    }
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
