// Videos, screenshots and their sources stay out of git (the repo is public). They live in one folder
// on this Mac that every checkout shares: ~/dev/angeloocana-media, or $ANGELOOCANA_MEDIA.
//   media/     what the site serves at /media: the dev server reads it from here (app/router.ts), and
//              `npm run media:push` uploads it to the R2 bucket the live site serves it from (worker.ts)
//   sources/   originals that are not in the Instagram export (old phone videos)
//   index/     the clip catalogue: items.json (every source video), montages.json (how every clip is cut),
//              cut-drafts.json (cuts changed on /review/cut that are not rebuilt yet),
//              cut-checks.json (clips whose cut you checked there: edited or kept)
//   work/      scratch output, and moments/: each source video split into short moments for /review/cut
//   clip-feedback.json   notes left on the /review page
import { homedir } from 'node:os'
import { join } from 'node:path'

export const MEDIA_DIR = process.env.ANGELOOCANA_MEDIA ?? join(homedir(), 'dev', 'angeloocana-media')
