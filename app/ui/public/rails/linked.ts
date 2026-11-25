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

export interface LinkedCard<Card> {
  /** Current state snapshot (identity changes on every state transition). */
  readonly current: Linked<Card>
  /** Begin arriving at a #hash card (opened: initial load or load realign; missing: absent before load). */
  startHash(id: string, options: { opened: boolean; missing: boolean }): number
  /** Finish an arriving #hash after any async load or restoration frame. */
  completeHash(token: number, result: { card: Card | null; hashMatches: boolean; railInView: () => boolean }): HashOutcome
  /** Should window.load realign the row sideways for a settled #hash? */
  shouldRealignOnLoad(): boolean
  /** Claim ownership while a chip awaits clip loading; supersedes any pending arrival or earlier pick. */
  startPick(): number
  /** Whether an async pick token is still the active request. */
  isCurrent(token: number): boolean
  /** Begin sliding the row to a card (carry: chip or jump link; false: Tab focus). */
  startTrip(card: Card, options: { carry: boolean }): { token: number; replaceHash: boolean }
  /** Finish a slide (immediate, scrollend, or timeout). Returns true only if this trip still owns the jump. */
  completeTrip(token: number): boolean
  /** Visitor moved the row sideways: cancels any active linked state or in-flight request. */
  userMoved(): void
  /** Visitor scrolled the page vertically: app code will not move the page for a pending missing anchor. */
  touchPage(): void
  /** Address #hash changed: resets vertical touch and clears any previous linked state or request. */
  hashChanged(): void
  /** Card for the language flag to carry, or fallback (first card mostly in view). */
  cardInView(shown: (card: Card) => number, fallback: () => Card | undefined): Card | undefined
}

export function createLinkedCard<Card>({ restoring, onChange }: { restoring: boolean; onChange?: () => void }): LinkedCard<Card> {
  let state: Linked<Card> = { state: 'idle' }
  let token = 0
  let pageTouched = false
  let pendingHash: { token: number; opened: boolean; missing: boolean } | null = null
  let activeTrip: { token: number; card: Card; carry: boolean } | null = null

  let setState = (next: Linked<Card>) => {
    state = next
    onChange?.()
  }

  let resetToIdle = () => {
    token++
    pendingHash = null
    activeTrip = null
    if (state.state !== 'idle') setState({ state: 'idle' })
  }

  return {
    get current() {
      return state
    },

    startHash(id, { opened, missing }) {
      let req = ++token
      activeTrip = null
      pendingHash = { token: req, opened, missing }
      setState({ state: 'arriving', id })
      return req
    },

    completeHash(req, { card, hashMatches, railInView }) {
      if (req !== token || !pendingHash || pendingHash.token !== req) return { alignRow: false, scrollPage: false }
      let { opened, missing } = pendingHash
      pendingHash = null
      let restored = opened && restoring
      if (!card || !hashMatches || (restored && !railInView())) {
        setState({ state: 'idle' })
        return { alignRow: false, scrollPage: false }
      }
      setState({ state: 'settled', card, hash: true })
      return { alignRow: true, scrollPage: missing && !restored && !pageTouched }
    },

    shouldRealignOnLoad() {
      return state.state === 'settled' && state.hash && !restoring
    },

    startPick() {
      let req = ++token
      pendingHash = null
      activeTrip = null
      if (state.state !== 'idle') setState({ state: 'idle' })
      return req
    },

    isCurrent(req) {
      return req === token
    },

    startTrip(card, { carry }) {
      let req = ++token
      pendingHash = null
      activeTrip = { token: req, card, carry }
      if (carry) setState({ state: 'travelling', card })
      else if (state.state !== 'idle') setState({ state: 'idle' })
      return { token: req, replaceHash: carry }
    },

    completeTrip(req) {
      if (req !== token || !activeTrip || activeTrip.token !== req) return false
      let trip = activeTrip
      activeTrip = null
      if (trip.carry && state.state === 'travelling') setState({ state: 'settled', card: trip.card, hash: false })
      return true
    },

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
