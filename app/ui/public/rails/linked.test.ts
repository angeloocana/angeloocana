import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createLinkedCard, type HashOutcome, type Linked, type LinkedCard } from './linked.ts'

// Bounded exhaustive transition check against the real createLinkedCard owner, plus
// historical regression replays. Each step checks the invariants between scroll ownership,
// URL hash, jump ownership, and the carried language-flag card across every interleaving of:
//   - initial #hash arrival (fresh navigation vs back_forward/reload restoration)
//   - missing vs already-present anchors
//   - slow clip load completing after user movement, hashchange, or a newer pick
//   - window.load realignment
//   - hobby chip async load, jump link pick, and non-carrying Tab focus slide
//   - smooth scroll / timeout completion arriving after user movement or a newer pick

type Card = 'A' | 'B'
type Fallback = 'F'
type PendingHash = { token: number; id: Card; opened: boolean; missing: boolean }
type PendingPick = { token: number; card: Card }
type PendingTrip = { token: number; card: Card; carry: boolean }

type HistoricalBug =
  | 'pre-237ac36-clamped-flag'
  | 'pre-a99ca60-stale-arrival'
  | 'pre-a99ca60-inflight-flag'
  | 'pre-a99ca60-back-scroll'
  | 'pre-a99ca60-back-offscreen-align'
  | 'pre-21ce2dd-double-scroll'
  | 'pre-pr7-tab-settles'
  | 'pre-pr7-stale-jump-clears'
  | 'pre-pr7-stale-chip-load'

type Step =
  | { kind: 'openHash'; id: Card; missing: boolean }
  | { kind: 'completeHash'; index: number; found: boolean; railInView: boolean }
  | { kind: 'load' }
  | { kind: 'hashChange'; id: Card | '' ; missing: boolean }
  | { kind: 'clickChip'; card: Card }
  | { kind: 'completeChip'; index: number; found: boolean }
  | { kind: 'jumpPick'; card: Card }
  | { kind: 'tabSlide'; card: Card }
  | { kind: 'completeTrip'; index: number }
  | { kind: 'userMoved' }
  | { kind: 'touchPage' }

interface Harness {
  readonly linked: LinkedCard<Card>
  readonly restoring: boolean
  hash: Card | ''
  pageTouched: boolean
  activeHashToken: number | null
  activePickToken: number | null
  activeTripToken: number | null
  jumpingToken: number | null
  pendingHashes: PendingHash[]
  pendingPicks: PendingPick[]
  pendingTrips: PendingTrip[]
  trace: string[]
  apply(step: Step): string | null
}

