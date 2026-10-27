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
  // Old preview links (/concepts/cinematic and friends) now live at the home page.
  concepts: get('/concepts/*rest'),
})
