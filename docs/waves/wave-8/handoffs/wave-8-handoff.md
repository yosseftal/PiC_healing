# Wave 8 Handoff — UI Landing (Tracer Bullet)

**Date:** 2026-08-15  
**Status:** CLOSED — Tracer Bullet vertical slice complete

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
| 08-09 | `8dbbab9` | Happy-path E2E + dumb-reflection gap + promotion replay seam |

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
| `npm test` | 186 passed, 10 skipped (remote suites; requires `.env.local` + `NODE_TLS_REJECT_UNAUTHORIZED=0`) |
| `depcruise` | 0 violations |

## Glossary additions (closure)

- **DEC-018** — Atomic Promotion idempotency: `promoted_session_ids`, `used_increment_idempotency_keys`,
  `md5()` payload fingerprint hotfix, `SessionEngine.promote` Finish replay guard.
- **CONTEXT.md** — `Atomic Promotion` entry added alongside Guest Mode / Persistence Gate.

## Seam fix (08-09)

`SessionEngine.promote` detects RPC-applied Finish (`timelineEvent.id === playerSession.id`) and marks
`success_declared` without replaying `PlayerEngine.finish*`, preventing duplicate timeline/library writes.
`SupabaseRepository.incrementUseCount` also honors `promoted_session_ids`.

## User Story traceability (spec § User Stories 1–45)

Source: `docs/docs/specs/tracer-bullet-happy-path.md`. **PASS** = automated test or landed implementation
with cited evidence.

### Guest Mode Bootstrap (1–5)

| # | Story (summary) | Status | Evidence |
|---|----------------|--------|----------|
| 1 | Open app, start immediately as Guest | PASS | `composition-root.ts` boots `LocalGuestRepository`; `app-shell.test.tsx` |
| 2 | Guest progress persists across page reload | PASS | `local-guest-repository.test.ts` — "page reload persistence" |
| 3 | No network until Persistence Gate | PASS | `happy-path-e2e.test.tsx` — guest-phase `fetchSpy` unchanged |
| 4 | Copy clarifies work is temporary until saved | PASS | `PersistenceGateModal.tsx` — on-device until anchor copy |
| 5 | Close without auth → Guest Group evaporates | PASS | `discardGuestState`; `composition-root.test.ts`; DEC-017 |

### Symptom Group Initialization (6–17)

| # | Story (summary) | Status | Evidence |
|---|----------------|--------|----------|
| 6 | One screen dedicated to naming a new group | PASS | `SymptomGroupCreateScreen.tsx`; `symptom-group-create-screen.test.tsx` |
| 7 | Add one or more symptoms, each with a name | PASS | `SymptomAddStep.tsx`; `symptom-group-create-screen.test.tsx` |
| 8 | Rate Polarity + Intensity when adding symptom | PASS | `RatingControl.tsx`; `symptom-group-create-screen.test.tsx` |
| 9 | First-time rating: no prior to hide | PASS | `RatingControl.tsx`; E2E `happy-path-e2e.test.tsx:152` |
| 10 | Blind-by-default with explicit Reveal | PASS | `RatingControl.tsx`; `group-engine.test.ts` API shape |
| 11 | One symptom per pass (Atomic Focus) | PASS | `SymptomAddStep.tsx` — repeatable single-symptom step |
| 12 | See created group with symptoms listed | PASS | `SymptomGroupSummaryScreen.tsx`; `joint-treatment-flow.test.tsx` |
| 13 | Guest group creation identical to authenticated | PASS | Same `GroupEngine` + `composition-root` path for both modes |
| 14 | Joint Treatment Muscle Test before finalize | PASS | `JointTreatmentMuscleTestStep.tsx`; `group-engine.test.ts` |
| 15 | "Yes" → finalize immediately | PASS | `joint-treatment-flow.test.tsx` — muscle-test-yes path |
| 16 | "No" → non-blocking split suggestion | PASS | `joint-treatment-flow.test.tsx` — split-advisory after muscle-test-no |
| 17 | "No" never forces split — finalize anyway | PASS | `JointTreatmentMuscleTestStep.tsx`; `joint-treatment-flow.test.tsx` |

### Standalone Treatment Selection (18–19)

| # | Story (summary) | Status | Evidence |
|---|----------------|--------|----------|
| 18 | Pick treatment from flat list (non-NEMAR) | PASS | `TreatmentPickerScreen.tsx`; `treatment-picker-screen.test.tsx` |
| 19 | Optional link to Symptom Group | PASS | `TreatmentPickerScreen.tsx`; `happy-path-e2e.test.tsx` |

