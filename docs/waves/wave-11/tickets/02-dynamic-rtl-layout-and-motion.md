# 11.2 — Dynamic RTL Layout and Motion

**What to build:** An Event Manager switches language in the working Player drawer and gets a correctly
mirrored, single-viewport therapeutic layout, including safe navigation and interrupted/reduced motion.
The same thin frame/drawer composition becomes reusable by earlier Guest Flow screens.

**Blocked by:** [11.1 — Persistent Language Choice](01-persistent-language-choice.md).

**Status:** done

**Dispatch state:** Done; committed and independent Standards/Spec reviews closed.

**Source:** [Approved Wave 11 specification](../../../docs/specs/wave-11-i18n-spec.md), sections 3.4–3.6 and 6.3.

**Spec coverage:** AC-06, AC-08–10, AC-18–21, AC-25.

## Context Injection (verbatim)

> Forward/backward remains derived from canonical unit order, not translated labels or physical direction.
> Use the existing CSS sign mechanism; do not also negate motion values in JavaScript.

> Switching while the drawer is open repositions it immediately at the new logical edge without replaying open/close
> motion or animating it across the screen. An in-flight drawer animation settles without closing the dialog.

## External Prerequisites

Consume the approved shared utility copy and locale contract from 11.1. This ticket does not approve new wording.
Any new accessible message requires the applicable OQ-01/OQ-02/OQ-05 approval before completion.
Physical device cutouts, true browser zoom, and mobile keyboard behavior remain manual QA under OQ-07.

## Owned Slice and Integration Boundary

- Own logical layout and motion behavior in TherapeuticFrame, TherapeuticContentCard, table scroller,
  HorizontalSlideContainer, TherapeuticSheet, and their existing Player composition.
- Reuse 11.1's locale bindings and shared selector. Supply a thin reusable single-frame/utility composition for
  11.4 and 11.5; do not migrate their feature screens or nest a new frame around the existing Player.
- Coordinate shared primitive/Player edits with 11.3. Independence in the dependency graph is not shared-file ownership.

## Acceptance Criteria

- [ ] TB-01: Switching through the selector correctly mirrors header utilities, Sheet edge, borders, indentation,
      and directional affordances using logical properties, with one semantic action order and no double reversal.
- [ ] TB-02: Exactly one frame fits `100dvh`/`100vw`, with the existing `100vh` fallback and document/root overflow lock.
      Card, table, and Sheet scrolling stay bounded; long text creates no document scroll or clipped controls.
- [ ] TB-03: Frame safe-area padding maps physical right to inline-start for RTL and left for LTR at all breakpoints.
      Preserve the Sheet's correct mapping and use physical properties only when their meaning is physical.
- [ ] TB-04: Forward movement enters from inline-end and backward from inline-start; neutral/reordered identities
      have no directional translation. Stable canonical keys, presence waiting, and inert exiting panels remain intact.
- [ ] TB-05: Keep the frozen step/drawer distances, duration, and organic easing. Locale changes affect direction
      signs only; neither text, logos, numbers, nor authored media are mirrored as a container-wide transform.
- [ ] TB-06: A locale change alone creates no navigation transition. Switching during a transition settles the
      current reflected unit with no obsolete announcement, spurious domain action, or duplicate completion callback.
      A real pending navigation may complete its existing presentation callback once without stealing Sheet focus.
- [ ] TB-07: An open or animating Sheet moves to its new logical edge without replaying entrance/exit motion,
      closing, losing selector focus, or releasing background inertness. Repeated rapid selection also settles safely.
- [ ] TB-08: Reduced motion yields zero spatial distance/duration for steps and Sheet in both locales, retaining
      only the established optional short opacity treatment and existing keyboard/focus behavior.
- [ ] TB-09: Actual Hebrew/mixed text wraps without shrinking frozen type or targets. Controls remain at least
      44 x 44 CSS px, text/control contrast remains compliant, and clipped boundaries retain visible focus indicators.
