import { isDeepStrictEqual } from 'node:util'

import type { Clip } from '../app/content/clips.ts'
import { clipMediaId } from '../app/content/media-keys.ts'
import { assertPublicClipData } from '../app/content/public-clip-data.ts'
import type { PublishState, Release } from '../app/content/publish.ts'
import { withReviewLock } from '../app/content/review-io.ts'
import { acknowledgeReviewRevision, mergeReviewClips, readReviewQueue } from '../app/content/review-queue.ts'
import { capturePublishSnapshot, removePublishSnapshot, uploadPublishSnapshot } from './publish-snapshot.ts'
import type { ReviewGit } from './review-publish-git.ts'
import type { openReviewMedia } from './review-publish-media.ts'

export type DeployCheck = { state: 'live' | 'pending' | 'superseded' } | { state: 'failed'; message: string }
type Dependencies = {
  mediaRoot: string
  git: ReviewGit
  media: ReturnType<typeof openReviewMedia>
  deploy: (sha: string) => Promise<DeployCheck>
  save: (state: PublishState) => void
  now?: () => Date
}
const CHECK_INTERVAL = 15_000
const DEPLOY_TIMEOUT = 15 * 60_000

export function parsePublicClips(json: string): Clip[] {
  let data: unknown
  try { data = JSON.parse(json) } catch { throw new Error('Invalid public clips JSON') }
  assertPublicClipData(data)
  return data as Clip[]
}

export function parseManifest(json: string): Record<string, string> {
  try {
    let data: unknown = JSON.parse(json)
    if (data && typeof data === 'object' && !Array.isArray(data) && Object.values(data).every((v) => typeof v === 'string')) {
      return data as Record<string, string>
    }
  } catch { /* Do not echo bytes from unvalidated JSON. */ }
  throw new Error('Invalid review media manifest')
}

