// The linked card: the one a #job-… / #clip-… in the address, a hobby chip or a jump link asked for.
// Keeps the four states (idle, arriving, travelling, settled), the request identity across async loads
// and smooth scrolls, and vertical-scroll ownership: the browser owns ordinary anchor scroll and history
// restoration; app code only supplies an anchor that was missing until clips loaded.

export type Linked<Card> =
  // nothing asked for: the flag carries the first card mostly in view
  | { state: 'idle' }
  // a #hash is waiting to be shown, maybe for the rest of the clips to load
  | { state: 'arriving'; id: string }
  // the row is sliding to a picked card (a chip, a jump link): that card is the one in view already
  | { state: 'travelling'; card: Card }
  // the row came to rest on the card: it stays the one to carry while it is at least half in view
  | { state: 'settled'; card: Card; hash: boolean }

export type HashOutcome = { alignRow: boolean; scrollPage: boolean }

/** Shared request identity across rails for picks that write the page URL via replaceState. */
export interface PickEpoch {
  current: number
}

export const createPickEpoch = (): PickEpoch => ({ current: 0 })

export interface HashAttempt<Card> {
  /** Finish an arriving #hash after any async load or restoration frame. */
  complete(result: { card: Card | null; hashMatches: boolean; railInView: () => boolean }): HashOutcome
}

export interface TripAttempt {
  /** Whether starting this trip should write the card's #id to the URL. */
  readonly replaceHash: boolean
  /** Finish a slide (scrollend with atGoal, or immediate/timeout with forced: true). Returns true only if this trip still owns and finishes the jump. */
  finish(result: { atGoal: boolean; forced: boolean }): boolean
}

export interface PickAttempt<Card> {
  /** Complete an async chip load. Returns the started trip only if no user move, hashchange, or newer pick on any rail superseded it. */
  complete(card: Card | null): TripAttempt | null
}

export interface LinkedCard<Card> {
  /** Current state snapshot (identity changes on every state transition). */
  readonly current: Linked<Card>
  /** Begin arriving at a #hash card (opened: initial load or load realign; missing: absent before load). */
  beginHash(id: string, options: { opened: boolean; missing: boolean }): HashAttempt<Card>
  /** Should window.load realign the row sideways for a settled #hash? */
  shouldRealignOnLoad(): boolean
  /** Claim ownership while a chip awaits clip loading; supersedes any pending arrival or earlier pick. */
  beginPick(): PickAttempt<Card>
  /** Begin sliding the row to a card (carry: chip or jump link; false: Tab focus). */
  beginTrip(card: Card, options: { carry: boolean }): TripAttempt
  /** Visitor moved the row sideways: cancels any active linked state or in-flight request. */
  userMoved(): void
  /** Visitor scrolled the page vertically: app code will not move the page for a pending missing anchor. */
  touchPage(): void
  /** Address #hash changed: resets vertical touch and clears any previous linked state or request. */
  hashChanged(): void
  /** Card for the language flag to carry, or fallback (first card mostly in view). */
  cardInView(shown: (card: Card) => number, fallback: () => Card | undefined): Card | undefined
}

export function createLinkedCard<Card>({
  restoring,
  picks = createPickEpoch(),
  onChange,
}: {
  restoring: boolean
  picks?: PickEpoch
  onChange?: () => void
}): LinkedCard<Card> {
  let state: Linked<Card> = { state: 'idle' }
  let token = 0
  let pageTouched = false

  let setState = (next: Linked<Card>) => {
    state = next
    onChange?.()
  }

  let resetToIdle = () => {
    token++
    if (state.state !== 'idle') setState({ state: 'idle' })
  }

  let beginTrip = (card: Card, { carry }: { carry: boolean }): TripAttempt => {
    let req = ++token
    if (carry) {
      picks.current++
      setState({ state: 'travelling', card })
    } else if (state.state !== 'idle') {
      setState({ state: 'idle' })
    }
    let done = false
    return {
      replaceHash: carry,
      finish({ atGoal, forced }) {
        if (done || req !== token) return false
        if (!atGoal && !forced) return false
        done = true
        if (carry && state.state === 'travelling') setState({ state: 'settled', card, hash: false })
        return true
      },
    }
  }

  return {
    get current() {
      return state
    },

    beginHash(id, { opened, missing }) {
      let req = ++token
      let done = false
      setState({ state: 'arriving', id })
      return {
        complete({ card, hashMatches, railInView }) {
          if (done || req !== token) return { alignRow: false, scrollPage: false }
          done = true
          let restored = opened && restoring
          if (!card || !hashMatches || (restored && !railInView())) {
            setState({ state: 'idle' })
            return { alignRow: false, scrollPage: false }
          }
          setState({ state: 'settled', card, hash: true })
          return { alignRow: true, scrollPage: missing && !restored && !pageTouched }
        },
      }
    },

    shouldRealignOnLoad() {
      return state.state === 'settled' && state.hash && !restoring
    },

    beginPick() {
      let req = ++token
      let pickId = ++picks.current
      let done = false
      if (state.state !== 'idle') setState({ state: 'idle' })
      return {
        complete(card) {
          if (done || req !== token || pickId !== picks.current) return null
          done = true
          if (!card) return null
          return beginTrip(card, { carry: true })
        },
      }
    },

    beginTrip,

    userMoved() {
      resetToIdle()
    },

    touchPage() {
      pageTouched = true
    },

    hashChanged() {
      pageTouched = false
      resetToIdle()
    },

    cardInView(shown, fallback) {
      if (state.state === 'travelling') return state.card
      if (state.state === 'settled' && shown(state.card) >= 0.5) return state.card
      return fallback()
    },
  }
}
