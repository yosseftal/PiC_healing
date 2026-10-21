# W13-08 isolated implementation brief

## Identity and authorization

Ticket: [W13-08](../tickets/w13-08-post-finish-routing-and-content-hygiene.md).
User approved implementation of the full suite after preflight. Work only when dispatched in serial order.
Read AGENTS.md, CLAUDE.md, CONTEXT.md, decisions.md, the active specification and the complete ticket before editing.
The older preflight-only instructions describe that earlier turn; this execution charter supersedes that gate.

## Permissions

Read-write: active ticket and its owned source/tests inside packages/pic-web.
Read-only: packages/pic-engine, adapters, migrations and all sibling-ticket implementations.
Read-only: spec, other tickets and the [execution seam map](../audits/wave-13-execution-seam-map.md).
Off limits: unrelated code, treatment files, destructive database cleanup and any undeclared seam extension.
Shared files have one writer. Escalate ambiguities to the orchestrator before guessing semantics.

## Frozen requirements (verbatim)

1. Reproduce Guest promotion, authenticated Finish, Finish Anyway and Integrating outcomes. Record source ID,
   link choice, next route, visible IDs and whether a new execution was actually created.
2. Add an explicit completion/return presentation only after the existing public state confirms success.
   Offer return to the current questionnaire summary when available, or new questionnaire through the established
   reset workflow when no group is in scope; offer choose-another-treatment as the other main choice.
3. Open the shared catalog only on the EM's explicit choice. Keep catalog naming distinct from Personal Treatment
   Library; selecting a source remains the only trigger for a new Player session.
4. Integrating, Terminal No without sovereign completion, failed/uncertain persistence and pending promotion
   retain their truthful existing recovery routes. Never show a successful-completion card on request alone.
5. Preserve same-session receipt/replay guarantees on rerender/reload. A presentation return action cannot
   call Finish again, auto-link a group, create library variants or increment use counts.
6. Confirm the three exact seed IDs and overlays from the audit against the reproduced symptom.
   Retain their content, translations, SQL history, IDs and incoming references. Do not filter them out by title/ID.
7. Extend the evidence report with confirmed versus inferred behavior, source provenance and any remaining
   candidate inventory. If a true unwanted file/row is identified, report exact targets and references for a
   separate human decision; no cleanup command belongs in this ticket.


## Domain references

Read the ticket's cited DEC entries in full. Canonical terms remain Symptom Group, Symptom,
Polarity, Intensity, Event Manager and Inquiry Session; Questionnaire is presentation language only.
DEC-010: independent valence and magnitude; W13-D2 narrows initial entry to 1–10 only.
DEC-011: both prior dimensions hidden by default; explicit Reveal remains available for re-rating.
DEC-017: actual verified identity and persistence are distinct; never invent a joint answer to save a draft.

## Seam map excerpt

Read the 08 row of the execution seam map and the ticket's blocked-by edges.
UI reaches GroupEngine through contexts/composition; durable domain changes belong to public engine/port contracts.
Preserve inquiry generation, owner checks, stable IDs and retry serialization across transient mounts.
Resolve Must-fix risks in the active slice before reporting DoD complete.

## Execution contract

Use /implement and /tdd at the agreed seams. Read their local SKILL.md instructions.
Capture failing regression evidence before the fix; run focused tests as work progresses.
Run root npm run typecheck, npm run depcruise -w packages/pic-web, npm test, and affected lint/browser checks.
No live database row cleanup or treatment-content deletion. Use local test doubles unless a remote gate is authorized.
Before committing, provide the orchestrator the final diff and test evidence for independent Standards/Spec review.
Commit scoped passing work with [W13-08] in its message. Update Resolution for every AC and use Status: closed
only after the orchestrator confirms complete evidence. Never fabricate passes or waive tests silently.
Stop after this ticket; do not begin another ticket or modify sibling source ownership.

## Acceptance criteria (verbatim)

- [ ] **AC-01:** The reported experience is reproduced or its precise unreproduced limitation is recorded with source evidence.
- [ ]  **AC-02:** Successful Finish/Finish Anyway reaches a clear return surface rather than automatically exposing another
      catalog.
- [ ] **AC-03:** Another treatment/catalog opens only by explicit choice; no unsolicited Player session is started.
- [ ] **AC-04:** A failed, pending, uncertain or Integrating outcome is never announced as successful completion.
- [ ] **AC-05:** Return/reload/rerender does not repeat Finish, increment counts or create new library/timeline records.
- [ ] **AC-06:** Current questionnaire continuity, explicit linking and reset confirmations are preserved.
- [ ] **AC-07:** All treatment files, seed IDs, overlays and database rows remain intact; no hidden-ID cleanup is substituted.
- [ ] **AC-08:** Shared catalog and Personal Treatment Library are not conflated in copy or source selection.
- [ ] **AC-09:** The updated audit clearly separates confirmed routing behavior from candidate content and unverified live data.


## Out of scope (verbatim)

No treatment content file or database-row deletion, soft-delete/unpublish substitute, seed replacement,
hardcoded title/ID filtering, automatic treatment execution, Player semantic changes, or library/schema cleanup.
Any later deletion requires separate human approval of exact targets and impacts.

Implementation is authorized by the user; wait for prerequisites and serial dispatch.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.
