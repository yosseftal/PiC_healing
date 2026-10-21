# W13-02 isolated implementation brief

## Identity and authorization

Ticket: [W13-02](../tickets/w13-02-durable-manual-priority.md).
User approved implementation of the full suite after preflight. Work only when dispatched in serial order.
Read AGENTS.md, CLAUDE.md, CONTEXT.md, decisions.md, the active specification and the complete ticket before editing.
The older preflight-only instructions describe that earlier turn; this execution charter supersedes that gate.

## Permissions

Read-write: active ticket and its owned source/tests inside packages/pic-web.
The approved ticket additionally owns its declared engine/port/adapter/schema changes.
Read-only: spec, other tickets and the [execution seam map](../audits/wave-13-execution-seam-map.md).
Off limits: unrelated code, treatment files, destructive database cleanup and any undeclared seam extension.
Shared files have one writer. Escalate ambiguities to the orchestrator before guessing semantics.

## Frozen requirements (verbatim)

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


## Domain references

Read the ticket's cited DEC entries in full. Canonical terms remain Symptom Group, Symptom,
Polarity, Intensity, Event Manager and Inquiry Session; Questionnaire is presentation language only.
DEC-010: independent valence and magnitude; W13-D2 narrows initial entry to 1–10 only.
DEC-011: both prior dimensions hidden by default; explicit Reveal remains available for re-rating.
DEC-017: actual verified identity and persistence are distinct; never invent a joint answer to save a draft.

## Seam map excerpt

Read the 02 row of the execution seam map and the ticket's blocked-by edges.
UI reaches GroupEngine through contexts/composition; durable domain changes belong to public engine/port contracts.
Preserve inquiry generation, owner checks, stable IDs and retry serialization across transient mounts.
Resolve Must-fix risks in the active slice before reporting DoD complete.

## Execution contract

Use /implement and /tdd at the agreed seams. Read their local SKILL.md instructions.
Capture failing regression evidence before the fix; run focused tests as work progresses.
Run root npm run typecheck, npm run depcruise -w packages/pic-web, npm test, and affected lint/browser checks.
No live database row cleanup or treatment-content deletion. Use local test doubles unless a remote gate is authorized.
Before committing, provide the orchestrator the final diff and test evidence for independent Standards/Spec review.
Commit scoped passing work with [W13-02] in its message. Update Resolution for every AC and use Status: closed
only after the orchestrator confirms complete evidence. Never fabricate passes or waive tests silently.
Stop after this ticket; do not begin another ticket or modify sibling source ownership.

## Acceptance criteria (verbatim)

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


## Out of scope (verbatim)

No polarity/intensity-based priority inference, therapeutic recommendation, Player/Library redesign,
generic authenticated engine hydration, cross-device sync framework, content deletion, ID regeneration,
or private engine-field mutation. Do not weaken frozen retry equality to accommodate the new metadata.

Implementation is authorized by the user; wait for prerequisites and serial dispatch.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.
