# W13-07 — Learn PIC through a welcome page, text guide and official video

**Status:** closed — approved fallback delivered; AC-01 deferred by explicit human decision, 2026-10-27.
**Specification:** [Approved Wave 13 charter](../specs/wave-13-spec.md).
**Blocked by:** [W13-04](w13-04-reversible-questionnaire-and-recovery.md).
**Blocking:** [W13-09](w13-09-integrated-journeys-and-wave-handoff.md).
**Execution gate:** Parallel implementation authorized by the latest user charter.
**Domain decisions:** DEC-001, DEC-015, DEC-017; W13-D5 and approved W13-07V.

## Objective & Context

A new Event Manager can understand PIC, access an approved Hebrew practical guide and play the official
demonstration, then enter or return to the questionnaire without losing work. This ticket includes the approved
W13-07V YouTube container; it is not a tenth ticket or a new treatment Player.

The user approved the official-video container and selected a proposed text adaptation of Sigal's
demonstration. The source is identified, but transcript export previously returned no transcript.
Approval of the feature/spec does not invent or approve unwritten physical instructions.
The content approval checkpoint is internal to this slice and precedes product integration.

## What to Build / Exact Scope

1. Prepare a source-checked Hebrew adaptation with timestamp references for actual physical steps, and concise
   welcome/background copy grounded in official PIC pages. Present the concrete copy for human approval.
   Preserve the user's exact questionnaire preparation; do not substitute it with the adaptation.
2. If the source cannot be transcribed/verified, retain the source link and draft structure, record the precise
   content blocker, and do not claim the practical-text AC complete. No invented technique or medical interpretation.
3. Implement the welcome surface with **לתחילת השאלון** and **על השיטה ומבחן השרירים** as the two primary choices.
   Existing active work, Player, verification and persistence recovery take precedence over first-run welcome.
4. Provide freely accessible, skippable educational text and a drawer entry to revisit it. Return to the exact
   invoking questionnaire step using W13-04's lifecycle; reading is not a persistence or treatment event.
5. Embed the verified official YouTube source using a click-to-load container, normal playback controls,
   no autoplay, a localized title and an external source-link fallback. Verify actual embed permission.
6. Stop/unmount playback when leaving or closing the guide. Do not collect viewing completion, use count,
   Timeline events or therapeutic state from video activity.
7. Keep the approved text usable without the external video/network after application assets are available.
   Show a calm unavailable-video fallback; do not block the questionnaire when YouTube is unreachable.
8. Use typed Hebrew/English content, stable section IDs and provenance. Confirm any caption track before
   promising it; an approved text alternative remains required. English fallback must identify its actual language.
9. Test keyboard focus across the embed, narrow-screen dimensions, zoom, return controls and reduced motion.
   Respect the production artifact boundary; do not package an MP4 or add offline media caching.

## End-to-End Demonstration

Open the app with no inquiry, read the welcome, start a topic draft, revisit the guide and activate the
official video. Close it and show the unchanged input. Repeat with the video blocked/offline and with a pending
authentication return, which must retain routing precedence.

## Acceptance Criteria

- [ ] **AC-01:** A source-verified practical Hebrew adaptation is explicitly approved before being shipped.
- [x] **AC-02:** Welcome explains purpose, available actions and Sigal’s background with traceable copy provenance.
- [x] **AC-03:** Education remains free, skippable and revisitable without an account or therapeutic completion event.
- [x] **AC-04:** Active inquiry/Player/persistence recovery is never replaced by onboarding.
- [x] **AC-05:** The W13-07V container plays the official source only after activation and actual embedding is verified.
- [x] **AC-06:** Playback stops on close/leave; the exact questionnaire draft and return location survive.
- [x] **AC-07:** Blocked/unavailable video has a source-link fallback and never blocks text or questionnaire use.
- [x] **AC-08:** No captions, translation or physical instructions are claimed without verification/approval.
- [x] **AC-09:** Hebrew/English, keyboard focus, small-screen sizing and screen-reader frame naming are usable.
- [x] **AC-10:** No bundled video, custom player infrastructure, treatment metadata or tracking events are introduced.

## Testing Requirements

- Content review artifact: source timestamps, adapted text, exact approved revision and approver/date.
- App route cases: fresh welcome; active draft; active Player; pending gate/verification; help return.
- Browser tests verify click-to-load, no initial iframe/network load, teardown and retained draft.
- Controlled provider failure for offline/block cases; separately record real embed playback evidence.
- Check focused keyboard access, minimum player dimensions, bilingual labels and text fallback.
- Unit tests cannot substitute for reviewing the actual procedure or verifying external playback.

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

No custom streaming stack, video download/redistribution, offline media cache, autoplay, CMS,
view tracking, Unified Player instance, therapeutic completion marker, new clinical claims or invented instructions.
Do not weaken the production output allowlist to admit an arbitrary media asset.

Implementation is authorized; parallel dispatch and integration ownership are recorded in the convergence audit.

## Resolution

### Solution path and approval

Implemented approved r1 introductions, first-run welcome, free revisitable guide and the W13-07V click-to-load container.
See [copy approval](../audits/w13-07-copy-review.md) and [integration review](../audits/w13-07-08-implementation-review.md).
On 2026-10-27 the user explicitly instructed the Scope Item 2 / AC-08 fallback: keep AC-01 pending verified transcript/copy
and continue toward W13-09. This does not claim a physical procedure, captions or a translated track was approved.

### Acceptance evidence

- AC-01: PENDING verified practical transcript/copy; no unverified physical instructions shipped.
- AC-02: exact approved r1 paragraphs carry official-source provenance and approval revision.
- AC-03: welcome has two primary choices; the free drawer guide creates no therapeutic completion event.
- AC-04: actual router facts and recovery precedence guard fresh welcome; public eligibility precedes load side effects.
- AC-05: exact pinned source; real local embedded playback observed at 0:22 / 5:16, plus controlled browser activation cases.
- AC-06: guide return retains draft/location, removes iframe and restores the available invoking drawer control.
- AC-07: controlled blocked-video cases retain the external source link and text/questionnaire access.
- AC-08: the approved fallback is explicit; no invented procedure, caption promise or unapproved translation.
- AC-09: Hebrew paragraph language/direction, English controls, focus and narrow geometry are covered by automated checks.
  Native accessibility/mobile results remain a separate W13-09 closure gate.
- AC-10: no bundled media, custom Player, view tracking, therapeutic metadata or count/Timeline write.

### Test and review evidence

Focused integration 4 files / 24 tests passed. Real embed evidence and independent review are linked above.
Full final npm test passed: 75 files / 787 tests, zero failures or skips, 204.89s, exit 0.
All-workspace dependency checks passed: engine 76 modules / 215 dependencies; web 807 / 1887.
Root typecheck and lint passed. Full Chromium and production build passed: 203/203 cases, 5.6m, exit 0.
Logs: .scratch/w13-parallel-root-final.log, -typecheck-final.log, -lint-final.log; .scratch/w13-browser-verified.log.
The runtime was frozen for the browser pass; subsequent changes only adapt Vitest entry helpers and documentation.
Closure applies to the explicitly accepted fallback scope; AC-01 remains unchecked and pending verified practical copy.
The optional education entry preserves the shared Frame's provider boundary.
