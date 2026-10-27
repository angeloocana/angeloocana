// Draft copy for the site. Meant to be rewritten together with Ângelo.
// Keep personal contact details out of this file: the repo is public.

// Page text lives in copy.ts (English and Portuguese).
export const SITE = {
  email: 'angeloocana@gmail.com',
}

// Not on the page yet: timeline and education notes for a future Education part of Career.
export const STORY = [
  { when: '2007', title: 'First websites', body: 'I studied web design with a focus on digital media in Barueri, São Paulo, and started building for the web.' },
  { when: '2010', title: 'Learning to build systems', body: 'Systems analysis at FIAP and UNIP, and years of shipping software for companies across Brazil.' },
  { when: '2017', title: 'Ottawa becomes home', body: 'A new country, a new language at work, and a bigger team at Kinaxis.' },
  { when: '2021', title: 'Five years at Shopify', body: 'Building commerce for millions of merchants. This is the chapter I’m writing up next.' },
  { when: 'Now', title: 'Water, weights, wood and trails', body: 'Learning in public, building small things I love, and spending as much time outside as possible.' },
]


export type SocialId = 'github' | 'instagram' | 'x' | 'youtube' | 'facebook' | 'pluralsight'

// Social links. Most come from the old site (2017); Instagram added in 2026.
export const SOCIALS: { id: SocialId; label: string; url: string }[] = [
  { id: 'github', label: 'GitHub', url: 'https://github.com/angeloocana' },
  { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/angeloocanamartins' },
  { id: 'x', label: 'X · Twitter', url: 'https://x.com/ocanaangelo' },
  { id: 'youtube', label: 'YouTube', url: 'https://youtube.com/ocanaangelo' },
  { id: 'facebook', label: 'Facebook', url: 'https://facebook.com/angeloocanadev' },
  { id: 'pluralsight', label: 'Pluralsight', url: 'https://pluralsight.com/profile/ocanaangelo' },
]
