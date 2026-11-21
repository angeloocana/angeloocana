import { spawn } from 'node:child_process'
import { closeSync, fsyncSync, mkdirSync, openSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { clipMediaId, isPublicMediaKey, versionedMediaKey } from '../app/content/media-keys.ts'
import { writeJsonAtomic } from '../app/content/review-io.ts'
import type { SnapshotUpload } from './publish-snapshot.ts'

/** Operations may be retried after ambiguous failures; removing an absent object succeeds. */
export interface ObjectStore {
  put(object: string, file: string): Promise<void>
  remove(object: string): Promise<void>
}

// Match scripts/media-push.ts without importing its top-level publishing code.
const BUCKET = 'angeloocana-media'
const WRANGLER = ['-y', 'wrangler@4.151.1']
const WRANGLER_TIMEOUT = 120_000

function versionedLogicalKey(object: string): string | undefined {
  let parts = /^versions\/([^/]+)\/(.+)$/.exec(object)
  if (!parts) return
  let [, version, key] = parts
  try {
    if (versionedMediaKey(key, version) === object) return key
  } catch { /* An unknown object must not reach the store. */ }
}

function objectClipId(object: string): string | undefined {
  return clipMediaId(versionedLogicalKey(object) ?? object)
}

function wrangler(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    // Stay in the publisher guardian's process group, which it stops before releasing the lock.
    // Raw CLI output can contain private paths or credentials; don't put it in the publish log.
    let child = spawn('npx', [...WRANGLER, 'r2', 'object', ...args, '--remote'], { stdio: 'ignore' })
    let timedOut = false
    let timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, WRANGLER_TIMEOUT)
    child.once('error', () => {
      clearTimeout(timer)
      reject(new Error('Could not start the Wrangler media command'))
    })
    child.once('close', (code) => {
      clearTimeout(timer)
      if (timedOut) reject(new Error('Wrangler media command timed out'))
      else if (code === 0) resolve()
      else reject(new Error('Wrangler media command failed'))
    })
  })
}

export function makeR2ObjectStore(): ObjectStore {
  return {
    async put(object, file) {
      let key = versionedLogicalKey(object)
      if (!key) throw new Error('Invalid upload object')
      let type = key.endsWith('.mp4') ? 'video/mp4' : key.endsWith('.jpg') ? 'image/jpeg' : 'image/webp'
      await wrangler(['put', `${BUCKET}/${object}`, '--file', file, '--content-type', type])
    },
    async remove(object) {
      if (!objectClipId(object)) throw new Error('Invalid clip removal object')
      await wrangler(['delete', `${BUCKET}/${object}`])
    },
  }
}

type Manifest = Readonly<Record<string, string>>
type Status = 'attempted' | 'available' | 'delete-pending' | 'deleted'
type Ledger = Partial<Record<string, Status>>
const tombstoned = (status: unknown) => status === 'delete-pending' || status === 'deleted'

function record(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false
  let prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function manifestEntries(manifest: Manifest) {
  if (!record(manifest)) throw new Error('Invalid review media manifest')
  return Object.entries(manifest).map(([key, version]) => {
    if (!isPublicMediaKey(key) || typeof version !== 'string') throw new Error('Invalid review media manifest')
    if (/^[0-9a-f]{10}$/.test(version)) return { key, version, object: key }
    try {
      return { key, version, object: versionedMediaKey(key, version) }
    } catch {
      throw new Error('Invalid review media manifest')
    }
  })
}

function readLedger(path: string): Ledger {
  let json: string
  try {
    json = readFileSync(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw new Error('Cannot read review media state')
  }
  try {
    let data: unknown = JSON.parse(json)
    if (!record(data)) throw new Error()
    for (let [object, status] of Object.entries(data)) {
      if (status !== 'attempted' && status !== 'available' && !tombstoned(status)) throw new Error()
      if (!versionedLogicalKey(object) && !(clipMediaId(object) && tombstoned(status))) throw new Error()
    }
    return data as Ledger
  } catch {
    throw new Error('Invalid review media state')
  }
}

function syncPath(path: string) {
  let fd = openSync(path, 'r')
  try {
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
}

/** The caller holds the publish execution lock for this handle's entire use, not the review-data lock.
 * Uploads in a batch may overlap, but must settle before the caller begins cleanup or releases that lock.
 */
export function openReviewMedia(mediaRoot: string, store: ObjectStore) {
  let work = join(mediaRoot, 'work')
  let path = join(work, 'review-publish-media.json')
  let ledger = readLedger(path)

  function save(next: Ledger) {
    try {
      mkdirSync(work, { recursive: true, mode: 0o700 })
      writeJsonAtomic(path, next)
      syncPath(path)
      syncPath(work)
      syncPath(mediaRoot)
    } catch {
      throw new Error('Cannot persist review media state')
    }
    ledger = next
  }

  // Update synchronously around each store call, so parallel puts cannot lose another entry.
  function setStatus(object: string, status: Status) {
    if (ledger[object] !== status) save({ ...ledger, [object]: status })
  }

  return {
    async upload({ key, object, file }: SnapshotUpload): Promise<void> {
      let logicalKey = versionedLogicalKey(object)
      if (!logicalKey || logicalKey !== key) throw new Error('Invalid snapshot upload object')
      let status = ledger[object]
      // A restore may recreate a deleted object even if its put fails. Keep the tombstone
      // but make it eligible for removal again until a put is acknowledged.
      setStatus(object, tombstoned(status) ? 'delete-pending' : status ?? 'attempted')
      try {
        await store.put(object, file)
      } catch {
        throw new Error('Review media upload failed')
      }
      setStatus(object, 'available')
    },

    availableManifest(prior: Manifest): Record<string, string> {
      return Object.fromEntries(manifestEntries(prior)
        .filter(({ object }) => !tombstoned(ledger[object]))
        .map(({ key, version }) => [key, version]))
    },

    async removeRejected(ids: readonly string[], manifests: readonly Manifest[]): Promise<void> {
      let rejected = new Set(ids)
      let objects = new Set<string>()
      for (let id of rejected) {
        if (typeof id !== 'string' || clipMediaId(`clips/${id}.mp4`) !== id) throw new Error('Invalid rejected clip ID')
        for (let key of [`clips/${id}.mp4`, `clips/${id}.jpg`, `hero/${id}-phone.mp4`, `hero/${id}-tile.mp4`]) objects.add(key)
      }
      for (let manifest of manifests) {
        for (let { key, object } of manifestEntries(manifest)) {
          let id = clipMediaId(key)
          if (id && rejected.has(id)) objects.add(object)
        }
      }
      for (let object of Object.keys(ledger)) {
        let id = objectClipId(object)
        if (id && rejected.has(id)) objects.add(object)
      }
      let pending = [...objects].filter((object) => ledger[object] !== 'deleted')
      if (!pending.length) return
      if (pending.some((object) => ledger[object] !== 'delete-pending')) {
        let next = { ...ledger }
        for (let object of pending) next[object] = 'delete-pending'
        save(next)
      }
      let failures = 0
      for (let i = 0; i < pending.length; i += 6) {
        let batch = pending.slice(i, i + 6)
        let results = await Promise.allSettled(batch.map(async (object) => store.remove(object)))
        for (let [offset, result] of results.entries()) {
          if (result.status === 'fulfilled') setStatus(batch[offset], 'deleted')
          else failures++
        }
      }
      if (failures) throw new Error(`Review media removal failed for ${failures} object(s)`)
    },
  }
}
