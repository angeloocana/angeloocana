import { get, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  pt: get('/pt'),
  // Posts keep the URLs they had on the old site.
  postEn: get('/en/blog/*path'),
  postPt: get('/pt/blog/*path'),
  tutorial: get('/Tutoriais/*path'),
  oldEnglishHome: get('/en'),
  // Local clip review (GET page, POST changes). Development only.
  review: '/review',
  // Local cut editor for one clip (GET page, POST draft or rebuild), and what it plays. Development only.
  reviewCut: '/review/cut/:id',
  reviewMoments: get('/review/moments/:vid'),
  reviewSheet: get('/review/sheet/:vid'),
  reviewSource: get('/review/source'),
  // whether the review's changes are live yet (GET), or publish them now (POST)
  reviewPublish: '/review/publish',
  // Old preview links (/concepts/cinematic and friends) now live at the home page.
  concepts: get('/concepts/*rest'),
})
