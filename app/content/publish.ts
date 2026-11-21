// The always-on review server nudges a detached publisher, which owns work/publish.json.
// Both the release progress and the latest review revision survive a server restart.
import childProcess from 'node:child_process'
import { closeSync, mkdirSync, openSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Clip } from './clips.ts'
import { MEDIA_DIR } from './media-dir.ts'
import { writeJsonAtomic } from './review-io.ts'
import { readReviewQueue, type ReviewQueue } from './review-queue.ts'

const WORK = join(MEDIA_DIR, 'work')
export const PENDING = join(WORK, 'publish-pending') // Legacy marker, only read during migration.
export const STATE = join(WORK, 'publish.json')
export const LOG = join(WORK, 'publish.log')
export const REPO = fileURLToPath(new URL('../../', import.meta.url))
const DEBOUNCE_MS = 2 * 60_000
const ACTIVE_CHECK_MS = 3_000

export type Release = {
  revision: string
  sha: string
  desired: Clip[]
  published: Clip[]
  manifest: Record<string, string>
}

export type PublishState = {
  running?: { pid: number; startedAt: string; step: string }
  candidate?: Release
  pushed?: Release & { pushedAt: string; nextCheckAt: number; acknowledged?: boolean }
  live?: { revision: string; sha: string; confirmedAt: string }
  cleanup?: { revision: string; ids: string[]; manifest: Record<string, string>; nextCheckAt?: number }
  failed?: { phase: 'prepare' | 'push' | 'deploy' | 'cleanup'; revision?: string; at: string; message: string }
}

export type PublishInfo = {
  state: 'off' | 'idle' | 'queued' | 'running' | 'pushed' | 'failed' | 'live'
  text: string
  detail?: string
  action?: 'Publish now' | 'Try again' | 'Check again' | 'Recover'
  dueAt?: number
  cleanupWarning?: string
}

type LegacyState = {
  version?: undefined
  running?: PublishState['running']
  done?: { startedAt?: string; commit?: string; live?: boolean | null }
  failed?: { at: string; message: string }
}
type StateRecord = (PublishState & { version: 2 }) | LegacyState

export const autoPublish = () => process.env.REVIEW_AUTOPUBLISH === '1'

