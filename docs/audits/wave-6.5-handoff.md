# Wave 6.5 Handoff — Hardening

**Closed tickets:** 01–06 (all Wave 6.5 carry-forward items from `docs/audits/wave-6-handoff.md`).

**Fixed point:** `main` after Wave 6.5 close-out commits.

## Environment (unchanged from Wave 6)

Remote Supabase project; manual SQL Editor apply for migrations; `NODE_TLS_REJECT_UNAUTHORIZED=0` at shell
only for tests. Documented in `docs/testing/supabase-remote-testing.md`.

## Depcruise status

Zero violations (re-verified at wave close).

## Test suite status

- `pic-adapter-supabase`: **31 passed, 5 skipped**
- `pic-engine` / `pic-web` / `pic-adapter-local-guest`: **113 passed, 5 skipped** (unchanged baseline + Ticket 04 helper test)

## What landed

| Ticket | Deliverable |
|--------|-------------|
| 01 | `symptoms.rated_at` column |
| 02 | `SupabaseRepository` honors `rated_at` — Blind-by-Default trustworthy against Supabase |
| 03 | `LocalGuestRepository.clear()` on discard + promotion (DEC-017) |
| 04 | Shared `normalizeInViewUnit` in `pic-engine` |
| 05 | `used_increment_idempotency_keys uuid[]` — JSONB piggyback removed |
| 06 | `wave6-supabase-audit.mjs` retired; `supabase-connectivity-check.mjs` + remote testing doc |

## Contract suite amendment (Ticket 05)

`repository-port.contract.ts` gained optional `makeIdempotencyKey` (parallel to Ticket 12's `makeTreatmentId`)
for Postgres `uuid[]` idempotency columns.

## Not carried forward

None — all six Should-fix items from Wave 6 handoff addressed.
