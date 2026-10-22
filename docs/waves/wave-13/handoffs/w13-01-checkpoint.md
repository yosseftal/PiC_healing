# Wave 13 checkpoint after W13-01

**Date:** 2026-10-22 (Asia/Jerusalem).
**Completed:** W13-01, all ten ACs and its DoD verified.
**Implementation commit:** `8443a35`.
**Scope/authorization record:** `316eeb9`.
**Active uncommitted implementation:** none.
**Exact next ticket:** [W13-02 durable manual priority](../tickets/w13-02-durable-manual-priority.md).

## Delivered

The self-diagnosis questionnaire now opens with an optional title and a blank unified topic row.
Each row has a name, explicit 1–10 score, independent polarity and accessible up/down priority controls.
Add appends a blank local row. Finish validates every row, commits one complete local snapshot through
the existing GroupEngine/composition seam, and goes directly to the actual joint-treatment muscle test.
The exact supplied Hebrew preparation remains available in the internally scrolling card.

Stable local rows survive transient mounts. Frozen group/symptom IDs survive rejected/lost-response flush retries.
Owner, provider and inquiry-generation checks reject stale continuations. No partial group is published.
Authenticated unanswered work retains the existing local unsaved envelope until an actual joint answer anchors it.
Generic blind 0–10 re-rating, real historical zero, retained legacy continuation and Player semantics remain intact.

## Verified gates

- Root npm run typecheck: all workspaces pass.
- Root npm run lint: passes.
- npm run depcruise -w packages/pic-web: zero violations; 769 modules / 1672 dependencies.
- Exact root npm test: 56 files / 578 tests pass, followed by engine/web dependency checks with zero violations.
  Process-only VITEST_MAX_WORKERS=2 and the previously approved controlled registration address were supplied.
  Normal TLS verification remained enabled; no skipped tests or weakened assertions.
- Targeted Chromium: 43 passing cases across the final 32-case rerun and 11 unaffected cases from the preceding run.
  Production build is part of the browser global setup. Narrow Hebrew/English, validation, retry, reorder, actual
  joint Yes/No, promotion, reset and existing blind-rating journeys are covered.
- Final focused submission/composition: 39/39; local Player-reset matrix: 8/8.
- Independent [Standards and Spec reviews](../audits/w13-01-implementation-review.md): no unresolved blocker.
- Hebrew 320px screenshot visually inspected. Changed-file 130-character and Git whitespace checks pass.

Earlier gate failures were corrected before the final full pass: old single-textbox/group-name assumptions,
a missing process-only signup address, outdated browser labels/status selectors, move-button focus, legacy
unrated continuation and a form dirty marker incorrectly retained after successful materialization.
The [ticket Resolution](../tickets/w13-01-instant-questionnaire-and-initial-rating.md) maps every AC to evidence.

## Data protection

The user explicitly approved deleting only fixtures/Auth users created in the same test run by that run's UUIDs.
No preexisting data or treatment file was selected for deletion. No migration was applied.
Post-test read-only schema/connectivity checks pass. Row counts match the preflight observation:
profiles 31, symptom_groups 23, symptoms 22, treatments 23, player_sessions 30,
personal_treatment_library 23, timeline_events 26. Matching counts are a cleanup check, not a content-level audit.
Existing logs and documentation remain preserved; temporary authoring helpers were moved into the workspace cache.

## Resume W13-02

User authorization to execute the suite remains in effect. No renewed implementation permission is needed.
Start at the master/wave index, then read W13-02, its brief and the execution seam map.
W13-01's local draft reorder already works. W13-02 owns durable committed order through GroupEngine, RepositoryPort,
both adapters, additive schema/RPC changes and Guest promotion, including legacy frozen-payload compatibility.
Keep its owner/revision/complete-membership validation and concurrent-writer discipline in one bounded slice.

Prepare reviewable additive SQL and red contract evidence before the established manual migration-application
checkpoint. Do not edit already-applied migrations, infer permission to delete existing rows, or hydrate private engine state.
The same-run fixture-cleanup authorization remains narrower than permission to delete existing treatment content/data.
W13-03 follows W13-02; the authorized serial order then continues 04 through 09.

This is the clean context checkpoint requested by the user, before the larger cross-package persistence slice.
W13-02 has not started. Physical-device/native Hebrew screen-reader evidence and full final-wave browser coverage
remain W13-09 gates; the prior-wave manual-QA waiver was not inherited.