// Re-enacts one historical transition on top of the same interface so the invariant checker
// proves it actually catches each past bug (without adding bug switches to production code).
function withHistoricalBug(
  base: LinkedCard<Card>,
  restoring: boolean,
  bug: HistoricalBug,
): LinkedCard<Card> {
  let lastOpened = false
  let lastMissing = false
  let lastTripCarry = false
  let lastTripCard: Card | null = null
  let pageTouched = false
  let hashMeta = new Map<number, { opened: boolean; missing: boolean }>()

  return {
    get current() {
      return base.current
    },
    startHash(id, options) {
      lastOpened = options.opened
      lastMissing = options.missing
      let token = base.startHash(id, options)
      hashMeta.set(token, options)
      return token
    },
    completeHash(token, result): HashOutcome {
      let meta = hashMeta.get(token)
      if (bug === 'pre-a99ca60-stale-arrival') {
        let stale = !base.isCurrent(token)
        let out = base.completeHash(token, result)
        if (stale && meta && result.card && result.hashMatches) {
          // Before a99ca60, an arriving clip did not check request identity against later input.
          let restored = meta.opened && restoring
          if (!restored || result.railInView()) {
            return { alignRow: true, scrollPage: meta.missing && !restored && !pageTouched }
          }
        }
        return out
      }
      if (bug === 'pre-a99ca60-back-scroll') {
        let out = base.completeHash(token, result)
        if (out.alignRow && lastOpened && restoring && lastMissing && !pageTouched) {
          // Before a99ca60, Back/reload still scrolled the page vertically for a missing #clip.
          return { alignRow: true, scrollPage: true }
        }
        return out
      }
      if (bug === 'pre-a99ca60-back-offscreen-align') {
        // Before a99ca60, Back/reload did not check whether the rail was in the restored viewport.
        return base.completeHash(token, { ...result, railInView: () => true })
      }
      if (bug === 'pre-21ce2dd-double-scroll') {
        let out = base.completeHash(token, result)
        if (out.alignRow && !lastMissing && !(lastOpened && restoring) && !pageTouched) {
          // In a99ca60 before 21ce2dd, even an already-present anchor ran vertical scrollTo.
          return { alignRow: true, scrollPage: true }
        }
        return out
      }
      return base.completeHash(token, result)
    },
    shouldRealignOnLoad() {
      return base.shouldRealignOnLoad()
    },
    startPick() {
      return base.startPick()
    },
    isCurrent(token) {
      if (bug === 'pre-pr7-stale-chip-load') return true
      return base.isCurrent(token)
    },
    startTrip(card, options) {
      lastTripCard = card
      lastTripCarry = options.carry
      return base.startTrip(card, options)
    },
    completeTrip(token) {
      if (bug === 'pre-pr7-tab-settles' && !lastTripCarry && lastTripCard) {
        let ok = base.completeTrip(token)
        if (ok) {
          // Pre-PR7 rows.ts checked `linked === trip` on an idle trip object and settled it.
          let fake = base.startTrip(lastTripCard, { carry: true })
          base.completeTrip(fake.token)
        }
        return ok
      }
      if (bug === 'pre-pr7-stale-jump-clears') {
        base.completeTrip(token)
        // Pre-PR7 rows.ts removed `is-jumping` unconditionally even when `linked !== trip`.
        return true
      }
      return base.completeTrip(token)
    },
    userMoved() {
      base.userMoved()
    },
    touchPage() {
      pageTouched = true
      base.touchPage()
    },
    hashChanged() {
      pageTouched = false
      base.hashChanged()
    },
    cardInView(shown, fallback) {
      let state = base.current
      if (bug === 'pre-237ac36-clamped-flag') {
        // Before 237ac36, cardInView always returned the first card mostly in view at the left edge.
        return fallback()
      }
      if (bug === 'pre-a99ca60-inflight-flag') {
        // In 237ac36 before a99ca60, a travelling card was carried only once visible > 0.
        if (state.state === 'travelling') return shown(state.card) > 0 ? state.card : fallback()
      }
      return base.cardInView(shown, fallback)
    },
  }
}

