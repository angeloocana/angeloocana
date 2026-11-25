import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  createLinkedCard,
  createPickEpoch,
  type HashAttempt,
  type HashOutcome,
  type Linked,
  type LinkedCard,
  type PickAttempt,
  type PickEpoch,
  type TripAttempt,
} from './linked.ts'

// Fixed-point exhaustive transition check against the real createLinkedCard owner (with a
// second rail sharing PickEpoch), plus historical regression replays. There is no depth
// cutoff: every reachable abstract state has every enabled transition checked until convergence.

type Card = 'A' | 'B'
type PageHash = Card | 'other' | ''

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
  | 'pre-pr7-cross-rail-chip-overwrite'
  | 'pre-pr7-early-scrollend-settles'

type Step =
  | { kind: 'openHash'; id: Card; missing: boolean }
  | { kind: 'completeActiveHash'; found: boolean; railInView: boolean }
  | { kind: 'completeStaleHash'; found: boolean; railInView: boolean }
  | { kind: 'load' }
  | { kind: 'hashChange'; id: Card | ''; missing: boolean }
  | { kind: 'clickChip' }
  | { kind: 'completeActivePick'; found: boolean }
  | { kind: 'completeStalePick'; found: boolean }
  | { kind: 'otherRailPick' }
  | { kind: 'jumpPick' }
  | { kind: 'tabSlide' }
  | { kind: 'scrollEndEarly' }
  | { kind: 'scrollEndAtGoal' }
  | { kind: 'tripTimeout' }
  | { kind: 'completeStaleTrip' }
  | { kind: 'userMoved' }
  | { kind: 'touchPage' }

type HashSlot = { attempt: HashAttempt<Card>; id: Card; opened: boolean; missing: boolean }
type PickSlot = { attempt: PickAttempt<Card>; card: Card; supersededByOtherRail: boolean }
type TripSlot = { attempt: TripAttempt; card: Card; carry: boolean }

// Re-enacts one historical transition on top of the production interface so the fixed-point
// invariant checker proves it catches each past bug without bug flags in production code.
function withHistoricalBug(
  base: LinkedCard<Card>,
  restoring: boolean,
  bug: HistoricalBug,
): LinkedCard<Card> {
  let pageTouched = false
  let currentToken = 0

  return {
    get current() {
      return base.current
    },
    beginHash(id, options) {
      let req = ++currentToken
      let real = base.beginHash(id, options)
      return {
        complete(result): HashOutcome {
          let stale = req !== currentToken
          if (bug === 'pre-a99ca60-stale-arrival') {
            let out = real.complete(result)
            if (stale && result.card && result.hashMatches) {
              let restored = options.opened && restoring
              if (!restored || result.railInView()) {
                return { alignRow: true, scrollPage: options.missing && !restored && !pageTouched }
              }
            }
            return out
          }
          if (bug === 'pre-a99ca60-back-scroll') {
            let out = real.complete(result)
            if (out.alignRow && options.opened && restoring && options.missing && !pageTouched) {
              return { alignRow: true, scrollPage: true }
            }
            return out
          }
          if (bug === 'pre-a99ca60-back-offscreen-align') {
            return real.complete({ ...result, railInView: () => true })
          }
          if (bug === 'pre-21ce2dd-double-scroll') {
            let out = real.complete(result)
            if (out.alignRow && !options.missing && !(options.opened && restoring) && !pageTouched) {
              return { alignRow: true, scrollPage: true }
            }
            return out
          }
          return real.complete(result)
        },
      }
    },
    shouldRealignOnLoad() {
      return base.shouldRealignOnLoad()
    },
    beginPick() {
      ++currentToken
      let real = base.beginPick()
      return {
        complete(card) {
          if (bug === 'pre-pr7-stale-chip-load') {
            let trip = real.complete(card)
            return trip ?? (card ? base.beginTrip(card, { carry: true }) : null)
          }
          return real.complete(card)
        },
      }
    },
    beginTrip(card, options) {
      let req = ++currentToken
      let real = base.beginTrip(card, options)
      return {
        replaceHash: real.replaceHash,
        finish(result) {
          if (bug === 'pre-pr7-early-scrollend-settles') {
            return real.finish({ atGoal: true, forced: result.forced })
          }
          if (bug === 'pre-pr7-tab-settles' && !options.carry) {
            let ok = real.finish(result)
            if (ok) {
              let fake = base.beginTrip(card, { carry: true })
              fake.finish({ atGoal: true, forced: true })
            }
            return ok
          }
          if (bug === 'pre-pr7-stale-jump-clears') {
            let ok = real.finish(result)
            return ok || (req !== currentToken && (result.atGoal || result.forced))
          }
          return real.finish(result)
        },
      }
    },
    userMoved() {
      ++currentToken
      base.userMoved()
    },
    touchPage() {
      pageTouched = true
      base.touchPage()
    },
    hashChanged() {
      ++currentToken
      pageTouched = false
      base.hashChanged()
    },
    cardInView(shown, fallback) {
      let state = base.current
      if (bug === 'pre-237ac36-clamped-flag') return fallback()
      if (bug === 'pre-a99ca60-inflight-flag' && state.state === 'travelling') {
        return shown(state.card) > 0 ? state.card : fallback()
      }
      return base.cardInView(shown, fallback)
    },
  }
}