### Unified Player Execution (20–33)

| # | Story (summary) | Status | Evidence |
|---|----------------|--------|----------|
| 20 | One Atomic Unit at a time | PASS | `UnifiedPlayerScreen.tsx`; `player-engine.test.ts` |
| 21 | Unit registers `in_view` on render | PASS | `player-engine.test.ts` — visibility transitions |
| 22 | Navigate forward → previous `completed` | PASS | `player-engine.test.ts` — `advance()` transitions |
| 23 | Navigation Tree for non-linear jumps | PASS | `NavigationTreePanel.tsx`; `unified-player-screen.test.tsx` |
| 24 | Forward tree jump → intermediate `skipped` | PASS | `player-engine.test.ts`; `happy-path-e2e.test.tsx:188-193` |
| 25 | Revisit `skipped` → upgrade to `completed` | PASS | `player-engine.test.ts`; `happy-path-e2e.test.tsx:195-199` |
| 26 | Revisit `completed` never reverts state | PASS | `player-engine.test.ts` — revisiting completed unit |
| 27 | Exit during `in_view` → not `completed` | PASS | `session-engine.test.ts` — `in_view` → `unseen` before promote |
| 28 | Mandatory Terminal NEMAR as last unit | PASS | `PlayerEngine` + `TERMINAL_NEMAR_UNIT_ID`; `TerminalNemarUnit.tsx` |
| 29 | Terminal NEMAR "Yes" → standard Finish | PASS | `FinishBar.tsx` — `finish-button` on nemar yes |
| 30 | Terminal NEMAR "No" → Integrating + Finish Anyway | PASS | `player-engine.test.ts`; `FinishBar.tsx` finish-anyway always |
| 31 | Finish Anyway always available | PASS | `FinishBar.tsx:24-30`; `unified-player-screen.test.tsx` |
| 32 | Finish Anyway → `success_declared: true` | PASS | `player-engine.test.ts` — sovereign success declaration |
| 33 | Player ends at Finish — no rating prompts after | PASS | `unified-player-screen.test.tsx` — no `RatingControl` |

### Persistence Gate & Promotion (34–39)

| # | Story (summary) | Status | Evidence |
|---|----------------|--------|----------|
| 34 | Gate only at Finish / Finish Anyway | PASS | `session-engine/index.ts` — `onFinishRequested` gates guest only |
| 35 | Social Auth + Magic Link options | PASS | `PersistenceGateModal.tsx` — stubs + dev tracer sign-in |
| 36 | Auth → Guest Group promoted in place | PASS | `happy-path-e2e.test.tsx`; `promote-path.test.ts` |
| 37 | Interrupted promotion → all-or-nothing | PASS | `supabase-repository.test.ts` — ticket 13 matrix |
| 38 | Decline auth → Finish does not persist | PASS | `PersistenceGateModal.tsx`; `persistence-gate-modal.test.tsx` |
| 39 | Authenticated EM → no Persistence Gate | PASS | `session-engine.test.ts` — auth pass-through |

### Library & Timeline Write (40–45)

| # | Story (summary) | Status | Evidence |
|---|----------------|--------|----------|
| 40 | `use_count` incremented exactly once on Finish | PASS | `happy-path-e2e.test.tsx`; `library-engine.test.ts`; ticket 13 |
| 41 | First execution auto-creates library row | PASS | `LibraryEngine.recordUse`; RPC; `supabase-repository.test.ts` |
| 42 | Timeline links library entry, not snapshot | PASS | `TimelineEngine`; `timeline-engine.test.ts`; RPC `library_row_id` |
| 43 | Timeline event carries `log_type` | PASS | `timeline-engine.test.ts`; `supabase-repository.test.ts` |
| 44 | All writes scoped to `auth.uid()` after promotion | PASS | `happy-path-e2e.test.tsx`; RLS on all tables |
| 45 | Stable UUID FK for treatment references | PASS | `tracer-bullet-seed-treatments.ts`; remote parity test |

**Traceability summary:** 45 / 45 PASS.

## Should-fix carry-forward (post-closure)

- Remote integration tests require `NODE_TLS_REJECT_UNAUTHORIZED=0` in some environments.
- Production Social Auth providers (Apple/Google) and Magic Link remain stubs in `PersistenceGateModal` until a
  dedicated auth wave.
