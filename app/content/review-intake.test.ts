import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import * as assert from 'remix/assert'
import { afterAll, it } from 'remix/test'

const run = promisify(execFile)
const root = mkdtempSync(join(tmpdir(), 'review-intake-'))
const previousRoot = process.env.ANGELOOCANA_MEDIA
process.env.ANGELOOCANA_MEDIA = root
afterAll(() => {
  if (previousRoot === undefined) delete process.env.ANGELOOCANA_MEDIA
  else process.env.ANGELOOCANA_MEDIA = previousRoot
  rmSync(root, { recursive: true, force: true })
})
const { findIntake, ReviewIntakeError, stagePrivateVideo } = await import('./review-intake.ts')
const { cleanPieces, clipSource, loadItems, loadSources, sourceFile } = await import('./cuts.ts')

function post(body: BodyInit, length?: number) {
  let headers = new Headers({ 'X-Video-Extension': 'mov' })
  if (length !== undefined) headers.set('Content-Length', String(length))
  let init = { method: 'POST', body, headers, duplex: 'half' }
  return new Request('http://localhost/review/upload', init)
}

it('keeps a synthetic MOV private and makes it selectable only for its staged cut', async () => {
  let index = join(root, 'index')
  mkdirSync(index)
  let ordinary = { id: 'v000', src: 'ordinary.mp4', path: 'ordinary.mp4', source: 'Phone', ts: 0, dur: 2, w: 64, h: 96 }
  writeFileSync(join(index, 'items.json'), JSON.stringify([ordinary]))
  let moments = join(root, 'work', 'moments')
  mkdirSync(moments, { recursive: true })
  writeFileSync(join(moments, 'v001.json'), '{}') // Do not reuse a stale moments cache.
  let fixture = join(root, 'private-fixture-name.mov')
  await run('ffmpeg', [
    '-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=64x96:rate=12', '-t', '1.25',
    '-c:v', 'mpeg4', '-threads', '1', '-metadata', 'comment=synthetic-private-tag', fixture,
  ], { timeout: 15_000 })
  let bytes = readFileSync(fixture)
  let publicClips = new URL('./clips.json', import.meta.url)
  let before = readFileSync(publicClips, 'utf8')
  let file = new File([bytes], 'private-fixture-name.mov', { type: 'video/quicktime' })
  let { clipId, sourceId } = await stagePrivateVideo(post(file, file.size))
  assert.match(clipId, /^c[0-9a-f]{8}$/)
  assert.equal(sourceId, 'v002')
  let staged = findIntake(clipId)
  assert.ok(staged)
  assert.match(staged.path, /^sources\/uploads\/[0-9a-f-]{36}\.mov$/)
  assert.deepEqual(staged, {
    id: sourceId, src: staged.path, path: staged.path, source: 'Upload', ts: staged.ts,
    privateFor: clipId, dur: 1.25, w: 64, h: 96,
  })
  assert.deepEqual(loadItems(root), [ordinary, staged])
  assert.deepEqual(loadSources().map((it) => it.id), ['v000'])
  assert.deepEqual(loadSources('c00000000', root).map((it) => it.id), ['v000'])
  assert.deepEqual(loadSources(clipId, root).map((it) => it.id), [sourceId, 'v000'])
  assert.equal(clipSource(clipId), staged.path)
  assert.equal(sourceFile(staged.path), join(root, staged.path))
  assert.deepEqual(readFileSync(join(root, staged.path)), bytes)
  assert.equal(cleanPieces([{ path: staged.path }]), 'Unknown source video')
  assert.ok(Array.isArray(cleanPieces([{ path: staged.path }], clipId)))
  assert.deepEqual(readdirSync(join(root, 'work')).sort(), ['moments', 'review-data.lock'])
  assert.equal(existsSync(join(root, 'media')), false)
  assert.equal(readFileSync(publicClips, 'utf8'), before)
})

it('rejects an oversized declaration or non-video bytes without leaving any upload state', async () => {
  let empty = mkdtempSync(join(root, 'invalid-'))
  async function rejects(request: Request, status: number) {
    await assert.rejects(stagePrivateVideo(request, empty), (error: unknown) => error instanceof ReviewIntakeError && error.status === status)
  }
  await rejects(post('not a video', 256 * 1024 * 1024 + 1), 413)
  assert.deepEqual(readdirSync(empty), [])
  await rejects(post('not a video'), 422)
  assert.deepEqual(readdirSync(empty), ['work'])
  assert.deepEqual(readdirSync(join(empty, 'work')), [])
})

it('times out and removes scratch when a streaming body stalls', async (t) => {
  let empty = mkdtempSync(join(root, 'stalled-'))
  let cancelled = false
  let body = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(12)) },
    cancel() { cancelled = true },
  })
  let clock = t.useFakeTimers()
  let pending = stagePrivateVideo(post(body), empty)
  clock.advance(180_000)
  await assert.rejects(pending, (error: unknown) => error instanceof ReviewIntakeError && error.status === 408)
  assert.equal(cancelled, true)
  assert.deepEqual(readdirSync(join(empty, 'work')), [])
})
