# W13-02 — Reorder topics and preserve priority through storage and promotion

**Status:** closed — full remote verification passed on 2026-10-26 after confirmed migration application.
**Specification:** [Approved Wave 13 charter](../specs/wave-13-spec.md).
**Blocked by:** [W13-01](w13-01-instant-questionnaire-and-initial-rating.md).
**Blocking:** [W13-03](w13-03-renewed-joint-answer-after-addition.md), [W13-05](w13-05-clean-summary-and-polarity-view.md).
**Execution gate:** Authorized; complete prerequisites and wait for serial dispatch.
**Domain decisions:** DEC-010, DEC-011, DEC-017, DEC-018; W13-D1.

## Objective & Context

The Event Manager moves topics into the desired priority and sees that same order after a real storage
round-trip and Guest-to-account promotion. This is one vertical slice across controls, GroupEngine, the port,
both adapters, schema and promotion; do not land an engine-only feature as the completed ticket.

The approved W13-01 refinement already supplies move controls for local, uncommitted draft rows.
This ticket extends priority to committed groups and cloud storage; retain W13-01's local atomic draft submission.

Approved W13-D1 requires durable manual priority. Guest arrays currently preserve insertion order,
but the Supabase read has no explicit order and the GroupEngine has no reorder operation.
The existing Supabase aggregate save can delete omitted symptoms; that is not an acceptable reorder strategy.
DEC-018 requires exact frozen-payload replay, including when older clients have pending promotion envelopes.

## What to Build / Exact Scope

1. Extend the draft's accessible move-up/down pattern to committed topics, with one-based **סדר עדיפות**.
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

- [x] **AC-01:** Move controls change canonical manual priority through GroupEngine, not only React state.
- [x] **AC-02:** All topic identities, names, ratings, rating timestamps and joint answer remain unchanged by a pure reorder.
- [x] **AC-03:** Duplicate, foreign, omitted and unknown IDs are rejected without partial mutation.
- [x] **AC-04:** Both adapters return the committed order; Supabase reads explicitly order by persisted priority.
- [x] **AC-05:** Concurrent reorder, append and rating writes cannot clobber membership, scores or a newer revision.
- [x] **AC-06:** Storage failure/conflict retains a truthful retry path; optimistic preview is never announced as saved.
- [x] **AC-07:** Legacy Guest snapshots and database groups load deterministically without losing members or actual zero ratings.
- [x] **AC-08:** New ordered Guest promotion and exact lost-response replay preserve order and count completion only once.
- [x] **AC-09:** Frozen legacy promotion requests remain byte/shape compatible; changed payload with the same key is rejected.
- [x] **AC-10:** No reorder operation deletes/reinserts rows; migration is additive and ownership checks reject another account.
- [x] **AC-11:** Keyboard focus, one-based priority labels and announcements work in Hebrew and English.

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
The user permits cleanup only of fixture rows and Auth users created in the same test run, by that run's UUIDs.
No existing content, unrelated database rows or treatment-content files may be deleted.

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

Implementation is authorized by the user; wait for prerequisites and serial dispatch.

## Resolution

### Closed after real database verification — 2026-10-26

The human confirmed `migration applied` for `20261022120000_durable_group_priority.sql`.
The applied migration was not edited. No runtime implementation change was needed during verification.
The first full run passed 629 tests and found three test-harness mismatches: exhausted isolated treatment IDs,
the checked RPC's new exact array-validation diagnostic, and the expected revision advance on a real joint answer.
The fixture pool now provides 48 distinct same-run IDs; exact payload, zero-write, content and count assertions remain intact.

Final root `npm test`: **64 files / 632 tests passed, zero failed or skipped** (103.56 seconds).
Worker cap 2 and the previously approved controlled signup address were supplied only to the process.
Normal TLS stayed enabled. The test command also passed both dependency graphs:
engine 74 modules / 205 dependencies; web 774 / 1709, with zero violations.
Root typecheck, lint and web depcruise pass. The unchanged browser implementation retains its six passing
Hebrew/English committed-priority and promotion journeys from the reviewed implementation checkpoint.

| AC | Concrete closure evidence |
| --- | --- |
| 01 | Rendered composition tests and keyboard browser moves call public GroupEngine/port reorder. |
| 02 | Shared fresh-port contract plus real timestamp/read/reorder/save tests preserve all personal fields. |
| 03 | Fake, Guest and real Supabase permutation/token/overflow tests reject invalid writes without partial state. |
| 04 | Fresh adapter instances read committed order; checked RPC projection explicitly orders positions. |
| 05 | Real concurrent reorder/append/rating accepts one revision; held-lock tests cover every Guest blob writer. |
| 06 | Rendered failure, stale-token refresh, frozen full-permutation retry and cancel/review paths pass. |
| 07 | Legacy Guest reads retain zero/order without rewriting; real legacy and typed timestamp contracts pass. |
| 08 | Real ordered promotion, exact retry and lost-response suites retain one row-set and one completion. |
| 09 | Real legacy receipts, strict changed payload/timestamp/version checks and literal v1 wire regression pass. |
| 10 | Real foreign-owner, direct-DML denial and rollback tests pass; SQL never deletes/reinserts group members. |
| 11 | Six prior Chromium cases verify Hebrew/English labels, announcements, keyboard moves and boundary focus. |