function readRecord(): StateRecord {
  let json: string
  try {
    json = readFileSync(STATE, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw error
  }
  let record: StateRecord
  try {
    record = JSON.parse(json)
  } catch {
    // A parser error can echo contents of a private file.
    throw new Error('Invalid publishing progress JSON.')
  }
  if (!record || typeof record !== 'object' || Array.isArray(record) || (record.version !== 2 && record.version !== undefined)) {
    throw new Error('Unrecognized publishing progress format.')
  }
  return record
}

function v2State(record: StateRecord): PublishState {
  if (record.version !== 2) return {}
  let { version, ...state } = record
  return state
}

export function readState(): PublishState {
  return v2State(readRecord())
}

export function writeState(state: PublishState) {
  mkdirSync(WORK, { recursive: true })
  writeJsonAtomic(STATE, { ...state, version: 2 })
}

function readLegacy(record: StateRecord): { pending: boolean; sha?: string; startedAt?: string } {
  let changedAt = 0
  try {
    changedAt = statSync(PENDING).mtimeMs
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  let legacy = record.version === 2 ? undefined : record
  let startedAt = legacy?.done?.startedAt
  return {
    pending: changedAt > (Date.parse(startedAt ?? '') || 0) || Boolean(legacy?.running || legacy?.failed),
    sha: legacy?.done?.live !== true ? legacy?.done?.commit : undefined,
    startedAt,
  }
}

export function legacyProgress() {
  return readLegacy(readRecord())
}

export function needsLegacyRecovery() {
  let { pending, sha } = legacyProgress()
  return Boolean(pending || sha)
}

export function alive(pid: number | undefined) {
  if (pid === undefined || !Number.isInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

function confirmedLive(state: PublishState) {
  let live = state.live
  if (typeof live?.confirmedAt === 'string' && Number.isFinite(Date.parse(live.confirmedAt))) return live
}

function hasFailed(state: PublishState, revision: string, changedAt?: number) {
  let failed = state.failed
  return Boolean(failed && (failed.revision === revision ||
    (failed.revision === undefined && (changedAt === undefined || changedAt <= Date.parse(failed.at)))))
}

type QueuedWork = { kind: 'queue'; revision: string; at: number }
type NextWork = QueuedWork | { kind: 'check' | 'resume' | 'cleanup'; revision: string; at: number }

function queuedWork(state: PublishState, queue: ReviewQueue | undefined): QueuedWork | undefined {
  if (queue && queue.revision !== confirmedLive(state)?.revision &&
      queue.revision !== state.candidate?.revision && queue.revision !== state.pushed?.revision &&
      (state.failed?.phase === 'cleanup' || !hasFailed(state, queue.revision, queue.changedAt))) {
    return { kind: 'queue', revision: queue.revision, at: queue.changedAt + DEBOUNCE_MS }
  }
}

function nextWork(state: PublishState, queued: QueuedWork | undefined): NextWork | undefined {
  // Resolve the last release before starting a new one unless the old release has a terminal failure.
  let { pushed, candidate, cleanup, failed } = state
  if (pushed && (failed?.phase === 'cleanup' || !hasFailed(state, pushed.revision))) {
    return { kind: 'check', revision: pushed.revision, at: pushed.nextCheckAt }
  }
  if (candidate && (failed?.phase === 'cleanup' || !hasFailed(state, candidate.revision))) {
    return { kind: 'resume', revision: candidate.revision, at: 0 }
  }
  if (queued) return queued
  if (cleanup && !failed) {
    return { kind: 'cleanup', revision: cleanup.revision, at: cleanup.nextCheckAt ?? 0 }
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
let child: childProcess.ChildProcess | undefined
let launchFailure: { revision?: string; message: string } | undefined

function currentProgress() {
  let record = readRecord()
  let state = v2State(record)
  let running = record.running
  let queued = queuedWork(state, readReviewQueue(MEDIA_DIR))
  return {
    state,
    running: running && alive(running.pid) ? running : undefined,
    legacy: readLegacy(record),
    queued,
    next: nextWork(state, queued),
  }
}

function wakeIn(ms: number) {
  timer = setTimeout(resumePublishing, ms)
  // The web listener owns the real server lifetime; a poll should not keep it alive.
  timer.unref?.()
}

function launchPublisher(revision: string | undefined, recover = false) {
  let startedAt = Date.now()
  let failedToStart = (error: unknown) => {
    console.error('Could not start the review publisher:', error)
    launchFailure = { revision, message: 'Check the review server log and try again.' }
  }
  try {
    mkdirSync(WORK, { recursive: true })
    let log = openSync(LOG, 'a')
    try {
      // The child can outlive the server. The Python wrapper keeps the kernel publish lock across exec.
      child = childProcess.spawn(process.env.PYTHON ?? 'python3', [
        'scripts/clips/review_io.py', '--publish-lock', MEDIA_DIR,
        process.execPath, '--import', 'remix/node-tsx', 'scripts/publish-review.ts', ...(recover ? ['--recover'] : []),
      ], { cwd: REPO, detached: true, stdio: ['ignore', log, log] })
      child.once('error', (error) => {
        child = undefined
        failedToStart(error)
      })
      child.once('exit', (code) => {
        child = undefined
        if (!code || code === 74 || code === 75) return // Success, interruption (resumable), or another holder has the lock.
        try {
          let { failed } = readState()
          if (failed && Date.parse(failed.at) >= startedAt) return
        } catch {
          // The scheduler will report malformed state separately.
        }
        // The wrapper or migration can fail before the CLI records a durable result.
        console.error(`Review publisher exited unexpectedly (${code}); see ${LOG}`)
        launchFailure = { revision, message: 'The publisher stopped before recording its result. Check the publish log and try again.' }
      })
      child.unref()
      wakeIn(ACTIVE_CHECK_MS)
    } finally {
      closeSync(log)
    }
  } catch (error) {
    failedToStart(error)
  }
}

function advance(manual: boolean) {
  clearTimeout(timer)
  if (!autoPublish()) return
  try {
    let { state, running, legacy, next } = currentProgress()
    if (child || running) return wakeIn(ACTIVE_CHECK_MS)
    let recover = Boolean(legacy.pending || legacy.sha)
    if (recover && !manual) return wakeIn(30_000)
    if (manual) {
      if (!next && !state.failed && !legacy.pending && !legacy.sha) return
      launchFailure = undefined
    } else {
      if (!next) return wakeIn(30_000) // An explicitly auto-publishing CLI may queue a cut too.
      if (launchFailure && launchFailure.revision === next.revision) return wakeIn(30_000)
      let wait = next.at - Date.now()
      if (wait > 0) return wakeIn(Math.min(wait, 2 ** 31 - 1))
    }
    launchPublisher(next?.revision ?? state.failed?.revision, recover)
  } catch (error) {
    console.error('Could not read review publishing progress:', error)
  }
}

/** Manual retry/check (or start now instead of waiting for the debounce). */
export function startPublish() {
  advance(true)
}

/** Re-read the durable queue and progress on startup and after every wake. */
export function resumePublishing() {
  advance(false)
}

/** The review writer has already recorded a new revision under the review lock. */
export function reviewChanged() {
  resumePublishing()
}

const clock = (iso: string) => new Date(iso).toLocaleString('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const failureTitle = { prepare: 'Could not prepare the publish', push: 'Could not push the changes', deploy: 'Deploy was not confirmed' }

export function publishInfo(): PublishInfo {
  if (!autoPublish()) {
    return {
      state: 'off',
      text: 'Not published from here',
      detail: 'Only the always-on review server (scripts/review-server.sh) publishes.',
    }
  }
  try {
    let { state, running, legacy, queued, next } = currentProgress()
    let failed = state.failed
    let cleanup = failed?.phase === 'cleanup' ? failed.message : undefined
    let warning = cleanup ? { cleanupWarning: cleanup } : {}
    if (running) return { ...warning, state: 'running', text: `${running.step}…`, detail: `Publishing since ${clock(running.startedAt)}` }
    if (child) return { ...warning, state: 'running', text: 'Starting publisher…' }
    if (launchFailure && launchFailure.revision === (next?.revision ?? failed?.revision)) {
      return { ...warning, state: 'failed', text: 'Publisher failed to run', detail: launchFailure.message, action: 'Try again' }
    }
    let earlierPush = legacy.sha && `Deploy of ${legacy.sha.slice(0, 7)} was not confirmed.`
    if (legacy.pending) {
      return { ...warning, state: 'failed', text: 'Earlier review changes need recovery', detail: earlierPush || 'Publishing did not finish with the old review server.', action: 'Recover' }
    }
    if (earlierPush) {
      return { ...warning, state: 'pushed', text: 'Earlier push not confirmed', detail: earlierPush, action: 'Recover' }
    }
    if (next?.kind === 'check' && state.pushed) {
      return { ...warning, state: 'pushed', text: 'Pushed · checking deploy', detail: `Awaiting confirmation for ${state.pushed.sha.slice(0, 7)}.`, action: 'Check again' }
    }
    if (next?.kind === 'resume' || queued) {
      return { ...warning, state: 'queued', text: 'Changes queued to publish', dueAt: next?.kind === 'resume' ? undefined : queued?.at, action: 'Publish now' }
    }
    if (failed && failed.phase !== 'cleanup') {
      return { state: 'failed', text: failureTitle[failed.phase], detail: failed.message, action: 'Try again' }
    }
    let action = cleanup ? 'Try again' as const : undefined
    let live = confirmedLive(state)
    if (live) {
      return { ...warning, state: 'live', text: `Live since ${clock(live.confirmedAt)}`, detail: `Deploy confirmed for ${live.sha.slice(0, 7)}.`, action }
    }
    return { ...warning, state: 'idle', text: 'No changes waiting', action }
  } catch {
    return { state: 'failed', text: 'Could not read publishing progress', detail: 'Check the review queue and publishing state on the review server.' }
  }
}
