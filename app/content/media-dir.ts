// Videos, screenshots and their sources stay out of git (the repo is public). They live in one folder
// on this Mac that every checkout shares: ~/dev/angeloocana-media, or $ANGELOOCANA_MEDIA.
//   media/     what the site serves at /media: the dev server reads it from here (app/router.ts),
//              and the build copies it into dist/ (scripts/build.ts)
//   sources/   originals that are not in the Instagram export (old phone videos)
//   index/     the clip catalogue: items.json (every source video), montages.json (montage recipes)
//   clip-feedback.json   notes left on the /review page
import { homedir } from 'node:os'
import { join } from 'node:path'

export const MEDIA_DIR = process.env.ANGELOOCANA_MEDIA ?? join(homedir(), 'dev', 'angeloocana-media')
