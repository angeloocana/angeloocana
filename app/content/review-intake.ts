// Local review intake only. Never pass the original or this catalogue entry to the publisher.
import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createWriteStream, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { promisify } from 'node:util'

import { loadClips, MEDIA_VERSIONS } from './clips.ts'
import { loadItems, sourceClipId, type Item } from './cuts.ts'
import { MEDIA_DIR } from './media-dir.ts'
import { withReviewLock, writeJsonAtomic } from './review-io.ts'
import { readReviewQueue } from './review-queue.ts'

const MAX_BYTES = 256 * 1024 * 1024
const UPLOAD_TIMEOUT = 180_000
const PROBE_TIMEOUT = 15_000
const run = promisify(execFile)

/** Expected request failures. The message is safe to return to the browser. */
export class ReviewIntakeError extends Error {
  constructor(readonly status: 400 | 408 | 413 | 415 | 422, message: string) {
    super(message)
    this.name = 'ReviewIntakeError'
  }
}

export function findIntake(clipId: string, mediaRoot = MEDIA_DIR): Item | undefined {
  if (!/^c[0-9a-f]{8}$/.test(clipId)) return undefined
  return loadItems(mediaRoot).find((it) => it.privateFor === clipId)
}

const tooLarge = () => new ReviewIntakeError(413, 'Video must be at most 256 MiB.')
const interrupted = () => new ReviewIntakeError(400, 'Video upload was interrupted.')

async function writeUpload(request: Request, file: string, declared: number | undefined) {
  let bytes = 0
  let count = new Transform({
    transform(chunk, _encoding, done) {
      bytes += chunk.length
      if (bytes > MAX_BYTES) done(tooLarge())
      else if (declared !== undefined && bytes > declared) done(new ReviewIntakeError(400, 'Video size does not match Content-Length.'))
      else done(null, chunk)
    },
  })
  let deadline = new AbortController()
  let timer = setTimeout(() => deadline.abort(), UPLOAD_TIMEOUT)
  let signal = AbortSignal.any([deadline.signal, request.signal])
  try {
    await pipeline(request.body!, count, createWriteStream(file, { flags: 'wx', mode: 0o600 }), { signal })
  } catch (error) {
    if (deadline.signal.aborted) throw new ReviewIntakeError(408, 'Video upload timed out.')
    if (request.signal.aborted) throw interrupted()
    throw error
  } finally {
    clearTimeout(timer)
  }
  if (bytes === 0) throw new ReviewIntakeError(400, 'Select a nonempty video.')
  if (declared !== undefined && bytes !== declared) throw new ReviewIntakeError(400, 'Video size does not match Content-Length.')
}

