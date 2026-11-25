import * as assert from 'remix/assert'
import { it } from 'remix/test'

import { scheduleSwims } from './ice-gl.ts'

// This clock can deliver a timer before its requested time and deliver the frame separately.
function rig(trace: string[]) {
  let now = 0, allowed = true, stopped = false, active = false
  let due: number | null = null
  let timer: { at: number; wake: () => void } | undefined
  let frame = false, starts = 0
  let context = () => trace.join(' → ')
  let visits = scheduleSwims({
    rng: () => 0,
    allowed: () => allowed,
    requestFrame: () => {
      assert.ok(allowed && !stopped, `ineligible frame request: ${context()}`)
      frame = true
    },
    start: () => {
      assert.ok(allowed && !stopped && !active, `ineligible or overlapping swim: ${context()}`)
      assert.ok(due !== null && now >= due, `swim before its deadline: ${context()}`)
      starts++
    },
  }, {
    now: () => now,
    after: (wake, delay) => {
      assert.ok(!timer, `two pending timers: ${context()}`)
      assert.ok(delay > 0, `timer polling an elapsed deadline: ${context()}`)
      timer = { at: now + delay, wake }
      return 1
    },
    cancel: () => { timer = undefined },
  })
  let wake = (early: boolean) => {
    if (!timer) return
    let { at, wake } = timer
    now = at - (early ? 0.25 : 0)
    timer = undefined
    wake()
  }
  let draw = () => {
    frame = false
    let expected = !stopped && allowed && !active && due !== null && now >= due
    let before = starts
    visits.frame()
    assert.equal(starts - before, Number(expected), `incorrect frame result: ${context()}`)
    if (expected) { due = null; active = true }
  }
  let finish = () => {
    if (!stopped && active) { active = false; due = now + 5_000 }
    visits.finish()
  }
  return {
    settle() {
      if (!stopped && !active) due ??= now + 5_000
      visits.settled()
    },
    early: () => wake(true),
    wake: () => wake(false),
    frame: draw, // an ordinary rendering frame can also be delivered during the gap
    finish,
    off() { allowed = false; finish() },
    resume() { allowed = true; visits.resume() },
    abort() { stopped = true; visits.abort(); assert.equal(timer, undefined) },
    drain() {
      if (!allowed || stopped || due === null) return
      let before = starts
      // No page input or extra frame. Deliver the work that was actually queued, on time.
      if (frame) draw()
      if (timer) wake(false)
      if (frame) draw()
      assert.equal(starts, before + 1, `eligible visit lost without further input: ${context()}`)
    },
  }
}

it('preserves swim deadlines across all event orders up to five events, then delivers queued work', () => {
  let actions = ['settle', 'early', 'wake', 'frame', 'finish', 'off', 'resume', 'abort'] as const
  function check(trace: (typeof actions[number])[], remaining: number) {
    if (remaining) {
      for (let action of actions) check([...trace, action], remaining - 1)
      return
    }
    let replay = rig(trace)
    for (let action of trace) replay[action]()
    replay.drain()
  }
  for (let length = 0; length <= 5; length++) check([], length)
})
