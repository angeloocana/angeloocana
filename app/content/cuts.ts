// How each clip is cut from its source videos, for the local cut editor (/review/cut/:id). Everything here
// reads the shared media folder (app/content/media-dir.ts) and runs scripts/clips/clips.py; it is dev only.
//   index/montages.json    the recipe of every clip: which seconds of which videos, and how they are framed
//   index/cut-drafts.json  cuts changed in the editor that have not been rebuilt yet
//   index/cut-checks.json  clips whose cut was checked: edited (rebuilt from a draft) or kept as it was
//   work/moments/          each source video split into short moments (v226.json) with a thumbnail sheet (v226.jpg)
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { MEDIA_DIR } from './media-dir.ts'

/** A video piece is `seconds` long from `start`; cx/cy place the 9:16 crop (0..1), zoom > 1 crops closer.
 *  A photo piece shows a still for `seconds` with a slow zoom in or out. */
export type Piece =
  | { kind: 'vid'; path: string; start: number; secs: number; cx: number; zoom: number; cy: number }
  | { kind: 'img'; path: string; secs: number; cx: number; zoomIn: boolean }

/** A clip whose cut was checked in the editor: rebuilt from a new selection, or kept as it was. */
export type CutCheck = { state: 'edited' | 'kept'; at: string }
/** Where a clip is in the cut review: checked, a draft not rebuilt yet, or not looked at yet. */
export type CutState = CutCheck['state'] | 'draft' | 'todo'

/** The same pieces as clips.py stores them: ["vid", path, start, secs, cx, zoom?, cy?] or ["img", path, secs, cx, zoomIn]. */
type RawPiece = (string | number | boolean)[]

/** A source video from index/items.json, with what the first review said about it. */
export type Source = {
  id: string
  path: string
  kind: string
  caption: string
  date: string
  dur: number
  label: string
  cat: string
  /** Clips whose recipe uses this video. */
  usedBy: string[]
  /** Thumbnail size and sheet layout, once its moments have been found. */
  thumb?: { w: number; h: number; cols: number; rows: number }
}

export type Moment = { s: number; e: number; shot: boolean; motion: number; sharp: number }

const INDEX = join(MEDIA_DIR, 'index')
const RECIPES = join(INDEX, 'montages.json')
const DRAFTS = join(INDEX, 'cut-drafts.json')
const CHECKS = join(INDEX, 'cut-checks.json')
export const MOMENTS_DIR = join(MEDIA_DIR, 'work', 'moments')
const MOMENTS_VERSION = 1
const SCRIPT = fileURLToPath(new URL('../../scripts/clips/clips.py', import.meta.url))

function readJson<T>(file: string, fallback: T): T {
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : fallback
}

function writeJson(file: string, data: unknown) {
  writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 1) + '\n')
  renameSync(`${file}.tmp`, file)
}

const num = (value: unknown, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback)
const round = (value: number) => Math.round(value * 1000) / 1000

export function toPiece(raw: RawPiece): Piece {
  if (raw[0] === 'img') return { kind: 'img', path: String(raw[1]), secs: num(raw[2], 1.2), cx: num(raw[3], 0.5), zoomIn: Boolean(raw[4]) }
  return { kind: 'vid', path: String(raw[1]), start: num(raw[2], 0), secs: num(raw[3], 6), cx: num(raw[4], 0.5), zoom: num(raw[5], 1), cy: num(raw[6], 0.5) }
}

export function toRaw(piece: Piece): RawPiece {
  if (piece.kind === 'img') return ['img', piece.path, round(piece.secs), round(piece.cx), piece.zoomIn ? 1 : 0]
  let raw: RawPiece = ['vid', piece.path, round(piece.start), round(piece.secs), round(piece.cx)]
  if (piece.zoom !== 1 || piece.cy !== 0.5) raw.push(round(piece.zoom), round(piece.cy))
  return raw
}

const recipes = () => readJson<{ clips: Record<string, RawPiece[]> }>(RECIPES, { clips: {} }).clips
export const loadDrafts = () => readJson<Record<string, RawPiece[]>>(DRAFTS, {})

