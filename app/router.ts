import { createRouter, type RouterContext } from 'remix/router'
import { render } from 'remix/middleware/render'
import { staticFiles } from 'remix/middleware/static'

import controller from './actions/controller.tsx'
import { assets } from './assets.ts'
import { MEDIA_DIR } from './content/media-dir.ts'
import { routes } from './routes.ts'

export const router = createRouter({
  middleware: [
    staticFiles('./public', { index: false }),
    // videos and screenshots, from the shared media folder outside the repo
    staticFiles(MEDIA_DIR, { index: false, filter: (path) => path.startsWith('media/') }),
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
