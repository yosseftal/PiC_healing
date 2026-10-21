# 11 — Supabase schema migration for the tracer-bullet tables

**What to build:** one new SQL migration extending `supabase/migrations/20260308164004_initial_schema.sql`
with the tracer bullet's four new tables, the `symptom_groups`/`symptoms` column extensions, RLS policies,
DEC-017's missing `profiles` columns, and seed `treatments` rows.

**Blocked by:** None — pure SQL against the spec's §B, can start immediately in parallel with Phase 1–3
engine work.

**Status:** done

**Source:** `docs/specs/tracer-bullet-happy-path.md` §B in full, `decisions.md` DEC-017 §5 (Consequences →
Schema), existing `supabase/migrations/20260308164004_initial_schema.sql`.

## Objective

No application code touches Postgres directly except through this schema and the two Supabase adapter
tickets (12, 13). This ticket is pure DDL — get the shape right once so nothing downstream has to alter it
except in dedicated follow-up migrations.

## ⚠ Known discrepancy to resolve as part of this ticket

The spec assumes DEC-017's `profiles` columns (`email`, `consent_timestamp`, `role`, `last_server_auth_at`)
already exist. **They do not** — the current migration only has `id`, `full_name`, `language_preferences`,
`updated_at`. This ticket must add the missing DEC-017 columns as part of its migration (see DoD below);
this is not scope creep, it's a documented prerequisite this ticket is the natural place to close.

## Context Injection (copied verbatim from the spec §B — this is the single source of truth)

> `symptom_groups` — extend the existing table (`id`, `user_id`, `name`, `created_at`) with
> `joint_treatment_muscle_test` (`enum: 'together' | 'split_suggested'`, not null — DEC-002) and
> `joint_treatment_test_at` (timestamp).
>
> `symptoms` — extend the existing table with `polarity` (`enum: 'positive' | 'negative'`, not null,
> DEC-009) and `intensity` (`int`, 0–10 inclusive check constraint, not null, DEC-010 §1 — independent
> column from `polarity`, never derived from it). The existing `inquiry_prompts` column is unused by this
> spike and left as-is.
>
> `treatments` (new, minimal seed table for this spike only — **not** the full Treatments Table that
> GQ-020 will define): `id uuid default gen_random_uuid() primary key`, `title`, `structured_markdown`
> (Structured Markdown source, H3 = Atomic Unit), `content_format` (`'structured_markdown'`), seeded with a
> handful of fixed rows so the Player has something real to run.
>
> `player_sessions` (new): `id`, `user_id`, `treatment_id`, `linked_group_id` (nullable FK to
> `symptom_groups`), `units` (jsonb: `[{unit_id, unit_order, state, unit_title}]`, `in_view` never
> persisted here either), `terminal_nemar_response`, `success_declared` (bool, set only by Finish / Finish
> Anyway), `integrating_reason` (`'mid_exit' | 'terminal_nemar_no'`, nullable), `finished_at` (nullable
> timestamp), `created_at`. No rating column.
>
> `personal_treatment_library` (new): `id`, `user_id`, `treatment_id` (FK), `use_count` (int, default 0),
> `provenance` (jsonb), `variant_type` (`'original'` for this spike), `global_reference_id` (FK to
> `treatments.id`), `protocol_content` (null for this spike), `created_at`.
>
> `timeline_events` (new): `id`, `user_id`, `log_type` (`'treatment_execution'` for this spike), `treatment_id`
> (nullable), `library_row_id` (nullable FK), `linked_group_id` (nullable FK), `metadata` (jsonb),
> `created_at`.
>
> All four new tables get `alter table ... enable row level security;` and a
> `create policy ... using (auth.uid() = user_id)` policy, matching the existing migration's pattern exactly.
>
> ...every primary key in every table below — new or existing — is `uuid default gen_random_uuid()`,
> matching the existing migration; no table introduced by this spec uses a serial/int identity column.

From `decisions.md` DEC-017 §5 (Consequences → Schema), the `profiles` columns this ticket must add:

> `profiles`: `id` (UUID, PK, = `auth.uid()`), `email`, `consent_timestamp`, `role` (enum, default
> `'event_manager'`), `last_server_auth_at` (timestamp)... [`deletion_status`/`deletion_requested_at` are
> explicitly out of scope for this spike per the tracer-bullet spec].

## Definition of Done

- New file `supabase/migrations/<timestamp>_tracer_bullet_schema.sql` with a timestamp later than
  `20260308164004`.
- `alter table public.profiles` adds `email text`, `consent_timestamp timestamptz`, `role text not null
  default 'event_manager'`, `last_server_auth_at timestamptz` (use `add column if not exists` for
  safety). Do **not** add `deletion_status` or `deletion_requested_at` — out of scope.
- `alter table public.symptom_groups` adds `joint_treatment_muscle_test text not null check
  (joint_treatment_muscle_test in ('together', 'split_suggested'))` and `joint_treatment_test_at
  timestamptz`. If the local dev database already has rows in this table when the migration runs, add a
  safe default/backfill step rather than letting the `not null` addition fail — flag this explicitly if
  encountered.
- `alter table public.symptoms` adds `polarity text not null check (polarity in ('positive',
  'negative'))` and `intensity int not null check (intensity between 0 and 10)`.
