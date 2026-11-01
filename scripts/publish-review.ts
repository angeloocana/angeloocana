// Puts what changed on the review pages on the live site:
//   1. brings this checkout's master up to date with GitHub,
//   2. uploads re-cut clips to R2 and updates app/content/media.json (scripts/media-push.ts),
//   3. commits app/content/clips.json and media.json, and pushes them to master,
//   4. waits for Cloudflare's build of that commit (every push to master deploys the site).
// The always-on review server starts it two minutes after the last change (app/content/publish.ts).
// By hand, from a checkout on master:
//
//   node --import remix/node-tsx scripts/publish-review.ts            # publish now
//   node --import remix/node-tsx scripts/publish-review.ts --dry-run  # only show what would go
//
// It commits nothing but those two files, and stops if anything else in the checkout has changed.
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

import { alive, changedAt, LOCK, readState, REPO, writeState, type PublishState } from '../app/content/publish.ts'

const CLIPS = 'app/content/clips.json'
const MEDIA = 'app/content/media.json'
const FILES = [CLIPS, MEDIA]
const DEPLOY_CHECK = 'Workers Builds'
const dryRun = process.argv.includes('--dry-run')

const time = () => new Date().toLocaleTimeString('en', { hour12: false })
const log = (text: string) => console.log(`[${time()}] ${text}`)

