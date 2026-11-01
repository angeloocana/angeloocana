// Publishing what changes on the review pages (/review, /review/cut) without anyone running a command.
// Only the always-on review server (scripts/review-server.sh) does it: it runs with REVIEW_AUTOPUBLISH=1.
// Each change (a clip rejected, starred, re-captioned or re-cut) marks the review as changed; two minutes
// after the last one, the server starts scripts/publish-review.ts, which uploads re-cut clips, commits
// clips.json and media.json to master and pushes (pushes to master deploy the site). Its progress is kept
// in the media folder, so the pages can show it and a restarted server picks up where it left off:
//   work/publish-pending  touched on every change: its time is when the review last changed
//   work/publish.json     the publisher's progress and its last result (PublishState)
//   work/publish.lock     the pid of the publisher while it runs
//   work/publish.log      everything the publisher printed
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, openSync, readFileSync, statSync, writeFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { MEDIA_DIR } from './media-dir.ts'

const WORK = join(MEDIA_DIR, 'work')
export const PENDING = join(WORK, 'publish-pending')
export const STATE = join(WORK, 'publish.json')
export const LOCK = join(WORK, 'publish.lock')
export const LOG = join(WORK, 'publish.log')
export const REPO = fileURLToPath(new URL('../../', import.meta.url))
/** How long after the last change the publish starts, so a few edits in a row go out together. */
export const DELAY_MS = 2 * 60_000

export type PublishState = {
  /** A publish in progress: changes made before startedAt are in it. */
  running?: { pid: number; startedAt: string; step: string }
  /** The last publish that worked. live: Cloudflare deployed it (null: not confirmed); no commit: nothing had changed. */
  done?: { startedAt: string; finishedAt: string; commit?: string; live: boolean | null; summary?: string }
  /** The last publish that didn't, until one works. */
  failed?: { at: string; message: string }
}

/** What the review pages show about publishing (app/ui/public/publish-status.tsx). */
export type PublishInfo = {
  state: 'off' | 'live' | 'waiting' | 'running' | 'failed'
  text: string
  detail?: string
  /** When a waiting publish starts (ms since 1970). */
  dueAt?: number
}

export const autoPublish = () => process.env.REVIEW_AUTOPUBLISH === '1'

export function readState(): PublishState {
  try {
    return JSON.parse(readFileSync(STATE, 'utf8')) as PublishState
  } catch {
    return {}
  }
}

export function writeState(state: PublishState) {
  mkdirSync(WORK, { recursive: true })
  writeFileSync(`${STATE}.tmp`, JSON.stringify(state, null, 1) + '\n')
  renameSync(`${STATE}.tmp`, STATE)
}

/** When the review last changed (ms), or 0. */
export const changedAt = () => (existsSync(PENDING) ? statSync(PENDING).mtimeMs : 0)

export function alive(pid: number | undefined) {
  if (!pid) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

const isRunning = (state: PublishState) => alive(state.running?.pid)
/** Changes up to this time are live (or on their way); later ones are waiting. */
const publishedUpTo = (state: PublishState) => Date.parse(state.done?.startedAt ?? '') || 0

let timer: ReturnType<typeof setTimeout> | undefined
let dueAt = 0

function schedule(ms: number) {
  clearTimeout(timer)
  dueAt = Date.now() + ms
  timer = setTimeout(startPublish, ms)
}

/** Call after a change the live site shows. Publishes it two minutes after the last such change. */
export function reviewChanged() {
  if (!autoPublish()) return
  mkdirSync(WORK, { recursive: true })
  writeFileSync(PENDING, new Date().toISOString() + '\n')
  schedule(DELAY_MS)
}

/** Start publishing now (unless it already is: a running publish goes again for changes made meanwhile). */
export function startPublish() {
  clearTimeout(timer)
  dueAt = 0
  if (!autoPublish() || isRunning(readState())) return
  mkdirSync(WORK, { recursive: true })
  let log = openSync(LOG, 'a')
  // detached: the dev server restarts when the publish brings in new code, and the publish carries on
  spawn(process.execPath, ['--import', 'remix/node-tsx', 'scripts/publish-review.ts'], { cwd: REPO, detached: true, stdio: ['ignore', log, log] }).unref()
}

/** When the server starts: changes that were waiting when it stopped are published as if just made. */
export function resumePublishing() {
  let state = readState()
  let failedAt = Date.parse(state.failed?.at ?? '') || 0
  if (autoPublish() && !isRunning(state) && changedAt() > Math.max(publishedUpTo(state), failedAt)) schedule(DELAY_MS)
}

const clock = (iso: string) => new Date(iso).toLocaleString('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export function publishInfo(): PublishInfo {
  if (!autoPublish()) {
    return {
      state: 'off',
      text: 'Not published from here',
      detail: 'Only the always-on review server (scripts/review-server.sh) publishes. Clips re-cut here go out with its next publish; other changes stay in this checkout.',
    }
  }
  let state = readState()
  if (isRunning(state)) return { state: 'running', text: `${state.running!.step}…`, detail: `Publishing since ${clock(state.running!.startedAt)}` }
  let failedAt = Date.parse(state.failed?.at ?? '') || 0
  if (state.failed && failedAt >= changedAt()) return { state: 'failed', text: 'Not live: publishing failed', detail: state.failed.message }
  if (changedAt() > publishedUpTo(state)) return { state: 'waiting', text: 'Changes not live yet', dueAt: dueAt || undefined }
  let done = state.done
  if (!done) return { state: 'live', text: 'Live: nothing waiting' }
  let when = clock(done.finishedAt)
  if (!done.commit) return { state: 'live', text: 'Live: nothing waiting', detail: `Checked ${when}` }
  return done.live
    ? { state: 'live', text: `Live since ${when}`, detail: `${done.summary ?? 'Published'} (commit ${done.commit.slice(0, 7)})` }
    : { state: 'live', text: `Pushed ${when}`, detail: `Cloudflare's deploy of ${done.commit.slice(0, 7)} wasn't confirmed; it usually takes a minute or two.` }
}
