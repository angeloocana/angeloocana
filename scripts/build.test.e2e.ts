import { readFile } from 'node:fs/promises'
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

const DIST = new URL('../dist/', import.meta.url)

describe('static build recovery URLs', () => {
  it('redirects legacy indexes directly with or without a trailing slash', async () => {
    let redirects = await readFile(new URL('_redirects', DIST), 'utf8')
    let rules = redirects.trim().split('\n')
    for (let [lang, home] of [['en', '/'], ['pt', '/pt/'], ['fr', '/']]) {
      for (let [page, section] of [['blog', '#posts'], ['tags', '#posts'], ['resume', '#career'], ['about', ''], ['contact', '#contact']]) {
        for (let slash of ['', '/']) {
          let path = `/${lang}/${page}${slash}`
          assert.ok(rules.includes(`${path} ${home}${section} 301`), path)
        }
      }
    }
    let frenchPosts = rules.indexOf('/fr/blog/* /en/blog/:splat 301')
    assert.ok(frenchPosts > rules.indexOf('/fr/blog/ /#posts 301'), 'the French index must match before the deep post redirect')
  })

  it('ships a Cloudflare 404 page with recovery links in both languages', async () => {
    let html = await readFile(new URL('404.html', DIST), 'utf8')
    let config = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
    assert.match(config, /"not_found_handling"\s*:\s*"404-page"/)
    assert.match(html, /<h1>Page not found<\/h1>/)
    assert.match(html, /<section lang="pt-BR">\s*<h2>Página não encontrada<\/h2>/)
    assert.deepEqual([...html.matchAll(/<a href="([^"]+)"/g)].map(([, href]) => href), ['/', '/#posts', '/pt/', '/pt/#posts'])
  })
})
