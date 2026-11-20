// One clip card's contract, shared by the page and the browser: the page renders the first few clips
// (ClipSlide in app/ui/home/outside.tsx), and rails/clips.ts appends the rest from /data/clips.json by
// filling a copy of the same card, which the page carries in a <template>. Both read a card's words and
// attributes from clipView() below, so the two can't drift apart.
import type { Lang } from '../../copy.ts'

/** One clip in /data/clips.json (and the page's own clips, before they render). */
export type ClipData = {
  id: string
  cat: string
  star: number
  score: number
  label: Record<Lang, string>
  captionRejected?: true
  ig?: string
  poster: string
  video: string
}

/** The words a card needs, in one language: the category names, and the Instagram link's. */
export type ClipWords = { names: Record<string, string>; ig: string; newTab: string }

export function clipView(clip: ClipData, lang: Lang, words: ClipWords) {
  let label = clip.label[lang]
  return {
    data: { clip: clip.id, cat: clip.cat, star: String(clip.star), score: String(clip.score), poster: clip.poster, video: clip.video },
    poster: clip.poster,
    alt: label,
    cat: words.names[clip.cat],
    /** The caption under the category, unless it was rejected on the review page. */
    caption: clip.captionRejected ? undefined : label,
    ig: clip.ig ? { href: clip.ig, label: `${words.ig}: ${label} (${words.newTab})` } : undefined,
  }
}
