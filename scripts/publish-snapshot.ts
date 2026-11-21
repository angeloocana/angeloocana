import { createHash } from 'node:crypto'
import { constants, copyFileSync, lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { clipMediaId, PROJECT_MEDIA_KEYS, versionedMediaKey } from '../app/content/media-keys.ts'
import { assertPublicClipData } from '../app/content/public-clip-data.ts'
import { withReviewLock } from '../app/content/review-io.ts'

type Manifest = Readonly<Record<string, string>>
type ReviewRevision = { revision: string; clipsJson: string }
export type SnapshotUpload = Readonly<{ key: string; object: string; file: string }>
export type PublishSnapshot = Readonly<ReviewRevision & {
  directory: string
  manifest: Manifest
  uploads: readonly SnapshotUpload[]
}>

function sortManifest(manifest: Record<string, string>): Manifest {
  return Object.freeze(Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))))
}

/** Copy a finished, regular file, never a link into private source footage. */
function copyAsset(media: string, directory: string, key: string, required: boolean): string | undefined {
  let source = join(media, key)
  let parent = lstatSync(dirname(source), { throwIfNoEntry: false })
  let info = parent?.isDirectory() ? lstatSync(source, { throwIfNoEntry: false }) : undefined
  if ((!parent || (parent.isDirectory() && !info)) && !required) return undefined
  if (!info?.isFile() || !info.size) throw new Error(`Missing or invalid finished media: ${key}`)
  // Flat names are private to this unique directory; no untrusted path is passed to copyFile.
  let file = join(directory, key.replace('/', '_'))
  copyFileSync(source, file, constants.COPYFILE_EXCL | constants.COPYFILE_FICLONE)
  return file
}

/**
 * Read the revision and copy its finished files while saves and render promotion are excluded.
 * Hash and upload only those copies, never the live paths. The caller owns the snapshot directory.
 */
export async function capturePublishSnapshot(
  mediaRoot: string,
  readReview: () => ReviewRevision,
  previous: Manifest,
): Promise<PublishSnapshot> {
  let directory: string | undefined
  try {
    let locked = await withReviewLock(mediaRoot, () => {
      let { revision, clipsJson } = readReview()
      let clips: unknown
      try {
        clips = JSON.parse(clipsJson)
      } catch {
        throw new Error('Invalid public clips JSON')
      }
      assertPublicClipData(clips)
      let media = join(realpathSync(mediaRoot), 'media')
      if (!lstatSync(media, { throwIfNoEntry: false })?.isDirectory()) throw new Error('Missing or invalid media directory')
      let target = directory = mkdtempSync(join(mediaRoot, 'work', 'publish-snapshot-'))
      let files = new Map<string, string>()
      let add = (key: string, required: boolean) => {
        let file = copyAsset(media, target, key, required)
        if (file) files.set(key, file)
      }
      for (let clip of clips as { id: string; rejected: boolean }[]) {
        if (clip.rejected) continue
        add(`clips/${clip.id}.mp4`, true)
        add(`clips/${clip.id}.jpg`, true)
        for (let size of ['phone', 'tile']) {
          let key = `hero/${clip.id}-${size}.mp4`
          if (Object.hasOwn(previous, key)) add(key, false)
        }
      }
      for (let key of PROJECT_MEDIA_KEYS) add(key, Object.hasOwn(previous, key))
      return { revision, clipsJson, directory: target, files }
    })

    let manifest: Record<string, string> = {}
    let uploads: SnapshotUpload[] = []
    for (let [key, file] of locked.files) {
      let hash = createHash('sha256').update(readFileSync(file)).digest()
      let version = hash.subarray(0, 12).toString('base64url')
      let old = previous[key]
      let same = old === version || old === hash.subarray(0, 5).toString('hex')
      if (key.startsWith('hero/')) {
        // Existing hero variants are manually made from the previously approved video. If either
        // changes, use the full clip until there is a way to certify a new variant's source version.
        let video = `clips/${clipMediaId(key)}.mp4`
        if (!same || manifest[video] !== previous[video]) continue
      }
      manifest[key] = same ? old : version
      if (!same) uploads.push(Object.freeze({ key, object: versionedMediaKey(key, version), file }))
    }
    return Object.freeze({
      revision: locked.revision,
      clipsJson: locked.clipsJson,
      directory: locked.directory,
      manifest: sortManifest(manifest),
      uploads: Object.freeze(uploads),
    })
  } catch (error) {
    if (directory) rmSync(directory, { recursive: true, force: true })
    throw error
  }
}

/** The object store can safely retry a put: the key uniquely identifies these bytes. */
export async function uploadPublishSnapshot(snapshot: PublishSnapshot, put: (entry: SnapshotUpload) => Promise<void>) {
  for (let i = 0; i < snapshot.uploads.length; i += 6) {
    let results = await Promise.allSettled(snapshot.uploads.slice(i, i + 6).map((entry) => Promise.resolve().then(() => put(entry))))
    for (let result of results) if (result.status === 'rejected') throw result.reason
  }
}

export function removePublishSnapshot(snapshot: PublishSnapshot) {
  rmSync(snapshot.directory, { recursive: true, force: true })
}
