import * as assert from 'remix/assert'
import { it } from 'remix/test'
import type { TestContext } from 'remix/test'

import { createCutWrites } from './cut-editor-writes.ts'

const piece = (start: number) => ({ kind: 'vid' as const, path: 'synthetic.mp4', start, secs: 1, cx: 0.5, zoom: 1, cy: 0.5 })
const success = (start: number) => ({ draft: false, current: [piece(start)], check: { state: 'edited', at: '2026-01-01T00:00:00Z' }, video: '/rendered.mp4' })

function editor(t: TestContext) {
  let signal = new AbortController()
  t.after(() => signal.abort())
  type Call = { body: unknown; reply: (response: Response) => void; reject: (error: Error) => void }
  let calls: ReturnType<typeof Promise.withResolvers<Call>>[] = []
  let call = (index: number) => {
    while (calls.length <= index) calls.push(Promise.withResolvers<Call>())
    return calls[index]
  }
  let sent = 0
  let rebuilt = 0
  let update = Promise.withResolvers<void>()
  let writes = createCutWrites('h-test', { current: [piece(0)], draft: null, check: null, video: '/original.mp4' }, {
    signal: signal.signal,
    fetch: async (_url, init) => {
      let response = Promise.withResolvers<Response>()
      call(sent++).resolve({ body: JSON.parse(String(init?.body)), reply: response.resolve, reject: response.reject })
      return response.promise
    },
    update: () => {
      update.resolve()
      update = Promise.withResolvers<void>()
    },
    discarded: () => {},
    rebuilt: () => { rebuilt++ },
  })
  return {
    ...writes,
    next: (index: number) => call(index).promise,
    sent: () => sent,
    rebuilt: () => rebuilt,
    updated: () => update.promise,
    edit: (start: number) => {
      Object.assign(writes.state.pieces[0], { start })
      writes.changed()
    },
  }
}

it('waits for the save body, rebuilds the clicked snapshot, then saves the newer selection', async (t) => {
  let cut = editor(t)
  cut.edit(0.2)
  let first = await cut.next(0)
  assert.deepEqual(first.body, { action: 'save', pieces: [piece(0.2)] })
  let reading = Promise.withResolvers<void>()
  let savedDraft = Promise.withResolvers<{ draft: boolean }>()
  first.reply(Object.assign(new Response(), { json: () => { reading.resolve(); return savedDraft.promise } }))
  await reading.promise

  cut.edit(0.4)
  let rebuilt = cut.rebuild()
  cut.edit(0.6) // mutates the piece in place while the rebuild is still waiting to be sent
  let laterSave = cut.settle() // An in-app link flushes the newest debounced draft before leaving.
  await Promise.resolve()
  assert.equal(cut.pending(), true)
  assert.equal(cut.sent(), 1)
  savedDraft.resolve({ draft: true })

  let second = await cut.next(1)
  assert.deepEqual(second.body, { action: 'rebuild', pieces: [piece(0.4)] })
  assert.equal(cut.state.status, 'Saving…')
  assert.equal(cut.sent(), 2)
  second.reply(Response.json(success(0.4)))
  await rebuilt
  assert.deepEqual(cut.state.current, [piece(0.4)])
  assert.equal(cut.state.video, '/rendered.mp4')
  assert.equal(cut.rebuilt(), 1)
  assert.deepEqual(cut.state.pieces, [piece(0.6)])
  assert.equal(cut.state.unsaved, true)
  assert.equal(cut.state.status, 'Saving…')
  assert.equal(cut.state.busy, null)

  let third = await cut.next(2)
  assert.deepEqual(third.body, { action: 'save', pieces: [piece(0.6)] })
  third.reply(Response.json({ draft: true }))
  await laterSave
  assert.equal(cut.state.hasDraft, true)
  assert.equal(cut.state.unsaved, false)
  assert.equal(cut.pending(), false)
  assert.match(cut.state.status, /^Saved as a draft/)
})

it('keeps a first failed autosave in the editor until Retry save succeeds', async (t) => {
  let cut = editor(t)
  cut.edit(0.2)
  let first = await cut.next(0)
  let updated = cut.updated()
  first.reply(Response.json({ draft: true }, { status: 503 }))
  await updated
  assert.equal(cut.state.unsaved, true)
  assert.equal(cut.state.hasDraft, false)
  assert.equal(cut.state.retry, 'save')
  assert.equal(cut.state.status, 'Draft not saved: Server returned HTTP 503.')
  assert.deepEqual(cut.state.pieces, [piece(0.2)])

  let retry = cut.save()
  let second = await cut.next(1)
  assert.deepEqual(second.body, first.body)
  second.reply(Response.json({ draft: true }))
  await retry
  assert.equal(cut.state.retry, null)
  assert.equal(cut.state.unsaved, false)
  assert.equal(cut.state.hasDraft, true)
})

it('exits Rebuilding on HTTP, network, or invalid success replies and rebuilds on retry', async (t) => {
  let cut = editor(t)
  cut.edit(0.2)
  let failures = [
    Response.json({ error: 'Could not render the cut.' }, { status: 500 }),
    new Error('Network disconnected'),
    new Response('<html>'),
    Response.json({ ...success(0.2), current: [null] }),
  ]
  for (let [index, failure] of failures.entries()) {
    let attempt = cut.rebuild()
    assert.equal(cut.state.busy, 'rebuild')
    let request = await cut.next(index)
    assert.deepEqual(request.body, { action: 'rebuild', pieces: [piece(0.2)] })
    if (failure instanceof Error) request.reject(failure)
    else request.reply(failure)
    await attempt
    assert.equal(cut.state.busy, null)
    assert.equal(cut.state.retry, 'rebuild')
    assert.match(cut.state.rebuildError, /^Rebuild failed:/)
    assert.deepEqual(cut.state.pieces, [piece(0.2)])
    assert.deepEqual(cut.state.current, [piece(0)])
    assert.equal(cut.state.video, '/original.mp4')
    assert.equal(cut.rebuilt(), 0)
  }

  let retry = cut.rebuild()
  ;(await cut.next(failures.length)).reply(Response.json(success(0.2)))
  await retry
  assert.equal(cut.state.busy, null)
  assert.equal(cut.state.retry, null)
  assert.equal(cut.state.unsaved, false)
  assert.match(cut.state.status, /^Rebuilt:/)
  assert.deepEqual(cut.state.current, [piece(0.2)])
})

it('keeps a failed older rebuild visible after the newer draft is saved', async (t) => {
  let cut = editor(t)
  cut.edit(0.2)
  let rebuilding = cut.rebuild()
  let older = await cut.next(0)
  cut.edit(0.4)
  let leaving = cut.settle()
  older.reply(Response.json({ error: 'Render failed.' }, { status: 500 }))
  await rebuilding
  let newer = await cut.next(1)
  assert.deepEqual(newer.body, { action: 'save', pieces: [piece(0.4)] })
  assert.equal(cut.pending(), true)
  newer.reply(Response.json({ draft: true }))
  await leaving
  assert.match(cut.state.status, /^Saved as a draft/)
  assert.equal(cut.state.rebuildError, 'Rebuild failed: Render failed.')
  assert.equal(cut.pending(), false)
})
