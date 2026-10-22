# W13-01 — Enter, rate and prioritize topics in unified draft rows

**Status:** closed — unified-row implementation verified 2026-10-22.
**Specification:** [Approved Wave 13 charter](../specs/wave-13-spec.md).
**Blocked by:** None.
**Blocking:** [W13-02][relocation-link-1], [W13-04][relocation-link-2], [W13-05][relocation-link-3].
**Execution gate:** Authorized; complete prerequisites and wait for serial dispatch.
**Domain decisions:** DEC-002, DEC-010, DEC-011, DEC-014, DEC-017; W13-D2.

## Objective & Context

The Event Manager edits topic names, initial intensity and priority together in one local questionnaire.
The user's 2026-10-21 refinement supersedes the earlier list-then-rating pass, preserved in the wave archive.
Each row contains a text input, explicit 1–10 selector and move-up/down controls; polarity stays independent.
The optional list title and all editable rows remain web-owned drafts until Finish & Continue.

## What to Build / Exact Scope

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

## End-to-End Demonstration

Open an untitled questionnaire, enter and rate two topics, add a third blank row, and complete it.
Move the third topic above the first, then Finish. The exact ordered names and ratings are committed together,
and the actual joint question appears immediately. Repeat with an account and failed submission/retry.

## Acceptance Criteria

- [x] **AC-01:** Opening shows optional title and the first unified row without creating any group or server row.
- [x] **AC-02:** Omitted/whitespace-only titles survive entry, finalization and existing promotion as an empty string.
- [x] **AC-03:** Full supplied Hebrew preparation is readable in the content card with exact wording and emoji.
- [x] **AC-04:** Add appends a blank editable row with stable identity; duplicate names remain distinct; focus follows Add.
- [x] **AC-05:** Finish validates all rows, commits their complete snapshot and goes directly to the actual joint question.
- [x] **AC-06:** Every initial score is explicit 1–10; polarity stays independent; generic re-rating/history retain true0–10.
- [x] **AC-07:** Failed staging/flush, retry, double-submit and reset preserve IDs or reject stale work
  without partial publication.
- [x] **AC-08:** Draft reorder preserves names/scores/IDs/focus, announces priority and exposes no total counters.
- [x] **AC-09:** Hebrew/English, RTL/LTR, keyboard and narrow screens support unified rows and the two main actions.
- [x] **AC-10:** Guest/account paths keep owner/generation checks, local unanswered staging, actual Yes/No and save semantics.

## Testing Requirements

- TDD regression: unified rows and inline rating, local edits/reordering without engine persistence, direct joint continuation.
- Public composition evidence: optional/blank name, ordered rated rows flushed once, duplicate names with stable IDs.
- Inject build/save failure, lost response/retry, repeated Finish, reset and changed owner; verify no partial published group.
- Prove the draft survives transient mounts and preserves the frozen submission while recovery is pending.
- Retain generic blind0–10 and prior Reveal tests, including real historical zero and positive/negative framing.
- Browser: untitled three-row form, Add blank row, validation, keyboard reorder/focus, narrow RTL/LTR and actual joint Yes/No.
- Update existing journey fixtures for unified-row entry without weakening their auth, reset or persistence assertions.
- Run root npm run typecheck, npm run depcruise -w packages/pic-web, npm test, affected lint and browser checks.

The user authorized cleanup only of fixtures/auth users created in the same test run, by that run's UUIDs.
This includes test-treatment fixtures; existing content/data and unrelated rows remain protected.
No treatment-content file deletion is authorized. W13-01 changes no persistence contracts or schema.

## Definition of Done

- Every AC is mapped to concrete passing evidence in Resolution, including the revised unified-row demonstration.
- Required quality gates and focused browser checks pass on the final reviewed diff.
- Existing ownership, Dumb Reflection, blind re-rating and EM Sovereignty contracts remain intact.
- All implementation stays inside pic-web; W13-02 remains responsible for durable cross-adapter priority.
- Independent Standards/Spec review findings are resolved; any manual/environment limitation is reported honestly.
- A scoped [W13-01] commit and current index/handoff record the actual closed or in-progress state.

## Do Not Touch / Out of Scope

No priority schema, persisted reorder RPC, general group rename UI, membership revision, full split management,
new auth mechanism, Player changes, automatic history rewrite, or text procedure invented from memory.
No treatment file or existing database row deletion. Only explicitly authorized same-run fixture cleanup is permitted.
The practical muscle-testing adaptation belongs to W13-07.

Implementation is authorized by the user; execute only this ticket before its downstream dependencies.

## Resolution

### Solution path and architectural decisions

