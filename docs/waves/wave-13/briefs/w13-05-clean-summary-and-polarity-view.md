# W13-05 isolated implementation brief

## Identity and authorization

Ticket: [W13-05](../tickets/w13-05-clean-summary-and-polarity-view.md).
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

1. Render a title only when one was supplied; use a neutral localized navigation label for an untitled list.
2. Show topic text and manual priority distinctly from rating. In Hebrew put priority at the right/start side
   and intensity at the left/end side with explicit labels; mirror logical layout in English.
3. Remove total-topic counters from entry/summary headers, progress slots and redundant live announcements.
4. Offer manual/polarity view in utilities. Polarity sections are Negative, Positive and Unrated when needed;
   stable manual ordering remains within each section and original priority numbers remain visible.
5. The view selector performs no persistence write. Restore manual view before enabling reorder controls.
   Do not infer treatment urgency from valence, score, topic name, section position or color.
6. On entering a fresh re-rating action, suppress adjacent prior values, badges and polarity grouping,
   including hidden DOM/accessibility labels. Use existing explicit Reveal and keep re-rating 0–10.
7. Preserve one active rating interaction and current unrated semantics. Display existing zero as a real
   score when rated_at confirms it; never confuse it with an unrated placeholder.
8. Scope presentation changes to the existing summary/rating seams and typed i18n, not a new analytics subsystem.


## Domain references

Read the ticket's cited DEC entries in full. Canonical terms remain Symptom Group, Symptom,
Polarity, Intensity, Event Manager and Inquiry Session; Questionnaire is presentation language only.
DEC-010: independent valence and magnitude; W13-D2 narrows initial entry to 1–10 only.
DEC-011: both prior dimensions hidden by default; explicit Reveal remains available for re-rating.
DEC-017: actual verified identity and persistence are distinct; never invent a joint answer to save a draft.

## Seam map excerpt

Read the 05 row of the execution seam map and the ticket's blocked-by edges.
UI reaches GroupEngine through contexts/composition; durable domain changes belong to public engine/port contracts.
Preserve inquiry generation, owner checks, stable IDs and retry serialization across transient mounts.
Resolve Must-fix risks in the active slice before reporting DoD complete.

## Execution contract

Use /implement and /tdd at the agreed seams. Read their local SKILL.md instructions.
Capture failing regression evidence before the fix; run focused tests as work progresses.
Run root npm run typecheck, npm run depcruise -w packages/pic-web, npm test, and affected lint/browser checks.
No live database row cleanup or treatment-content deletion. Use local test doubles unless a remote gate is authorized.
Before committing, provide the orchestrator the final diff and test evidence for independent Standards/Spec review.
Commit scoped passing work with [W13-05] in its message. Update Resolution for every AC and use Status: closed
only after the orchestrator confirms complete evidence. Never fabricate passes or waive tests silently.
Stop after this ticket; do not begin another ticket or modify sibling source ownership.

## Acceptance criteria (verbatim)

- [ ] **AC-01:** Untitled lists render cleanly without a fabricated persisted name or empty heading.
- [ ] **AC-02:** Manual priority is the default and is visually/accessibly distinguishable from intensity.
- [ ] **AC-03:** No total-item counters remain on affected list surfaces; meaningful priority/scale values remain.
- [ ] **AC-04:** Polarity view groups correctly with stable manual order and original priority numbers.
- [ ] **AC-05:** Changing view neither persists new order nor calls rating or Reveal actions.
- [ ] **AC-06:** Reorder controls operate only against manual order.
- [ ] **AC-07:** Blind re-rating hides prior polarity/intensity and grouping from both visible and accessible content.
- [ ] **AC-08:** Explicit Reveal still works, re-rating accepts 0–10, and actual historical zeros remain unchanged.
- [ ] **AC-09:** Long Hebrew/English topic labels remain readable without document overflow or extra main actions.


## Out of scope (verbatim)

No automatic sorting of persisted priority, score-derived urgency, bulk rating, analytics, rewriting
history, removing library use counts, group archival, treatment editing or database changes.

Implementation is authorized by the user; wait for prerequisites and serial dispatch.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.