/** How the clip's video file is made now, or null if that was never recorded. */
export function loadRecipe(id: string): Piece[] | null {
  return recipes()[id]?.map(toPiece) ?? null
}

/** The cut changed in the editor and not rebuilt yet, if any. */
export function loadDraft(id: string): Piece[] | null {
  return loadDrafts()[id]?.map(toPiece) ?? null
}

/** Save a changed cut, or drop it (null, or the same as the recipe). Returns whether a draft is kept. */
export function saveDraft(id: string, pieces: Piece[] | null): boolean {
  let drafts = loadDrafts()
  let raw = pieces?.map(toRaw)
  let same = raw && JSON.stringify(raw) === JSON.stringify(recipes()[id]?.map((p) => toRaw(toPiece(p))))
  if (!raw || same) delete drafts[id]
  else drafts[id] = raw
  writeJson(DRAFTS, drafts)
  return Boolean(drafts[id])
}

export const loadChecks = () => readJson<Record<string, CutCheck>>(CHECKS, {})

/** Mark a clip's cut as kept as it is, or clear its mark (null). clips.py marks a clip edited when it rebuilds a draft. */
export function setCheck(id: string, state: 'kept' | null): CutCheck | null {
  let checks = loadChecks()
  if (state) checks[id] = { state, at: new Date().toISOString().slice(0, 19) + 'Z' }
  else delete checks[id]
  writeJson(CHECKS, checks)
  return checks[id] ?? null
}

export function cutState(id: string, drafts: Record<string, unknown>, checks: Record<string, CutCheck>): CutState {
  return drafts[id] ? 'draft' : (checks[id]?.state ?? 'todo')
}

type Item = { id: string; src: string; path: string; source: string; caption?: string; ts: number; dur: number; w: number; h: number }
type Review = { id: string; category?: string; label?: string }

const items = () => readJson<Item[]>(join(INDEX, 'items.json'), [])

/** The source video a single clip was first cut from (a clip's id is c + the sha1 of its source). */
export function clipSource(id: string): string | undefined {
  return items().find((it) => 'c' + createHash('sha1').update(it.src).digest('hex').slice(0, 8) === id)?.path
}

