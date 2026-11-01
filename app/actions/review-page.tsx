import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { Document } from './document.tsx'
import { CATEGORIES, CATEGORY_NAMES, clipUrl, instagramUrl, loadClips, saveClips, type Category, type Clip } from '../content/clips.ts'
import { cutState, loadChecks, loadDrafts, type CutCheck, type CutState } from '../content/cuts.ts'
import { MEDIA_DIR } from '../content/media-dir.ts'
import { ReviewBoard } from '../ui/public/review-board.tsx'

// Local-only page (npm run dev → /review) for curating the home row: every clip grouped by category.
// Reject what should not go, star what should come first (★ to ★★★), or move a clip to another
// category. Each change is saved to app/content/clips.json right away. It is never built or deployed.

export const reviewEnabled = () => process.env.NODE_ENV === 'development'

// Feedback notes stay on this machine, in the shared media folder, so they never reach the public repo.
const NOTES = join(MEDIA_DIR, 'clip-feedback.json')
export function loadNotes(): Record<string, string> {
  return existsSync(NOTES) ? JSON.parse(readFileSync(NOTES, 'utf8')) : {}
}

/** POST /review with { id, star?, rejected?, cat?, label?, captionRejected?, note? } */
export async function saveReview(request: Request) {
  let body = (await request.json()) as Partial<Clip> & { id: string; note?: string }
  let clips = loadClips()
  let clip = clips.find((c) => c.id === body.id)
  if (!clip) return Response.json({ error: 'Unknown clip' }, { status: 404 })
  if (body.star !== undefined) clip.star = Math.max(0, Math.min(3, Math.round(Number(body.star) || 0)))
  if (body.rejected !== undefined) clip.rejected = Boolean(body.rejected)
  if (body.cat !== undefined && (CATEGORIES as readonly string[]).includes(body.cat)) clip.cat = body.cat as Category
  if (body.captionRejected !== undefined) clip.captionRejected = Boolean(body.captionRejected) || undefined
  if (body.label) {
    let clean = (text: unknown, fallback: string) => (typeof text === 'string' && text.trim() ? text.trim().slice(0, 120) : fallback)
    clip.label = { en: clean(body.label.en, clip.label.en), pt: clean(body.label.pt, clip.label.pt) }
  }
  if (body.note !== undefined) {
    let notes = loadNotes()
    let note = String(body.note).trim().slice(0, 2000)
    if (note) notes[clip.id] = note
    else delete notes[clip.id]
    writeFileSync(NOTES, JSON.stringify(notes, null, 1) + '\n')
  }
  saveClips(clips)
  return Response.json(clip)
}

// The source filter: every clip gets one of these keys, shown as a badge and used by the filter buttons.
const SOURCES = [
  { key: 'all', label: 'All' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'ig-reels', label: 'IG reels' },
  { key: 'ig-posts', label: 'IG posts' },
  { key: 'ig-stories', label: 'IG stories' },
  { key: 'not-instagram', label: 'Not Instagram' },
  { key: 'phone', label: 'Old phone' },
  { key: 'montage', label: 'Montage' },
] as const
const KIND = { reels: 'reel', posts: 'post', stories: 'story', igtv: 'IGTV' } as const
const sourceKeys = (clip: Clip) => (clip.source === 'instagram' ? ['instagram', `ig-${clip.igKind}`] : ['not-instagram', clip.source])
const sourceLabel = (clip: Clip) =>
  clip.source === 'instagram' ? `Instagram ${clip.igKind ? KIND[clip.igKind] : ''}`.trim() : clip.source === 'phone' ? 'Old phone' : 'Montage'

/** Clips by category, in the order this page shows them: live before rejected, then by star and score. */
export function reviewGroups(clips: Clip[]) {
  return CATEGORIES.map((cat) => ({
    cat,
    clips: clips.filter((c) => c.cat === cat).sort((a, b) => Number(a.rejected) - Number(b.rejected) || b.star - a.star || b.score - a.score),
  })).filter((g) => g.clips.length)
}

// The cut filter: where each clip is in checking its cut (Edit cut), shown as a mark on the card.
const CUT_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: 'To check' },
  { key: 'draft', label: 'Drafts' },
  { key: 'edited', label: 'Edited' },
  { key: 'kept', label: 'Kept' },
] as const
const day = (at: string) => new Date(at).toLocaleDateString('en', { month: 'short', day: 'numeric' })
function cutMark(state: CutState, check: CutCheck | undefined) {
  if (state === 'draft') return 'Draft · not rebuilt'
  if (state === 'edited') return `✓ Edited ${day(check!.at)}`
  if (state === 'kept') return `✓ Kept ${day(check!.at)}`
  return ''
}
/** Same rules as the cut filter in review-board.tsx: rejected clips are not left "to check". */
const inCutFilter = (key: string, clip: Clip, state: CutState) => key === 'all' || (key === 'todo' ? state === 'todo' && !clip.rejected : state === key)

