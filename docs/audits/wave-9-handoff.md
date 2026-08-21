# Wave 9 Handoff — Structured Markdown Content Integration

**Date:** 2026-08-21  
**Status:** CLOSED — Real treatment content wired through Port → Guest bundle → pic-web seam → Unified Player

## Closed tickets

| ID | Commit | Summary |
|----|--------|---------|
| 01 | `099b861` | Content Parser (`parseStructuredMarkdown`, H3 split, blockquote rationale) |
| 02 | `4509304` | `RepositoryPort.getTreatment` + `Treatment` type (fake + Supabase) |
| 03 | (this wave) | Guest bundled `structured_markdown`; `LocalGuestRepository.getTreatment` |
| 04 | (this wave) | `treatmentContentActions` cache; `react-markdown` + `remark-gfm`; `AtomicUnitView` |
| 05 | (this wave) | Picker uses parsed unit ids; Zero-H3 guard copy |
| 06 | `03ca2a7` | Persistence Gate pre-RPC failure surfaced in retry UI |
| 07 | (this wave) | Regression guards (no-snapshot, Terminal NEMAR, sovereign `finishAnyway`) |
| 08 | (this wave) | E2E off stubs; screen tests updated; this handoff |

## E2E spine

Unchanged flow: `create-group` → `joint-treatment` → `group-summary` → `pick-treatment` → `player` →
Persistence Gate → atomic promotion → authenticated cloud verification.

**Player-phase change:** sessions now start with real parsed unit ids (`unit-1` … `unit-N`) from seed
Structured Markdown instead of hardcoded `intro` / `practice` stubs. Navigation-tree jump/revisit assertions
in `happy-path-e2e.test.tsx` target `unit-2` accordingly.

## Gates

| Gate | Result |
|------|--------|
| `npm test` (local) | 177+ passed; remote suites skip without `.env.local` |
| `depcruise --workspaces` | 0 violations |

## Architecture decisions (Wave 9)

- **Path B:** `PlayerEngine` / `PlayerSession.units` remain state-only (`unit_id`, `state`). Content lives
  outside the engine via `getTreatment` + Content Parser + tab-scoped pic-web cache.
- **Content cache:** module-scoped `Map` in `composition-root.ts`; fresh on tab reload.
- **Zero-H3 guard:** sovereign copy, inline on picker — no navigation away.

## User Story traceability (selected)

| Area | Status | Evidence |
|------|--------|----------|
| Guest flight-mode real content | PASS | `local-guest-repository.test.ts` — bundled `getTreatment`, zero fetch |
| Unified Player renders real units | PASS | `atomic-unit-view.test.tsx`, `unified-player-screen.test.tsx` |
| Picker → real unit ids | PASS | `treatment-picker-screen.test.tsx` |
| No content snapshots on timeline | PASS | `wave-9-regression.test.ts`; `timeline-engine.test.ts:26` |
| Terminal NEMAR with variable-length arrays | PASS | `wave-9-regression.test.ts` |
| Sovereign `finishAnyway` | PASS | `wave-9-regression.test.ts`; `player-engine.test.ts:206` |
| Persistence Gate env failure visible | PASS | `persistence-gate-modal.test.tsx` (ticket 06) |

## Should-fix carry-forward

- **Info affordance for `unit_rationale`:** parsed and cached but intentionally not rendered (Wave 9 scope).
- **Lazy Copy-on-Write / Personal Variants:** remains ADR-0002 / future wave scope.
- **Remote E2E:** `happy-path-e2e.test.tsx` still requires `.env.local` + service role for full spine.
