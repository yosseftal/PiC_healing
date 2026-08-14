# 05 — Idempotency Unification: single `uuid[]` standard

**Status:** done

**Commits:** `db709d4` (migration + adapter), post-apply fixes in next commit

## Resolution

### Solution Path

1. Migration `20260814131500_used_increment_idempotency_keys.sql` adds
   `used_increment_idempotency_keys uuid[] not null default '{}'`.
2. `incrementUseCount` reads/writes the dedicated column; removed JSONB piggyback
   (`_usedIncrementIdempotencyKeys` in `provenance`).
3. Contract suite gained optional `makeIdempotencyKey` (defaults unchanged for fake/local-guest);
   `pic-adapter-supabase` passes `randomUUID` because Postgres column is `uuid[]`.
4. Adapter-specific increment tests use `makeContractTreatmentId()` for row isolation on shared remote state.

### Test result (post-EM-apply)

`pic-adapter-supabase`: **31 passed, 5 skipped** (was 27 + 2 tooling + 2 idempotency tests adjusted).

### Acceptance Criteria

- [x] Migration applied and column live
- [x] All three Ticket 05 idempotency tests pass
- [x] No new `_usedIncrementIdempotencyKeys` written to `provenance`
- [x] Full adapter suite green
