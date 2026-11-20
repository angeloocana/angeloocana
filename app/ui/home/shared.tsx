import type { Handle, RemixNode } from 'remix/component'

import type { Study } from '../../content/learning.ts'
import type { Copy } from '../../copy.ts'

// What the home page's sections share: the row every section is, its cards, and the small pieces of
// their words (a kicker, a title that links, the pause button).

/** A media file's URL (the R2 bucket, see worker.ts), versioned by its media.json hash. */
export { mediaUrl as media } from '../../content/clips.ts'

// "Personal projects · track2.fit": a line may break only after a separator, never before it (the "·" ends
// the line it closes), and never inside the part that follows it (the product's name stays whole)
export function kicker(text: string) {
  let [first, ...rest] = text.split(' · ')
  return <>{first}{rest.flatMap((part) => ['\u00a0· ', <span key={part} class="kick-name">{part}</span>])}</>
}

// Plays and pauses every clip on the page; rails.tsx keeps all of them (and their names) in step.
// Its name says what a press does: "Pause motion", then "Play motion" while paused (rails.tsx swaps them).
export function PauseButton(handle: Handle<{ label: { pause: string; play: string }; class?: string }>) {
  return () => (
    <button type="button" class={`clip-pause ${handle.props.class ?? ''}`} data-pause data-play={handle.props.label.play} data-pause-label={handle.props.label.pause} aria-label={handle.props.label.pause} title={handle.props.label.pause}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-pause" d="M8 5v14M16 5v14" /><path class="i-play" d="M8 5.5v13l11-6.5z" /></svg>
    </button>
  )
}

// One section = one row: scroll down between rows, sideways inside one (see app/ui/public/rails.tsx).
// Two quiet arrows over the row's right end move along it; the prompt at the bottom names the next row.
export function Row(
  handle: Handle<{
    id?: string
    class: string
    label: string
    t: Copy['rail']
    next?: { href: string; label: string }
    children?: RemixNode
    chapter?: boolean
    backdrop?: boolean
    shuffle?: boolean
    /** JSON with the rest of the row's clips, appended as the row nears view (rails.tsx). */
    more?: string
    words?: Record<string, string>
    /** A supporting row's opening words: the row's first card on wider screens, above the row on phones,
        so the first card shows at once there. Rendered in both places; CSS shows one (the other is display: none). */
    intro?: RemixNode
    introClass?: string
    /** The arrows' names, for this row's things ("More clips"); never "Next", which is the pill under the row. */
    arrows: { prev: string; next: string }
    /** Shows "3 / 115" under the row (rails.tsx counts the slides of this class). */
    count?: string
    /** How many of them there are in all, when the page carries only some (the clips). */
    total?: number
    /** A hint for keyboard users, shown under the row while it has keyboard focus. */
    keys?: string
    /** Something over the row, after its opening words on phones (the clips' hobby chips). */
    head?: RemixNode
    /** A pause button beside the arrows, which stay put, so it is in reach wherever the row has moved to. */
    pause?: Copy['hi']['motion']
  }>,
) {
  return () => {
    let { arrows, backdrop, chapter, children, class: className, count, head, id, intro, introClass = '', keys, label, more, next, pause, shuffle, t, total, words } = handle.props
    let keysId = keys && id ? `${id}-keys` : undefined
    return (
      <section id={id} class={`row ${className}`} data-rail data-chapter={chapter ? '' : undefined} aria-label={label}>
        {backdrop && <div class="row-bg" data-rail-bg aria-hidden="true" />}
        {intro && <div class={`intro row-head ${introClass}`}>{intro}</div>}
        {/* the row's controls, over its right end and never on a card: anything for the row (the hobby
            chips), where you are in a long row and the arrows. Needs JS (rails.tsx), so it's hidden without. */}
        <div class="rail-bar">
          {head}
          {/* where you are in a long row, and how much is left (rails.tsx fills it in); in its place while
              the row has keyboard focus, the keys that move through it */}
          {count && (
            <div class="rail-foot">
              <p class="rail-count" data-rail-count aria-hidden="true" />
              {keys && <p class="rail-keys" id={keysId} aria-hidden="true">{keys}</p>}
            </div>
          )}
          {pause && <PauseButton label={pause} class="rail-pause" />}
          {/* rails.tsx disables the one that has nowhere to go, which also takes it out of the Tab order */}
          <button type="button" class="rail-arrow rail-prev" data-rail-prev aria-label={arrows.prev} disabled>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" class="rail-arrow rail-next" data-rail-next aria-label={arrows.next}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div class="rail-wrap">
          {/* focusable so the arrow keys scroll it, and named for itself (not by reading all its cards) */}
          <ul class="rail" data-rail-track data-shuffle={shuffle ? '' : undefined} data-more={more} data-words={words && JSON.stringify(words)} data-count={count} data-total={total} data-at={JSON.stringify(t.at)} tabIndex={0} aria-label={label} aria-describedby={keysId}>
            {intro && <li class={`slide intro intro-slide ${introClass}`}>{intro}</li>}
            {children}
          </ul>
          {/* where the row has come to rest ("3 to 4 of 9"), said politely once scrolling settles, and only
              while focus is in the row (rails.tsx) */}
          <p class="sr-only" data-rail-live aria-live="polite" />
        </div>
        {next && (
          <a class="row-down" href={next.href} data-rmx-document>
            <span>{t.down}</span>
            <b>{next.label}</b>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7" /></svg>
          </a>
        )}
      </section>
    )
  }
}

