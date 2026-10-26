# W13-04 — Navigate backward through the questionnaire without losing work

**Status:** closed — 68 files / 711 real-schema tests and 26 Chromium journeys pass; both review axes pass.
**Specification:** [Approved Wave 13 charter](../specs/wave-13-spec.md).
**Blocked by:** [W13-01][relocation-link-1], [W13-03][relocation-link-2].
**Blocking:** [W13-07](w13-07-welcome-text-guide-and-video.md), [W13-09](w13-09-integrated-journeys-and-wave-handoff.md).
**Execution gate:** Authorized; complete prerequisites and wait for serial dispatch.
**Domain decisions:** DEC-011, DEC-013, DEC-014, DEC-015, DEC-017, DEC-018.
**Execution contract:** [Composition presentation and versioned recovery](../audits/w13-04-navigation-contract.md).

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

- [x] **AC-01:** Every questionnaire location exposes the specified accessible Back destination.
- [x] **AC-02:** Pending topic, optional title, active score input, IDs, priority and revision survive screen remounts.
- [x] **AC-03:** Back performs no reset, deletion, archival, finalization, Finish or use-count mutation.
- [x] **AC-04:** Pending writes settle or expose retry without losing the draft; stale callbacks cannot reopen discarded work.
- [x] **AC-05:** New-inquiry discard still requires its established confirmation; cancellation restores original focus/work.
- [x] **AC-06:** Locale changes and opening/closing help preserve the draft and return target.
- [x] **AC-07:** Identity changes cannot show or submit another owner’s retained draft.
- [x] **AC-08:** Reload limitations are truthful; no private engine hydration is added to claim unsupported resumption.
- [x] **AC-09:** Player Navigation Tree and exit semantics remain unchanged.
- [x] **AC-10:** Keyboard focus and reduced-motion transitions work in both text directions.

## Testing Requirements

- Table-driven navigation tests cover every backward edge and the corresponding forward return.
- App-level state assertions compare exact IDs, draft fields, ratings, answer revision and use count before/after.
- Reuse inquiry-reset and owner-lifecycle prior art; exercise write failure, owner switch and stale generation.
- Browser scenarios cover keyboard focus, locale changes and a narrow screen with the input keyboard area.
- Existing Player/reset/gate and promotion recovery regressions remain green.

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

No new router-owned therapeutic state machine, clearing all localStorage, forced sign-out, data deletion,
general authenticated group hydration, or Player navigation redesign. No change to DEC-018 replay semantics.

Implementation is authorized by the user; wait for prerequisites and serial dispatch.

## Resolution

### Solution and architectural decisions

Composition now owns reversible presentation, logical focus, return phase, normal-answer retry stages and summary priority intent.
The router renders that projection while preserving the existing forward facts and Player precedence.
Back visits preparation, list, actual joint question, advisory, summary and selection without clearing committed facts.
Unchanged forward navigation never answers or finalizes again. The existing horizontal primitive handles both directions
and reduced motion; persistent Back sits in chrome outside primary choices.
Preparation reuses supplied copy; W13-07 retains ownership of the full welcome and methodology guide.

Title, row IDs, text, rating selections, priority and pending membership survive remounts.
Normal joint answers use public GroupEngine calls in the existing staging seam, then one frozen aggregate save.
Lost responses retain the same values/timestamp/revision; successful answer persistence is not repeated when finalization retries.
Authenticated flushing retry accepts only the identical retained runtime aggregate with its expected revision advance.
Navigation waits for admitted writes without using reset's admission-closing drain; failed writes retain recovery.
Read-only catalog failure can return safely, and a newly admitted Player takes precedence over queued Back.

Handlers bind to semantic owner/status/revision, provider and generation, avoiding same-authority verification/load loops.
Identity suspension hides private panels before outgoing animation; genuine changes invalidate old handlers.
Guest work is not assigned to an account merely because its SDK identity is visible.
Version-1 bounded sessionStorage retains web fields and locations; validated never-attempted initial Guest fields may resume.
Attempted/revised/account recovery remains read-only where runtime retries cannot be reconstructed safely.
Malformed field/group/route combinations cannot authorize writes or jump past an actual answer.
If an older editable envelope cannot be replaced or invalidated, submission fails before any therapeutic write.

