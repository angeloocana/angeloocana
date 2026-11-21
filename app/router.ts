import { createRouter, type RouterContext } from 'remix/router'
import { render } from 'remix/middleware/render'
import { staticFiles } from 'remix/middleware/static'

import controller from './actions/controller.tsx'
import { assets } from './assets.ts'
import { legacyBlogAssets } from './content/legacy-blog-assets.ts'
import { MEDIA_DIR } from './content/media-dir.ts'
import { isPublicMediaKey } from './content/media-keys.ts'
import { routes } from './routes.ts'

export const router = createRouter({
  middleware: [
    staticFiles('./public', { index: false }),
    staticFiles('./legacy/static', { index: false, filter: (path) => legacyBlogAssets.includes(path) }),
    // Serve only finished media in development, never render scratch or private journals.
    staticFiles(MEDIA_DIR, {
      index: false,
      filter: (path) => process.env.NODE_ENV === 'development' && path.startsWith('media/') && isPublicMediaKey(path.slice('media/'.length)),
    }),
    // without the islands' <link rel="modulepreload">s: on a phone they raced the first screen's stylesheet
    // and fonts. The home page fetches the islands once it has painted (app/actions/document.tsx).
    render({ assets: { getScriptEntry: async (path) => ({ ...(await assets.getScriptEntry(path)), preloads: [] }) } }),
  ],
})

export type AppContext = RouterContext<typeof router>

declare module 'remix' {
  interface RouterTypes {
    context: AppContext
  }
}

router.map(routes, controller)
