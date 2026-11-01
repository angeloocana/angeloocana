import type { RemixNode } from 'remix/component'
import { createController } from 'remix/router'

import { assets } from '../assets.ts'
import { routes } from '../routes.ts'
import { HomePage } from './home-page.tsx'
import { PostPage } from './post-page.tsx'
import { postAt } from '../content/posts.ts'
import { ReviewPage, reviewEnabled, saveReview } from './review-page.tsx'
import { clipExists, CutPage, momentsJson, saveCut, sheetFile, sourceMedia } from './cut-page.tsx'

function post(context: { request: Request; render: (node: RemixNode) => Response | Promise<Response> }) {
  let found = postAt(new URL(context.request.url).pathname)
  if (!found) return new Response('Not Found', { status: 404 })
  return context.render(<PostPage post={found} />)
}

export default createController(routes, {
  actions: {
    async assets(context) {
      return (await assets.fetch(context.request)) ?? new Response('Not Found', { status: 404 })
    },
    home(context) {
      return context.render(<HomePage lang="en" />)
    },
    pt(context) {
      return context.render(<HomePage lang="pt" />)
    },
    postEn(context) {
      return post(context)
    },
    postPt(context) {
      return post(context)
    },
    tutorial(context) {
      return post(context)
    },
    oldEnglishHome() {
      return new Response(null, { status: 301, headers: { Location: routes.home.href() } })
    },
    review(context) {
      if (!reviewEnabled()) return new Response('Not Found', { status: 404 })
      if (context.request.method === 'POST') return saveReview(context.request)
      return context.render(<ReviewPage />)
    },
    reviewCut(context) {
      let { id } = context.params
      if (!reviewEnabled() || !clipExists(id)) return new Response('Not Found', { status: 404 })
      if (context.request.method === 'POST') return saveCut(context.request, id)
      return context.render(<CutPage id={id} />)
    },
    reviewMoments(context) {
      return reviewEnabled() ? momentsJson(context.params.vid) : new Response('Not Found', { status: 404 })
    },
    reviewSheet(context) {
      return reviewEnabled() ? sheetFile(context.request, context.params.vid) : new Response('Not Found', { status: 404 })
    },
    reviewSource(context) {
      return reviewEnabled() ? sourceMedia(context.request) : new Response('Not Found', { status: 404 })
    },
    concepts() {
      return new Response(null, { status: 301, headers: { Location: routes.home.href() } })
    },
  },
})
