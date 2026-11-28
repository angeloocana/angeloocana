# Spare work

What @ultimate starts when automation A22 (`~/.ultimate/bin/spare-dispatch.mjs`) sends "Spare capacity dispatch": a
subscription is on pace to end its week under 98 %. Each message is one fire. A local `.ultimate/spare-dispatch-off`
file pauses dispatches here.

## On each fire

1. Start one coordinator branch on the family the message names (`lead`, `sol`, `neon`) for the first unchecked item
   below, and mark it `[~] #<branch>`. Never put Codex (`sol`) on security or auth work.
2. Check `uptime` first; start only under a 1-minute load of about 12.
3. Each item is one branch, sized small or assess-first as written. Landing follows AGENTS.md: every landing deploys
   angeloocana.com. Anything that changes what visitors see ends as an assessment or a phone preview for Ângelo, not a
   landing. Never touch port 44144 (the review server) or `~/dev/angeloocana-media` unless the item says so.
4. When the item lands or is dropped, mark it `[x]` with the sha or the reason.

## Backlog

- [ ] Leaner tests: measure `npm test` and `npm run test:browser` (14 s and 72 s today), then cut setup waste in the
  three slowest files without dropping any behaviour, security, privacy or past-bug check. Small; measure before and
  after.
- [ ] Flaky browser test: the WebKit wheel case "leaves the row where a sideways wheel took it while a #clip-… waits
  for the clips" fails on macOS wheel inertia (#37403's report). Make it deterministic (scroll by a set amount, or
  wait for the row to settle), or drop it from the WebKit pass if it proves nothing there. Small.
- [ ] Dead code sweep: unused exports, CSS rules no page uses, copy keys nothing reads (`app/copy.ts`), helpers left
  after the hardening series. Delete only what nothing imports; keep the build, budget and media checks green. Small.
- [ ] Re-cut gap from #35555: without `REVIEW_AUTOPUBLISH=1`, `finish_render` journals only the MP4/poster pair. The
  obvious fix broke `test_slow_cli_rebuild_cannot_overwrite_newer_edit`, whose fixtures point the index files at
  other paths. Assess first: what a real fix costs, and the cleanest way to make those fixtures use real paths. Run on
  `lead`.

## Needs Ângelo

- Two short Shopify engineering stories for the site: only Ângelo has the facts.
- 2017 TLS keys in public git history: did he reuse them anywhere, and does he want #19813's purge plan run (force push)?
- Second-Mac publish gap from #34719: worth a protocol change only if he ever publishes from two machines.