function createHarness(restoring: boolean, bug?: HistoricalBug): Harness {
  let raw = createLinkedCard<Card>({ restoring })
  let linked = bug ? withHistoricalBug(raw, restoring, bug) : raw

  let h: Harness = {
    linked,
    restoring,
    hash: '',
    pageTouched: false,
    activeHashToken: null,
    activePickToken: null,
    activeTripToken: null,
    jumpingToken: null,
    pendingHashes: [],
    pendingPicks: [],
    pendingTrips: [],
    trace: [],

    apply(step) {
      h.trace.push(formatStep(step))
      switch (step.kind) {
        case 'openHash': {
          h.hash = step.id
          h.jumpingToken = null
          let token = linked.startHash(step.id, { opened: true, missing: step.missing })
          h.activeHashToken = token
          h.activePickToken = null
          h.activeTripToken = null
          h.pendingHashes.push({ token, id: step.id, opened: true, missing: step.missing })
          break
        }
        case 'completeHash': {
          let req = h.pendingHashes.splice(step.index, 1)[0]
          if (!req) break
          let before = linked.current
          let isActive = h.activeHashToken === req.token
          let hashMatches = h.hash === req.id
          let railInViewChecks = 0
          let outcome = linked.completeHash(req.token, {
            card: step.found ? req.id : null,
            hashMatches,
            railInView: () => {
              railInViewChecks++
              return step.railInView
            },
          })

          // Invariant 1: stale arrival never aligns, scrolls, or mutates state.
          if (!isActive) {
            if (outcome.alignRow || outcome.scrollPage || linked.current !== before) {
              return `stale arrival hijacked row/page (alignRow=${outcome.alignRow}, scrollPage=${outcome.scrollPage})`
            }
            if (railInViewChecks > 0) return 'stale arrival forced a layout read'
            break
          }

          h.activeHashToken = null
          let restored = req.opened && restoring
          let shouldAlign = step.found && hashMatches && (!restored || step.railInView)
          let shouldScrollPage = shouldAlign && req.missing && !restored && !h.pageTouched

          // Invariant 2: Back restoration with stale hash (rail off-screen) never aligns or scrolls.
          if (restored && !step.railInView && (outcome.alignRow || outcome.scrollPage)) {
            return `Back restoration moved off-screen rail/page (alignRow=${outcome.alignRow}, scrollPage=${outcome.scrollPage})`
          }
          // Invariant 3: single vertical scroll owner (never on present anchor, Back/reload, or touched page).
          if (outcome.scrollPage !== shouldScrollPage) {
            return `scrollPage=${outcome.scrollPage}, expected ${shouldScrollPage} (missing=${req.missing}, restored=${restored}, pageTouched=${h.pageTouched})`
          }
          if (outcome.alignRow !== shouldAlign) {
            return `alignRow=${outcome.alignRow}, expected ${shouldAlign}`
          }
          if (!restored && railInViewChecks > 0) {
            return 'non-restoration arrival read railInView unnecessarily'
          }
          if (shouldAlign) {
            if (linked.current.state !== 'settled' || linked.current.card !== req.id || !linked.current.hash) {
              return `aligned hash did not settle on ${req.id}: ${JSON.stringify(linked.current)}`
            }
          } else if (linked.current.state !== 'idle') {
            return `rejected arrival did not reset to idle: ${JSON.stringify(linked.current)}`
          }
          break
        }
        case 'load': {
          let expected = linked.current.state === 'settled' && linked.current.hash && !restoring
          let should = linked.shouldRealignOnLoad()
          if (should !== expected) {
            return `shouldRealignOnLoad()=${should}, expected ${expected} in ${JSON.stringify(linked.current)}`
          }
          if (should && h.hash) {
            h.jumpingToken = null
            let token = linked.startHash(h.hash, { opened: true, missing: false })
            h.activeHashToken = token
            h.activePickToken = null
            h.activeTripToken = null
            h.pendingHashes.push({ token, id: h.hash, opened: true, missing: false })
          }
          break
        }
        case 'hashChange': {
          h.pageTouched = false
          h.jumpingToken = null
          h.activeHashToken = null
          h.activePickToken = null
          h.activeTripToken = null
          h.hash = step.id
          linked.hashChanged()
          if (step.id) {
            let token = linked.startHash(step.id, { opened: false, missing: step.missing })
            h.activeHashToken = token
            h.pendingHashes.push({ token, id: step.id, opened: false, missing: step.missing })
          }
          break
        }
        case 'clickChip': {
          h.jumpingToken = null
          let token = linked.startPick()
          h.activeHashToken = null
          h.activePickToken = token
          h.activeTripToken = null
          h.pendingPicks.push({ token, card: step.card })
          break
        }
        case 'completeChip': {
          let req = h.pendingPicks.splice(step.index, 1)[0]
          if (!req) break
          let isActive = h.activePickToken === req.token
          let current = linked.isCurrent(req.token)
          // Invariant 4: stale chip load after user movement, hashchange, or newer pick is ignored.
          if (current !== isActive) {
            return `stale chip load accepted (isCurrent=${current}, expected ${isActive})`
          }
          if (!current) break
          h.activePickToken = null
          if (!step.found) break
          let { token, replaceHash } = linked.startTrip(req.card, { carry: true })
          if (!replaceHash) return 'carrying chip trip did not request replaceHash'
          h.hash = req.card
          h.activeTripToken = token
          h.jumpingToken = token
          h.pendingTrips.push({ token, card: req.card, carry: true })
          break
        }
        case 'jumpPick': {
          let { token, replaceHash } = linked.startTrip(step.card, { carry: true })
          if (!replaceHash) return 'carrying jump trip did not request replaceHash'
          h.hash = step.card
          h.activeHashToken = null
          h.activePickToken = null
          h.activeTripToken = token
          h.jumpingToken = token
          h.pendingTrips.push({ token, card: step.card, carry: true })
          break
        }
        case 'tabSlide': {
          let { token, replaceHash } = linked.startTrip(step.card, { carry: false })
          if (replaceHash) return 'non-carrying Tab slide requested replaceHash'
          h.activeHashToken = null
          h.activePickToken = null
          h.activeTripToken = token
          h.jumpingToken = token
          h.pendingTrips.push({ token, card: step.card, carry: false })
          break
        }
        case 'completeTrip': {
          let req = h.pendingTrips.splice(step.index, 1)[0]
          if (!req) break
          let before = linked.current
          let isActive = h.activeTripToken === req.token
          let ownsJump = linked.completeTrip(req.token)

          // Invariant 5: stale scroll/timeout completion never clears a newer active jump or mutates state.
          if (!isActive) {
            if (ownsJump) return `stale trip cleared active jump (jumpingToken=${h.jumpingToken})`
            if (linked.current !== before) return `stale trip mutated state to ${JSON.stringify(linked.current)}`
            break
          }
          if (!ownsJump) return 'active trip did not receive jump ownership on completion'
          h.activeTripToken = null
          h.jumpingToken = null
          // Invariant 6: non-carrying Tab slide stays idle; carrying trip settles with hash: false.
          if (req.carry) {
            if (linked.current.state !== 'settled' || linked.current.card !== req.card || linked.current.hash !== false) {
              return `carrying trip ended in ${JSON.stringify(linked.current)}`
            }
          } else if (linked.current.state !== 'idle') {
            return `non-carrying Tab slide ended in ${JSON.stringify(linked.current)} instead of idle`
          }
          break
        }
        case 'userMoved': {
          h.activeHashToken = null
          h.activePickToken = null
          h.activeTripToken = null
          h.jumpingToken = null
          linked.userMoved()
          if (linked.current.state !== 'idle') return `userMoved left state ${linked.current.state}`
          break
        }
        case 'touchPage': {
          h.pageTouched = true
          linked.touchPage()
          break
        }
      }

      return checkCardInViewInvariants(linked)
    },
  }
  return h
}

