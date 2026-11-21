import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { CAREER } from './content/career.ts'

// The stylesheets a page loads: each kind of page gets one file, put together from the parts in
// public/styles/, so the first screen waits on one stylesheet instead of five. Each file's URL carries a
// hash of its contents (/css/home.Ab12Cd34.css), so the built site can cache /css/ for a year
// (scripts/build.ts), and a change gets a new URL at once. The router serves them (routes.css).
export const BUNDLES = {
  // the home page: the title card's font, then the rows; its other fonts come on their own (fonts, below),
  // after the first paint on a first visit (app/actions/document.tsx)
  home: ['fonts-title.css', 'base.css', 'chrome.css', 'devices.css', 'home.css'],
  // a post: no title card to cover a late font, so all of its fonts are in its one stylesheet
  post: ['fonts-title.css', 'fonts.css', 'base.css', 'chrome.css', 'post.css'],
  fonts: ['fonts.css'],
} as const

export type Bundle = keyof typeof BUNDLES

export function isBundle(name: string): name is Bundle {
  return Object.hasOwn(BUNDLES, name)
}

// Position the home timeline against the year of the build, not a fixed calendar year in home.css.
const currentYear = new Date().getFullYear()
function timelineCss(): string {
  let first = Number(CAREER[CAREER.length - 1].start)
  let years = new Set(CAREER.map((job) => Number(job.start)))
  return [...years].map((year) => {
    let left = ((year - first) / (currentYear - first)) * 100
    return `.tile-line [data-tl-year="${year}"] { left: ${left}%; }`
  }).join('\n')
}

// read on every call: in development an edited stylesheet shows on the next load
export function bundleCss(name: Bundle): string {
  let css = BUNDLES[name].map((part) => readFileSync(`public/styles/${part}`, 'utf8')).join('\n')
  return name === 'home' ? `${css}\n${timelineCss()}` : css
}

export function bundleHref(name: Bundle): string {
  let hash = createHash('sha256').update(bundleCss(name)).digest('base64url').slice(0, 8)
  return `/css/${name}.${hash}.css`
}
