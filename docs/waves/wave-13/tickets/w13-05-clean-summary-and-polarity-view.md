# W13-05 — Review a clean priority list with an optional polarity view

**Status:** in progress — parallel implementation authorized and dispatched from ca6441e.
**Specification:** [Approved Wave 13 charter](../specs/wave-13-spec.md).
**Blocked by:** [W13-01](w13-01-instant-questionnaire-and-initial-rating.md), [W13-02](w13-02-durable-manual-priority.md).
**Blocking:** [W13-09](w13-09-integrated-journeys-and-wave-handoff.md).
**Execution gate:** Authorized; complete prerequisites and wait for serial dispatch.
**Domain decisions:** DEC-010, DEC-011, DEC-012, DEC-013; W13-D2, W13-D3.

## Objective & Context

The Event Manager sees a readable questionnaire summary with manual priority and separate intensity,
can optionally review by polarity, and can return to blind rating without prior values leaking through the list.

W13-D3 approves manual order by default and an optional polarity summary view. Polarity is independent
of priority and intensity. Removing list-total clutter does not remove priority numerals, scale maximums,
or the distinct Personal Treatment Library use count.

## What to Build / Exact Scope

1. Render a title only when one was supplied; use a neutral localized navigation label for an untitled list.
2. Show topic text and manual priority distinctly from rating. In Hebrew put priority at the right/start side
   and intensity at the left/end side with explicit labels; mirror logical layout in English.
3. Remove total-topic counters from entry/summary headers, progress slots and redundant live announcements.
4. Offer manual/polarity view in utilities. Polarity sections are Negative, Positive and Unrated when needed;
   stable manual ordering remains within each section and original priority numbers remain visible.
5. The view selector performs no persistence write. Restore manual view before enabling reorder controls.
   Do not infer treatment urgency from valence, score, topic name, section position or color.
6. On entering a fresh re-rating action, suppress adjacent prior values, badges and polarity grouping,
   including hidden DOM/accessibility labels. Use existing explicit Reveal and keep re-rating 0–10.
7. Preserve one active rating interaction and current unrated semantics. Display existing zero as a real
   score when rated_at confirms it; never confuse it with an unrated placeholder.
8. Scope presentation changes to the existing summary/rating seams and typed i18n, not a new analytics subsystem.

## End-to-End Demonstration

Show an untitled list with mixed polarity and a historical zero. Switch summary views and return to manual
order; storage is unchanged. Start re-rating a topic and inspect visible and accessible content before Reveal.

## Acceptance Criteria

- [ ] **AC-01:** Untitled lists render cleanly without a fabricated persisted name or empty heading.
- [ ] **AC-02:** Manual priority is the default and is visually/accessibly distinguishable from intensity.
- [ ] **AC-03:** No total-item counters remain on affected list surfaces; meaningful priority/scale values remain.
- [ ] **AC-04:** Polarity view groups correctly with stable manual order and original priority numbers.
- [ ] **AC-05:** Changing view neither persists new order nor calls rating or Reveal actions.
- [ ] **AC-06:** Reorder controls operate only against manual order.
- [ ] **AC-07:** Blind re-rating hides prior polarity/intensity and grouping from both visible and accessible content.
- [ ] **AC-08:** Explicit Reveal still works, re-rating accepts 0–10, and actual historical zeros remain unchanged.
- [ ] **AC-09:** Long Hebrew/English topic labels remain readable without document overflow or extra main actions.

## Testing Requirements

- Summary rendering matrix: optional/empty title; all polarities; unrated versus rated zero; long labels.
- Spy at public action seams to prove view changes produce no save, rate or Reveal calls.
- Extend blind-rating switching tests to cover summary adjacency and accessible-name leakage.
- Browser tests assert RTL/LTR ordering, keyboard utility selection and absence of total counters.

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

No automatic sorting of persisted priority, score-derived urgency, bulk rating, analytics, rewriting
history, removing library use counts, group archival, treatment editing or database changes.

Implementation is authorized by the user; wait for prerequisites and serial dispatch.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.
