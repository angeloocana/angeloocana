import type { Handle } from 'remix/component'

import type { SocialId } from '../content.ts'

// Monochrome marks for the social links, drawn in currentColor so they follow the link's colour
// and hover state. Each sits in a 24 x 24 box.
const PATHS: Record<SocialId | 'email', string> = {
  github:
    'M12 1.5C6.2 1.5 1.5 6.3 1.5 12.2c0 4.7 3 8.7 7.2 10.1.5.1.7-.2.7-.5v-1.9c-2.9.6-3.6-1.4-3.6-1.4-.5-1.2-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.5 1.2 3.1.9.1-.7.4-1.2.7-1.4-2.3-.3-4.8-1.2-4.8-5.2 0-1.2.4-2.1 1.1-2.9-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1a9.9 9.9 0 0 1 5.3 0c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.7.8 1.1 1.7 1.1 2.9 0 4.1-2.5 4.9-4.8 5.2.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5a10.6 10.6 0 0 0 7.2-10.1C22.5 6.3 17.8 1.5 12 1.5Z',
  x: 'M17.8 2.5h3.2l-7 8 8.2 11h-6.4l-5-6.6-5.8 6.6H1.8l7.5-8.6L1.4 2.5H8l4.6 6 5.2-6Zm-1.1 17h1.8L7.2 4.3H5.3l11.4 15.2Z',
  youtube:
    'M22.5 7.2s-.2-1.5-.9-2.2c-.8-.9-1.8-.9-2.2-.9C16.3 3.8 12 3.8 12 3.8s-4.3 0-7.4.3c-.4 0-1.4 0-2.2.9-.7.7-.9 2.2-.9 2.2S1.3 9 1.3 10.8v1.7c0 1.8.2 3.6.2 3.6s.2 1.5.9 2.2c.8.9 1.9.9 2.4 1 1.7.2 7.2.2 7.2.2s4.3 0 7.4-.3c.4 0 1.4 0 2.2-.9.7-.7.9-2.2.9-2.2s.2-1.8.2-3.6v-1.7c0-1.8-.2-3.6-.2-3.6ZM9.8 15.3V8.7l5.9 3.3-5.9 3.3Z',
  facebook:
    'M13.6 22v-8.4h2.8l.4-3.3h-3.2V8.2c0-.9.3-1.6 1.6-1.6h1.7V3.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.4v3.3h2.8V22h3.4Z',
  instagram: '',
  pluralsight: '',
  email: '',
}

export function SocialIcon(handle: Handle<{ id: SocialId | 'email' }>) {
  return () => {
    let { id } = handle.props
    return (
      <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {id === 'instagram' ? (
          <g fill="none" stroke="currentColor" stroke-width="1.9">
            <rect x="3" y="3" width="18" height="18" rx="5.2" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" stroke="none" />
          </g>
        ) : id === 'pluralsight' ? (
          <g fill="currentColor">
            <path d="M12 1.8a10.2 10.2 0 1 0 0 20.4 10.2 10.2 0 0 0 0-20.4Zm0 1.9a8.3 8.3 0 1 1 0 16.6 8.3 8.3 0 0 1 0-16.6Z" />
            <path d="M9.4 7.3v9.4l7.3-4.7-7.3-4.7Zm1.5 2.7 3 2-3 2v-4Z" />
          </g>
        ) : id === 'email' ? (
          <g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
            <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
            <path d="m3.5 6.5 8.5 6.6 8.5-6.6" />
          </g>
        ) : (
          <path fill="currentColor" d={PATHS[id]} />
        )}
      </svg>
    )
  }
}
