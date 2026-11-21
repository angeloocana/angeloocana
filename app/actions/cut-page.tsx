import { existsSync } from 'node:fs'
import { extname, join } from 'node:path'
import type { Handle } from 'remix/component'
import { openLazyFile } from 'remix/fs'
import { createFileResponse } from 'remix/response/file'

import { Document } from './document.tsx'
import { loadNotes, reviewGroups } from './review-page.tsx'
import { CATEGORIES, CATEGORY_NAMES, clipUrl, loadReviewClips } from '../content/clips.ts'
import { approveIntake, canReadSource, cleanPieces, clipSource, cutState, exclusive, loadChecks, loadCutInputs, loadDraft, loadDrafts, loadMoments, loadRecipe, loadSources, MOMENTS_DIR, rebuildClip, saveDraft, setCheck, sourceFile } from '../content/cuts.ts'
import { findIntake, initialIntakeCut, intakeClip, intakePreviewFile, latestIntakePreview, ReviewIntakeError, stagePrivateVideo } from '../content/review-intake.ts'
import { MEDIA_DIR } from '../content/media-dir.ts'
import { autoPublish, needsLegacyRecovery, publishInfo, reviewChanged } from '../content/publish.ts'
import { withReviewLock } from '../content/review-io.ts'
import { CutEditor } from '../ui/public/cut-editor.tsx'

// Local-only cut editor (npm run dev → /review/cut/<clip id>): every short moment of the clip's source
// videos, which ones the clip uses now, and a new selection to rebuild it from. Never built or deployed.

/** GET /review/cut/:id */
export function CutPage(handle: Handle<{ id: string }>) {
  return () => {
    let { id } = handle.props
    let intake = findIntake(id)
    if (intake) {
      let revision = latestIntakePreview(id)
      return (
        <Document title="Private video cut" bodyClass="rv-page ce-page" styles={['/styles/review.css']}>
          <CutEditor
            clip={{ id, title: 'Private video cut', cat: '', rejected: false }}
            current={initialIntakeCut(intake)}
            draft={loadDraft(id)}
            ownSource={intake.path}
            sources={loadSources(id).filter((source) => source.id === intake.id)}
            video={revision ? previewUrl(id, revision) : ''}
            note=""
            check={null}
            next={null}
            publish={publishInfo()}
            progress={{ checked: 0, total: 0 }}
            intake={{ revision, canApprove: autoPublish() && !needsLegacyRecovery(), categories: CATEGORIES.map((key) => ({ key, label: CATEGORY_NAMES.en[key] })) }}
          />
        </Document>
      )
    }
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

const previewUrl = (id: string, revision: string) => `/review/intake/${id}/${revision}/clip.mp4`
const cutError = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })

