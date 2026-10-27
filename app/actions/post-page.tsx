import type { Handle } from 'remix/component'
import { unsafeHTML } from 'remix/component'

import { Document } from './document.tsx'
import { formatDate } from './home-page.tsx'
import type { Post } from '../content/posts.ts'
import { translationOf } from '../content/posts.ts'
import { COPY, HREF, type Lang } from '../copy.ts'
import { FONTS, SiteFoot, SiteNav } from '../ui/chrome.tsx'
import { CineCursor } from '../ui/public/cine-cursor.tsx'

// One post, at the same URL it had on the old site. The body is the post's own Markdown, rendered
// as is (it is my own writing, so it is trusted HTML). Video tutorials embed YouTube without cookies.
export function PostPage(handle: Handle<{ post: Post }>) {
  return () => {
    let { post } = handle.props
    let lang = post.lang
    let other: Lang = lang === 'en' ? 'pt' : 'en'
    let t = COPY[lang]
    let translation = translationOf(post)
    let home = HREF[lang]
    return (
      <Document
        lang={lang}
        title={`${post.title} · Ângelo Ocanã`}
        description={post.excerpt}
        locale={t.meta.locale}
        bodyClass="cin post-page"
        fonts={FONTS}
        styles={['/styles/base.css', '/styles/site.css', '/styles/post.css']}
        themeColor="#070707"
        url={post.url}
        ogType="article"
        alternates={translation ? { [lang]: post.url, [other]: translation.url } : { [lang]: post.url }}
      >
        <CineCursor />
        <SiteNav lang={lang} t={t} langHref={{ [lang]: post.url, [other]: translation?.url ?? HREF[other] } as Record<Lang, string>} />
        <main class="post-main">
          <article class="post">
            <a class="post-back" href={`${home === '/' ? '/' : `${home}/`}#posts`}>
              <span aria-hidden="true">←</span> {t.posts.back}
            </a>
            <p class="post-meta">
              <time datetime={post.date}>{formatDate(post.date, lang)}</time>
              <span>{post.youtubeId ? t.posts.video : t.posts.read(post.minutes)}</span>
            </p>
            <h1>{post.title}</h1>
            {post.tags.length > 0 && (
              <ul class="post-tags">
                {post.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
            )}
            {translation && (
              <a class="post-translation" href={translation.url} hrefLang={other} lang={other}>
                {t.posts.readIn} <span aria-hidden="true">→</span>
              </a>
            )}
            {post.youtubeId && (
              <figure class="post-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${post.youtubeId}`}
                  title={post.title}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
                <figcaption>
                  <a href={`https://www.youtube.com/watch?v=${post.youtubeId}`} rel="noopener" target="_blank">{t.posts.watch} ↗</a>
                </figcaption>
              </figure>
            )}
            <div class="post-body" innerHTML={unsafeHTML(post.html)} />
          </article>
        </main>
        <SiteFoot t={t} />
      </Document>
    )
  }
}
