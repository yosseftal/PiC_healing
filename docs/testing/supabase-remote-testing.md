# Supabase Remote Testing

This repo's `pic-adapter-supabase` suite runs against the Event Manager's **real remote Supabase
project**, not a local `supabase start` instance. That substitution is orchestrator-approved (see
`docs/audits/wave-6-handoff.md` and Wave 6.5 tickets 01/05).

## Why remote?

The development sandbox has no Docker / Supabase CLI. Tests still require real Postgres, RLS, and
PostgREST — never a mocked Supabase client.

## Credentials

Store in git-ignored `.env.local` at the repo root:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Test files load these via the same parsing pattern as `scripts/supabase-connectivity-check.mjs`.
**Never log key values** in scripts, tests, or CI output.

## Running adapter tests

```bash
npx vitest run packages/pic-adapter-supabase
```

TLS certificate verification must remain enabled. Resolve connectivity or trust configuration
before verification; test code and command invocations must not disable certificate verification.
Remote suites fail clearly when credentials are absent instead of registering skipped tests.
The root `npm test` command includes remote adapter and web integration tests.

## Manual-apply migration checkpoint

Schema changes land as additive files under `supabase/migrations/`. The Event Manager applies each
migration manually via the **Supabase SQL Editor** before verification tests can go green:

1. Agent commits migration SQL + red tests.
2. Event Manager applies SQL in Supabase SQL Editor.
3. Event Manager confirms **"migration applied"**.
4. Agent runs green verification and closes the ticket.

Every migration uses `add column if not exists` / `create or replace function` patterns — safe to
re-run. Never edit an already-applied migration file in place.

Wave 10's approved exception to step 1: prepare and open the reviewable uncommitted SQL, obtain the
Event Manager's manual application confirmation, verify every gate, then commit. The Event Manager
confirmed application of `20261006185500_promote_guest_to_account_rated_at.sql` on 2026-10-06.

## Pre-flight connectivity check

```bash
node scripts/supabase-connectivity-check.mjs
```

Sanitized output only: host reachability, expected table/column presence (including Wave 6.5 columns
`symptoms.rated_at`, `personal_treatment_library.used_increment_idempotency_keys`), RPC existence, and
per-table row counts for clean-state sweeps after test runs.

## Test hygiene

- Ephemeral Auth users and fixture rows are created per run and deleted in `afterAll`.
- Contract-suite tests use isolated `treatments` pool rows and UUID idempotency keys (`makeTreatmentId` /
  `makeIdempotencyKey` on `RepositoryPortContractOptions`) to avoid cross-test contamination on shared
  remote state.
- Promotion success contracts execute against the fake and real Supabase; Local Guest storage executes
  linked/unlinked rejection contracts because promotion must target the authenticated adapter (DEC-017).
- Real promotion contracts provision a fresh authenticated owner per test, correlate the idempotency key
  with `group.id` or `playerSession.id`, and retain all success, retry, identity and no-write assertions.
  Shared-treatment executions use the same owner; independent owners have separate RLS-scoped ports.
- Fully rated promotion snapshots retain `rated_at` through the adapter payload and transactional RPC.
  Apply `supabase/migrations/20261006185500_promote_guest_to_account_rated_at.sql` through the manual SQL
  Editor checkpoint above before running the complete green gate. The regression must stay red against
  the old RPC, which drops rating timestamps; do not replace its fixtures with null ratings.
- The full symptom payload, including `rated_at`, participates in strict idempotency fingerprinting.
  A replay with a changed rating timestamp must reject without changing the original group, session,
  or library use count. Null timestamps retain the legacy omitted-field wire shape, so unrated legacy
  receipts replay without duplication. Legacy rated receipts can reject new rated-snapshot retries
  because their original payload never transmitted the timestamp; strict fingerprint validation is
  preserved rather than accepting a divergent snapshot or rewriting past receipts.
