import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isDeepStrictEqual } from 'node:util'

import type { Clip } from './clips.ts'
import { assertPublicClipData } from './public-clip-data.ts'
import { writeJsonAtomic } from './review-io.ts'

export type ReviewQueue = {
  revision: string
  changedAt: number
  base: Clip[]
  clips: Clip[]
}

const queuePath = (mediaRoot: string) => join(mediaRoot, 'work', 'review-queue.json')
const uuid = /^[\da-f]{8}-(?:[\da-f]{4}-){2}[89ab][\da-f]{3}-[\da-f]{12}$/i

export function readReviewQueue(mediaRoot: string): ReviewQueue | undefined {
  let json: string
  try {
    json = readFileSync(queuePath(mediaRoot), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }

  let queue: Partial<ReviewQueue> | null
  try {
    queue = JSON.parse(json)
  } catch {
    // The parser's error can include the contents of a corrupt private file.
    throw new Error('Invalid review queue JSON.')
  }
  if (!queue || typeof queue !== 'object' || Object.keys(queue).length !== 4 ||
      typeof queue.revision !== 'string' || !uuid.test(queue.revision) ||
      typeof queue.changedAt !== 'number' || !Number.isSafeInteger(queue.changedAt) || queue.changedAt < 0) {
    throw new Error('Invalid review queue document: expected revision, changedAt, base and clips.')
  }
  assertPublicClipData(queue.base)
  assertPublicClipData(queue.clips)
  return queue as ReviewQueue
}

function writeReviewQueue(mediaRoot: string, queue: ReviewQueue): void {
  assertPublicClipData(queue.base)
  assertPublicClipData(queue.clips)
  writeJsonAtomic(queuePath(mediaRoot), queue)
}

/** Call under the shared review lock. A recut queues a revision without changing the metadata. */
export function queueReviewRevision(mediaRoot: string, fallback: Clip[], updated?: Clip[]): ReviewQueue {
  let pending = readReviewQueue(mediaRoot)
  let queue = {
    revision: randomUUID(),
    changedAt: Date.now(),
    base: pending?.base ?? fallback,
    clips: updated ?? pending?.clips ?? fallback,
  }
  writeReviewQueue(mediaRoot, queue)
  return queue
}

function indexClips(clips: Clip[]): Map<string, Clip> {
  assertPublicClipData(clips)
  // Compare public JSON records: a route can unset an optional field by assigning undefined.
  let records = JSON.parse(JSON.stringify(clips)) as Clip[]
  return new Map(records.map((clip) => [clip.id, clip]))
}

/** Replay the reviewed changes onto remote at record granularity, keeping remote's order. */
export function mergeReviewClips(base: Clip[], reviewed: Clip[], remote: Clip[]): Clip[] {
  let previous = indexClips(base)
  let local = indexClips(reviewed)
  let upstream = indexClips(remote)
  let merged: Clip[] = []
  for (let id of new Set([...upstream.keys(), ...local.keys()])) {
    let before = previous.get(id)
    let edited = local.get(id)
    let published = upstream.get(id)
    let result = published
    if (!isDeepStrictEqual(edited, before) && !isDeepStrictEqual(edited, published)) {
      if (!isDeepStrictEqual(published, before)) {
        let position = published
          ? `published clip ${remote.findIndex((clip) => clip.id === id) + 1}`
          : `reviewed clip ${reviewed.findIndex((clip) => clip.id === id) + 1}`
        let fields = 'record added or deleted'
        if (edited && published) {
          let keys = new Set([...Object.keys(edited), ...Object.keys(published)] as (keyof Clip)[])
          fields = [...keys].filter((key) => !isDeepStrictEqual(edited[key], published[key])).join(', ')
        }
        // A list position and public field names are enough; never echo IDs or field values.
        throw new Error(`Review conflict at ${position} (${fields}). Reconcile the reviewed and published versions of this record, then retry.`)
      }
      result = edited
    }
    if (result) merged.push(result)
  }
  return merged
}

/** Call under the shared review lock after a push. Keep changes made while it was running. */
export function acknowledgeReviewRevision(
  mediaRoot: string,
  snapshot: { revision: string; desired: Clip[]; published: Clip[] },
): void {
  let pending = readReviewQueue(mediaRoot)
  if (!pending) throw new Error('Review queue is missing; cannot acknowledge the published revision.')
  let { revision, desired, published } = snapshot
  let clips = pending.revision === revision ? published : mergeReviewClips(desired, pending.clips, published)
  writeReviewQueue(mediaRoot, { ...pending, base: published, clips })
}
