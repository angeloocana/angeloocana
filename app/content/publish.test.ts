import childProcess from 'node:child_process'
import { EventEmitter } from 'node:events'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as assert from 'remix/assert'
import { afterAll, beforeAll, beforeEach, it, type TestContext } from 'remix/test'

import type { Release } from './publish.ts'
import { queueReviewRevision } from './review-queue.ts'

const initial = Date.parse('2026-01-01T12:00:00Z')
const sha = 'abcdef1234567890'
let root: string
let publish: typeof import('./publish.ts')
const env = { media: process.env.ANGELOOCANA_MEDIA, auto: process.env.REVIEW_AUTOPUBLISH }

beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), 'review-publish-'))
  process.env.ANGELOOCANA_MEDIA = root
  publish = await import('./publish.ts')
  assert.equal(publish.STATE, join(root, 'work', 'publish.json'))
})

beforeEach(() => {
  rmSync(join(root, 'work'), { recursive: true, force: true })
  mkdirSync(join(root, 'work'))
  process.env.REVIEW_AUTOPUBLISH = '1'
})

afterAll(() => {
  if (env.media === undefined) delete process.env.ANGELOOCANA_MEDIA
  else process.env.ANGELOOCANA_MEDIA = env.media
  if (env.auto === undefined) delete process.env.REVIEW_AUTOPUBLISH
  else process.env.REVIEW_AUTOPUBLISH = env.auto
  rmSync(root, { recursive: true, force: true })
})

function clockAndPublisher(t: TestContext) {
  let now = initial
  let timers = t.useFakeTimers()
  t.mock.method(Date, 'now', () => now)
  let child: EventEmitter | undefined
  let spawn = t.mock.method(childProcess, 'spawn', () => (child = Object.assign(new EventEmitter(), { unref() {} })))
  return {
    spawn,
    advance(ms: number) {
      now += ms
      timers.advance(ms)
    },
    exit(code = 0) { child?.emit('exit', code) },
  }
}

const release = (revision: string): Release => ({ revision, sha, desired: [], published: [], manifest: {} })

it('distinguishes off, idle, queued, pushed, failed, and confirmed live with a separate cleanup warning', (t) => {
  clockAndPublisher(t)
  process.env.REVIEW_AUTOPUBLISH = '0'
  assert.equal(publish.publishInfo().state, 'off')
  process.env.REVIEW_AUTOPUBLISH = '1'
  assert.equal(publish.publishInfo().state, 'idle')

  let { revision } = queueReviewRevision(root, [])
  assert.equal(publish.publishInfo().state, 'queued')
  assert.equal(publish.publishInfo().dueAt, initial + 120_000)
  assert.equal(publish.publishInfo().action, 'Publish now')

  let pushed = { ...release(revision), pushedAt: new Date(initial).toISOString(), nextCheckAt: initial + 15_000 }
  publish.writeState({ pushed })
  assert.equal(publish.publishInfo().state, 'pushed')
  assert.equal(publish.publishInfo().action, 'Check again')
  assert.deepEqual(publish.readState(), { pushed })
  assert.equal(JSON.parse(readFileSync(publish.STATE, 'utf8')).version, 2)

  publish.writeState({ pushed, failed: { phase: 'deploy', revision, at: pushed.pushedAt, message: 'Synthetic check failed' } })
  assert.equal(publish.publishInfo().state, 'failed')
  assert.equal(publish.publishInfo().detail, 'Synthetic check failed')
  assert.equal(publish.publishInfo().action, 'Try again')

  // A timestamp must exist and parse; a pushed commit alone is not a live confirmation.
  publish.writeState({ live: { revision, sha, confirmedAt: '' } })
  assert.equal(publish.publishInfo().state, 'queued')
  publish.writeState({ live: { revision, sha, confirmedAt: pushed.pushedAt } })
  assert.equal(publish.publishInfo().state, 'live')
  assert.equal(publish.publishInfo().action, undefined)
  publish.writeState({
    live: { revision, sha, confirmedAt: pushed.pushedAt },
    cleanup: { revision, ids: ['h-synthetic'], manifest: {} },
    failed: { phase: 'cleanup', revision, at: pushed.pushedAt, message: 'Synthetic cleanup failed' },
  })
  assert.equal(publish.publishInfo().state, 'live')
  assert.equal(publish.publishInfo().cleanupWarning, 'Synthetic cleanup failed')
  assert.equal(publish.publishInfo().action, 'Try again')

  // Pending cleanup for the old release must not hide an unpublished new revision.
  let { failed: _failed, ...justCleanup } = publish.readState()
  publish.writeState(justCleanup)
  queueReviewRevision(root, [])
  assert.equal(publish.publishInfo().state, 'queued')
})

