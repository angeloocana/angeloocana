import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { DELAY, KINDS, RETRY, SPECIES, along, isKind, pick, plan, random, schedule } from './ice-gl.ts'

describe('what swims under the ice', () => {
  it('mostly a pike, a trout or an otter; a seal now and then, a beaver rarely', () => {
    let rng = random(1), counts = Object.fromEntries(KINDS.map((k) => [k, 0]))
    for (let i = 0; i < 20000; i++) counts[pick(rng)]++
    assert.ok(Math.abs(KINDS.reduce((s, k) => s + SPECIES[k].weight, 0) - 1) < 1e-9)
    for (let kind of ['pike', 'trout', 'otter']) assert.ok(counts[kind] > 5500 && counts[kind] < 6500, `${kind}: ${counts[kind]}`)
    assert.ok(counts.seal > 1100 && counts.seal < 1700, `seal: ${counts.seal}`)
    assert.ok(counts.beaver > 400 && counts.beaver < 800, `beaver: ${counts.beaver}`)
    assert.ok(counts.beaver < counts.seal)
  })

  it('comes about once a minute of use, only on input, never at the first', () => {
    let s = schedule(random(7))
    assert.equal(s.input(10), false) // the first input only sets the clock
    assert.equal(s.input(10 + DELAY[0] - 1), false)
    // input every half second for ten minutes: one every 45–75 s
    let times: number[] = []
    for (let t = 10.5; t < 610; t += 0.5) if (s.input(t)) times.push(t)
    let gaps = times.slice(1).map((t, i) => t - times[i])
    assert.ok(times[0] >= 10 + DELAY[0] && times[0] <= 10 + DELAY[1] + 0.5)
    assert.ok(times.length >= 8 && times.length <= 13, `${times.length} in ten minutes`)
    for (let gap of gaps) assert.ok(gap >= DELAY[0] && gap <= DELAY[1] + 0.5, `gap ${gap}`)
  })

  it('waits while nobody is there: due, it comes only with the next input', () => {
    let s = schedule(random(3))
    s.input(0)
    assert.equal(s.input(500), true) // long idle: nothing came by itself, the input brings it
    assert.equal(s.input(501), false)
  })

  it('starts over after the tab was hidden or the motion went off, and retries soon when there was no ice', () => {
    let s = schedule(random(3))
    s.input(0)
    s.reset()
    assert.equal(s.input(500), false, 'coming back does not bring one at once')
    assert.equal(s.input(500 + DELAY[1] + 1), true)
    s.retry(600)
    assert.equal(s.input(600 + RETRY - 0.1), false)
    assert.equal(s.input(600 + RETRY), true)
  })

  it('passes under thick ice near the pointer, and not at all where there is none', () => {
    let thick = (x: number) => (x < 400 ? 0.5 : 0)
    let path = plan(random(5), [200, 300], 500, thick)
    assert.ok(path)
    let [[x, y]] = along(path, 0.5)
    assert.ok(Math.hypot(x - 200, y - 300) < 200, 'its middle is near the pointer')
    assert.equal(plan(random(5), [200, 300], 500, () => 0), null)
  })

  it('swims along its path, facing the way it goes', () => {
    let path: [[number, number], [number, number], [number, number]] = [[0, 0], [50, 0], [100, 0]]
    assert.deepEqual(along(path, 0), [[0, 0], [1, 0]])
    assert.deepEqual(along(path, 1), [[100, 0], [1, 0]])
    assert.deepEqual(along(path, 0.5)[0], [50, 0])
  })

  it('takes only the five names for a review link', () => {
    assert.ok(KINDS.every(isKind))
    assert.equal(isKind('shark'), false)
    assert.equal(isKind('constructor'), false)
    assert.equal(isKind(null), false)
  })
})
