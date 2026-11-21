// The always-on review server invokes this through the Python publish lock (review_io.py).
// A run advances one durable release; it never works in or pushes the main checkout.
import { execFileSync, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { constants, copyFileSync, existsSync, readdirSync, rmSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { loadClips, loadCommittedClips } from '../app/content/clips.ts'
import { MEDIA_DIR } from '../app/content/media-dir.ts'
import { autoPublish, legacyProgress, PENDING, readState, REPO, STATE, writeState, type PublishState } from '../app/content/publish.ts'
import { withReviewLock } from '../app/content/review-io.ts'
import { queueReviewRevision, readReviewQueue } from '../app/content/review-queue.ts'
import { openReviewGit, type ReviewGit } from './review-publish-git.ts'
import { makeR2ObjectStore, openReviewMedia } from './review-publish-media.ts'
import { parseManifest, parsePublicClips, reconcileReviewRelease, urgentlyRemoveClip, type DeployCheck } from './review-release.ts'

const WORK = dirname(STATE)
const log = (text: string) => console.log(`[${new Date().toISOString()}] ${text}`)
const sourceGit = (...args: string[]) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

async function checkDeployment(sha: string): Promise<DeployCheck> {
  let repo = /(?:^|[/:@])github\.com[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?$/.exec(sourceGit('remote', 'get-url', 'origin'))?.[1]
  if (!repo || !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(sha)) throw new Error('Cannot identify the Workers Builds check on GitHub.')
  let result = spawnSync('gh', ['api', `repos/${repo}/commits/${sha}/check-runs?filter=latest&per_page=100`], {
    encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'ignore'],
  })
  if (result.status !== 0) throw new Error('Could not read Workers Builds from GitHub. Check gh authentication or the connection, then try again.')
  type Check = { id: number; name: string; status: string; conclusion: string | null }
  let checks: Check[]
  try { checks = JSON.parse(result.stdout).check_runs } catch { throw new Error('Could not read the Workers Builds result.') }
  if (!Array.isArray(checks)) throw new Error('Could not read the Workers Builds result.')
  let check = checks.filter((item) => item.name.startsWith('Workers Builds')).sort((a, b) => b.id - a.id)[0]
  if (!check || check.status !== 'completed') return { state: 'pending' }
  if (check.conclusion === 'success') return { state: 'live' }
  if (check.conclusion === 'cancelled' || check.conclusion === 'skipped') return { state: 'superseded' }
  return { state: 'failed', message: `Workers Builds did not deploy ${sha.slice(0, 7)}. Check https://github.com/${repo}/commit/${sha}/checks, then try again.` }
}

async function migrateLegacy(git: ReviewGit, state: PublishState) {
  let legacy = legacyProgress()
  if (!legacy.pending && !legacy.sha && !existsSync(PENDING)) return
  let archive = join(WORK, 'publish-v1.json')
  if (existsSync(STATE) && !existsSync(archive)) copyFileSync(STATE, archive, constants.COPYFILE_EXCL)
  let tree = undefined
  if (legacy.sha) {
    git.fetchMaster()
    tree = git.readRelease(legacy.sha)
  }
  let published = tree && parsePublicClips(tree.clipsJson)
  let { queued, newer } = await withReviewLock(MEDIA_DIR, () => {
    let pending = readReviewQueue(MEDIA_DIR)
    if (pending || (!legacy.pending && !published)) return { queued: pending, newer: Boolean(pending) }
    return legacy.pending
      ? { queued: queueReviewRevision(MEDIA_DIR, loadCommittedClips(), loadClips()), newer: true }
      : { queued: queueReviewRevision(MEDIA_DIR, published!), newer: false }
  })
  if (tree && published && queued && !state.pushed && !state.live) {
    state.pushed = {
      revision: newer ? randomUUID() : queued.revision,
      sha: tree.sha, pushedAt: new Date().toISOString(), nextCheckAt: Date.now(), acknowledged: true,
      desired: published, published, manifest: parseManifest(tree.mediaJson),
    }
  }
  writeState(state)
  if (existsSync(PENDING)) unlinkSync(PENDING)
}

async function main() {
  if (!autoPublish() || process.env.REVIEW_PUBLISH_LOCKED !== '1' || sourceGit('rev-parse', '--abbrev-ref', 'HEAD') !== 'master') {
    throw new Error('Use the always-on review server on master to publish. Restart it only after the previous run is idle.')
  }
  for (let entry of readdirSync(WORK, { withFileTypes: true })) {
    if (entry.isDirectory() && /^(review-git-|publish-snapshot-)[a-zA-Z0-9]{6}$/.test(entry.name)) {
      // A killed run may have left its temporary copies; no other execution holds this lock.
      rmSync(join(WORK, entry.name), { recursive: true, force: true })
    }
  }
  let git = openReviewGit(REPO, WORK)
  try {
    let media = openReviewMedia(MEDIA_DIR, makeR2ObjectStore())
    let deps = { git, media, mediaRoot: MEDIA_DIR, deploy: checkDeployment, save: writeState }
    if (process.argv[2] === '--takedown') {
      let id = process.argv[3]
      if (!id || process.argv.length !== 4) throw new Error('Choose one rejected clip.')
      await urgentlyRemoveClip(deps, id)
      log('Removed known public objects for the rejected clip.')
      return
    }
    if (process.argv.length !== 2) throw new Error('Publish from the review page.')
    let state = readState()
    await migrateLegacy(git, state)
    await reconcileReviewRelease(deps, state)
    if (state.failed) log(state.failed.message)
    else if (state.pushed) log(`Pushed ${state.pushed.sha.slice(0, 7)}; awaiting deployment confirmation.`)
    else if (state.live) log(`Confirmed live: ${state.live.sha.slice(0, 7)}.`)
  } finally {
    git.close()
  }
}

try {
  await main()
} catch (error) {
  let message = error instanceof Error ? error.message : 'The publisher could not start.'
  console.error(message)
  process.exitCode = 1
}
