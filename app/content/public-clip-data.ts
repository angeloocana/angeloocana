// Keep this independent of file I/O: review, Git and the publisher check the JSON they will write.
export const CATEGORIES = ['ice', 'gym', 'wood', 'camping', 'food', 'snow', 'bike', 'travel', 'nature', 'music', 'other'] as const

const fields = new Set(['id', 'cat', 'label', 'star', 'rejected', 'score', 'source', 'igKind', 'posted', 'ig', 'captionRejected'])
// Heuristics catch common accidental disclosures, not names or every way to write an address.
const privateCaption = [
  /@|https?:\/\/|file:\/\/|\/(?:Users|home)\/|[a-z]:\\/i,
  /(?<![\w.])(?:\+?1[ .-]?)?(?:\([2-9]\d{2}\)[ .-]?|[2-9]\d{2}[ .-])[2-9]\d{2}[ .-]\d{4}(?!\d)/,
  /(?<!\w)\+55[ .-]?(?:\(\d{2}\)|\d{2})[ .-]?9?\d{4}[ .-]?\d{4}(?!\d)/,
  /\b\d{1,5} +(?:[\p{L}.'’-]+ +){1,5}(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|court|ct|crescent|cres)\b/iu,
  /\b(?:rua|avenida|alameda|estrada) +[\p{L}.'’ -]{2,50},? +\d{1,5}\b/iu,
  /(?<![\d.])[+-]?\d{1,2}\.\d{4,}\s*[,;]\s*[+-]?\d{1,3}\.\d{4,}(?![\d.])/,
]

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const matches = (value: unknown, pattern: RegExp) => typeof value === 'string' && pattern.test(value)
const oneOf = (value: unknown, options: readonly string[]) => typeof value === 'string' && options.includes(value)
const intBetween = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max

export function assertPublicClipData(clips: unknown): void {
  if (!Array.isArray(clips)) throw new Error('Public clips must be a list.')
  let ids = new Set<string>()
  for (let [i, clip] of (clips as unknown[]).entries()) {
    // Error texts never repeat an input value, even for an unexpected field or ID.
    let fail: (field: string) => never = (field) => { throw new Error(`Clip ${i + 1}: ${field}`) }
    if (!isRecord(clip) || Object.keys(clip).some((key) => !fields.has(key))) fail('only public clip fields are allowed.')
    if (typeof clip.id !== 'string' || !/^(?:c[0-9a-f]{8}|h-[a-z0-9-]+)$/.test(clip.id)) fail('invalid ID.')
    if (ids.has(clip.id)) fail('duplicate ID.')
    ids.add(clip.id)
    if (!oneOf(clip.cat, CATEGORIES) || !oneOf(clip.source, ['instagram', 'phone', 'montage'])) fail('invalid category or source.')
    if (!intBetween(clip.star, 0, 3) || !intBetween(clip.score, 1, 5) || typeof clip.rejected !== 'boolean' ||
        (clip.captionRejected !== undefined && typeof clip.captionRejected !== 'boolean')) fail('invalid rating or review flag.')
    if ((clip.igKind !== undefined && !oneOf(clip.igKind, ['posts', 'reels', 'stories', 'igtv'])) ||
        (clip.posted !== undefined && !matches(clip.posted, /^\d{4}-\d{2}-\d{2}$/)) ||
        (clip.ig !== undefined && !matches(clip.ig, /^\/(?:p|reel|tv)\/[a-z\d_-]+\/$/i))) fail('invalid Instagram fields.')
    let labels = clip.label
    if (!isRecord(labels) || Object.keys(labels).some((key) => key !== 'en' && key !== 'pt')) fail('only English and Portuguese captions are allowed.')
    for (let lang of ['en', 'pt']) {
      let value = labels[lang]
      if (typeof value !== 'string' || !value.trim()) fail(`${lang.toUpperCase()} caption is missing.`)
      if (privateCaption.some((pattern) => pattern.test(value))) fail(`${lang.toUpperCase()} caption looks like it contains contact information, a link, or a location. Put private details in the review note instead.`)
    }
  }
}