export function ReviewPage() {
  return () => {
    let clips = loadClips()
    let names = CATEGORY_NAMES.en
    let groups = reviewGroups(clips)
    let live = clips.filter((c) => !c.rejected).length
    let notes = loadNotes()
    let drafts = loadDrafts()
    let checks = loadChecks()
    let state = (clip: Clip) => cutState(clip.id, drafts, checks)
    let checked = clips.filter((c) => !c.rejected && checks[c.id] && !drafts[c.id]).length
    return (
      <Document title="Review clips" bodyClass="rv-page" fonts={null} styles={['/styles/review.css']}>
        <ReviewBoard />
        <header class="rv-head">
          <div>
            <h1>Review clips</h1>
            <p>
              <b data-live>{live}</b> on the home page · {clips.length - live} rejected. Hover to play. <b>★</b> moves a clip to the front
              (★★★ first). Edit captions in place, reject a caption to hide it, or leave feedback for Claude. Changes save right away; <a href="/">open the home page</a> to see the order. <b>Edit cut</b> shows every moment of a clip's videos, so you can choose which ones it uses; clips you edit or keep there get a green mark.
            </p>
          </div>
          <div class="rv-progress" title="Clips on the home page whose cut you edited or kept in Edit cut">
            <span><b data-checked>{checked}</b> of <b data-checkable>{live}</b> cuts checked</span>
            <span class="rv-bar"><i data-checked-bar style={`width:${live ? (checked / live) * 100 : 0}%`} /></span>
          </div>
          <label class="rv-toggle"><input type="checkbox" data-hide-rejected /> Hide rejected</label>
        </header>
        <div class="rv-sources rv-cuts" role="group" aria-label="Show clips whose cut is">
          <span class="rv-filter-name">Cut</span>
          {CUT_FILTERS.map((f) => (
            <button key={f.key} type="button" data-cut-filter={f.key} aria-pressed={f.key === 'all' ? 'true' : 'false'}>
              {f.label} <span>{clips.filter((c) => inCutFilter(f.key, c, state(c))).length}</span>
            </button>
          ))}
        </div>
        <div class="rv-sources" role="group" aria-label="Show clips from">
          <span class="rv-filter-name">Source</span>
          {SOURCES.map((s) => {
            let count = s.key === 'all' ? clips.length : clips.filter((c) => sourceKeys(c).includes(s.key)).length
            return count ? (
              <button key={s.key} type="button" data-source-filter={s.key} aria-pressed={s.key === 'all' ? 'true' : 'false'}>
                {s.label} <span>{count}</span>
              </button>
            ) : null
          })}
        </div>
        <nav class="rv-tabs" aria-label="Categories">
          {groups.map((g) => (
            <a key={g.cat} href={`#${g.cat}`}>
              {names[g.cat]} <span>{g.clips.filter((c) => !c.rejected).length}/{g.clips.length}</span>
              {(() => {
                let done = g.clips.filter((c) => !c.rejected && (state(c) === 'edited' || state(c) === 'kept')).length
                return <em data-cat-checked={g.cat} hidden={!done}>✓{done}</em>
              })()}
            </a>
          ))}
        </nav>
        <main>
          {groups.map((g) => (
            <section key={g.cat} id={g.cat} class="rv-group">
              <h2>{names[g.cat]}</h2>
              <ul class="rv-grid">
                {g.clips.map((clip) => (
                  <li key={clip.id} id={clip.id} class="rv" data-id={clip.id} data-star={String(clip.star)} data-rejected={String(clip.rejected)} data-caption-rejected={String(!!clip.captionRejected)} data-sources={sourceKeys(clip).join(' ')} data-cut={state(clip)}>
                    {state(clip) !== 'todo' && <span class="rv-mark">{cutMark(state(clip), checks[clip.id])}</span>}
                    <video muted loop playsInline preload="none" poster={clipUrl(clip.id, 'jpg')} src={clipUrl(clip.id, 'mp4')} />
                    <div class="rv-info">
                      <label class="rv-caption"><span>EN</span><textarea data-field="en" rows={1} maxLength={120} value={clip.label.en} /></label>
                      <label class="rv-caption"><span>PT</span><textarea data-field="pt" rows={1} maxLength={120} value={clip.label.pt} /></label>
                      <small class="rv-meta">
                        <span class={`rv-src rv-src-${clip.source}`}>{sourceLabel(clip)}</span>
                        {clip.posted && <span>{clip.posted}</span>}
                        {instagramUrl(clip) && <a href={instagramUrl(clip)} target="_blank" rel="noopener">Open on Instagram ↗</a>}
                        <span>score {clip.score}</span>
                      </small>
                    </div>
                    <div class="rv-actions">
                      <button type="button" class="rv-star" data-act="star" title="Star: click to cycle ★ → ★★ → ★★★ → none">
                        <span>★</span><span>★</span><span>★</span>
                      </button>
                      <button type="button" class="rv-reject" data-act="reject">
                        <span class="if-live">Reject clip</span><span class="if-rejected">Restore clip</span>
                      </button>
                      <button type="button" class="rv-cap" data-act="caption" title="Hide this caption on the site (the card shows only its category)">
                        <span class="if-cap-ok">Reject caption</span><span class="if-cap-off">Restore caption</span>
                      </button>
                      <a class="rv-edit" href={`/review/cut/${clip.id}`} data-draft={String(Boolean(drafts[clip.id]))} title="See every moment of its source videos and choose which ones the clip uses">
                        {{ draft: 'Edit cut · draft', edited: 'Edit again', kept: 'Edit again', todo: 'Edit cut' }[state(clip)]}
                      </a>
                      <select data-act="cat" aria-label="Category">
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} selected={cat === clip.cat}>{names[cat]}</option>
                        ))}
                      </select>
                    </div>
                    <textarea class="rv-note" data-field="note" rows={2} placeholder="Feedback for Claude (only saved on this Mac)" value={notes[clip.id] ?? ''} />
                    <p class="rv-saved" aria-live="polite" />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </main>
      </Document>
    )
  }
}
