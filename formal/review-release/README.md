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
formal/review-release/check.sh          # all six runs, about two minutes; CI runs the same
formal/review-release/check.sh current  # one run with its full output or trace
formal/review-release/check.sh rearmOnlyOnPrepare
```

Needs Java 11 or later (`JAVA=/opt/homebrew/opt/openjdk@21/bin/java` on Ângelo's Mac). TLC 1.7.4 is
downloaded once into `~/.cache/tla2tools` and checked against its SHA-256. A bug run passes only
when TLC exits with its violation status, 12, on the expected rule.
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
they are two deletion batches. Every release this publisher makes rejects `x`. Review revision 2
can be saved while a release is under way. It carries either the same public data as revision 1
(the no-op path) or different data. A peer can push `x` restored, after it re-uploads its exact
immutable objects (`PeerRestores`). It can also push `x` rejected, or push unrelated commits.
Workers Builds can mark any pending commit live or failed, and an older one superseded. Git can
deny a push once, or accept it and lose the answer. One urgent takedown can run between turns,
with a gap between its authorization and its delete. The process can die after any step.

Each action is one call to Git, Workers Builds or R2, or one save of `work/publish.json`. That
granularity holds because `scripts/publish-review.ts` runs one turn at a time under the publish lock.

| Action | Code at the sync commit |
|---|---|
| `Start` | `publish-review.ts` `main()` → `reconcileReviewRelease`, which reads the queue |
| `Look` | `review-release.ts:52–57` `fetchTip()`: every read of master re-arms tombstones it references (`rememberManifest`, `review-publish-media.ts:154–167`) |
| `RecoverPush` | `review-release.ts:156–166` `if (state.candidate)` → `pushed(state.candidate)` |
| `Route` | `review-release.ts:167–184` `newerThanFailedDeployment`, `newerThanCleanup`, `live.revision` |
| `Confirm`, `MarkLive` | `review-release.ts:72–111` `confirm()`, including the `superseded` branch at `:84` |
| `Clean`, `CleanDeploy` | `review-release.ts:113–136` `clean()`: a fresh tip, then a deploy check of a newer tip |
| `Authorize`, `Remove` | `review-release.ts:137–151` `removeRejected(…, { oneBatch: true })`; `review-publish-media.ts:190–223` |
| `Prepare` | `review-release.ts:186–202` `fetchMaster()`, `capturePublishSnapshot` |
| `Upload` | `review-release.ts:204` `uploadPublishSnapshot` |
| `Push`, `Pushing`, `PushAck`, `Refetch`, `Moved` | `review-release.ts:207–238`: the no-op lease, `state.candidate` saved before `pushCandidate`, re-fetch, "Master moved" |
| `UrgentCheck`, `UrgentRemove` | `review-release.ts:250–267` `urgentlyRemoveClip`: authority, then `removeRejected` with `forceKnown` |
| `WorkersBuild` | `publish-review.ts` `checkDeployment` (live, failed, superseded) |

`UrgentCheck` reduces the authority check to its result under this model's assumptions. Every
published release rejects `x`, so once one is acknowledged, the queue's base rejects `x`. A
pending rejection therefore exists only before the first acknowledgement.

**Left out:** the snapshot's bytes and hashes, and the upload ledger's `attempted`/`available`
states. Uploads always succeed or throw before the push. Legacy migration (`migrateLegacy`) and
the 15-minute timeout are left out; the timeout is a nondeterministic deploy failure. So are
manual `media:push`, several clips, the merge of a peer's concurrent clip edits, and Cloudflare
caches. Takedown cannot recall a cached copy.

**Bounds:** one peer push, one process death, one denied push and one urgent takedown. That run
covers about 2.15 million distinct states, depth 58, in about a minute with one worker. Each bug
run allows two peer pushes, and TLC stops at its first, shortest violation. A pass covers these
bounds, not the whole system. I also ran two peer pushes with no process death once, with no
error found: 27.2 million distinct states, about 8.5 minutes with two workers.

## Known gap: a peer upload before its push

With `PeerUploadInFlight = TRUE`, a peer's upload and its approving push are separate steps.
Then `RestoreLosesAtMostOneBatch` breaks in 19 states:
1. Revision 1 goes live, and cleanup starts batch 1.
2. The peer uploads `x`'s objects but hasn't pushed its approval yet.
3. Batch 1 deletes one restored object.
4. The next turn reads a tip that still rejects `x`, and batch 2 deletes the other.
5. The peer then pushes its approval, and master references missing objects.

Cleanup can't see a restore that isn't in Git yet. Closing this needs a cross-machine protocol,
such as a peer re-uploading after its push or R2 conditional deletes. It isn't a small fix, so
the default config leaves the flag off and the gap stays open. Reproduce it by setting the flag
in a scratch copy of the config.

## Counterexamples

`Bugs` puts one historical transition back. Each must break its rule. `check.sh` fails if one stops
breaking, because then the model could no longer see that bug. These are TLC's shortest traces.

**`receiptAsLive` breaks `LiveMeansDeployed` (17 states).** This is the legacy publisher at
`7369534:scripts/publish-review.ts:165–168`, found in #19849/20318 (finding 4). With zero commits
ahead of origin, it reported "already live" without asking Workers Builds.
1. Revision 1 is pushed, and its deploy fails.
2. The review is saved again: revision 2, with the same public data.
3. Route retires the failed release. Prepare makes revision 2's commit, which is the tip itself, so there are zero commits ahead.
4. The old transition marks it live, though that commit's build failed.

The current code calls `pushed(release)` after re-checking the tip (`review-release.ts:215–218`),
which waits for `confirm()`. Replayed in "rechecks master even for a no-op…".

**`retryFailedDeploy` breaks `NewerFailureStands` (22 states).** This is `4f5bf1a`, fixed in
`488fc41` (#22097/27483 finding 8).
1. Revision 1 is pushed, and its deploy fails: `failed = deploy(1)`.
2. The review is saved again: revision 2.
3. Route: the newer revision skips the failed release, but leaves `state.pushed` behind.
4. Revision 2's push is denied: `failed = push(2)`, and its candidate is saved.
5. Next turn: RecoverPush drops the unpushed candidate. Route sees `failed.phase = 'push'`, so it no
   longer treats the old release as replaced, and Confirm checks it again: `failed = deploy(1)`.
   The newer failure is gone, and the two alternate.

The fix is `delete state.pushed` (`review-release.ts:173–177`). Replayed in
"recovers a partial upload…": `checks` stays `[sent, sent]`.

**`oneAuthAllBatches` breaks `RestoreLosesAtMostOneBatch` (16 states).** This is `488fc41`, fixed in
`747d9bc` (#22097/27483 finding 1).
1. Revision 1 is pushed and goes live; Confirm authorizes cleanup.
2. Clean reads a tip that rejects `x` and starts batch 1.
3. PeerRestores: another machine puts `x`'s objects back and pushes it approved.
4. Remove batch 1, then batch 2 under the same stale authorization: both restored objects are deleted.

The fix is `{ oneBatch: true }` and `if (more)` (`review-release.ts:141–147`), which re-read the tip
before each batch. Replayed in "does not clean an old exclusion…", where the restore lands in the
first batch's `remove` callback.

**`tombstoneHidesRestore` breaks `CleanupDoneMeansGone` (16 states).** This is `747d9bc`, fixed in
`9a803ee` (#22097/27841).
1. Urgent: the takedown deletes `x`'s objects; the ledger says `deleted`.
2. Start, Route: a turn begins to prepare revision 1.
3. PeerRestores: another uploader puts the identical immutable objects back.
4. Prepare reads that tip, which references them. The old `rememberManifest` keeps the `deleted` tombstone.
5. Push, deploy live, Confirm.
6. Clean skips every `deleted` object and reports done. The restored footage is still in R2.

The fix re-arms a referenced `deleted` object as `delete-pending` (`review-publish-media.ts:161`).
Replayed in "replays the model…", as an upload-only restore: master already names the object.

**`rearmOnlyOnPrepare` breaks `CleanupDoneMeansGone` (20 states).** This is `7b1b8e1`, found by
this model and fixed in #34719. Re-arming ran only when Prepare read the tip, so a restore seen on
any other read was forgotten.
1. Revision 1 is pushed, but the answer is lost.
2. Urgent: the takedown deletes `x`'s objects.
3. PeerRestores: another machine puts them back and pushes `x` approved.
4. RecoverPush reads that tip, which references the restored objects, but doesn't re-arm them.
5. Deploy live, Confirm. A peer rejects `x` again, and that tip deploys.
6. Clean skips every `deleted` object and reports done. The restored footage is still in R2.

The fix is `fetchTip()` (`review-release.ts:52–57`): every read of master re-arms. Replayed in
"removes an object restored and rejected again…", with the read in a cleanup turn. It failed on
`7b1b8e1` (`true !== false`: the object stayed) and passes now.

## Proof that the replay sees the bugs

Each historical transition was put back in the real code as a scratch change, run, and dropped:

- Without `review-publish-media.ts:161`, "replays the model…" and "urgent takedown…" fail.
- With `RecoverPush` marking the candidate live, "replays the model…", "recovers a partial upload…"
  and "does not clean an old exclusion…" fail.
- Without `fetchTip()`, "removes an object restored and rejected again…" fails.

## When the model and the code disagree

A failing `current` run prints its shortest trace. Replay it against the real code, one step per
action, in `scripts/review-release.test.ts` (bare Git remote, fake R2 `ObjectStore`, fake `deploy`).
If the code survives the replay, the model is wrong. Fix the model, not the rule.