async function probeVideo(file: string, signal: AbortSignal): Promise<Pick<Item, 'w' | 'h' | 'dur'>> {
  let invalid = () => new ReviewIntakeError(422, 'Select a readable MP4 or MOV video between 1 and 180 seconds long.')
  let result: { stdout: string; stderr: string }
  try {
    result = await run('ffprobe', [
      '-v', 'error', '-max_alloc', '67108864', '-f', 'mov', '-protocol_whitelist', 'file', '-enable_drefs', '0', '-use_absolute_path', '0',
      '-threads', '1', '-i', file, '-select_streams', 'V:0', '-count_packets',
      '-show_entries', 'stream=width,height,duration,nb_read_packets:format=duration', '-of', 'json',
    ], { signal, timeout: PROBE_TIMEOUT, killSignal: 'SIGKILL', maxBuffer: 32 * 1024 })
  } catch (error) {
    let cause = error as { code?: number | string; killed?: boolean }
    if (signal.aborted) throw interrupted()
    if (typeof cause.code === 'number' || cause.killed || cause.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') throw invalid()
    // The caller sanitizes this; execFile errors can carry the path and raw probe output.
    throw error
  }
  if (result.stderr) throw invalid()
  let data: { streams?: { width?: number; height?: number; duration?: string; nb_read_packets?: string }[]; format?: { duration?: string } }
  try {
    data = JSON.parse(result.stdout)
  } catch {
    throw invalid()
  }
  let video = data.streams?.[0]
  let { width: w = 0, height: h = 0 } = video ?? {}
  let dur = Number(video?.duration)
  let duration = Number(data.format?.duration)
  let packets = Number(video?.nb_read_packets)
  // Moments scale each frame to a fixed height and keep the thumbnails in memory. Bound both sides and the aspect ratio.
  if (!Number.isInteger(w) || !Number.isInteger(h) || Math.min(w, h) < 2 || Math.max(w, h) > 8192 ||
      Math.max(w, h) / Math.min(w, h) > 8 || !Number.isSafeInteger(packets) || packets < 2 ||
      !(dur >= 1 && dur <= 180) || !(duration >= 1 && duration <= 180)) throw invalid()
  return { w, h, dur }
}

/** Reserve IDs still referred to by review data, even when a clip is not in the current public list. */
function usedClipIds(mediaRoot: string, items: Item[]): Set<string> {
  let ids = new Set(loadClips().map((it) => it.id))
  for (let it of items) {
    ids.add(sourceClipId(it.src))
    if (it.privateFor) ids.add(it.privateFor)
  }
  let queue = readReviewQueue(mediaRoot)
  if (queue) for (let it of [...queue.base, ...queue.clips]) ids.add(it.id)
  for (let name of ['montages', 'cut-drafts', 'cut-checks']) {
    let file = join(mediaRoot, 'index', `${name}.json`)
    if (!existsSync(file)) continue
    let data = JSON.parse(readFileSync(file, 'utf8'))
    for (let id of Object.keys(name === 'montages' ? data.clips : data)) ids.add(id)
  }
  return ids
}

function registerUpload(mediaRoot: string, file: string, ext: 'mp4' | 'mov', video: Pick<Item, 'w' | 'h' | 'dur'>) {
  let items = loadItems(mediaRoot)
  let used = usedClipIds(mediaRoot, items)
  let sourceIds = new Set(items.map((it) => it.id))
  let next = 0
  let sourceId: string
  do {
    sourceId = `v${String(next++).padStart(3, '0')}`
  } while (sourceIds.has(sourceId) || existsSync(join(mediaRoot, 'work', 'moments', `${sourceId}.json`)) ||
           existsSync(join(mediaRoot, 'work', 'moments', `${sourceId}.jpg`)))

  let path: string, clipId: string, original: string
  do {
    path = `sources/uploads/${randomUUID()}.${ext}`
    clipId = sourceClipId(path)
    original = join(mediaRoot, path)
  } while (used.has(clipId) || existsSync(original) || ['mp4', 'jpg'].some((ext) => {
    let key = `clips/${clipId}.${ext}`
    return Object.hasOwn(MEDIA_VERSIONS, key) || existsSync(join(mediaRoot, 'media', key))
  }))

  let index = join(mediaRoot, 'index')
  let item: Item = { id: sourceId, src: path, path, source: 'Upload', ts: Math.floor(Date.now() / 1000), ...video, privateFor: clipId }
  mkdirSync(index, { recursive: true, mode: 0o700 })
  mkdirSync(join(mediaRoot, 'sources', 'uploads'), { recursive: true, mode: 0o700 })
  renameSync(file, original)
  try {
    writeJsonAtomic(join(index, 'items.json'), [...items, item])
  } catch (error) {
    // Keep the original if the atomic write succeeded but its temporary-directory cleanup failed.
    if (!loadItems(mediaRoot).some((it) => it.path === path)) rmSync(original, { force: true })
    throw error
  }
  return { clipId, sourceId }
}

/** Accept a raw File body from the guarded review route; the caller owns HTTP and access checks. */
export async function stagePrivateVideo(request: Request, mediaRoot = MEDIA_DIR): Promise<{ clipId: string; sourceId: string }> {
  let ext = request.headers.get('x-video-extension')
  if (ext !== 'mp4' && ext !== 'mov') throw new ReviewIntakeError(415, 'Select an MP4 or MOV video.')
  let length = request.headers.get('content-length')
  if (length !== null && !/^\d+$/.test(length)) throw new ReviewIntakeError(400, 'Invalid Content-Length.')
  let declared = length === null ? undefined : Number(length)
  if (declared !== undefined && declared > MAX_BYTES) throw tooLarge()
  if (declared === 0 || !request.body || request.bodyUsed || request.body.locked) throw new ReviewIntakeError(400, 'Select a nonempty video.')

  mediaRoot = resolve(mediaRoot)
  let work = join(mediaRoot, 'work')
  try {
    mkdirSync(work, { recursive: true, mode: 0o700 })
    let scratch = mkdtempSync(join(work, '.intake-'))
    try {
      let file = join(scratch, `upload.${ext}`)
      await writeUpload(request, file, declared)
      let video = await probeVideo(file, request.signal)
      return await withReviewLock(mediaRoot, () => {
        if (request.signal.aborted) throw interrupted()
        return registerUpload(mediaRoot, file, ext, video)
      })
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  } catch (error) {
    if (error instanceof ReviewIntakeError) throw error
    // Filesystem errors and invalid catalogue JSON can contain private paths or values.
    throw new Error('Could not stage the video in the private review store.')
  }
}
