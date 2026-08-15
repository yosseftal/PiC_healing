# Wave 8 Handoff — UI Landing (Tracer Bullet)

**Date:** 2026-08-15  
**Status:** CLOSED

## Closed tickets

| ID | Commit | Summary |
|----|--------|---------|
| 08-01 | `d39a0dc` area | Promote path wiring, `swapToSupabaseAdapter` |
| 08-02 | `5899b84` | `PersistenceGateModal`, DEC-017 discard/clear |
| 08-03 | `a57dbf2` | Engine React context boundaries |
| 08-04 | `760e8f1` | Guest flow router, engine-derived screens |
| 08-05 | `9473e15` | `SymptomGroupCreateScreen`, blind rating |
| 08-06 | `03116c3` | Joint muscle test + read-only group summary |
| 08-07 | `50fbc87` | `listTreatments`, `TreatmentPickerScreen` |
| 08-08 | `325d2eb` | `UnifiedPlayerScreen` subtree, FK ID alignment |
| 08-09 | _(this commit)_ | Happy-path E2E + dumb-reflection gap + promotion replay seam |

## E2E spine (08-09)

`create-group` → `joint-treatment` → `group-summary` → `pick-treatment` → `player` → Persistence Gate →
atomic promotion → authenticated cloud verification.

Remote treatment IDs (FK-aligned):

| Title | UUID |
|-------|------|
| Settling the Nervous System | `2c6e77bd-61db-4898-8612-84e976587ff7` |
| Grounding Through the Feet | `c818490b-10ed-46c2-9890-1f35d34f4e25` |
| Loosening the Shoulders and Neck | `92be9fb3-7092-4a78-9fa2-4aee9ba34bc6` |

## Gates

| Gate | Result |
|------|--------|
| `npm test` | 186 passed, 10 skipped (remote suites) |
| `depcruise` | 0 violations |

## Seam fix (08-09 carry-forward)

`SessionEngine.promote` detects RPC-applied Finish (`timelineEvent.id === playerSession.id`) and marks
`success_declared` without replaying `PlayerEngine.finish*`, preventing duplicate timeline/library writes.
`SupabaseRepository.incrementUseCount` also honors `promoted_session_ids`.

## Should-fix carry-forward

- Remote integration tests require `NODE_TLS_REJECT_UNAUTHORIZED=0` in some environments.
- `advanceGuestFlowForTest` TODO in `guest-flow-facts.ts` — remove when all screens wire facts via engine actions.
