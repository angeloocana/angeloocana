# Recut transaction model

A TLA+ model of how a recut reaches the clip's files: the review lock, the promotion journal
and its recovery in `scripts/clips/review_io.py`, and the lock-scoped commit of a rendered pair
by `rebuild()` in `scripts/clips/clips.py`. It checks every order in which two rebuild jobs, the
cut editor and a reader can interleave, with any process dying after any step.

**The promise:** old-or-new **to readers that take the review lock**. Such a reader sees the
clip's MP4, poster, index and review queue from one whole commit, never a mix. A newer cut, once
it has landed, is never replaced by an older one. This is not atomic replacement of several files
by the filesystem: a reader that skips the lock can still see a half-finished commit. The lock
plus recovery-before-grant is what makes it look atomic.

**The harm when it breaks:** the review page or the publisher's snapshot pairs a new video with
an old poster or an old recipe, and the publisher pushes it live; or a slow render overwrites a
newer cut that Ângelo already approved.

```sh
formal/recut-transaction/check.sh                  # all five runs, a few seconds; CI runs the same
formal/recut-transaction/check.sh current          # one run with its full output
formal/recut-transaction/check.sh staleRenderWins  # one historical bug, with its trace
```

The TLC version and hash are pinned in `formal/tlc.sh`, shared with `formal/review-release/`.
Needs Java 11 or later (`JAVA=/opt/homebrew/opt/openjdk@21/bin/java` on Ângelo's Mac). A bug run
passes only when TLC exits with its violation status, 12, on the expected rule.

## Rules

| Rule | In plain words |
|---|---|
| `ReadersSeeOldOrNew` | A reader holding the review lock sees all four files from the same commit. |
| `NoStaleWin` | A commit never lands a cut generation older than one that already landed. |
| `TypeOK` | The lock is held only in a step that runs under it. |

## What the model holds

One clip with four files, each holding the generation it was written by (0 is the cut before any
edit): `mp4`, `jpg`, `index` (the recipe, draft and check, kept as one file here because they are
written in one commit) and `queue` (`work/review-queue.json`). The cut editor saves draft 1, then
draft 2; each save starts its own rebuild job with the inputs it saved. A job reads the cut under
the lock, renders without it, takes the lock again, re-checks the cut and commits. A reader (the
review page, the cut page or the publisher's snapshot) takes the lock and reads all four files.
Any process can die after any step, up to two deaths; the kernel then drops its flock, and the
files and the journal stay. Each step is one rename or one lock action.

| Action | Code at the sync commit (`f9df907`) |
|---|---|
| `Acquire` | `review_io.py:121–137` `review_lock()`: flock, then `_recover_promotion()` before the caller runs |
| `Recover` | `review_io.py:47–74` `_recover_journal()`: restore each backup, then clear the journal by one rename (`:74`) |
| `EditorStart`, `Edit` | `cut-page.tsx:118–145` `saveCut()`: `saveDraft` and `loadCutInputs` under `withReviewLock`, then `rebuildClip(id, expected)` → `clips.py rebuild-expected` |
| `JobStart`, `Read` | `clips.py:453–457` `rebuild()`: `cut_inputs` and `require_cut(name, expected, cut)` under the lock |
| `Rendered` | `clips.py:464` `with render_clip(pieces) as staged, review_lock(MEDIA)` |
| `Check` | `clips.py:466` `require_cut(name, cut, cut_inputs(name, drafts))` |
| `Commit` | `clips.py:151–154,475` `finish_render()` → `review_io.py:77–118` `promote_clip()`: `pending.rename(journal)` (`:100`), the pair (`:104–105`), each review file (`:106–107`), `journal.rename(... 'resolved')` (`:113`) |
| `ReaderStart`, `ReaderRead` | `controller.tsx:59,66` the review and cut pages, `publish-snapshot.ts:54`, each in `withReviewLock()` (`app/content/review-io.ts`, which runs `review_io.py`'s `review_lock`) |
| `Die` | `os._exit`, SIGKILL or a crash after any step; `promote_clip`'s `except BaseException` rollback (`:114–116`) is not credited: the model assumes the worst, that the process just stops |

**Left out:** the bytes of a render, ffmpeg failures (they throw before `promote_clip`), fsync and
power loss (`_sync_path` is there for those; the model treats each rename as durable), the
intake preview and approval (`preview_intake`, `approve_intake`: same journal, the private one in
`work/`), `build`, `cut` and `montage` (the same commit, without a draft), and the intake check in
`rebuild()`. One clip and two edits.

**Bounds:** two draft generations, two process deaths. That run covers 4,062 distinct states in
under a second. Four probes confirmed it is not vacuous: TLC reaches a reader running recovery
after a death, a free lock with a half-promoted pair behind a journal, job 1 refused as stale once
generation 2 landed, and generation 2 landing at all.

## Known gap: the CLI without the review server

`Autopublish = FALSE` in the config models `clips.py` run by hand without `REVIEW_AUTOPUBLISH=1`.
There `finish_render()` (`clips.py:155–158`) journals only the pair, then writes the recipe, draft
and check after the journal resolves. A death between them leaves a new video with the old recipe
and draft, and no journal to roll it back; the model breaks `ReadersSeeOldOrNew` in 14 states.
Replayed on a real filesystem: `rebuild('clip')` killed while writing the recipe leaves
`next-video` with the old recipe and the draft still pending.

It is real but small. The always-on review server and every web rebuild run with
`REVIEW_AUTOPUBLISH=1`, which takes the journaled path; only a hand-run `clips.py rebuild`, `build`
or `cut` hits it. The obvious fix (pass `review_updates` there too) is not one line:
`promote_clip` accepts only the canonical index paths, and the test fixtures patch `RECIPES` and
`DRAFTS` elsewhere. It is left open and reported, not fixed here.

## Counterexamples

`Bugs` puts one historical transition back. Each must break its rule. `check.sh` fails if one stops
breaking, because then the model could no longer see that bug. These are TLC's shortest traces.

**`noJournal` breaks `ReadersSeeOldOrNew` (11 states).** This is `promote_clip` before `1c52e14`
(`80d3be4:scripts/clips/clips.py`): it renamed the MP4, then the poster, with a backup only for
an `OSError` on the second rename.
1. The editor saves draft 1, and job 1 reads it, renders and re-checks.
2. Commit replaces the MP4.
3. Job 1 dies before the poster. The kernel drops its lock.
4. A reader takes the lock and reads the new MP4 with the old poster.

The fix publishes the journal before either rename (`review_io.py:100`) and recovers it before
any lock is granted (`:136`). Replayed in
`test_clips.ClipRenderTest.test_next_lock_recovers_pair_after_interrupted_promotion_and_recovery`.

**`pairOnlyJournal` breaks `ReadersSeeOldOrNew` (14 states).** This is `1c52e14` before `1f08df5`:
the journal covered the pair, and the recipe, draft, check and queue were written after it
resolved.
1. Draft 1 is saved, read, rendered and re-checked.
2. Commit: journal, MP4, poster, resolve.
3. Job 1 dies before the index and queue are written.
4. A reader takes the lock: the new pair, the old recipe, draft 1 still pending, the old queue.

The fix passes the index files and the queue as `review_updates`, so the journal backs them up
and recovery restores them (`clips.py:153–154`, `review_io.py:96–97,106–107`). Replayed in
`test_clips.ClipRenderTest.test_active_rebuild_rolls_back_pair_index_and_queue_together`.

**`staleRenderWins` breaks `NoStaleWin` (25 states).** This is `rebuild()` before `744ab48`: after
the render it re-checked only a recipe-based rebuild, never a draft.
1. The editor saves draft 1; job 1 reads it and starts rendering.
2. The editor saves draft 2; job 2 reads it, renders, re-checks and commits generation 2.
3. Job 1 finishes its render, takes the lock and commits generation 1 over it.

The fix is `require_cut(name, cut, cut_inputs(name, drafts))` after the render (`clips.py:466`).
Replayed in `test_clips.CutRebuildTest.test_slow_cli_rebuild_cannot_overwrite_newer_edit` and
`…test_web_rebuild_preserves_draft_when_only_recipe_changes_during_render`.

**`unlockedReader` breaks `ReadersSeeOldOrNew` (10 states).** This is the review page before
`18432e4`, which rendered without `withReviewLock()`.
1. Draft 1 is saved, read, rendered and re-checked.
2. Commit publishes the journal and replaces the MP4.
3. The review page reads without the lock: the new MP4 with the old poster.

It needs no death: recovery runs only for lock-takers, so a reader that skips the lock sees every
commit mid-flight. The fix is `withReviewLock(MEDIA_DIR, …)` around the page (`controller.tsx:59,66`).
Replayed in `app/actions/review-intake.test.ts`, where `/review` must find and recover an
interrupted approval's journal.

## Proof that the replay sees the bugs

Each historical transition was put back in the real code as a scratch change, run on a real
filesystem in a temporary media root, and dropped:

- `noJournal`, without `pending.rename(journal)` and its resolve and rollback in `promote_clip`:
  `test_next_lock_recovers_pair…` fails (`False is not true`: no journal to recover from).
- `pairOnlyJournal`, with `finish_render` promoting the pair alone and then writing the review
  files: `test_active_rebuild_rolls_back…` fails (the lock-taker sees `next-video` with the old index).
- `staleRenderWins`, without the `require_cut` after the render: `test_slow_cli_rebuild…` errors
  (`KeyError: 'clip'`: the stale job deleted the newer draft) and
  `test_web_rebuild_preserves_draft…` fails (`StaleCut not raised`).
- `unlockedReader`, with `/review` rendered outside `withReviewLock`: `review-intake.test.ts`
  fails at `:96` (the page no longer recovers the journal, so the private cut is missing).

With the code restored, all nine Python tests and the route test pass.

## When the model and the code disagree

A failing `current` run prints its shortest trace. Replay it on a real filesystem in a temporary
media root, as `test_clips.py` does: a child process with `os._exit` at the named step, then a
fresh `review_lock` to look. If the code survives, the model is wrong. Fix the model, not the rule.
