# W13-02 — Reorder topics and preserve priority through storage and promotion

**Status:** awaiting-human-review — implementation is not authorized.
**Specification:** [Approved Wave 13 charter](../specs/wave-13-spec.md).
**Blocked by:** [W13-01](w13-01-instant-questionnaire-and-initial-rating.md).
**Blocking:** [W13-03](w13-03-renewed-joint-answer-after-addition.md), [W13-05](w13-05-clean-summary-and-polarity-view.md).
**Execution gate:** Human green light for the ticket suite, then completed prerequisites.
**Domain decisions:** DEC-010, DEC-011, DEC-017, DEC-018; W13-D1.

## Objective & Context

The Event Manager moves topics into the desired priority and sees that same order after a real storage
round-trip and Guest-to-account promotion. This is one vertical slice across controls, GroupEngine, the port,
both adapters, schema and promotion; do not land an engine-only feature as the completed ticket.

Approved W13-D1 requires durable manual priority. Guest arrays currently preserve insertion order,
but the Supabase read has no explicit order and the GroupEngine has no reorder operation.
The existing Supabase aggregate save can delete omitted symptoms; that is not an acceptable reorder strategy.
DEC-018 requires exact frozen-payload replay, including when older clients have pending promotion envelopes.

## What to Build / Exact Scope

1. Add accessible move-up/down controls to the topic list, with visible one-based **סדר עדיפות**.
   Keep focus on the moved topic; announce its new position without a total. Disable impossible boundary moves.
2. Route the complete requested ID permutation through a public GroupEngine command and RepositoryPort.
   Validate exact group membership, uniqueness, owner and a concurrency precondition. Single-item moves are harmless.
3. Persist zero-based symptom positions and a group order revision, or an equally explicit representation that
   preserves the approved ordered-group projection. The representation has one canonical owner.
4. Implement atomic owner-checked ordering in Supabase with locking/revision checks. Include append/membership
   writers in the concurrency discipline. Rating writes cannot restore obsolete positions or overwrite revisions.
5. Use additive schema changes and deterministic legacy backfill using available creation time then ID.
   Unknown historical user intent cannot be reconstructed; document that limitation. No delete/reinsert shortcut.
6. Round-trip the same order in LocalGuest storage and version new envelopes. Old snapshots retain array order.
7. Carry ordering through new Guest promotion payloads, strict comparison, receipt handling and hydration.
   Preserve the exact wire shape/key of an already frozen legacy request. A changed payload cannot reuse that receipt.
8. After a successful write render the committed projection; a failure retains an honest pending/retry state.
   Conflict recovery refreshes authoritative order and preserves the user's intended change for an explicit retry.
9. Document additive rollout and recovery. Older callers must not silently erase ordering metadata.
   Scope storage migration verification to an authorized isolated environment; deployment is a separate action.

## End-to-End Demonstration

Enter three differently rated topics, move the last to first using only the keyboard, and read the group
through a fresh repository instance. Promote that Guest work to an account and read it back again.
The visible priority and stable IDs match, all ratings are unchanged, and one replay produces no second completion.

## Acceptance Criteria

- [ ] **AC-01:** Move controls change canonical manual priority through GroupEngine, not only React state.
- [ ] **AC-02:** All topic identities, names, ratings, rating timestamps and joint answer remain unchanged by a pure reorder.
- [ ] **AC-03:** Duplicate, foreign, omitted and unknown IDs are rejected without partial mutation.
- [ ] **AC-04:** Both adapters return the committed order; Supabase reads explicitly order by persisted priority.
- [ ] **AC-05:** Concurrent reorder, append and rating writes cannot clobber membership, scores or a newer revision.
- [ ] **AC-06:** Storage failure/conflict retains a truthful retry path; optimistic preview is never announced as saved.
- [ ] **AC-07:** Legacy Guest snapshots and database groups load deterministically without losing members or actual zero ratings.
- [ ] **AC-08:** New ordered Guest promotion and exact lost-response replay preserve order and count completion only once.
- [ ] **AC-09:** Frozen legacy promotion requests remain byte/shape compatible; changed payload with the same key is rejected.
- [ ] **AC-10:** No reorder operation deletes/reinserts rows; migration is additive and ownership checks reject another account.
- [ ] **AC-11:** Keyboard focus, one-based priority labels and announcements work in Hebrew and English.

## Testing Requirements

- Highest seam: rendered move action through composition and GroupEngine to repository read-back.
- Contract matrix: empty/single/multiple members; valid reverse; duplicate/foreign/missing IDs; stale revision.
- Real isolated database cases: ownership rejection, transaction rollback and racing reorder/append/rating.
- Adapter round-trips must use fresh reads, not the same in-memory array used to build the request.
- Promotion matrix includes new payload, exact retry, lost response, old pending envelope and changed-payload rejection.
- Run seed/FK integrity, unchanged rating and DEC-018 regression suites as affected by the new port shape.
- Browser verification uses keyboard controls; drag-and-drop is optional and cannot substitute for these checks.

Run typecheck, lint, dependency isolation and affected unit/integration/browser checks for the owned slice.
Use the scripts actually present in the repository; record commands and outcomes in Resolution.
Changes crossing persistence require both public-contract tests and real authorized database evidence.
No treatment-content file or database-row deletion is permitted without explicit target-specific human approval,
including fixture cleanup. Use an agreed isolated environment and retain fixtures if cleanup is not authorized.

## Definition of Done

- The complete demonstration works; every AC is linked to concrete passing evidence in Resolution.
- Relevant tests, typecheck, lint and dependency checks pass on the final diff.
- Existing owner isolation, Dumb Reflection, Blind-by-Default and EM Sovereignty contracts remain intact.
- Changes stay within this slice; shared modules have one writer at a time.
- Required content approvals and manual/environment limitations are recorded honestly.
- A scoped implementation commit references this ticket after authorization and review.
- The ticket index reflects its actual state; documentation and historical evidence remain preserved.

## Do Not Touch / Out of Scope

No polarity/intensity-based priority inference, therapeutic recommendation, Player/Library redesign,
generic authenticated engine hydration, cross-device sync framework, content deletion, ID regeneration,
or private engine-field mutation. Do not weaken frozen retry equality to accommodate the new metadata.

The current preflight creates this document only. Do not execute its implementation steps until the user
approves the generated suite. Approval of the specification is not an instruction to start coding in this turn.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.
