import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
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
    // Nested misses under the blog/tutorial wildcards receive their CSP, which blocks inline styles.
    assert.doesNotMatch(html, /<style\b|<[a-z][^>]*\sstyle\s*=/i)
    assert.match(html, /<link rel="stylesheet" href="\/404\.css">/)
    assert.match(await readFile(new URL('404.css', DIST), 'utf8'), /\.languages \{ display: grid;/)
    assert.deepEqual([...html.matchAll(/<a href="([^"]+)"/g)].map(([, href]) => href), ['/', '/#posts', '/pt/', '/pt/#posts'])
  })
})

describe('static build CSP', () => {
  it('enforces one scoped policy with exactly the executable inline script hashes from the emitted HTML', async () => {
    let headers = await readFile(new URL('_headers', DIST), 'utf8')
    assert.doesNotMatch(headers, /Content-Security-Policy-Report-Only:|\breport-(?:uri|to)\b/i)
    assert.ok(headers.split('\n').every((line) => Buffer.byteLength(line) <= 2000))
    let rules = headers.trimEnd().split(/\n(?=\S)/).flatMap((block) => {
      let [pattern, ...lines] = block.split('\n')
      return lines.flatMap((line) => {
        let policy = line.match(/^\s*Content-Security-Policy:\s*(.+)$/i)?.[1]
        return policy ? [{ pattern, policy }] : []
      })
    })
    let homes = ['/', '/pt/', '/offline-plugin-app-shell-fallback/']
    let posts = ['/en/blog/', '/pt/blog/', '/Tutoriais/']
    assert.deepEqual(rules.map(({ pattern }) => pattern).sort(), [...homes, ...posts.map((prefix) => `${prefix}*`)].sort())

    let files = await readdir(DIST, { recursive: true, withFileTypes: true })
    let checked = new Set<string>()
    for (let file of files) {
      if (!file.isFile()) continue
      let local = join(file.parentPath, file.name)
      let path = `/${relative(fileURLToPath(DIST), local).split(sep).join('/')}`.replace(/\/index\.html$/, '/')
      checked.add(path)
      let matches = rules.filter(({ pattern }) => pattern.endsWith('*') ? path.startsWith(pattern.slice(0, -1)) : path === pattern)
      let home = homes.includes(path)
      let post = file.name === 'index.html' && posts.some((prefix) => path.startsWith(prefix))
      assert.equal(matches.length, home || post ? 1 : 0, path)
      if (!home && !post) continue

      let { policy } = matches[0]
      assert.doesNotMatch(policy, /'unsafe-|blob:|wasm/i, path)
      let directives = new Map(policy.split('; ').map((directive) => {
        let [name, ...values] = directive.split(' ')
        return [name, values]
      }))
      assert.deepEqual(directives.get('style-src'), ["'self'"], path)
      assert.deepEqual(directives.get('connect-src'), ["'self'", 'https://cloudflareinsights.com'], path)
      assert.deepEqual(directives.get('img-src'), ["'self'", 'data:', 'https://img.youtube.com', 'https://angeloocana.com/imgs/'], path)
      assert.deepEqual(directives.get('frame-src'), ['https://www.youtube-nocookie.com'], path)
      let html = await readFile(local, 'utf8')
      assert.doesNotMatch(html, /<style\b|<[a-z][^>]*\sstyle\s*=/i, path)
      let scripts = [...html.matchAll(/<script\b([^>]*)>([^]*?)<\/script\s*>/gi)]
      let inline = scripts.filter(([, attrs]) => !/\ssrc\s*=/i.test(attrs) && !/\stype="application\/json"/i.test(attrs))
      if (home) {
        assert.ok(inline.some(([, attrs]) => /\stype="importmap"/.test(attrs)), path)
        assert.ok(inline.some(([, attrs]) => attrs === '' || attrs === ' type="module"'), path)
      } else {
        assert.equal(inline.length, 0, path)
      }
      let hashes = new Set(inline.map(([, , body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`))
      assert.deepEqual(directives.get('script-src')?.slice().sort(), ["'self'", 'https://static.cloudflareinsights.com', ...hashes].sort(), path)
    }
    for (let path of [...homes, '/redux-saga-presentation.html', '/data/clips.json']) assert.ok(checked.has(path), path)
    for (let prefix of posts) assert.ok([...checked].some((path) => path.startsWith(prefix)), prefix)
  })
})
