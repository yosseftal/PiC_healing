# 08-06 — Joint Treatment Muscle Test + Group Summary

**What to build:** muscle-test step and pre-treatment group summary screen.

**Blocked by:** 08-05 (done).

**Status:** done

**Brief:** `.scratch/pic-tracer-bullet-8/briefs/06-joint-treatment-summary-brief.md`

**Source:** `.scratch/pic-tracer-bullet/issues/17-joint-treatment-muscle-test-summary.md` (orig. Ticket 17).

## Definition of Done

- EM answers joint treatment test; `GroupEngine.finalizeGroup` called.
- Summary screen shows finalized group before treatment pick.
- Router advances to `pick-treatment` on confirm.

## Do Not Touch

- Treatment picker (08-07), Player (08-08).

## Resolution

**Solution path:** Extended `guest-flow-facts` with `summaryAcknowledged` and `group-summary` screen derivation.
`JointTreatmentMuscleTestStep` calls `setJointTreatmentMuscleTest` + `finalizeGroup` via composition wrappers only.
`SymptomGroupSummaryScreen` loads finalized group via `getGroup` (thin `repositoryPort` wrapper). Flow shells:
`JointTreatmentFlow`, `GroupSummaryFlow`. Wired in `guest-flow-screens.tsx` (player branch owned by 08-08).

**Architectural decisions:** EM sovereignty preserved — "No" shows dismissible advisory + always-visible "Finalize anyway".
Summary is pure read-only reflection; confirm sets `summaryAcknowledged` only (not `groupFinalized`).

**Deviations:** None.

### Acceptance Criteria

- [x] EM answers joint treatment test; `GroupEngine.finalizeGroup` called.
- [x] Summary screen shows finalized group before treatment pick.
- [x] Router advances to `pick-treatment` on confirm.
- [x] `it('renders nothing until all symptoms are added, then shows the yes/no muscle-test question')`
- [x] `it('"Yes" answer finalizes the group immediately with no further UI step')`
- [x] `it('"No" answer shows a dismissible split suggestion but still allows finalize on demand')`
- [x] `it('SymptomGroupSummaryScreen renders the finalized group's symptoms, polarities, intensities, and muscle-test result')`
- [x] "No" never blocks finalization — "Finalize anyway" always reachable
- [x] No group-splitting logic in this ticket's code
- [x] `depcruise` — 0 violations
- [x] Flow reaches `pick-treatment` only after summary confirm
