# 17 — `JointTreatmentMuscleTestStep` + `SymptomGroupSummaryScreen`

**What to build:** the single yes/no muscle-test question that gates group finalization, plus the read-only
confirmation screen — both pure reflections of `GroupEngine` state.

**Blocked by:** 16 (`SymptomGroupCreateScreen`).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md` §F, User Stories 12, 14–17, `decisions.md` DEC-002,
README §4.

## Locked Engine Interface (Dumb Reflection Contract)

```ts
groupEngine.setJointTreatmentMuscleTest(groupId: string, answer: 'together' | 'split_suggested'):
  Promise<void>;
groupEngine.finalizeGroup(groupId: string): Promise<{ group: FinalizedSymptomGroup; splitAdvisory:
  boolean }>;
```

Use ticket 07's real shipped signatures if they differ from this sketch — do not invent new `GroupEngine`
surface here.

## Definition of Done

- `JointTreatmentMuscleTestStep`: a single binary question — **"Is it NEMAR to treat these symptoms
  together?"** — shown once all symptoms are added, gating `groupEngine.finalizeGroup` (user story 14).
- **"Yes" answer:** calls `setJointTreatmentMuscleTest(groupId, 'together')` then `finalizeGroup`
  immediately — no further UI step (user story 15).
- **"No" answer:** calls `setJointTreatmentMuscleTest(groupId, 'split_suggested')`, then shows a clear,
  non-blocking, **dismissible** suggestion that these symptoms may heal better as separate groups (user
  story 16) — but a "Finalize anyway" action remains available and calls `finalizeGroup` regardless (user
  story 17: the muscle test informs, never overrides, sovereignty).
- `SymptomGroupSummaryScreen`: read-only confirmation of what `GroupEngine` just created — symptoms,
  polarities, intensities, and the muscle-test result (user story 12).

## Do Not Touch / Out of Scope

- Do not implement the actual group-splitting mechanic (turning one draft into two finalized groups) —
  explicitly Out of Scope. This step only persists the answer and shows the advisory.
- Do not duplicate `GroupEngine.finalizeGroup`'s "unset muscle test" validation client-side — the UI's only
  job is to not offer a way to skip answering, not to re-implement the engine's own guard.
- Do not add editing of symptoms from the summary screen — this spike's summary is read-only confirmation
  only.

## Testing Requirement — Test-First Acceptance Criteria (thin smoke tests only)

- [ ] `it('renders nothing until all symptoms are added, then shows the yes/no muscle-test question')`
- [ ] `it('"Yes" answer finalizes the group immediately with no further UI step')`
- [ ] `it('"No" answer shows a dismissible split suggestion but still allows finalize on demand')`
- [ ] `it('SymptomGroupSummaryScreen renders the finalized group\'s symptoms, polarities, intensities, and
      muscle-test result')`

## Acceptance Criteria

- [ ] All four smoke tests pass.
- [ ] "No" never blocks finalization — a "Finalize anyway" path is always reachable.
- [ ] No group-splitting logic exists anywhere in this ticket's code.
