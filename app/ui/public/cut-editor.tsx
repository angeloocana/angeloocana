import { clientEntry, on, ref } from 'remix/component'
import type { Handle } from 'remix/component'

import type { CutCheck, Moment, Piece, Source } from '../../content/cuts.ts'

// The local cut editor (/review/cut/:id). On the right, every short moment of the clip's source videos:
// hover one to watch it, click it to add it to the cut or take it out. On the left, the clip as it is now,
// a preview of the new cut, and its pieces in order, each with its own trim and framing. Changes save as a
// draft; "Rebuild video" renders it (or ask Claude to run `clips.py rebuild`).

type Props = {
  clip: { id: string; title: string; cat: string; rejected: boolean }
  /** How the clip's video is made now (empty if that was never recorded). */
  current: Piece[]
  draft: Piece[] | null
  /** The clip's own source video, when there is no recipe to tell. */
  ownSource?: string
  sources: Source[]
  video: string
  note: string
  /** Whether this clip's cut was checked (edited or kept as it was), and when. */
  check: CutCheck | null
  /** The next clip on the home page whose cut is not checked yet. */
  next: { id: string; title: string } | null
  /** How many clips on the home page have their cut checked, this one included. */
  progress: { checked: number; total: number }
}

type MomentSet = { id: string; dur: number; w: number; h: number; cols: number; moments: Moment[]; sheet: string }
type Shot = { kind: 'vid' | 'img'; path: string; start: number; end: number; cx: number; zoom: number; cy: number }