- [ ] TB-10: Real-selector browser tests prove viewport containment, logical placement, internal scroll, real
      forward/backward transforms, interrupted motion, and reduced motion. A reusable composition demo also passes.
      Scoped tests/checks pass; implementation is web-only.

## Isolation Bounds / Do Not Touch

All implementation, styling, configuration, and UI tests stay inside `packages/pic-web`.
The active ticket may receive its later Resolution. The approved spec and sibling tickets remain read-only.
Zero edits to `packages/pic-engine`, adapters, migrations, domain interfaces/tests, source seeds, or root lockfile.
No frozen-token changes, gestures, new navigation mechanism, healing-state changes, or feature-screen migrations.

## Verification and Completion Evidence

Extend existing Frame, Sheet, and Player browser fixtures using real locale changes, not test-written `dir` alone.
Measure geometry and transforms; attach animation observations before the action and wait for settled states.
Run affected unit/browser suites, root typecheck, web depcruise/build, lint, line-length and implementation-scope checks.
Later Resolution must address TB-01–TB-10 and distinguish automated results from unperformed device/manual QA.

## Resolution

Implemented 2026-10-11 against clean upstream `2e69889`. Execution status: done; parent review and commit pending.
The frozen ticket's copy prerequisite is superseded by the product-approved drafting decision recorded in the seam map.
New generic utility labels are product-approved Wave 11 UI copy, not official website quotations.

### Delivered behavior and reusable contract

- Frame maps physical safe-area left/right through logical start/end variables. RTL swaps those variables once;
  the compact breakpoint consumes the same mapping. Existing viewport fallback, document lock and tokens remain intact.
- Slides retain the canonical pending presentation snapshot across locale rerenders. Locale interruption stops movement,
  settles/removes exiting content, and exposes the current reflected unit without remounting its canonical identity.
  A pending legitimate presentation callback reports once; locale-only selection reports none. Obsolete navigation live text
  is removed. Focus stays inside an active dialog or inert owner. Deferred presence work is cancelled on cleanup.
- An open Sheet finishes its existing CSS entrance on locale change, immediately placing the same dialog on the new edge.
  Focus, open state and background inertness remain owned by the existing Radix/Sheet lifecycle. Reduced drawer duration is
  exactly the existing zero spatial token, overriding only the foundation's general 0.01ms animation fallback.
- `src/therapeutic-frame/TherapeuticScreenFrame.tsx` exports `TherapeuticScreenFrame` and its props. It accepts the existing
  Frame props, forbids caller `utilityTrigger`, and adds optional `utilities: ReactNode`. It renders exactly one Frame with
  a localized generic Sheet and the real LanguageSelector followed by caller utilities. An existing LocaleProvider is
  required; it does not create a provider, card, action row or navigation policy. Callers own the stage child layout.
  The composition demo keeps two direct controls outside the internally scrolling card. Player is not wrapped or migrated.
- Generic title/open/close/content dictionary keys are exhaustive and covered by the existing approved dictionary validator.
  No feature screens, domain actions, identities, authored media or personal content were migrated or changed.

### Acceptance evidence

| Criterion | Implemented and observed evidence |
| --- | --- |
| TB-01 | Real selector mirrors Frame header utilities, portalled Sheet edge and logical start border in Hebrew/English. |
| TB-02 | Exactly one Frame at all four specified viewports; document/root locks, card/Sheet scroll and table access pass. |
| TB-03 | Simulated physical left=7px/right=17px produce RTL start=29px compact/33px wide; LTR maps left to start. |
| TB-04 | RAF samples observe real forward/backward logical transforms, neutral reordered replacement and inert hidden exits. |
| TB-05 | Existing token tests and 280ms drawer open/close observations pass; CSS is the only physical sign mechanism. |
| TB-06 | Both entering/exiting switches in each locale settle with one callback, no stale live text and retained Sheet focus. |
| TB-07 | Mid-entrance Sheet switch settles at new edge in the next frame; repeated changes retain dialog/focus/inertness. |
| TB-08 | Both locales have zero observed step/drawer translation and zero drawer duration; keyboard/return focus passes. |
| TB-09 | Hebrew/mixed content wraps at frozen 17px guidance; targets >=44x44, rendered text >=4.5 and borders >=3 contrast. |
| TB-10 | 13 owned real-selector cases and 37 combined affected Chromium cases pass; reusable composition demo included. |

