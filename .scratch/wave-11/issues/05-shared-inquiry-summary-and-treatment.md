# 11.5 — Shared Inquiry, Summary, and Treatment Selection

**What to build:** An Event Manager moves through joint-treatment testing, Symptom Group summary, and
treatment selection in either language. Each screen offers the shared utilities within one bounded viewport,
while routing, voluntary group linking, personal wording, and treatment identities remain unchanged.

**Blocked by:** [11.2 — Dynamic RTL Layout and Motion](02-dynamic-rtl-layout-and-motion.md).

**Status:** done

**Dispatch state:** Implemented and verified; orchestrator review pending.

**Source:** [Approved Wave 11 specification](../../../docs/specs/wave-11-i18n-spec.md), sections 2, 3.3–3.5, 4, and 6.2.

**Spec coverage:** AC-04–05, AC-08–09, AC-11, AC-17–18, AC-20–21, AC-24–25.

## Context Injection (verbatim)

> Adoption does not change route selection or form submission. Tertiary actions move to utilities when needed to keep
> the main action area within its existing two-choice contract.

> Translate complete messages, including Sheet close/content labels and state announcements. Avoid assembling phrases
> by concatenating English fragments or lowercasing a translated title. Interpolate names as escaped text and isolate them
> bidirectionally. Format any displayed counts/dates using the selected locale; persisted numbers and timestamps stay unchanged.

## External Prerequisites

Spec OQ-01/OQ-02/OQ-05: Approved joint-treatment question/responses, summary/counts, picker/linking controls,
recovery/Zero-H3 messages, and assistive copy in both locales. Reuse shared utility copy already approved upstream.
Translated treatment titles/bodies and their official provenance remain the separate prerequisite of 11.7.

## Owned Slice and Integration Boundary

- Own joint-treatment testing, group summary, treatment picker shell/control presentation, feature dictionaries, and tests.
- Adopt 11.2's frame/Sheet composition and 11.1's shared selector; do not implement a second routing or locale authority.
- Preserve catalog/content/context reads and canonical picker selection. Prepare the localized picker presentation
  for 11.7's validated title overlays; current source titles remain authored content rather than UI dictionary values.
- This ticket can be tested using existing group fixtures independently of 11.4; creation/rating presentation belongs there.

## Acceptance Criteria

- [ ] TB-01: Joint-treatment question, group summary, and treatment picker each render one bounded frame with
      shared Sheet language access in both locales. Switching keeps the current screen, focus context, and draft selection.
- [ ] TB-02: Approved full-message dictionaries cover each screen's headings, binary actions, summary/count forms,
      voluntary linking control, recovery/Zero-H3 states, and accessible names, with exact key/parameter/plural parity.
- [ ] TB-03: Joint-treatment response and group-finalization calls retain the same domain payloads and timing.
      Switching does not answer a question, finalize/split a group, or change derived routing facts.
- [ ] TB-04: Group/symptom names and other personal values remain unchanged, escaped, and bidirectionally isolated.
      Display counts use locale-appropriate forms; stored numbers and timestamps remain untouched.
- [ ] TB-05: Treatment selection retains the same catalog IDs, canonical parsed unit IDs, empty-source guard,
      and existing start-session action. UI localization never reparses translated labels into navigation identities.
- [ ] TB-06: Voluntary group linking is preserved across language changes, remains an EM choice, and is never
      silently enabled. Existing linked-group and standalone selection payloads are unchanged.
- [ ] TB-07: Main therapeutic actions remain within the two-choice contract. Long summaries/catalog content
      scroll internally; actual Hebrew/mixed labels preserve readable contrast, visible focus, and 44px minimum targets.
- [ ] TB-08: Recovery actions retain their meaning; in-flight reads/actions settling after selection display
      current-locale system messages with no duplicate calls, new clinical choices, or state reset.
- [ ] TB-09: Integration tests demonstrate joint testing through summary and picker into a canonical Player
      session using existing fixtures; switching alone invokes no therapeutic actions. Browser tests cover each adopted screen.
- [ ] TB-10: Approved dictionary coverage and scoped tests/checks pass, with a web-only implementation diff.
      The slice is complete without claiming translated treatment guidance before 11.7 lands.