// A project card: a device (or anything visual) above a short caption.
export function Card(handle: Handle<{ class: string; title: string; body: string; children?: RemixNode }>) {
  return () => (
    <li class={`slide card ${handle.props.class}`}>
      <div class="card-visual">{handle.props.children}</div>
      <div class="card-copy">
        <h3>{handle.props.title}</h3>
        <p>{handle.props.body}</p>
      </div>
    </li>
  )
}

// A card's title, when it links somewhere: the same ↗ as the links in the card's list, so it reads as a
// link before you hover it, and like them it opens in a new tab. The ↗ stays on the line of the last word.
export function TitleLink(handle: Handle<{ href: string; text: string }>) {
  return () => {
    let words = handle.props.text.split(' ')
    let last = words.pop()
    return (
      <a href={handle.props.href} rel="noopener" target="_blank">
        {words.length > 0 && `${words.join(' ')} `}
        <span class="title-end">{last}<i class="title-arrow" aria-hidden="true">↗</i></span>
      </a>
    )
  }
}

// One card in the Education and More projects rows, in the career's card style: years, title, a line or
// two, a short list, and the technologies at the bottom.
export function studyCard(study: Study, t: Copy) {
  return (
    <li key={study.id} class="slide job study">
      {study.start && (
        <p class="job-years">
          <span>{study.start}</span>
          {study.end && study.end !== study.start && <i aria-hidden="true" />}
          {study.end && study.end !== study.start && <span>{study.end === 'Now' ? t.career.now : study.end}</span>}
        </p>
      )}
      <h3>{study.url ? <TitleLink href={study.url} text={study.title} /> : study.title}</h3>
      {study.meta && <p class="job-meta">{study.meta}</p>}
      {study.body && <p class="job-built">{study.body}</p>}
      {study.items && (
        <ul class="job-highlights">
          {study.items.map((item) => (
            <li key={item.title}>
              <b>{item.url ? <a href={item.url} rel="noopener" target="_blank">{item.title} <i aria-hidden="true">↗</i></a> : item.title}</b>
              {item.body && <small>{item.body}</small>}
            </li>
          ))}
        </ul>
      )}
      {study.tech && (
        <ul class="job-tech" aria-label={t.career.tech}>
          {study.tech.map((tech) => <li key={tech}>{tech}</li>)}
        </ul>
      )}
    </li>
  )
}
