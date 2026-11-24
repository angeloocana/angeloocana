import * as assert from 'remix/assert'
import { it } from 'remix/test'

import { createCutWrites } from './cut-editor-writes.ts'
import { reviewWrites } from './review-board.tsx'
import { leaveWithoutAsking } from './review-navigation.ts'
import type { WriteOutcome } from './review-navigation.ts'

// Every order of a few user actions, the moment a link is followed (settle) and which server
// replies fail, run against the real board and cut-editor queues. The rule navigation relies on:
// a reply that failed before settle answered means asking before leaving; all replies confirmed
// and nothing new issued means leaving without asking. Neither may come from `busy`, the queue
// length or styling: only the outcome settle returns.

type Request = { reply: (ok: boolean) => void }
const flush = () => new Promise<void>((resolve) => setImmediate(resolve))

function sequences<T>(alphabet: readonly T[], length: number): T[][] {
  return length === 0 ? [[]] : sequences(alphabet, length - 1).flatMap((rest) => alphabet.map((op) => [...rest, op]))
}

async function run(
  ops: string[], at: number, results: boolean[],
  queue: (requests: Request[]) => { issue: (op: string, afterSettle: boolean) => void; pending: () => boolean; settle: () => Promise<WriteOutcome> },
) {
  let requests: Request[] = []
  let writes = queue(requests)
  let settled: WriteOutcome | undefined
  let failedBefore = 0
  ops.slice(0, at).forEach((op) => writes.issue(op, false))
  void writes.settle().then((outcome) => { settled = outcome })
  ops.slice(at).forEach((op) => writes.issue(op, true))
  let sent = 0
  for (let idle = 0; settled === undefined && idle < 5;) {
    await flush()
    if (settled !== undefined) break
    if (sent < requests.length) {
      let ok = results[sent] ?? true
      if (!ok) failedBefore++
      requests[sent++].reply(ok)
      idle = 0
    } else idle++
  }
  await flush()
  let name = `${ops.join(' → ')}, link after ${at}, replies ${results.map((ok) => ok ? 'ok' : 'fail').join(' ')}`
  assert.ok(settled, `settle never answered: ${name}`)
  let leaves = leaveWithoutAsking(settled!, writes.pending())
  // Replies still owed after settle answered are new writes: pending() keeps them on the page.
  let allSent = sent === requests.length
  if (failedBefore) assert.equal(leaves, false, `left after a failed reply: ${name}`)
  if (!failedBefore && at === ops.length && allSent) assert.equal(leaves, true, `asked although every reply was confirmed: ${name}`)
  return failedBefore ? 'stays' : leaves ? 'leaves' : 'other'
}

const deferred = (requests: Request[]) => new Promise<boolean>((resolve) => requests.push({ reply: resolve }))

it('board: no failed card write or urgent removal is mistaken for a confirmed one, in any order', async () => {
  let runs = 0
  let seen = new Set<string>()
  for (let length = 1; length <= 3; length++) {
    for (let ops of sequences(['note', 'removal'] as const, length)) {
      for (let at = 0; at <= ops.length; at++) {
        for (let results of sequences([true, false], 3)) {
          seen.add(await run(ops, at, results, (requests) => {
            let board = reviewWrites(async (patch) => {
              if (!await deferred(requests)) throw new Error('Could not save.')
              return { id: 'h-synthetic', cat: 'other', rejected: true, star: 0, label: { en: 'A', pt: 'A' }, ...patch } as never
            }, () => {}, () => {})
            return {
              issue: (op) => op === 'note' ? void board.edit({ note: `note ${runs}` }) : void board.exclusive(() => deferred(requests)),
              pending: () => board.busy,
              settle: board.settle,
            }
          }))
          runs++
        }
      }
    }
  }
  assert.deepEqual([...seen].sort(), ['leaves', 'other', 'stays'])
  assert.equal(runs, (2 * 2 + 4 * 3 + 8 * 4) * 8)
})

it('cut editor: no failed keep, save, rebuild or note is mistaken for a confirmed one, in any order', async () => {
  let runs = 0
  let seen = new Set<string>()
  const piece = (start: number) => ({ kind: 'vid' as const, path: 'synthetic.mp4', start, secs: 1, cx: 0.5, zoom: 1, cy: 0.5 })
  for (let length = 1; length <= 3; length++) {
    for (let ops of sequences(['keep', 'edit', 'rebuild', 'note'] as const, length)) {
      for (let at = 0; at <= ops.length; at++) {
        for (let results of sequences([true, false], 3)) {
          let abort = new AbortController()
          seen.add(await run(ops, at, results, (requests) => {
            let writes = createCutWrites('h-synthetic', { current: [piece(0)], draft: null, check: null, video: '/original.mp4' }, {
              signal: abort.signal,
              async fetch(url, init) {
                let body = JSON.parse(String(init?.body))
                if (!await deferred(requests)) return Response.json({ error: 'Could not update cut.' }, { status: 500 })
                if (url === '/review') return Response.json({ id: body.id })
                if (body.action === 'keep') return Response.json({ check: { state: 'kept', at: '2026-01-01T00:00:00Z' } })
                if (body.action === 'save') return Response.json({ draft: true })
                return Response.json({ draft: false, current: body.pieces, check: { state: 'edited', at: '2026-01-01T00:00:00Z' }, video: '/rendered.mp4' })
              },
              update: () => {}, discarded: () => {}, rebuilt: () => {},
            })
            let start = 0
            return {
              issue(op, afterSettle) {
                // A link flushes the debounced save and note; after it, send them at once.
                if (op === 'keep') void writes.mark('keep')
                if (op === 'rebuild') void writes.rebuild()
                if (op === 'edit') {
                  writes.state.pieces[0] = piece(++start / 10)
                  writes.changed()
                  if (afterSettle) void writes.save()
                }
                if (op === 'note') {
                  writes.saveNote(`note ${start}`)
                  if (afterSettle) void writes.retryNote()
                }
              },
              pending: writes.pending,
              settle: writes.settle,
            }
          }))
          abort.abort()
          runs++
        }
      }
    }
  }
  assert.deepEqual([...seen].sort(), ['leaves', 'other', 'stays'])
  assert.equal(runs, (4 * 2 + 16 * 3 + 64 * 4) * 8)
})
