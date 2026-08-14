# Wave 8 — UI Landing (Tracer Bullet)

**Baseline:** Cloud-First + Tickets 08-01–08-07 landed (except 08-06, 08-08, 08-09).

## Ticket tracker

| ID | Title | Status | Blocked by |
|----|-------|--------|------------|
| 08-01 | Promote path wiring | **done** | — |
| 08-02 | PersistenceGateModal | **done** | 08-01 |
| 08-03 | Engine context expansion | **done** | — |
| 08-04 | Guest flow router | **done** | — |
| 08-05 | SymptomGroupCreateScreen | **done** | 08-03, 08-04 |
| 08-06 | Joint treatment + summary | ready-for-agent | 08-05 |
| 08-07 | listTreatments + picker | **done** | 08-03, 08-04 |
| 08-08 | UnifiedPlayerScreen | ready-for-agent | 08-03, 08-07 |
| 08-09 | Happy-path E2E | ready-for-agent | 08-02, 08-06, 08-07, 08-08 |

## Recent commits

- `a57dbf2` — [08-03] Engine context boundaries
- `760e8f1` — [08-04] Guest flow router
- `9473e15` — [08-05] SymptomGroupCreateScreen
- `[08-07]` — listTreatments + TreatmentPickerScreen (pending commit)

## Next frontier

**08-06** (joint treatment + summary) and **08-08** (UnifiedPlayerScreen) — can parallel after 08-07 commit.

## Gates

- [x] `depcruise` pic-web — 0 violations
- [ ] Wave 8 E2E (08-09)
- [ ] `docs/audits/wave-8-handoff.md`
