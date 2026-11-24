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
(* rejects x. Review revision 2 can carry the same public data as 1 or     *)
(* other data. A peer, such as another machine, can restore x, reject it,  *)
(* or push unrelated work. Each step is one call to Git, Workers Builds or *)
(* R2, or one save of work/publish.json. Anything else can happen between  *)
(* two steps, and the process can die after any of them.                   *)
(*                                                                         *)
(* Bugs puts one historical transition back (README.md). With Bugs = {}    *)
(* the model is the code at the sync commit.                               *)
(***************************************************************************)
EXTENDS Naturals, Sequences

CONSTANTS
  Bugs,
  MaxPeerPushes, MaxCrashes, MaxDenied, MaxUrgent,
  PeerUploadInFlight  \* TRUE: a peer's upload and its approving push are separate steps

Objects == {1, 2}
None == [rev |-> 0, sha |-> 0]
NoFailure == [phase |-> "none", rev |-> 0]
Min(S) == CHOOSE o \in S : \A p \in S : o <= p

VARIABLES
  \* The world outside work/publish.json
  remote,      \* origin/master, oldest first: [id, x: "approved" | "rejected", data: public data version]
  build,       \* Workers Builds result for each commit of remote
  present,     \* R2: whether each object of x exists
  ledger,      \* work/review-publish-media.json: "available" | "pending" | "deleted"
  queue,       \* work/review-queue.json: the latest saved review revision
  same2,       \* revision 2 publishes the same clips and manifest as revision 1
  acked,       \* the latest revision acknowledged into the queue's base
  peerUp,      \* a peer has put x's objects back but not pushed its approval yet
  \* work/publish.json (PublishState)
  candidate, pushed, live, cleanup, failed,
  \* Locals of one reconciliation turn, lost when the process dies
  pc, q, cache, snapRev, base, cur, attempt, todo, probe,
  upc,         \* urgentlyRemoveClip: "none", or "authorized" between its fetch and its delete
  \* Bounds, and ghost variables that only the rules read
  nextId, peerPushes, crashes, denied, urgent, restores, seen, armed, lost, claimedGone, overwritten

world == <<remote, build, present, ledger, queue, same2, acked, peerUp>>
durable == <<candidate, pushed, live, cleanup, failed>>
locals == <<pc, q, cache, snapRev, base, cur, attempt, todo, probe>>
bounds == <<nextId, peerPushes, crashes, denied, urgent>>
ghost == <<restores, seen, armed, lost, claimedGone, overwritten>>
vars == <<world, durable, locals, upc, bounds, ghost>>

Tip == Len(remote)
Contains(t, id) == \E i \in 1..t : remote[i].id = id
Idx(id) == CHOOSE i \in 1..Len(remote) : remote[i].id = id
Approves(i) == remote[i].x = "approved"
DataOf(rev) == IF rev = 2 /\ same2 THEN 1 ELSE rev
\* That commit's public clips and manifest equal this release's (isDeepStrictEqual).
SameData(i, rev) == remote[i].x = "rejected" /\ remote[i].data = DataOf(rev)
\* The turn's fetchMaster() caches its first read.
Cached == IF cache = 0 THEN Tip ELSE cache
\* Ghost: the publisher read a tip that references x, so it knows of the latest restore.
Saw(t) == seen' = IF Approves(t) THEN restores ELSE seen

\* media.rememberManifest(manifest): a current public reference re-arms a deleted object.
Rearm(t) ==
  ledger' = IF Approves(t) THEN [o \in Objects |-> IF ledger[o] = "deleted" THEN "pending" ELSE ledger[o]]
            ELSE ledger

RearmUnlessOld(t) == IF "tombstoneHidesRestore" \in Bugs THEN UNCHANGED ledger ELSE Rearm(t)

\* fetchTip(): every read of master re-arms. Before #34719 only Prepare did.
Look(t) == Saw(t) /\ IF "rearmOnlyOnPrepare" \in Bugs THEN UNCHANGED ledger ELSE RearmUnlessOld(t)

Init ==
  /\ remote = <<[id |-> 1, x |-> "approved", data |-> 0]>>
  /\ build = <<"live">>
  /\ present = [o \in Objects |-> TRUE]
  /\ ledger = [o \in Objects |-> "available"]
  /\ queue = 1 /\ same2 = FALSE /\ acked = 0 /\ peerUp = FALSE
  /\ candidate = None /\ pushed = None /\ live = None
  /\ cleanup = 0 /\ failed = NoFailure
  /\ pc = "idle" /\ q = 0 /\ cache = 0 /\ snapRev = 0 /\ base = 0 /\ cur = 0
  /\ attempt = 0 /\ todo = {} /\ probe = 0 /\ upc = "none"
  /\ nextId = 2 /\ peerPushes = 0 /\ crashes = 0 /\ denied = 0 /\ urgent = 0
  /\ restores = 0 /\ seen = 0 /\ armed = 0 /\ lost = 0 /\ claimedGone = FALSE /\ overwritten = FALSE

