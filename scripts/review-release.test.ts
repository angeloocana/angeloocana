import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import * as assert from 'remix/assert'
import { it } from 'remix/test'

import type { Clip } from '../app/content/clips.ts'
import { versionedMediaKey } from '../app/content/media-keys.ts'
import type { PublishState } from '../app/content/publish.ts'
import { withReviewLock, writeJsonAtomic } from '../app/content/review-io.ts'
import { queueReviewRevision, readReviewQueue } from '../app/content/review-queue.ts'
import { openReviewGit, requirePublishedLegacyBase } from './review-publish-git.ts'
import { openReviewMedia, type ObjectStore } from './review-publish-media.ts'
import { parseManifest, reconcileReviewRelease, urgentlyRemoveClip, type DeployCheck } from './review-release.ts'

const CLIPS = 'app/content/clips.json'
const MEDIA = 'app/content/media.json'
const VIDEO = 'clips/c12345678.mp4'
const POSTER = 'clips/c12345678.jpg'
const HERO = 'hero/h-fixture-phone.mp4'
const HISTORIC_VERSION = 'abcdefghijklmnop'
const HISTORIC_HERO = versionedMediaKey(HERO, HISTORIC_VERSION)
const clip = (id: string): Clip => ({ id, rejected: false, cat: 'ice', label: { en: 'Test cut', pt: 'Teste' }, star: 0, score: 3, source: 'montage' })

function git(cwd: string, ...args: string[]) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_ALLOW_PROTOCOL: 'file' }, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}
function fixture(dir: string, initialManifest: Record<string, string> = {}) {
  let source = join(dir, 'checkout')
  let remote = join(dir, 'remote.git')
  mkdirSync(source)
  git(dir, 'init', '--bare', '--initial-branch=master', remote)
  git(source, 'init', '--initial-branch=master')
  git(source, 'config', 'user.name', 'Review test')
  git(source, 'config', 'user.email', 'review@example.test')
  git(source, 'remote', 'add', 'origin', remote)
  let original = [clip('c12345678'), clip('h-fixture')]
  mkdirSync(join(source, 'app/content'), { recursive: true })
  writeJsonAtomic(join(source, CLIPS), original)
  writeJsonAtomic(join(source, MEDIA), initialManifest, 2)
  writeFileSync(join(source, 'README.md'), 'initial')
  git(source, 'add', '.')
  git(source, 'commit', '-m', 'Initial test release')
  git(source, 'push', 'origin', 'master')
  let peer = join(dir, 'competing-checkout')
  git(dir, 'clone', remote, peer)
  git(peer, 'config', 'user.name', 'Review test')
  git(peer, 'config', 'user.email', 'review@example.test')
  return { source, remote, peer, original }
}