- `create table public.treatments (id uuid primary key default gen_random_uuid(), title text not null,
  structured_markdown text not null, content_format text not null default 'structured_markdown',
  created_at timestamptz not null default now());` plus **at least 2–3 seed rows** with real Structured
  Markdown (H3-delimited Atomic Units). Do not include a Terminal NEMAR unit in the seed markdown —
  `PlayerEngine` (ticket 08) always injects it at runtime.
- `create table public.player_sessions (...)` with every field from §B, `units jsonb not null default
  '[]'`, `success_declared boolean not null default false`, `integrating_reason text check
  (integrating_reason in ('mid_exit', 'terminal_nemar_no'))`, `linked_group_id uuid references
  public.symptom_groups(id)` (nullable), `treatment_id uuid references public.treatments(id) not null`,
  `user_id uuid references public.profiles(id) on delete cascade not null`.
- `create table public.personal_treatment_library (...)` with every field from §B, `use_count int not null
  default 0`, `variant_type text not null default 'original' check (variant_type = 'original')` (this
  spike only ever produces `'original'` rows), `global_reference_id uuid references public.treatments(id)`.
- `create table public.timeline_events (...)` with every field from §B, `log_type text not null default
  'treatment_execution'`, `library_row_id uuid references public.personal_treatment_library(id)`
  (nullable), `linked_group_id uuid references public.symptom_groups(id)` (nullable).
- All four new tables: `alter table ... enable row level security;` plus `create policy "..." on
  public.<table> for all using (auth.uid() = user_id);`, matching the existing migration's exact wording
  pattern.
- `supabase db reset` (or `supabase start` against a clean local instance) applies this migration with zero
  errors.

## Do Not Touch / Out of Scope

- Do not touch `public.treatment_logs` — legacy table, unrelated to this spec, leave untouched.
- Do not implement the `promote_guest_to_account` RPC function — that is ticket 13's own migration file,
  layered on top of these tables, not this one.
- Do not add `deletion_status`/`deletion_requested_at` to `profiles` — explicitly out of scope for this
  spike.
- Do not add `device_id`/`last_sync_at` scaffolding — DEC-017 reserves these for future GQ-016 work, not
  required by this spike's happy path.
- Do not implement any application code (adapter, engine) in this ticket — SQL only.

## Testing Requirement

This ticket has no `pic-engine` unit tests — it is pure SQL. Its acceptance criteria are:

- [x] `supabase db reset` succeeds locally with zero errors.
- [x] A manual smoke check: `insert` a row into each of the four new tables under a test `auth.uid()`
      session succeeds; a `select` under a **different** `auth.uid()` session returns zero rows (RLS smoke
      check) — this becomes the fixture ticket 12's and ticket 13's Supabase-backed tests build on.
- [x] Seed `treatments` rows are queryable and contain valid H3-delimited Structured Markdown.

## Acceptance Criteria

- [x] All four new tables exist with the exact columns specified above.
- [x] `symptom_groups` and `symptoms` are extended, not replaced.
- [x] `profiles` has the four missing DEC-017 columns added.
- [x] RLS is enabled with an `auth.uid() = user_id` policy on all four new tables.
- [x] At least 2–3 seed `treatments` rows exist with valid Structured Markdown.

## Resolution

Landed on `main` in `supabase/migrations/20260730194911_tracer_bullet_schema.sql` (commits `3f8b0bd` and
Wave 2.5 hardening `7f2e722`, `71fbcd2`, `48fbefe`).

**Profiles (DEC-017):** added `email`, `consent_timestamp`, `role` (default `'event_manager'`),
`last_server_auth_at`. `deletion_status` / `deletion_requested_at` intentionally omitted (out of spike
scope).

**Symptom Groups & Symptoms (existing tables extended):**

- `symptom_groups` — `joint_treatment_muscle_test` (`'together' | 'split_suggested'`, DEC-002) and
  `joint_treatment_test_at`; safe backfill to `'together'` before `NOT NULL` enforcement.
- `symptoms` — `polarity` (`'positive' | 'negative'`, DEC-009) and `intensity` (0–10 check, DEC-010);
  independent dimensions, never derived from each other.

**Four new tables:**

| Table | Purpose |
| --- | --- |
| `treatments` | Seed catalog — Structured Markdown (H3 = Atomic Unit), 2–3 seed rows |
| `player_sessions` | Unified Player execution state; `integrating_reason` for Integrating mid-exits |
| `personal_treatment_library` | Per-EM toolbox; `use_count`, `unique(user_id, treatment_id)` |
| `timeline_events` | Chronological persistence spine; `log_type: 'treatment_execution'` for spike |

**Hybrid ownership (ADR-0001):** `treatments` has nullable `user_id` — `NULL` = **Global Content** (shared
seed catalog), non-null = **Personal Content** (EM-authored). RLS policy:
`using (user_id is null or auth.uid() = user_id)`. The other three new tables keep strict per-EM ownership
(`auth.uid() = user_id`). See `docs/adr/0001-hybrid-ownership-for-shared-reference-tables.md`.

**Wave 2.5 hardening:** `protocol_content` migrated to `jsonb`; RLS policy names use "Event Managers"
vocabulary; `personal_treatment_library` enforces `unique(user_id, treatment_id)`.

Ticket 13 (`promote_guest_to_account` RPC) remains deferred — this migration supplies the table shapes the
RPC will target.
