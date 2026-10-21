# W13-01 isolated implementation brief

## Identity and authorization

Ticket: [W13-01](../tickets/w13-01-instant-questionnaire-and-initial-rating.md).
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

1. Show **שאלון אבחון עצמי**, the exact expanded preparation, **שם לרשימה (לא חובה)** and a first blank topic row.
   Opening or editing the questionnaire creates no domain group or server row. A blank title serializes as an empty string.
2. Each stable-ID row owns its name, explicit initial 1–10 choice and independent polarity input.
   Negative intensity uses interference/suffering endpoints; positive intensity uses strength-of-positive-experience wording.
   Never assign an untouched default rating. Generic blind re-rating remains 0–10 with explicit Reveal.
3. **הוספת נושא נוסף** appends a new blank row and focuses its name input. It does not save the preceding row.
   Duplicate names are allowed with different IDs. Keep editing and keyboard priority changes local to the draft.
4. Move-up/down buttons preserve row identity, text, selected rating and focus, announce the changed priority,
   and disable impossible boundary moves. Display priority numerals without total counters; dragging is optional.
5. **סיום והמשך** validates every row and moves directly to the actual joint-treatment muscle test after submission.
   Missing names or initial scores keep the draft visible with localized guidance; do not silently drop blank rows.
   There is no separate initial-rating screen or pass. Retain exactly two main actions beneath the row list.
6. Commit the complete optional title, names, explicit ratings and current order as one local snapshot.
   Use existing GroupEngine validation through the composition seam, staging intermediate operations in pic-web.
   Publish the active group only after successful submission; components cannot call a repository directly.
7. Retain the frozen submission and accepted IDs for retries. A failed stage/flush exposes no partial published group;
   double submission cannot duplicate topics. Reject stale generation/owner callbacks and preserve drafts across remounts.
8. Atomicity here covers the new questionnaire's local commit. Verified accounts retain the existing locally unsaved,
   unanswered staging; actual Yes/No is required before cloud anchoring. Cloud ordering/migrations remain W13-02.
9. Preserve existing finalized/previously rated groups, historical zero, rating timestamps, auth and promotion contracts.
   Do not hydrate private engine fields or rewrite old records to make the new initial-entry presentation work.
10. Use typed Hebrew/English copy, literal bidi isolation, responsive rows, the 100dvh frame and internal card scrolling.
    The exact supplied Hebrew preparation remains unchanged even though inputs are now unified per row.


## Domain references

Read the ticket's cited DEC entries in full. Canonical terms remain Symptom Group, Symptom,
Polarity, Intensity, Event Manager and Inquiry Session; Questionnaire is presentation language only.
DEC-010: independent valence and magnitude; W13-D2 narrows initial entry to 1–10 only.
DEC-011: both prior dimensions hidden by default; explicit Reveal remains available for re-rating.
DEC-017: actual verified identity and persistence are distinct; never invent a joint answer to save a draft.

## Seam map excerpt

Read the 01 row of the execution seam map and the ticket's blocked-by edges.
UI reaches GroupEngine through contexts/composition; durable domain changes belong to public engine/port contracts.
Preserve inquiry generation, owner checks, stable IDs and retry serialization across transient mounts.
Resolve Must-fix risks in the active slice before reporting DoD complete.

## Execution contract

Use /implement and /tdd at the agreed seams. Read their local SKILL.md instructions.
Capture failing regression evidence before the fix; run focused tests as work progresses.
Run root npm run typecheck, npm run depcruise -w packages/pic-web, npm test, and affected lint/browser checks.
No live database row cleanup or treatment-content deletion. Use local test doubles unless a remote gate is authorized.
Before committing, provide the orchestrator the final diff and test evidence for independent Standards/Spec review.
Commit scoped passing work with [W13-01] in its message. Update Resolution for every AC and use Status: closed
only after the orchestrator confirms complete evidence. Never fabricate passes or waive tests silently.
Stop after this ticket; do not begin another ticket or modify sibling source ownership.

## Acceptance criteria (verbatim)

- [ ] **AC-01:** Opening shows optional title and the first unified row without creating any group or server row.
- [ ] **AC-02:** Omitted/whitespace-only titles survive entry, finalization and existing promotion as an empty string.
- [ ] **AC-03:** Full supplied Hebrew preparation is readable in the content card with exact wording and emoji.
- [ ] **AC-04:** Add appends a blank editable row with stable identity; duplicate names remain distinct; focus follows Add.
- [ ] **AC-05:** Finish validates all rows, commits their complete snapshot and goes directly to the actual joint question.
- [ ] **AC-06:** Every initial score is explicit 1–10; polarity stays independent; generic re-rating/history retain true0–10.
- [ ] **AC-07:** Failed staging/flush, retry, double-submit and reset preserve IDs or reject stale work
  without partial publication.
- [ ] **AC-08:** Draft reorder preserves names/scores/IDs/focus, announces priority and exposes no total counters.
- [ ] **AC-09:** Hebrew/English, RTL/LTR, keyboard and narrow screens support unified rows and the two main actions.
- [ ] **AC-10:** Guest/account paths keep owner/generation checks, local unanswered staging, actual Yes/No and save semantics.


## Out of scope (verbatim)

No priority schema, persisted reorder RPC, general group rename UI, membership revision, full split management,
new auth mechanism, Player changes, automatic history rewrite, or text procedure invented from memory.
No treatment file or existing database row deletion. Only explicitly authorized same-run fixture cleanup is permitted.
The practical muscle-testing adaptation belongs to W13-07.

Implementation is authorized by the user; execute only this ticket before its downstream dependencies.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.

[relocation-link-1]: w13-02-durable-manual-priority.md
[relocation-link-2]: w13-04-reversible-questionnaire-and-recovery.md
[relocation-link-3]: w13-05-clean-summary-and-polarity-view.md
