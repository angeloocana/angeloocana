import type { CutCheck, Piece } from '../../content/cuts.ts'

type Action = 'save' | 'rebuild' | 'discard' | 'keep' | 'uncheck'
type Reply = Record<string, unknown>
type Initial = { current: Piece[]; draft: Piece[] | null; check: CutCheck | null; video: string }
type Options = {
  fetch: typeof fetch
  signal: AbortSignal
  update: () => void
  discarded: () => void
  rebuilt: () => void
}

const clone = (pieces: Piece[]) => pieces.map((piece) => ({ ...piece }))
const isObject = (value: unknown): value is Reply => value !== null && typeof value === 'object' && !Array.isArray(value)
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
function isPiece(value: unknown): value is Piece {
  if (!isObject(value) || typeof value.path !== 'string' || !isNumber(value.secs) || !isNumber(value.cx)) return false
  if (value.kind === 'img') return typeof value.zoomIn === 'boolean'
  return value.kind === 'vid' && isNumber(value.start) && isNumber(value.zoom) && isNumber(value.cy)
}
function isCheck(value: unknown): value is CutCheck | null {
  return value === null || (isObject(value) && (value.state === 'edited' || value.state === 'kept') && typeof value.at === 'string')
}

/** One write at a time, through response decoding. A reply can update what is on disk without
 * replacing a newer selection or its status. All retries use the selection still in the editor. */
