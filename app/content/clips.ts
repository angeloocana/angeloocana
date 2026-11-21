// The home page's video row. The list itself lives in clips.json, which the local review page
// (/review, development only) edits: reject clips, star the ones that should come first.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import type { Lang } from '../copy.ts'
import { takeTurns } from '../ui/public/take-turns.ts'
import { MEDIA_DIR } from './media-dir.ts'
import { CATEGORIES } from './public-clip-data.ts'
import { writeJsonAtomic } from './review-io.ts'
import { readReviewQueue } from './review-queue.ts'

export { CATEGORIES }
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_NAMES: Record<Lang, Record<Category, string>> = {
  en: {
    ice: 'Ice swimming',
    gym: 'Lifting',
    wood: 'Woodworking',
    camping: 'Camping',
    food: 'Food',
    snow: 'Snow days',
    bike: 'Bikes',
    travel: 'Travel',
    nature: 'Nature',
    music: 'Music',
    other: 'Life',
  },
  pt: {
    ice: 'Natação no gelo',
    gym: 'Musculação',
    wood: 'Marcenaria',
    camping: 'Acampar',
    food: 'Comida',
    snow: 'Dias de neve',
    bike: 'Bike',
    travel: 'Viagens',
    nature: 'Natureza',
    music: 'Música',
    other: 'Vida',
  },
}

export type Clip = {
  /** File name in public/media/clips/ (without extension); also the poster's name. */
  id: string
  cat: Category
  label: { en: string; pt: string }
  /** 0 = normal, 1..3 = starred: starred clips open the row, highest first. */
  star: number
  /** Rejected clips never render and are left out of the build. */
  rejected: boolean
  /** How strong it is as an opening clip, 1..5 (from the first review). */
  score: number
  /** The caption was rejected on the review page: the card shows only its category. */
  captionRejected?: boolean
  /** Where the footage came from: an Instagram post, my old phone, or a montage of several clips. */
  source: 'instagram' | 'phone' | 'montage'
  /** For Instagram clips: what kind of post it was in the export. Stories expire, so they have no link. */
  igKind?: 'reels' | 'posts' | 'stories' | 'igtv'
  /** Day it was posted (from the export), used to find its Instagram link. */
  posted?: string
  /** The public post on Instagram, as a path like /reel/ABC123/. */
  ig?: string
}

/** Every uploaded media file's content hash, written by `npm run media:push` (scripts/media-push.ts). */
export const MEDIA_VERSIONS: Record<string, string> = JSON.parse(readFileSync(new URL('./media.json', import.meta.url), 'utf8'))

/**
 * Any other media file's URL (the projects' screenshots and videos, like `t2f/desktop.webp`), with its
 * media.json hash as ?v=, like the clips: media is cached for a week, so a new screenshot gets a new URL.
 */
export function mediaUrl(key: string) {
  return `/media/${key}?v=${MEDIA_VERSIONS[key] ?? '0'}`
}

/**
 * A clip's video or poster URL. The ?v= tag changes whenever the file is re-cut, so browsers that
 * cached the old cut (media is cached for a week, see worker.ts) fetch the new one. It's the hash from
 * media.json. The dev server plays the local file, which the cut editor may have re-cut since it was
 * pushed, so only there it's the file's time instead.
 */
export function clipUrl(id: string, ext: 'mp4' | 'jpg') {
  let key = `clips/${id}.${ext}`
  return `/media/${key}?v=${clipMediaVersion(key) ?? '0'}`
}

/**
 * Lighter cuts of the hero tile's clip, cut by hand into media/hero/ and pushed with the rest: `phone`
 * (360x640, about 400 KB) and `tile` (540x960 at a lower bitrate, about 700 KB, for wider screens),
 * instead of the 1.7 MB clip the Outside work row plays. Only the clip that opens the row has them;
 * when another clip takes its place there are none, and the tile plays the full clip.
 */
export function heroClipUrl(id: string, cut: 'phone' | 'tile') {
  let key = `hero/${id}-${cut}.mp4`
  let version = clipMediaVersion(key)
  return version ? `/media/${key}?v=${version}` : undefined
}

function clipMediaVersion(key: string) {
  if (process.env.NODE_ENV === 'development') {
    let file = join(MEDIA_DIR, 'media', key)
    if (existsSync(file)) return Math.round(statSync(file).mtimeMs / 1000).toString(36)
  }
  return MEDIA_VERSIONS[key]
}

/** The clip's Instagram post, when it has one. */
export const instagramUrl = (clip: Clip) => (clip.ig ? `https://www.instagram.com${clip.ig}` : undefined)

const FILE = new URL('./clips.json', import.meta.url)

/** Read fresh on every call, so edits from the review page show up without a restart. */
export function loadClips(): Clip[] {
  return JSON.parse(readFileSync(FILE, 'utf8')) as Clip[]
}

export function saveClips(clips: Clip[]) {
  writeJsonAtomic(FILE, clips)
}

/** The private review working copy is never used by a production build. */
export function loadReviewClips(): Clip[] {
  return (process.env.REVIEW_AUTOPUBLISH === '1' ? readReviewQueue(MEDIA_DIR)?.clips : undefined) ?? loadClips()
}

/** Track the local working copy's committed base, even if a legacy review left unstaged edits. */
export function loadCommittedClips(): Clip[] {
  return JSON.parse(execFileSync('git', ['show', 'HEAD:app/content/clips.json'], {
    cwd: new URL('../../', import.meta.url), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  })) as Clip[]
}

/**
 * The order the home row starts in: starred first, then the best clip that keeps the mix going.
 * A category waits until two others have had a turn, so hobbies alternate. `jitter` (0 on the server)
 * lets the browser deal a slightly different order each visit (rails/clips.ts deals with the same takeTurns).
 */
export function homeOrder(clips: Clip[] = process.env.NODE_ENV === 'development' ? loadReviewClips() : loadClips(), jitter = 0): Clip[] {
  let live = clips.filter((clip) => !clip.rejected)
  let starred = live.filter((c) => c.star > 0).sort((a, b) => b.star - a.star || b.score - a.score)
  let rest = live.filter((c) => c.star === 0)
  return [...starred, ...takeTurns(rest, (c) => c.score + Math.random() * jitter, (c) => c.cat, starred)]
}
