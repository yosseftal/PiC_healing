# 20 — Full happy-path E2E integration & smoke wiring

**What to build:** wire the already-built screens and the Atomic Promotion RPC into one working flow, and
verify the entire tracer bullet end-to-end against the spec's five-step "Solution" narrative — the final
proof that 100% of the User Stories are actually satisfied, not just individually engine-tested.

**Blocked by:** 13 (Atomic Promotion RPC), 15 (`PersistenceGateModal`), 17 (Joint Treatment Muscle
Test + Summary), 18 (`TreatmentPickerScreen`), 19 (`UnifiedPlayerScreen`).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md`, "Solution" section (1–5), full User Stories list.

## Objective

> Build a **tracer bullet**: a thin, fully-wired vertical slice through the exact happy path an EM would
> walk on their very first visit...
> 1. Land in the app with zero setup (Guest Mode)...
> 2. Create one Symptom Group...
> 3. Choose one standalone treatment and run it through the Unified Player...
> 4. Hit the Persistence Gate at Finish: authenticate and have the Guest Group promoted in place,
>    atomically...
> 5. See the Personal Treatment Library row's `use_count` increment exactly once, and see a corresponding
>    Chronological Timeline event...

Every prior ticket proved its own slice in isolation against a fake or a local Supabase instance. This
ticket is the only place the *whole* path is exercised together, end to end, through real UI screens.

## Definition of Done

- A scripted walkthrough (Playwright or an equivalent E2E tool — pick one, document the choice) exercises,
  in one continuous run:
  1. App boots as Guest, zero network requests observed until step 4.
  2. Creates a Symptom Group with at least one rated symptom (exercising the Blind-by-Default
     `RatingControl`), answers the Joint Treatment Muscle Test, finalizes.
  3. Picks a standalone treatment from the flat list, optionally linked to the group just created, and
     runs it through the full Player: at least one forward Navigation Tree jump (producing a `skipped`
     unit), one backward revisit that upgrades a `skipped` unit to `completed`, and the Terminal NEMAR unit.
  4. Presses `[Finish]` or `[Finish Anyway]`, hits the Persistence Gate, authenticates, and observes the
     Guest Group promote atomically with no visible re-entry of data.
  5. Confirms the Personal Treatment Library row's `use_count` is exactly `1` and exactly one Timeline
     event exists, both scoped to the new `auth.uid()`.
- A short traceability checklist is included in this ticket's own PR description, mapping each of the 45
  User Stories in the spec to either "covered by ticket N's automated test" or "verified manually in this
  E2E pass" — so 100% story coverage is auditable, not assumed.

## Do Not Touch / Out of Scope

- Do not modify `pic-engine`, `pic-adapter-local-guest`, or `pic-adapter-supabase` internals in this
  ticket. If wiring reveals a real gap in one of them, file it as a fast-follow ticket rather than silently
  patching it here — this keeps this ticket's own scope auditable and keeps business logic out of the
  integration layer.
- Do not rewrite or re-test the Atomic Promotion RPC's adversarial failure modes here — ticket 13 owns
  those exclusively; this ticket only exercises the happy path through real UI.
- Do not add any new screens or engine methods — this ticket is pure wiring and verification of what
  already exists.

## Testing Requirement

- [ ] One E2E test (or a documented, repeatable manual script if E2E tooling isn't set up yet) exercising
      the full five-step happy path above.
- [ ] Final-state assertions matching User Stories 40–44 exactly: `use_count === 1`, exactly one Timeline
      event, all rows anchored to `auth.uid()`, no rows left over on `local-guest` after promotion succeeds.

## Acceptance Criteria

- [ ] The full five-step happy path runs green in one continuous pass.
- [ ] The User Story traceability checklist is complete (all 45 stories accounted for).
- [ ] No new business logic was added anywhere in this ticket's diff — only wiring and test code.
