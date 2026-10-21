# 04 — Architectural Integrity: shared `withInViewNormalized` helper

**Status:** done

**Commit:** `47bee5d` — landed with Ticket 03 in same commit

## Resolution

### Solution Path

1. Added `normalizeInViewUnit` in `packages/pic-engine/src/normalize-in-view-unit.ts`, exported from barrel.
2. Replaced private copies in `SessionEngine`, `LocalGuestRepository`, and `SupabaseRepository`.
3. Deleted all three private `withInViewNormalized` / equivalent implementations.

### Tests (green)

- Unit test covers all four DEC-015 states on shared helper
- Full `pic-engine` + `pic-adapter-local-guest` + `pic-adapter-supabase` suites pass unchanged
- `depcruise`: 0 violations (`pic-engine` 65 modules, `pic-web` 288 modules)

### Acceptance Criteria

- [x] Shared helper test passes
- [x] Zero behavior change across all three packages
- [x] depcruise 0 violations
- [x] No remaining private `withInViewNormalized`-shaped functions in source