The approved unified-row refinement replaces the archived list-then-rating pass.
Questionnaire drafting lives in the web composition layer and survives transient screen mounts.
Each stable row contains its name, explicit score, independent polarity and accessible priority controls.
Finish validates every row, freezes the request and runs the existing GroupEngine against a web-only staging decorator.
Intermediate writes are buffered under the existing exclusive-operation barrier. One complete snapshot is flushed
before publishing an active group or moving directly to the actual joint question.
Failed flush retries retain group/symptom IDs and values; owner/provider/generation guards reject stale continuations.
Authenticated unanswered work uses the existing local envelope and only anchors after a real joint Yes/No.
No engine, adapter, schema, Player or treatment-content changes were made.

### Acceptance evidence

Source/test paths below are relative to packages/pic-web.

- AC-01: src/questionnaire-submission.test.tsx validates untouched/blank rows with zero provider saves and no active group.
- AC-02: src/symptom-group-create-screen.test.tsx covers omitted title; whitespace title is covered in submission tests.
  src/happy-path-e2e.test.tsx verifies actual cloud promotion returns name=""; src/returning-identity.test.ts
  verifies a blank-title authenticated questionnaire stays local, then saves once with the actual joint answer.
- AC-03: Exact supplied Hebrew preparation is in src/i18n/core-messages.ts and was checked in independent Spec review.
  tests/questionnaire.browser.test.ts and localized creation cases exercise the scrollable bilingual screen.
- AC-04: Submission tests cover Add focus, blank-row retention, duplicate names, distinct IDs and transient remounts.
- AC-05: Submission/browser cases validate all rows, observe one complete provider write and immediate joint continuation.
  New browser fixtures observe the real provider-save boundary rather than only counting old UI action wrappers.
- AC-06: Selectors have no default score or zero option. Positive and negative framing have distinct endpoint copy.
  Existing RatingControl tests retain 0–10 and explicit Reveal; retained zero/timestamp preservation is tested.
- AC-07: Submission tests inject staging failure, rejected flush, lost response, duplicate Finish, generation replacement
  and provider switching. Retry writes the same full snapshot; no partial active group is published.
- AC-08: Submission and browser tests verify stable row identity/data, priority announcements and disabled boundaries.
  Move focus remains on the activated button, with an enabled opposite-button fallback at a boundary. No entry totals.
- AC-09: Bilingual browser cases exercise 320px geometry, input/keyboard focus, independent polarity and two main actions.
  Hebrew 320px screenshot inspected; existing document viewport and internal-scroll boundaries remain intact.
- AC-10: Actual remote happy path covers Guest through promotion. Returning-identity tests cover authenticated local
  staging and real-answer anchoring. Existing ownership, auth, reset and promotion tests pass in the full root gate.

### Quality gates

- npm run typecheck: all workspaces pass.
- npm run depcruise -w packages/pic-web: zero violations, 769 modules / 1672 dependencies.
- npm test with VITEST_MAX_WORKERS=2 and the previously approved controlled signup address:
  56 files / 578 tests pass in 92.74s, followed by zero dependency violations in engine and web.
- npm run lint: passes. Temporary documentation helpers were preserved in workspace cache outside application lint inputs.
- Focused final submission/composition run: 39/39 pass; retained Player reset matrix: 8/8 pass.
- Targeted Chromium: 43 cases pass across the final 32-case rerun and 11 unaffected cases from the preceding run.
  The runner builds production assets before executing. No browser retries or application assertions were weakened.
- Changed files pass 130-character and git whitespace checks.

The first full gate had 568/578 passes: nine old test assumptions needed migration to optional-title/unified rows,
and the registration process lacked its required test-only address. These were corrected, then the exact full gate passed.
The first browser run similarly exposed stale labels/status selectors and a real retained-dirty-marker regression.
The marker now clears after local materialization; the final authenticated-reset cases pass without waiving confirmation.

### Reviews, boundaries and carry-forward

Independent Standards review passed. Spec review's legacy-unrated continuation and move-focus findings were fixed
and re-reviewed with no new blocker. See [review record](../audits/w13-01-implementation-review.md).
Nonempty legacy lists continue without rating/timestamp rewrites; no private GroupEngine hydration was added.
Physical-device/native-screen-reader evidence remains a W13-09 manual gate, not an automated claim here.
Initial draft order is local; durable cross-adapter order and promotion compatibility remain W13-02.
Same-run remote fixtures were cleaned under explicit user permission; no preexisting content deletion was authorized.
Implementation commit: `8443a35`. See the [checkpoint handoff](../handoffs/w13-01-checkpoint.md) for the exact resume point.

[relocation-link-1]: w13-02-durable-manual-priority.md
[relocation-link-2]: w13-04-reversible-questionnaire-and-recovery.md
[relocation-link-3]: w13-05-clean-summary-and-polarity-view.md
