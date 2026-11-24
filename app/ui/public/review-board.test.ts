import * as assert from 'remix/assert'
import { it } from 'remix/test'

import type { ReviewPatch } from '../../actions/review-page.tsx'
import { postReviewPatch, reviewWrites } from './review-board.tsx'

const signal = new AbortController().signal
const clip = { id: 'h-synthetic', cat: 'other' as const, rejected: false, star: 0, label: { en: 'A clip', pt: 'Um trecho' } }

type Sent = ReviewPatch & { id: string }

it('serializes rapid absolute edits on one card without blocking another card', async () => {
  let first = Promise.withResolvers<Response>()
  let last = Promise.withResolvers<Response>()
  let lastStarted = Promise.withResolvers<void>()
  let sent: Sent[] = []
  let transport: typeof fetch = async (_url, init) => {
    let body = JSON.parse(String(init?.body)) as Sent
    sent.push(body)
    if (sent.length === 1) return first.promise
    if (sent.length === 3) { lastStarted.resolve(); return last.promise }
    return Response.json({ ...clip, ...body })
  }
  let statuses: string[] = []
  let board = reviewWrites((patch) => postReviewPatch(clip.id, patch, signal, transport), () => {}, (feedback) => statuses.push(feedback.state))
  let other = reviewWrites((patch) => postReviewPatch('h-second', patch, signal, transport), () => {}, () => {})
  let saving = board.edit({ star: 1 })
  void board.edit({ star: 2 })
  void board.edit({ rejected: true, captionRejected: true })
  void board.edit({ star: 3, rejected: false, captionRejected: false })
  await other.edit({ star: 1 })

  assert.deepEqual(sent, [{ id: clip.id, star: 1 }, { id: 'h-second', star: 1 }])
  assert.deepEqual(statuses, ['saving'])
  let left = false
  let leaving = board.settle().then(() => { left = true })
  first.resolve(Response.json({ ...clip, star: 1 }))
  await lastStarted.promise
  assert.equal(left, false)
  assert.equal(board.busy, true)
  last.resolve(Response.json({ ...clip, ...sent[2] }))
  await Promise.all([saving, leaving])

  assert.deepEqual(sent.slice(2), [{ id: clip.id, star: 3, rejected: false, captionRejected: false }])
  assert.deepEqual(statuses, ['saving', 'saved'])
  assert.equal(board.busy, false)
})

it('does not navigate on a failed urgent removal merely because the queued note saves', async () => {
  let removal = Promise.withResolvers<boolean>()
  let sent: ReviewPatch[] = []
  let board = reviewWrites(async (patch) => { sent.push(patch); return clip }, () => {}, () => {})
  void board.exclusive(() => removal.promise)
  void board.edit({ note: 'Keep this separate from the removal.' })
  let leaving = board.settle()
  assert.deepEqual(sent, [])
  removal.resolve(false)
  assert.equal(await leaving, 'unconfirmed')
  assert.deepEqual(sent, [{ note: 'Keep this separate from the removal.' }])
  assert.equal(board.busy, false)
})

for (let failure of ['offline', 'HTTP 422', 'invalid JSON'] as const) {
  it(`retains a failed edit after ${failure} and retries the latest field values`, async () => {
    let first = Promise.withResolvers<Response>()
    let sent: Sent[] = []
    let transport: typeof fetch = async (_url, init) => {
      let body = JSON.parse(String(init?.body)) as Sent
      sent.push(body)
      return sent.length === 1 ? first.promise : Response.json({ ...clip, ...body })
    }
    let errors: string[] = []
    let states: string[] = []
    let board = reviewWrites((patch) => postReviewPatch(clip.id, patch, signal, transport), () => {}, (feedback) => {
      states.push(feedback.state)
      if (feedback.state === 'error') errors.push(feedback.message)
    })
    let saving = board.edit({ rejected: true, label: { en: 'Earlier edit' } })
    void board.edit({ label: { pt: 'Legenda nova' } })
    if (failure === 'offline') first.reject(new TypeError('Offline'))
    if (failure === 'HTTP 422') first.resolve(Response.json({ error: 'Invalid caption.' }, { status: 422 }))
    if (failure === 'invalid JSON') first.resolve(new Response('<html>Unexpected reply</html>'))
    await saving
    await board.edit({ label: { en: 'Latest edit' } })

    assert.equal(board.busy, true)
    assert.equal(sent.length, 1)
    assert.deepEqual(states, ['saving', 'error'])
    assert.match(errors[0], /Could not (confirm the )?save/)
    await board.retry()

    assert.deepEqual(sent.slice(1), [{ id: clip.id, rejected: true, label: { en: 'Latest edit', pt: 'Legenda nova' } }])
    assert.deepEqual(states, ['saving', 'error', 'saving', 'saved'])
    assert.equal(board.busy, false)
  })
}
