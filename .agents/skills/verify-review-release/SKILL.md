---
name: verify-review-release
description: Model-check the review publisher's release boundary (scripts/review-release.ts, the media ledger in scripts/review-publish-media.ts) with TLA+. Use before changing how the publisher pushes, confirms a deployment, cleans rejected media or runs an urgent takedown, or when a review finds an ordering bug there.
---

# Verify the review release

`formal/review-release/` models every interleaving of the publisher, Git, Workers Builds, R2, a peer
machine and a process death. Its promise: an old receipt is never current proof. A push receipt is
not a deployment, and a deletion receipt is not proof that an object is still gone. Read
`formal/review-release/README.md` first. It has the rules in plain words, the action-to-line map,
the bounds and the four historical counterexamples.

## Does my change touch it?

Yes, if it changes `reconcileReviewRelease` or `urgentlyRemoveClip` in `scripts/review-release.ts`,
or `rememberManifest`, `upload` or `removeRejected` in `scripts/review-publish-media.ts`. It also
does if it changes what `scripts/publish-review.ts` passes as `deploy` or how often it runs a turn,
or the `PublishState` shape in `app/content/publish.ts`.

## Run

```sh
JAVA=/opt/homebrew/opt/openjdk@21/bin/java formal/review-release/check.sh   # about a minute
npm test -- scripts/review-release.test.ts                                  # the replays on real code
```

`check.sh` must print five `PASS` lines. `current` means every rule holds on today's transition.
Each bug name means its old transition still breaks its rule. Read a trace with
`check.sh current` or `check.sh <bug>`, and read TLA+ results with the `/statechart` skill, which
tells each violation as its shortest path in plain words.

## A rule breaks on `current`

Tell the trace as steps in the code's words, using the README's action map. Then replay it in
`scripts/review-release.test.ts`, one step per action: bare Git remote from `fixture()`, a fake
`ObjectStore`, a fake `deploy`, and a fresh `reconcileReviewRelease` call per turn, with state only
from what was saved. If the real code breaks, it is a finding. Report it, and don't weaken the rule.
If the real code survives, the model is wrong. Fix the action that disagrees with the code.

## An intended change

Update the matching action and its line references in the README. When you remove a historical
guard on purpose, its `Bugs` run must still break its rule, or you lost a check. Add a new
`Bugs` entry, its expected rule in `check.sh`, and a replay for any new bug class you fix.

## Coverage and sync

Covered: `scripts/review-release.ts` (`reconcileReviewRelease`, `urgentlyRemoveClip`) and
`scripts/review-publish-media.ts` (`rememberManifest`, `removeRejected`; `upload` only as
"puts nothing for a rejected clip"). Not covered: snapshot bytes, legacy migration, manual
`media:push`, several clips, and Cloudflare caches.

Last confirmed against the code at `7b1b8e1`. Move this commit forward only after you have
checked that every action still matches the lines it names.