const TILE_H = 120
const MIN_OVERLAP = 0.15
const round = (n: number) => Math.round(n * 100) / 100
const overlap = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0))
const end = (p: Piece & { kind: 'vid' }) => p.start + p.secs
const clone = (pieces: Piece[]) => pieces.map((p) => ({ ...p }))
const day = (at: string) => new Date(at).toLocaleDateString('en', { month: 'short', day: 'numeric' })
const sourceUrl = (path: string) => `/review/source?path=${encodeURIComponent(path)}`
function time(seconds: number) {
  let m = Math.floor(seconds / 60)
  let s = seconds - m * 60
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`
}
/** 0..1 from the average change between frames: about 0.002 is a still shot, 0.05 a lot of action. */
const motionLevel = (motion: number) => Math.max(0, Math.min(1, Math.log10(Math.max(motion, 0.002) / 0.002) / Math.log10(25)))

export const CutEditor = clientEntry(import.meta.url, function CutEditor(handle: Handle<Props>) {
  let { clip, sources, next, progress } = handle.props
  let byPath = new Map(sources.map((s) => [s.path, s]))
  let byId = new Map(sources.map((s) => [s.id, s]))
  let current = clone(handle.props.current)
  let pieces = clone(handle.props.draft ?? current)
  let hasDraft = Boolean(handle.props.draft)
  let video = handle.props.video
  let note = handle.props.note
  let check = handle.props.check
  // checked = edited or kept, with no draft waiting (the same rule as the marks on /review)
  let isChecked = () => Boolean(check) && !hasDraft && !clip.rejected
  let othersChecked = progress.checked - Number(isChecked())
  let status = ''
  let busy = false
  let focus = pieces.length ? 0 : -1
  let playing = -1
  let wide = false
  let picker = false
  let query = ''

  // the source videos shown on the right, in the order the cut uses them
  let panels: string[] = []
  let addPanel = (path: string | undefined) => {
    let id = path && byPath.get(path)?.id
    if (id && !panels.includes(id)) panels.push(id)
  }
  for (let p of [...current, ...pieces]) if (p.kind === 'vid') addPanel(p.path)
  addPanel(handle.props.ownSource)
  let sets = new Map<string, MomentSet | 'loading' | 'failed'>()

  // ---- saving ----

  let saveTimer: ReturnType<typeof setTimeout> | undefined
  async function post(body: Record<string, unknown>) {
    let response = await fetch(`/review/cut/${clip.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return (await response.json().catch(() => ({ error: `Error ${response.status}` }))) as { draft?: boolean; error?: string; video?: string; current?: Piece[]; check?: CutCheck | null }
  }
  function changed() {
    status = 'Saving…'
    handle.update()
    clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      if (!pieces.length) {
        status = 'Pick at least one moment.'
        return handle.update()
      }
      let result = await post({ action: 'save', pieces })
      hasDraft = Boolean(result.draft)
      status = result.error ?? (hasDraft ? 'Saved as a draft. Rebuild to put it in the clip.' : 'Same as the clip now.')
      handle.update()
    }, 500)
  }
  async function rebuild() {
    clearTimeout(saveTimer)
    busy = true
    status = 'Rebuilding the video…'
    handle.update()
    let result = await post({ action: 'rebuild', pieces })
    busy = false
    if (result.error) status = `Rebuild failed: ${result.error}`
    else {
      current = clone(result.current ?? pieces)
      hasDraft = false
      if (result.check !== undefined) check = result.check
      video = result.video ?? video
      status = 'Rebuilt: the clip now uses this cut. Check it on /review, then deploy.'
    }
    handle.update()
  }
  async function undo() {
    clearTimeout(saveTimer)
    pieces = clone(current)
    focus = pieces.length ? 0 : -1
    let result = await post({ action: 'discard' })
    hasDraft = Boolean(result.draft)
    status = result.error ?? 'Back to the cut the clip uses now.'
    handle.update()
    showFocus()
  }
  /** Mark the cut as fine as it is ('keep'), or take the mark off ('uncheck'). */
  async function mark(action: 'keep' | 'uncheck') {
    let result = await post({ action })
    if (result.error) status = result.error
    else check = result.check ?? null
    handle.update()
  }
  function checkState() {
    if (hasDraft) return <p class="ce-check" data-state="draft">Draft: rebuild the video to use it, or undo your changes.</p>
    if (!check) {
      return (
        <p class="ce-check" data-state="todo">
          <span>Not checked yet.</span>
          <button type="button" class="ce-keep" mix={on('click', () => mark('keep'))}>✓ Keep this cut</button>
        </p>
      )
    }
    return (
      <p class="ce-check" data-state={check.state}>
        <span>{check.state === 'edited' ? `✓ Edited ${day(check.at)}` : `✓ Kept as it was · ${day(check.at)}`}</span>
        <button type="button" class="ce-uncheck" mix={on('click', () => mark('uncheck'))}>Mark not checked</button>
      </p>
    )
  }

  let noteTimer: ReturnType<typeof setTimeout> | undefined
  function saveNote(text: string) {
    note = text
    clearTimeout(noteTimer)
    noteTimer = setTimeout(() => fetch('/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: clip.id, note }) }), 400)
  }

  // ---- moments ----

  async function load(id: string) {
    if (sets.has(id)) return
    sets.set(id, 'loading')
    handle.update()
    try {
      let response = await fetch(`/review/moments/${id}`, { signal: handle.signal })
      if (!response.ok) throw new Error(String(response.status))
      sets.set(id, (await response.json()) as MomentSet)
    } catch {
      sets.set(id, 'failed')
    }
    handle.update()
  }

  /** Indexes (1-based) of the pieces that use this moment, and the parts of it they use (0..1). */
  function uses(list: Piece[], path: string, m: Moment) {
    let numbers: number[] = []
    let parts: [number, number][] = []
    list.forEach((p, i) => {
      if (p.kind !== 'vid' || p.path !== path || overlap(p.start, end(p), m.s, m.e) < MIN_OVERLAP) return
      numbers.push(i + 1)
      let len = m.e - m.s
      parts.push([(Math.max(p.start, m.s) - m.s) / len, (Math.min(end(p), m.e) - m.s) / len])
    })
    return { numbers, parts }
  }

  /** The framing to use for a new piece of this video: the nearest piece of it that is already framed. */
  function framingFor(path: string, at: number) {
    let near = [...pieces, ...current]
      .filter((p): p is Piece & { kind: 'vid' } => p.kind === 'vid' && p.path === path)
      .sort((a, b) => Math.abs(a.start - at) - Math.abs(b.start - at))[0]
    return near ? { cx: near.cx, zoom: near.zoom, cy: near.cy } : { cx: 0.5, zoom: 1, cy: 0.5 }
  }

  function addRange(path: string, a: number, b: number) {
    let touching = pieces.flatMap((p, i) => (p.kind === 'vid' && p.path === path && p.start <= b + 0.05 && end(p) >= a - 0.05 ? [i] : []))
    if (touching.length) {
      let first = pieces[touching[0]] as Piece & { kind: 'vid' }
      let s = Math.min(a, ...touching.map((i) => (pieces[i] as Piece & { kind: 'vid' }).start))
      let e = Math.max(b, ...touching.map((i) => end(pieces[i] as Piece & { kind: 'vid' })))
      let merged: Piece = { ...first, start: round(s), secs: round(e - s) }
      pieces = pieces.flatMap((p, i) => (i === touching[0] ? [merged] : touching.includes(i) ? [] : [p]))
      focus = pieces.indexOf(merged)
      return
    }
    let piece: Piece = { kind: 'vid', path, start: round(a), secs: round(b - a), ...framingFor(path, a) }
    let after = pieces.findLastIndex((p) => p.kind === 'vid' && p.path === path && end(p) <= a + 0.05)
    let before = pieces.findIndex((p) => p.kind === 'vid' && p.path === path && p.start >= b - 0.05)
    let at = after >= 0 ? after + 1 : before >= 0 ? before : pieces.length
    pieces.splice(at, 0, piece)
    focus = at
  }

  function removeRange(path: string, a: number, b: number) {
    let kept = pieces[focus]
    pieces = pieces.flatMap((p) => {
      if (p.kind !== 'vid' || p.path !== path || overlap(p.start, end(p), a, b) <= 0) return [p]
      let parts: Piece[] = []
      if (a - p.start >= 0.4) parts.push({ ...p, secs: round(a - p.start) })
      if (end(p) - b >= 0.4) parts.push({ ...p, start: round(b), secs: round(end(p) - b) })
      return parts
    })
    focus = pieces.includes(kept) ? pieces.indexOf(kept) : Math.min(focus, pieces.length - 1)
  }

  function toggle(id: string, index: number) {
    let set = sets.get(id)
    let source = byId.get(id)
    if (!source || !set || typeof set === 'string') return
    let m = set.moments[index]
    if (uses(pieces, source.path, m).numbers.length) removeRange(source.path, m.s, m.e)
    else addRange(source.path, m.s, m.e)
    stopAll()
    changed()
  }

  // ---- the preview player ----

  let box: HTMLElement | undefined
  let player: HTMLVideoElement | undefined
  let still: HTMLImageElement | undefined
  let frame: HTMLElement | undefined
  let shot: Shot | null = null
  let loop = true
  let onEnd: (() => void) | null = null
  let token = 0
  let stillTimer: ReturnType<typeof setTimeout> | undefined

  const shotOf = (p: Piece): Shot =>
    p.kind === 'img'
      ? { kind: 'img', path: p.path, start: 0, end: p.secs, cx: p.cx, zoom: 1, cy: 0.5 }
      : { kind: 'vid', path: p.path, start: p.start, end: end(p), cx: p.cx, zoom: p.zoom, cy: p.cy }

  /** Place the video (or photo) in the 9:16 box the way clips.py crops it, or whole with the crop outlined. */
  function place() {
    if (!box || !shot) return
    let el = shot.kind === 'img' ? still : player
    let w = shot.kind === 'img' ? still?.naturalWidth : player?.videoWidth
    let h = shot.kind === 'img' ? still?.naturalHeight : player?.videoHeight
    if (!el || !w || !h || !frame) return
    let boxW = box.clientWidth
    let boxH = box.clientHeight
    let z = shot.zoom
    let k = Math.max(720 / (w / z), 1280 / (h / z))
    let winW = 720 / k
    let winH = 1280 / k
    let x0 = (w - winW) * shot.cx
    let y0 = (h - h / z) * shot.cy + (h / z - winH) / 2
    if (wide) {
      let s = Math.min(boxW / w, boxH / h)
      let left = (boxW - w * s) / 2
      let top = (boxH - h * s) / 2
      el.style.cssText = `left:${left}px;top:${top}px;width:${w * s}px;height:${h * s}px`
      frame.style.cssText = `left:${left + x0 * s}px;top:${top + y0 * s}px;width:${winW * s}px;height:${winH * s}px`
      frame.hidden = false
    } else {
      let s = boxW / winW
      el.style.cssText = `left:${-x0 * s}px;top:${-y0 * s}px;width:${w * s}px;height:${h * s}px`
      frame.hidden = true
    }
  }

  async function show(next: Shot, options: { loop: boolean; onEnd?: () => void } = { loop: true }) {
    if (!player || !still) return
    let mine = ++token
    shot = next
    loop = options.loop
    onEnd = options.onEnd ?? null
    clearTimeout(stillTimer)
    let url = sourceUrl(next.path)
    if (next.kind === 'img') {
      player.pause()
      player.hidden = true
      still.hidden = false
      if (still.getAttribute('src') !== url) still.src = url
      await still.decode().catch(() => {})
      if (mine !== token) return
      place()
      stillTimer = setTimeout(() => mine === token && finished(), (next.end - next.start) * 1000)
      return
    }
    still.hidden = true
    player.hidden = false
    // a new file: wait for it, since the player can still report the old one as ready for a moment
    let switching = player.getAttribute('src') !== url
    if (switching) player.src = url
    if (switching || player.readyState < 1) {
      await new Promise((resolve) => {
        player!.addEventListener('loadedmetadata', resolve, { once: true })
        player!.addEventListener('error', resolve, { once: true })
      })
      if (mine !== token) return
    }
    place()
    player.currentTime = next.start
    player.play().catch(() => {})
  }

  function finished() {
    if (!shot) return
    if (onEnd) onEnd()
    else if (loop && shot.kind === 'vid' && player) {
      player.currentTime = shot.start
      player.play().catch(() => {})
    } else if (loop) show(shot)
  }

  // play the whole cut, piece by piece, the way the clip will loop
  function playAll(from = 0) {
    if (!pieces.length) return
    playing = from % pieces.length
    handle.update()
    show(shotOf(pieces[playing]), { loop: false, onEnd: () => playAll(playing + 1) })
  }
  function stopAll() {
    if (playing < 0) return
    playing = -1
  }
  function showFocus() {
    stopAll()
    let p = pieces[focus]
    if (p) show(shotOf(p))
  }

  // ---- editing the focused piece ----

  function edit(patch: Partial<Record<'start' | 'secs' | 'cx' | 'zoom' | 'cy', number>> & { zoomIn?: boolean }) {
    let p = pieces[focus]
    if (!p) return
    let set = p.kind === 'vid' ? sets.get(byPath.get(p.path)?.id ?? '') : undefined
    let dur = set && typeof set !== 'string' ? set.dur : (byPath.get(p.path)?.dur ?? 3600)
    let next = { ...p, ...patch } as Piece
    if (next.kind === 'vid') {
      next.start = round(Math.max(0, Math.min(dur - 0.3, next.start)))
      next.secs = round(Math.max(0.3, Math.min(dur - next.start, next.secs)))
      next.zoom = Math.max(1, Math.min(3, next.zoom))
    } else next.secs = round(Math.max(0.3, Math.min(10, next.secs)))
    pieces[focus] = next
    let seek = 'start' in patch || 'secs' in patch
    if (shot && playing < 0) {
      shot = shotOf(next)
      if (seek) show(shot)
      else place()
    }
    changed()
  }

  function move(from: number, by: number) {
    let to = from + by
    if (to < 0 || to >= pieces.length) return
    ;[pieces[from], pieces[to]] = [pieces[to], pieces[from]]
    if (focus === from) focus = to
    else if (focus === to) focus = from
    changed()
  }

  function remove(index: number) {
    pieces.splice(index, 1)
    focus = Math.min(focus, pieces.length - 1)
    stopAll()
    changed()
  }

  // ---- events on the moment tiles (one listener for all of them) ----

  let hovered: Element | null = null
  function tileOf(event: Event) {
    return (event.target as Element).closest<HTMLElement>('[data-moment]')
  }
  function hoverTile(event: Event) {
    let tile = tileOf(event)
    if (!tile || tile === hovered) return
    hovered = tile
    let id = tile.dataset.vid!
    let set = sets.get(id)
    let source = byId.get(id)
    if (!source || !set || typeof set === 'string') return
    let m = set.moments[Number(tile.dataset.moment)]
    stopAll()
    show({ kind: 'vid', path: source.path, start: m.s, end: m.e, ...framingFor(source.path, m.s) })
  }
  function leaveTiles() {
    hovered = null
    if (playing < 0) showFocus()
  }

  handle.queueTask(() => {
    for (let id of panels) load(id)
    if (box) new ResizeObserver(() => place()).observe(box)
    player?.addEventListener('error', () => {
      status = 'The preview could not load this video. Reload the page to try again.'
      handle.update()
    })
    setTimeout(showFocus, 50)
    // a piece ends at its own end, not the video's: watch the time every frame
    let tick = () => {
      if (handle.signal.aborted) return
      if (shot?.kind === 'vid' && player && player.readyState >= 2 && (player.ended || (!player.paused && player.currentTime >= shot.end - 0.03))) finished()
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

  // ---- rendering ----

  function thumb(set: MomentSet, index: number, height: number) {
    let f = height / set.h
    let rows = Math.ceil(set.moments.length / set.cols)
    return `width:${Math.round(set.w * f)}px;height:${height}px;background-image:url(${set.sheet});background-size:auto ${Math.round(rows * set.h * f)}px;background-position:-${Math.round((index % set.cols) * set.w * f)}px -${Math.round(Math.floor(index / set.cols) * set.h * f)}px`
  }

  function pieceThumb(p: Piece) {
    if (p.kind === 'img') return <img class="ce-pthumb" src={sourceUrl(p.path)} alt="" />
    let set = sets.get(byPath.get(p.path)?.id ?? '')
    if (!set || typeof set === 'string') return <span class="ce-pthumb" />
    let mid = (p.start + end(p)) / 2
    let index = Math.max(0, set.moments.findIndex((m) => m.e > mid))
    return <span class="ce-pthumb" style={thumb(set, index, 56)} />
  }

  function slider(label: string, field: 'cx' | 'zoom' | 'cy', value: number, min: number, max: number, hint: string) {
    return (
      <label class="ce-slider" title={hint}>
        <span>{label}</span>
        <input type="range" min={String(min)} max={String(max)} step="0.01" value={String(value)} mix={on('input', (e) => edit({ [field]: Number((e.currentTarget as HTMLInputElement).value) }))} />
        <output>{value.toFixed(2)}</output>
      </label>
    )
  }

  function controls(p: Piece) {
    if (p.kind === 'img') {
      return (
        <div class="ce-controls">
          <label class="ce-num">
            <span>Seconds</span>
            <input key={`secs-${focus}-${p.secs}`} type="number" step="0.1" min="0.3" defaultValue={String(p.secs)} mix={on('change', (e) => edit({ secs: Number((e.currentTarget as HTMLInputElement).value) }))} />
          </label>
          {slider('Left ↔ right', 'cx', p.cx, 0, 1, 'Where the 9:16 frame sits across the photo')}
          <label class="ce-check">
            <input type="checkbox" checked={p.zoomIn} mix={on('change', (e) => edit({ zoomIn: (e.currentTarget as HTMLInputElement).checked }))} /> Zoom in (off: zoom out)
          </label>
        </div>
      )
    }
    let nudge = (field: 'start' | 'secs', by: number, text: string) => (
      <button type="button" mix={on('click', () => edit({ [field]: p[field] + by }))}>{text}</button>
    )
    return (
      <div class="ce-controls">
        <div class="ce-num">
          <span>Start</span>
          {nudge('start', -0.5, '−½s')}
          <input key={`start-${focus}-${p.start}`} type="number" step="0.1" min="0" defaultValue={String(p.start)} mix={on('change', (e) => edit({ start: Number((e.currentTarget as HTMLInputElement).value) }))} />
          {nudge('start', 0.5, '+½s')}
        </div>
        <div class="ce-num">
          <span>Length</span>
          {nudge('secs', -0.5, '−½s')}
          <input key={`secs-${focus}-${p.secs}`} type="number" step="0.1" min="0.3" defaultValue={String(p.secs)} mix={on('change', (e) => edit({ secs: Number((e.currentTarget as HTMLInputElement).value) }))} />
          {nudge('secs', 0.5, '+½s')}
        </div>
        {slider('Zoom', 'zoom', p.zoom, 1, 3, 'Crop closer, for far-away swimmers')}
        {slider('Left ↔ right', 'cx', p.cx, 0, 1, 'Where the 9:16 frame sits across the video')}
        {p.zoom > 1 && slider('Up ↕ down', 'cy', p.cy, 0, 1, 'Where the zoomed frame sits from top to bottom')}
      </div>
    )
  }

  function panel(id: string) {
    let source = byId.get(id)!
    let set = sets.get(id)
    let fromHere = pieces.some((p) => p.path === source.path) || current.some((p) => p.path === source.path)
    let others = source.usedBy.filter((c) => c !== clip.id)
    return (
      <section key={id} id={`src-${id}`} class="ce-source">
        <header>
          <div>
            <h3>
              {source.label || source.caption.slice(0, 60) || id} <small>{id} · {source.kind} · {source.date} · {time(source.dur)}</small>
            </h3>
            {source.caption && <p>{source.caption}</p>}
            {others.length > 0 && (
              <p class="ce-used">
                Also in: {others.map((c) => (<a key={c} href={`/review/cut/${c}`}>{c}</a>))}
              </p>
            )}
          </div>
          {!fromHere && (
            <button type="button" class="ce-hide" mix={on('click', () => { panels = panels.filter((p) => p !== id); handle.update() })}>Hide</button>
          )}
        </header>
        {set === 'loading' || !set ? (
          <p class="ce-wait">Finding moments…</p>
        ) : set === 'failed' ? (
          <p class="ce-wait">Could not read this video.</p>
        ) : (
          <>
            <div class="ce-timeline" aria-hidden="true">
              {current.map((p, i) => p.kind === 'vid' && p.path === source.path && <i key={`n${i}`} class="is-now" style={`left:${(p.start / set.dur) * 100}%;width:${(p.secs / set.dur) * 100}%`} />)}
              {pieces.map((p, i) => p.kind === 'vid' && p.path === source.path && <i key={`p${i}`} class="is-picked" style={`left:${(p.start / set.dur) * 100}%;width:${(p.secs / set.dur) * 100}%`} />)}
              {set.moments.map((m, i) => m.shot && i > 0 && <b key={`c${i}`} style={`left:${(m.s / set.dur) * 100}%`} />)}
            </div>
            <div class="ce-moments">
              {set.moments.map((m, i) => {
                let now = uses(current, source.path, m)
                let picked = uses(pieces, source.path, m)
                return (
                  <button
                    key={i}
                    type="button"
                    class={`ce-m${m.shot && i > 0 ? ' is-shot' : ''}`}
                    data-vid={id}
                    data-moment={String(i)}
                    data-now={String(now.numbers.length > 0)}
                    data-picked={String(picked.numbers.length > 0)}
                    title={`${time(m.s)}–${time(m.e)}: click to ${picked.numbers.length ? 'take it out of' : 'add it to'} the cut`}
                  >
                    <span class="ce-thumb" style={thumb(set, i, TILE_H)} />
                    <span class="ce-t">{time(m.s)}</span>
                    {picked.numbers.length > 0 && <b class="ce-badge">{picked.numbers.join(' ')}</b>}
                    <span class="ce-motion" style={`--m:${motionLevel(m.motion).toFixed(2)}`} />
                    <span class="ce-bars">
                      {now.parts.map(([a, b], k) => <i key={`n${k}`} class="is-now" style={`left:${a * 100}%;width:${(b - a) * 100}%`} />)}
                      {picked.parts.map(([a, b], k) => <i key={`p${k}`} class="is-picked" style={`left:${a * 100}%;width:${(b - a) * 100}%`} />)}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </section>
    )
  }

  function pickerList() {
    let words = query.toLowerCase().split(/\s+/).filter(Boolean)
    let found = sources.filter((s) => {
      let text = `${s.id} ${s.label} ${s.caption} ${s.cat} ${s.kind} ${s.date}`.toLowerCase()
      return words.every((w) => text.includes(w))
    })
    return (
      <div class="ce-picker">
        <input
          type="search"
          placeholder="Search: butterfly, ice, 2025, v226…"
          value={query}
          mix={[on('input', (e) => { query = (e.currentTarget as HTMLInputElement).value; handle.update() }), ref((node) => (node as HTMLInputElement).focus())]}
        />
        <p class="ce-hint">{found.length} videos. Click one to show its moments.</p>
        <ul>
          {found.slice(0, 80).map((s) => (
            <li key={s.id}>
              <button
                type="button"
                disabled={panels.includes(s.id)}
                mix={on('click', () => {
                  panels.push(s.id)
                  picker = false
                  let scroll = () => document.getElementById(`src-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  handle.update().then(scroll)
                  load(s.id).then(() => handle.update()).then(scroll)
                })}
              >
                {s.thumb ? <span class="ce-pthumb" style={`width:${Math.round((s.thumb.w * 64) / s.thumb.h)}px;height:64px;background-image:url(/review/sheet/${s.id});background-size:auto ${s.thumb.rows * 64}px`} /> : <span class="ce-pthumb" />}
                <span>
                  <b>{s.label || s.caption.slice(0, 60) || s.id}</b>
                  <small>{s.id} · {s.kind} · {s.date} · {time(s.dur)}{s.cat ? ` · ${s.cat}` : ''}{s.usedBy.length ? ` · in ${s.usedBy.join(', ')}` : ''}</small>
                  {s.caption && <small class="ce-cap">{s.caption}</small>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return () => {
    let total = pieces.reduce((sum, p) => sum + p.secs, 0)
    let focused = pieces[focus]
    return (
      <div class="ce">
        <aside class="ce-side">
          <nav class="ce-back">
            <a href={`/review#${clip.id}`}>← All clips</a>
            <span title="Clips on the home page whose cut you edited or kept">{othersChecked + Number(isChecked())} of {progress.total} checked</span>
            {next && <a class="ce-next" href={`/review/cut/${next.id}`} title={next.title}>Next to check →</a>}
          </nav>
          <h1>{clip.title} <small>{clip.cat}{clip.rejected ? ' · rejected' : ''}</small></h1>
          {checkState()}
          <div class="ce-players">
            <figure>
              <video src={video} autoplay muted loop playsInline />
              <figcaption>The clip now</figcaption>
            </figure>
            <figure>
              <div class="ce-preview" mix={ref((node) => (box = node as HTMLElement))}>
                <video muted playsInline preload="auto" mix={ref((node) => (player = node as HTMLVideoElement))} />
                <img alt="" mix={ref((node) => { still = node as HTMLImageElement; still.hidden = true })} />
                <div class="ce-frame" mix={ref((node) => { frame = node as HTMLElement; frame.hidden = true })} />
              </div>
              <figcaption>{playing >= 0 ? `Playing your cut: piece ${playing + 1}` : 'Preview (hover a moment)'}</figcaption>
            </figure>
          </div>
          <div class="ce-row">
            <button type="button" disabled={!pieces.length} mix={on('click', () => (playing >= 0 ? showFocus() : playAll()))}>
              {playing >= 0 ? '■ Stop' : '▶ Play your cut'}
            </button>
            <label class="ce-check">
              <input type="checkbox" checked={wide} mix={on('change', (e) => { wide = (e.currentTarget as HTMLInputElement).checked; place(); handle.update() })} /> Whole frame
            </label>
          </div>

          <h2>
            Your cut <small>{pieces.length} piece{pieces.length === 1 ? '' : 's'} · {total.toFixed(1)} s</small>
          </h2>
          {total > 15 && <p class="ce-warn">Over 15 s: the clip gets more compression to stay light.</p>}
          <ol class="ce-pieces">
            {pieces.map((p, i) => {
              let source = byPath.get(p.path)
              return (
                <li key={`${p.path}@${p.kind === 'vid' ? p.start : i}`} class="ce-piece" data-focus={String(i === focus)} data-playing={String(i === playing)}>
                  <button type="button" class="ce-piece-main" mix={on('click', () => { focus = i; handle.update(); showFocus() })}>
                    <span class="ce-n">{i + 1}</span>
                    {pieceThumb(p)}
                    <span>
                      <b>{p.kind === 'img' ? 'Photo' : `${source?.id ?? 'video'} ${time(p.start)}–${time(end(p))}`}</b>
                      <small>{p.secs.toFixed(1)} s{p.kind === 'vid' && p.zoom > 1 ? ` · zoom ${p.zoom.toFixed(2)}` : ''}</small>
                    </span>
                  </button>
                  <span class="ce-tools">
                    <button type="button" title="Earlier" disabled={i === 0} mix={on('click', () => move(i, -1))}>↑</button>
                    <button type="button" title="Later" disabled={i === pieces.length - 1} mix={on('click', () => move(i, 1))}>↓</button>
                    <button type="button" title="Take out" mix={on('click', () => remove(i))}>✕</button>
                  </span>
                  {i === focus && controls(p)}
                </li>
              )
            })}
          </ol>
          {!pieces.length && <p class="ce-hint">Click moments on the right to build the cut.</p>}

          <div class="ce-row ce-actions">
            <button type="button" class="ce-primary" disabled={busy || !pieces.length} mix={on('click', rebuild)}>
              {busy ? 'Rebuilding…' : 'Rebuild video'}
            </button>
            <button type="button" disabled={busy || !hasDraft} mix={on('click', undo)}>Undo changes</button>
          </div>
          <p class="ce-status" aria-live="polite">{status}</p>
          <textarea class="rv-note" rows={3} placeholder="Feedback for Claude (only saved on this Mac)" defaultValue={note} mix={on('input', (e) => saveNote((e.currentTarget as HTMLTextAreaElement).value))} />
        </aside>

        <main class="ce-main">
          <header class="ce-head">
            <div>
              <h2>Moments</h2>
              <p>
                Hover to watch, click to add or take out. <span class="ce-key is-now">in the clip now</span> <span class="ce-key is-picked">in your cut</span>{' '}
                The bar under each moment shows how much motion it has.
              </p>
            </div>
            <button type="button" class="ce-primary" mix={on('click', () => { picker = !picker; query = ''; handle.update() })}>
              {picker ? 'Close' : '+ Footage from another video'}
            </button>
          </header>
          {picker && pickerList()}
          <div mix={[on('click', (e) => { let tile = tileOf(e); if (tile) toggle(tile.dataset.vid!, Number(tile.dataset.moment)) }), on<HTMLDivElement, 'mouseover'>('mouseover', hoverTile), on<HTMLDivElement, 'mouseleave'>('mouseleave', leaveTiles)]}>
            {panels.map(panel)}
          </div>
          {!panels.length && <p class="ce-hint">This clip is made of photos only. Add footage from a video to mix it in.</p>}
        </main>
      </div>
    )
  }
})