function git(...args: string[]) {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

/** Run a command with its output in the log; throw with the end of its output if it fails. */
function run(command: string, args: string[]) {
  let result = spawnSync(command, args, { cwd: REPO, encoding: 'utf8' })
  let output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
  if (output) console.log(output)
  if (result.status !== 0) throw new Error(`${[command, ...args].join(' ')} failed:\n${(output || String(result.error)).split('\n').slice(-8).join('\n')}`)
  return output
}

const count = (range: string) => Number(git('rev-list', '--count', range))
/** Tracked files with changes not committed yet. */
const dirty = () => git('status', '--porcelain', '--untracked-files=no').split('\n').filter(Boolean).map((line) => line.slice(3))

let state: PublishState = readState()
/** New code came in from master: the review server should restart to run it (it doesn't watch files). */
let newCode = false
function step(text: string) {
  log(text)
  if (dryRun || !state.running) return
  state.running.step = text
  writeState(state)
}

/** A commit message that says which clips changed, from the two files against HEAD. */
function summary() {
  let before = <T>(file: string, empty: T): T => {
    try {
      return JSON.parse(git('show', `HEAD:${file}`)) as T
    } catch {
      return empty
    }
  }
  let now = <T>(file: string): T => JSON.parse(readFileSync(`${REPO}${file}`, 'utf8')) as T
  type Clip = { id: string; rejected?: boolean }
  let oldClips = new Map(before<Clip[]>(CLIPS, []).map((clip) => [clip.id, clip]))
  let newClips = now<Clip[]>(CLIPS)
  let oldMedia = before<Record<string, string>>(MEDIA, {})
  let newMedia = now<Record<string, string>>(MEDIA)
  let clipOf = (key: string) => key.match(/^clips\/(.+)\.mp4$/)?.[1]
  let recut = Object.keys(newMedia).filter((key) => oldMedia[key] && oldMedia[key] !== newMedia[key]).map(clipOf).filter(Boolean)
  let rejected = newClips.filter((clip) => clip.rejected && oldClips.get(clip.id) && !oldClips.get(clip.id)!.rejected).map((clip) => clip.id)
  let restored = newClips.filter((clip) => !clip.rejected && oldClips.get(clip.id)?.rejected).map((clip) => clip.id)
  let edited = newClips
    .filter((clip) => oldClips.has(clip.id) && JSON.stringify(oldClips.get(clip.id)) !== JSON.stringify(clip))
    .map((clip) => clip.id)
    .filter((id) => !rejected.includes(id) && !restored.includes(id))
  let list = (label: string, ids: (string | undefined)[]) =>
    ids.length ? `${label} ${ids.length} (${ids.slice(0, 6).join(', ')}${ids.length > 6 ? ', …' : ''})` : ''
  let parts = [list('re-cut', recut), list('rejected', rejected), list('restored', restored), list('updated', edited)].filter(Boolean)
  return parts.length ? `Clip review: ${parts.join('; ')}` : 'Clip review: update media versions'
}

function commit() {
  let changed = dirty().filter((file) => FILES.includes(file))
  if (!changed.length) return false
  let message = summary()
  git('commit', '--quiet', '-m', message, '-m', 'Published by the review server (scripts/publish-review.ts).', '--', ...changed)
  log(`Committed: ${message}`)
  return true
}

/** Bring master up to date with GitHub, keeping the review's changes on top. */
function catchUp() {
  git('fetch', '--quiet', 'origin', 'master')
  if (count('HEAD..origin/master') === 0) return
  let before = git('rev-parse', 'HEAD')
  if (count('origin/master..HEAD') === 0) {
    // only uncommitted changes to the two files: they come along, unless master changed them too
    try {
      git('merge', '--quiet', '--ff-only', 'origin/master')
    } catch {
      throw new Error(`Master on GitHub changed ${FILES.join(' or ')} too, so it can't be brought in under the review's changes. Ask Claude to merge them.`)
    }
  } else {
    commit()
    try {
      git('rebase', '--quiet', 'origin/master')
    } catch {
      git('rebase', '--abort')
      throw new Error(`The review's changes conflict with master on GitHub (${FILES.join(', ')}). Ask Claude to merge them.`)
    }
  }
  let changed = git('diff', '--name-only', before, 'HEAD').split('\n')
  if (changed.some((file) => file && !FILES.includes(file))) newCode = true
  if (changed.includes('package-lock.json')) {
    step('Installing updated packages')
    run('npm', ['ci', '--no-audit', '--no-fund'])
  }
}

/** Wait for Cloudflare's build of the commit: true when it deployed, null if that can't be told. */
async function deployed(sha: string): Promise<boolean | null> {
  let repo = git('remote', 'get-url', 'origin').match(/github\.com[:/](.+?)(?:\.git)?$/)?.[1]
  if (!repo) return null
  let deadline = Date.now() + 15 * 60_000
  while (Date.now() < deadline) {
    await sleep(15_000)
    let result = spawnSync('gh', ['api', `repos/${repo}/commits/${sha}/check-runs`, '--jq', `.check_runs[] | select(.name | startswith("${DEPLOY_CHECK}")) | [.status, .conclusion // "", .details_url] | @tsv`], { encoding: 'utf8' })
    if (result.error) return null // no gh here
    let [status, conclusion, url] = (result.stdout ?? '').trim().split('\t')
    if (status !== 'completed') continue
    if (conclusion === 'success') return true
    // a newer push replaces this build; that one deploys these changes too
    if (conclusion === 'cancelled' || conclusion === 'skipped') return null
    throw new Error(`Cloudflare's build of ${sha.slice(0, 7)} failed (${conclusion}): ${url}`)
  }
  return null
}

async function publish(): Promise<NonNullable<PublishState['done']>> {
  let startedAt = state.running?.startedAt ?? new Date().toISOString()
  step('Checking the checkout')
  let branch = git('rev-parse', '--abbrev-ref', 'HEAD')
  if (branch !== 'master') throw new Error(`${REPO} is on ${branch}, not master. The review server publishes from master: switch it back (or ask Claude).`)
  let others = dirty().filter((file) => !FILES.includes(file))
  if (others.length) throw new Error(`Other files have changed in ${REPO} (${others.slice(0, 4).join(', ')}). Commit or undo them first (or ask Claude).`)
  let strays = git('diff', '--name-only', 'origin/master...HEAD').split('\n').filter((file) => file && !FILES.includes(file))
  if (count('origin/master..HEAD') && strays.length) throw new Error(`master in ${REPO} has commits that aren't on GitHub (${strays.slice(0, 4).join(', ')}). Push or drop them first (or ask Claude).`)

  step('Catching up with master')
  if (dryRun) {
    git('fetch', '--quiet', 'origin', 'master')
    log(`Would bring in ${count('HEAD..origin/master')} new commits from master first.`)
  } else catchUp()

  step('Uploading re-cut clips')
  run(process.execPath, ['--import', 'remix/node-tsx', 'scripts/media-push.ts', ...(dryRun ? ['--dry-run'] : [])])
  if (dryRun) {
    log(`Would commit: ${dirty().filter((file) => FILES.includes(file)).join(', ') || 'nothing'}`)
    return { startedAt, finishedAt: new Date().toISOString(), live: null }
  }

  commit()
  if (count('origin/master..HEAD') === 0) {
    log('Nothing to publish: the live site already has every change.')
    return { startedAt, finishedAt: new Date().toISOString(), live: true }
  }
  let message = git('log', '-1', '--format=%s')
  step('Pushing to master')
  try {
    git('push', '--quiet', 'origin', 'HEAD:master')
  } catch {
    // someone pushed meanwhile: catch up once more, then push again
    catchUp()
    git('push', '--quiet', 'origin', 'HEAD:master')
  }
  let commitSha = git('rev-parse', 'HEAD')
  step('Cloudflare is deploying the site')
  let live = await deployed(commitSha)
  log(live ? `Live: ${commitSha.slice(0, 7)} is deployed.` : `Pushed ${commitSha.slice(0, 7)}; the deploy wasn't confirmed.`)
  return { startedAt, finishedAt: new Date().toISOString(), commit: commitSha, live, summary: message }
}

function takeLock(): boolean {
  mkdirSync(dirname(LOCK), { recursive: true })
  try {
    writeFileSync(LOCK, String(process.pid), { flag: 'wx' })
    return true
  } catch {
    if (alive(Number(readFileSync(LOCK, 'utf8')))) return false
    unlinkSync(LOCK)
    return takeLock()
  }
}

if (!takeLock()) {
  log('Another publish is running; it will include these changes.')
  process.exit(0)
}
try {
  // changes made while publishing go out in another round straight after
  for (let round = 0; round < 5; round++) {
    let startedAt = new Date().toISOString()
    state = readState()
    if (!dryRun) {
      state.running = { pid: process.pid, startedAt, step: 'Starting' }
      writeState(state)
    }
    try {
      let done = await publish()
      if (dryRun) break
      state.done = done
      delete state.failed
    } catch (error) {
      let message = error instanceof Error ? error.message : String(error)
      log(`Failed: ${message}`)
      if (dryRun) break
      state.failed = { at: new Date().toISOString(), message }
      break
    } finally {
      if (!dryRun) {
        delete state.running
        writeState(state)
      }
    }
    if (changedAt() <= Date.parse(startedAt)) break
  }
} finally {
  unlinkSync(LOCK)
}
// last, as it stops the server that started this
let job = process.env.REVIEW_SERVER_JOB
if (newCode && job && !dryRun) {
  log('Restarting the review server to run the new code from master.')
  spawnSync('launchctl', ['kickstart', '-k', job])
}