export function createCutWrites(id: string, initial: Initial, { fetch, signal, update, discarded, rebuilt }: Options) {
  let state = {
    current: clone(initial.current),
    pieces: clone(initial.draft ?? initial.current),
    hasDraft: initial.draft !== null,
    check: initial.check,
    video: initial.video,
    unsaved: false,
    busy: null as 'rebuild' | 'discard' | null,
    marking: false,
    status: '',
    retry: null as 'save' | 'rebuild' | null,
    rebuildError: '',
    noteError: '',
  }
  let tail = Promise.resolve()
  let pendingWrites = 0
  let failedWrites = 0
  let revision = 0
  let noteRevision = 0
  let note = ''
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let noteTimer: ReturnType<typeof setTimeout> | undefined
  let path = `/review/cut/${id}`
  signal.addEventListener('abort', () => {
    clearTimeout(saveTimer)
    clearTimeout(noteTimer)
  }, { once: true })

  function send<T>(
    url: string, payload: { action: Action; pieces?: Piece[] } | { id: string; note: string },
    decode: (reply: Reply) => T | undefined, done: (result: { value: T } | { error: string }) => void,
    needed: () => boolean = () => true,
  ) {
    // Snapshot the submitted pieces now: the selection can change while this waits to send.
    let body = JSON.stringify(payload)
    pendingWrites++
    let write = tail.then(async () => {
      if (signal.aborted || !needed()) return
      let result: { value: T } | { error: string }
      try {
        let response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal })
        let reply: unknown = await response.json().catch(() => null)
        if (isObject(reply) && typeof reply.error === 'string' && reply.error) result = { error: reply.error }
        else if (!response.ok) result = { error: `Server returned HTTP ${response.status}.` }
        else {
          let value = isObject(reply) ? decode(reply) : undefined
          result = value === undefined ? { error: 'Unexpected response from the review server.' } : { value }
        }
      } catch {
        result = { error: 'Could not reach the review server.' }
      }
      if (signal.aborted) return
      if ('error' in result) failedWrites++
      done(result)
      update()
    })
    tail = write.catch(() => {}).finally(() => { pendingWrites-- })
    return tail
  }

  function saving() {
    state.retry = null
    state.status = state.pieces.length ? 'Saving…' : 'Pick at least one moment.'
    update()
  }

  function cancelAutosave() {
    clearTimeout(saveTimer)
    saveTimer = undefined
  }

  function save() {
    cancelAutosave()
    if (!state.pieces.length) return
    let version = revision
    if (state.retry === 'save') saving()
    return send(path, { action: 'save', pieces: state.pieces }, ({ draft }) => typeof draft === 'boolean' ? draft : undefined, (result) => {
      if ('value' in result) state.hasDraft = result.value
      if (version !== revision) return
      if ('error' in result) {
        state.status = `Draft not saved: ${result.error}`
        state.retry = 'save'
      } else {
        state.unsaved = false
        state.status = result.value ? 'Saved as a draft. Rebuild to put it in the clip.' : 'Same as the clip now.'
      }
    }, () => version === revision)
  }

  function changed() {
    revision++
    state.unsaved = true
    saving()
    clearTimeout(saveTimer)
    saveTimer = setTimeout(save, 500)
  }

  function rebuild() {
    if (state.busy || !state.pieces.length) return
    cancelAutosave()
    let version = ++revision
    state.busy = 'rebuild'
    state.retry = null
    state.rebuildError = ''
    state.status = 'Rebuilding the video…'
    update()
    return send(path, { action: 'rebuild', pieces: state.pieces }, ({ draft, current, check, video }) => {
      if (draft === false && Array.isArray(current) && current.length && current.every(isPiece) && isCheck(check) && typeof video === 'string' && video) {
        return { current, check, video }
      }
    }, (result) => {
      state.busy = null
      if ('value' in result) {
        // "The clip now" is the rendered cut, even if "Your cut" has moved on.
        Object.assign(state, result.value, { hasDraft: false })
        rebuilt()
      }
      if ('error' in result) state.rebuildError = `Rebuild failed: ${result.error}`
      if (version !== revision) return
      if ('error' in result) {
        state.unsaved = true
        state.status = ''
        state.retry = 'rebuild'
      } else {
        state.pieces = clone(state.current)
        state.unsaved = false
        state.status = 'Rebuilt: the clip now uses this cut.'
      }
    })
  }

  function discard() {
    if (state.busy || (!state.hasDraft && !state.unsaved)) return
    cancelAutosave()
    let version = ++revision
    state.busy = 'discard'
    state.retry = null
    state.status = 'Undoing changes…'
    update()
    return send(path, { action: 'discard' }, ({ draft }) => draft === false ? false : undefined, (result) => {
      state.busy = null
      if ('value' in result) state.hasDraft = false
      if (version !== revision) return
      if ('error' in result) {
        state.unsaved = true
        state.status = `Could not undo changes: ${result.error} Try Undo changes again.`
      } else {
        state.pieces = clone(state.current)
        state.unsaved = false
        state.status = 'Back to the cut the clip uses now.'
        discarded()
      }
    })
  }

  function mark(action: 'keep' | 'uncheck') {
    if (state.hasDraft || state.unsaved || state.busy || state.marking) return
    let version = revision
    state.marking = true
    update()
    return send(path, { action }, ({ check }) => {
      if (isCheck(check) && (action === 'uncheck' ? check === null : check?.state === 'kept')) return check
    }, (result) => {
      state.marking = false
      if ('value' in result) state.check = result.value
      if (version !== revision) return
      state.status = 'error' in result ? `Could not change the check mark: ${result.error} Try again.` : ''
    })
  }

  function writeNote() {
    clearTimeout(noteTimer)
    noteTimer = undefined
    let version = noteRevision
    if (state.noteError) {
      state.noteError = ''
      update()
    }
    return send('/review', { id, note }, (reply) => reply.id === id ? true : undefined, (result) => {
      if (version === noteRevision && 'error' in result) state.noteError = `Note not saved: ${result.error}`
    }, () => version === noteRevision)
  }

  function saveNote(text: string) {
    note = text
    noteRevision++
    if (state.noteError) {
      state.noteError = ''
      update()
    }
    clearTimeout(noteTimer)
    noteTimer = setTimeout(writeNote, 400)
  }

  return {
    state, changed, save, rebuild, discard, mark, saveNote, retryNote: writeNote,
    pending: () => Boolean(pendingWrites || saveTimer || noteTimer || state.unsaved || state.noteError),
    async settle() {
      let failures = failedWrites
      if (saveTimer) void save()
      if (noteTimer) void writeNote()
      await tail
      return failures === failedWrites
    },
  }
}