// Invariant 7: carried card for the language flag always matches the state contract.
function checkCardInViewInvariants(linked: LinkedCard<Card>): string | null {
  let state: Linked<Card> = linked.current
  let fallback = (): Card | undefined => 'F' as unknown as Card

  if (state.state === 'travelling') {
    // Mid-slide, destination is off-screen (shown = 0): flag must still carry destination.
    let carried = linked.cardInView(() => 0, fallback)
    if (carried !== state.card) {
      return `in-flight flag carried ${String(carried)} instead of travelling card ${state.card}`
    }
  } else if (state.state === 'settled') {
    // Clamped arrival (shown = 0.6 while another card F leads): flag must still carry settled card.
    let clamped = linked.cardInView((c) => (c === state.card ? 0.6 : 0), fallback)
    if (clamped !== state.card) {
      return `clamped settled card ${state.card} lost to ${String(clamped)}`
    }
    // Once scrolled mostly away (shown = 0.2): flag falls back to F.
    let gone = linked.cardInView(() => 0.2, fallback)
    if (gone !== ('F' as unknown as Card)) {
      return `off-screen settled card ${state.card} was still carried (${String(gone)})`
    }
  } else {
    // idle or arriving: flag follows fallback F.
    let idle = linked.cardInView(() => 1, fallback)
    if (idle !== ('F' as unknown as Card)) {
      return `${state.state} carried ${String(idle)} instead of fallback`
    }
  }
  return null
}

function formatStep(step: Step): string {
  switch (step.kind) {
    case 'openHash': return `open(#${step.id}, missing=${step.missing})`
    case 'completeHash': return `completeHash[${step.index}](found=${step.found}, railInView=${step.railInView})`
    case 'load': return 'window.load'
    case 'hashChange': return `hashchange(#${step.id}, missing=${step.missing})`
    case 'clickChip': return `clickChip(${step.card})`
    case 'completeChip': return `completeChip[${step.index}](found=${step.found})`
    case 'jumpPick': return `jumpPick(${step.card})`
    case 'tabSlide': return `tabSlide(${step.card})`
    case 'completeTrip': return `completeTrip[${step.index}]`
    case 'userMoved': return 'userMoved'
    case 'touchPage': return 'touchPage'
  }
}