interface Harness {
  readonly linked: LinkedCard<Card>
  readonly otherRail: LinkedCard<'other'>
  readonly restoring: boolean
  hash: PageHash
  pageTouched: boolean
  jumping: boolean
  activeHash: HashSlot | null
  staleHash: HashSlot | null
  activePick: PickSlot | null
  stalePick: PickSlot | null
  activeTrip: TripSlot | null
  staleTrip: TripSlot | null
  trace: string[]
  apply(step: Step): string | null
}

function createHarness(restoring: boolean, bug?: HistoricalBug): Harness {
  let picks: PickEpoch = createPickEpoch()
  let raw = createLinkedCard<Card>({ restoring, picks })
  let linked = bug ? withHistoricalBug(raw, restoring, bug) : raw
  // Simulate pre-PR7 independent rails by giving the second rail an isolated epoch for that bug.
  let otherPicks = bug === 'pre-pr7-cross-rail-chip-overwrite' ? createPickEpoch() : picks
  let otherRail = createLinkedCard<'other'>({ restoring, picks: otherPicks })

  let retireActive = (h: Harness) => {
    if (h.activeHash) { h.staleHash = h.activeHash; h.activeHash = null }
    if (h.activePick) { h.stalePick = h.activePick; h.activePick = null }
    if (h.activeTrip) { h.staleTrip = h.activeTrip; h.activeTrip = null }
  }

  let h: Harness = {
    linked,
    otherRail,
    restoring,
    hash: '',
    pageTouched: false,
    jumping: false,
    activeHash: null,
    staleHash: null,
    activePick: null,
    stalePick: null,
    activeTrip: null,
    staleTrip: null,
    trace: [],

    apply(step) {
      h.trace.push(formatStep(step))
      switch (step.kind) {
        case 'openHash': {
          retireActive(h)
          h.hash = step.id
          h.jumping = false
          let attempt = linked.beginHash(step.id, { opened: true, missing: step.missing })
          h.activeHash = { attempt, id: step.id, opened: true, missing: step.missing }
          break
        }
        case 'completeActiveHash': {
          let slot = h.activeHash
          if (!slot) break
          h.activeHash = null
          let hashMatches = h.hash === slot.id
          let railInViewChecks = 0
          let outcome = slot.attempt.complete({
            card: step.found ? slot.id : null,
            hashMatches,
            railInView: () => {
              railInViewChecks++
              return step.railInView
            },
          })
          let restored = slot.opened && restoring
          let shouldAlign = step.found && hashMatches && (!restored || step.railInView)
          let shouldScrollPage = shouldAlign && slot.missing && !restored && !h.pageTouched
          if (restored && !step.railInView && (outcome.alignRow || outcome.scrollPage)) {
            return `Back restoration moved off-screen rail/page (alignRow=${outcome.alignRow}, scrollPage=${outcome.scrollPage})`
          }
          if (outcome.scrollPage !== shouldScrollPage) {
            return `scrollPage=${outcome.scrollPage}, expected ${shouldScrollPage} (missing=${slot.missing}, restored=${restored}, pageTouched=${h.pageTouched})`
          }
          if (outcome.alignRow !== shouldAlign) {
            return `alignRow=${outcome.alignRow}, expected ${shouldAlign}`
          }
          if (!restored && railInViewChecks > 0) {
            return 'non-restoration arrival read railInView unnecessarily'
          }
          if (shouldAlign) {
            if (linked.current.state !== 'settled' || linked.current.card !== slot.id || !linked.current.hash) {
              return `aligned hash did not settle on ${slot.id}: ${JSON.stringify(linked.current)}`
            }
          } else if (linked.current.state !== 'idle') {
            return `rejected arrival did not reset to idle: ${JSON.stringify(linked.current)}`
          }
          break
        }
        case 'completeStaleHash': {
          let slot = h.staleHash
          if (!slot) break
          h.staleHash = null
          let before = linked.current
          let railInViewChecks = 0
          let outcome = slot.attempt.complete({
            card: step.found ? slot.id : null,
            hashMatches: h.hash === slot.id,
            railInView: () => {
              railInViewChecks++
              return step.railInView
            },
          })
          if (outcome.alignRow || outcome.scrollPage || linked.current !== before) {
            return `stale arrival hijacked row/page (alignRow=${outcome.alignRow}, scrollPage=${outcome.scrollPage})`
          }
          if (railInViewChecks > 0) return 'stale arrival forced a layout read'
          break
        }
        case 'load': {
          let expected = linked.current.state === 'settled' && linked.current.hash && !restoring
          let should = linked.shouldRealignOnLoad()
          if (should !== expected) {
            return `shouldRealignOnLoad()=${should}, expected ${expected} in ${JSON.stringify(linked.current)}`
          }
          if (should && (h.hash === 'A' || h.hash === 'B')) {
            retireActive(h)
            h.jumping = false
            let attempt = linked.beginHash(h.hash, { opened: true, missing: false })
            h.activeHash = { attempt, id: h.hash, opened: true, missing: false }
          }
          break
        }
        case 'hashChange': {
          retireActive(h)
          h.pageTouched = false
          h.jumping = false
          h.hash = step.id
          linked.hashChanged()
          if (step.id) {
            let attempt = linked.beginHash(step.id, { opened: false, missing: step.missing })
            h.activeHash = { attempt, id: step.id, opened: false, missing: step.missing }
          }
          break
        }
        case 'clickChip': {
          retireActive(h)
          h.jumping = false
          let attempt = linked.beginPick()
          h.activePick = { attempt, card: 'B', supersededByOtherRail: false }
          break
        }
        case 'completeActivePick': {
          let slot = h.activePick
          if (!slot) break
          h.activePick = null
          let trip = slot.attempt.complete(step.found ? slot.card : null)
          if (slot.supersededByOtherRail) {
            if (trip !== null) return 'pending chip overwrote newer pick on another rail'
            break
          }
          if (!step.found) {
            if (trip !== null) return 'missing chip target started a trip'
            break
          }
          if (!trip) return 'active chip pick was rejected'
          if (!trip.replaceHash) return 'carrying chip trip did not request replaceHash'
          h.hash = slot.card
          h.jumping = true
          h.activeTrip = { attempt: trip, card: slot.card, carry: true }
          break
        }
        case 'completeStalePick': {
          let slot = h.stalePick
          if (!slot) break
          h.stalePick = null
          let before = linked.current
          let trip = slot.attempt.complete(step.found ? slot.card : null)
          if (trip !== null || linked.current !== before) {
            return 'stale chip load hijacked row/URL'
          }
          break
        }
        case 'otherRailPick': {
          // Another rail (e.g. Career) picks a card and writes location.hash via replaceState (no hashchange).
          let otherTrip = otherRail.beginTrip('other', { carry: true })
          otherTrip.finish({ atGoal: true, forced: true })
          h.hash = 'other'
          if (h.activePick) h.activePick.supersededByOtherRail = true
          break
        }
        case 'jumpPick': {
          retireActive(h)
          let trip = linked.beginTrip('B', { carry: true })
          if (!trip.replaceHash) return 'carrying jump trip did not request replaceHash'
          h.hash = 'B'
          h.jumping = true
          h.activeTrip = { attempt: trip, card: 'B', carry: true }
          break
        }
        case 'tabSlide': {
          retireActive(h)
          let trip = linked.beginTrip('B', { carry: false })
          if (trip.replaceHash) return 'non-carrying Tab slide requested replaceHash'
          h.jumping = true
          h.activeTrip = { attempt: trip, card: 'B', carry: false }
          break
        }
        case 'scrollEndEarly': {
          let slot = h.activeTrip
          if (!slot) break
          let before = linked.current
          // A queued scrollend from an earlier scroll arrives before the track reaches the new destination.
          let done = slot.attempt.finish({ atGoal: false, forced: false })
          if (done || linked.current !== before) {
            return `early scrollend settled/cleared active trip before reaching goal (done=${done})`
          }
          break
        }
        case 'scrollEndAtGoal':
        case 'tripTimeout': {
          let slot = h.activeTrip
          if (!slot) break
          let forced = step.kind === 'tripTimeout'
          let done = slot.attempt.finish({ atGoal: !forced, forced })
          if (!done) return `active trip refused completion (${step.kind})`
          h.activeTrip = null
          h.jumping = false
          if (slot.carry) {
            if (linked.current.state !== 'settled' || linked.current.card !== slot.card || linked.current.hash !== false) {
              return `carrying trip ended in ${JSON.stringify(linked.current)}`
            }
          } else if (linked.current.state !== 'idle') {
            return `non-carrying Tab slide ended in ${JSON.stringify(linked.current)} instead of idle`
          }
          // Calling the same finish callback a second time (e.g. timer after scrollend) must be a no-op.
          if (slot.attempt.finish({ atGoal: true, forced: true })) {
            return 'completed trip accepted a duplicate finish'
          }
          break
        }
        case 'completeStaleTrip': {
          let slot = h.staleTrip
          if (!slot) break
          h.staleTrip = null
          let before = linked.current
          let done = slot.attempt.finish({ atGoal: true, forced: true })
          if (done || linked.current !== before) {
            return `stale trip cleared active jump or mutated state (done=${done}, jumping=${h.jumping})`
          }
          break
        }
        case 'userMoved': {
          retireActive(h)
          h.jumping = false
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

function checkCardInViewInvariants(linked: LinkedCard<Card>): string | null {
  let state: Linked<Card> = linked.current
  let fallback = (): Card | undefined => 'F' as unknown as Card

  if (state.state === 'travelling') {
    let carried = linked.cardInView(() => 0, fallback)
    if (carried !== state.card) {
      return `in-flight flag carried ${String(carried)} instead of travelling card ${state.card}`
    }
  } else if (state.state === 'settled') {
    let clamped = linked.cardInView((c) => (c === state.card ? 0.6 : 0), fallback)
    if (clamped !== state.card) {
      return `clamped settled card ${state.card} lost to ${String(clamped)}`
    }
    let gone = linked.cardInView(() => 0.2, fallback)
    if (gone !== ('F' as unknown as Card)) {
      return `off-screen settled card ${state.card} was still carried (${String(gone)})`
    }
  } else {
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
    case 'completeActiveHash': return `completeHash(found=${step.found}, railInView=${step.railInView})`
    case 'completeStaleHash': return `completeStaleHash(found=${step.found}, railInView=${step.railInView})`
    case 'load': return 'window.load'
    case 'hashChange': return `hashchange(#${step.id}, missing=${step.missing})`
    case 'clickChip': return 'clickChip(B)'
    case 'completeActivePick': return `completePick(found=${step.found})`
    case 'completeStalePick': return `completeStalePick(found=${step.found})`
    case 'otherRailPick': return 'otherRailPick(#other)'
    case 'jumpPick': return 'jumpPick(B)'
    case 'tabSlide': return 'tabSlide(B)'
    case 'scrollEndEarly': return 'scrollend(atGoal=false)'
    case 'scrollEndAtGoal': return 'scrollend(atGoal=true)'
    case 'tripTimeout': return 'tripTimeout'
    case 'completeStaleTrip': return 'completeStaleTrip'
    case 'userMoved': return 'userMoved'
    case 'touchPage': return 'touchPage'
  }
}

function enabledSteps(h: Harness): Step[] {
  let steps: Step[] = []
  if (h.activeHash) {
    steps.push({ kind: 'completeActiveHash', found: true, railInView: true })
    if (h.restoring) steps.push({ kind: 'completeActiveHash', found: true, railInView: false })
    steps.push({ kind: 'completeActiveHash', found: false, railInView: true })
  }
  if (h.staleHash) {
    steps.push({ kind: 'completeStaleHash', found: true, railInView: true })
    if (h.restoring) steps.push({ kind: 'completeStaleHash', found: true, railInView: false })
  }
  if (h.activePick) {
    steps.push({ kind: 'completeActivePick', found: true })
    steps.push({ kind: 'completeActivePick', found: false })
  }
  if (h.stalePick) {
    steps.push({ kind: 'completeStalePick', found: true })
  }
  if (h.activeTrip) {
    steps.push({ kind: 'scrollEndEarly' })
    steps.push({ kind: 'scrollEndAtGoal' })
    steps.push({ kind: 'tripTimeout' })
  }
  if (h.staleTrip) {
    steps.push({ kind: 'completeStaleTrip' })
  }
  steps.push(
    { kind: 'hashChange', id: 'B', missing: true },
    { kind: 'hashChange', id: 'A', missing: false },
    { kind: 'hashChange', id: '', missing: false },
    { kind: 'clickChip' },
    { kind: 'otherRailPick' },
    { kind: 'jumpPick' },
    { kind: 'tabSlide' },
    { kind: 'load' },
    { kind: 'userMoved' },
    { kind: 'touchPage' },
  )
  return steps
}

function stateSignature(h: Harness): string {
  let cur = h.linked.current
  let curSig = cur.state === 'idle' ? 'idle'
    : cur.state === 'arriving' ? `arr:${cur.id}`
    : cur.state === 'travelling' ? `trv:${cur.card}`
    : `set:${cur.card}:${cur.hash ? 1 : 0}`
  let ah = h.activeHash ? `${h.activeHash.id}${h.activeHash.opened ? 'o' : ''}${h.activeHash.missing ? 'm' : ''}` : '-'
  let sh = h.staleHash ? `${h.staleHash.id}${h.staleHash.opened ? 'o' : ''}${h.staleHash.missing ? 'm' : ''}` : '-'
  let ap = h.activePick ? (h.activePick.supersededByOtherRail ? 'X' : '1') : '-'
  let sp = h.stalePick ? '1' : '-'
  let at = h.activeTrip ? `${h.activeTrip.card}${h.activeTrip.carry ? 'c' : ''}` : '-'
  let st = h.staleTrip ? `${h.staleTrip.card}${h.staleTrip.carry ? 'c' : ''}` : '-'
  return `${h.restoring ? 'R' : 'F'}|${curSig}|h:${h.hash}|pt:${h.pageTouched ? 1 : 0}|j:${h.jumping ? 1 : 0}|ah:${ah}|sh:${sh}|ap:${ap}|sp:${sp}|at:${at}|st:${st}`
}

// Exhaustive BFS over the entire finite abstract state space (no depth limit):
// terminates only when every reachable state has had every enabled transition checked.
function exploreToFixedPoint(bug?: HistoricalBug): {
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
    if (step?.kind === 'completeActiveHash' && cur.state === 'idle' && h.restoring && !step.railInView) {
      reached.add('back:offscreen-rejected')
    }
    if (step?.kind === 'completeActiveHash' && cur.state === 'settled' && h.restoring && step.railInView) {
      reached.add('back:onscreen-aligned')
    }
    if (step?.kind === 'load' && cur.state === 'arriving') reached.add('load:realigned')
    if (step?.kind === 'completeStaleHash') reached.add('stale:hash-rejected')
    if (step?.kind === 'completeStalePick') reached.add('stale:pick-rejected')
    if (step?.kind === 'completeStaleTrip') reached.add('stale:trip-rejected')
    if (step?.kind === 'scrollEndEarly') reached.add('trip:early-scrollend-ignored')
    if (step?.kind === 'completeActivePick' && h.hash === 'other') reached.add('cross-rail:chip-superseded')
    if (step?.kind === 'scrollEndAtGoal' && cur.state === 'idle') reached.add('tab:stayed-idle')
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

    for (let next of enabledSteps(h)) {
      transitions++
      let child = createHarness(node.restoring, bug)
      for (let step of node.steps) child.apply(step)
      let err = child.apply(next)
      if (err) return { states: visited.size, transitions, reached, violation: `${err} after [${child.trace.join(' → ')}]` }
      record(child, next)
      let childSig = stateSignature(child)
      if (!visited.has(childSig)) queue.push({ restoring: node.restoring, steps: [...node.steps, next] })
    }
  }
  return { states: visited.size, transitions, reached, violation: null }
}

describe('linked-card state model', () => {
  it('exhausts every reachable abstract state and holds all scroll, URL, jump, and flag invariants', () => {
    let result = exploreToFixedPoint()
    assert.equal(result.violation, null, result.violation ?? '')
    assert.ok(result.states > 1000, `explored ${result.states} distinct states`)
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
      'stale:pick-rejected',
      'stale:trip-rejected',
      'trip:early-scrollend-ignored',
      'cross-rail:chip-superseded',
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
      ['pre-pr7-stale-chip-load', /stale chip load hijacked/],
      ['pre-pr7-cross-rail-chip-overwrite', /pending chip overwrote newer pick on another rail/],
      ['pre-pr7-early-scrollend-settles', /early scrollend settled\/cleared active trip/],
    ]
    for (let [bug, pattern] of historical) {
      let result = exploreToFixedPoint(bug)
      assert.ok(result.violation, `${bug} was not caught by the model`)
      assert.match(result.violation, pattern, `${bug}: unexpected violation ${result.violation}`)
    }
  })
})
