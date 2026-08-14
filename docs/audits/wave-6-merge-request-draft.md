# Draft Merge Request — Wave 6: The Pivot to Cloud

**Status:** Draft (orchestrator-prepared; not yet opened on remote)
**Base branch:** `origin/main` (pre-Wave-6)
**Head branch:** `main` (fixed point `a77e854` + handoff tooling at `8c2899d`)
**Wave:** 6 — Tickets 12 & 13

---

## Summary

Wave 6 delivers the cloud persistence layer for the PiC tracer bullet: a production-grade
`pic-adapter-supabase` implementing every `RepositoryPort` method against real Postgres/RLS, plus the
**Atomic Promotion RPC** — the single highest-risk integration point in the product (DEC-017 Persistence
Gate). An Event Manager's full Guest inquiry (Symptom Group, symptoms, Unified Player session, Personal
Treatment Library row, Timeline event) can now promote into a newly authenticated account in one
all-or-nothing Postgres transaction, with idempotent retry safety.

This MR closes Wave 6. **Wave 6.5 Hardening** (six carry-forward tickets) is listed below for transparency
and will land as a follow-up wave before UI-heavy Wave 8.

---

## What landed

### Ticket 12 — `pic-adapter-supabase` standard CRUD

- Implements all seven non-promotion `RepositoryPort` methods against real Supabase Postgres/Auth, scoped
  exclusively by RLS (`auth.uid() = user_id`) — no client-side-only authorization substitutes.
- Shared `RepositoryPort` contract suite runs green against the **real remote Supabase project** (orchestrator-
  approved substitution for unavailable local `supabase start`).
- `promoteGuestToAccount` left as a clearly-labeled stub (ticket 13 scope).
- Honest degradation documented for `Symptom.rated_at` (no column yet — Wave 6.5 Ticket 01/02).

**Test result:** 23 passed, 5 skipped (`pic-adapter-supabase`); zero regressions elsewhere (109 passed, 5
skipped).

### Ticket 13 — Atomic Promotion RPC (`promoteGuestToAccount`) — HIGHEST RISK

- New `promote_guest_to_account` Postgres function (`security definer`, one implicit transaction, no
  swallowed exceptions).
- `personal_treatment_library.promoted_session_ids uuid[]` prevents double `use_count` increment on retry.
- `symptom_groups.promotion_payload_fingerprint` enforces identity-mismatch hardening
  (`PromoteGuestToAccountIdentityMismatchError` contract).
- `SupabaseRepository.promoteGuestToAccount` calls the RPC exactly once per invocation — no client-side
  multi-insert fallback.
- `auth.uid() = p_new_user_id` authorization guard (Event Manager reviewed and accepted before apply).

#### 7-row Adversarial Matrix — all green

| Row | Scenario | Result |
|-----|----------|--------|
| 1 | Happy path, no group link | All 5 rows promoted; `use_count = 1`; guest cleared |
| 2 | Happy path, with group link | Link carried on session + timeline |
| 3 | Mid-transaction failure (forced FK violation) | Zero rows in any table |
| 4 | Mid-transaction failure (connection drop) | Zero rows; clean retry succeeds |
| 5 | Retry idempotency (success then retry) | Exactly one row-set; `use_count = 1` |
| 6 | Dropped-response retry | Exactly one row-set; `use_count = 1` |
| 7 | Partial-payload rejection | Clean error; zero rows written |

**Plus** 1 extra hardening test: cross-identity-mismatch rejection.

#### Connection Drop win (Row 4 — real observed timing)

Instrumented abort race against server-side `pg_sleep(3)`:

- Client `AbortController` fired at **308ms** (target 300ms) — error: `AbortError: This operation was aborted`
- Abort wins well before the 3-second server sleep completes
- Subsequent zero-row assertion + clean retry both pass
- Confirms the all-or-nothing guarantee is real on this project's latency profile, not aspirational prose

#### Retry idempotency (Rows 5 & 6 — real observed values)

- Row 5: `first.libraryRow.use_count = 1`, `second.libraryRow.use_count = 1`
- Row 6: `dropped.libraryRow.use_count = 1`, `retry.libraryRow.use_count = 1`
- Exactly one `timeline_events` row per session id under both retry framings

**Test result:** 8/8 `promoteGuestToAccount` tests pass; full adapter suite 23 passed, 5 skipped; stable
across 4 consecutive runs.

---

## Integrity gates (Wave 6 close-out)

| Gate | Status |
|------|--------|
| `depcruise` (`pic-engine`) | 0 violations (63 modules) |
| `depcruise` (`pic-web`) | 0 violations (286 modules) |
| Workspace regressions | None (109 + 23 passed) |
| `pic-engine` touched | No — by design (adapter-only wave) |
| Clean-state sweep | All Wave 6 tables at 0 rows after every run |

---

## Environment deviation (wave-wide, orchestrator-approved)

No Docker / Supabase CLI in this sandbox. All adapter tests ran against the Event Manager's **real remote
Supabase project** with `NODE_TLS_REJECT_UNAUTHORIZED=0` at the shell invocation only (never in shipped
source). Schema/RPC changes applied manually by the Event Manager via Supabase SQL Editor at three
checkpoints (ticket 11 carry-over, ticket 13 RPC, ticket 13 `digest()` → `md5()` hotfix).

---

## Carry-forward Hardening — Wave 6.5 (not in this MR)

The following six tracer-bullet tickets address Should-fix items from `docs/audits/wave-6-handoff.md`. They
are **out of scope for this MR** and will land in Wave 6.5 before Wave 8 UI work begins.

| Ticket | Title | Blocked by |
|--------|-------|------------|
| **01** | Schema: `symptoms.rated_at` column | — |
| **02** | Adapter: Supabase honors `Symptom.rated_at` | 01 |
| **03** | Data Sovereignty: `LocalGuestRepository.clear()` | — |
| **04** | Architectural Integrity: shared `withInViewNormalized` helper | — |
| **05** | Idempotency Unification: single `uuid[]` standard | 02 |
| **06** | Tooling Cleanup: retire Wave 6 audit script | 01, 02, 05 |

**Frontier (in progress):** Tickets 01, 03, 04 dispatched in parallel.

---

## Test plan (for reviewers)

- [ ] `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run packages/pic-adapter-supabase` — 23 passed, 5 skipped
- [ ] `npx vitest run packages/pic-engine packages/pic-web packages/pic-adapter-local-guest` — 109 passed, 5 skipped
- [ ] `npm run depcruise` in `pic-engine` and `pic-web` — 0 violations
- [ ] `npm run typecheck --workspaces --if-present` — 0 errors
- [ ] Confirm `promote_guest_to_account` RPC exists in Supabase (SQL Editor or audit script)
- [ ] Confirm clean-state: Wave 6 tables at 0 rows, `treatments` at 3 seed rows

---

## Related docs

- `docs/audits/wave-6-handoff.md` — full wave close-out note
- `.scratch/pic-tracer-bullet/issues/12-adapter-supabase-crud.md` — ticket 12 Resolution
- `.scratch/pic-tracer-bullet/issues/13-atomic-promotion-rpc.md` — ticket 13 Resolution (adversarial matrix)
- `.scratch/pic-tracer-bullet-6.5/issues/` — Wave 6.5 hardening tickets
