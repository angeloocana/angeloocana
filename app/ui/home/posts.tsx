import type { Handle } from 'remix/component'

import { postsFor } from '../../content/posts.ts'
import type { Copy, Lang } from '../../copy.ts'
import { Row } from './shared.tsx'

export function formatDate(date: string, lang: Lang) {
  return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en-CA', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
}

// Posts: everything published on the old site, newest first.
export function Posts(handle: Handle<{ lang: Lang; t: Copy; nav: (href: string) => string }>) {
  return () => {
    let { lang, nav, t } = handle.props
    return (
      <Row
        id="posts"
        class="row-posts"
        label={nav('#posts')}
        t={t.rail}
        arrows={t.rail.posts}
        count="post-card"
        next={{ href: '#contact', label: t.foot.title }}
        chapter
        introClass="intro-posts"
        intro={<>
          <p class="cin-kicker">{t.posts.kicker}</p>
          <h2>{t.posts.title[0]}<em>{t.posts.title[1]}</em></h2>
          <p>{t.posts.body}</p>
        </>}
      >
        {postsFor(lang).map((post) => {
          // a post in the other language says so on its title and excerpt, for screen readers and
          // translation (hrefLang only describes where the link goes)
          let postLang = post.lang === lang ? undefined : post.lang === 'pt' ? 'pt-BR' : 'en'
          return (
          <li key={post.key} class="slide post-card">
            <a href={post.url} hrefLang={post.lang} data-cursor={t.posts.kicker}>
              <p class="post-year">{post.date.slice(0, 4)}</p>
              <p class="post-meta">
                <span>{formatDate(post.date, lang)}</span>
                <span>{post.youtubeId ? t.posts.video : t.posts.read(post.minutes)}</span>
                {post.lang !== lang && <span class="post-lang">{t.posts.other[post.lang]}</span>}
              </p>
              <h3 lang={postLang}>{post.title}</h3>
              <p class="post-excerpt" lang={postLang}>{post.excerpt}</p>
              {post.tags.length > 0 && (
                <ul class="post-tags">
                  {post.tags.slice(0, 3).map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
              )}
            </a>
          </li>
          )
        })}
      </Row>
    )
  }
}
