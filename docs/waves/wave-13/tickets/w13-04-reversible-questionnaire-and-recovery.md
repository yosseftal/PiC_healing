# W13-04 — Navigate backward through the questionnaire without losing work

**Status:** awaiting-human-review — implementation is not authorized.
**Specification:** [Approved Wave 13 charter](../specs/wave-13-spec.md).
**Blocked by:** [W13-01][relocation-link-1], [W13-03][relocation-link-2].
**Blocking:** [W13-07](w13-07-welcome-text-guide-and-video.md), [W13-09](w13-09-integrated-journeys-and-wave-handoff.md).
**Execution gate:** Human green light for the ticket suite, then completed prerequisites.
**Domain decisions:** DEC-011, DEC-013, DEC-014, DEC-015, DEC-017, DEC-018.

## Objective & Context

The Event Manager can revisit every questionnaire step and return to the prior input without
resetting the inquiry, repeating successful writes or becoming trapped by a pending action.
This slice completes the reversible interaction journey, including the revision introduced by W13-03.

Wave 12 already has inquiry generation, owner-bound drafts, operation tracking and explicit reset.
Reusing those mechanisms avoids a second flow engine. Back is presentation navigation, not reset or undo.
The Unified Player retains Navigation Tree navigation and its established exit behavior.

## What to Build / Exact Scope

1. Lift title, pending topic text, active initial-rating input, member IDs, order, pending revision and return
   destination above individual screen mounts. Use the existing inquiry owner and generation as lifecycle keys.
2. Add a persistent accessible Back control in questionnaire screen chrome, outside the two primary decisions.
   Entry returns to introduction/prior entry; rating returns to prior topic/list; joint returns to list;
   advisory returns to joint; summary permits revisiting; selection returns to summary.
3. Preserve committed engine facts while changing the displayed questionnaire location. A screen revisit is not
   an unfinalize operation and does not revoke an actual prior answer for unchanged membership.
4. Serialize navigation with in-flight writes. Expose progress/recovery; avoid clearing input while a write
   settles. Suppress stale callbacks after reset or owner change using the established lifecycle.
5. Use the existing explicit new-inquiry/reset confirmation only for discarding work. Back never invokes it.
   Cancel/reset behavior and separate account/locale provider lifetime remain as delivered in Wave 12.
6. If application browser Back participates, route it through the same transition owner; never use browser
   history as the authoritative domain state. Preserve safe return from help overlays.
7. Version retained web drafts and show honest reload limits. Guest records retain established recovery;
   authenticated reload remains same-owner verified read-only where no public resume contract exists.
8. Remove any directional dead ends introduced by questionnaire navigation. Player manual Back/Skip/Done
   controls remain excluded, and external tab closure is not promised as cross-device draft preservation.

## End-to-End Demonstration

Type an unsubmitted next topic, move between rating, joint question and summary, open/close guidance,
then return to that input. Repeat while a save fails, during a locale switch and with a pending added-topic
revision. Every field remains, and saved records/use counts are unchanged.

## Acceptance Criteria

- [ ] **AC-01:** Every questionnaire location exposes the specified accessible Back destination.
- [ ] **AC-02:** Pending topic, optional title, active score input, IDs, priority and revision survive screen remounts.
- [ ] **AC-03:** Back performs no reset, deletion, archival, finalization, Finish or use-count mutation.
- [ ] **AC-04:** Pending writes settle or expose retry without losing the draft; stale callbacks cannot reopen discarded work.
- [ ] **AC-05:** New-inquiry discard still requires its established confirmation; cancellation restores original focus/work.
- [ ] **AC-06:** Locale changes and opening/closing help preserve the draft and return target.
- [ ] **AC-07:** Identity changes cannot show or submit another owner’s retained draft.
- [ ] **AC-08:** Reload limitations are truthful; no private engine hydration is added to claim unsupported resumption.
- [ ] **AC-09:** Player Navigation Tree and exit semantics remain unchanged.
- [ ] **AC-10:** Keyboard focus and reduced-motion transitions work in both text directions.

## Testing Requirements

- Table-driven navigation tests cover every backward edge and the corresponding forward return.
- App-level state assertions compare exact IDs, draft fields, ratings, answer revision and use count before/after.
- Reuse inquiry-reset and owner-lifecycle prior art; exercise write failure, owner switch and stale generation.
- Browser scenarios cover keyboard focus, locale changes and a narrow screen with the input keyboard area.
- Existing Player/reset/gate and promotion recovery regressions remain green.

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

No new router-owned therapeutic state machine, clearing all localStorage, forced sign-out, data deletion,
general authenticated group hydration, or Player navigation redesign. No change to DEC-018 replay semantics.

The current preflight creates this document only. Do not execute its implementation steps until the user
approves the generated suite. Approval of the specification is not an instruction to start coding in this turn.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.

[relocation-link-1]: w13-01-instant-questionnaire-and-initial-rating.md
[relocation-link-2]: w13-03-renewed-joint-answer-after-addition.md
