# 01 — Schema: `symptoms.rated_at` column

**What to build:** the additive Supabase migration that gives `public.symptoms` a real, live
`rated_at timestamptz null` column — closing the schema gap `pic-adapter-supabase` has been honestly
working around since Wave 4/5 (audit finding SF-1, carried through ticket 12 unresolved).

**Blocked by:** None — can start immediately.

**Status:** done

**Source:** `docs/audits/wave-6-handoff.md` "Should-fix carry-forward" item 2; ticket 12's Deviation #2
(`.scratch/pic-tracer-bullet/issues/12-adapter-supabase-crud.md`); `packages/pic-engine/src/types.ts`'s
`Symptom.rated_at` doc comment (ticket 07 — the domain field this column must finally back).

## Objective

`GroupEngine.hasPriorRating` (Blind-by-Default rating, DEC-011) reads `Symptom.rated_at` to distinguish
"named via `addSymptom`, never yet rated" from "already rated at least once." That domain field has existed
correctly in `pic-engine` since ticket 07. `pic-adapter-local-guest` supports it for free (plain object
serialization). `pic-adapter-supabase` cannot, because `public.symptoms` has no matching column — ticket
12's own permission table forbade adding migrations, so it made the honest choice to always return
`rated_at: null` rather than fabricate a value. This ticket removes that constraint by shipping the column.

## Definition of Done

- New migration file (e.g. `supabase/migrations/<timestamp>_symptoms_rated_at.sql`) adds
  `alter table public.symptoms add column if not exists rated_at timestamptz;` — nullable, no default, no
  backfill needed (existing rows correctly read as "never rated").
- Matches this wave's established migration hygiene: additive only, safe to re-run, its own new file — never
  edits an already-applied migration in place.
- Applied by the Event Manager via the Supabase SQL Editor (same manual-apply checkpoint pattern as tickets
  11/12/13 — this sandbox has no Docker/Supabase CLI/direct Postgres connection).

## Do Not Touch / Out of Scope

- Do not modify `SupabaseRepository`'s `getGroup`/`saveGroup` mapping — that is Ticket 02's exclusive scope,
  blocked on this ticket's migration actually being live first.
- Do not touch any other column or table.
- Do not modify `pic-engine`'s `Symptom` type — it is already correct and unchanged since ticket 07.

## Testing Requirement — Test-First Acceptance Criteria

Proves the column exists and round-trips correctly, independent of any adapter code (which doesn't use it
yet) — a direct Supabase-client test, not routed through `SupabaseRepository`:

- [x] `it('a symptoms row written with a rated_at timestamp reads that exact value back')`
- [x] `it('a symptoms row written with no rated_at reads back as null (existing rows unaffected)')`

## Acceptance Criteria

- [x] Migration applied to the real remote Supabase project and confirmed present (e.g. via a schema-presence
      check, direct query, or a temporary sweep — this wave's `scripts/wave6-supabase-audit.mjs` may be reused
      for this one last time; see Ticket 06, which is deliberately blocked on this ticket).
- [x] Both round-trip tests pass against the real project.
- [x] Zero regressions: full workspace test suite and `depcruise` unchanged from the Wave 6 baseline (109
      passed / 5 skipped outside `pic-adapter-supabase`; `pic-adapter-supabase` unaffected since no adapter
      code changes here).

## Resolution

**Commit:** `b821380` (migration + red tests); post-apply verification in `7f...` (orchestrator, after EM apply).

### Solution Path

1. Added `supabase/migrations/20260814130000_symptoms_rated_at.sql`.
2. Added `packages/pic-adapter-supabase/src/symptoms-rated-at-schema.test.ts` — direct client round-trips.
3. Proven RED pre-apply (`PGRST204` / `42703` column missing).
4. Event Manager applied migration via Supabase SQL Editor.
5. Post-apply: **2/2 green** (timestamp comparison normalized via `toISOString()` on read, matching ticket 12's
   Postgres round-trip discipline).

### Acceptance Criteria

- [x] Migration file exists
- [x] Red tests proven pre-apply
- [x] Migration applied (EM confirmed)
- [x] Both tests green post-apply
- [x] Zero adapter regressions (Ticket 02 owns adapter mapping)
