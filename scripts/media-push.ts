// Manual uploader for a branch: upload an immutable snapshot, then write its two JSON files.
// The automated publisher uses the same snapshot/storage modules, but owns its own Git commit.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { MEDIA_DIR } from '../app/content/media-dir.ts'
import { withReviewLock, writeJsonAtomic } from '../app/content/review-io.ts'
import { capturePublishSnapshot, removePublishSnapshot, uploadPublishSnapshot } from './publish-snapshot.ts'
import { makeR2ObjectStore, openReviewMedia } from './review-publish-media.ts'
import { parseManifest } from './review-release.ts'

const CLIPS = new URL('../app/content/clips.json', import.meta.url)
const MANIFEST = new URL('../app/content/media.json', import.meta.url)
const READ = () => readFileSync(CLIPS, 'utf8')
const dryRun = process.argv[2] === '--dry-run' && process.argv.length === 3

if (process.argv.length > 2 && !dryRun) throw new Error('Usage: npm run media:push -- [--dry-run]')
// An old launchd publisher may still invoke the old script name immediately after an upgrade.
if (process.env.REVIEW_AUTOPUBLISH === '1') throw new Error('Restart the idle review server to use the new publisher.')

if (process.env.REVIEW_PUBLISH_LOCKED !== '1') {
  let result = spawnSync(process.env.PYTHON ?? 'python3', [
    fileURLToPath(new URL('./clips/review_io.py', import.meta.url)), '--publish-lock', MEDIA_DIR,
    process.execPath, '--import', 'remix/node-tsx', fileURLToPath(import.meta.url), ...process.argv.slice(2),
  ], { stdio: 'inherit' })
  if (result.status === 75) console.error('A review release or takedown is using the media store. Try again later.')
  process.exitCode = result.status ?? 1
} else {
  let media = openReviewMedia(MEDIA_DIR, makeR2ObjectStore())
  let prior = readFileSync(MANIFEST, 'utf8')
  let original = ''
  let snapshot = await capturePublishSnapshot(MEDIA_DIR, () => ({ revision: 'manual', clipsJson: original = READ() }),
    media.availableManifest(parseManifest(prior)))
  try {
    console.log(`${Object.keys(snapshot.manifest).length} approved media files; ${snapshot.uploads.length} versioned uploads.`)
    if (dryRun) {
      for (let { object } of snapshot.uploads) console.log(`Would upload ${object}`)
    } else {
      await uploadPublishSnapshot(snapshot, media.upload)
      await withReviewLock(MEDIA_DIR, () => {
        if (READ() !== original || readFileSync(MANIFEST, 'utf8') !== prior) {
          throw new Error('Clip data changed during the upload. Retry before committing.')
        }
        if (original !== snapshot.clipsJson) writeJsonAtomic(CLIPS, JSON.parse(snapshot.clipsJson))
        writeJsonAtomic(MANIFEST, snapshot.manifest, 2)
      })
      console.log('Commit the captured clips.json and media.json together. No objects were removed.')
    }
  } finally {
    removePublishSnapshot(snapshot)
  }
}
