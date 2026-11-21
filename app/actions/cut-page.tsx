import { existsSync } from 'node:fs'
import { extname, join } from 'node:path'
import type { Handle } from 'remix/component'
import { openLazyFile } from 'remix/fs'
import { createFileResponse } from 'remix/response/file'

import { Document } from './document.tsx'
import { loadNotes, reviewGroups } from './review-page.tsx'
import { CATEGORY_NAMES, clipUrl, loadReviewClips } from '../content/clips.ts'
import { cleanPieces, clipSource, cutState, exclusive, loadChecks, loadCutInputs, loadDraft, loadDrafts, loadMoments, loadRecipe, loadSources, MOMENTS_DIR, rebuildClip, saveDraft, setCheck, sourceFile } from '../content/cuts.ts'
import { MEDIA_DIR } from '../content/media-dir.ts'
import { autoPublish, needsLegacyRecovery, publishInfo, reviewChanged } from '../content/publish.ts'
import { withReviewLock } from '../content/review-io.ts'
import { CutEditor } from '../ui/public/cut-editor.tsx'

// Local-only cut editor (npm run dev → /review/cut/<clip id>): every short moment of the clip's source
// videos, which ones the clip uses now, and a new selection to rebuild it from. Never built or deployed.

/** GET /review/cut/:id */
export function CutPage(handle: Handle<{ id: string }>) {
  return () => {
    let clips = loadReviewClips()
    let clip = clips.find((c) => c.id === handle.props.id)!
    let current = loadRecipe(clip.id) ?? []
    // the next clip on the home page whose cut is not checked yet, in /review's order
    let checks = loadChecks()
    let drafts = loadDrafts()
    let checked = (id: string) => ['edited', 'kept'].includes(cutState(id, drafts, checks))
    let order = reviewGroups(clips).flatMap((g) => g.clips)
    let at = order.findIndex((c) => c.id === clip.id)
    let next = [...order.slice(at + 1), ...order.slice(0, at)].find((c) => !c.rejected && !checked(c.id))
    let live = clips.filter((c) => !c.rejected)
    return (
      <Document title={`Cut: ${clip.label.en}`} bodyClass="rv-page ce-page" styles={['/styles/review.css']}>
        <CutEditor
          clip={{ id: clip.id, title: clip.label.en, cat: CATEGORY_NAMES.en[clip.cat], rejected: clip.rejected }}
          current={current}
          draft={loadDraft(clip.id)}
          ownSource={current.length ? undefined : clipSource(clip.id)}
          sources={loadSources()}
          video={clipUrl(clip.id, 'mp4')}
          note={loadNotes()[clip.id] ?? ''}
          check={checks[clip.id] ?? null}
          next={next ? { id: next.id, title: next.label.en } : null}
          publish={publishInfo()}
          progress={{ checked: live.filter((c) => checked(c.id)).length, total: live.length }}
        />
      </Document>
    )
  }
}

export const clipExists = (id: string) => loadReviewClips().some((c) => c.id === id)

/** POST /review/cut/:id with { action: 'save' | 'rebuild' | 'discard' | 'keep' | 'uncheck', pieces? } */
export function saveCut(request: Request, id: string) {
  let parsed = request.json().catch(() => ({}))
  return exclusive(async () => {
    let body = (await parsed) as { action?: string; pieces?: unknown }
    let expected = await withReviewLock(MEDIA_DIR, () => {
      if (body.action === 'keep' || body.action === 'uncheck') {
        return Response.json({ check: setCheck(id, body.action === 'keep' ? 'kept' : null) })
      }
      if (body.action === 'discard') return Response.json({ draft: saveDraft(id, null) })
      if (body.action === 'rebuild' && autoPublish() && needsLegacyRecovery()) {
        return Response.json({ error: 'Use Recover to finish the previous publish before rebuilding.' }, { status: 409 })
      }

      let pieces = body.pieces === undefined && body.action === 'rebuild' ? undefined : cleanPieces(body.pieces)
      if (typeof pieces === 'string') return Response.json({ error: pieces }, { status: 400 })
      let draft = pieces ? saveDraft(id, pieces) : false
      return body.action === 'rebuild' ? loadCutInputs(id) : Response.json({ draft })
    })
    if (expected instanceof Response) return expected

    // clips.py takes the same lock to verify the inputs and promote; only the server queue stays held.
    let result = await rebuildClip(id, expected)
    if (result === 'stale') return Response.json({ error: 'Cut changed; review it and rebuild again.' }, { status: 409 })
    if (result === 'failed') return Response.json({ error: 'Could not render the cut.' }, { status: 500 })
    return withReviewLock(MEDIA_DIR, () => {
      reviewChanged()
      return Response.json({ draft: false, video: clipUrl(id, 'mp4'), current: loadRecipe(id), check: loadChecks()[id] ?? null })
    })
  })
}

/** GET /review/moments/:vid: the moments of one source video (found on first request). */
export async function momentsJson(vid: string) {
  let data = await loadMoments(vid)
  return data ? Response.json(data, { headers: { 'Cache-Control': 'no-cache' } }) : new Response('Not Found', { status: 404 })
}

/** GET /review/sheet/:vid: the thumbnail sheet of those moments. */
export async function sheetFile(request: Request, vid: string) {
  let file = join(MOMENTS_DIR, `${vid}.jpg`)
  if (!/^v\d+$/.test(vid) || !existsSync(file)) return new Response('Not Found', { status: 404 })
  return createFileResponse(openLazyFile(file, { type: 'image/jpeg' }), request, { cacheControl: 'no-cache' })
}

const TYPES: Record<string, string> = { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

/** GET /review/source?path=ig:reels/…: a source video or photo, so the editor can play any moment of it. */
export async function sourceMedia(request: Request) {
  let path = new URL(request.url).searchParams.get('path') ?? ''
  let file = sourceFile(path)
  let type = TYPES[extname(path).toLowerCase()]
  if (!file || !type || !existsSync(file)) return new Response('Not Found', { status: 404 })
  return createFileResponse(openLazyFile(file, { type }), request, { cacheControl: 'no-cache' })
}
