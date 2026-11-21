import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import * as assert from 'remix/assert'
import { it } from 'remix/test'

import { versionedMediaKey } from '../app/content/media-keys.ts'
import { capturePublishSnapshot, uploadPublishSnapshot } from './publish-snapshot.ts'
import { openReviewMedia, type ObjectStore } from './review-publish-media.ts'

const version = (bytes: string) => createHash('sha256').update(bytes).digest().subarray(0, 12).toString('base64url')

it('recovers partial uploads, removes only rejected clips, and re-uploads a restored object', async () => {
  let root = mkdtempSync(join(tmpdir(), 'review-media-'))
  let id = 'h-fixture'
  let video = `clips/${id}.mp4`
  let poster = `clips/${id}.jpg`
  let phone = `hero/${id}-phone.mp4`
  let tile = `hero/${id}-tile.mp4`
  let other = `clips/${id}-phone.mp4`
  let project = 't2f/desktop.webp'
  let legacy = '0011223344'
  let videoVersion = version('fixture video')
  let videoObject = versionedMediaKey(video, videoVersion)
  let oldVersion = version('earlier video')
  let oldObject = versionedMediaKey(video, oldVersion)
  let tileVersion = version('historical tile')
  let tileObject = versionedMediaKey(tile, tileVersion)
  let otherVersion = version('other clip')
  let otherObject = versionedMediaKey(other, otherVersion)
  let phoneObject = versionedMediaKey(phone, version('attempted phone'))
  let projectVersion = version('project image')
  let projectObject = versionedMediaKey(project, projectVersion)
  let r2 = new Set([video, poster, phone, tile, oldObject, tileObject, otherObject, project])
  let removals: string[] = []
  let statusesAtPut = new Map<string, string>()
  let statusesAtRemove = new Map<string, string>()
  let failPut = true
  let failRemove = true
  let statePath = join(root, 'work', 'review-publish-media.json')
  let store: ObjectStore = {
    async put(object, file) {
      statusesAtPut.set(object, JSON.parse(readFileSync(statePath, 'utf8'))[object])
      if (object === videoObject) assert.equal(readFileSync(file, 'utf8'), 'fixture video')
      r2.add(object)
      // The put reached storage, but the caller never received its acknowledgement.
      if (failPut && object === videoObject) throw new Error(file)
    },
    async remove(object) {
      statusesAtRemove.set(object, JSON.parse(readFileSync(statePath, 'utf8'))[object])
      removals.push(object)
      r2.delete(object)
      if (failRemove && object === videoObject) throw new Error('unconfirmed removal')
    },
  }
  let fixture = (key: string, bytes: string) => {
    let path = join(root, 'media', key)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, bytes)
    return path
  }
  try {
    let media = openReviewMedia(root, store)
    let clipsJson = JSON.stringify([{
      id, rejected: false, cat: 'ice', label: { en: 'Test cut', pt: 'Teste' }, star: 0, score: 3, source: 'montage',
    }])
    fixture(video, 'fixture video')
    fixture(poster, 'fixture poster')
    let first = await capturePublishSnapshot(root, () => ({ revision: 'test', clipsJson }), { [poster]: version('fixture poster') })
    // Exercise concurrent writes to the journal, including project assets and a hero version.
    let uploads = [
      ...first.uploads,
      { key: phone, object: phoneObject, file: fixture(phone, 'attempted phone') },
      { key: project, object: projectObject, file: fixture(project, 'project image') },
    ]
    await assert.rejects(() => uploadPublishSnapshot({ ...first, uploads }, media.upload), /^Error: Review media upload failed$/)
    assert.deepEqual([...statusesAtPut.entries()].sort(),
      [videoObject, phoneObject, projectObject].sort().map((object) => [object, 'attempted']))
    assert.deepEqual(removals, []) // An upload fault must not trigger implicit cleanup.

    media = openReviewMedia(root, store)
    let committed = { [poster]: legacy, [other]: otherVersion, [project]: projectVersion }
    let prior = { ...committed, [video]: videoVersion }
    let history = { [video]: oldVersion, [tile]: tileVersion, [project]: legacy }
    await assert.rejects(() => media.removeRejected([id], [committed, history]), /Review media removal failed for 1 object/)
    let rejected = [video, poster, phone, tile, videoObject, oldObject, phoneObject, tileObject].sort()
    assert.deepEqual([...removals].sort(), rejected)
    assert.deepEqual([...statusesAtRemove.entries()].sort(), rejected.map((object) => [object, 'delete-pending']))
    assert.deepEqual([...r2].sort(), [otherObject, project, projectObject].sort())

    media = openReviewMedia(root, store)
    assert.deepEqual(media.availableManifest(prior), { [other]: otherVersion, [project]: projectVersion })
    assert.deepEqual(media.availableManifest(history), { [project]: legacy })
    let restored = await capturePublishSnapshot(root, () => ({ revision: 'restore', clipsJson }),
      media.availableManifest({ [video]: videoVersion, [poster]: legacy }))
    let replacement = restored.uploads.find((entry) => entry.key === video)
    assert.ok(replacement)
    assert.equal(replacement.object, videoObject)

    failRemove = false
    removals.length = 0
    await media.removeRejected([id], []) // Retry from the journal, even without the previous manifests.
    assert.deepEqual(removals, [videoObject])
    assert.equal(r2.has(videoObject), false)
    assert.deepEqual(media.availableManifest(prior), { [other]: otherVersion, [project]: projectVersion })

    failPut = false
    await media.upload(replacement)
    assert.equal(statusesAtPut.get(videoObject), 'delete-pending')
    assert.equal(r2.has(videoObject), true)
    media = openReviewMedia(root, store)
    assert.deepEqual(media.availableManifest(prior), { [video]: videoVersion, [other]: otherVersion, [project]: projectVersion })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
