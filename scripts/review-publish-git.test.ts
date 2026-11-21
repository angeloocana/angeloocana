import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { devNull, tmpdir } from 'node:os'
import { join } from 'node:path'
import * as assert from 'remix/assert'
import { it } from 'remix/test'

import { openReviewGit } from './review-publish-git.ts'

const CLIPS = 'app/content/clips.json'
const MEDIA = 'app/content/media.json'
const ORIGINAL_CLIPS = '[{"id":"c12345678","caption":"Original cut"}]\n'
const ORIGINAL_MEDIA = '{"clips/c12345678.mp4":"0123456789"}\n'
const RECUT_CLIPS = '[\r\n  {"id":"c12345678","caption":"New cut — café"}\r\n]\r\n'
const RECUT_MEDIA = `{"clips/c12345678.mp4":"sha256-${'a'.repeat(64)}"}`

function git(cwd: string, ...args: string[]) {
  return execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', `core.hooksPath=${devNull}`, ...args], {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function fixture(root: string) {
  const remote = join(root, 'origin.git')
  const seed = join(root, 'seed')
  const source = join(root, 'source')
  const scratch = join(root, 'scratch')
  git(root, 'init', '--bare', '--initial-branch=master', '--object-format=sha1', remote)
  git(root, 'clone', remote, seed)
  git(seed, 'config', 'user.name', 'Upstream Fixture')
  git(seed, 'config', 'user.email', 'upstream@example.test')
  mkdirSync(join(seed, 'app/content'), { recursive: true })
  writeFileSync(join(seed, CLIPS), ORIGINAL_CLIPS)
  writeFileSync(join(seed, MEDIA), ORIGINAL_MEDIA)
  writeFileSync(join(seed, '.gitattributes'), 'app/content/*.json text eol=lf\n')
  writeFileSync(join(seed, 'site.txt'), 'upstream site\n')
  git(seed, 'add', '.')
  git(seed, 'commit', '-m', 'Seed master')
  git(seed, 'push', 'origin', 'master')
  git(root, 'clone', remote, source)
  git(source, 'remote', 'set-url', 'origin', '../origin.git')
  git(source, 'config', 'user.name', 'Review Fixture')
  git(source, 'config', 'user.email', 'review@example.test')
  return { remote, seed, source, scratch }
}

it('publishes only exact review blobs from fresh remote master, retries races, and sees pushed ancestry after reopen', () => {
  const root = mkdtempSync(join(tmpdir(), 'review-publish-git-test-'))
  try {
    const { remote, seed, source, scratch } = fixture(root)
    writeFileSync(join(source, 'local-only.txt'), 'unpublished local commit\n')
    git(source, 'add', 'local-only.txt')
    git(source, 'commit', '-m', 'Unrelated local commit')
    const localHead = git(source, 'rev-parse', 'HEAD').trim()
    git(source, 'tag', 'local-only')
    writeFileSync(join(source, 'staged.txt'), 'staged but not for review\n')
    git(source, 'add', 'staged.txt')
    writeFileSync(join(source, CLIPS), 'unsaved worktree text\n')
    writeFileSync(join(source, 'untracked.txt'), 'untracked and private\n')
    const originalRefs = git(source, 'show-ref')
    const originalIndex = readFileSync(join(source, '.git/index'))

    function upstreamEdit(text: string) {
      writeFileSync(join(seed, 'site.txt'), text)
      git(seed, 'commit', '-m', text.trim(), '--', 'site.txt')
      git(seed, 'push', 'origin', 'master')
      return git(seed, 'rev-parse', 'HEAD').trim()
    }

    const firstMaster = upstreamEdit('first upstream update\n')
    const review = openReviewGit(source, scratch)
    let staleCandidate: string
    let pushedCandidate: string
    try {
      const base = review.fetchMaster()
      assert.deepEqual(base, { sha: firstMaster, clipsJson: ORIGINAL_CLIPS, mediaJson: ORIGINAL_MEDIA })
      assert.equal(review.contains(base.sha, localHead), false)
      assert.equal(review.makeCandidate(base.sha, base.clipsJson, base.mediaJson), base.sha)
      staleCandidate = review.makeCandidate(base.sha, RECUT_CLIPS, RECUT_MEDIA)

      const latestMaster = upstreamEdit('competing upstream update\n')
      assert.equal(review.pushCandidate(base.sha, staleCandidate), 'moved')
      assert.equal(git(remote, 'rev-parse', 'master').trim(), latestMaster)

      const latest = review.fetchMaster()
      assert.equal(latest.sha, latestMaster)
      pushedCandidate = review.makeCandidate(latest.sha, RECUT_CLIPS, RECUT_MEDIA)
      assert.equal(review.pushCandidate(latest.sha, pushedCandidate), 'pushed')
      assert.equal(git(remote, 'rev-list', '--parents', '-n1', 'master').trim(), `${pushedCandidate} ${latestMaster}`)
      assert.deepEqual(git(remote, 'diff-tree', '--no-commit-id', '--name-only', '-r', 'master').trim().split('\n'), [CLIPS, MEDIA])
      assert.equal(git(remote, 'cat-file', 'blob', `master:${CLIPS}`), RECUT_CLIPS)
      assert.equal(git(remote, 'cat-file', 'blob', `master:${MEDIA}`), RECUT_MEDIA)
      assert.equal(git(remote, 'show', '-s', '--format=%an <%ae>', 'master').trim(), 'Review Fixture <review@example.test>')
      assert.equal(git(remote, 'for-each-ref', '--format=%(refname)').trim(), 'refs/heads/master')
    } finally {
      review.close()
    }
    assert.deepEqual(readdirSync(scratch), [])

    git(seed, 'pull', '--ff-only', 'origin', 'master')
    const afterReview = upstreamEdit('upstream update after review\n')
    const reopened = openReviewGit(source, scratch)
    try {
      const head = reopened.fetchMaster()
      assert.deepEqual(head, { sha: afterReview, clipsJson: RECUT_CLIPS, mediaJson: RECUT_MEDIA })
      assert.equal(reopened.contains(head.sha, pushedCandidate), true)
      assert.equal(reopened.contains(head.sha, staleCandidate), false)
    } finally {
      reopened.close()
    }
    assert.deepEqual(readdirSync(scratch), [])
    assert.equal(git(source, 'show-ref'), originalRefs)
    assert.deepEqual(readFileSync(join(source, '.git/index')), originalIndex)
    assert.equal(readFileSync(join(source, CLIPS), 'utf8'), 'unsaved worktree text\n')
    assert.equal(readFileSync(join(source, 'staged.txt'), 'utf8'), 'staged but not for review\n')
    assert.equal(readFileSync(join(source, 'untracked.txt'), 'utf8'), 'untracked and private\n')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
