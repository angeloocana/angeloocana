import { execFileSync } from 'node:child_process'
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
import { openReviewGit } from './review-publish-git.ts'
import { openReviewMedia, type ObjectStore } from './review-publish-media.ts'
import { parseManifest, reconcileReviewRelease, urgentlyRemoveClip, type DeployCheck } from './review-release.ts'

const CLIPS = 'app/content/clips.json'
const MEDIA = 'app/content/media.json'
const VIDEO = 'clips/c12345678.mp4'
const POSTER = 'clips/c12345678.jpg'
const HERO = 'hero/h-fixture-phone.mp4'
const clip = (id: string): Clip => ({ id, rejected: false, cat: 'ice', label: { en: 'Test cut', pt: 'Teste' }, star: 0, score: 3, source: 'montage' })

function git(cwd: string, ...args: string[]) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_ALLOW_PROTOCOL: 'file' }, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}
function fixture(dir: string) {
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
  writeJsonAtomic(join(source, MEDIA), {})
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
  let bytes = new Map<string, string>([[HERO, 'legacy hero variant']])
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
    let { source, remote, peer, original } = fixture(dir)
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

    async function run(ambiguous = false) {
      let adapter = openReviewGit(source, join(dir, 'scratch'))
      try {
        let working = state()
        let status = adapter.pushCandidate
        await reconcileReviewRelease({ mediaRoot, media: openReviewMedia(mediaRoot, store), save,
          git: { ...adapter, pushCandidate(base, candidate) {
            assert.equal(state().candidate?.sha, candidate)
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

    await run()
    let latest = git(remote, 'rev-parse', 'master')
    assert.equal(state().pushed?.sha, latest)
    assert.equal(state().pushed?.revision, newerRevision)
    assert.deepEqual(checks, [sent, sent])
    assert.ok(bytes.has(HERO))
    assert.equal(removed.length, 0)
    nextDeploy = { state: 'live' }
    await run()
    assert.equal(state().live?.sha, latest)
    assert.deepEqual(checks, [sent, sent, latest])
    assert.ok(removed.includes(HERO))
    assert.ok(!removed.some((key) => key.includes('c12345678')))
    assert.equal(bytes.has(HERO), false)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

it('urgent takedown is separate from deploying and refuses a restored clip', async () => {
  let dir = mkdtempSync(join(tmpdir(), 'review-takedown-'))
  let mediaRoot = join(dir, 'media-root')
  try {
    let { source, original } = fixture(dir)
    let current = original.map((item) => ({ ...item, rejected: item.id === 'h-fixture' }))
    await withReviewLock(mediaRoot, () => queueReviewRevision(mediaRoot, original, current))
    let git = openReviewGit(source, join(dir, 'scratch'))
    try {
      let dropped: string[] = []
      let deps = { git, mediaRoot, media: openReviewMedia(mediaRoot, {
        async put() { throw new Error('Unexpected upload') }, async remove(key) { dropped.push(key) },
      }), async deploy(): Promise<DeployCheck> { throw new Error('Unexpected deployment check') }, save() { throw new Error('Unexpected publish state change') } }
      await assert.rejects(urgentlyRemoveClip(deps, 'c12345678'), /Reject the clip/)
      assert.equal(dropped.length, 0)
      await urgentlyRemoveClip(deps, 'h-fixture')
      assert.ok(dropped.includes(HERO))
      assert.ok(dropped.every((key) => key.includes('h-fixture')))
    } finally { git.close() }
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
