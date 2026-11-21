import { execFile } from 'node:child_process'

import { loadReviewClips } from './clips.ts'
import { MEDIA_DIR } from './media-dir.ts'
import { autoPublish, REPO } from './publish.ts'

export async function takeDownReviewClip(request: Request, id: string): Promise<Response> {
  if (!autoPublish()) return Response.json({ error: 'Public takedowns run on the always-on review server.' }, { status: 409 })
  let approval = await request.json().catch(() => null)
  if (approval?.confirm !== true) return Response.json({ error: 'Confirm the urgent takedown first.' }, { status: 400 })
  let clip = loadReviewClips().find((clip) => clip.id === id)
  if (!clip) return Response.json({ error: 'Unknown clip' }, { status: 404 })
  if (!clip.rejected) return Response.json({ error: 'Reject the clip before taking down its media.' }, { status: 409 })

  // The locked CLI rechecks the saved rejection before changing any objects.
  return new Promise((resolve) => {
    execFile(process.env.PYTHON ?? 'python3', [
      'scripts/clips/review_io.py', '--publish-lock', MEDIA_DIR, process.execPath, '--import', 'remix/node-tsx',
      'scripts/publish-review.ts', '--takedown', id,
    ], { cwd: REPO, maxBuffer: 32_768 }, (error, _stdout, stderr) => {
      if (!error) return resolve(Response.json({ removed: true }))
      if (error.code === 75) return resolve(Response.json({ error: 'Publishing is in progress. Try the takedown again when it finishes.' }, { status: 409 }))
      console.error('Urgent clip takedown:', stderr.trim() || error.message)
      resolve(Response.json({ error: 'Takedown did not finish. Try again; check the review server log if it keeps failing.' }, { status: 502 }))
    })
  })
}