it('signals unfinished legacy work without making it live or scheduling it automatically', (t) => {
  let { spawn, advance, exit } = clockAndPublisher(t)
  let startedAt = new Date(initial).toISOString()
  writeFileSync(publish.STATE, JSON.stringify({ done: { startedAt, commit: sha, live: null } }))
  assert.deepEqual(publish.readState(), {})
  assert.deepEqual(publish.legacyProgress(), { startedAt, sha, pending: false })
  assert.equal(publish.publishInfo().state, 'pushed')
  assert.equal(publish.publishInfo().action, 'Recover')
  writeFileSync(publish.PENDING, 'legacy marker\n')
  let later = new Date(initial + 1_000)
  utimesSync(publish.PENDING, later, later)
  assert.equal(publish.legacyProgress().pending, true)
  assert.equal(publish.publishInfo().state, 'failed')
  assert.match(publish.publishInfo().detail ?? '', /abcdef1/)
  publish.resumePublishing()
  advance(120_000)
  assert.equal(spawn.mock.calls.length, 0)
  publish.startPublish()
  assert.equal(spawn.mock.calls.length, 1)
  exit()
})

it('resumes the remainder of a debounced revision and rechecks an active publisher after restart', (t) => {
  let { spawn, advance, exit } = clockAndPublisher(t)
  let { revision } = queueReviewRevision(root, [])
  advance(40_000)
  publish.resumePublishing()
  advance(79_999)
  assert.equal(spawn.mock.calls.length, 0)
  advance(1)
  assert.equal(spawn.mock.calls.length, 1)
  assert.deepEqual(spawn.mock.calls[0].arguments.slice(0, 2), [
    process.env.PYTHON ?? 'python3', [
      'scripts/clips/review_io.py', '--publish-lock', root,
      process.execPath, '--import', 'remix/node-tsx', 'scripts/publish-review.ts',
    ],
  ])
  assert.equal(publish.publishInfo().state, 'running')
  exit()

  // A restarted server may instead inherit an active process with no local child handle.
  publish.writeState({ running: { pid: process.pid, startedAt: new Date(initial).toISOString(), step: 'Uploading clips' } })
  publish.resumePublishing()
  advance(3_000)
  assert.equal(publish.publishInfo().text, 'Uploading clips…')
  publish.startPublish()
  assert.equal(spawn.mock.calls.length, 1)
  publish.writeState({ candidate: release(revision) }) // Its exit left a candidate to reconcile.
  advance(3_000)
  assert.equal(spawn.mock.calls.length, 2)
  exit()
})

it('rechecks pushed work when due, stops on a terminal result, and queues later changes', (t) => {
  let { spawn, advance, exit } = clockAndPublisher(t)
  let { revision } = queueReviewRevision(root, [])
  let pushedAt = new Date(initial).toISOString()
  let pushed = { ...release(revision), pushedAt, nextCheckAt: initial + 200_000 }
  publish.writeState({ pushed })
  publish.resumePublishing()
  let newer = queueReviewRevision(root, [])
  publish.reviewChanged()
  advance(199_999) // The newer queue is due, but the pushed revision is not.
  assert.equal(spawn.mock.calls.length, 0)
  assert.equal(publish.publishInfo().state, 'pushed')
  advance(1)
  assert.equal(spawn.mock.calls.length, 1)
  publish.writeState({ pushed: { ...pushed, nextCheckAt: initial + 215_000 } })
  exit()
  advance(3_000)
  advance(11_999)
  assert.equal(spawn.mock.calls.length, 1)
  advance(1)
  assert.equal(spawn.mock.calls.length, 2)

  // A terminal failure on the latest revision never loops, but can still be retried manually.
  let failed = { phase: 'deploy' as const, revision: newer.revision, at: pushedAt, message: 'Synthetic deploy failure' }
  publish.writeState({ pushed: { ...pushed, revision: newer.revision }, failed })
  exit()
  advance(3_000)
  advance(120_000)
  assert.equal(spawn.mock.calls.length, 2)
  publish.startPublish()
  assert.equal(spawn.mock.calls.length, 3)
  exit()
  queueReviewRevision(root, [])
  publish.reviewChanged()
  assert.equal(publish.publishInfo().state, 'queued')
  advance(119_999)
  assert.equal(spawn.mock.calls.length, 3)
  advance(1)
  assert.equal(spawn.mock.calls.length, 4)
  exit()
})

it('rechecks a busy lock but requires manual retry after an unexpected publisher exit', (t) => {
  let { spawn, advance, exit } = clockAndPublisher(t)
  t.mock.method(console, 'error', () => {})
  queueReviewRevision(root, [])
  publish.resumePublishing()
  advance(120_000)
  assert.equal(spawn.mock.calls.length, 1)
  exit(75)
  advance(3_000)
  assert.equal(spawn.mock.calls.length, 2)
  exit(1)
  advance(60_000)
  assert.equal(spawn.mock.calls.length, 2)
  assert.equal(publish.publishInfo().state, 'failed')
  assert.equal(publish.publishInfo().action, 'Try again')
  publish.startPublish()
  assert.equal(spawn.mock.calls.length, 3)
  exit()
})
