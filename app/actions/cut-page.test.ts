import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as assert from 'remix/assert'
import { afterAll, it } from 'remix/test'

let root = mkdtempSync(join(tmpdir(), 'review-cut-'))
process.env.ANGELOOCANA_MEDIA = root
process.env.REVIEW_AUTOPUBLISH = '0'
afterAll(() => rmSync(root, { recursive: true, force: true }))
let { saveCut } = await import('./cut-page.tsx')

it('rebuilds submitted pieces before the next save and falls back to the recipe without a draft', async () => {
  let id = 'h-ice' // A known catalogue ID; footage and cut state are still synthetic.
  let path = 'synthetic source.mp4'
  let raw = (start: number) => [['vid', path, start, 0.3, 0.5]]
  let piece = (start: number) => ({ kind: 'vid', path, start, secs: 0.3, cx: 0.5 })
  let index = join(root, 'index')
  mkdirSync(index)
  writeFileSync(join(index, 'montages.json'), JSON.stringify({ clips: { [id]: raw(0) } }))
  writeFileSync(join(index, 'cut-drafts.json'), JSON.stringify({ [id]: raw(0.1) }))
  execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=96x160:rate=30', '-t', '1', join(root, path)])
  let post = (action: string, start?: number) => saveCut(new Request(`http://localhost/review/cut/${id}`, {
    method: 'POST', body: JSON.stringify({ action, pieces: start === undefined ? undefined : [piece(start)] }),
  }), id)

  let [rendered, saved] = await Promise.all([post('rebuild', 0.2), post('save', 0.4)])
  assert.equal(rendered.status, 200)
  assert.equal(saved.status, 200)
  let result = await rendered.json()
  assert.deepEqual(result.current, [{ ...piece(0.2), zoom: 1, cy: 0.5 }])
  assert.equal(result.check.state, 'edited')
  assert.deepEqual(await saved.json(), { draft: true })
  assert.deepEqual(JSON.parse(readFileSync(join(index, 'montages.json'), 'utf8')), { clips: { [id]: raw(0.2) } })
  assert.deepEqual(JSON.parse(readFileSync(join(index, 'cut-drafts.json'), 'utf8')), { [id]: raw(0.4) })
  for (let ext of ['mp4', 'jpg']) assert.ok(readFileSync(join(root, 'media', 'clips', `${id}.${ext}`)).length > 0)

  assert.deepEqual(await (await post('discard')).json(), { draft: false })
  let kept = await (await post('keep')).json()
  let rerendered = await post('rebuild')
  assert.equal(rerendered.status, 200)
  let existing = await rerendered.json()
  assert.equal(existing.draft, false)
  assert.deepEqual(existing.current, result.current)
  assert.deepEqual(existing.check, kept.check)
})
