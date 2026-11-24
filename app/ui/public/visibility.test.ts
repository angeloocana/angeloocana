import * as assert from 'remix/assert'
import { it } from 'remix/test'

import { withLatestIntersections } from './visibility.ts'

it('uses the last visibility sample for each target in a single delivery', () => {
  let a = {} as Element
  let b = {} as Element
  let sample = (target: Element, isIntersecting: boolean) => ({ target, isIntersecting }) as IntersectionObserverEntry
  let seen = new Map<Element, boolean>()
  let deliver = withLatestIntersections(({ target, isIntersecting }) => {
    assert.ok(!seen.has(target), 'only one sample per target should be used')
    seen.set(target, isIntersecting)
  })

  // Neither target crosses again. The final sample for one must not mask the other.
  deliver([sample(a, false), sample(b, true), sample(a, true), sample(b, false)])

  assert.equal(seen.get(a), true, 'off → on in one batch still becomes visible')
  assert.equal(seen.get(b), false, 'the second target keeps its own final state')
})
