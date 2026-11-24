---------------------------- MODULE ReviewRelease ----------------------------
(***************************************************************************)
(* The review publisher's release boundary, scripts/review-release.ts:     *)
(* reconcileReviewRelease and urgentlyRemoveClip. README.md maps every     *)
(* action to the line it stands for.                                       *)
(*                                                                         *)
(* The bug class: treating an old receipt as current proof. A push receipt *)
(* is not a deployment, and a deletion receipt is not proof that an object *)
(* is still gone.                                                          *)
(*                                                                         *)
(* One clip, x, has two R2 objects; the batch size is scaled to one object *)
(* so they are two deletion batches. Every release this publisher makes    *)
(* rejects x (review revisions 1 and 2 differ in other data). A peer, such *)
(* as another machine, can restore x, reject it, or push unrelated work.   *)
(* Each step is one call to Git, Workers Builds or R2, or one save of      *)
(* work/publish.json. Anything else can happen between two steps, and the  *)
(* process can die after any of them.                                      *)
(*                                                                         *)
(* Bugs puts one historical transition back (README.md). With Bugs = {}    *)
(* the model is the code at the sync commit.                               *)
(***************************************************************************)
EXTENDS Naturals, Sequences

CONSTANTS Bugs, MaxPeerPushes, MaxCrashes

Objects == {1, 2}
None == [rev |-> 0, sha |-> 0]
NoFailure == [phase |-> "none", rev |-> 0]
Min(S) == CHOOSE o \in S : \A p \in S : o <= p

VARIABLES
  \* The world outside work/publish.json
  remote,      \* origin/master, oldest first: [id, x: "approved" | "rejected", data: review revision or 0]
  build,       \* Workers Builds result for each commit of remote
  present,     \* R2: whether each object of x exists
  ledger,      \* work/review-publish-media.json: "available" | "pending" | "deleted"
  queue,       \* work/review-queue.json: the latest saved review revision
  acked,       \* the latest revision acknowledged into the queue's base
  \* work/publish.json (PublishState)
  candidate, pushed, live, cleanup, failed,
  \* Locals of one reconciliation turn, lost when the process dies
  pc, q, cache, snapRev, base, cur, attempt, todo, probe,
  \* Bounds, and ghost variables that only the rules read
  nextId, peerPushes, crashes, denied, urgent, restores, seen, armed, lost, claimedGone, overwritten

world == <<remote, build, present, ledger, queue, acked>>
durable == <<candidate, pushed, live, cleanup, failed>>
locals == <<pc, q, cache, snapRev, base, cur, attempt, todo, probe>>
bounds == <<nextId, peerPushes, crashes, denied, urgent>>
ghost == <<restores, seen, armed, lost, claimedGone, overwritten>>
vars == <<world, durable, locals, bounds, ghost>>

Tip == Len(remote)
Contains(t, id) == \E i \in 1..t : remote[i].id = id
Idx(id) == CHOOSE i \in 1..Len(remote) : remote[i].id = id
Approves(i) == remote[i].x = "approved"
\* That commit's public clips and manifest equal this release's (isDeepStrictEqual).
SameData(i, rev) == remote[i].x = "rejected" /\ remote[i].data = rev
\* The turn's fetchMaster() caches its first read.
Cached == IF cache = 0 THEN Tip ELSE cache

Init ==
  /\ remote = <<[id |-> 1, x |-> "approved", data |-> 0]>>
  /\ build = <<"live">>
  /\ present = [o \in Objects |-> TRUE]
  /\ ledger = [o \in Objects |-> "available"]
  /\ queue = 1 /\ acked = 0
  /\ candidate = None /\ pushed = None /\ live = None
  /\ cleanup = 0 /\ failed = NoFailure
  /\ pc = "idle" /\ q = 0 /\ cache = 0 /\ snapRev = 0 /\ base = 0 /\ cur = 0
  /\ attempt = 0 /\ todo = {} /\ probe = 0
  /\ nextId = 2 /\ peerPushes = 0 /\ crashes = 0 /\ denied = 0 /\ urgent = 0
  /\ restores = 0 /\ seen = 0 /\ armed = 0 /\ lost = 0 /\ claimedGone = FALSE /\ overwritten = FALSE

ClearPushed == pushed' = None

-----------------------------------------------------------------------------
(* reconcileReviewRelease: one turn, started by scripts/publish-review.ts. *)

Start ==
  /\ pc = "idle"
  /\ pc' = IF candidate.rev # 0 THEN "recover" ELSE "route"
  /\ q' = queue /\ cache' = 0 /\ attempt' = 0
  /\ UNCHANGED <<world, durable, snapRev, base, cur, todo, probe, bounds, ghost>>

\* if (state.candidate): the push may have reached Git before the process died.
RecoverPush ==
  /\ pc = "recover"
  /\ cache' = Tip /\ pc' = "route"
  /\ IF ~Contains(Tip, candidate.sha)
     THEN /\ candidate' = None
          /\ UNCHANGED <<pushed, live, cleanup, failed, claimedGone>>
     ELSE IF "receiptAsLive" \in Bugs
     \* The legacy publisher: no commits ahead of origin, so "already live".
     THEN /\ live' = candidate /\ cleanup' = candidate.rev /\ claimedGone' = FALSE
          /\ candidate' = None /\ failed' = NoFailure
          /\ UNCHANGED pushed
     \* pushed(state.candidate)
     ELSE /\ pushed' = candidate
          /\ candidate' = None /\ failed' = NoFailure
          /\ UNCHANGED <<live, cleanup, claimedGone>>
  /\ UNCHANGED <<world, q, snapRev, base, cur, attempt, todo, probe, bounds, restores, seen, armed, lost, overwritten>>

\* The branches on newerThanFailedDeployment, newerThanCleanup and live.revision.
Route ==
  /\ pc = "route"
  /\ LET newer == failed.phase = "deploy" /\ pushed.rev # 0 /\ q # pushed.rev IN
     IF pushed.rev # 0 /\ ~newer
     THEN pc' = "confirm" /\ UNCHANGED pushed
     ELSE /\ IF newer /\ "retryFailedDeploy" \notin Bugs THEN ClearPushed ELSE UNCHANGED pushed
          /\ pc' = IF cleanup # 0 /\ q = cleanup THEN "clean"
                   ELSE IF live.rev = q THEN "idle"
                   ELSE "prepare"
  /\ UNCHANGED <<world, candidate, live, cleanup, failed, q, cache, snapRev, base, cur, attempt, todo, probe, bounds, ghost>>

\* confirm(): only a live deploy sets state.live and authorizes cleanup.
MarkLive(sha) ==
  /\ live' = [rev |-> pushed.rev, sha |-> sha]
  /\ cleanup' = pushed.rev /\ claimedGone' = FALSE
  /\ ClearPushed /\ failed' = NoFailure
  /\ pc' = "clean" /\ UNCHANGED overwritten

DeployFailed ==
  /\ failed' = [phase |-> "deploy", rev |-> pushed.rev]
  \* The failure that a newer revision's own push failure left is overwritten.
  /\ overwritten' = (overwritten \/ (failed.phase = "push" /\ failed.rev > pushed.rev))
  /\ pc' = "idle" /\ UNCHANGED <<pushed, live, cleanup, claimedGone>>

\* Check again in 15 seconds, or after 15 minutes "Cloudflare did not confirm".
NotYet ==
  \/ failed' = NoFailure /\ pc' = "idle" /\ UNCHANGED <<pushed, live, cleanup, claimedGone, overwritten>>
  \/ DeployFailed

Confirm ==
  /\ pc = "confirm"
  /\ acked' = IF pushed.rev > acked THEN pushed.rev ELSE acked
  /\ LET b == build[Idx(pushed.sha)] IN
       CASE b = "live" -> MarkLive(pushed.sha) /\ UNCHANGED cache
         [] b = "failed" -> DeployFailed /\ UNCHANGED cache
         [] b = "pending" -> NotYet /\ UNCHANGED cache
         [] b = "superseded" ->
              \* A newer deployment is proof only if it contains this commit and the same public data.
              LET t == Cached IN
              /\ cache' = t
              /\ IF remote[t].id # pushed.sha /\ Contains(t, pushed.sha) /\ SameData(t, pushed.rev)
                 THEN CASE build[t] = "live" -> MarkLive(remote[t].id)
                        [] build[t] = "failed" -> DeployFailed
                        [] OTHER -> NotYet
                 ELSE NotYet
  /\ UNCHANGED <<remote, build, present, ledger, queue, candidate, q, snapRev, base, cur, attempt, todo, probe,
                 bounds, restores, seen, armed, lost>>

-----------------------------------------------------------------------------
(* clean(): one deletion batch for each fresh authorization.               *)

\* removeRejected(..., { oneBatch: true }) marks the batch pending, then removes it.
Authorize ==
  LET pend == {o \in Objects : ledger[o] # "deleted"} IN
  /\ armed' = restores
  /\ IF pend = {}
     THEN /\ cleanup' = 0 /\ claimedGone' = TRUE /\ failed' = NoFailure /\ pc' = "idle"
          /\ UNCHANGED <<ledger, todo>>
     ELSE /\ ledger' = [ledger EXCEPT ![Min(pend)] = "pending"]
          /\ todo' = pend /\ pc' = "remove"
          /\ UNCHANGED <<cleanup, claimedGone, failed>>

Clean ==
  /\ pc = "clean"
  /\ IF Approves(Tip)
     \* x is in use at the fresh tip: nothing to remove, and the record is done.
     THEN /\ cleanup' = 0 /\ failed' = NoFailure /\ pc' = "idle"
          /\ UNCHANGED <<ledger, todo, probe, claimedGone, armed>>
     ELSE IF remote[Tip].id # live.sha
     THEN /\ probe' = Tip /\ pc' = "cleanDeploy"
          /\ UNCHANGED <<ledger, todo, cleanup, failed, claimedGone, armed>>
     ELSE Authorize /\ UNCHANGED probe
  /\ UNCHANGED <<remote, build, present, queue, acked, candidate, pushed, live, q, cache, snapRev, base, cur, attempt,
                 bounds, restores, seen, lost, overwritten>>

\* Trust a newer exclusion only if that exact tip deployed and is still the tip.
CleanDeploy ==
  /\ pc = "cleanDeploy"
  /\ IF build[probe] = "live" /\ Tip = probe
     THEN Authorize
     ELSE /\ failed' = NoFailure /\ pc' = "idle"
          /\ UNCHANGED <<ledger, todo, cleanup, claimedGone, armed>>
  /\ UNCHANGED <<remote, build, present, queue, acked, candidate, pushed, live, q, cache, snapRev, base, cur, attempt, probe,
                 bounds, restores, seen, lost, overwritten>>

Remove ==
  /\ pc = "remove"
  /\ LET o == Min(todo)
         rest == todo \ {o}
     IN /\ present' = [present EXCEPT ![o] = FALSE]
        /\ lost' = IF Approves(Tip) THEN lost + 1 ELSE lost
        /\ IF rest = {}
           THEN /\ ledger' = [ledger EXCEPT ![o] = "deleted"]
                \* A restore after the authorization is the one batch it may lose.
                /\ cleanup' = 0 /\ claimedGone' = (armed = restores) /\ failed' = NoFailure /\ pc' = "idle"
                /\ UNCHANGED todo
           ELSE IF "oneAuthAllBatches" \in Bugs
           \* Every batch ran under the one authorization.
           THEN /\ ledger' = [ledger EXCEPT ![o] = "deleted", ![Min(rest)] = "pending"]
                /\ todo' = rest
                /\ UNCHANGED <<cleanup, claimedGone, failed, pc>>
           \* if (more): check again in a second, from a fresh tip.
           ELSE /\ ledger' = [ledger EXCEPT ![o] = "deleted"]
                /\ failed' = NoFailure /\ pc' = "idle"
                /\ UNCHANGED <<todo, cleanup, claimedGone>>
  /\ UNCHANGED <<remote, build, queue, acked, candidate, pushed, live, q, cache, snapRev, base, cur, attempt, probe,
                 bounds, restores, seen, armed, overwritten>>

-----------------------------------------------------------------------------
(* Capture, upload and push a snapshot of the latest review revision.       *)

Prepare ==
  /\ pc = "prepare"
  /\ LET t == Cached IN
       /\ cache' = t /\ base' = t /\ cur' = t
       \* media.rememberManifest(prior): a current public reference re-arms a deleted object.
       /\ ledger' = IF Approves(t) /\ "tombstoneHidesRestore" \notin Bugs
                    THEN [o \in Objects |-> IF ledger[o] = "deleted" THEN "pending" ELSE ledger[o]]
                    ELSE ledger
       /\ seen' = IF Approves(t) THEN restores ELSE seen
  /\ snapRev' = queue  \* capturePublishSnapshot reads the latest saved revision
  /\ attempt' = 0 /\ pc' = "upload"
  /\ UNCHANGED <<remote, build, present, queue, acked, durable, q, todo, probe, bounds, restores, armed, lost, claimedGone, overwritten>>

\* uploadPublishSnapshot. This release rejects x, so it puts none of x's objects.
Upload ==
  /\ pc = "upload"
  /\ \/ pc' = "push" /\ UNCHANGED failed
     \/ failed' = [phase |-> "prepare", rev |-> snapRev] /\ pc' = "idle"
  /\ UNCHANGED <<world, candidate, pushed, live, cleanup, q, cache, snapRev, base, cur, attempt, todo, probe, bounds, ghost>>

Pushed(rev, sha) ==
  /\ pushed' = [rev |-> rev, sha |-> sha]
  /\ candidate' = None /\ failed' = NoFailure /\ pc' = "idle"

Push ==
  /\ pc = "push"
  /\ IF SameData(cur, snapRev)
     \* A no-op has no push lease: verify the tip.
     THEN /\ IF Tip = cur
             THEN Pushed(snapRev, remote[cur].id) /\ UNCHANGED cur
             ELSE cur' = Tip /\ pc' = "moved" /\ UNCHANGED <<candidate, pushed, failed>>
          /\ UNCHANGED nextId
     \* state.candidate is saved before git.pushCandidate.
     ELSE /\ candidate' = [rev |-> snapRev, sha |-> nextId]
          /\ nextId' = nextId + 1 /\ pc' = "pushing"
          /\ UNCHANGED <<pushed, failed, cur>>
  /\ UNCHANGED <<world, live, cleanup, q, cache, snapRev, base, attempt, todo, probe,
                 peerPushes, crashes, denied, urgent, ghost>>

\* git.pushCandidate(current.sha, sha) leases the tip this snapshot was made on.
Pushing ==
  /\ pc = "pushing"
  /\ \/ /\ Tip = cur
        /\ remote' = Append(remote, [id |-> candidate.sha, x |-> "rejected", data |-> snapRev])
        /\ build' = Append(build, "pending")
        /\ pc' = "pushAck" /\ UNCHANGED <<failed, denied>>
     \/ /\ Tip # cur  \* 'moved'
        /\ pc' = "refetch" /\ UNCHANGED <<remote, build, failed, denied>>
     \/ /\ denied < 1  \* a terminal error, such as denied authentication
        /\ denied' = denied + 1 /\ failed' = [phase |-> "push", rev |-> snapRev] /\ pc' = "idle"
        /\ UNCHANGED <<remote, build>>
  /\ UNCHANGED <<present, ledger, queue, acked, candidate, pushed, live, cleanup, q, cache, snapRev, base, cur, attempt,
                 todo, probe, nextId, peerPushes, crashes, urgent, ghost>>

\* Git accepted the push. Its answer can still be lost, and the turn throws before pushed().
PushAck ==
  /\ pc = "pushAck"
  /\ \/ Pushed(candidate.rev, candidate.sha)
     \/ failed' = [phase |-> "push", rev |-> snapRev] /\ pc' = "idle" /\ UNCHANGED <<candidate, pushed>>
  /\ UNCHANGED <<world, live, cleanup, q, cache, snapRev, base, cur, attempt, todo, probe, bounds, ghost>>

Refetch ==
  /\ pc = "refetch"
  /\ cur' = Tip
  /\ IF Contains(Tip, candidate.sha)
     THEN Pushed(candidate.rev, candidate.sha)
     ELSE candidate' = None /\ pc' = "moved" /\ UNCHANGED <<pushed, failed>>
  /\ UNCHANGED <<world, live, cleanup, q, cache, snapRev, base, attempt, todo, probe, bounds, ghost>>

\* "Master moved while publishing": one more try on the new tip if its public data is unchanged.
Moved ==
  /\ pc = "moved"
  /\ IF remote[cur].x # remote[base].x \/ remote[cur].data # remote[base].data \/ attempt = 1
     THEN failed' = [phase |-> "push", rev |-> snapRev] /\ pc' = "idle" /\ UNCHANGED attempt
     ELSE attempt' = 1 /\ pc' = "push" /\ UNCHANGED failed
  /\ UNCHANGED <<world, candidate, pushed, live, cleanup, q, cache, snapRev, base, cur, todo, probe, bounds, ghost>>

-----------------------------------------------------------------------------
(* urgentlyRemoveClip: a separate command under the same publish lock.      *)

Urgent ==
  /\ pc = "idle" /\ urgent < 1
  \* A pending rejection in the saved review, or a rejection at the freshly fetched tip.
  /\ acked < queue \/ ~Approves(Tip)
  /\ present' = [o \in Objects |-> FALSE]
  /\ ledger' = [o \in Objects |-> "deleted"]  \* forceKnown: also over an old tombstone
  /\ urgent' = urgent + 1
  /\ UNCHANGED <<remote, build, queue, acked, durable, locals, nextId, peerPushes, crashes, denied, ghost>>

-----------------------------------------------------------------------------
(* Everyone else.                                                          *)

ReviewSaves ==
  /\ queue = 1 /\ queue' = 2
  /\ UNCHANGED <<remote, build, present, ledger, acked, durable, locals, bounds, ghost>>

WorkersBuild(i) ==
  /\ build[i] = "pending"
  /\ \/ build' = [build EXCEPT ![i] = "live"]
     \/ build' = [build EXCEPT ![i] = "failed"]
     \/ i < Tip /\ build' = [build EXCEPT ![i] = "superseded"]
  /\ UNCHANGED <<remote, present, ledger, queue, acked, durable, locals, bounds, ghost>>

PeerPush(x) ==
  /\ peerPushes < MaxPeerPushes
  /\ remote' = Append(remote, [id |-> nextId, x |-> x, data |-> remote[Tip].data])
  /\ build' = Append(build, "pending")
  /\ nextId' = nextId + 1 /\ peerPushes' = peerPushes + 1
  /\ UNCHANGED <<ledger, queue, acked, durable, locals, crashes, denied, urgent, seen, armed, overwritten>>

\* Another uploader puts x's exact immutable objects back, then pushes x approved.
PeerRestores ==
  /\ PeerPush("approved")
  /\ present' = [o \in Objects |-> TRUE]
  /\ restores' = restores + 1 /\ lost' = 0 /\ claimedGone' = FALSE

PeerRejects == PeerPush("rejected") /\ UNCHANGED <<present, restores, lost, claimedGone>>

PeerPushesUnrelated == PeerPush(remote[Tip].x) /\ UNCHANGED <<present, restores, lost, claimedGone>>

ProcessDies ==
  /\ pc # "idle" /\ crashes < MaxCrashes
  /\ pc' = "idle" /\ crashes' = crashes + 1
  /\ UNCHANGED <<world, durable, q, cache, snapRev, base, cur, attempt, todo, probe,
                 nextId, peerPushes, denied, urgent, ghost>>

Next ==
  \/ Start \/ RecoverPush \/ Route \/ Confirm
  \/ Clean \/ CleanDeploy \/ Remove
  \/ Prepare \/ Upload \/ Push \/ Pushing \/ PushAck \/ Refetch \/ Moved
  \/ Urgent \/ ReviewSaves \/ \E i \in 1..Len(build) : WorkersBuild(i)
  \/ PeerRestores \/ PeerRejects \/ PeerPushesUnrelated \/ ProcessDies

Spec == Init /\ [][Next]_vars

\* Every turn sets its locals before reading them, so between turns they are noise.
View == <<world, durable, pc, IF pc = "idle" THEN <<>> ELSE locals, bounds, ghost>>

-----------------------------------------------------------------------------
(* Rules                                                                   *)

\* A push receipt is not a deployment: state.live names a commit that Workers
\* Builds deployed, with this release's public data.
LiveMeansDeployed ==
  live.rev # 0 => LET i == Idx(live.sha) IN build[i] = "live" /\ SameData(i, live.rev)

\* An old deploy failure never replaces the newer revision's own push failure
\* (which would make the two alternate on every automatic retry).
NewerFailureStands == ~overwritten

\* A restore loses at most the one deletion batch already authorized when it landed.
RestoreLosesAtMostOneBatch == lost <= 1

\* A deletion receipt is not proof that the object is still gone. When cleanup
\* reports done, and no restore landed since it was authorized, x is gone from
\* R2, provided this publisher has read a tip that references x since the last
\* restore (it cannot learn of a restore it never saw).
CleanupDoneMeansGone ==
  (claimedGone /\ seen = restores) => \A o \in Objects : ~present[o]

PushedIsOnRemote == pushed.rev # 0 => Contains(Tip, pushed.sha)
=============================================================================
