import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as assert from 'remix/assert'
import { it } from 'remix/test'

it('picks a MOV, renders a private cut and queues only the explicitly approved result', async (t) => {
  let root = mkdtempSync(join(tmpdir(), 'review-intake-route-'))
  let previous = { NODE_ENV: process.env.NODE_ENV, ANGELOOCANA_MEDIA: process.env.ANGELOOCANA_MEDIA, REVIEW_AUTOPUBLISH: process.env.REVIEW_AUTOPUBLISH }
  t.after(() => {
    for (let [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
    rmSync(root, { recursive: true, force: true })
  })
  Object.assign(process.env, { NODE_ENV: 'development', ANGELOOCANA_MEDIA: root, REVIEW_AUTOPUBLISH: '0' })
  let { router } = await import('../router.ts')
  let { findIntake } = await import('../content/review-intake.ts')
  let { readReviewQueue } = await import('../content/review-queue.ts')
  let url = 'http://127.0.0.1'
  let get = (path: string) => router.fetch(new Request(url + path))
  let post = (path: string, data: unknown) => router.fetch(new Request(url + path, { method: 'POST', headers: { Origin: url, 'Content-Type': 'application/json' }, body: JSON.stringify(data) }))
  let mov = join(root, 'fixture.mov')
  execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=96x160:rate=15', '-t', '2.2', '-an', '-c:v', 'libx264', '-metadata', 'title=private-fixture', mov])
  let upload = (origin: string) => router.fetch(new Request(`${url}/review/intake`, { method: 'POST', headers: { Origin: origin, 'X-Video-Extension': 'mov' }, body: new Blob([readFileSync(mov)]) }))
  assert.equal((await upload('http://different.test')).status, 403)
  let response = await upload(url)
  assert.equal(response.status, 201)
  let { clipId: id, sourceId } = await response.json() as { clipId: string; sourceId: string }
  let path = `/review/cut/${id}`
  let item = findIntake(id)!
  assert.match(await (await get(path)).text(), /Render private preview/)
  assert.equal((await get(`/review/moments/${sourceId}`)).status, 404)
  assert.equal((await get(`/review/source?path=${encodeURIComponent(item.path)}`)).status, 404)
  let moments = await get(`/review/moments/${sourceId}?cut=${id}`)
  assert.equal(moments.status, 200)
  let { sheet } = await moments.json() as { sheet: string }
  assert.equal((await get(sheet)).headers.get('Cache-Control'), 'no-store')

  let piece = { kind: 'vid', path: item.path, start: 0.4, secs: 0.8, cx: 0.5, zoom: 1, cy: 0.5 }
  let render = () => post(path, { action: 'render-preview', pieces: [piece] })
  let rendered = await render()
  assert.equal(rendered.status, 200)
  let { revision, video } = await rendered.json() as { revision: string; video: string }
  let range = await router.fetch(new Request(url + video, { headers: { Range: 'bytes=0-15' } }))
  assert.equal(range.status, 206, `${video}: ${range.status === 206 ? '' : await range.text()} (${readdirSync(join(root, 'work', 'intake', id, revision)).join(', ')})`)
  assert.equal(range.headers.get('Cache-Control'), 'no-store')
  assert.equal(range.headers.get('Cross-Origin-Resource-Policy'), 'same-origin')
  assert.equal((await range.arrayBuffer()).byteLength, 16)
  for (let [name, value] of [['Sec-Fetch-Site', 'same-site'], ['Origin', 'https://foreign.invalid']]) {
    let headers = new Headers([[name, value]])
    for (let target of [video, sheet, `/review/source?path=${encodeURIComponent(item.path)}&cut=${id}`]) {
      assert.equal((await router.fetch(new Request(url + target, { headers }))).status, 403)
    }
  }
  assert.equal((await get(`/media/clips/${id}.mp4`)).status, 404)
  assert.equal(readReviewQueue(root), undefined)
  assert.equal(existsSync(join(root, 'work', 'publish.json')), false)
  assert.doesNotMatch(await (await get('/data/clips.json')).text(), new RegExp(id))

  let approval = { action: 'approve', revision, cat: 'nature', label: { en: '  Color bars  ', pt: '' }, captionRejected: true }
  assert.equal((await post(path, approval)).status, 409) // Standalone development cannot approve.
  process.env.REVIEW_AUTOPUBLISH = '1' // A successful write only schedules a 2-minute wake; disable it before assertions.
  let denied = await post(path, { ...approval, label: { en: 'A @private handle', pt: '' } })
  assert.equal(denied.status, 422)
  assert.doesNotMatch(await denied.text(), /@private/)
  assert.equal((await post(path, { action: 'save-preview', pieces: [{ ...piece, start: 0.5 }] })).status, 200)
  assert.equal((await get(video)).status, 404)
  assert.equal((await post(path, approval)).status, 409)
  assert.equal(readReviewQueue(root), undefined)
  rendered = await render()
  assert.equal(rendered.status, 200)
  ;({ revision, video } = await rendered.json() as { revision: string; video: string })

  // Die after replacing items.json but before writing the new queue, bypassing exception cleanup.
  let crash = spawnSync(process.env.PYTHON ?? 'python3', ['-B', '-c', `
import os, sys, clips, review_io
write = review_io.write_json_atomic
def interrupted(path, data):
    if str(path) == clips.REVIEW_QUEUE:
        os._exit(77)
    write(path, data)
review_io.write_json_atomic = interrupted
clips.approve_intake(sys.argv[1])
`, id], {
    cwd: fileURLToPath(new URL('../../scripts/clips/', import.meta.url)),
    input: JSON.stringify({ revision, clip: { id, cat: 'nature', label: { en: 'Color bars', pt: 'Natureza' }, star: 0, rejected: false, score: 3, source: 'phone', captionRejected: true } }),
    encoding: 'utf8', timeout: 20_000,
  })
  assert.equal(crash.status, 77, crash.stderr)
  assert.equal(findIntake(id), undefined)
  assert.equal(existsSync(join(root, 'work', '.review-promotion')), true)
  assert.match(await (await get('/review')).text(), new RegExp(`href="${path}">Continue private cut`))
  assert.equal(findIntake(id)?.id, sourceId)
  assert.equal(existsSync(join(root, 'work', '.review-promotion')), false)
  assert.equal((await get(`/review/source?path=${encodeURIComponent(item.path)}`)).status, 404)
  assert.equal((await get(`/media/clips/${id}.mp4`)).status, 404)
  assert.equal(readReviewQueue(root), undefined)

  let approved = await post(path, { ...approval, revision })
  process.env.REVIEW_AUTOPUBLISH = '0'
  assert.equal(approved.status, 200)
  assert.deepEqual(await approved.json(), { added: true })
  assert.deepEqual(readdirSync(join(root, 'media', 'clips')).sort(), [`${id}.jpg`, `${id}.mp4`])
  assert.deepEqual(readReviewQueue(root)?.clips.find((clip) => clip.id === id), {
    id, cat: 'nature', label: { en: 'Color bars', pt: 'Natureza' }, star: 0, rejected: false, score: 3, source: 'phone', captionRejected: true,
  })
  let accepted = readReviewQueue(root)
  let publishedPair = ['jpg', 'mp4'].map((ext) => readFileSync(join(root, 'media', 'clips', `${id}.${ext}`)))
  process.env.REVIEW_AUTOPUBLISH = '1'
  for (let action of ['save-preview', 'render-preview', 'discard-preview']) {
    assert.equal((await post(path, { action, pieces: [{ ...piece, start: 0.8 }] })).status, 409)
  }
  process.env.REVIEW_AUTOPUBLISH = '0'
  assert.deepEqual(readReviewQueue(root), accepted)
  assert.deepEqual(['jpg', 'mp4'].map((ext) => readFileSync(join(root, 'media', 'clips', `${id}.${ext}`))), publishedPair)
  assert.equal(findIntake(id), undefined)
  assert.equal((await get(video)).status, 404)
  assert.doesNotMatch(await (await get('/data/clips.json')).text(), new RegExp(id)) // Approval is queued, not shipped.
})
