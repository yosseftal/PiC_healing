# W13-02 contract proposal

Read-only architecture discovery against `6a28ed5`; shared revision/coherent read/append-only saves agreed by orchestrator.
No source edits, database mutations, fixture tests, migration application, deployment, or new domain decision.
Grounding: W13-D1, W13-02, DEC-010/011/017/018 and the W13-01 checkpoint.
The unapplied SQL currently lives under `audits/w13-02-test-drafts/20261022120000_durable_group_priority.sql.txt`.
Restore it to `supabase/migrations/` after W13-06 closes and W13-02 fixes the FOR UPDATE scanner regression.

## Public interface

```ts
// Add to SymptomGroupFields. Optional only for legacy input/frozen snapshot compatibility.
revision?: number;
// Same command on GroupEngine and RepositoryPort:
reorderSymptoms(groupId: string, orderedSymptomIds: readonly string[], expectedRevision: number): Promise<SymptomGroup>;
// Retain existing methods and return shape:
getGroup(groupId: string): Promise<SymptomGroup | null>;
saveGroup(group: SymptomGroup): Promise<void>;
// Add to GuestSnapshot and PromoteGuestToAccountInput:
promotionPayloadVersion?: 2;
// Also retain the same optional marker on GuestSessionGateState.pendingFinishRequest.
```

Fresh group reads always return a nonnegative safe-integer revision; missing legacy storage revision normalizes to zero.
The ordered `symptoms` array remains the sole domain projection of priority. Do not add positions to domain Symptom.
Storage owns `symptoms.priority_position` (zero-based) and `symptom_groups.revision` (whole-group concurrency token).
Revision advances on every actual aggregate mutation, including ratings and joint answers, not just reorder/append.
Otherwise an append using an old aggregate can overwrite a concurrent rating even if its order revision still matches.
Creation preserves a supplied valid revision (staging may already have advanced it), defaulting to zero for legacy input.

GroupEngine validates safe expectedRevision, unique IDs and exact current membership, then calls the port command.
The adapter repeats revision and membership checks atomically; the engine's preliminary read is not a concurrency guard.
The command changes only positions/revision. Empty, singleton and identical order return unchanged after revision validation.
Owner checks remain at authenticated storage and web admission; never introduce a client-supplied trusted owner argument.
Export typed `GroupRevisionConflictError` and `InvalidSymptomOrderError`; distinguish permission/storage failures.
Return the transaction's committed projection. UI conflict refresh uses existing composition getGroup, not private hydration.

## All aggregate writers

`saveGroup` becomes atomic compare-and-swap: incoming revision must equal current revision before an actual mutation.
Missing revision on an existing mutable write rejects; it never means current revision or an unconditional overwrite.
Exact full-content equality, excluding revision alone, is an allowed no-op for lost-response creation/final-flush retries.
Ordinary database saves compare typed values, accepting equivalent timestamp spellings/UUID case without revision changes.
Read projections retain timestamp microseconds; client Date conversion must not truncate old database values on later saves.
An unchanged retry cannot reset revision. Changed payloads with stale/missing revision reject without partial writes.
Never mutate the caller's object. `finalizeGroup` must return the committed reread, not its pre-save aggregate.
GroupEngine add/rate/joint-answer already load before save; retain this flow and propagate conflicts for honest retry.
Do not silently retry stale aggregate data: refresh and reapply the explicit user action through the public engine.

Agreed restriction: existing IDs must remain in the same relative order in `saveGroup`;
new IDs append, omitted IDs reject. Only `reorderSymptoms` changes existing priority. No row deletion or reinsertion.
This replaces the explicit old Supabase full-replacement test at `supabase-repository.test.ts:583` with rejection evidence.
No shipped GroupEngine command removes symptoms; removal is outside W13-02. This is a storage-contract change to record.

## Database implementation and rollout

One additive migration adds revision and priority_position; backfill each group by `created_at ASC NULLS LAST, id ASC`.
Historical manual intent was never stored in the database and cannot be recovered. Existing rows/content are retained.
Use nonnegative checks and a deferrable unique `(group_id, priority_position)` constraint for in-place position swaps.
Add owner-checked `get_symptom_group` (one SQL projection), `save_symptom_group` and `reorder_group_symptoms` RPCs.
Read symptoms explicitly ordered by priority_position, then ID. A two-request group/symptom read is not a coherent CAS token.
Create/save/reorder/promotion share group-key transaction locking; lock the group row before comparison and mutation.
Creation and promotion require an advisory key lock before row existence checks, because a nonexistent row cannot lock.
Validate every symptom's ownership/group binding and duplicate membership before writes; never reparent an existing foreign ID.
Security-definer functions check auth.uid(), use a fixed search_path and grant EXECUTE only to authenticated callers.
Ordinary saves preserve promotion_payload_fingerprint exactly; that receipt describes the original frozen request.

