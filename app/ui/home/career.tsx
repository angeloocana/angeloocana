import type { Handle } from 'remix/component'

import { careerFor } from '../../content/career.ts'
import type { Copy, Lang } from '../../copy.ts'
import { kicker, Row, TitleLink } from './shared.tsx'

/** How many of a job's tags a phone shows (home.css hides the rest, and the card says how many more). */
const PHONE_TAGS = 6

// Career: today first, then back to the start. The intro card lists every job, a tap away.
export function Career(handle: Handle<{ lang: Lang; t: Copy; nav: (href: string) => string }>) {
  return () => {
    let { lang, nav, t } = handle.props
    let career = careerFor(lang)
    return (
      <Row id="career" class="row-career" label={nav('#career')} t={t.rail} arrows={t.rail.career} next={{ href: '#projects', label: nav('#projects') }} chapter>
        <li class="slide intro intro-career">
          <p class="cin-kicker">{kicker(t.career.kicker)}</p>
          <h2>{t.career.title[0]}<em>{t.career.title[1]}</em>{t.career.title[2]}</h2>
          {/* counted by job, like the list below it (the two freelance stretches are two) */}
          <p>{t.career.sub(career.length, career[career.length - 1].start)} <span class="career-pick">{t.career.pick}</span></p>
          {/* a way straight to any job, so the older ones are a tap away; rails.tsx slides the row,
              rolls the names in like credits and keeps the last one picked lit */}
          <ol class="career-index" aria-label={t.career.jump} data-reveal>
            {career.map((job, i) => (
              <li key={job.id} style={`--i:${i}`}>
                <a href={`#job-${job.id}`} data-rmx-document data-rail-jump>
                  <b>{job.short ?? job.company}</b>
                  <span>
                    {job.start}
                    {job.end !== job.start && '–'}
                    {job.end === 'Now' ? <em>{t.career.now}</em> : job.end !== job.start && job.end.slice(2)}
                    {job.end === 'Now' && <i aria-hidden="true" />}
                    {job.chapter && ` · ${job.chapter}`}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </li>
        {career.map((job) => (
          <li key={job.id} id={`job-${job.id}`} class={`slide job${job.featured ? ' job-featured' : ''}${job.highlights?.length ? ' job-wide' : ''}`}>
            <p class="job-years">
              <span>{job.start}</span>
              {job.start !== job.end && <i aria-hidden="true" />}
              {job.start !== job.end && <span>{job.end === 'Now' ? t.career.now : job.end}</span>}
              {job.featured && <span class="job-badge">{t.career.today}</span>}
            </p>
            <h3>
              {job.url ? <TitleLink href={job.url} text={job.company} /> : job.company}
              {job.chapter && <> <em>{job.chapter}</em></>}
            </h3>
            {(job.role || job.place) && <p class="job-meta">{[job.role, job.place].filter(Boolean).join(' · ')}</p>}
            <p class="job-label">{t.career.built}</p>
            {job.built ? <p class="job-built">{job.built}</p> : <p class="job-built job-empty">{t.career.empty}</p>}
            {(job.featured || !!job.highlights?.length) && (
              <ol class="job-highlights">
                {(job.highlights?.length ? job.highlights : [null, null, null]).map((h, n) => (
                  <li key={n} class={h ? '' : 'is-empty'}>
                    <b>{h ? (h.url ? <a href={h.url} rel="noopener" target="_blank">{h.title} <i aria-hidden="true">↗</i></a> : h.title) : t.career.highlightTitle}</b>
                    <small>{h ? h.body : t.career.highlightBody}</small>
                  </li>
                ))}
              </ol>
            )}
            {job.clients && <p class="job-clients"><span>{t.career.for}</span> {job.clients.join(' · ')}</p>}
            {job.tech.length > 0 && (
              <ul class="job-tech" aria-label={t.career.tech}>
                {job.tech.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
                {/* phones show the first few tags (home.css): this says how many more, and a press shows them in
                    place (rails/rows.ts), and says "Show fewer" while they show */}
                {job.tech.length > PHONE_TAGS && (
                  <li class="tech-more"><button type="button" aria-expanded="false">{t.career.moreTech(job.tech.length - PHONE_TAGS)}</button></li>
                )}
              </ul>
            )}
          </li>
        ))}
      </Row>
    )
  }
}
