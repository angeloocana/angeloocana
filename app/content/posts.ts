// Blog posts: Markdown files in content/posts, kept exactly as they were published on the old site
// (English and Portuguese; French was dropped). Each post keeps its old URL:
//   content/posts/blog/git/git-setup.en.md   → /en/blog/git/git-setup/
//   content/posts/blog/git/git-setup.pt.md   → /pt/blog/git/git-setup/
//   content/posts/Tutoriais/Parte1.md        → /Tutoriais/Parte1/   (Portuguese video tutorials)
// To publish a new post, add a file the same way: front matter (title, date, tags) then Markdown.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { marked } from 'marked'

import type { Lang } from '../copy.ts'

export type Post = {
  /** The same for every language version of a post, e.g. "blog/git/git-setup". */
  key: string
  lang: Lang
  url: string
  title: string
  date: string
  tags: string[]
  youtubeId?: string
  excerpt: string
  minutes: number
  html: string
}

const ROOT = 'content/posts'

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    let path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : name.endsWith('.md') ? [path] : []
  })
}

/** A tiny front-matter reader for the fields the old posts use. */
function frontMatter(text: string) {
  let match = text.match(/^---\n([\s\S]*?)\n---\n?/)
  let head = match?.[1] ?? ''
  let field = (name: string) => head.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'))?.[1].trim().replace(/^['"]|['"]$/g, '') ?? ''
  let tagBlock = head.match(/^tags:\s*\n((?:\s+-\s*.*\n?)+)/m)?.[1] ?? ''
  let tags = tagBlock.split('\n').map((line) => line.replace(/^\s*-\s*/, '').trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
  return { title: field('title'), date: field('date').slice(0, 10), youtubeId: field('youtubeId') || undefined, tags, body: match ? text.slice(match[0].length) : text }
}

function plain(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^ {4}.*$/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function load(): Post[] {
  return files(ROOT).map((file) => {
    let rel = relative(ROOT, file).replace(/\\/g, '/')
    let lang: Lang = /\.en\.md$/.test(rel) ? 'en' : 'pt'
    let key = rel.replace(/\.(en|pt)?\.?md$/, '').replace(/\.$/, '')
    let url = rel.startsWith('Tutoriais/') ? `/${key}/` : `/${lang}/${key}/`
    let { body, date, tags, title, youtubeId } = frontMatter(readFileSync(file, 'utf8').replace(/\r\n?/g, '\n'))
    let text = plain(body)
    let words = text.split(' ').length
    return {
      key,
      lang,
      url,
      title,
      date,
      tags,
      youtubeId,
      excerpt: text.length > 170 ? `${text.slice(0, 170).replace(/\s+\S*$/, '')}…` : text,
      minutes: Math.max(1, Math.round(words / 220)),
      html: marked.parse(body, { async: false }) as string,
    }
  })
}

// Posts are read once per server start; `npm run dev` restarts when they change.
let cache: Post[] | null = null
export function allPosts(): Post[] {
  cache ??= load().sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))
  return cache
}

/** One card per post for a page in `lang`: its own version when there is one, else the other. */
export function postsFor(lang: Lang): Post[] {
  let byKey = new Map<string, Post>()
  for (let post of allPosts()) {
    let current = byKey.get(post.key)
    if (!current || (post.lang === lang && current.lang !== lang)) byKey.set(post.key, post)
  }
  return [...byKey.values()].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))
}

export function postAt(url: string): Post | undefined {
  let normal = url.endsWith('/') ? url : `${url}/`
  return allPosts().find((post) => post.url.toLowerCase() === normal.toLowerCase())
}

/** The same post in the other language, if it was written in both. */
export function translationOf(post: Post): Post | undefined {
  return allPosts().find((other) => other.key === post.key && other.lang !== post.lang)
}
