# 02 — Adapter: Supabase honors `Symptom.rated_at`

**What to build:** `pic-adapter-supabase` reads and writes the real `rated_at` value instead of always
returning `null`, so Blind-by-Default rating (DEC-011) is trustworthy for Event Managers whose data lives in
Supabase, not just Guest Mode / `pic-adapter-local-guest`.

**Blocked by:** 01 (`symptoms.rated_at` column must exist before this adapter can read/write it).

**Status:** done

**Source:** ticket 12's Deviation #2 (documents exactly the degradation this ticket removes);
`packages/pic-engine/src/group-engine/index.ts`'s `hasPriorRating`/`rate` (the domain logic this now
actually reaches Supabase-backed data).

## Objective

> `GroupEngine.hasPriorRating` will read "never rated" for any symptom loaded through this adapter today
> — Wave 6 ticket 12, Deviation #2, self-flagged as needing this exact fast-follow.

Remove that gap. Any Event Manager whose Symptom Group is persisted via `pic-adapter-supabase` should get the
same Blind-by-Default rating correctness as Guest Mode already has.

## Definition of Done

- `SupabaseRepository.getGroup` maps each symptom row's real `rated_at` column into `Symptom.rated_at`
  (parsed the same way every other timestamp column already is in this file — see the existing
  `toNullableTimestamp` helper from ticket 12 — for the same round-trip-format reason documented there).
- `SupabaseRepository.saveGroup` persists whatever `rated_at` value it is given (including `null` for a
  freshly added, not-yet-rated symptom) instead of silently dropping it.
- The now-obsolete test asserting "`rated_at` always reads back as null" (ticket 12's documented-degradation
  test) is replaced with tests proving real persistence — do not leave a stale test asserting behavior this
  ticket intentionally removes.

## Do Not Touch / Out of Scope

- Do not touch the migration itself — Ticket 01 owns it exclusively.
- Do not modify `GroupEngine`, `hasPriorRating`, or `rate()` — this ticket's surface is the adapter's mapping
  layer only, satisfying an already-defined domain contract.
- Do not touch any other `SupabaseRepository` method's behavior.

## Testing Requirement — Test-First Acceptance Criteria

- [x] `it('saveGroup persists a symptom\'s rated_at, and getGroup reads that exact value back')`
- [x] `it('a freshly added, never-rated symptom round-trips with rated_at: null')`
- [x] `it('GroupEngine.hasPriorRating returns false before rate() and true after it, backed by ' +
      'SupabaseRepository end-to-end')` — the integration-level proof this whole ticket exists for.

## Acceptance Criteria

- [x] All three tests pass against the real remote project.
- [x] `hasPriorRating` is never observed to read `false` for a symptom that was genuinely rated through this
      adapter, no matter how many `getGroup`/`saveGroup` round-trips preceded the check.
- [x] Zero regressions: full `pic-adapter-supabase` suite still green at its Wave 6 baseline count plus these
      new tests; `npx tsc --noEmit` and `depcruise` unchanged (0 violations).

## Resolution

### Solution Path

1. Extended `SymptomRow` with `rated_at: string | null`.
2. `rowToSymptom` uses `toNullableTimestamp(row.rated_at)`; `symptomToRow` persists `symptom.rated_at`.
3. Replaced ticket 12's degradation test with three Ticket 02 acceptance tests (including `GroupEngine` +
   `SupabaseRepository` integration).

### Test result (real remote project)

`pic-adapter-supabase`: **27 passed, 5 skipped** (was 23 + 2 schema + 2 new adapter tests).

### Acceptance Criteria

- [x] All three new tests pass
- [x] `hasPriorRating` trustworthy end-to-end
- [x] Full adapter suite green; no depcruise regressions
