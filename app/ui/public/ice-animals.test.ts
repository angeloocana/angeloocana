import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { along, pick, plan, schedule } from './ice-gl.ts'

describe('what swims under the ice', () => {
  it('visits mostly as fish or an otter, less often as a seal, and very rarely as a beaver', () => {
    let counts = { pike: 0, trout: 0, otter: 0, seal: 0, beaver: 0 }
    for (let i = 0; i < 100; i++) counts[pick(() => (i + 0.5) / 100)]++
    assert.deepEqual(counts, { pike: 30, trout: 30, otter: 30, seal: 7, beaver: 3 })
  })

  it('waits 5–20 seconds after settling or a swim ending, and defers while motion is off', () => {
    let value = 0
    let visits = schedule(() => value)
    assert.equal(visits.ready(0, true), false, 'no swim before the first rest')
    assert.equal(visits.wait(1_000), 5_000)
    assert.equal(visits.wait(2_000), null, 'an existing gap is not moved')
    assert.equal(visits.ready(5_999, true), false)
    assert.equal(visits.ready(6_000, false), false, 'hidden or paused at the deadline')
    assert.equal(visits.ready(7_000, true), true, 'the overdue swim can start on return')
    assert.equal(visits.ready(17_000, true), false, 'no second swim before the first leaves')
    value = 0.999
    assert.equal(visits.wait(18_000), 19_985, 'the next gap starts when the previous swim ends')
    assert.equal(visits.ready(37_984, true), false)
    assert.equal(visits.ready(37_985, true), true)
  })

  it('passes close to the pointer, but not if there is no ice nearby', () => {
    let near: [number, number] = [200, 300]
    let thickness = (x: number) => x >= 0 && x < 400 ? 0.5 : 0
    let path = plan(() => 0.25, near, 500, thickness)
    assert.ok(path)
    let [[x, y], [dx, dy]] = along(path, 0.5)
    assert.ok(Math.hypot(x - near[0], y - near[1]) < 50)
    assert.ok(Math.abs(Math.hypot(dx, dy) - 1) < 1e-9)
    assert.equal(plan(() => 0.25, near, 500, () => 0), null)
  })
})
