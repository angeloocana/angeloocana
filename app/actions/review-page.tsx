import { existsSync, readFileSync, writeFileSync } from 'node:fs'

import { Document } from './document.tsx'
import { CATEGORIES, CATEGORY_NAMES, instagramUrl, loadClips, saveClips, type Category, type Clip } from '../content/clips.ts'
import { ReviewBoard } from '../ui/public/review-board.tsx'

// Local-only page (npm run dev → /review) for curating the home row: every clip grouped by category.
// Reject what should not go, star what should come first (★ to ★★★), or move a clip to another
// category. Each change is saved to app/content/clips.json right away. It is never built or deployed.

export const reviewEnabled = () => process.env.NODE_ENV === 'development'

// Feedback notes stay on this machine: clip-feedback.json is git-ignored, so they never reach the public repo.
const NOTES = 'clip-feedback.json'
function loadNotes(): Record<string, string> {
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

export function ReviewPage() {
  return () => {
    let clips = loadClips()
    let names = CATEGORY_NAMES.en
    let groups = CATEGORIES.map((cat) => ({
      cat,
      clips: clips.filter((c) => c.cat === cat).sort((a, b) => Number(a.rejected) - Number(b.rejected) || b.star - a.star || b.score - a.score),
    })).filter((g) => g.clips.length)
    let live = clips.filter((c) => !c.rejected).length
    let notes = loadNotes()
    return (
      <Document title="Review clips" bodyClass="rv-page" fonts={null} styles={['/styles/review.css']}>
        <ReviewBoard />
        <header class="rv-head">
          <div>
            <h1>Review clips</h1>
            <p>
              <b data-live>{live}</b> on the home page · {clips.length - live} rejected. Hover to play. <b>★</b> moves a clip to the front
              (★★★ first). Edit captions in place, reject a caption to hide it, or leave feedback for Claude. Changes save right away; <a href="/">open the home page</a> to see the order.
            </p>
          </div>
          <label class="rv-toggle"><input type="checkbox" data-hide-rejected /> Hide rejected</label>
        </header>
        <div class="rv-sources" role="group" aria-label="Show clips from">
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
            </a>
          ))}
        </nav>
        <main>
          {groups.map((g) => (
            <section key={g.cat} id={g.cat} class="rv-group">
              <h2>{names[g.cat]}</h2>
              <ul class="rv-grid">
                {g.clips.map((clip) => (
                  <li key={clip.id} class="rv" data-id={clip.id} data-star={String(clip.star)} data-rejected={String(clip.rejected)} data-caption-rejected={String(!!clip.captionRejected)} data-sources={sourceKeys(clip).join(' ')}>
                    <video muted loop playsInline preload="none" poster={`/media/clips/${clip.id}.jpg`} src={`/media/clips/${clip.id}.mp4`} />
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