function enabledSteps(h: Harness): Step[] {
  let steps: Step[] = []
  for (let i = 0; i < h.pendingHashes.length; i++) {
    steps.push({ kind: 'completeHash', index: i, found: true, railInView: true })
    if (h.restoring) steps.push({ kind: 'completeHash', index: i, found: true, railInView: false })
    steps.push({ kind: 'completeHash', index: i, found: false, railInView: true })
  }
  for (let i = 0; i < h.pendingPicks.length; i++) {
    steps.push({ kind: 'completeChip', index: i, found: true })
    steps.push({ kind: 'completeChip', index: i, found: false })
  }
  for (let i = 0; i < h.pendingTrips.length; i++) {
    steps.push({ kind: 'completeTrip', index: i })
  }
  // Keep at most 2 pending requests of each kind to bound the state space while allowing old+new races.
  if (h.pendingHashes.length < 2) {
    steps.push({ kind: 'hashChange', id: 'B', missing: true })
    steps.push({ kind: 'hashChange', id: 'A', missing: false })
    steps.push({ kind: 'hashChange', id: '', missing: false })
  }
  if (h.pendingPicks.length < 2) {
    steps.push({ kind: 'clickChip', card: 'B' })
  }
  if (h.pendingTrips.length < 2) {
    steps.push({ kind: 'jumpPick', card: 'B' })
    steps.push({ kind: 'tabSlide', card: 'B' })
  }
  steps.push({ kind: 'load' })
  steps.push({ kind: 'userMoved' })
  steps.push({ kind: 'touchPage' })
  return steps
}

function stateSignature(h: Harness): string {
  let cur = h.linked.current
  let curSig = cur.state === 'idle' ? 'idle'
    : cur.state === 'arriving' ? `arr:${cur.id}`
    : cur.state === 'travelling' ? `trv:${cur.card}`
    : `set:${cur.card}:${cur.hash ? 1 : 0}`
  let hashes = h.pendingHashes.map((p) => `${p.token === h.activeHashToken ? '*' : ''}${p.id}${p.opened ? 'o' : ''}${p.missing ? 'm' : ''}`).join(',')
  let picks = h.pendingPicks.map((p) => `${p.token === h.activePickToken ? '*' : ''}${p.card}`).join(',')
  let trips = h.pendingTrips.map((p) => `${p.token === h.activeTripToken ? '*' : ''}${p.card}${p.carry ? 'c' : ''}`).join(',')
  return `${h.restoring ? 'R' : 'F'}|${curSig}|h:${h.hash}|pt:${h.pageTouched ? 1 : 0}|j:${h.jumpingToken ? 1 : 0}|H:${hashes}|P:${picks}|T:${trips}`
}

