# W13-03 isolated implementation brief

## Identity and authorization

Ticket: [W13-03](../tickets/w13-03-renewed-joint-answer-after-addition.md).
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

1. Provide a return-to-list/edit entry from the current joint/advisory/summary journey using the shared flow seam.
   Preserve existing member IDs and show new topics as a pending questionnaire revision, not already anchored work.
2. Permit progressive additions with stable IDs and their initial 1–10 rating pass; retain pending text on Back.
   Multiple additions before answering produce one fresh question about the latest complete membership.
3. Bind an answer to the membership revision through a public GroupEngine command that commits the new members
   and actual answer together. Reject stale owner/revision state; exact retries must not duplicate topics.
4. Extend the port, Guest representation and Supabase atomic transaction accordingly. Read original membership,
   current order and response consistently; keep the prior committed version usable until the new commit succeeds.
5. A prior Yes or No cannot authorize continuation with an expanded list. A pure reorder leaves the answer valid.
   Do not reset or fabricate a server answer as an intermediate write to work around a NOT NULL constraint.
6. A fresh No persists split_suggested for the new version and offers existing advisory/continue choices.
   Never force Yes, auto-split, archive or delete a group in order to proceed.
7. Serialize with pending persistence/promotion. Freeze payloads before sending; retain old frozen promotion
   requests for exact replay. Resolve pending anchoring before accepting a new persisted revision.
8. Expose save failure and conflict recovery while retaining staged additions and the actual fresh response.
   Preserve previous rating/history fields, priority positions, Timeline and library use counts.


## Domain references

Read the ticket's cited DEC entries in full. Canonical terms remain Symptom Group, Symptom,
Polarity, Intensity, Event Manager and Inquiry Session; Questionnaire is presentation language only.
DEC-010: independent valence and magnitude; W13-D2 narrows initial entry to 1–10 only.
DEC-011: both prior dimensions hidden by default; explicit Reveal remains available for re-rating.
DEC-017: actual verified identity and persistence are distinct; never invent a joint answer to save a draft.

## Seam map excerpt

Read the 03 row of the execution seam map and the ticket's blocked-by edges.
W13-02 is closed at `851cc97`. Follow [the agreed membership contract](../audits/w13-03-membership-contract.md)
for the public command, independent membership markers, operation receipts and exact v1/v2/v3 promotion boundary.
UI reaches GroupEngine through contexts/composition; durable domain changes belong to public engine/port contracts.
Preserve inquiry generation, owner checks, stable IDs and retry serialization across transient mounts.
Resolve Must-fix risks in the active slice before reporting DoD complete.

## Execution contract

Use /implement and /tdd at the agreed seams. Read their local SKILL.md instructions.
Capture failing regression evidence before the fix; run focused tests as work progresses.
Run root npm run typecheck, npm run depcruise -w packages/pic-web, npm test, and affected lint/browser checks.
No live database row cleanup or treatment-content deletion. Use local test doubles unless a remote gate is authorized.
Before committing, provide the orchestrator the final diff and test evidence for independent Standards/Spec review.
Commit scoped passing work with [W13-03] in its message. Update Resolution for every AC and use Status: closed
only after the orchestrator confirms complete evidence. Never fabricate passes or waive tests silently.
Stop after this ticket; do not begin another ticket or modify sibling source ownership.

## Acceptance criteria (verbatim)

- [ ] **AC-01:** Adding at least one topic after any previous joint answer requires a new answer for the full updated list.
- [ ] **AC-02:** Pure reordering never forces another joint answer.
- [ ] **AC-03:** Back and retry retain pending additions, text, ratings, IDs, order and the actual fresh answer.
- [ ] **AC-04:** Original membership and answer remain committed together until the revised transaction succeeds.
- [ ] **AC-05:** A successful revision persists membership, order and its fresh answer together in Guest and Supabase.
- [ ] **AC-06:** Fresh No is accepted with the existing non-blocking advisory; no forced Yes or automatic split occurs.
- [ ] **AC-07:** A stale/concurrent revision or different owner is rejected without partial writes or overwriting newer work.
- [ ] **AC-08:** Same-operation retry after failure/lost response does not duplicate topics or change completion counts.
- [ ] **AC-09:** Prior history, existing ratings, source IDs and anchored group continuity remain intact.
- [ ] **AC-10:** Pending Guest promotion is settled or retained for exact replay before a divergent revision is committed.


## Out of scope (verbatim)

No topic removal, arbitrary group administration, required positive answer, full split UI, auto-archival,
cross-device editing product, generic event sourcing or modification of historical ratings.
No data deletion or workaround that bypasses the public engine seam.

Implementation is authorized by the user; wait for prerequisites and serial dispatch.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.