Old direct table writes bypass all revision checks. Revoke authenticated group/symptom INSERT/UPDATE/DELETE;
retain authenticated SELECT with existing RLS, service-role fixture cleanup and the checked RPC write interface.
Older deployed clients then fail closed instead of erasing metadata. Record this coordinated client/migration rollout impact.
Schema tests using direct authenticated mutation must move setup to same-run service fixtures and test checked RPC writes.
Keep cross-owner rejection/RLS read tests; do not replace authorization evidence with client-side filters.
Prepare SQL and tests locally; application requires the established manual checkpoint. No live privilege changes in discovery.
Rollback leaves columns/data intact; reverting presentation cannot safely restore the old blind-write client.

## Guest storage and web decorators

Version new Guest snapshot envelopes with `schemaVersion: 2`; keep the existing storage key and read old envelopes.
Legacy group arrays retain their exact order and actual zero ratings. Normalize only missing revision, not personal values.
Use one storage-key write lock for every whole-blob writer; group CAS and reorder perform one read/check/write under it.
Browser Web Locks can serialize same-origin tabs; same-realm injected storage can use a shared storage-object/key mutex.
Do not claim cross-tab atomicity from synchronous localStorage alone. Old open tabs ignore new locks: require rollout refresh.
Persistent storage without a lock capability fails closed with a typed recoverable write error; reads remain available.
The owned in-memory fallback uses a shared storage-object/key mutex; tests may explicitly inject isolated lock capabilities.
A supplied storage object is never assumed isolated merely because it was injected. No unsafe persistent fallback is allowed.

`group-staging` must intercept reorder and apply the same in-memory save/CAS rules while building one new group.
`authenticated-draft` must intercept reorder for its owner-bound local group; never send an unanswered draft to Supabase.
Normalize legacy unfrozen authenticated drafts on read and version new envelopes; preserve owner/generation/phase checks.
Final W13-01 flush still saves one complete frozen aggregate with stable IDs. Exact retry remains a no-op after lost response.
Flushing drafts reject divergent edits; anchored groups delegate to checked storage. Restoration never mutates engine fields.

## Promotion and exact legacy replay

New pending Finish intents set `promotionPayloadVersion: 2`; assembly copies the intent marker before freezing.
Existing pending intents retain omission, including old gate-only blobs without a promotionRecovery envelope.
SessionEngine forwards the snapshot marker only when present. Never derive wire version from group revision/schema version.
An old gate may already have a committed v1 receipt; normalizing its group to revision zero must still serialize v1.
Repeated onFinishRequested/rearming, reset restoration and constructor-based recovery must preserve the original marker.
Recovery/verification-pending readers preserve an absent marker verbatim; never normalize or enrich frozen groups in place.
Keep existing recovery keys readable. A new envelope version cannot retroactively upgrade an old frozen snapshot.
Legacy absence selects exactly the current four-argument RPC serializer: no revision, positions or version keys added.
Preserve the existing rated_at rule: null omits the property; an actual timestamp is included. Missing is not explicit null.
Legacy requests are not inferred to be v2 from a newly normalized repository group. The frozen marker controls wire format.
V2 adds `payload_version: 2` to p_player_session (also distinguishes unlinked promotions), group revision to p_guest_group,
and priority_position from array index to each p_symptoms item. Require these valid metadata fields for the v2 branch.
The existing RPC name/signature can remain: version is inside fingerprinted JSON, avoiding an ambiguous SQL overload.
Continue the exact md5 expression over raw incoming JSON arguments. Do not strip metadata or recompute existing fingerprints.
Absent/null/zero metadata are distinct JSON payloads; explicit null revision/version is invalid, not legacy omission.

Under the key lock, check authenticated owner and receipt fingerprint before inserts. Matching receipt returns existing IDs.
It must not replay positions or group fields: a later legitimate reorder/rating is preserved on an old promotion retry.
Different version/order/revision/timestamp under the same key rejects. First-time legacy promotions use incoming array order.
Preserve the library promoted_session_ids guard, timeline ID and SessionEngine Finish replay guard unchanged.
Hydration uses coherent committed storage reads. Fake receipts clone frozen inputs and compare the version marker too.

## Affected contracts and remaining decisions

Engine types/barrel/port/compile-check/delegator, GroupEngine, SessionEngine and FakeRepositoryPort need the added interface.
Adapter contract suites need revision/no-op/stale-write/permutation cases plus fresh-instance read-back and promotion matrices.
Web wrappers include composition-root, group-staging, authenticated-draft, promote-path, recovery and verification-pending.
Explicit port literals also occur in persistence-gate-modal tests, promote-path tests and tests/unified-player.fixture.tsx.
Preserve old fixture shapes where testing legacy compatibility; update expected read projections rather than mass-adding fields.
Real database evidence must cover owner rejection, rollback, competing reorder/append/rating and different-payload promotion.
Include old gate-only lost-response replay with no recovery envelope; also test explicit frozen v1 recovery/verification data.
No data-dependent test or cleanup runs until authorized isolated setup and reviewed additive migration are available.
Unsupported-lock behavior is agreed above. SQL/runtime verification remains outstanding; no remaining contract choice is inferred.
