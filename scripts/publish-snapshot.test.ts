import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { withReviewLock, writeJsonAtomic } from '../app/content/review-io.ts'
import { capturePublishSnapshot, removePublishSnapshot, uploadPublishSnapshot } from './publish-snapshot.ts'

const hash = (bytes: string) => createHash('sha256').update(bytes).digest()
const version = (bytes: string) => hash(bytes).subarray(0, 12).toString('base64url')
const legacy = (bytes: string) => hash(bytes).subarray(0, 5).toString('hex')
const clip = (id: string, rejected = false) => ({
  id, rejected, cat: 'ice', label: { en: 'Test cut', pt: 'Teste' }, star: 0, score: 3, source: 'montage',
})

describe('publish snapshot', () => {
  it('uploads one revision even if clips are re-cut and rejected while uploading', async () => {
    let root = mkdtempSync(join(tmpdir(), 'review-snapshot-'))
    let writeMedia = (key: string, text: string) => {
      let path = join(root, 'media', key)
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, text)
    }
    let review = join(root, 'review.json')
    let readReview = () => JSON.parse(readFileSync(review, 'utf8')) as { revision: string; clipsJson: string }
    let saveReview = (revision: string, clips: unknown) => writeJsonAtomic(review, { revision, clipsJson: JSON.stringify(clips) })
    let video = 'clips/c12345678.mp4'
    let poster = 'clips/c12345678.jpg'
    let heroVideo = 'clips/h-glacier.mp4'
    let heroPoster = 'clips/h-glacier.jpg'
    let heroPhone = 'hero/h-glacier-phone.mp4'
    let heroTile = 'hero/h-glacier-tile.mp4'
    try {
      writeMedia(video, 'first video')
      writeMedia(poster, 'first poster')
      writeMedia(heroVideo, 'old hero')
      writeMedia(heroPoster, 'old hero poster')
      writeMedia(heroPhone, 'old phone variant')
      writeMedia(heroTile, 'old tile variant')
      writeMedia('t2f/desktop.webp', 'approved screenshot')
      writeMedia('t2f/private.webp', 'never approved')
      writeMedia('clips/c00000000.mp4', 'orphaned')
      saveReview('1', [clip('c12345678'), clip('h-glacier')])
      let old = {
        [heroVideo]: legacy('old hero'),
        [heroPhone]: legacy('old phone variant'),
        [heroTile]: legacy('old tile variant'),
      }
      let first = await capturePublishSnapshot(root, readReview, old)
      let reached = Promise.withResolvers<void>()
      let resume = Promise.withResolvers<void>()
      let r2 = new Map<string, string>()
      let upload = uploadPublishSnapshot(first, async (entry) => {
        reached.resolve()
        await resume.promise
        r2.set(entry.object, readFileSync(entry.file, 'utf8'))
      })
      try {
        await Promise.race([reached.promise, upload])
        await withReviewLock(root, () => {
          writeMedia(video, 'second video')
          writeMedia(poster, 'second poster')
          saveReview('2', [clip('c12345678'), clip('h-glacier', true)])
        })
      } finally {
        resume.resolve()
        await upload
      }
      assert.equal(first.revision, '1')
      assert.deepEqual(JSON.parse(first.clipsJson), [clip('c12345678'), clip('h-glacier')])
      assert.equal(r2.get(`versions/${version('first video')}/${video}`), 'first video')
      assert.equal(r2.get(`versions/${version('first poster')}/${poster}`), 'first poster')
      assert.equal(first.manifest[video], version('first video'))
      assert.equal(first.manifest[poster], version('first poster'))
      assert.equal(first.manifest[heroPhone], old[heroPhone])
      assert.equal(first.manifest[heroTile], old[heroTile])
      assert.ok(first.manifest['t2f/desktop.webp'])
      assert.equal(r2.size, 4) // recut pair, hero poster and screenshot; no legacy keys overwritten
      assert.equal(first.manifest['t2f/private.webp'], undefined)
      assert.equal(first.manifest['clips/c00000000.mp4'], undefined)

      let next = await capturePublishSnapshot(root, readReview, first.manifest)
      assert.equal(next.revision, '2')
      assert.deepEqual(JSON.parse(next.clipsJson), [clip('c12345678'), clip('h-glacier', true)])
      assert.equal(next.manifest[video], version('second video'))
      for (let key of [heroVideo, heroPoster, heroPhone, heroTile]) assert.equal(next.manifest[key], undefined)
      removePublishSnapshot(first)
      removePublishSnapshot(next)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