## Isolation Bounds / Do Not Touch

All implementation, dictionaries, styling, configuration, and UI tests stay inside `packages/pic-web`.
Only this ticket markdown may receive later Resolution; the spec and sibling tickets remain read-only.
Zero edits to `packages/pic-engine`, adapters, RepositoryPort, schemas/migrations, seed content, domain tests, or root lockfile.
No new inquiry rules, automatic linking, treatment content translation, source-parser changes, or auth/course workflows.
Shared layout is owned by 11.2; localized content overlays belong to 11.7.

## Verification and Completion Evidence

Use existing joint-treatment/group-summary/catalog/content action seams and real adopted screen composition.
Run affected unit/integration/browser tests, root typecheck, web depcruise/build, lint, line-length and scope checks.
Later Resolution must address TB-01–TB-10 and record unchanged domain payloads and approved copy references.

## Resolution

Implemented 2026-10-11; verification completed 2026-10-12. Hebrew UI copy uses the product approval of
2026-10-11 recorded in the execution brief and seam map; newly authored copy is not a website quotation.

- **TB-01:** All three screens, including summary loading, use one bounded TherapeuticScreenFrame/card and
  the shared language Sheet. Switching retains mounted controls, advisory state and voluntary linking.
- **TB-02:** Complete joint/summary/picker messages cover headings, question/actions, summary ratings/counts,
  linking, catalog accessibility and recovery. Required-key/parameter/plural coverage passes without fallback.
- **TB-03:** Yes still records `together` then finalizes; No records `split_suggested` and leaves dismissal and
  sovereign Finalize Anyway available. Language selection invokes neither action and changes no routing facts.
- **TB-04:** Personal group/symptom names render as escaped text in `bdi` with automatic direction and unknown
  language. Summary polarity is display copy; counts/intensity use locale formatting without stored-value changes.
- **TB-05:** Every catalog ID remains reachable in the shared Sheet. Selection still reads canonical source units
  and calls startSession with their IDs, including `unit-0`; genuinely empty source still blocks startup.
- **TB-06:** Linking defaults off, survives selection and remains voluntary. Linked/standalone start payloads pass.
- **TB-07:** Joint has at most two main actions; summary has one. The full catalog and linking live in utilities,
  without recommendations. Phone summary/card and long catalog/Sheet scroll internally. Visible focus and 44px
  targets pass; the native checkbox remains 20px inside its 44px-or-larger clickable label.
- **TB-08:** Pending joint response, summary read, catalog read and selection recovery settle in current-locale
  presentation without duplicate calls or draft/link resets. Existing retries retain their original payload meaning.
- **TB-09:** Real-provider integration covers joint Yes through summary/catalog into a canonical linked Player;
  No/dismissal/finalization and empty/Continuous Guidance paths retain action assertions. Chromium covers each
  adopted screen in Hebrew and English, language focus, containment, internal scrolling and canonical startup.
- **TB-10:** Full web suite: **28 files / 195 tests**. Fresh Chromium: **7 / 7** including existing control-affordance.
  Scoped/root typechecks, web depcruise (**734 modules / 1508 dependencies**), production build, owned ESLint,
  130-character scan and diff check pass. Application changes occupy 13 web paths; only this Resolution is outside web.

TDD evidence: joint language/advisory test failed on missing utilities, pending-summary test failed on missing
loading language access, and full catalog/Player test failed on absent picker composition; each slice passed after
its implementation. Five new integration regressions also cover pending calls and recovery. Existing English tests
use explicit English fixtures and open the real Sheet; their therapeutic payload and guard assertions remain.

Sandbox Vitest EPERM and missing sandbox Chromium were rerun with approved escalation. A host-suspended browser
run timed out its first navigation after 11.1 hours; a fresh zero-retry run passed all seven cases. Build retains the
existing chunk-size/dynamic-import warnings. Real device cutouts, mobile keyboard, desktop zoom and Hebrew
screen-reader pronunciation remain unverified manually. Treatment source titles/bodies are unchanged; their
validated translations belong to 11.7. No engine, adapter, schema, contract, seed, dependency or root-tooling edits.
