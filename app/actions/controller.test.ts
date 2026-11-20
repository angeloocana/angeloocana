import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { loadClips } from '../content/clips.ts'
import { SOCIALS } from '../content.ts'
import { COPY } from '../copy.ts'
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

  it('waits on one stylesheet; a post loads only the pointer ring, no Remix client', async () => {
    let home = await (await router.fetch(new URL(routes.home.href(), 'http://localhost'))).text()
    let head = home.slice(0, home.indexOf('</head>'))
    let blocking = [...head.matchAll(/<link rel="stylesheet"[^>]*>/g)].map(([tag]) => tag).filter((tag) => !/media="print"/.test(tag))
    assert.equal(blocking.length, 1, `home: ${blocking}`)
    // nothing fetched ahead of the first paint: the scripts start after it
    assert.doesNotMatch(head, /<link[^>]*modulepreload|<script type="module"/)
    let css = blocking[0].match(/href="([^"]+)"/)![1]
    let response = await router.fetch(new URL(css, 'http://localhost'))
    assert.equal(response.status, 200)
    assert.match(response.headers.get('Content-Type') ?? '', /text\/css/)
    // a stale name (an old build's hash) is not served
    assert.equal((await router.fetch(new URL('/css/home.stale000.css', 'http://localhost'))).status, 404)

    let [post] = postsFor('en')
    let page = await (await router.fetch(new URL(post.url, 'http://localhost'))).text()
    let scripts = [...page.matchAll(/<script[^>]*src="([^"]+)"/g)].map(([, src]) => src)
    assert.deepEqual(scripts.map((src) => src.replace(/\.@[\w-]+/, '')), ['/assets/app/ui/public/cursor.ts'])
    assert.doesNotMatch(page, /importmap|rmx-data/)
    assert.equal([...page.matchAll(/<link rel="stylesheet"/g)].length, 1)
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
    for (let [, excerpt] of html.matchAll(/<p class="post-excerpt"[^>]*>([^]*?)<\/p>/g)) {
      assert.ok(!/&lt;|src=/.test(excerpt), excerpt)
    }
  })

  it('marks the other language’s post titles and excerpts with lang', async () => {
    for (let [path, lang, other] of [[routes.pt.href(), 'pt', 'en'], [routes.home.href(), 'en', 'pt-BR']] as const) {
      let html = await (await router.fetch(new URL(path, 'http://localhost'))).text()
      let cards = [...html.matchAll(/<li class="slide post-card">([^]*?)<\/li>/g)].map((m) => m[1])
      let foreign = postsFor(lang).filter((post) => post.lang !== lang)
      assert.ok(cards.length === postsFor(lang).length, `${path}: ${cards.length} post cards`)
      if (lang === 'pt') assert.ok(foreign.length > 0, 'the PT page shows English posts')
      for (let [i, post] of postsFor(lang).entries()) {
        let want = post.lang === lang ? undefined : other
        let title = cards[i].match(/<h3([^>]*)>/)![1]
        let excerpt = cards[i].match(/<p([^>]*class="post-excerpt"[^>]*)>/)![1]
        assert.equal(title.match(/lang="([^"]+)"/)?.[1], want, `${path} ${post.url}: title`)
        assert.equal(excerpt.match(/lang="([^"]+)"/)?.[1], want, `${path} ${post.url}: excerpt`)
      }
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

  // A #link to the URL the page is already on is no hash change, so Remix's client navigation would take it
  // and reload the page's frame from the server (the career fold snapped shut: "the page refreshed").
  // data-rmx-document leaves every in-page link to the browser, which only scrolls.
  it('leaves every in-page #link on the home pages to the browser, never a frame reload', async () => {
    for (let path of [routes.home.href(), routes.pt.href()]) {
      let html = await (await router.fetch(new URL(path, 'http://localhost'))).text()
      let links = [...html.matchAll(/<a ([^>]*)>/g)].map(([, attrs]) => attrs).filter((attrs) => /href="(?:\/(?:pt\/)?)?#/.test(attrs))
      assert.ok(links.length >= 20, `${path}: only ${links.length} in-page links`)
      for (let attrs of links) assert.match(attrs, /data-rmx-document/, `${path}: <a ${attrs}>`)
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

  it('lays one sheet of ice over the page without hiding it: the words and links are in the page, the canvas is out of reach', async () => {
    for (let [path, lang] of [[routes.home.href(), 'en'], [routes.pt.href(), 'pt']] as const) {
      let html = await (await router.fetch(new URL(path, 'http://localhost'))).text()
      let hero = html.match(/<section id="top"[\s\S]*?<\/section>/)?.[0] ?? ''
      let t = COPY[lang]
      assert.match(hero, /<h1[^>]*>Ângelo <em>Ocanã<\/em><\/h1>/)
      for (let words of [t.hi.role, t.hi.proof]) assert.ok(hero.includes(words), `${path}: ${words}`)
      for (let href of ['mailto:', '#career', '#track2fit', '#jumpoverjump', '#outside']) assert.match(hero, new RegExp(`<a [^>]*href="${href}`), `${path}: ${href}`)
      // the main social links sit on the first screen too; the footer lists them all
      let foot = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? ''
      for (let social of SOCIALS) {
        assert.equal(hero.includes(`href="${social.url}"`), !social.footOnly, `${path}: ${social.label} in the hero`)
        assert.ok(foot.includes(`href="${social.url}"`), `${path}: ${social.label} in the footer`)
      }
      // one canvas for the whole page, outside the hero and every row: a single fixed layer
      assert.doesNotMatch(hero, /<canvas class="ice"/, `${path}: the ice canvas should not be inside the hero`)
      let canvases = (html.match(/<canvas [^>]*>/g) ?? []).filter((c) => /class="ice"/.test(c))
      assert.equal(canvases.length, 1, `${path}: one ice canvas`)
      let [canvas] = canvases
      assert.match(canvas, /aria-hidden="true"/)
      assert.doesNotMatch(canvas, /tabindex/i)
      let main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? ''
      assert.doesNotMatch(main, /<canvas class="ice"/, `${path}: the canvas sits over <main>, not in it`)
    }
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

  // HREF.pt is '/pt/', so a link built as `${home}/#posts` came out as /pt//#posts
  it('never links to a doubled slash, on the home pages or any post', async () => {
    let paths = [routes.home.href(), routes.pt.href(), ...postsFor('en').map((post) => post.url), ...postsFor('pt').map((post) => post.url)]
    for (let path of new Set(paths)) {
      let html = await (await router.fetch(new URL(path, 'http://localhost'))).text()
      for (let [, href] of html.matchAll(/\shref="([^"]*)"/g)) {
        let local = href.replace(/^https?:\/\/[^/]+/, '')
        assert.ok(!local.includes('//'), `${path}: href="${href}"`)
      }
    }
  })

  it('sends old preview links to the home page', async () => {
    let response = await router.fetch(new URL('/concepts/cinematic', 'http://localhost'))

    assert.equal(response.status, 301)
    assert.equal(response.headers.get('Location'), '/')
  })
})
