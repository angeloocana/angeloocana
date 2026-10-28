# Angelo Ocana Agent Guide

Ângelo Ocanã's personal site, live at https://angeloocana.com. Remix 3, prerendered to static files and
served by Cloudflare. English at `/`, Portuguese at `/pt`. Read this before changing or deploying anything.

## Rules

- **The repo is public.** Never commit secrets, `.env` files, media (videos, photos, screenshots), the
  clip catalogue in the media folder, review notes or other personal data. The Instagram export holds
  location data and other people's names; only finished, metadata-free loops go on the site, and
  @mentions are never shown. `.githooks/pre-commit` checks for some of this.
- **Footage of other people:** prefer clips where Ângelo is the subject; no kids or strangers as the focus.
- **Ship through master.** Branch, open a PR, merge, then deploy from up-to-date master. Deploying an old
  branch rolls the live site back.
- Ask before anything hard to undo outside the repo (DNS, Cloudflare or Netlify settings, deleting media).

## Commands

```sh
npm i
npm run dev        # http://localhost:44100, restarts on change (npm run hmr for live reload)
npm test
npm run typecheck
npm run build      # prerender to dist/ (needs the media folder, see below)
npm run preview    # build, then serve dist/ the way Cloudflare will
npm run deploy     # build and publish to Cloudflare
```

Node 24 (`~/.nvm/versions/node/v24.21.0/bin`). Wrangler is pinned in `package.json` and already signed in
on Ângelo's Mac.

## Media

Videos and screenshots are **not in git**. They live in one folder on Ângelo's Mac that every checkout
and session shares: `~/dev/angeloocana-media` (override with `$ANGELOOCANA_MEDIA`, see
`app/content/media-dir.ts`). Its `media/` folder is served at `/media` by the dev server (`app/router.ts`)
and copied into `dist/` by the build. A deploy replaces every file on the site, so the build stops if any
live clip is missing rather than publishing a site without videos. Never move or delete that folder.

Clip tools (cut, montage, contact sheets, Instagram links) are in `scripts/clips/`; read its README.

## Where things live

- `app/copy.ts`: every word on the page, English and Portuguese side by side.
- `app/content/career.ts`: jobs (Shopify, Kinaxis, …), each with an optional `pt` block.
- `app/content.ts`: email and social links.
- `content/posts/`: blog posts in Markdown, kept as first published, at their old URLs
  (`blog/x/y.en.md` → `/en/blog/x/y/`, `.pt.md` → `/pt/blog/x/y/`, `Tutoriais/X.md` → `/Tutoriais/X/`).
- `app/content/clips.json`: the home row's clips (category, EN/PT caption, star, rejected, source,
  Instagram link). Curate them at http://localhost:44100/review while `npm run dev` runs: reject,
  star (★★★ opens the row), edit or reject captions, filter by source, leave notes. Dev only; never built.
- `app/actions/home-page.tsx`: the page. Every section is a sideways row (`Row`), driven by
  `app/ui/public/rails.tsx` (arrows, drag, shuffle, autoplay). The Jump Over Jump demo is
  `app/ui/public/joj-demo.tsx`; devices are `app/ui/devices.tsx`.
- `app/actions/post-page.tsx`: one blog post. `app/actions/review-page.tsx`: the review page.
- `public/styles/`: the CSS. `scripts/build.ts`: prerender, redirects (`_redirects`), sitemap, cache headers.

## Things that look odd but are on purpose

- **Clips render as images**; `rails.tsx` adds a `<video>` only while a clip is near view and removes it
  after. A `<video>` per clip (114) made iPhone browsers close the page. Keep it that way.
- **Clip URLs carry `?v=`** (file time) because media is cached for a week; a re-cut gets a new URL.
- **Script URLs carry a hash** (`rails.%40a1b2c3.tsx.js`, `fingerprint` in `app/assets.ts`) because
  `/assets/` is cached for a year without asking again. With plain names, phones that had visited kept
  running old scripts against new pages (the clips stayed still).
- **`public/sw.js`** removes the old Gatsby site's offline service worker from returning visitors, and
  `/offline-plugin-app-shell-fallback/` serves the home page for the same reason. Keep both until 2027.
- **Old URLs** (`/en/…`, `/fr/…`, tags, resume, about, contact) redirect in `scripts/build.ts`.
- **`legacy/resumes/`** holds Ângelo's old resumes (2015–2021), phone numbers and all. He chose to keep them
  in git until he writes new ones. They are not built into the site; don't delete them.

## Hosting

- Cloudflare Workers static assets, worker `angeloocana` (`wrangler.jsonc`), custom domains
  `angeloocana.com` and `www.angeloocana.com`. Preview copy: https://angeloocana.angeloocana.workers.dev.
- Domain registered at GoDaddy; DNS on Cloudflare (nameservers `brit`/`duke.ns.cloudflare.com`), with
  "Always Use HTTPS" on.
- The old Gatsby site is still on Netlify (project `angeloocana.com`, builds skipped by `netlify.toml`). Its
  Netlify DNS zone points at Cloudflare (A 172.64.80.1) for resolvers that still remember it. Once
  that has settled (after 2026-10-30), Ângelo can delete the Netlify project and DNS zone, and
  `netlify.toml` can go.

## Remix

Refer to ./.agents/skills/remix/SKILL.md for the Remix mental model and how to find guides and API
READMEs through `node_modules/remix/INDEX.md`.

- `app/routes.ts` defines the route contract; `app/router.ts` wires routes to controllers and middleware
- Route actions are in `app/actions/controller.tsx`; `app/actions/controller.test.ts` is the router smoke test
- `app/ui/public/` holds the client components (`clientEntry`); `app/assets.ts` owns the asset pipeline
