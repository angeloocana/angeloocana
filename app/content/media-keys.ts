// These are the project assets in media.json, including old Jump Over Jump screenshots whose URLs still work.
export const PROJECT_MEDIA_KEYS: readonly string[] = [
  'joj/2015-logo.webp',
  'joj/2016-board.webp',
  'joj/2026-neural.webp',
  'joj/desktop.webp',
  'joj/phone.webp',
  't2f/desktop.webp',
  't2f/ipad-history.webp',
  't2f/phone-body.webp',
  't2f/phone-history.webp',
  't2f/phone-home.webp',
  't2f/phone-records.webp',
  't2f/phone-session.webp',
  't2f/watch-go.webp',
  't2f/watch-log-set.webp',
  't2f/watch-record.webp',
  't2f/watch-rest.webp',
  't2f/wear.mp4',
]

// Same ID syntax as the public clip data validator: generated c IDs and named h- montages.
const CLIP_ID = '(c[0-9a-f]{8}|h-[a-z0-9-]+)'
const CLIP_KEY = new RegExp(String.raw`^clips/${CLIP_ID}\.(?:mp4|jpg)$`)
const HERO_KEY = new RegExp(String.raw`^hero/${CLIP_ID}-(?:phone|tile)\.mp4$`)

export function clipMediaId(key: string): string | undefined {
  return CLIP_KEY.exec(key)?.[1] ?? HERO_KEY.exec(key)?.[1]
}

export function isPublicMediaKey(key: string): boolean {
  return clipMediaId(key) !== undefined || PROJECT_MEDIA_KEYS.includes(key)
}

export function versionedMediaKey(key: string, version: string): string {
  if (!isPublicMediaKey(key)) throw new Error('Invalid public media key')
  // A 96-bit SHA-256 prefix in base64url (16 characters) keeps the prerendered pages small.
  if (!/^[A-Za-z0-9_-]{16}$/.test(version)) throw new Error('Invalid media version')
  return `versions/${version}/${key}`
}