ClearPushed == pushed' = None

-----------------------------------------------------------------------------
(* reconcileReviewRelease: one turn, started by scripts/publish-review.ts. *)

Start ==
  /\ pc = "idle" /\ upc = "none"  \* one process at a time holds the publish lock
  /\ pc' = IF candidate.rev # 0 THEN "recover" ELSE "route"
  /\ q' = queue /\ cache' = 0 /\ attempt' = 0
  /\ UNCHANGED <<world, durable, snapRev, base, cur, todo, probe, upc, bounds, ghost>>

\* if (state.candidate): the push may have reached Git before the process died.
RecoverPush ==
  /\ pc = "recover"
  /\ cache' = Tip /\ Look(Tip) /\ pc' = "route"
  /\ IF Contains(Tip, candidate.sha)
     THEN pushed' = candidate  \* pushed(state.candidate)
     ELSE UNCHANGED pushed
  /\ candidate' = None
  /\ failed' = IF Contains(Tip, candidate.sha) THEN NoFailure ELSE failed
  /\ UNCHANGED <<remote, build, present, queue, same2, acked, peerUp, live, cleanup, q, snapRev, base, cur,
                 attempt, todo, probe, upc, bounds, restores, armed, lost, claimedGone, overwritten>>

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
  /\ UNCHANGED <<world, candidate, live, cleanup, failed, q, cache, snapRev, base, cur, attempt, todo, probe, upc,
                 bounds, ghost>>

\* confirm(): only a live deploy sets state.live and authorizes cleanup.
MarkLive(rev, sha) ==
  /\ live' = [rev |-> rev, sha |-> sha]
  /\ cleanup' = rev /\ claimedGone' = FALSE
  /\ ClearPushed /\ failed' = NoFailure
  /\ UNCHANGED overwritten

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
       CASE b = "live" -> MarkLive(pushed.rev, pushed.sha) /\ pc' = "clean" /\ UNCHANGED <<cache, seen, ledger>>
         [] b = "failed" -> DeployFailed /\ UNCHANGED <<cache, seen, ledger>>
         [] b = "pending" -> NotYet /\ UNCHANGED <<cache, seen, ledger>>
         [] b = "superseded" ->
              \* A newer deployment is proof only if it contains this commit and the same public data.
              LET t == Cached IN
              /\ cache' = t /\ IF cache = 0 THEN Look(t) ELSE UNCHANGED <<seen, ledger>>
              /\ IF remote[t].id # pushed.sha /\ Contains(t, pushed.sha) /\ SameData(t, pushed.rev)
                 THEN CASE build[t] = "live" -> MarkLive(pushed.rev, remote[t].id) /\ pc' = "clean"
                        [] build[t] = "failed" -> DeployFailed
                        [] OTHER -> NotYet
                 ELSE NotYet
  /\ UNCHANGED <<remote, build, present, queue, same2, peerUp, candidate, q, snapRev, base, cur, attempt,
                 todo, probe, upc, bounds, restores, armed, lost>>

-----------------------------------------------------------------------------
(* clean(): one deletion batch for each fresh authorization.               *)