/** A bounded reconciliation turn. The caller serializes publish, manual upload and urgent removal. */
export async function reconcileReviewRelease(deps: Dependencies, state: PublishState) {
  let { git, media, mediaRoot, save } = deps
  let now = deps.now ?? (() => new Date())
  let stamp = () => now().toISOString()
  let phase: NonNullable<PublishState['failed']>['phase'] = 'prepare'
  let revision: string | undefined
  let master: ReturnType<ReviewGit['fetchMaster']> | undefined
  let fetchMaster = () => master ??= git.fetchMaster()
  let startedAt = stamp()
  let step = (text: string) => {
    state.running = { pid: process.pid, startedAt, step: text }
    save(state)
  }

  function pushed(release: Release) {
    // Persist the SHA before reconciling the local queue or asking about deployment.
    state.pushed = { ...release, pushedAt: stamp(), nextCheckAt: now().getTime() }
    delete state.candidate
    delete state.failed
    save(state)
  }

  async function confirm() {
    let release = state.pushed!
    revision = release.revision
    phase = 'deploy'
    step('Checking deployment')
    if (!release.acknowledged) {
      await withReviewLock(mediaRoot, () => acknowledgeReviewRevision(mediaRoot, release))
      release.acknowledged = true
      save(state)
    }
    let sha = release.sha
    let result = await deps.deploy(sha)
    if (result.state === 'superseded') {
      let latest = fetchMaster()
      // A newer deployment is proof only if it contains this commit and the same public data.
      if (latest.sha !== sha && git.contains(latest.sha, sha) &&
          isDeepStrictEqual(parsePublicClips(latest.clipsJson), release.published) &&
          isDeepStrictEqual(parseManifest(latest.mediaJson), release.manifest)) {
        sha = latest.sha
        result = await deps.deploy(sha)
      }
    }
    if (result.state === 'failed') throw new Error(result.message)
    if (result.state !== 'live') {
      if (now().getTime() - Date.parse(release.pushedAt) >= DEPLOY_TIMEOUT) {
        throw new Error('Cloudflare did not confirm this deployment. Check Workers Builds, then try again.')
      }
      release.nextCheckAt = now().getTime() + CHECK_INTERVAL
      delete state.failed
      save(state)
      return
    }

    state.live = { revision, sha, confirmedAt: stamp() }
    let rejected = new Set([...(state.cleanup?.ids ?? []), ...release.published.filter((clip) => clip.rejected).map((clip) => clip.id)])
    state.cleanup = { revision, ids: [...rejected], manifest: release.manifest }
    delete state.pushed
    delete state.failed
    save(state)
  }

  async function clean() {
    let cleanup = state.cleanup!
    revision = cleanup.revision
    phase = 'cleanup'
    step('Checking that rejected media is no longer live')
    let latest = git.fetchMaster() // Never reuse a tip read before an asynchronous deploy check.
    let upstream = parsePublicClips(latest.clipsJson)
    let manifest = parseManifest(latest.mediaJson)
    let inUse = new Set(upstream.filter((clip) => !clip.rejected).map((clip) => clip.id))
    for (let key of Object.keys(manifest)) {
      let id = clipMediaId(key)
      if (id) inUse.add(id)
    }
    let ids = cleanup.ids.filter((id) => !inUse.has(id))
    if (ids.length && latest.sha !== state.live?.sha) {
      // An older successful build could predate a live restoration. Only trust the current
      // exclusion if that exact tip deployed and remained current during verification.
      if ((await deps.deploy(latest.sha)).state !== 'live' || git.fetchMaster().sha !== latest.sha) {
        cleanup.nextCheckAt = now().getTime() + CHECK_INTERVAL
        delete state.failed
        save(state)
        return
      }
    }
    let reviewed = readReviewQueue(mediaRoot)?.clips ?? []
    let approvedLocally = new Set(reviewed.filter((clip) => !clip.rejected).map((clip) => clip.id))
    // A restore that arrives after this check re-uploads tombstoned versions before its own push.
    await media.removeRejected(ids.filter((id) => !approvedLocally.has(id)), [cleanup.manifest, manifest])
    delete state.cleanup
    delete state.failed
    save(state)
  }

  try {
    let queue = readReviewQueue(mediaRoot)
    revision = queue?.revision
    if (state.candidate) {
      phase = 'push'
      step('Recovering the previous push')
      let current = fetchMaster()
      if (git.contains(current.sha, state.candidate.sha)) {
        pushed(state.candidate)
      } else {
        delete state.candidate
        save(state)
      }
    }
    let newerThanFailedDeployment = state.failed?.phase === 'deploy' && state.pushed && queue && queue.revision !== state.pushed.revision
    if (state.pushed && !newerThanFailedDeployment) {
      await confirm()
      if (!state.pushed && state.cleanup) await clean()
      return
    }
    if (newerThanFailedDeployment) {
      // The new revision replaces this failed release. Do not let its deploy failure overwrite a
      // newer terminal push failure and cause alternating automatic retries.
      delete state.pushed
      save(state)
    }
    let newerThanCleanup = state.cleanup && queue && queue.revision !== state.cleanup.revision
    if (state.cleanup && !newerThanCleanup) {
      await clean()
      return
    }
    if (!queue || state.live?.revision === queue.revision) return

    phase = 'prepare'
    step('Capturing approved clips')
    let base = fetchMaster()
    let upstream = parsePublicClips(base.clipsJson)
    let prior = parseManifest(base.mediaJson)
    media.rememberManifest(prior) // Includes versions uploaded elsewhere that a rejection will omit.
    let previous = media.availableManifest(prior)
    let desired: Clip[] = []
    let snapshot = await capturePublishSnapshot(mediaRoot, () => {
      let latest = readReviewQueue(mediaRoot)
      if (!latest) throw new Error('The review revision is missing. Save the review again.')
      desired = latest.clips
      let clips = mergeReviewClips(latest.base, desired, upstream)
      return { revision: latest.revision, clipsJson: JSON.stringify(clips) }
    }, previous)
    revision = snapshot.revision
    try {
      step('Uploading approved media')
      await uploadPublishSnapshot(snapshot, media.upload)
      phase = 'push'
      step('Pushing the reviewed snapshot')
      let current = base
      let manifestJson = JSON.stringify(snapshot.manifest, null, 2) + '\n'
      let published = parsePublicClips(snapshot.clipsJson)
      for (let attempt = 0; attempt < 2; attempt++) {
        let sha = git.makeCandidate(current.sha, snapshot.clipsJson, manifestJson)
        let release: Release = { revision, sha, desired, published, manifest: { ...snapshot.manifest } }
        if (sha === current.sha) {
          // A no-op does not have a push lease. Verify the tip; an ancestor's deploy does not
          // prove the current public blobs are equal to the snapshot.
          current = master = git.fetchMaster()
          if (current.sha === sha) {
            pushed(release)
            return
          }
        } else {
          state.candidate = release
          save(state)
          if (git.pushCandidate(current.sha, sha) === 'pushed') {
            pushed(release)
            return
          }
          current = master = git.fetchMaster()
          if (git.contains(current.sha, sha)) {
            pushed(release)
            return
          }
          delete state.candidate
          save(state)
        }
        if (current.clipsJson !== base.clipsJson || current.mediaJson !== base.mediaJson) break
      }
      throw new Error('Master moved while publishing. The review is still queued; try again to check the new tip.')
    } finally {
      removePublishSnapshot(snapshot)
    }
  } catch (error) {
    state.failed = { phase, revision, at: stamp(), message: error instanceof Error ? error.message : 'Unknown publish error' }
  } finally {
    delete state.running
    save(state)
  }
}

/** Separate from ordinary cleanup. Refuse if the currently saved review no longer rejects this clip. */
export async function urgentlyRemoveClip(deps: Dependencies, id: string) {
  let { mediaRoot, git, media } = deps
  let latest = git.fetchMaster()
  let rejected = await withReviewLock(mediaRoot, () => {
    let queue = readReviewQueue(mediaRoot)
    let saved = queue?.clips.find((clip) => clip.id === id)
    if (saved && !saved.rejected) return false
    let base = queue?.base.find((clip) => clip.id === id)
    let pendingRejection = saved?.rejected && !base?.rejected
    let publishedRejection = parsePublicClips(latest.clipsJson).some((clip) => clip.id === id && clip.rejected)
    // An acknowledged rejection left in the queue is not new takedown authority if origin now
    // approves the clip. Require a pending rejection or a rejection in freshly fetched master.
    return pendingRejection || publishedRejection
  })
  if (!rejected) throw new Error('Reject the clip in review before removing its media.')
  await media.removeRejected([id], [parseManifest(latest.mediaJson)])
}
