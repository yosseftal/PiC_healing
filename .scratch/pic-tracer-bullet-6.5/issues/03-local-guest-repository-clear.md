# 03 — Data Sovereignty: `LocalGuestRepository.clear()`

**Status:** done

**Commit:** `47bee5d` — `[03] LocalGuestRepository.clear() wired for discard and promotion`

## Resolution

### Solution Path

1. Added `GuestKeyValueStorage.removeItem` and `LocalGuestRepository.clear()` — deletes the storage key via
   `removeItem` (not an empty JSON overwrite).
2. Composition root `sessionEngineActions.discardGuestState` calls `guestRepository.clear()` after engine
   bookkeeping resets.
3. Composition root `onPromotionSucceeded` calls `void guestRepository.clear()` after provider swap.

### Tests (green)

- `clear()` empties storage for a fresh repo on the same key
- `discardGuestState` via composition root leaves no guest entity data
- Successful promotion clears storage and swaps active provider

### Acceptance Criteria

- [x] All three tests pass
- [x] Guest data physically removed on discard and promotion
- [x] Zero regressions in `session-engine` / `pic-adapter-local-guest` suites
