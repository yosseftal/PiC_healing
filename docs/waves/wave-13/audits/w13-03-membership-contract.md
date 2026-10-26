# W13-03 membership/answer execution contract

Date: 2026-10-26. Baseline: `851cc97`, verified W13-02 closure (64 files / 632 passing tests).
Technical choices implement approved W13-D4 and W13-03; no unresolved therapeutic/domain question remains.

## Public seam

```ts
interface MembershipRevisionInput {
  operationId: string;
  groupId: string;
  expectedRevision: number;
  expectedMembershipRevision: number;
  additions: readonly { id: string; name: string; polarity: Polarity; intensity: Intensity }[];
  orderedSymptomIds: readonly string[];
  answer: JointTreatmentMuscleTestResult;
  answeredAt: Timestamp;
}
// Public GroupEngine and RepositoryPort command:
commitMembershipRevision(input: MembershipRevisionInput): Promise<FinalizedSymptomGroup>;
```

Freeze the complete request before first transmission: operation UUID, stable topic IDs, full order, actual answer and timestamp.
Use the frozen timestamp for the new initial ratings too. New topics require explicit 1–10;
old ratings, including zero, remain exact.
Adapters revalidate under their write lock; the engine's preliminary read is not the atomicity guarantee.
Only after successful persistence may GroupEngine register newly added IDs in its existing index.

## Membership validity

Keep whole-aggregate `revision` as CAS. Add optional domain fields `membership_revision` and
`joint_treatment_membership_revision`, with validating accessor `membershipState(group)` returning effective values.
Both omitted means initial membership version zero; an actual initial answer belongs to zero, otherwise no answer association.
Unrevised public projections retain their existing shapes. Do not enrich frozen snapshots.
Explicit partial metadata, unsafe values or mismatched answer association reject instead of being silently repaired.
An answered-list expansion advances membership once and stores the actual answer for that same version.
Pure reorder, ordinary rating and naming preserve the membership/answer markers.
Initial unanswered assembly stays baseline zero and remains supported; initial cloud NOT NULL constraints remain intact.

Generic aggregate saves must fail closed on additions to an answered group, even if the payload repeats its previous answer.
An answered group cannot be reset to a null answer/date to bypass that guard on a later save.
Generic saves cannot reset/forge membership counters. `finalizeGroup` validates association and retains metadata.
The new command retains every old ID and all old symptom fields, accepts new IDs only once, validates the complete permutation,
then commits additions/order/answer/timestamps/counters/revision together. No deletion, reparenting or automatic splitting.
Adapters reject new IDs already bound to another group, including Guest/Fake storage under the same write lock.

For an initially UNANSWERED local draft only, aggregate save may retain the full existing ID set while changing order
and appending new members under CAS. This does not change the answered-group guard or cloud NOT NULL constraints.
The editor prepares public add/rate/reorder calls inside one staging window seeded with the unanswered base.
Freeze that complete aggregate and restore its expected revision to the committed base token before its single final save.
Never persist intermediate initial additions or split final save/reorder into two visible writes.

## Atomicity and operation receipts

Use existing group-key/storage-key locking and a bounded, private receipt mechanism for this operation family.
Supabase adds an owner/group-bound operation receipt table; Guest keeps equivalent receipts inside its existing single blob.
This is request idempotency, not a domain event log or Timeline expansion. Fake implements the same contract.
Authenticate and validate ownership before returning any receipt. Same operation UUID and same canonical request returns the
current committed group without replaying writes, including after later rating/reorder. A changed request with that UUID rejects.
Receipt checks precede stale-token rejection; normal first execution checks both aggregate and membership versions.
Never compare raw JavaScript object key insertion order where SQL JSONB treats it as the same request.
Keep the prior committed membership/answer intact on every failed transaction.

## Promotion compatibility

Introduce explicit payload version 3 for new Finish intents, carrying both effective membership counters.
Preserve already pending absent/v2 markers through rearming, kind changes, reload, verification and reset recovery.
Never derive wire version from normalized group metadata or storage schema version.
V1/v2 serializer branches and the existing raw SQL fingerprint formula remain unchanged.
First-time v1/v2 promotions establish baseline zero; matching old receipts return current data without resetting counters.
V3 serializes validated effective counters without mutating its snapshot. Unlinked v3 is distinct through its player marker.
Generic save/projection/promotion changes require a new additive migration; the already applied W13-02 SQL stays untouched.
Prepare reviewable SQL and red contracts, then follow the established separate manual-apply checkpoint.

## Web seam and sovereignty

Composition owns a revision draft: committed base, stable new rows/order, editor/question/advisory step,
actual response, frozen request, failure/conflict and recovery facts. Components reflect it through context.
Keep existing rows and rating/history immutable; reuse initial 1–10 controls only for new rows.
Expose edit/return from joint/advisory/summary; put secondary edit tools in utilities to retain the two main choices.
Back/remount retains text, IDs, ratings and order. An addition invalidates the local pending answer; pure reorder does not.
No prior answer authorizes the expanded list. Fresh No commits `split_suggested` and retains sovereign advisory continuation.
Publish the new committed group/flow only after success; capture owner, provider and inquiry generation across awaits.
Bind draft lifetime to the existing composition admission owner/provider/generation, not a permanent auth revision.
Capture authority per send; renewed same-owner authority may retry the exact frozen request without changing its answer.
Do not infer therapeutic ownership from a transient identity badge or assign an owner to unanchored Guest work.
Use existing exclusive-operation serialization. Pending authenticated flush/promotion must settle or retain its exact frozen
request before a divergent revision is admitted. No editable authenticated reload expansion or private engine hydration.
Do not silently rebase an old answer onto changed membership after a conflict: retain intent, inspect refreshed state,
then require a new actual question/operation when membership changes.

## Verification and ownership

- Core/port/shared helpers/Fake/Guest/Supabase/SQL: one strong reasoning owner; no concurrent web writes by that owner.
- Web composition, draft controller, flow and controls, recovery/fixtures: a separate strong reasoning owner.
- Root: public-contract agreement, sequential heavy runners, reviews, quality gates, docs and atomic commits.
- No more than two workers; coordinate test runners. No SQL application/deployment or unrelated cleanup by agents.
- Test initial Yes/No then one/many additions and fresh Yes/No, pure reorder, immutable old data and exact counters.
- Test bypass rejection, stale/foreign/duplicate IDs, invalid new rating, mismatch/finalize, rollback and racing writers.
- Test exact/lost-response retry after later changes, changed-operation payload, owner/generation/reset during pending work.
- Test frozen v1/v2 and gate-only requests, fresh v3 and strict version/payload equality; no extra Finish/Timeline/use count.
- Run real authorized database cases after manual application, plus root typecheck/lint/tests/depcruise and HE/EN browser paths.

Same-run UUID fixture cleanup authorization persists. No existing data, content file or historical artifact may be deleted.