All implementation and UI tests remain inside pic-web. No engine, adapter, migration, dependency or treatment file changed.
There is no browser-history domain routing, general authenticated hydration, Player redesign or new therapeutic content.
The [implementation review](../audits/w13-04-implementation-review.md) records fixes, regression evidence and limits.

### Reviews and verified checks

Independent Standards and Spec reviews both pass, including the final recovery-context and semantic-authority patches.
Root `npm run typecheck`, `npm run lint` and `npm run depcruise --workspaces --if-present` pass.
Dependency graphs: engine 76 modules / 215 dependencies; web 785 / 1779, zero violations.
All changed/new text passes the Unicode 130-character check; wave links and whitespace checks pass.

Final Chromium: **26/26 pass**, production build included, 1.4 minutes, `--workers=2`.
Command: `npm run test:browser -w packages/pic-web --` followed by
`questionnaire-navigation.browser.test.ts membership-revision.browser.test.ts durable-priority.browser.test.ts`
`questionnaire.browser.test.ts wave12-journey.browser.test.ts inquiry-reset.browser.test.ts player-reset.browser.test.ts`.
The four new cases cover HE/EN × ordinary/reduced motion, score focus, advisory/help return, locale and narrow geometry.
Viewport height 420 simulates restricted input space; this is not physical keyboard/native-device verification.

Owner-local matrices pass 9 files / 132 tests and the later directly affected 3 files / 47 tests.
These overlap with each other and the complete suite; do not add them into an aggregate total.
Final exact root `npm test`: **68 files / 711 tests pass**, no failures or skips, 144.30 seconds.
The unchanged command includes the real Supabase adapter/web integrations and both dependency graphs.
Worker cap 2, approved controlled signup address and normal TLS were retained; the host runner supplied network access.
Read-only cleanup counts match baseline: profiles/groups/symptoms/treatments/Player/library/Timeline =
31/23/22/23/30/23/26. Only same-run UUID fixtures and Auth users were cleaned up.
The applied W13-03 migration remains unchanged, SHA-256:
`640ACFE68FC5F80BC764AF4F1CA236BD6B89E9A2836EA3C2EDE70FDBE61ADABD`.
No existing content, unrelated row or historical file was deleted.
Logs are ignored local artifacts: `.scratch/w13-04-quality-final.log`, `.scratch/w13-04-browser-final.log`
and `.scratch/w13-04-full-final.log`.

### Acceptance evidence mapping

| AC | Passing evidence |
| --- | --- |
| 01 | Rendered backward/forward journeys and browser controls cover preparation/list/joint/advisory/summary/selection. |
| 02 | Remount, locale and pending-revision tests retain exact fields, IDs, ratings, order and return focus. |
| 03 | Public group snapshots and write/count assertions remain unchanged across pure navigation. |
| 04 | Deferred Yes/finalize, frozen lost response, exact flushing retry, storage failure and stale-handler regressions. |
| 05 | Existing inquiry/Player reset suites and browser cancel/confirm journeys preserve original work and focus. |
| 06 | Both locales retain input and advisory dismissal/phase through preparation and utility changes. |
| 07 | Authenticated UI suspension/removal, other-owner rejection and fresh same-owner handlers preserve isolation. |
| 08 | Bounded parser/context validation, three malformed reboot cases and truthful read-only uncertain/account recovery. |
| 09 | Player-start precedence plus Player/reset/Gate/Finish regression journeys retain existing navigation and counts. |
| 10 | Four new Chromium cases verify keyboard focus and horizontal/reduced-motion behavior in HE/EN at narrow sizes. |

No therapeutic/domain approval was inferred. Later W13-07 content/embed and W13-09 physical/native checks remain separate.
Continue from the [verified checkpoint and W13-05 entry](../handoffs/w13-04-verified-and-w13-05-entry.md).
Reviewed implementation, final verification and closure are committed in `97cf3c3`.

[relocation-link-1]: w13-01-instant-questionnaire-and-initial-rating.md
[relocation-link-2]: w13-03-renewed-joint-answer-after-addition.md
