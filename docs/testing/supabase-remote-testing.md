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
NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run packages/pic-adapter-supabase
```

`NODE_TLS_REJECT_UNAUTHORIZED=0` is set **only at the shell** for test runs when the local TLS chain
blocks the remote project — never in shipped adapter source.

## Manual-apply migration checkpoint

Schema changes land as additive files under `supabase/migrations/`. The Event Manager applies each
migration manually via the **Supabase SQL Editor** before verification tests can go green:

1. Agent commits migration SQL + red tests.
2. Event Manager applies SQL in Supabase SQL Editor.
3. Event Manager confirms **"migration applied"**.
4. Agent runs green verification and closes the ticket.

Every migration uses `add column if not exists` / `create or replace function` patterns — safe to
re-run. Never edit an already-applied migration file in place.

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
