# 08-05 — `SymptomGroupCreateScreen`

**What to build:** one-screen group creation + `SymptomAddStep` + `RatingControl` (blind-by-default).

**Blocked by:** 08-03, 08-04.

**Status:** done

**Source:** `.scratch/pic-tracer-bullet/issues/16-symptom-group-create-screen.md` (orig. Ticket 16).

## Ethical guard — Blind-by-Default (DEC-010, DEC-011)

- `RatingControl` uses `groupEngine.hasPriorRating()` — backed by live `symptoms.rated_at` (Wave 6.5).
- Prior polarity/intensity **never** rendered unless EM taps Reveal (`revealPriorRating()`).
- `RatingControl` instantiated once inside `SymptomAddStep` only.

## Definition of Done

- Name input → confirm (Atomic Focus).
- One symptom per pass with combined add + rate action.
- Four smoke tests from orig. Ticket 16 pass.

## Do Not Touch

- Joint treatment step (08-06), Player screen (08-08).

## Resolution

Implemented `SymptomGroupCreateScreen`, `SymptomAddStep`, and `RatingControl` in `packages/pic-web/src/`:

- **`SymptomGroupCreateScreen.tsx`** — name input → confirm (`createDraftGroup`); then repeatable
  `SymptomAddStep` with a "Done adding symptoms" affordance that sets `symptomAdditionComplete` on the
  composition-layer guest flow facts.
- **`SymptomAddStep.tsx`** — one symptom per pass; combined `addSymptom` + `rate` on submit; hosts the sole
  `RatingControl` instance.
- **`RatingControl.tsx`** — polarity select + intensity slider (0–10); `hasPriorRating` drives a Reveal link
  only; `revealPriorRating` runs only on explicit tap; prior values never pre-fill the inputs.
- **`guest-flow-facts.ts`** — added `symptomAdditionComplete` so draft groups stay on `create-group` while
  symptoms are being added.
- **`guest-flow-screens.tsx`** — wires real `SymptomGroupCreateScreen` for the `create-group` route.
- **`symptom-group-create-screen.test.tsx`** — four smoke tests from orig. Ticket 16.

Tests: `npx vitest run packages/pic-web` — 25 passed (7 files; `promote-path` remote integration skipped
when Supabase is unavailable). `depcruise` — 0 violations.
