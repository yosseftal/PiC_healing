# 06 — Tooling Cleanup: retire Wave 6 audit script, finalize remote-connectivity docs

**Status:** done

## Resolution

### Solution Path

1. Deleted `scripts/wave6-supabase-audit.mjs`.
2. Added `scripts/supabase-connectivity-check.mjs` (wave-neutral schema/RPC/clean-state checks, includes
   Wave 6.5 columns `symptoms.rated_at`, `used_increment_idempotency_keys`).
3. Added `docs/testing/supabase-remote-testing.md` (remote testing workflow, `.env.local`, manual-apply
   checkpoints, `NODE_TLS_REJECT_UNAUTHORIZED=0` discipline).
4. Updated adapter test header comments to point at new doc/script.
5. Added `tooling-cleanup.test.ts` guard tests.

### Acceptance Criteria

- [x] Wave 6 audit script deleted
- [x] Durable doc + replacement script exist
- [x] Active source references updated
- [x] `pic-adapter-supabase` suite green (31 passed, 5 skipped)