export async function uploadIntake(request: Request) {
  try {
    return Response.json(await stagePrivateVideo(request), { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return error instanceof ReviewIntakeError ? cutError(error.message, error.status) : cutError('Could not prepare this video. Try again.', 500)
  }
}

/** POST /review/cut/:id. A staged clip can only save, discard, render privately or approve. */
export function saveCut(request: Request, id: string) {
  let parsed = request.json().catch(() => null)
  return exclusive(async () => {
    let body = (await parsed) as { action?: string; pieces?: unknown; revision?: unknown; cat?: unknown; label?: unknown; captionRejected?: unknown } | null
    if (!body || !['save', 'rebuild', 'discard', 'keep', 'uncheck', 'approve'].includes(body.action ?? '')) return cutError('Unknown cut action.', 400)
    let intake = findIntake(id)
    if (body.action === 'approve') {
      if (!intake || typeof body.revision !== 'string' || latestIntakePreview(id) !== body.revision) return cutError('That private preview is no longer current. Render it again before adding it.', 409)
      if (!autoPublish() || needsLegacyRecovery()) return cutError('Review publishing must be ready before adding a clip.', 409)
      let clip
      try {
        clip = intakeClip(id, body)
      } catch (error) {
        if (error instanceof ReviewIntakeError) return cutError(error.message, error.status)
        throw error
      }
      let result = await approveIntake(id, body.revision, clip)
      if (result === 'stale') return cutError('That private preview changed. Render it again before adding it.', 409)
      if (result === 'failed') return cutError('Could not add the clip. The private draft is still available.', 500)
      reviewChanged()
      return Response.json({ added: true }, { headers: { 'Cache-Control': 'no-store' } })
    }
    let expected = await withReviewLock(MEDIA_DIR, () => {
      if (body.action === 'keep' || body.action === 'uncheck') {
        if (intake) return cutError('This clip is still private.', 409)
        return Response.json({ check: setCheck(id, body.action === 'keep' ? 'kept' : null) })
      }
      if (body.action === 'discard') return Response.json({ draft: saveDraft(id, null) })
      if (!intake && body.action === 'rebuild' && autoPublish() && needsLegacyRecovery()) {
        return Response.json({ error: 'Use Recover to finish the previous publish before rebuilding.' }, { status: 409 })
      }

      let pieces = body.pieces === undefined && body.action === 'rebuild'
        ? (intake ? loadDraft(id) ?? initialIntakeCut(intake) : undefined)
        : cleanPieces(body.pieces, intake ? id : undefined)
      if (typeof pieces === 'string') return cutError(pieces, 400)
      if (intake && pieces?.some((piece) => piece.kind !== 'vid' || piece.path !== intake.path || piece.start + piece.secs > intake.dur + 0.02)) {
        return cutError('Keep every piece within the uploaded video.', 422)
      }
      let draft = pieces ? saveDraft(id, pieces) : false
      return body.action === 'rebuild' ? loadCutInputs(id) : Response.json({ draft })
    })
    if (expected instanceof Response) return expected

    // clips.py takes the same lock to verify the inputs and promote; only the server queue stays held.
    let result = await rebuildClip(id, expected, Boolean(intake))
    if (result === 'stale') return Response.json({ error: 'Cut changed; review it and rebuild again.' }, { status: 409 })
    if (result === 'failed') return cutError('Could not render the cut.', 500)
    return withReviewLock(MEDIA_DIR, () => {
      if (intake) {
        let revision = latestIntakePreview(id)
        return revision ? Response.json({ draft: true, revision, video: previewUrl(id, revision) }, { headers: { 'Cache-Control': 'no-store' } })
          : cutError('The draft changed. Render it again.', 409)
      }
      reviewChanged()
      return Response.json({ draft: false, video: clipUrl(id, 'mp4'), current: loadRecipe(id), check: loadChecks()[id] ?? null })
    })
  })
}

/** GET /review/moments/:vid: the moments of one source video (found on first request). */
export async function momentsJson(request: Request, vid: string) {
  let cut = new URL(request.url).searchParams.get('cut') ?? undefined
  let data = await loadMoments(vid, cut)
  return data ? Response.json(data, { headers: { 'Cache-Control': cut ? 'no-store' : 'no-cache' } }) : new Response('Not Found', { status: 404 })
}

/** GET /review/sheet/:vid: the thumbnail sheet of those moments. */
export async function sheetFile(request: Request, vid: string) {
  let cut = new URL(request.url).searchParams.get('cut') ?? undefined
  let file = join(MOMENTS_DIR, `${vid}.jpg`)
  if (!canReadSource(vid, cut) || !existsSync(file)) return new Response('Not Found', { status: 404 })
  return createFileResponse(openLazyFile(file, { type: 'image/jpeg' }), request, { cacheControl: cut ? 'no-store' : 'no-cache' })
}

const TYPES: Record<string, string> = { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

/** GET /review/source?path=ig:reels/…: a source video or photo, so the editor can play any moment of it. */
export async function sourceMedia(request: Request) {
  let params = new URL(request.url).searchParams
  let path = params.get('path') ?? ''
  let cut = params.get('cut') ?? undefined
  let file = sourceFile(path, cut)
  let type = TYPES[extname(path).toLowerCase()]
  if (!file || !type || !existsSync(file)) return new Response('Not Found', { status: 404 })
  return createFileResponse(openLazyFile(file, { type }), request, { cacheControl: cut ? 'no-store' : 'no-cache' })
}

export async function privateIntakeMedia(request: Request, id: string, revision: string, filename: string) {
  let file = intakePreviewFile(id, revision, filename)
  if (!file) return new Response('Not Found', { status: 404 })
  return createFileResponse(openLazyFile(file, { type: TYPES[extname(filename)] }), request, { cacheControl: 'no-store' })
}
