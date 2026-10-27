import { Document } from './document.tsx'
import { CATEGORIES, CATEGORY_NAMES, loadClips, saveClips, type Category, type Clip } from '../content/clips.ts'
import { ReviewBoard } from '../ui/public/review-board.tsx'

// Local-only page (npm run dev → /review) for curating the home row: every clip grouped by category.
// Reject what should not go, star what should come first (★ to ★★★), or move a clip to another
// category. Each change is saved to app/content/clips.json right away. It is never built or deployed.

export const reviewEnabled = () => process.env.NODE_ENV === 'development'

/** POST /review with { id, star?, rejected?, cat? } */
export async function saveReview(request: Request) {
  let body = (await request.json()) as Partial<Clip> & { id: string }
  let clips = loadClips()
  let clip = clips.find((c) => c.id === body.id)
  if (!clip) return Response.json({ error: 'Unknown clip' }, { status: 404 })
  if (body.star !== undefined) clip.star = Math.max(0, Math.min(3, Math.round(Number(body.star) || 0)))
  if (body.rejected !== undefined) clip.rejected = Boolean(body.rejected)
  if (body.cat !== undefined && (CATEGORIES as readonly string[]).includes(body.cat)) clip.cat = body.cat as Category
  saveClips(clips)
  return Response.json(clip)
}

export function ReviewPage() {
  return () => {
    let clips = loadClips()
    let names = CATEGORY_NAMES.en
    let groups = CATEGORIES.map((cat) => ({
      cat,
      clips: clips.filter((c) => c.cat === cat).sort((a, b) => Number(a.rejected) - Number(b.rejected) || b.star - a.star || b.score - a.score),
    })).filter((g) => g.clips.length)
    let live = clips.filter((c) => !c.rejected).length
    return (
      <Document title="Review clips" bodyClass="rv-page" fonts={null} styles={['/styles/review.css']}>
        <ReviewBoard />
        <header class="rv-head">
          <div>
            <h1>Review clips</h1>
            <p>
              <b data-live>{live}</b> on the home page · {clips.length - live} rejected. Hover to play. <b>★</b> moves a clip to the front
              (★★★ first). Changes save right away; <a href="/">open the home page</a> to see the order.
            </p>
          </div>
          <label class="rv-toggle"><input type="checkbox" data-hide-rejected /> Hide rejected</label>
        </header>
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
                  <li key={clip.id} class="rv" data-id={clip.id} data-star={String(clip.star)} data-rejected={String(clip.rejected)}>
                    <video muted loop playsInline preload="none" poster={`/media/clips/${clip.id}.jpg`} src={`/media/clips/${clip.id}.mp4`} />
                    <div class="rv-info">
                      <b>{clip.label.en}</b>
                      <small>{clip.label.pt} · score {clip.score}</small>
                    </div>
                    <div class="rv-actions">
                      <button type="button" class="rv-star" data-act="star" title="Star: click to cycle ★ → ★★ → ★★★ → none">
                        <span>★</span><span>★</span><span>★</span>
                      </button>
                      <button type="button" class="rv-reject" data-act="reject">
                        <span class="if-live">Reject</span><span class="if-rejected">Restore</span>
                      </button>
                      <select data-act="cat" aria-label="Category">
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} selected={cat === clip.cat}>{names[cat]}</option>
                        ))}
                      </select>
                    </div>
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