The read-only post-run sweep returns 200 and the expected new column counts: groups 8, symptoms 10.
Row counts match the pre-wave baseline: profiles 31, groups 23, symptoms 22, treatments 23,
Player sessions 30, personal library 23, Timeline 26. Only same-run UUID fixtures/Auth users were cleaned up.
Counts verify cleanup, not content equivalence; no existing personal data or treatment content was deleted.
Both independent review axes already passed; verification changed only the three test-harness expectations above.
Implementation commit remains `5439a4f`; the scoped closure commit records this final evidence and test corrections.
Continue with W13-03; its approved implementation authorization persists.

### Historical pre-application evidence — 2026-10-25

The following preserves the earlier open checkpoint; the closure above supersedes its pending status.

Implementation is in progress; no closure or full-gate pass is claimed.
The agreed [persistence contract](../audits/w13-02-contract-proposal.md) is implemented across engine,
Guest storage, Supabase RPC mapping and web decorators; final review and integration verification remain open.
The prepared runtime SQL is `supabase/migrations/20261022120000_durable_group_priority.sql`.
The original three `.txt` drafts remain preserved verbatim in the audit directory, outside test/migration discovery.
No live migration or privilege change has been applied.

Reported focused evidence before the latest quota restart:

- Core GroupEngine/reorder slice: 16 passing tests.
- SQL extractor/bootstrap integrity: 15 passing tests, including row-lock clauses without hiding real treatment writes.
- Expanded Fake/Guest permutation/CAS/overflow matrix: 6 passing tests.
- Core Session/transport/replay focused batch: 4 files / 68 passing tests.
- Guest storage-lock suite: 5 passing tests, including held-lock writers across separate ports,
  legacy missing-revision reads without rewriting and unsupported persistent-lock failures with data retained.

These batches overlap; their counts are not a combined test total. Exact final gates will replace this interim evidence.
The first root typecheck/lint after the latest restart found a partial schema-test edit left by quota interruption;
that syntax is corrected and final reruns remain required. W13-01 and W13-06's prior green checkpoints remain preserved.
Real database owner/race/rollback/legacy-receipt evidence awaits the established manual SQL Editor checkpoint.
All ACs remain unchecked until the complete slice, independent reviews and required database verification pass.

#### Final local checkpoint before schema application

Root typecheck, lint and web depcruise pass; the web graph contains 774 modules / 1709 dependencies with zero violations.
The final local-only Vitest command passes 58 files / 563 tests. It explicitly excludes remote files and filters the
five remote cases in the mixed promote-path file; those five are reported skipped for this local command only.
Root `npm test` has no such exclusions. Its latest pre-final-fixture run reports 587 passing / 45 failing tests;
two remaining local test calls were then corrected to pass the actual assembled versioned snapshot, and the full local run passes.
Remote red evidence includes PGRST202 missing RPCs and PGRST204 missing revision metadata; no full green gate is claimed.
Six Chromium cases pass for Hebrew/English committed priority, keyboard focus, promotion loss/retry and existing journeys.
Standards and Spec reviews both pass; see [the complete evidence](../audits/w13-02-implementation-review.md).

| AC | Local evidence | Required real evidence before closure |
| --- | --- | --- |
| 01 | Rendered composition and keyboard browser moves use GroupEngine. | Final assembled gate after application. |
| 02 | Fresh reads preserve identities, ratings, timestamps and actual answer. | Microsecond/order/ordinary-save contracts. |
| 03 | Invalid permutation, stale, duplicate and overflow matrices pass. | Real membership and transaction rejection. |
| 04 | Guest/fake fresh-instance round-trips and RPC transport pass. | Coherent ordered Supabase read-back. |
| 05 | Shared CAS and held-lock all-writer tests pass. | Competing reorder/append/rating. |
| 06 | Full intent retained, refreshed explicit retry, cancel/review and truthful status pass. | Final integrated verification. |
| 07 | Legacy zero/order/missing-revision read without rewriting passes. | Additive legacy backfill verification. |
| 08 | Ordered versioned replay and one-completion journeys pass locally. | Real promotion and lost-response replay. |
| 09 | Literal v1 wire, frozen marker omission and strict replay tests pass. | Real old receipt and changed-payload rejection. |
| 10 | SQL is additive, owner-checked and contains no deletion/reinsertion. | RLS/owner/grants/rollback execution. |
| 11 | Hebrew/English priority labels, announcements and boundary focus pass. | Already browser-verified; retain in final gate. |

The original draft documents remain intact. No treatment content or existing database row was deleted.
The [manual-apply checkpoint](../handoffs/w13-02-manual-apply-checkpoint.md) is the exact next entry point.
Implementation commit `5439a4f` intentionally precedes schema application, as required by the remote-testing guide;
it is not ticket closure. Resume W13-02 real verification after the human confirms `migration applied`, then proceed to W13-03.
