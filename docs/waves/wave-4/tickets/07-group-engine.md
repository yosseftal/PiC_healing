# 07 — `GroupEngine` (Joint Treatment Muscle Test + Blind-by-Default rating)

**What to build:** Symptom Group / symptom creation and validation, the Joint Treatment Muscle Test gate,
and the three-call Blind-by-Default rating API. This is the **only** module that touches ratings.

**Blocked by:** 02 (`RepositoryPort` + domain types), 03 (fake port + contract suite), 04 (module-isolation
guardrail must exist before this ticket's code lands).

**Status:** done

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

- [x] `it('finalizeGroup throws when joint_treatment_muscle_test is unset')`
- [x] `it('finalizeGroup succeeds when joint_treatment_muscle_test is "together"')`
- [x] `it('finalizeGroup succeeds when joint_treatment_muscle_test is "split_suggested"')`
- [x] `it("rate()'s return value contains no previousPolarity or previousIntensity field")`
- [x] `it('hasPriorRating returns false before any rating exists and true after the first rate() call')`
- [x] `it('revealPriorRating only returns a value when explicitly called, never as a side effect of
      rate()')`
- [x] `it('flipping polarity via rate() leaves the existing intensity value untouched when intensity is
      omitted from the call')`
- [x] `it('changing intensity via rate() leaves the existing polarity value untouched when polarity is
      omitted from the call')`
- [x] `it('intensity outside the 0-10 range is rejected')`
- [x] `it('GroupEngine has zero import edges into player-engine')` (backed by ticket 04's tooling; add a
      lightweight assertion or rely on the shared `npm run depcruise` command passing as part of CI for
      this ticket too).

## Acceptance Criteria

- [x] All seven public methods exist, with two resolved signature/type refinements - see "## Resolution"
      below.
- [x] All ten tests above pass against the fake `RepositoryPort` from ticket 03 (plus five extras: three
      `createDraftGroup`/`addSymptom` plumbing tests, one adversarial cross-group isolation test, and one
      `EmptyRatingUpdateError` test).
- [x] `npm run depcruise` (ticket 04) remains green after this ticket lands.
- [x] No rating value is ever observable except through an explicit `rate()` argument or
      `revealPriorRating()` return value.

## Resolution

**Status:** Implemented (Wave 4).

Implemented in `packages/pic-engine/src/group-engine/index.ts` / `group-engine.test.ts`, matching this
ticket's Definition of Done with two deliberate, documented refinements beyond the literal headline text -
both resolved directly (not escalated), per the Orchestrator's "grounded in Living Documentation" mandate,
since both rest on this ticket's *own* text elsewhere, not a new architectural judgment call:

- **`Symptom.rated_at: Timestamp | null` (types.ts widening).** `hasPriorRating`'s own acceptance test -
  "returns false before any rating exists and true after the first `rate()` call" - requires a real,
  persisted distinction between "named via `addSymptom`, never rated" and "has gone through `rate()` at
  least once." The ratified `Symptom` type (ticket 02) had no such distinction: `polarity`/`intensity` were
  always-required, so a struct satisfying that shape can't represent "unset." This is additive only
  (`rated_at` is a new, always-present-but-nullable field; `polarity`/`intensity` stay non-null exactly as
  before, matching the live migration's `not null` `symptoms.polarity`/`.intensity` columns) - `addSymptom`
  seeds new symptoms with the placeholder values (`'negative'`, `0`) the migration itself already uses to
  backfill pre-existing rows, and `rated_at`, never the placeholder values, is the sole source of truth
  `hasPriorRating`/`revealPriorRating` read. See `types.ts`'s `Symptom` doc comment for the full reasoning.
  `Polarity`/`Intensity` were also extracted as named type aliases (`types.ts`) purely so ticket 08 has a
  concrete, greppable name for the types it must never import.
- **`rate()`'s update parameter is `{ polarity?: Polarity; intensity?: Intensity }` (both optional), not the
  both-required literal shape the ticket's headline Definition-of-Done bullet shows.** The very same
  ticket's Definition of Done goes on to require "flipping `polarity`... without passing a new `intensity`
  leaves the existing `intensity` untouched, and vice versa" - a requirement that only has meaning if a
  caller may omit either field. The fuller, more specific bullet wins over the earlier, incomplete one, the
  same resolution shape as Wave 3's `idempotencyKey` precedent. An empty `{}` call is rejected
  (`EmptyRatingUpdateError`) rather than silently accepted as a no-op, so a caller bug can never masquerade
  as an intentional "confirm current rating with no change" action (not tested by the ticket, but a
  reasonable defensive default worth documenting).

**Symptom-id-only lookups (`hasPriorRating`/`rate`/`revealPriorRating` take no `groupId`), scope note, not a
deviation:** `RepositoryPort` (ticket 02) has no "find group by symptom id" or list-all-groups method, so
`GroupEngine` resolves a bare `symptomId` via a private in-memory `Map<symptomId, groupId>` populated by
`addSymptom`. This is sound for every path this spike exercises (ticket 07's own Out of Scope section
explicitly excludes "resume an existing group" - the one flow that would need a *fresh* engine instance to
resolve a symptom it never saw) but is a known limitation a future "resume" ticket must revisit (rebuild the
index from `RepositoryPort.getGroup`, or widen the port). Flagged in `index.ts`'s file header for whoever
picks that up next.

**Verification:** `npm run ci` passes end-to-end - 66/66 domain tests (up from 27; 15 of the 39 new tests
are `GroupEngine`'s), 9/9 contract tests (untouched), zero `depcruise` violations, zero grandfather-list
growth. No changes were needed to `library-engine/index.ts` or `timeline-engine/index.ts`.
