// Checks the emitted home pages' UTF-8 byte weight after scripts/build.ts finishes rewriting asset URLs,
// including the projection where every legacy 10-character media hash becomes a 16-character versioned URL.

export const HOME_HTML_BUDGET = 130_000
export const HOME_ROUTES = ['/', '/pt/'] as const

const LEGACY_MEDIA_VERSION = /(\/media\/[^"'\s)<>?]+\?v=)[0-9a-f]{10}(?![A-Za-z0-9_-])/g
const MEDIA_URL = /\/media\/[^"'\s)<>]+/g
const SCRIPT_ELEMENT = /<script\b[^>]*>[^]*?<\/script\s*>/gi
const START_LOOKING_HINTS =
  'app/ui/home/ (sections, CLIPS_IN_PAGE), app/ui/public/clip-card.ts (duplicate card attributes), ' +
  'app/ui/devices.tsx & app/ui/social-icons.tsx (SVG sprites), app/content/media-keys.ts (?v= length), ' +
  'and scripts/build.ts (asset URL rewrites)'

export type HomeHtmlArtifact = {
  route: string
  file: string
  html: string
}

export type HomeHtmlMeasurement = {
  route: string
  file: string
  emittedBytes: number
  projectedBytes: number
  legacyMediaUrls: number
  overage: number
}

export function projectVersionedMediaHtml(html: string) {
  let legacyMediaUrls = 0
  let projected = html.replace(LEGACY_MEDIA_VERSION, (_, prefix: string) => {
    legacyMediaUrls += 1
    return `${prefix}abcdefghijklmnop`
  })
  return { html: projected, legacyMediaUrls }
}

export function measureHomeHtml(artifact: HomeHtmlArtifact, budget = HOME_HTML_BUDGET): HomeHtmlMeasurement {
  let emittedBytes = Buffer.byteLength(artifact.html, 'utf8')
  let { html: projected, legacyMediaUrls } = projectVersionedMediaHtml(artifact.html)
  let projectedBytes = Buffer.byteLength(projected, 'utf8')
  return {
    route: artifact.route,
    file: artifact.file,
    emittedBytes,
    projectedBytes,
    legacyMediaUrls,
    overage: Math.max(0, projectedBytes - budget),
  }
}

function measureTopSections(html: string) {
  let sections: { id: string; bytes: number }[] = []
  let depth = 0
  let start = 0
  let id: string | undefined
  for (let match of html.matchAll(/<(\/?)section\b([^>]*)>/gi)) {
    if (!match[1]) {
      if (depth === 0) {
        start = match.index
        id = match[2].match(/\bid="([^"]+)"/i)?.[1]
      }
      if (!match[0].endsWith('/>')) depth += 1
    } else if (depth > 0) {
      depth -= 1
      if (depth === 0 && id) {
        sections.push({ id, bytes: Buffer.byteLength(html.slice(start, match.index + match[0].length), 'utf8') })
      }
    }
  }
  return sections.sort((a, b) => b.bytes - a.bytes).slice(0, 3)
}

function measureSvgs(html: string) {
  let count = 0
  let bytes = 0
  let depth = 0
  let start = 0
  for (let match of html.matchAll(/<(\/?)svg\b[^>]*>/gi)) {
    if (!match[1]) {
      if (match[0].endsWith('/>')) {
        if (depth === 0) {
          count += 1
          bytes += Buffer.byteLength(match[0], 'utf8')
        }
        continue
      }
      if (depth === 0) start = match.index
      depth += 1
    } else if (depth > 0) {
      depth -= 1
      if (depth === 0) {
        count += 1
        bytes += Buffer.byteLength(html.slice(start, match.index + match[0].length), 'utf8')
      }
    }
  }
  return { count, bytes }
}

function measureScripts(html: string) {
  let count = 0
  let bytes = 0
  for (let [tag] of html.matchAll(SCRIPT_ELEMENT)) {
    count += 1
    bytes += Buffer.byteLength(tag, 'utf8')
  }
  return { count, bytes }
}

function measureMediaUrls(html: string) {
  let count = 0
  let bytes = 0
  for (let [url] of html.matchAll(MEDIA_URL)) {
    count += 1
    bytes += Buffer.byteLength(url, 'utf8')
  }
  return { count, bytes }
}

function formatBytes(bytes: number) {
  return `${bytes.toLocaleString('en-US')} B`
}

function formatFailure(artifact: HomeHtmlArtifact, measurement: HomeHtmlMeasurement, budget: number) {
  let { html: projected } = projectVersionedMediaHtml(artifact.html)
  let sections = measureTopSections(projected)
  let svgs = measureSvgs(projected)
  let scripts = measureScripts(projected)
  let media = measureMediaUrls(projected)
  let lines = [
    `  ${measurement.route} (${measurement.file}): ${formatBytes(measurement.emittedBytes)} emitted, ` +
      `${formatBytes(measurement.projectedBytes)} with versioned media ` +
      `(+${formatBytes(measurement.overage)} over ${formatBytes(budget)} limit)`,
  ]
  if (sections.length) {
    lines.push(`    Largest sections: ${sections.map((s) => `#${s.id} (${formatBytes(s.bytes)})`).join(', ')}`)
  }
  lines.push(
    `    Cross-cutting: <svg> ${formatBytes(svgs.bytes)} (${svgs.count}), ` +
      `<script> ${formatBytes(scripts.bytes)} (${scripts.count}), ` +
      `/media/ URLs ${formatBytes(media.bytes)} (${media.count} URLs, ${measurement.legacyMediaUrls} legacy)`,
  )
  lines.push(`    Start looking in: ${START_LOOKING_HINTS}`)
  return lines.join('\n')
}

export function assertHomeHtmlBudget(
  artifacts: HomeHtmlArtifact[],
  { budget = HOME_HTML_BUDGET, requiredRoutes = HOME_ROUTES }: { budget?: number; requiredRoutes?: readonly string[] } = {},
) {
  let present = new Set(artifacts.map((artifact) => artifact.route))
  let missing = requiredRoutes.filter((route) => !present.has(route))
  if (missing.length) {
    throw new Error(`Home HTML budget check missed required home routes: ${missing.join(', ')}`)
  }

  let measurements = artifacts.map((artifact) => ({ artifact, measurement: measureHomeHtml(artifact, budget) }))
  let failures = measurements.filter(({ measurement }) => measurement.overage > 0)
  if (failures.length) {
    let details = failures.map(({ artifact, measurement }) => formatFailure(artifact, measurement, budget)).join('\n')
    throw new Error(`Emitted home HTML exceeds budget:\n${details}`)
  }
  return measurements.map(({ measurement }) => measurement)
}
