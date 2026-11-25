import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { along, pick, plan } from './ice-gl.ts'

describe('what swims under the ice', () => {
  it('visits mostly as fish or an otter, less often as a seal, and very rarely as a beaver', () => {
    let counts = { pike: 0, trout: 0, otter: 0, seal: 0, beaver: 0 }
    for (let i = 0; i < 100; i++) counts[pick(() => (i + 0.5) / 100)]++
    assert.deepEqual(counts, { pike: 30, trout: 30, otter: 30, seal: 7, beaver: 3 })
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