function explore(maxDepth: number, bug?: HistoricalBug): {
  states: number
  transitions: number
  reached: Set<string>
  violation: string | null
} {
  let visited = new Set<string>()
  let reached = new Set<string>()
  let transitions = 0
  let queue: { restoring: boolean; steps: Step[] }[] = [
    { restoring: false, steps: [{ kind: 'openHash', id: 'A', missing: true }] },
    { restoring: false, steps: [{ kind: 'openHash', id: 'A', missing: false }] },
    { restoring: true, steps: [{ kind: 'openHash', id: 'A', missing: true }] },
    { restoring: true, steps: [{ kind: 'openHash', id: 'A', missing: false }] },
    { restoring: false, steps: [] },
  ]

  let record = (h: Harness, step?: Step) => {
    let cur = h.linked.current
    reached.add(cur.state === 'settled' ? `settled:${cur.hash ? 'hash' : 'pick'}` : cur.state)
    if (step?.kind === 'completeHash' && h.activeHashToken === null && cur.state === 'idle' && h.restoring && !step.railInView) {
      reached.add('back:offscreen-rejected')
    }
    if (step?.kind === 'completeHash' && cur.state === 'settled' && h.restoring && step.railInView) {
      reached.add('back:onscreen-aligned')
    }
    if (step?.kind === 'load' && cur.state === 'arriving') {
      reached.add('load:realigned')
    }
  }

  let head = 0
  while (head < queue.length) {
    let node = queue[head++]!
    let h = createHarness(node.restoring, bug)
    for (let step of node.steps) {
      let err = h.apply(step)
      if (err) return { states: visited.size, transitions, reached, violation: `${err} after [${h.trace.join(' → ')}]` }
      record(h, step)
    }
    let sig = stateSignature(h)
    if (visited.has(sig)) continue
    visited.add(sig)
    if (node.steps.length >= maxDepth) continue

    for (let next of enabledSteps(h)) {
      transitions++
      let child = createHarness(node.restoring, bug)
      for (let step of node.steps) child.apply(step)
      let hadStaleHash = next.kind === 'completeHash' && child.pendingHashes[next.index]?.token !== child.activeHashToken
      let hadStaleChip = next.kind === 'completeChip' && child.pendingPicks[next.index]?.token !== child.activePickToken
      let hadStaleTrip = next.kind === 'completeTrip' && child.pendingTrips[next.index]?.token !== child.activeTripToken
      let hadTabSlide = next.kind === 'completeTrip' && child.pendingTrips[next.index]?.token === child.activeTripToken && !child.pendingTrips[next.index]?.carry
      let err = child.apply(next)
      if (err) return { states: visited.size, transitions, reached, violation: `${err} after [${child.trace.join(' → ')}]` }
      record(child, next)
      if (hadStaleHash) reached.add('stale:hash-rejected')
      if (hadStaleChip) reached.add('stale:chip-rejected')
      if (hadStaleTrip) reached.add('stale:trip-rejected')
      if (hadTabSlide) reached.add('tab:stayed-idle')
      let childSig = stateSignature(child)
      if (!visited.has(childSig)) queue.push({ restoring: node.restoring, steps: [...node.steps, next] })
    }
  }
  return { states: visited.size, transitions, reached, violation: null }
}

describe('linked-card state model', () => {
  it('holds all scroll, URL, jump, and flag invariants across every reachable interleaving', () => {
    let result = explore(4)
    assert.equal(result.violation, null, result.violation ?? '')
    assert.ok(result.states > 500, `explored ${result.states} distinct states`)
    assert.ok(result.transitions > 5000, `checked ${result.transitions} transitions`)
    for (let probe of [
      'idle',
      'arriving',
      'travelling',
      'settled:hash',
      'settled:pick',
      'back:offscreen-rejected',
      'back:onscreen-aligned',
      'load:realigned',
      'stale:hash-rejected',
      'stale:chip-rejected',
      'stale:trip-rejected',
      'tab:stayed-idle',
    ]) {
      assert.ok(result.reached.has(probe), `model did not reach ${probe}`)
    }
  })

  it('catches every restored historical transition with a counterexample', () => {
    let historical: [HistoricalBug, RegExp][] = [
      ['pre-237ac36-clamped-flag', /clamped settled card/],
      ['pre-a99ca60-stale-arrival', /stale arrival hijacked/],
      ['pre-a99ca60-inflight-flag', /in-flight flag carried/],
      ['pre-a99ca60-back-scroll', /scrollPage=true, expected false \(missing=true, restored=true/],
      ['pre-a99ca60-back-offscreen-align', /Back restoration moved off-screen/],
      ['pre-21ce2dd-double-scroll', /scrollPage=true, expected false \(missing=false, restored=false/],
      ['pre-pr7-tab-settles', /non-carrying Tab slide ended in/],
      ['pre-pr7-stale-jump-clears', /stale trip cleared active jump/],
      ['pre-pr7-stale-chip-load', /stale chip load accepted/],
    ]
    for (let [bug, pattern] of historical) {
      let result = explore(3, bug)
      assert.ok(result.violation, `${bug} was not caught by the model`)
      assert.match(result.violation, pattern, `${bug}: unexpected violation ${result.violation}`)
    }
  })
})
