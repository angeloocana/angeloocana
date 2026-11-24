--------------------------- MODULE RecutTransaction ---------------------------
(***************************************************************************)
(* The recut transaction: the review lock, the promotion journal and its   *)
(* recovery in scripts/clips/review_io.py, and the lock-scoped commit of a *)
(* rendered pair by rebuild() in scripts/clips/clips.py. README.md maps    *)
(* every action to the line it stands for.                                 *)
(*                                                                         *)
(* The bug class: a stale or interrupted recut wins. The promise is        *)
(* old-or-new to readers that take the review lock: such a reader sees the *)
(* clip's files as one whole edit or commit left them. The filesystem does *)
(* not replace several files atomically; the lock and the journal make it  *)
(* look so.                                                                *)
(*                                                                         *)
(* One clip has six files: the MP4, the poster, its recipe, the pending    *)
(* draft, its check and the review queue. Two saves of the cut editor make *)
(* draft generations 1 and 2, and each starts a rebuild job. A job reads   *)
(* the cut under the lock, renders without it, then commits under the      *)
(* lock. Each step is one rename or one lock action. Any process can die   *)
(* after any step; the kernel then drops its lock.                         *)
(*                                                                         *)
(* Bugs puts one historical transition back (README.md). With Bugs = {}    *)
(* the model is the code at the sync commit.                               *)
(***************************************************************************)
EXTENDS Naturals, Sequences

CONSTANTS
  Bugs, MaxCrashes,
  Autopublish  \* REVIEW_AUTOPUBLISH=1, as on the review server; FALSE is the known gap in README.md

Files == {"mp4", "jpg", "recipe", "drafts", "checks", "queue"}
Pair == <<"mp4", "jpg">>
\* review_updates in finish_render(): RECIPES, DRAFTS, CHECKS, and REVIEW_QUEUE
\* only with REVIEW_AUTOPUBLISH=1. Without it, a rebuild writes no queue.
Review == IF Autopublish THEN <<"recipe", "drafts", "checks", "queue">> ELSE <<"recipe", "drafts", "checks">>
Jobs == {"j1", "j2"}
Procs == Jobs \cup {"ed", "rd"}  \* rebuild jobs, the cut editor, a reader
JobOf(g) == IF g = 1 THEN "j1" ELSE "j2"
NoJournal == [on |-> FALSE, f |-> [x \in Files |-> 0], meta |-> FALSE]
NoCut == [d |-> 0, r |-> 0]

\* The order of one commit. promote_clip publishes the journal, replaces the
\* pair, then each review file, then resolves the journal. Without
\* REVIEW_AUTOPUBLISH, finish_render() journals the pair alone and writes the
\* review files after it resolves (the known gap, README.md).
Steps ==
  IF "noJournal" \in Bugs THEN Pair \o Review
  ELSE IF "pairOnlyJournal" \in Bugs \/ ~Autopublish THEN <<"journal">> \o Pair \o <<"resolve">> \o Review
  ELSE <<"journal">> \o Pair \o Review \o <<"resolve">>

VARIABLES
  f,        \* each file: the generation that wrote it, 0 for the cut before any edit;
            \* for drafts, the generation of the pending draft, 0 for none
  journal,  \* .review-promotion: on, the backups it holds, and whether they cover the review files
  lock,     \* work/review-data.lock: "free" or its holder
  pc, after, k, rs,  \* each process's step; after recovery; commit step; recovery step
  exp, cut, \* per job: the cut the web action asked for, and the cut it read
  edits, crashes,
  want,     \* ghost: every file as the last whole edit or commit left it
  best, torn, staleWon  \* ghost: newest landed generation, and what the rules read

vars == <<f, journal, lock, pc, after, k, rs, exp, cut, edits, crashes, want, best, torn, staleWon>>

\* Every file, the pending draft included, is as one whole transaction left it.
Consistent == f = want
Current == [d |-> f["drafts"], r |-> f["recipe"]]  \* cut_inputs(): the draft and the recipe

Init ==
  /\ f = [x \in Files |-> 0] /\ journal = NoJournal /\ lock = "free"
  /\ pc = [p \in Procs |-> IF p \in Jobs THEN "off" ELSE "idle"]
  /\ after = [p \in Procs |-> "idle"] /\ k = [j \in Jobs |-> 1] /\ rs = [p \in Procs |-> 0]
  /\ exp = [j \in Jobs |-> NoCut] /\ cut = [j \in Jobs |-> NoCut]
  /\ edits = 0 /\ crashes = 0 /\ want = f /\ best = 0 /\ torn = FALSE /\ staleWon = FALSE

Release(p, next) == lock' = "free" /\ pc' = [pc EXCEPT ![p] = next]

\* review_lock(): flock, then _recover_promotion() before the caller runs.
Acquire(p, next) ==
  /\ lock = "free" /\ lock' = p
  /\ IF journal.on
     THEN pc' = [pc EXCEPT ![p] = "recover"] /\ after' = [after EXCEPT ![p] = next] /\ rs' = [rs EXCEPT ![p] = 0]
     ELSE pc' = [pc EXCEPT ![p] = next] /\ UNCHANGED <<after, rs>>
  /\ UNCHANGED <<f, journal, k, exp, cut, edits, crashes, want, best, torn, staleWon>>

\* _recover_journal(): restore each backed-up file in turn, then clear the
\* journal. It stays whole until the last step, so a death here only repeats it.
Recover(p) ==
  /\ pc[p] = "recover"
  /\ LET order == IF journal.meta THEN Pair \o Review ELSE Pair IN
     IF rs[p] < Len(order)
     THEN /\ f' = [f EXCEPT ![order[rs[p] + 1]] = journal.f[order[rs[p] + 1]]]
          /\ rs' = [rs EXCEPT ![p] = rs[p] + 1] /\ UNCHANGED <<journal, pc>>
     ELSE journal' = NoJournal /\ pc' = [pc EXCEPT ![p] = after[p]] /\ UNCHANGED <<f, rs>>
  /\ UNCHANGED <<lock, after, k, exp, cut, edits, crashes, want, best, torn, staleWon>>

-----------------------------------------------------------------------------
(* The cut editor: saveCut() writes the draft under the lock and starts    *)
(* clips.py rebuild-expected with the inputs it just saved.                *)

EditorStart ==
  /\ pc["ed"] = "idle" /\ edits < 2
  /\ Acquire("ed", "edit")

Edit ==
  /\ pc["ed"] = "edit"
  /\ LET g == edits + 1 IN
     /\ f' = [f EXCEPT !["drafts"] = g] /\ want' = f' /\ edits' = g
     /\ exp' = [exp EXCEPT ![JobOf(g)] = [d |-> g, r |-> f["recipe"]]]
     /\ lock' = "free"
     /\ pc' = [pc EXCEPT !["ed"] = "idle", ![JobOf(g)] = "spawned"]
  /\ UNCHANGED <<journal, after, k, rs, cut, crashes, best, torn, staleWon>>

-----------------------------------------------------------------------------
(* rebuild(name, expected=...): read under the lock, render, commit.       *)

JobStart(j) == pc[j] = "spawned" /\ Acquire(j, "read")

\* require_cut(name, expected, cut): refuse inputs replaced before the read.
Read(j) ==
  /\ pc[j] = "read"
  /\ IF Current # exp[j]
     THEN Release(j, "stale") /\ UNCHANGED cut
     ELSE Release(j, "render") /\ cut' = [cut EXCEPT ![j] = Current]
  /\ UNCHANGED <<f, journal, after, k, rs, exp, edits, crashes, want, best, torn, staleWon>>

\* render_clip() runs off the lock; then the job takes it again.
Rendered(j) == pc[j] = "render" /\ Acquire(j, "check")

\* require_cut(name, cut, cut_inputs(...)): a newer draft or recipe saved
\* during the render makes this one stale. Before 744ab48 a draft-based
\* rebuild promoted without that check.
Check(j) ==
  /\ pc[j] = "check"
  /\ IF Current # cut[j] /\ "staleRenderWins" \notin Bugs
     THEN Release(j, "stale") /\ UNCHANGED k
     ELSE pc' = [pc EXCEPT ![j] = "commit"] /\ k' = [k EXCEPT ![j] = 1] /\ UNCHANGED lock
  /\ UNCHANGED <<f, journal, after, rs, exp, cut, edits, crashes, want, best, torn, staleWon>>

\* finish_render() -> promote_clip(..., review_updates=...): one rename per step.
Commit(j) ==
  /\ pc[j] = "commit"
  /\ LET step == Steps[k[j]]
         g == cut[j].d
         last == k[j] = Len(Steps) IN
     /\ CASE step = "journal" ->
               journal' = [on |-> TRUE, f |-> f, meta |-> "pairOnlyJournal" \notin Bugs /\ Autopublish]
               /\ UNCHANGED f
          [] step = "resolve" -> journal' = NoJournal /\ UNCHANGED f
          \* del drafts[name]: the job's draft is applied, so none is pending.
          [] step = "drafts" -> f' = [f EXCEPT !["drafts"] = 0] /\ UNCHANGED journal
          [] OTHER -> f' = [f EXCEPT ![step] = g] /\ UNCHANGED journal
     /\ IF last
        THEN /\ Release(j, "done") /\ UNCHANGED k /\ want' = f'
             /\ best' = IF g > best THEN g ELSE best
             /\ staleWon' = (staleWon \/ g < best)
        ELSE /\ k' = [k EXCEPT ![j] = k[j] + 1] /\ UNCHANGED <<lock, pc, want, best, staleWon>>
  /\ UNCHANGED <<after, rs, exp, cut, edits, crashes, torn>>

-----------------------------------------------------------------------------
(* A reader: the review page, the cut page, or the publisher's snapshot,   *)
(* each through withReviewLock(). Before 18432e4 the review and cut pages  *)
(* read without it.                                                        *)

ReaderStart ==
  /\ pc["rd"] = "idle"
  /\ IF "unlockedReader" \in Bugs
     THEN torn' = (torn \/ ~Consistent)
          /\ UNCHANGED <<f, journal, lock, pc, after, k, rs, exp, cut, edits, crashes, want, best, staleWon>>
     ELSE Acquire("rd", "read")

ReaderRead ==
  /\ pc["rd"] = "read"
  /\ torn' = (torn \/ ~Consistent) /\ Release("rd", "idle")
  /\ UNCHANGED <<f, journal, after, k, rs, exp, cut, edits, crashes, want, best, staleWon>>

-----------------------------------------------------------------------------
(* A process dies (os._exit, SIGKILL, power to the process): its locals are *)
(* gone, the kernel releases its flock, files and the journal stay.        *)

Die(p) ==
  /\ crashes < MaxCrashes
  /\ pc[p] \notin {"off", "idle", "done", "stale", "dead", "spawned"}
  /\ crashes' = crashes + 1
  /\ lock' = IF lock = p THEN "free" ELSE lock
  /\ pc' = [pc EXCEPT ![p] = IF p \in Jobs THEN "dead" ELSE "idle"]
  /\ UNCHANGED <<f, journal, after, k, rs, exp, cut, edits, want, best, torn, staleWon>>

Next ==
  \/ EditorStart \/ Edit \/ ReaderStart \/ ReaderRead
  \/ \E p \in Procs : Recover(p) \/ Die(p)
  \/ \E j \in Jobs : JobStart(j) \/ Read(j) \/ Rendered(j) \/ Check(j) \/ Commit(j)

Spec == Init /\ [][Next]_vars

-----------------------------------------------------------------------------
(* The rules                                                               *)

\* A reader that takes the review lock sees every file, the pending draft
\* included, as the last whole edit or commit left it.
ReadersSeeOldOrNew == ~torn

\* A commit never lands a cut older than one that already landed.
NoStaleWin == ~staleWon

TypeOK ==
  /\ f \in [Files -> 0..2] /\ lock \in Procs \cup {"free"}
  /\ lock # "free" => pc[lock] \in {"recover", "edit", "read", "check", "commit"}
=============================================================================
