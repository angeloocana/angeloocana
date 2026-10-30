# angeloocana.com

Ângelo Ocanã's personal site: projects, career and hobbies, in English (`/`) and Portuguese (`/pt`).
Built with Remix 3, prerendered to static files and hosted on Cloudflare.

## Where things live

- `app/copy.ts`: every word on the page, English and Portuguese side by side.
- `app/content/career.ts`: the jobs (each one has an optional `pt` block).
- `app/content.ts`: email and social links.
- `content/posts/`: blog posts in Markdown, kept as first published. `blog/x/y.en.md` is served at `/en/blog/x/y/`, `.pt.md` at `/pt/blog/x/y/`. Add a file to publish a post.
- `app/content/clips.json`: the home row's video clips. Curate them at http://localhost:44100/review while `npm run dev` runs: reject a clip, star it (★★★ opens the row), edit captions or move it to another category. Only live clips are built. Tools to cut clips are in `scripts/clips/`.
- `app/actions/home-page.tsx`: the page. `app/ui/public/` holds the small browser scripts (scroll scenes, career tabs, cursor).
- `public/styles/`: the CSS. Screenshots and video loops are not in the repo: they live in `~/dev/angeloocana-media/media`, and the live site serves them from a Cloudflare R2 bucket filled by `npm run media:push` (see `AGENTS.md`).

## Commands

```sh
npm i
npm run dev        # http://localhost:44100, restarts on change
npm test
npm run typecheck
npm run build      # prerender to dist/
npm run preview    # build, then serve dist/ the way Cloudflare will
npm run deploy     # build and publish to Cloudflare (run `npx wrangler login` first)
```

The repo is public: keep secrets, `.env` files, raw media and personal data out of commits.
The pre-commit hook in `.githooks/` checks for them (`git config core.hooksPath .githooks`).
