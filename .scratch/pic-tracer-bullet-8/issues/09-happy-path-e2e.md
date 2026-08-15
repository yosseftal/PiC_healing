# 08-09 — Happy-Path E2E Integration

**What to build:** end-to-end tracer bullet test — guest creates group → rates → picks treatment → player
→ gate → promote → authenticated resume.

**Blocked by:** 08-02, 08-06, 08-07, 08-08 (all done).

**Status:** done

**Brief:** `.scratch/pic-tracer-bullet-8/briefs/09-happy-path-e2e-brief.md`

**Source:** `.scratch/pic-tracer-bullet/issues/20-happy-path-e2e-integration.md` (orig. Ticket 20).

## Resolution

**Solution path:** Vitest + Testing Library integration test (`happy-path-e2e.test.tsx`) exercises the full
five-step spine through `GuestFlowRouter` + `PersistenceGateModal`. Remote promotion uses ephemeral test
users with `NODE_TLS_REJECT_UNAUTHORIZED=0`. SessionEngine skips replayed `runFinish` when promotion RPC
already applied Finish side effects (`timelineEvent.id === playerSession.id`).

**Architectural decisions:** Dumb-reflection fix in `SymptomGroupCreateScreen` — symptom count derived via
`getGroup(activeGroupId)` instead of local `symptomCount` state. Supabase `incrementUseCount` honors
`promoted_session_ids` for RPC/finish idempotency alignment.

**Deviations:** Adapter/session-engine seam fix required for promotion replay (discovered by E2E, not
anticipated in ticket 20 scope).

### Acceptance Criteria

- [x] Full five-step happy path runs green in one continuous pass (skippable offline)
- [x] Guest → Symptom Creation → Joint Test → Summary → Player → Gate → Promotion → Cloud
- [x] `use_count === 1`, exactly one Timeline event, rows under `auth.uid()`
- [x] No guest storage after successful promotion (DEC-017)
- [x] User Story traceability: covered by Wave 8 ticket tests + this E2E (see handoff)
- [x] No new screens; wiring/tests + minimal seam fixes only
- [x] `depcruise` — 0 violations