\* removeRejected(..., { oneBatch: true }) marks the batch pending, then removes it.
Authorize(lg) ==
  LET pend == {o \in Objects : lg[o] # "deleted"} IN
  /\ armed' = restores
  /\ IF pend = {}
     THEN /\ cleanup' = 0 /\ claimedGone' = TRUE /\ failed' = NoFailure /\ pc' = "idle"
          /\ ledger' = lg /\ UNCHANGED todo
     ELSE /\ ledger' = [lg EXCEPT ![Min(pend)] = "pending"]
          /\ todo' = pend /\ pc' = "remove"
          /\ UNCHANGED <<cleanup, claimedGone, failed>>

Clean ==
  /\ pc = "clean"
  /\ IF Approves(Tip)
     \* x is in use at the fresh tip: nothing to remove, and the record is done.
     THEN /\ Look(Tip)
          /\ cleanup' = 0 /\ failed' = NoFailure /\ pc' = "idle"
          /\ UNCHANGED <<todo, probe, claimedGone, armed>>
     ELSE IF remote[Tip].id # live.sha
     THEN /\ probe' = Tip /\ pc' = "cleanDeploy"
          /\ UNCHANGED <<ledger, seen, todo, cleanup, failed, claimedGone, armed>>
     ELSE Authorize(ledger) /\ UNCHANGED <<probe, seen>>
  /\ UNCHANGED <<remote, build, present, queue, same2, acked, peerUp, candidate, pushed, live, q, cache, snapRev,
                 base, cur, attempt, upc, bounds, restores, lost, overwritten>>

\* Trust a newer exclusion only if that exact tip deployed and is still the tip.
CleanDeploy ==
  /\ pc = "cleanDeploy"
  /\ IF build[probe] = "live" /\ Tip = probe
     THEN Authorize(ledger) /\ UNCHANGED seen  \* this tip rejects x: nothing to re-arm
     ELSE /\ failed' = NoFailure /\ pc' = "idle"
          /\ IF build[probe] = "live" THEN Look(Tip) ELSE UNCHANGED <<ledger, seen>>
          /\ UNCHANGED <<todo, cleanup, claimedGone, armed>>
  /\ UNCHANGED <<remote, build, present, queue, same2, acked, peerUp, candidate, pushed, live, q, cache, snapRev,
                 base, cur, attempt, probe, upc, bounds, restores, lost, overwritten>>

Remove ==
  /\ pc = "remove"
  /\ LET o == Min(todo)
         rest == todo \ {o}
     IN /\ present' = [present EXCEPT ![o] = FALSE]
        \* A restore, pushed or still uploading, loses this object.
        /\ lost' = IF Approves(Tip) \/ peerUp THEN lost + 1 ELSE lost
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
  /\ UNCHANGED <<remote, build, queue, same2, acked, peerUp, candidate, pushed, live, q, cache, snapRev, base, cur,
                 attempt, probe, upc, bounds, restores, seen, armed, overwritten>>

-----------------------------------------------------------------------------
(* Capture, upload and push a snapshot of the latest review revision.       *)

Prepare ==
  /\ pc = "prepare"
  /\ LET t == Cached IN
       /\ cache' = t /\ base' = t /\ cur' = t
       /\ IF "rearmOnlyOnPrepare" \in Bugs THEN Saw(t) /\ RearmUnlessOld(t)
          \* fetchMaster() returns the turn's cached read, which already re-armed.
          ELSE IF cache # 0 THEN UNCHANGED <<ledger, seen>>
          ELSE Look(t)
  /\ snapRev' = queue  \* capturePublishSnapshot reads the latest saved revision
  /\ attempt' = 0 /\ pc' = "upload"
  /\ UNCHANGED <<remote, build, present, queue, same2, acked, peerUp, durable, q, todo, probe, upc, bounds,
                 restores, armed, lost, claimedGone, overwritten>>

\* uploadPublishSnapshot. This release rejects x, so it puts none of x's objects.
Upload ==
  /\ pc = "upload"
  /\ \/ pc' = "push" /\ UNCHANGED failed
     \/ failed' = [phase |-> "prepare", rev |-> snapRev] /\ pc' = "idle"
  /\ UNCHANGED <<world, candidate, pushed, live, cleanup, q, cache, snapRev, base, cur, attempt, todo, probe, upc,
                 bounds, ghost>>

Pushed(rev, sha) ==
  /\ pushed' = [rev |-> rev, sha |-> sha]
  /\ candidate' = None /\ failed' = NoFailure /\ pc' = "idle"

Push ==
  /\ pc = "push"
  /\ IF SameData(cur, snapRev)
     \* A no-op has no push lease: verify the tip.
     THEN /\ Look(Tip)
          /\ IF Tip # cur
             THEN cur' = Tip /\ pc' = "moved" /\ UNCHANGED <<candidate, pushed, live, cleanup, failed, claimedGone>>
             ELSE IF "receiptAsLive" \in Bugs
             \* The legacy publisher: zero commits ahead of origin, so "already live".
             THEN MarkLive(snapRev, remote[cur].id) /\ candidate' = None /\ pc' = "idle" /\ UNCHANGED cur
             ELSE Pushed(snapRev, remote[cur].id) /\ UNCHANGED <<cur, live, cleanup, claimedGone>>
          /\ UNCHANGED nextId
     \* state.candidate is saved before git.pushCandidate.
     ELSE /\ candidate' = [rev |-> snapRev, sha |-> nextId]
          /\ nextId' = nextId + 1 /\ pc' = "pushing"
          /\ UNCHANGED <<pushed, live, cleanup, failed, cur, seen, claimedGone, ledger>>
  /\ UNCHANGED <<remote, build, present, queue, same2, acked, peerUp, q, cache, snapRev, base, attempt, todo, probe, upc,
                 peerPushes, crashes, denied, urgent, restores, armed, lost, overwritten>>

\* git.pushCandidate(current.sha, sha) leases the tip this snapshot was made on.
Pushing ==
  /\ pc = "pushing"
  /\ \/ /\ Tip = cur
        /\ remote' = Append(remote, [id |-> candidate.sha, x |-> "rejected", data |-> DataOf(snapRev)])
        /\ build' = Append(build, "pending")
        /\ pc' = "pushAck" /\ UNCHANGED <<failed, denied>>
     \/ /\ Tip # cur  \* 'moved'
        /\ pc' = "refetch" /\ UNCHANGED <<remote, build, failed, denied>>
     \/ /\ denied < MaxDenied  \* a terminal error, such as denied authentication
        /\ denied' = denied + 1 /\ failed' = [phase |-> "push", rev |-> snapRev] /\ pc' = "idle"
        /\ UNCHANGED <<remote, build>>
  /\ UNCHANGED <<present, ledger, queue, same2, acked, peerUp, candidate, pushed, live, cleanup, q, cache, snapRev,
                 base, cur, attempt, todo, probe, upc, nextId, peerPushes, crashes, urgent, ghost>>

\* Git accepted the push. Its answer can still be lost, and the turn throws before pushed().
PushAck ==
  /\ pc = "pushAck"
  /\ \/ Pushed(candidate.rev, candidate.sha)
     \/ failed' = [phase |-> "push", rev |-> snapRev] /\ pc' = "idle" /\ UNCHANGED <<candidate, pushed>>
  /\ UNCHANGED <<world, live, cleanup, q, cache, snapRev, base, cur, attempt, todo, probe, upc, bounds, ghost>>

Refetch ==
  /\ pc = "refetch"
  /\ cur' = Tip /\ Look(Tip)
  /\ IF Contains(Tip, candidate.sha)
     THEN Pushed(candidate.rev, candidate.sha)
     ELSE candidate' = None /\ pc' = "moved" /\ UNCHANGED <<pushed, failed>>
  /\ UNCHANGED <<remote, build, present, queue, same2, acked, peerUp, live, cleanup, q, cache, snapRev, base,
                 attempt, todo, probe, upc, bounds, restores, armed, lost, claimedGone, overwritten>>

\* "Master moved while publishing": one more try on the new tip if its public data is unchanged.
Moved ==
  /\ pc = "moved"
  /\ IF remote[cur].x # remote[base].x \/ remote[cur].data # remote[base].data \/ attempt = 1
     THEN failed' = [phase |-> "push", rev |-> snapRev] /\ pc' = "idle" /\ UNCHANGED attempt
     ELSE attempt' = 1 /\ pc' = "push" /\ UNCHANGED failed
  /\ UNCHANGED <<world, candidate, pushed, live, cleanup, q, cache, snapRev, base, cur, todo, probe, upc,
                 bounds, ghost>>

-----------------------------------------------------------------------------
(* urgentlyRemoveClip: a separate command under the same publish lock.      *)

\* Authority: a pending rejection (the saved review rejects x and its base does not; every
\* published release rejects x, so the base rejects x once one is acknowledged), or a
\* rejection at the freshly fetched tip.
UrgentCheck ==
  /\ pc = "idle" /\ upc = "none" /\ urgent < MaxUrgent
  /\ acked = 0 \/ ~Approves(Tip)
  /\ upc' = "authorized" /\ urgent' = urgent + 1 /\ Saw(Tip)
  /\ UNCHANGED <<world, durable, locals, nextId, peerPushes, crashes, denied,
                 restores, armed, lost, claimedGone, overwritten>>

UrgentRemove ==
  /\ upc = "authorized"
  /\ present' = [o \in Objects |-> FALSE]
  /\ ledger' = [o \in Objects |-> "deleted"]  \* forceKnown: also over an old tombstone
  /\ upc' = "none"
  /\ UNCHANGED <<remote, build, queue, same2, acked, peerUp, durable, locals, bounds, ghost>>

-----------------------------------------------------------------------------
(* Everyone else.                                                          *)

ReviewSaves ==
  /\ queue = 1 /\ queue' = 2
  /\ same2' \in BOOLEAN
  /\ UNCHANGED <<remote, build, present, ledger, acked, peerUp, durable, locals, upc, bounds, ghost>>

WorkersBuild(i) ==
  /\ build[i] = "pending"
  /\ \/ build' = [build EXCEPT ![i] = "live"]
     \/ build' = [build EXCEPT ![i] = "failed"]
     \/ i < Tip /\ build' = [build EXCEPT ![i] = "superseded"]
  /\ UNCHANGED <<remote, present, ledger, queue, same2, acked, peerUp, durable, locals, upc, bounds, ghost>>

PeerPush(x) ==
  /\ peerPushes < MaxPeerPushes
  /\ remote' = Append(remote, [id |-> nextId, x |-> x, data |-> remote[Tip].data])
  /\ build' = Append(build, "pending")
  /\ nextId' = nextId + 1 /\ peerPushes' = peerPushes + 1
  /\ UNCHANGED <<ledger, queue, same2, acked, durable, locals, upc, crashes, denied, urgent, seen, armed, overwritten>>

\* Another uploader puts x's exact immutable objects back. Then it pushes x approved.
PeerUploads ==
  /\ PeerUploadInFlight /\ ~peerUp /\ peerPushes < MaxPeerPushes
  /\ present' = [o \in Objects |-> TRUE] /\ peerUp' = TRUE /\ lost' = 0
  /\ restores' = restores + 1 /\ claimedGone' = FALSE  \* the restore begins here
  /\ UNCHANGED <<remote, build, ledger, queue, same2, acked, durable, locals, upc, bounds,
                 seen, armed, overwritten>>

PeerRestores ==
  /\ PeerPush("approved")
  /\ IF PeerUploadInFlight
     THEN peerUp /\ peerUp' = FALSE /\ UNCHANGED <<present, lost, restores, claimedGone>>
     ELSE /\ present' = [o \in Objects |-> TRUE] /\ lost' = 0 /\ UNCHANGED peerUp
          /\ restores' = restores + 1 /\ claimedGone' = FALSE

PeerRejects == PeerPush("rejected") /\ UNCHANGED <<present, peerUp, restores, lost, claimedGone>>

PeerPushesUnrelated == PeerPush(remote[Tip].x) /\ UNCHANGED <<present, peerUp, restores, lost, claimedGone>>

ProcessDies ==
  /\ pc # "idle" \/ upc # "none"
  /\ crashes < MaxCrashes
  /\ pc' = "idle" /\ upc' = "none" /\ crashes' = crashes + 1
  /\ UNCHANGED <<world, durable, q, cache, snapRev, base, cur, attempt, todo, probe,
                 nextId, peerPushes, denied, urgent, ghost>>

Next ==
  \/ Start \/ RecoverPush \/ Route \/ Confirm
  \/ Clean \/ CleanDeploy \/ Remove
  \/ Prepare \/ Upload \/ Push \/ Pushing \/ PushAck \/ Refetch \/ Moved
  \/ UrgentCheck \/ UrgentRemove \/ ReviewSaves \/ \E i \in 1..Len(build) : WorkersBuild(i)
  \/ PeerUploads \/ PeerRestores \/ PeerRejects \/ PeerPushesUnrelated \/ ProcessDies

Spec == Init /\ [][Next]_vars

\* Every turn sets its locals before reading them, so between turns they are noise.
View == <<world, durable, pc, IF pc = "idle" THEN <<>> ELSE locals, upc, bounds, ghost>>

-----------------------------------------------------------------------------
(* Rules                                                                   *)

\* A push receipt is not a deployment: state.live names a commit that Workers
\* Builds deployed, with this release's public data.
LiveMeansDeployed ==
  live.rev # 0 => LET i == Idx(live.sha) IN build[i] = "live" /\ SameData(i, live.rev)

\* An old deploy failure never replaces the newer revision's own push failure
\* (which would make the two alternate on every automatic retry).
NewerFailureStands == ~overwritten

\* Cleanup removes at most one batch of a restore, pushed or still uploading:
\* the batch already authorized when the restore began.
RestoreLosesAtMostOneBatch == lost <= 1

\* A deletion receipt is not proof that the object is still gone. When cleanup
\* reports done, and no restore landed since it was authorized, x is gone from
\* R2, provided this publisher has read a tip that references x since the last
\* restore (it cannot learn of a restore it never saw).
CleanupDoneMeansGone ==
  (claimedGone /\ seen = restores) => \A o \in Objects : ~present[o]

PushedIsOnRemote == pushed.rev # 0 => Contains(Tip, pushed.sha)
=============================================================================
