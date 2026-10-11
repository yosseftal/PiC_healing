# Wave 11 Sub-Agent Execution Brief

## Identity

- Ticket: 11.2 — Dynamic RTL Layout and Motion
- Wave: 11
- Frozen ticket: .scratch/wave-11/issues/02-dynamic-rtl-layout-and-motion.md
- Orchestrator escalation: report conflicts or missing approval; do not guess.

## Permissions

- Read-Write: active ticket Resolution and owned implementation/tests inside packages/pic-web only.
- Owned surfaces: TherapeuticFrame/CSS; HorizontalSlideContainer/CSS; TherapeuticSheet/CSS; shared screen composition; owned
  browser fixtures
- Read-Only: approved Wave 11 spec, CONTEXT.md, decisions.md, CLAUDE.md, engine/port/adapter source and sibling tickets.
- Off limits: all application changes outside packages/pic-web, including engines, adapters, migrations and root metadata.
- Work only on this ticket; do not implement a later ticket or alter frozen token/domain semantics.

## Frozen requirements (verbatim)

> Forward/backward remains derived from canonical unit order, not translated labels or physical direction.
> Use the existing CSS sign mechanism; do not also negate motion values in JavaScript.

> Switching while the drawer is open repositions it immediately at the new logical edge without replaying open/close
> motion or animating it across the screen. An in-flight drawer animation settles without closing the dialog.

## Glossary injection (verbatim)

**Event Manager**:
The user's role: active director of their own healing, not a passive patient or generic end-user.
_Avoid_: Patient, user (when meaning the healing role), client

**Atomic Focus**:
One muscle-test question at a time; small sequential steps in the Player.
During one **Inquiry Session**, **one focus target** at a time for *inquiry flow*: **one Symptom Group** (symptom-led), **one
course-as-treatment workflow** (course-led), or a **timeline-first** technique/treatment visit (**DEC-004**).
The Event Manager may switch targets by opening a new Inquiry Session when they choose.
_Avoid_: Symptom Bucket as a separate entity; lock on one group across the whole app; two focus targets in one sitting

**Integrating**:
A treatment or session is still in progress — repetition, pending commitments, permeation time needed, or a **Terminal NEMAR**
"No" response (tagged `terminal_nemar_no`, vs. an ordinary mid-exit tagged `mid_exit`; both surface identically) (**DEC-006**,
**DEC-015**).
_Avoid_: Failed, error, incomplete, stuck, "In-Process, Not Yet Complete" as a separate label


## Seam map excerpt

- See docs/audits/wave-11-seam-map.md for owned boundaries, upstream/downstream dependencies, and risks.
- Test the approved public provider/screen/action/content seams. No new test seam needs to be invented.
- Existing engines own healing state, stable identities, ratings, Finish authority, and persistence.
- Other tickets may be independent in the graph, but shared-file edits are serialized by the orchestrator.

## Execution contract

- Execute the implement workflow with TDD at the already-approved observable seams: red before green, one slice at a time.
- Read the implement and TDD skills and existing neighboring code/tests before editing.
- Run scoped typecheck, frontend component/unit tests, depcruise, affected browser tests, build, and owned lint/line checks.
- If a sandbox failure blocks tests, request the needed tool escalation; do not weaken tests or bypass TLS.
- No new dependencies or root lockfile changes. Use the existing React, Radix, Motion, Markdown, and Intl capabilities.
- Hebrew UI copy remains blocked until the orchestrator supplies the user answer. Do not invent approval.
- Three bundled seed treatments may be translated as product-approved Wave 11 content per the 2026-10-11 user answer.
- Do not describe those seeds as official website publications; preserve provenance as product-approved content.
- Preserve English test expectations by explicit locale fixtures where appropriate; production first use remains Hebrew.
- Report changed paths, meaningful red/green evidence, per-criterion Resolution, tests, risks, and any remaining blocker.
- Do not stage or commit; the orchestrator reviews and commits each verified ticket before dispatching its successor.
- Stop after this ticket. No later-ticket edits, unsolicited broad refactors, test skips, or external publishing.

## Do Not Touch / Out of Scope (verbatim from ticket)

All implementation, styling, configuration, and UI tests stay inside `packages/pic-web`.
The active ticket may receive its later Resolution. The approved spec and sibling tickets remain read-only.
Zero edits to `packages/pic-engine`, adapters, migrations, domain interfaces/tests, source seeds, or root lockfile.
No frozen-token changes, gestures, new navigation mechanism, healing-state changes, or feature-screen migrations.

## Acceptance Criteria (checklist)

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

