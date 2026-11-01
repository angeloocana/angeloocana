// Uploads the site's media to the R2 bucket that serves /media (worker.ts), and writes
// app/content/media.json: each file's content hash, which becomes its ?v= on the page and lets the
// next run skip what hasn't changed. Run it after cutting clips, then commit media.json:
//
//   npm run media:push
//
// Only what the site shows goes up: the screenshots and every clip that isn't rejected. Rejected
// clips never leave this machine, and one that went up before is taken down again. The media folder
// itself (app/content/media-dir.ts) is only read, never changed.
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

import { loadClips } from '../app/content/clips.ts'
import { MEDIA_DIR } from '../app/content/media-dir.ts'

const BUCKET = 'angeloocana-media'
const MANIFEST = 'app/content/media.json'
const WRANGLER = ['-y', 'wrangler@4.151.1']
const TYPES: Record<string, string> = { mp4: 'video/mp4', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', png: 'image/png' }

const root = join(MEDIA_DIR, 'media')
if (!existsSync(root)) throw new Error(`No media folder at ${root}. Set ANGELOOCANA_MEDIA if it lives elsewhere.`)

const live = new Set(loadClips().filter((clip) => !clip.rejected).map((clip) => clip.id))
const wanted = (key: string) => {
  let clip = key.match(/^clips\/([^/]+)\.(mp4|jpg)$/)
  return clip ? live.has(clip[1]) : !key.startsWith('clips/')
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.name.startsWith('.') ? [] : entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  )
}

let before: Record<string, string> = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}
let after: Record<string, string> = {}
let uploads: { key: string; file: string }[] = []
for (let file of walk(root)) {
  let key = relative(root, file).split(sep).join('/')
  let ext = key.split('.').pop()!.toLowerCase()
  if (!TYPES[ext] || !wanted(key)) continue
  after[key] = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10)
  if (before[key] !== after[key]) uploads.push({ key, file })
}
let removals = Object.keys(before).filter((key) => !(key in after))

let missing = [...live].flatMap((id) => [`clips/${id}.mp4`, `clips/${id}.jpg`]).filter((key) => !(key in after))
if (missing.length) throw new Error(`Missing ${missing.length} live clip files in ${root} (${missing.slice(0, 3).join(', ')}…). Cut them first.`)

function wrangler(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    let child = spawn('npx', [...WRANGLER, ...args], { stdio: ['ignore', 'ignore', 'pipe'] })
    let errors = ''
    child.stderr.on('data', (chunk) => (errors += chunk))
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`wrangler ${args.slice(0, 4).join(' ')} failed:\n${errors}`))))
  })
}

/** Run the jobs a few at a time; each wrangler call is a few seconds of mostly waiting. */
async function inBatches<T>(items: T[], run: (item: T) => Promise<void>, size = 6) {
  let next = 0
  let done = 0
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        await run(items[next++])
        done += 1
        if (done % 20 === 0 || done === items.length) console.log(`  ${done} of ${items.length}`)
      }
    }),
  )
}

console.log(`${Object.keys(after).length} files for the site: ${uploads.length} to upload, ${removals.length} to take down.`)
// --dry-run: list what would change, and touch nothing
if (process.argv.includes('--dry-run')) {
  for (let { key } of uploads) console.log(`  up    ${key}`)
  for (let key of removals) console.log(`  down  ${key}`)
  process.exit(0)
}
await inBatches(uploads, ({ key, file }) =>
  wrangler(['r2', 'object', 'put', `${BUCKET}/${key}`, '--file', file, '--content-type', TYPES[key.split('.').pop()!.toLowerCase()], '--remote']),
)
await inBatches(removals, (key) => wrangler(['r2', 'object', 'delete', `${BUCKET}/${key}`, '--remote']))

let sorted = Object.fromEntries(Object.entries(after).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`)
console.log(`Wrote ${MANIFEST}. Commit it so the build and the site use the new versions.`)
