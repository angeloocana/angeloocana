# Review release model

A TLA+ model of the review publisher's release boundary: `reconcileReviewRelease` and
`urgentlyRemoveClip` in `scripts/review-release.ts`, with the media ledger in
`scripts/review-publish-media.ts`. It checks every order in which the publisher, Git, Workers
Builds, R2, a peer machine and a process death can interleave, within small bounds.

**The promise:** an old receipt is never current proof. A push receipt is not a deployment, and a
deletion receipt is not proof that an object is still gone.

**The harm when it breaks:** the review page says a release is live when it never deployed, or
a rejected clip's footage stays publicly downloadable from R2 after cleanup says it is gone.

```sh
formal/review-release/check.sh          # all five runs, about a minute; CI runs the same
formal/review-release/check.sh current  # one run with its full output or trace
formal/review-release/check.sh oneAuthAllBatches
```

Needs Java 11 or later (`JAVA=/opt/homebrew/opt/openjdk@21/bin/java` on Ângelo's Mac). TLC 1.7.4 is
downloaded once into `~/.cache/tla2tools` and checked against its SHA-256.
`.github/workflows/formal.yml` runs it on PRs and pushes that touch these files.

## Rules

| Rule | In plain words |
|---|---|
| `LiveMeansDeployed` | `state.live` names a commit that Workers Builds deployed, with this release's public data. |
| `NewerFailureStands` | An old deploy failure never replaces the newer revision's own push failure, so the two can't alternate on every automatic retry. |
| `RestoreLosesAtMostOneBatch` | A peer's restore loses at most the one deletion batch that was already authorized when it landed. |
| `CleanupDoneMeansGone` | When cleanup reports done and no restore landed after it was authorized, the clip's objects are gone from R2. The condition: the publisher has read a tip that references the clip since the last restore. It can't learn of a restore it never saw. |
| `PushedIsOnRemote` | `state.pushed` names a commit on origin/master. |

## What the model holds

One clip, `x`, with two R2 objects. The batch size (6 in the code) is scaled to one object, so
they are two deletion batches. Every release this publisher makes rejects `x`. Review revisions
1 and 2 differ in other data, and the review can be saved again while a release is under way.
A peer can push `x` restored, after it re-uploads its exact immutable objects (`PeerRestores`).
It can also push `x` rejected, or push unrelated commits. Workers Builds can mark any pending
commit live or failed, and an older one superseded. Git can deny a push once, or accept it and
lose the answer. One urgent takedown can run between turns. The process can die after any step.

Each action is one call to Git, Workers Builds or R2, or one save of `work/publish.json`. That
granularity holds because `scripts/publish-review.ts` runs one turn at a time under the publish lock.

| Action | Code at the sync commit |
|---|---|
| `Start` | `publish-review.ts` `main()` → `reconcileReviewRelease`, which reads the queue |
| `RecoverPush` | `review-release.ts:149–158` `if (state.candidate)` → `pushed(state.candidate)` |
| `Route` | `review-release.ts:160–178` `newerThanFailedDeployment`, `newerThanCleanup`, `live.revision` |
| `Confirm`, `MarkLive` | `review-release.ts:65–104` `confirm()`, including the `superseded` branch at `:77` |
| `Clean`, `CleanDeploy` | `review-release.ts:106–131` `clean()`: a fresh `fetchMaster()`, then a deploy check of a newer tip |
| `Authorize`, `Remove` | `review-release.ts:134–144` `removeRejected(…, { oneBatch: true })`; `review-publish-media.ts:192–223` |
| `Prepare` | `review-release.ts:180–195`: `rememberManifest` (`review-publish-media.ts:154–167`), `capturePublishSnapshot` |
| `Upload` | `review-release.ts:197` `uploadPublishSnapshot` |
| `Push`, `Pushing`, `PushAck`, `Refetch`, `Moved` | `review-release.ts:200–231`: the no-op lease, `state.candidate` saved before `pushCandidate`, re-fetch, "Master moved" |
| `Urgent` | `review-release.ts:244–261` `urgentlyRemoveClip` with `forceKnown` |
| `WorkersBuild` | `publish-review.ts` `checkDeployment` (live, failed, superseded) |

**Left out:** the snapshot's bytes and hashes, and the upload ledger's `attempted`/`available`
states. Uploads always succeed or throw before the push. Legacy migration (`migrateLegacy`) and
the 15-minute timeout are left out; the timeout is a nondeterministic deploy failure. So are
manual `media:push`, several clips, the merge of a peer's concurrent clip edits, and Cloudflare
caches. Takedown cannot recall a cached copy.

**Bounds:** one peer push, one process death, one denied push and one urgent takedown. That run
covers about 1.56 million distinct states, depth 58, in about 50 seconds with one worker. I also
ran it once with two peer pushes and no process death: 21.6 million states, depth 61, about
5 minutes with two workers, no error. A pass covers these bounds, not the whole system.

## Counterexamples

`Bugs` puts one historical transition back. Each must break its rule. `check.sh` fails if one stops
breaking, because then the model could no longer see that bug. These are TLC's shortest traces.

**`receiptAsLive` breaks `LiveMeansDeployed` (10 states).** This is the legacy publisher, found in
#19849/20318 (finding 4). A push that landed but never deployed was reported "already live",
because there were no commits ahead of origin.
1. Prepare, Upload, Push: `state.candidate` is saved.
2. Pushing: Git accepts the commit, and its build is pending.
3. PushAck: the answer is lost, and the turn fails with `failed.phase = 'push'`.
4. RecoverPush: the commit is on origin, so the old transition sets `state.live`, though Workers Builds never deployed it.

The fix is `pushed(state.candidate)` (`review-release.ts:154`), which waits for `confirm()`.
Replayed in `review-release.test.ts`, "replays the model…".

**`retryFailedDeploy` breaks `NewerFailureStands` (22 states).** This is `4f5bf1a`, fixed in
`488fc41` (#22097/27483 finding 8).
1. Revision 1 is pushed, and its deploy fails: `failed = deploy(1)`.
2. The review is saved again: revision 2.
3. Route: the newer revision skips the failed release, but leaves `state.pushed` behind.
4. Revision 2's push is denied: `failed = push(2)`, and its candidate is saved.
5. Next turn: RecoverPush drops the unpushed candidate. Route sees `failed.phase = 'push'`, so it no
   longer treats the old release as replaced, and Confirm checks it again: `failed = deploy(1)`.
   The newer failure is gone, and the two alternate.

The fix is `delete state.pushed` (`review-release.ts:166–170`). Replayed in
"recovers a partial upload…": `checks` stays `[sent, sent]`.

**`oneAuthAllBatches` breaks `RestoreLosesAtMostOneBatch` (16 states).** This is `488fc41`, fixed in
`747d9bc` (#22097/27483 finding 1).
1. Revision 1 is pushed and goes live; Confirm authorizes cleanup.
2. Clean reads a tip that rejects `x` and starts batch 1.
3. PeerRestores: another machine puts `x`'s objects back and pushes it approved.
4. Remove batch 1, then batch 2 under the same stale authorization: both restored objects are deleted.

The fix is `{ oneBatch: true }` and `if (more)` (`review-release.ts:134–140`), which re-read the tip
before each batch. Replayed in "does not clean an old exclusion…", where the restore lands in the
first batch's `remove` callback.

**`tombstoneHidesRestore` breaks `CleanupDoneMeansGone` (15 states).** This is `747d9bc`, fixed in
`9a803ee` (#22097/27841).
1. Urgent: the takedown deletes `x`'s objects; the ledger says `deleted`.
2. Start, Route: a turn begins to prepare revision 1.
3. PeerRestores: another uploader puts the identical immutable objects back.
4. Prepare reads that tip, which references them. The old `rememberManifest` keeps the `deleted` tombstone.
5. Push, deploy live, Confirm.
6. Clean skips every `deleted` object and reports done. The restored footage is still in R2.

The fix re-arms a referenced `deleted` object as `delete-pending` (`review-publish-media.ts:161`).
Replayed in "replays the model…".

## Proof that the replay sees the bugs

Each historical transition was put back in the real code as a scratch change, run, and dropped:

- Without `review-publish-media.ts:161`, "replays the model…" and "urgent takedown…" fail.
- With `RecoverPush` marking the candidate live, "replays the model…", "recovers a partial upload…"
  and "does not clean an old exclusion…" fail.

## When the model and the code disagree

A failing `current` run prints its shortest trace. Replay it against the real code, one step per
action, in `scripts/review-release.test.ts` (bare Git remote, fake R2 `ObjectStore`, fake `deploy`).
If the code survives the replay, the model is wrong. Fix the model, not the rule.