export function loadSources(): Source[] {
  let reviews = new Map(readJson<Review[]>(join(INDEX, 'reviews.json'), []).map((r) => [r.id, r]))
  let usedBy = new Map<string, string[]>()
  for (let [clip, pieces] of Object.entries(recipes())) {
    for (let p of pieces) {
      let path = String(p[1])
      let list = usedBy.get(path) ?? []
      if (!list.includes(clip)) list.push(clip)
      usedBy.set(path, list)
    }
  }
  return items()
    .map((it) => {
      let review = reviews.get(it.id)
      let moments = readJson<{ version?: number; w?: number; h?: number; moments?: unknown[] }>(join(MOMENTS_DIR, `${it.id}.json`), {})
      let count = moments.moments?.length ?? 0
      return {
        id: it.id,
        path: it.path,
        kind: it.source.replace('Instagram · ', 'IG '),
        caption: (it.caption ?? '').replace(/\s+/g, ' ').trim().slice(0, 160),
        date: new Date(it.ts * 1000).toISOString().slice(0, 10),
        dur: Math.round(it.dur * 10) / 10,
        label: review?.label ?? '',
        cat: review?.category ?? '',
        usedBy: usedBy.get(it.path) ?? [],
        thumb: moments.version === MOMENTS_VERSION && moments.w && moments.h && count
          ? { w: moments.w, h: moments.h, cols: Math.min(10, count), rows: Math.ceil(count / 10) }
          : undefined,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** Paths the editor may play or use: every source video and every piece already in a recipe or draft. */
function knownPaths(): Set<string> {
  let paths = new Set(items().map((it) => it.path))
  for (let pieces of [...Object.values(recipes()), ...Object.values(loadDrafts())]) for (let p of pieces) paths.add(String(p[1]))
  return paths
}

/** Where a path from the index is on disk: 'ig:…' is inside the Instagram export, others are in the media folder. */
export function sourceFile(path: string): string | undefined {
  if (!knownPaths().has(path)) return undefined
  if (path.startsWith('ig:')) {
    let exported = readJson<{ instagram_export?: string }>(join(INDEX, 'config.json'), {}).instagram_export
    if (!exported) return undefined
    return join(exported.replace(/^~(?=\/)/, homedir()), 'media', path.slice(3))
  }
  return isAbsolute(path) ? path : join(MEDIA_DIR, path)
}

/** Check pieces sent by the editor. Returns the clean pieces, or what is wrong with them. */
export function cleanPieces(input: unknown): Piece[] | string {
  if (!Array.isArray(input) || !input.length) return 'A cut needs at least one piece'
  if (input.length > 40) return 'Too many pieces'
  let known = knownPaths()
  let clamp = (value: unknown, min: number, max: number, fallback: number) => Math.min(max, Math.max(min, num(value, fallback)))
  let pieces: Piece[] = []
  for (let p of input as Record<string, unknown>[]) {
    if (!p || typeof p.path !== 'string' || !known.has(p.path)) return 'Unknown source video'
    if (p.kind === 'img') {
      pieces.push({ kind: 'img', path: p.path, secs: clamp(p.secs, 0.3, 10, 1.2), cx: clamp(p.cx, 0, 1, 0.5), zoomIn: Boolean(p.zoomIn) })
    } else {
      pieces.push({
        kind: 'vid',
        path: p.path,
        start: clamp(p.start, 0, 36000, 0),
        secs: clamp(p.secs, 0.3, 30, 6),
        cx: clamp(p.cx, 0, 1, 0.5),
        zoom: clamp(p.zoom, 1, 4, 1),
        cy: clamp(p.cy, 0, 1, 0.5),
      })
    }
  }
  if (pieces.reduce((sum, p) => sum + p.secs, 0) > 60) return 'A cut can be at most 60 seconds'
  return pieces
}

// One clips.py job at a time: rebuilds and draft saves all rewrite the same index files.
let queue: Promise<unknown> = Promise.resolve()
export function exclusive<T>(job: () => T | Promise<T>): Promise<T> {
  let run = queue.then(job, job)
  queue = run.catch(() => {})
  return run
}

export function runClips(...args: string[]): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    let child = spawn(process.env.PYTHON ?? 'python3', [SCRIPT, ...args], { env: { ...process.env, ANGELOOCANA_MEDIA: MEDIA_DIR } })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.on('error', (error) => resolve({ ok: false, output: String(error) }))
    child.on('close', (code) => resolve({ ok: code === 0, output: output.trim() }))
  })
}

/** Render the clip from its draft (or recipe) with clips.py; the draft becomes the recipe. */
export const rebuildClip = (id: string) => exclusive(() => runClips('rebuild', id))

// Finding moments takes a second or two per video; ask clips.py once, even if the page asks twice.
const finding = new Map<string, Promise<boolean>>()

/** The moments of a source video (found now if they never were), and the URL of their thumbnail sheet. */
export async function loadMoments(vid: string) {
  if (!/^v\d+$/.test(vid) || !items().some((it) => it.id === vid)) return undefined
  let file = join(MOMENTS_DIR, `${vid}.json`)
  let fresh = () => readJson<{ version?: number }>(file, {}).version === MOMENTS_VERSION
  if (!fresh()) {
    if (!finding.has(vid)) finding.set(vid, runClips('moments', vid).then((r) => (finding.delete(vid), r.ok)))
    await finding.get(vid)
    if (!fresh()) return undefined
  }
  let data = readJson<{ id: string; dur: number; w: number; h: number; cols: number; moments: Moment[] }>(file, null as never)
  let version = Math.round(statSync(join(MOMENTS_DIR, `${vid}.jpg`)).mtimeMs / 1000).toString(36)
  return { ...data, sheet: `/review/sheet/${vid}?v=${version}` }
}
