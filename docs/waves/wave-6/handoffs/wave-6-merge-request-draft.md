# Merge Request — Wave 6 + Wave 6.5: Cloud-First Baseline

**Status:** Merged — `origin/main` @ `bb209a5` (pushed 2026-08-14)
**Base:** pre-Wave-6 (`c378dba` area on `origin/main`)
**Head:** `bb209a5` — `docs: finalize Wave 6/6.5 merge request as cloud-first baseline`
**Waves:** 6 (Tickets 12–13) + 6.5 Hardening (Tickets 01–06)

---

## Summary

Establishes the **Cloud-First baseline**: `pic-adapter-supabase` implements the full `RepositoryPort`
against real Postgres/RLS, including the **Atomic Promotion RPC** (Ticket 13 — highest-risk integration
point, DEC-017 Persistence Gate). Wave 6.5 hardening closes every Should-fix carry-forward from the Wave 6
handoff so Wave 8 UI work lands on a trustworthy foundation.

---

## Wave 6 — What landed

### Ticket 12 — `pic-adapter-supabase` standard CRUD

- All seven non-promotion `RepositoryPort` methods; RLS-only scoping (`auth.uid() = user_id`).
- Contract suite green against real remote Supabase (orchestrator-approved for unavailable local `supabase start`).

### Ticket 13 — Atomic Promotion RPC

- `promote_guest_to_account` — single transaction, idempotent under retry.
- **7-row adversarial matrix** all green + cross-identity-mismatch hardening.
- **Connection drop (Row 4):** client abort at **308ms** vs 3000ms `pg_sleep(3)`; clean retry succeeds.
- **Retry idempotency (Rows 5 & 6):** `use_count` stays **1** under both retry framings.

---

## Wave 6.5 — Hardening (all verified)

| Ticket | Deliverable | Verified |
|--------|-------------|----------|
| **01** | `symptoms.rated_at` column | EM manual apply + schema round-trip tests green |
| **02** | `SupabaseRepository` honors `rated_at` | `GroupEngine.hasPriorRating` E2E via adapter |
| **03** | `LocalGuestRepository.clear()` | Discard + successful promotion both evaporate localStorage |
| **04** | Shared `normalizeInViewUnit` | Single owner in `pic-engine`; 0 duplicate helpers |
| **05** | `used_increment_idempotency_keys uuid[]` | JSONB piggyback removed; contract `makeIdempotencyKey` |
| **06** | Tooling cleanup | `supabase-connectivity-check.mjs` + `docs/testing/supabase-remote-testing.md` |

---

## Final verification sweep (Wave 6.5 close-out)

### Connectivity check (`node scripts/supabase-connectivity-check.mjs`)

- [x] PostgREST reachable (200 OK)
- [x] All expected tables/columns present (including `rated_at`, `promoted_session_ids`, `used_increment_idempotency_keys`)
- [x] RPC `promote_guest_to_account` present
- [x] Clean-state: Wave 6 data tables at **0 rows**; `treatments` at **3** seed rows; `profiles` at **1** (EM account)

### Test suite (post-6.5 baseline — memorialized)

| Package | Result |
|---------|--------|
| `pic-adapter-supabase` | **31 passed, 5 skipped** |
| `pic-engine` / `pic-web` / `pic-adapter-local-guest` | **113 passed, 5 skipped** |

### Ticket 13 adversarial matrix (memorialized)

| Row | Scenario | Result |
|-----|----------|--------|
| 1 | Happy path — all five entities land | Green |
| 2 | Idempotent retry — identical payload | Green |
| 3 | Identity mismatch — `newUserId` ≠ session user | Rejects cleanly |
| 4 | Connection drop mid-RPC — retry succeeds | Green (308ms abort) |
| 5 | Retry after success — `use_count` stays 1 | Green |
| 6 | Alternate retry framing — `use_count` stays 1 | Green |
| 7 | Cross-account idempotency key collision | Rejects cleanly |

### Integrity gates

| Gate | Status |
|------|--------|
| `depcruise` (`pic-engine`) | **0 violations** (65 modules) |
| `depcruise` (`pic-web`) | **0 violations** (288 modules) |
| `pic-engine` business logic in Wave 6 | Untouched by design |
| Manual-apply migrations (01, 05) | Applied and verified by EM |

---

## Test plan checklist (reviewer — all complete)

- [x] `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run packages/pic-adapter-supabase` — 31 passed, 5 skipped
- [x] `npx vitest run packages/pic-engine packages/pic-web packages/pic-adapter-local-guest` — 113 passed, 5 skipped
- [x] `npm run depcruise` in `pic-engine` and `pic-web` — 0 violations
- [x] `node scripts/supabase-connectivity-check.mjs` — schema authoritative, clean-state confirmed
- [x] `symptoms.rated_at` persistence trustworthy (Ticket 02)
- [x] Guest `clear()` on discard and promotion (Ticket 03)
- [x] Idempotency unified on `uuid[]` column (Ticket 05)
- [x] Ticket 13 seven-row adversarial matrix green on remote Supabase

---

## Environment note

Remote Supabase project; `NODE_TLS_REJECT_UNAUTHORIZED=0` at shell only for tests. Manual SQL Editor apply
for migrations. Documented in `docs/testing/supabase-remote-testing.md`.

---

## Related docs

- `docs/audits/wave-6-handoff.md` — Wave 6 close-out
- `docs/audits/wave-6.5-handoff.md` — Wave 6.5 close-out
- `.scratch/pic-tracer-bullet/issues/12-*.md`, `13-*.md` — adapter + RPC resolutions
- `.scratch/pic-tracer-bullet-6.5/issues/` — hardening tickets 01–06
