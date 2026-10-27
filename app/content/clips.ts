// The home page's video row. The list itself lives in clips.json, which the local review page
// (/review, development only) edits: reject clips, star the ones that should come first.
import { readFileSync, writeFileSync } from 'node:fs'

import type { Lang } from '../copy.ts'

export const CATEGORIES = ['ice', 'gym', 'wood', 'camping', 'food', 'snow', 'bike', 'travel', 'nature', 'music', 'other'] as const
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
}

const FILE = new URL('./clips.json', import.meta.url)

/** Read fresh on every call, so edits from the review page show up without a restart. */
export function loadClips(): Clip[] {
  return JSON.parse(readFileSync(FILE, 'utf8')) as Clip[]
}

export function saveClips(clips: Clip[]) {
  writeFileSync(FILE, JSON.stringify(clips, null, 1) + '\n')
}

/**
 * The order the home row starts in: starred first, then the best clip that keeps the mix going.
 * A category waits until two others have had a turn, so hobbies alternate. `jitter` (0 on the server)
 * lets the browser deal a slightly different order each visit (see rails.tsx, which uses the same rule).
 */
export function homeOrder(clips: Clip[] = loadClips(), jitter = 0): Clip[] {
  let live = clips.filter((clip) => !clip.rejected)
  let starred = live.filter((c) => c.star > 0).sort((a, b) => b.star - a.star || b.score - a.score)
  let pool = live.filter((c) => c.star === 0).map((clip) => ({ clip, rank: clip.score + Math.random() * jitter }))
  let order: Clip[] = []
  while (pool.length) {
    let recent = [...starred, ...order].slice(-2).map((c) => c.cat)
    pool.sort((a, b) => b.rank - (recent.includes(b.clip.cat) ? 10 : 0) - (a.rank - (recent.includes(a.clip.cat) ? 10 : 0)))
    order.push(pool.shift()!.clip)
  }
  return [...starred, ...order]
}
