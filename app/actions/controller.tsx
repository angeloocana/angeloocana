import type { RemixNode } from 'remix/component'
import { createController } from 'remix/router'

import { assets } from '../assets.ts'
import { routes } from '../routes.ts'
import { clipsJson, HomePage } from './home-page.tsx'
import { PostPage } from './post-page.tsx'
import { postAt } from '../content/posts.ts'
import { ReviewPage, reviewDenied, saveReview } from './review-page.tsx'
import { clipExists, CutPage, momentsJson, saveCut, sheetFile, sourceMedia, uploadIntake, privateIntakeMedia } from './cut-page.tsx'
import { findIntake } from '../content/review-intake.ts'
import { publishInfo, startPublish } from '../content/publish.ts'
import { takeDownReviewClip } from '../content/review-takedown.ts'
import { bundleCss, bundleHref, isBundle } from '../styles.ts'

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
    css(context) {
      let { name } = context.params
      if (!isBundle(name) || new URL(context.request.url).pathname !== bundleHref(name)) return new Response('Not Found', { status: 404 })
      return new Response(bundleCss(name), { headers: { 'Content-Type': 'text/css; charset=utf-8' } })
    },
    home(context) {
      return context.render(<HomePage lang="en" />)
    },
    pt(context) {
      return context.render(<HomePage lang="pt" />)
    },
    clipsData() {
      return Response.json(clipsJson())
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
      let denied = reviewDenied(context.request)
      if (denied) return denied
      if (context.request.method === 'POST') return saveReview(context.request)
      return context.render(<ReviewPage />)
    },
    reviewCut(context) {
      let denied = reviewDenied(context.request)
      if (denied) return denied
      let { id } = context.params
      if (!findIntake(id) && !clipExists(id)) return new Response('Not Found', { status: 404 })
      if (context.request.method === 'POST') return saveCut(context.request, id)
      return context.render(<CutPage id={id} />)
    },
    reviewIntake(context) {
      return reviewDenied(context.request) ?? uploadIntake(context.request)
    },
    reviewIntakePreview(context) {
      let { id, revision, filename } = context.params
      return reviewDenied(context.request) ?? privateIntakeMedia(context.request, id, revision, filename)
    },
    reviewMoments(context) {
      return reviewDenied(context.request) ?? momentsJson(context.request, context.params.vid)
    },
    reviewSheet(context) {
      return reviewDenied(context.request) ?? sheetFile(context.request, context.params.vid)
    },
    reviewSource(context) {
      return reviewDenied(context.request) ?? sourceMedia(context.request)
    },
    async reviewPublish(context) {
      let denied = reviewDenied(context.request)
      if (denied) return denied
      let accepted = true
      if (context.request.method === 'POST') {
        let body = await context.request.json().catch(() => null)
        accepted = startPublish(body?.intent === 'recover' ? 'recover' : 'publish')
      }
      return Response.json(publishInfo(), { status: accepted ? 200 : 409, headers: { 'Cache-Control': 'no-store' } })
    },
    reviewTakedown(context) {
      return reviewDenied(context.request) ?? takeDownReviewClip(context.request, context.params.id)
    },
    concepts() {
      return new Response(null, { status: 301, headers: { Location: routes.home.href() } })
    },
  },
})
