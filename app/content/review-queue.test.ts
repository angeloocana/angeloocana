import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { Clip } from './clips.ts'
import { withReviewLock } from './review-io.ts'
import { acknowledgeReviewRevision, queueReviewRevision, readReviewQueue } from './review-queue.ts'

const clip = (id: string): Clip => ({
  id, cat: 'snow', label: { en: 'Test cut', pt: 'Teste' }, star: 0, rejected: false, score: 3, source: 'montage',
})

const queueFile = (root: string) => join(root, 'work', 'review-queue.json')

describe('review queue', () => {
  it('releases the lock for recuts and edits during publish, then rebases the later revision', async () => {
    let root = mkdtempSync(join(tmpdir(), 'review-queue-'))
    let first = { ...clip('h-first'), captionRejected: true }
    let second = clip('h-second')
    let changedUpstream = clip('h-edit-upstream')
    let deletedUpstream = clip('h-delete-upstream')
    let base = [first, second, changedUpstream, deletedUpstream]
    try {
      assert.equal(readReviewQueue(root), undefined)
      let before = Date.now()
      let initial = await withReviewLock(root, () => queueReviewRevision(root, base))
      assert.ok(/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/.test(initial.revision))
      assert.ok(Number.isSafeInteger(initial.changedAt) && initial.changedAt >= before && initial.changedAt <= Date.now())
      assert.deepEqual(initial, { revision: initial.revision, changedAt: initial.changedAt, base, clips: base })

      let approved = { ...clip(first.id), star: 1 }
      let captured = await withReviewLock(root, () => queueReviewRevision(root, [], [
        { ...approved, captionRejected: undefined }, second, changedUpstream, deletedUpstream,
      ]))
      // The publisher has released the lock; a recut keeps the metadata, but starts a new revision.
      let recut = await withReviewLock(root, () => queueReviewRevision(root, []))
      assert.ok(recut.revision !== captured.revision)
      assert.deepEqual(recut.base, base)
      assert.deepEqual(recut.clips, [approved, second, changedUpstream, deletedUpstream])

      let laterFirst = { ...approved, star: 2 }
      let laterSecond = { ...second, label: { en: 'New cut', pt: 'Novo corte' } }
      let newApproval = clip('h-new-approval')
      let later = await withReviewLock(root, () => queueReviewRevision(root, [], [
        laterFirst, laterSecond, changedUpstream, deletedUpstream, newApproval,
      ]))
      assert.ok(later.revision !== recut.revision)
      let gitAddition = clip('h-git-addition')
      let gitEdit = { ...changedUpstream, star: 3 }
      let published = [gitAddition, gitEdit, second, { ...approved, label: { pt: 'Teste', en: 'Test cut' } }]
      await withReviewLock(root, () => acknowledgeReviewRevision(root, {
        revision: captured.revision, desired: captured.clips, published,
      }))
      let expected = {
        revision: later.revision, changedAt: later.changedAt,
        base: published, clips: [gitAddition, gitEdit, laterSecond, laterFirst, newApproval],
      }
      assert.deepEqual(readReviewQueue(root), expected)
      assert.deepEqual(JSON.parse(readFileSync(queueFile(root), 'utf8')), expected)

      // With no later revision, keep the exact published list, not the captured desired list.
      let publishedAgain = [...expected.clips, clip('h-another-git-addition')]
      await withReviewLock(root, () => acknowledgeReviewRevision(root, {
        revision: later.revision, desired: expected.clips, published: publishedAgain,
      }))
      assert.deepEqual(readReviewQueue(root), { ...expected, base: publishedAgain, clips: publishedAgain })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('reports a record conflict without values and leaves the pending queue byte-identical', async () => {
    let root = mkdtempSync(join(tmpdir(), 'review-conflict-'))
    let base = [clip('h-synthetic-conflict')]
    try {
      let captured = await withReviewLock(root, () => queueReviewRevision(root, base))
      await withReviewLock(root, () => queueReviewRevision(root, base, [
        { ...base[0], label: { en: 'Pending caption', pt: 'Legenda pendente' } },
      ]))
      let before = readFileSync(queueFile(root))
      await assert.rejects(withReviewLock(root, () => acknowledgeReviewRevision(root, {
        revision: captured.revision, desired: captured.clips, published: [{ ...base[0], star: 3 }],
      })), /^Error: Review conflict at published clip 1 \(label, star\)\. Reconcile the reviewed and published versions of this record, then retry\.$/)
      assert.deepEqual(readFileSync(queueFile(root)), before)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
