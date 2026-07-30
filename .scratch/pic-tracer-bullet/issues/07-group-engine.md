# 07 — `GroupEngine` (Joint Treatment Muscle Test + Blind-by-Default rating)

**What to build:** Symptom Group / symptom creation and validation, the Joint Treatment Muscle Test gate,
and the three-call Blind-by-Default rating API. This is the **only** module that touches ratings.

**Blocked by:** 02 (`RepositoryPort` + domain types), 03 (fake port + contract suite), 04 (module-isolation
guardrail must exist before this ticket's code lands).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md` §C in full, User Stories 6–17, Testing Decisions
("Joint Treatment Muscle Test gate", "Blind-by-Default is tested at the API shape", "Rating dimension
independence"), `CONTEXT.md` Symptom Group / Blind (re-)rating / Polarity / Intensity entries, `decisions.md`
DEC-002, DEC-009, DEC-010, DEC-011.

## Objective

`GroupEngine` is the sole owner of rating logic in the entire system. `PlayerEngine` (ticket 08) must have
zero knowledge of ratings — this ticket's public API shape is what makes that isolation possible, and
ticket 04's dependency-cruiser rule is what makes it enforceable at build time.

## Context Injection (copied verbatim from the spec §C — this is the single source of truth)

**Joint Treatment Muscle Test as an engine invariant, not a UI checkbox:**

> `GroupEngine.finalizeGroup(draft)` refuses to persist a group whose `joint_treatment_muscle_test` field is
> unset. The muscle test is presented as one binary Atomic Unit-style question ("Is it NEMAR to treat these
> symptoms together?") after the last symptom is added and before finalization...
> - **`'together'`:** finalize immediately, no further steps.
> - **`'split_suggested'`:** finalize is still permitted (sovereignty — the EM is never blocked from
>   keeping symptoms in one group), but `GroupEngine` returns a non-blocking advisory the UI surfaces as a
>   dismissible suggestion. **Actual group-splitting... is out of scope** — this spike implements the test
>   and its persisted answer, not the split mechanic.

**Blind-by-Default rating, codified in the engine's API shape (DEC-011):**

> `GroupEngine` exposes rating through three separate calls, deliberately shaped so the default path
> structurally cannot leak a prior value:
> - `GroupEngine.hasPriorRating(symptomId): boolean` — safe to call anytime; tells the UI whether a
>   "Reveal" affordance should even be shown, without exposing the value itself.
> - `GroupEngine.rate(symptomId, { polarity, intensity })` — the **only** way to set a rating. Its return
>   value and any state it emits **never include** the symptom's previous polarity or intensity. A
>   first-time rating (no prior value exists) and a re-rating both go through this identical call.
> - `GroupEngine.revealPriorRating(symptomId): { polarity, intensity }` — the **only** call that returns a
>   previous value, and only when the EM has explicitly triggered the Reveal affordance. Calling `rate()`
>   does not require calling this first, and calling this never mutates state.

**Rating trigger points are structurally limited to two, per this spec's finalization:**

> 1. During Symptom Group Initialization — rating each symptom as it's added, exercised fully by this
>    spike.
> 2. Immediately after selecting an existing Symptom Group to begin a session — the DEC-009 §4
>    "session-scoped suggestion" trigger. This spike's happy path only ever creates a **new** group, so
>    this trigger point is never reached... it is documented here so the `rate()` / `revealPriorRating()`
>    shape above is understood to already support it without modification when a "resume an existing
>    group" flow is added later.
>
> **No other trigger point is in scope.** In particular, the Smart-Link suggestion mode... and ad-hoc
> rating are both explicitly out of scope for this spike — `PlayerEngine` never calls into `GroupEngine`,
> and no rating UI appears anywhere in or after the Unified Player.

**Intensity semantics — Path A1 (Absolute Magnitude), DEC-010:**

> `intensity` is a plain 0–10 integer where higher always means "more sensation/presence in life,"
> independent of polarity — a Negative symptom at 8/10 is intensely felt pain; a Positive symptom at 8/10
> is a strongly felt sense of strength or ease.

## Definition of Done

- `GroupEngine.createDraftGroup(name: string): Promise<string>` (returns `groupId`).
- `GroupEngine.addSymptom(groupId: string, name: string): Promise<string>` (returns `symptomId`).
- `GroupEngine.hasPriorRating(symptomId: string): Promise<boolean>`.
- `GroupEngine.rate(symptomId: string, { polarity: 'positive' | 'negative', intensity: number }):
  Promise<void>` — return value and any subsequently-readable engine state contain **no**
  `previousPolarity` / `previousIntensity` field anywhere.
- `GroupEngine.revealPriorRating(symptomId: string): Promise<{ polarity, intensity } | null>` — only
  populated after a prior `rate()` call exists; never mutates state.
- `GroupEngine.setJointTreatmentMuscleTest(groupId: string, answer: 'together' | 'split_suggested'):
  Promise<void>`.
- `GroupEngine.finalizeGroup(groupId: string): Promise<{ group: FinalizedSymptomGroup, splitAdvisory:
  boolean }>` — throws/rejects if `joint_treatment_muscle_test` is unset on the group.
- `intensity` validated as an integer `0`–`10` inclusive; out-of-range values are rejected by `rate()`.
- Flipping `polarity` in a `rate()` call without passing a new `intensity` leaves the existing `intensity`
  untouched, and vice versa — the two fields are independently settable, never coupled.
- `GroupEngine`'s module lives under `packages/pic-engine/src/group-engine/` (the directory ticket 04
  already reserved) and has zero import of anything under `player-engine/` — verified by ticket 04's
  dependency-cruiser check passing.
- Constructed only against `RepositoryPort`.

## Do Not Touch / Out of Scope

- Do not implement or import anything from `PlayerEngine`, `LibraryEngine`, `TimelineEngine`, or
  `SessionEngine` — `GroupEngine` is fully self-contained relative to the rest of the engine layer.
- Do not implement the actual group-splitting mechanic for `'split_suggested'` — only persist the answer
  and return the non-blocking `splitAdvisory` flag; turning one draft into two finalized groups is
  explicitly Out of Scope.
- Do not implement trigger point 2 ("resume an existing group" session-scoped rating flow) — design the API
  so it *could* support it later (it already does, per the spec), but do not build the resume flow itself.
- Do not build any UI component (`RatingControl`, etc.) — that is ticket 16.
- Do not implement Smart-Link-triggered rating suggestions or ad-hoc rating — both explicitly Out of Scope.

## Testing Requirement — Test-First Acceptance Criteria

These mirror the Testing Decisions section verbatim:

- [ ] `it('finalizeGroup throws when joint_treatment_muscle_test is unset')`
- [ ] `it('finalizeGroup succeeds when joint_treatment_muscle_test is "together"')`
- [ ] `it('finalizeGroup succeeds when joint_treatment_muscle_test is "split_suggested"')`
- [ ] `it("rate()'s return value contains no previousPolarity or previousIntensity field")`
- [ ] `it('hasPriorRating returns false before any rating exists and true after the first rate() call')`
- [ ] `it('revealPriorRating only returns a value when explicitly called, never as a side effect of
      rate()')`
- [ ] `it('flipping polarity via rate() leaves the existing intensity value untouched when intensity is
      omitted from the call')`
- [ ] `it('changing intensity via rate() leaves the existing polarity value untouched when polarity is
      omitted from the call')`
- [ ] `it('intensity outside the 0-10 range is rejected')`
- [ ] `it('GroupEngine has zero import edges into player-engine')` (backed by ticket 04's tooling; add a
      lightweight assertion or rely on the shared `npm run depcruise` command passing as part of CI for
      this ticket too).

## Acceptance Criteria

- [ ] All seven public methods exist with the exact signatures above.
- [ ] All ten tests above pass against the fake `RepositoryPort` from ticket 03.
- [ ] `npm run depcruise` (ticket 04) remains green after this ticket lands.
- [ ] No rating value is ever observable except through an explicit `rate()` argument or
      `revealPriorRating()` return value.
