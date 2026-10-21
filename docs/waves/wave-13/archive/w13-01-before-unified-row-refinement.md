# W13-01 — Enter an untitled questionnaire and reach the joint test

**Status:** awaiting-human-review — implementation is not authorized.
**Specification:** [Approved Wave 13 charter](../specs/wave-13-spec.md).
**Blocked by:** None.
**Blocking:** [W13-02][relocation-link-1], [W13-04][relocation-link-2], [W13-05][relocation-link-3].
**Execution gate:** Human green light for the ticket suite, then completed prerequisites.
**Domain decisions:** DEC-002, DEC-010, DEC-011, DEC-014, DEC-017; W13-D2.

## Objective & Context

The Event Manager can immediately enter topics, optionally name the list, read the supplied preparation,
rate one topic at a time, and reach the joint-treatment question. This replaces the database-shaped name gate
with a complete usable entry journey, before priority editing is introduced.

Approved specification: questionnaire layout, progressive input and initial rating; W13-D2.
Canonical concepts remain Symptom Group, Symptom, Polarity and Intensity. Existing GroupEngine and persistence
contracts already allow an empty string title and 1–10 ratings; consume them through the existing composition seam.
This slice is independently demoable for Guest and a verified account's new locally staged unanswered group.

## What to Build / Exact Scope

1. Replace required name confirmation with **שאלון אבחון עצמי**, expanded supplied preparation text,
   **שם לרשימה (לא חובה)** and the first topic input directly beneath it. An empty list has no empty heading.
2. Keep title as an empty string when omitted; do not persist a fabricated label or introduce a Questionnaire entity.
   The initial title is submitted with first materialization; later title administration is outside this slice.
3. Add topics to a visible insertion-ordered list. Keep the next-topic input below the list, with
   **הוספת נושא נוסף** and **סיום והמשך** as the two main actions. No group is created merely by opening the page.
4. Accept pending nonblank input exactly once on either action; retain it on error. Blank Add focuses input;
   blank Finish with an existing list continues; an empty list stays in symptom entry.
5. Capture stable topic IDs and a submission ledger above transient screen mounts. An add that succeeded followed
   by a failed rate must retry rating for that ID, never add a duplicate. Reject stale inquiry-generation callbacks.
6. Let the EM finish listing before scoring. Finish enters an initial one-topic rating pass for unrated topics,
   then the joint question; already-rated lists proceed directly. Never persist an untouched default score.
7. Initial intensity is 1–10. Preserve independent polarity, the unrated timestamp signal and existing history.
   Generic re-rating stays 0–10 with explicit prior Reveal; negative and positive framing get accurate labels.
8. Remove entry/header total counters; retain meaningful priority numerals and scale endpoints.
   Use existing typed i18n and literal bidi isolation. Copy the charter's preparation exactly, including emoji.
9. Keep current Yes / No advisory finalization and authenticated unanswered-draft staging. Do not fake an answer
   to satisfy the existing server constraint. Reuse operation serialization and honest unsaved-work feedback.

## End-to-End Demonstration

Start as Guest, leave title empty, enter two topics and a pending third, choose Finish, explicitly rate
the three topics, and reach the exact joint question. Repeat with a verified account; show that the unanswered
draft stays locally unsaved and the actual answer is supplied before cloud anchoring.

## Acceptance Criteria

- [ ] **AC-01:** Opening the screen shows the first input immediately and creates no group or server row.
- [ ] **AC-02:** An omitted or whitespace-only title succeeds through entry, finalization and existing promotion contracts.
- [ ]  **AC-03:** The complete supplied Hebrew introduction is present and readable in the content card; it is not a required
      modal.
- [ ] **AC-04:** Add appends one topic, clears only accepted input and returns focus; duplicate text is allowed with distinct IDs.
- [ ] **AC-05:** Finish accepts a pending final topic once, rates any unrated topics, and reaches the joint question.
- [ ]  **AC-06:** Initial ratings require an explicit 1–10 response; independent polarity is retained; true historical zero is
      unchanged.
- [ ] **AC-07:** Add-success/rate-failure and double-submit paths preserve IDs and retry only unfinished work.
- [ ] **AC-08:** There are no entry total counters, no automatic priority inference, and no auto-submitted default rating.
- [ ] **AC-09:** Hebrew/English, RTL/LTR, keyboard input and narrow screens retain the two-action layout.
- [ ]  **AC-10:** Guest and verified-account entry preserve owner/generation checks, actual joint answers and existing save
      semantics.

## Testing Requirements

- Extend the existing symptom creation and localized symptom-flow suites through actual contexts/composition.
- Use GroupEngine contract evidence for empty names and 1–10 values; prove the generic 0–10 contract still passes.
- Browser cases: untitled entry, three topics including pending Finish input, blank input, polarity choice and retry.
- Failure injection: add succeeds/rate fails, storage rejects, rapid submit, reset while a callback is pending.
- Inspect text and accessible names; a hidden visual counter must not remain in a redundant live announcement.
- Do not wait for W13-09 to prove the entire entry-to-joint-question slice.

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

No priority schema, reorder RPC, general group rename UI, membership revision, full split management,
new auth mechanism, Player changes, automatic history rewrite, or text procedure invented from memory.
No treatment file or database row deletion. The practical muscle-testing adaptation belongs to W13-07.

The current preflight creates this document only. Do not execute its implementation steps until the user
approves the generated suite. Approval of the specification is not an instruction to start coding in this turn.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.

[relocation-link-1]: ../tickets/w13-02-durable-manual-priority.md
[relocation-link-2]: ../tickets/w13-04-reversible-questionnaire-and-recovery.md
[relocation-link-3]: ../tickets/w13-05-clean-summary-and-polarity-view.md
