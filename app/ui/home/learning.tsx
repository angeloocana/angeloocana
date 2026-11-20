import type { Handle } from 'remix/component'

import { learningFor } from '../../content/learning.ts'
import type { Copy, Lang } from '../../copy.ts'
import { kicker, Row, studyCard } from './shared.tsx'

// Education & more: the rest of the old résumés, in the career's card style. Part of the Career chapter.
export function Learning(handle: Handle<{ lang: Lang; t: Copy; nav: (href: string) => string }>) {
  return () => {
    let { lang, nav, t } = handle.props
    let learning = learningFor(lang)
    return (
      <Row
        id="learning"
        class="row-learning"
        label={nav('#learning')}
        t={t.rail}
        arrows={t.rail.learning}
        next={{ href: '#posts', label: nav('#posts') }}
        chapter
        introClass="intro-career"
        intro={<>
          <p class="cin-kicker">{kicker(t.learning.kicker)}</p>
          <h2>{t.learning.title[0]}<em>{t.learning.title[1]}</em>{t.learning.title[2]}</h2>
          <p>{t.learning.body}</p>
        </>}
      >
        {learning.map((study) => studyCard(study, t))}
      </Row>
    )
  }
}