Focus indicators remain at least 3px with a negative offset inside card clipping boundaries. The demo measures last-cell
visibility after scrolling a wide table, fixed header geometry during card scroll, and zero document scroll in both locales.
Existing Player cases retain exclusive Navigation Tree actions, two main choices, Terminal NEMAR and sovereign Finish.

### Red / green and gates

- TDD used the approved provider/selector/rendered-panel/presentation-callback seams with real Motion and Radix behavior.
  The first added primitive case failed on selector focus being stolen and retained navigation live text; it now passes.
  The primitive suite passed 3 files / 16 tests after the interruption and cleanup changes.
- Safe-area browser red measured 12px compact/16px wide instead of the expected 29px/33px RTL start padding. All four
  viewport cases became green after shared physical-to-logical mapping. The fixture's initial missing composition was also
  red before implementation; stage-child containment remains explicitly feature-owned in the demo.
- Sheet interruption browser red measured +139.653px translation after the locale switch. Green observes zero translation
  and the new edge immediately. Entering/exiting interruption cases pass in both locales.
- Reduced-motion browser red exposed nonzero 0.01ms foundation fallback. Green verifies exactly zero actual Sheet spatial
  duration and zero spatial movement. No frozen tokens or easing values changed.
- An intermediate browser run exposed presence completion before parent exit bookkeeping; deferred removal plus cleanup
  cancellation resolved it. An intermediate four-worker run also timed out two geometry cases; the completed two-worker
  combined run has no retries, skips, sleeps or increased timeout and passes all cases.
- Sandbox Chromium could not find the installed browser in its sandbox-specific cache path. The approved escalated rerun
  used the existing installed Chromium. This environment failure is separate from the implementation red/green evidence.
- `npm run typecheck --workspace=pic-web`: passed. `npm run typecheck`: all four workspaces passed.
- `npm run test --workspace=pic-web`: 26 files / 161 tests passed with the root-config web-local runner.
- `npm run depcruise --workspace=pic-web`: passed; 731 modules / 1453 dependencies, no violations.
- `npm run test:browser --workspace=pic-web` with affected test paths and `--workers=2`: 37/37 Chromium passed.
  Paths: dynamic-rtl, locale-choice, therapeutic-sheet, therapeutic-frame, unified-player and visual-foundation browser tests.
- `npm run build --workspace=pic-web`: passed (2689 modules); existing dynamic/static-import and large-chunk warnings remain.
- Owned ESLint passed; parent also reported repository-wide `npm run lint` passed. Diff whitespace/130-character checks pass.
- Implementation paths are confined to `packages/pic-web`; this Resolution is the sole documentation edit. No engine,
  adapter, domain interface, migration, source-seed, root tooling or lockfile edit. No staging or commit by this agent.

### Manual limits

Chromium CSS viewport/media emulation and controlled inset values are automated evidence only. Real device cutouts,
mobile keyboard/visual viewport changes, true desktop browser zoom, and Hebrew screen-reader pronunciation/announcements
remain unverified manual QA. Existing page-scale/half-size viewport cases do not prove those manual behaviors.
No Safari, Firefox, physical-device or assistive-technology coverage is claimed.

### Corrective review finding — later outgoing motion (2026-10-11)