it('recovers a partial upload and ambiguous push, preserves newer edits, and cleans only after a live deploy', async () => {
  let dir = mkdtempSync(join(tmpdir(), 'review-release-'))
  let mediaRoot = join(dir, 'local-media')
  let progress = join(dir, 'progress.json')
  let use = 'incomplete upload'
  let target = 'initial put'
  let nextDeploy: DeployCheck = { state: 'pending' }
  let checks: string[] = []
  let removed: string[] = []
  let bytes = new Map<string, string>([[HERO, 'legacy hero variant'], [HISTORIC_HERO, 'version from another machine']])
  let save = (state: PublishState) => writeJsonAtomic(progress, state)
  let state = () => JSON.parse(readFileSync(progress, 'utf8')) as PublishState
  save({})
  let store: ObjectStore = {
    async put(object, file) {
      bytes.set(object, readFileSync(file, 'utf8'))
      if (use === 'incomplete upload' && object.endsWith('.jpg')) throw new Error('test interrupted upload after object arrived')
      if (use === 'move master' && object.endsWith(`/${VIDEO}`)) {
        use = 'again'
        await afterSnapshot()
      }
    },
    async remove(object) { removed.push(object); bytes.delete(object) },
  }
  let afterSnapshot = async () => {}
  try {
    let { source, remote, peer, original } = fixture(dir, { [HERO]: HISTORIC_VERSION })
    let originalSha = git(remote, 'rev-parse', 'master')
    writeFileSync(join(source, 'README.md'), 'unrelated local history')
    git(source, 'add', 'README.md')
    git(source, 'commit', '-m', 'Do not publish this local commit')
    let sourceSha = git(source, 'rev-parse', 'HEAD')
    writeFileSync(join(source, 'README.md'), 'dirty local file')

    function writeMedia(key: string, contents: string) {
      let file = join(mediaRoot, 'media', key)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, contents)
    }
    writeMedia(VIDEO, 'first selected video')
    writeMedia(POSTER, 'first poster')
    writeMedia('clips/h-fixture.mp4', 'approved hero')
    writeMedia('clips/h-fixture.jpg', 'approved hero poster')
    let first = await withReviewLock(mediaRoot, () => queueReviewRevision(mediaRoot, original, [{ ...original[0], star: 1 }, original[1]]))

    async function run(ambiguous = false, deny = false) {
      let adapter = openReviewGit(source, join(dir, 'scratch'))
      try {
        let working = state()
        let status = adapter.pushCandidate
        await reconcileReviewRelease({ mediaRoot, media: openReviewMedia(mediaRoot, store), save,
          git: { ...adapter, pushCandidate(base, candidate) {
            assert.equal(state().candidate?.sha, candidate)
            if (deny) throw new Error('test auth was denied')
            let result = status(base, candidate)
            target = result
            if (ambiguous && result === 'pushed') throw new Error('test lost connection after acceptance')
            return result
          } },
          async deploy(sha) { checks.push(sha); return nextDeploy },
        }, working)
      } finally { adapter.close() }
    }

    await run()
    assert.equal(state().failed?.phase, 'prepare')
    assert.equal(state().live, undefined)
    assert.equal(git(remote, 'rev-parse', 'master'), originalSha)
    assert.equal(removed.length, 0)

    let newerRevision: string | undefined
    afterSnapshot = async () => {
      await withReviewLock(mediaRoot, () => {
        writeMedia(VIDEO, 'next selected video')
        writeMedia(POSTER, 'next poster')
        newerRevision = queueReviewRevision(mediaRoot, original, [{ ...original[0], star: 2 }, { ...original[1], rejected: true }]).revision
      })
      writeFileSync(join(peer, 'README.md'), 'somebody else pushed normally')
      git(peer, 'add', '.')
      git(peer, 'commit', '-m', 'Competing push')
      git(peer, 'push', 'origin', 'master')
    }
    use = 'move master'
    await run(true)
    let sent = git(remote, 'rev-parse', 'master')
    assert.equal(state().candidate?.sha, sent)
    assert.equal(state().candidate?.revision, first.revision)
    assert.equal(state().failed?.phase, 'push')
    assert.equal(state().live, undefined)
    assert.equal(target, 'pushed')
    assert.equal(git(remote, 'show', 'master:README.md'), 'somebody else pushed normally')
    assert.equal(git(source, 'rev-parse', 'HEAD'), sourceSha)
    assert.equal(readFileSync(join(source, 'README.md'), 'utf8'), 'dirty local file')
    let committed = parseManifest(git(remote, 'show', `master:${MEDIA}`))
    assert.equal(bytes.get(versionedMediaKey(VIDEO, committed[VIDEO])), 'first selected video')
    assert.equal(bytes.get(versionedMediaKey(POSTER, committed[POSTER])), 'first poster')
    assert.deepEqual(JSON.parse(git(remote, 'show', `master:${CLIPS}`)), first.clips)
    assert.equal(readReviewQueue(mediaRoot)?.revision, newerRevision)

    await run()
    assert.equal(state().candidate, undefined)
    assert.equal(state().pushed?.sha, sent)
    assert.equal(state().live, undefined)
    assert.equal(removed.length, 0)
    nextDeploy = { state: 'failed', message: 'test Workers Builds failed' }
    await run()
    assert.equal(state().pushed?.sha, sent)
    assert.equal(state().failed?.phase, 'deploy')
    assert.equal(state().live, undefined)
    assert.equal(removed.length, 0)

    // A terminal failure preparing the newer release must not revive the failed old deploy.
    await run(false, true)
    assert.equal(state().pushed, undefined)
    assert.equal(state().candidate?.revision, newerRevision)
    assert.equal(state().failed?.phase, 'push')
    assert.equal(git(remote, 'rev-parse', 'master'), sent)
    assert.deepEqual(checks, [sent, sent])

    await run()
    let latest = git(remote, 'rev-parse', 'master')
    assert.equal(state().pushed?.sha, latest)
    assert.equal(state().pushed?.revision, newerRevision)
    assert.deepEqual(checks, [sent, sent])
    assert.ok(bytes.has(HERO))
    assert.equal(removed.length, 0)
    nextDeploy = { state: 'live' }
    await run()
    if (state().cleanup) await run() // Reauthorize the next bounded deletion batch.
    assert.equal(state().cleanup, undefined)
    assert.equal(state().live?.sha, latest)
    assert.deepEqual(checks, [sent, sent, latest])
    assert.ok(removed.includes(HERO))
    assert.ok(removed.includes(HISTORIC_HERO))
    assert.ok(!removed.some((key) => key.includes('c12345678')))
    assert.equal(bytes.has(HERO), false)
    assert.equal(bytes.has(HISTORIC_HERO), false)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

it('urgent takedown is separate from deploying and refuses a restored clip', async () => {
  let dir = mkdtempSync(join(tmpdir(), 'review-takedown-'))
  let mediaRoot = join(dir, 'media-root')
  try {
    let { source, peer, original } = fixture(dir, {
      [POSTER]: createHash('sha256').update(POSTER).digest('hex').slice(0, 10),
      [VIDEO]: createHash('sha256').update(VIDEO).digest('hex').slice(0, 10),
      [HERO]: HISTORIC_VERSION,
    })
    for (let key of [POSTER, VIDEO]) {
      let file = join(mediaRoot, 'media', key)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, key)
    }
    let current = original.map((item) => ({ ...item, rejected: item.id === 'h-fixture' }))
    await withReviewLock(mediaRoot, () => queueReviewRevision(mediaRoot, original, current))
    let adapter = openReviewGit(source, join(dir, 'scratch'))
    try {
      let dropped: string[] = []
      let present = new Set([HISTORIC_HERO])
      let deps = { git: adapter, mediaRoot, media: openReviewMedia(mediaRoot, {
        async put() { throw new Error('Unexpected upload') }, async remove(key) { dropped.push(key); present.delete(key) },
      }), async deploy(): Promise<DeployCheck> { throw new Error('Unexpected deployment check') }, save() { throw new Error('Unexpected publish state change') } }
      await assert.rejects(urgentlyRemoveClip(deps, 'c12345678'), /Reject the clip/)
      assert.equal(dropped.length, 0)
      await urgentlyRemoveClip(deps, 'h-fixture')
      assert.ok(dropped.includes(HERO))
      assert.ok(dropped.every((key) => key.includes('h-fixture')))
      assert.equal(present.has(HISTORIC_HERO), false)
      present.add(HISTORIC_HERO) // An external uploader recreated the identical immutable key.
      await urgentlyRemoveClip(deps, 'h-fixture')
      assert.equal(present.has(HISTORIC_HERO), false)

      present.add(HISTORIC_HERO)
      let state: PublishState = {}
      let release = { ...deps, save() {}, async deploy(): Promise<DeployCheck> { return { state: 'live' } } }
      await reconcileReviewRelease(release, state)
      assert.ok(state.pushed)
      assert.ok(present.has(HISTORIC_HERO)) // An ordinary rejection does not clean before confirmed live.
      await reconcileReviewRelease(release, state)
      assert.ok(state.live)
      assert.equal(present.has(HISTORIC_HERO), false)

      // The settled historical rejection left in the queue isn't authorization for a new takedown.
      git(peer, 'pull', '--ff-only', 'origin', 'master')
      writeJsonAtomic(join(peer, CLIPS), original)
      git(peer, 'add', CLIPS)
      git(peer, 'commit', '-m', 'Approve the clip on origin again')
      git(peer, 'push', 'origin', 'master')
      let count = dropped.length
      await assert.rejects(urgentlyRemoveClip(deps, 'h-fixture'), /Reject the clip/)
      assert.equal(dropped.length, count)
    } finally { adapter.close() }
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// formal/review-release: the receiptAsLive and tombstoneHidesRestore traces, one step per model action.
it('replays the model: an unacknowledged push is not live, and a restore over a tombstone is cleaned again', async () => {
  let dir = mkdtempSync(join(tmpdir(), 'review-model-'))
  let mediaRoot = join(dir, 'media-root')
  let progress = join(dir, 'progress.json')
  try {
    let { source, remote, original } = fixture(dir, {
      [POSTER]: createHash('sha256').update(POSTER).digest('hex').slice(0, 10),
      [VIDEO]: createHash('sha256').update(VIDEO).digest('hex').slice(0, 10),
      [HERO]: HISTORIC_VERSION,
    })
    for (let key of [POSTER, VIDEO]) {
      let file = join(mediaRoot, 'media', key)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, key)
    }
    let present = new Set([HERO, HISTORIC_HERO])
    let store: ObjectStore = { async put() { throw new Error('Unexpected upload') }, async remove(key) { present.delete(key) } }
    let build: DeployCheck = { state: 'pending' }
    let checks: string[] = []
    let loseAck = false
    writeJsonAtomic(progress, {})
    // Each turn is a fresh process: new adapters, and state only from what was saved.
    async function turn() {
      let adapter = openReviewGit(source, join(dir, 'scratch'))
      try {
        let deps = { mediaRoot, media: openReviewMedia(mediaRoot, store), save: (s: PublishState) => writeJsonAtomic(progress, s),
          git: { ...adapter, pushCandidate(base: string, candidate: string) {
            let result = adapter.pushCandidate(base, candidate)
            if (loseAck && result === 'pushed') throw new Error('test lost the answer after Git accepted the push')
            return result
          } },
          async deploy(sha: string) { checks.push(sha); return build } }
        await reconcileReviewRelease(deps, JSON.parse(readFileSync(progress, 'utf8')))
        return deps
      } finally { adapter.close() }
    }
    let state = () => JSON.parse(readFileSync(progress, 'utf8')) as PublishState

    // ReviewSaves (a pending rejection), then Urgent removes the clip's objects.
    await withReviewLock(mediaRoot, () => queueReviewRevision(mediaRoot, original, original.map((item) => ({ ...item, rejected: item.id === 'h-fixture' }))))
    let adapter = openReviewGit(source, join(dir, 'scratch'))
    try {
      await urgentlyRemoveClip({ mediaRoot, git: adapter, media: openReviewMedia(mediaRoot, store), save() {},
        async deploy(): Promise<DeployCheck> { throw new Error('Unexpected deployment check') } }, 'h-fixture')
    } finally { adapter.close() }
    assert.equal(present.has(HISTORIC_HERO), false)

    // PeerRestores: another uploader puts the identical immutable object back; master still names it.
    present.add(HISTORIC_HERO)

    // Prepare, Upload, Push, Pushing, then PushAck loses Git's answer.
    loseAck = true
    await turn()
    loseAck = false
    let sent = git(remote, 'rev-parse', 'master')
    assert.equal(state().candidate?.sha, sent)
    assert.equal(state().failed?.phase, 'push')

    // RecoverPush after the restart: the receipt is a push, not a deployment.
    await turn()
    assert.equal(state().pushed?.sha, sent)
    assert.equal(state().live, undefined)
    assert.deepEqual(checks, [sent])
    assert.ok(present.has(HISTORIC_HERO))

    // WorkersBuild goes live; Confirm, then Clean removes the restored object despite its tombstone.
    build = { state: 'live' }
    await turn()
    if (state().cleanup) await turn()
    assert.equal(state().live?.sha, sent)
    assert.equal(state().cleanup, undefined)
    assert.equal(present.has(HISTORIC_HERO), false)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

it('does not clean an old exclusion after a remote restore or an unconfirmed new rejection', async () => {
  let dir = mkdtempSync(join(tmpdir(), 'review-cleanup-tip-'))
  let mediaRoot = join(dir, 'media-root')
  try {
    let { source, remote, peer, original } = fixture(dir)
    let rejected = original.map((item) => ({ ...item, rejected: item.id === 'h-fixture' }))
    function publishPeer(clips: Clip[], message: string) {
      writeJsonAtomic(join(peer, CLIPS), clips)
      git(peer, 'add', CLIPS)
      git(peer, 'commit', '-m', message)
      git(peer, 'push', 'origin', 'master')
      return git(remote, 'rev-parse', 'master')
    }
    let earlier = publishPeer(rejected, 'Reject clip')
    let queue = await withReviewLock(mediaRoot, () => queueReviewRevision(mediaRoot, rejected))
    let state: PublishState = { candidate: { revision: queue.revision, sha: earlier, desired: rejected, published: rejected, manifest: {} } }
    let removed: string[] = []
    let onRemove = () => {}
    let adapter = openReviewGit(source, join(dir, 'scratch'))
    try {
      let media = openReviewMedia(mediaRoot, {
        async put() { throw new Error('Unexpected upload') }, async remove(key) { removed.push(key); onRemove() },
      })
      await reconcileReviewRelease({ mediaRoot, git: adapter, media, save() {}, async deploy(sha) {
        assert.equal(sha, earlier)
        publishPeer(original, 'Restore during deploy check')
        return { state: 'live' }
      } }, state)
      assert.equal(removed.length, 0)
      assert.equal(state.live?.sha, earlier)
      assert.equal(state.cleanup, undefined)

      let latest = publishPeer(rejected, 'Reject again; not yet deployed')
      state.cleanup = { revision: queue.revision, ids: ['h-fixture'], manifest: {} }
      await reconcileReviewRelease({ mediaRoot, git: adapter, media, save() {}, async deploy(sha) {
        assert.equal(sha, latest)
        return { state: 'pending' }
      } }, state)
      assert.equal(removed.length, 0)
      assert.ok(state.cleanup?.nextCheckAt)

      for (let char of 'abcd') media.rememberManifest({ [HERO]: char.repeat(16) })
      state.live = { revision: queue.revision, sha: latest, confirmedAt: new Date().toISOString() }
      onRemove = () => {
        onRemove = () => {}
        publishPeer(original, 'Reapprove during first deletion batch')
      }
      let deps = { mediaRoot, git: adapter, media, save() {}, async deploy(): Promise<DeployCheck> {
        throw new Error('The new approval cannot be treated as a rejection')
      } }
      await reconcileReviewRelease(deps, state)
      assert.equal(removed.length, 6)
      assert.ok(state.cleanup?.nextCheckAt)
      await reconcileReviewRelease(deps, state)
      assert.equal(removed.length, 6)
      assert.equal(state.cleanup, undefined)
    } finally { adapter.close() }
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

it('rechecks master even for a no-op and refuses a clean unpublished legacy commit', async () => {
  let dir = mkdtempSync(join(tmpdir(), 'review-no-op-tip-'))
  let mediaRoot = join(dir, 'media-root')
  try {
    let keys = [POSTER, VIDEO, 'clips/h-fixture.jpg', 'clips/h-fixture.mp4']
    let manifest = Object.fromEntries(keys.map((key) => [key, createHash('sha256').update(key).digest('hex').slice(0, 10)]))
    let { source, remote, peer, original } = fixture(dir, manifest)
    for (let key of keys) {
      let file = join(mediaRoot, 'media', key)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, key)
    }
    await withReviewLock(mediaRoot, () => queueReviewRevision(mediaRoot, original))
    let adapter = openReviewGit(source, join(dir, 'scratch'))
    let state: PublishState = {}
    try {
      await reconcileReviewRelease({ mediaRoot, git: { ...adapter,
        makeCandidate(base, clips, media) {
          assert.equal(adapter.makeCandidate(base, clips, media), base)
          writeJsonAtomic(join(peer, CLIPS), [{ ...original[0], star: 3 }, original[1]])
          git(peer, 'add', CLIPS)
          git(peer, 'commit', '-m', 'Change public data while the no-op is prepared')
          git(peer, 'push', 'origin', 'master')
          return base
        },
      }, media: openReviewMedia(mediaRoot, {
        async put() { throw new Error('Unexpected upload') }, async remove() { throw new Error('Unexpected removal') },
      }), save() {}, async deploy() { throw new Error('A stale base cannot be marked live') } }, state)
      assert.match(state.failed?.message ?? '', /Master moved/)
      assert.equal(state.pushed, undefined)
      assert.equal(state.candidate, undefined)
      assert.equal(state.live, undefined)

      writeJsonAtomic(join(source, CLIPS), [original[0], { ...original[1], rejected: true }])
      git(source, 'add', CLIPS)
      git(source, 'commit', '-m', 'Legacy publisher committed locally but failed to push')
      assert.equal(git(source, 'status', '--short'), '')
      let local = git(source, 'rev-parse', 'HEAD')
      let master = adapter.fetchMaster()
      assert.equal(master.sha, git(remote, 'rev-parse', 'master'))
      assert.throws(() => requirePublishedLegacyBase(adapter, master.sha, local), /no pending work was cleared/)
      assert.equal(git(source, 'rev-parse', 'HEAD'), local)
    } finally { adapter.close() }
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
