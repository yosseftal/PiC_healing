# 11.2 — Dynamic RTL Layout and Motion

**What to build:** An Event Manager switches language in the working Player drawer and gets a correctly
mirrored, single-viewport therapeutic layout, including safe navigation and interrupted/reduced motion.
The same thin frame/drawer composition becomes reusable by earlier Guest Flow screens.

**Blocked by:** [11.1 — Persistent Language Choice](01-persistent-language-choice.md).

**Status:** ready-for-agent

**Dispatch state:** Not dispatched; complete 11.1 and its applicable prerequisites first.

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