The independent Spec review of `8dff295` found a TB-05 regression that incoming-only transform checks missed.
After a locale-only change or interrupted navigation, the current panel retained interrupted props. A later canonical
navigation reset the parent policy, but the outgoing panel's frozen interruption flag and zero duration settled its exit
immediately. This skipped the frozen ordinary exit movement even though the incoming panel still moved correctly.

Four real-selector browser cases reproduced the failure before the correction: Hebrew and English, each after a
locale-only change and after an interrupted navigation. Every case observed zero later outgoing spatial samples and failed.
Observers attach before the action. Each case now checks both later forward/backward outgoing transforms, logical signs,
the frozen 390px-viewport distance range, inert/hidden exiting content, one settled canonical panel, callback counts,
retained selector focus and background inertness.

The correction keeps interruption in the presence motion context. An exiting panel consumes the current context for both
its interruption decision and transition timing, rather than reading the retained prior panel props. Ordinary exits use
the existing standard duration/easing; reduced exits and interrupted settlement use the existing reduced/zero policy.
No motion tokens, CSS direction signs, domain actions, shared dictionaries, styles or downstream screens changed.

Focused red/green: four browser failures became 4/4 passes; existing slide primitive tests remain 8/8 passing.
The correction is confined to `HorizontalSlideContainer.tsx`, `dynamic-rtl.browser.test.ts` and this Resolution.

Corrective gate context: the paused, uncommitted Ticket 11.3 Player copy slice is present in the integration tree, giving
165 frontend tests rather than the original 161. Those downstream changes are not part of this corrective commit; the
parent stages only the three correction paths. Ticket 11.3 and the final wave gates will verify that integrated state again.

- `npm run typecheck --workspace=pic-web` and root `npm run typecheck`: passed, all four root workspaces included.
- `npm run test --workspace=pic-web`: final standalone run passed 26 files / 165 tests in 9.70s.
  The initial run alongside six independent checks passed 164/165 and timed out waiting for Terminal NEMAR while the prior
  panel was exiting. The unchanged `happy-path-e2e.test.tsx` passed focused 1/1, then the complete standalone suite passed.
  This is consistent with scheduling under concurrent load; no assertion, sleep or timeout was changed to obtain green.
- `npm run depcruise --workspace=pic-web`: 731 modules / 1459 dependencies passed, no violations.
- `npm run build --workspace=pic-web`: 2689 modules passed; existing import/chunk warnings remain.
- Combined affected Chromium gate with `--workers=2`: final fresh run passed 41/41 in 43.5s, including 17 owned cases.
  The same six test paths listed above were used. All four new regression cases measure outgoing motion after language
  selection/interruption and exercise both canonical directions in both locales, including distance and selector focus.
- The first 40/41 browser run had loaded a legacy English RTL Player expectation before Ticket 11.3 stabilized that test.
  Its failure call log expected English while the source excerpt already showed the updated Hebrew name. A later fresh
  40/41 run exposed an existing owned card-focus measurement racing the Sheet's asynchronous return-focus callback;
  the trace showed the trigger active after card focus. The test now awaits actual trigger return focus after dismissal
  and verifies card focus before measuring. Exact >=3px, inward offset, target and contrast thresholds remain unchanged.
  The final 41/41 run followed that observation fix; no sleeps, retry masking or timeout increases were added.
- Exact owned ESLint, 130-character, whitespace and correction-scope checks pass. No other files were edited by this agent
  during corrective work; no staging/commit, shared i18n/style edit, feature migration or token change was performed.

Correction complete; edits stopped for parent verification, atomic commit and independent review. Manual limits above remain.

## Orchestrator closure

Closed on 2026-10-12. Commits and separate review results: 8dff295, 929e85f; Standards 0; Spec outgoing-motion finding closed.
All reported corrective findings are closed; no blocking Standards or Spec finding remains.
The original Resolution records slice verification at implementation time.
Final assembled-wave gates and manual limitations are recorded in docs/handoffs/wave-11-handoff.md.
