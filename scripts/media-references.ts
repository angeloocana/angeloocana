// Checks every /media/ URL in the emitted dist/ files against app/content/media.json. Media is cached for a
// week (worker.ts), so a URL without its file's current ?v= hash keeps returning visitors on the old file:
// screenshots stayed stale that way until they were versioned (cfa6b21), as scripts did before them (8c54d20).

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

// A /media/ URL as a page, a script or JSON writes it, with or without an origin; not `rails/media.ts`.
const MEDIA_REFERENCE = /(?<![\w./-])(?:(?:https?:)?\/\/[^/"'`\s<>]+)?\/media\/[^"'`\s)<>]*/g
const SITE = 'https://angeloocana.com'
const SITE_HOSTS = ['angeloocana.com', 'www.angeloocana.com']
const TEXT_FILE = /\.(?:html|js|json|css|xml|svg|txt)$|(?:^|\/)_(?:headers|redirects)$/

export type EmittedFile = { file: string; text: string }

/** Every text file in the built site, copied from public/ or rendered. */
export async function readEmittedText(dir: string): Promise<EmittedFile[]> {
  let files = await readdir(dir, { recursive: true, withFileTypes: true })
  let text = files.filter((entry) => entry.isFile() && TEXT_FILE.test(entry.name)).map((entry) => join(entry.parentPath, entry.name))
  return Promise.all(text.sort().map(async (file) => ({ file, text: await readFile(file, 'utf8') })))
}

export function staleMediaReferences(files: EmittedFile[], versions: Record<string, string>) {
  let problems: string[] = []
  for (let { file, text } of files) {
    for (let [reference] of text.matchAll(MEDIA_REFERENCE)) {
      let url = new URL(reference.replaceAll('&amp;', '&'), SITE)
      if (!SITE_HOSTS.includes(url.hostname)) continue
      let key = url.pathname.slice('/media/'.length)
      let expected = versions[key]
      let found = url.searchParams.getAll('v')
      if (expected && found.length === 1 && found[0] === expected) continue
      let why = !expected ? `${key} isn't in app/content/media.json` : found.length ? `its ?v= isn't ${expected}` : 'it has no ?v='
      problems.push(`${file}: ${reference} (${why})`)
    }
  }
  return problems
}

export function assertMediaReferences(files: EmittedFile[], versions: Record<string, string>) {
  let problems = staleMediaReferences(files, versions)
  if (!problems.length) return
  throw new Error(
    `${problems.length} /media/ reference(s) bypass the media.json version, so returning visitors would keep a cached old file:\n` +
      problems.map((problem) => `  ${problem}`).join('\n') +
      '\nWrite every media URL with mediaUrl() or clipUrl() from app/content/clips.ts; for a new file, run `npm run media:push` and commit both manifests.',
  )
}
