# Wave 9 Handoff — Structured Markdown Content Integration

**Date:** 2026-08-21 (Wave 9 core); amended 2026-08-26 (Wave 9.1 Resilience Hardening, planning only)  
**Status:** Wave 9 core CLOSED — Real treatment content wired through Port → Guest bundle → pic-web seam →
Unified Player. **Wave 9.1 amendment: specified, not yet implemented** — see "Post-closure amendment"
below and `docs/specs/structured-markdown-content-integration.md`.

## Closed tickets

| ID | Commit | Summary |
|----|--------|---------|
| 01 | `099b861` | Content Parser (`parseStructuredMarkdown`, H3 split, blockquote rationale) |
| 02 | `4509304` | `RepositoryPort.getTreatment` + `Treatment` type (fake + Supabase) |
| 03 | `3eca3c3` | Guest bundled `structured_markdown`; `LocalGuestRepository.getTreatment` |
| 04 | `125e90a` | `treatmentContentActions` cache; `react-markdown` + `remark-gfm`; `AtomicUnitView` |
| 05 | `6aedac8` | Picker uses parsed unit ids; Zero-H3 guard copy |
| 06 | `03ca2a7` | Persistence Gate pre-RPC failure surfaced in retry UI |
| 07 | `2651d63` | Regression guards (no-snapshot, Terminal NEMAR, sovereign `finishAnyway`) |
| 08 | `fab5faa` | E2E off stubs; screen tests updated; this handoff |

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

## Post-closure amendment: Wave 9.1 Resilience Hardening (2026-08-26)

A Sovereign Domain Audit run after this wave closed (`docs/audits/wave-9-detailed-audit.md`) found three
Must-Fix gaps — a Safe Container restore/mount leak, an unproven offline GFM claim, and six ticket files
missing their `## Resolution` (this appendix exists to close that third gap durably). Executive Command
additionally directed a Heuristic Fallback correction and a build-time Bootstrap Integration Test. All five
are specified as the **Wave 9.1 amendment** in
`docs/specs/structured-markdown-content-integration.md` and staged as rewritten tickets under
`.scratch/md_content_integration/issues/`. **Not yet implemented** — this is the documentation/planning
record; implementation is a separate, EM-approved follow-up pass.

## Appendix A — Ticket Resolution Log

Durable archive of every Wave 9 ticket's `## Resolution`, so this record survives independent of
`.scratch/` (gitignored — `.gitignore:4`). 01 and 06 are copied verbatim from their ticket files, which
already carried a Resolution section. 02, 03, 04, 05, 07, 08 are reconstructed from the shipped commits and
tests, following the same reconstruction `wave-9-detailed-audit.md` performed, and are now also written
back into their own ticket files under `.scratch/`.

### 01 — Content Parser (`099b861`)

- Shape `{unit_id, unit_order, unit_title, unit_content, unit_rationale}`:
  `packages/pic-engine/src/content-parser/index.ts`; test "starts a new unit at every H3…".
- Order-based ids: `index.ts:49-51`; test "uses order-based unit_id values…".
- Blockquote rationale: `index.ts:33-40`; two rationale tests in `content-parser.test.ts`.
- Zero H3 / empty string → `[]`, never throws: two empty-array tests. (Narrowed by Wave 9.1 — see this
  ticket's amendment ACs for the Heuristic Fallback branch, not yet implemented.)
- Verbatim SQL seed fixtures: describe block "tracer bullet seed treatments…".
- Path B isolation: `.dependency-cruiser.cjs` `no-player-into-content-parser`; test "player-engine never
  imports content-parser".
- Barrel: `packages/pic-engine/src/index.ts:71-72`.

### 02 — `RepositoryPort.getTreatment` (`4509304`)

- `Treatment` type: `repository-port.ts:108-114`.
- `getTreatment`: `repository-port.ts:175-176`.
- Contract: `repository-port.contract.ts` describe `"getTreatment"` (existing id / unknown id → `null`).
- Fake: `test/fakes/fake-repository-port.ts:183-190`.
- Delegating port: `delegating-repository-port.ts:70-72`.
- Supabase: `supabase-repository.ts:602-619` (`maybeSingle` + `wrapError`).
- Unaffected by Wave 9.1 — the port shape is untouched by the resilience amendment.

### 03 — Local Guest real content (`3eca3c3`)

- `TRACER_BULLET_SEED_TREATMENT_ROWS` carries markdown + `content_format`:
  `tracer-bullet-seed-treatments.ts:55-74`; `TRACER_BULLET_SEED_TREATMENTS` remains the cheap `{id, title}`
  list (`:79-80`).
- `LocalGuestRepository.getTreatment`: `pic-adapter-local-guest/src/index.ts:292-294`.
- Flight-mode / FK tests: `local-guest-repository.test.ts:332-357`.
- Wave 9.1 adds a GFM table to one of these three rows plus a lockstep `UPDATE` migration — not yet
  implemented; see the rewritten ticket 03.

### 04 — Content seam + `AtomicUnitView` (`125e90a`)

- Deps: `pic-web/package.json` `react-markdown`, `remark-gfm`.
- Cache/seam: `composition-root.ts:280-296`; context: `treatment-content-context.tsx`.
- `UnifiedPlayerScreen` threads `session.treatment_id` (`:31`).
- Rendering: `AtomicUnitView.tsx:47-54`.
- Tests: Guest title/body (`atomic-unit-view.test.tsx:25-42`); GFM proven only via mock (`:44-71` — Wave
  9.1 Must-Fix B, re-proof against real Guest content not yet implemented); rationale not rendered
  (`:73-99`); advance-once (`:101-136`).
- Wave 9.1 adds the All-or-Nothing Loading gate to `UnifiedPlayerScreen` (currently mounts at
  `UnifiedPlayerScreen.tsx:14-36` with no content-length check) — not yet implemented; see the rewritten
  ticket 04.

### 05 — Picker real units + Zero-H3 (`6aedac8`)

- `handleSelect` uses seam then `startSession` (`TreatmentPickerScreen.tsx:34-46`).
- Zero-H3 inline copy (`:37-39`, `:67-69`); `zero-h3-guard-message.ts`.
- Tests: parsed ids reach `startSession`; empty parse never calls it
  (`treatment-picker-screen.test.tsx:41-132`).
- **Gap (now tracked as Wave 9.1 Decision B):** guard was picker-only; Player restore was unguarded. Not
  yet implemented; see the rewritten ticket 05.

### 06 — Persistence Gate silent-fail (`03ca2a7`)

- Catch: `PersistenceGateModal.tsx:26-29` → `preRpcPromotionFailed`.
- Retry UI: `:55-62`.
- Tests: `"surfaces pre-RPC sign-in failure into retry UI when env credentials are missing"`
  (`persistence-gate-modal.test.tsx:131`); decline still clears storage (`:150`); RPC `promotionStatus
  failed` still shows retry (`:106`).
- Unaffected by Wave 9.1 — unrelated subsystem.

### 07 — Regression guards (`2651d63`)

- Terminal NEMAR still appended on real parsed seed units: `wave-9-regression.test.ts:13-25`.
- `finishAnyway` still sovereign: `:27-41`.
- `PlayerUnit` still `{unit_id, state}` only: `:44-47`.
- Timeline links without markdown snapshot: `:49-67`.
- Wave 9.1 adds the Bootstrap Integration Test as a new regression guard here — not yet implemented; see
  the rewritten ticket 07.

### 08 — E2E + wave closure (`fab5faa`, this handoff)

- `happy-path-e2e.test.tsx` Player phase uses `unit-2` / Terminal NEMAR, not `intro` / `practice`
  (`:183-201`).
- Handoff: this file.
- **Unmet AC (now closed by this appendix):** every scratch issue file did **not** gain `## Resolution` at
  original closure. Closed by writing this Appendix A and backfilling `## Resolution` into ticket files
  02, 03, 04, 05, 07, 08.
- Wave 9.1 adds a `<table>` E2E assertion and a Bootstrap Integration Test CI gate — not yet implemented;
  see the rewritten ticket 08.

## Wave 9.1 Closure — Resilience Hardening Amendment

**Date:** 2026-08-30  
**Status:** CLOSED — Heuristic Fallback, GFM lockstep, All-or-Nothing Player gate, narrowed Zero-H3
picker trigger, and Bootstrap Integration Test have all landed; this closing ticket proved the E2E
`<table>` assertion, unit-0 full-spine playability, and the `npm test` / depcruise gate.

Landed amendment commits:

| ID | Commit | Summary |
|----|--------|---------|
| 01 | `5c97950` | Heuristic Fallback (`unit-0` "Continuous Guidance") |
| 03 | `7a71abb` | GFM table + strikethrough + task list on "Grounding Through the Feet" |
| 05 | `f69d490` | Narrowed picker Zero-H3 guard trigger |
| 04 | `5d3ff9d` | `UnifiedPlayerScreen` All-or-Nothing loading gate |
| 07 | `4595bcf` | `bootstrap-content-integrity.test.ts` + SQL markdown extractor |
| 08 | `bceb80e` (tests); this docs commit | E2E `<table>` + unit-0 regression + this closure record |

### Gates

| Gate | Result |
|------|--------|
| `npm test` (before this ticket) | 239 passed, 10 skipped, 0 failed, 29 files |
| `npm test` (after this ticket) | 240 passed, 10 skipped, 0 failed, 30 files |
| `depcruise --workspaces` | 0 violations (`pic-engine` 72 modules / 199 deps; `pic-web` 628 modules / 1165 deps) |
| Line length | Touched files clean at 130; `scripts/ci-linelength-grandfather.txt` unchanged |

The Bootstrap Integration Test is picked up by root `vitest.config.ts` (`packages/*/src/**/*.{test,spec}.{ts,tsx}`)
with no extra script or CI job — confirmed by read of `vitest.config.ts:6-8` and by the file appearing in
the 30-file suite (`bootstrap-content-integrity.test.ts`).

The All-or-Nothing loading gate adds no perceptible regression to the happy path: the E2E still waits on
`navigation-tree-panel` (Active-only) then continues the existing Finish Anyway → Persistence Gate →
promotion → cloud verification sequence (`happy-path-e2e.test.tsx:184-186` and the remainder of the `it()`).

### Appendix A — Wave 9.1 Amendment Resolution Log

Summaries of each ticket's `### Resolution (Wave 9.1 Amendment)` already on disk under
`.scratch/md_content_integration/issues/` (gitignored). Core Wave 9 Appendix A above is untouched.

#### 01 — Heuristic Fallback (`5c97950`)

- `parseStructuredMarkdown`: empty/whitespace → `[]`; non-empty zero-H3 → single `unit-0`
  "Continuous Guidance" unit (`content-parser/index.ts` post-loop branch; tests "wraps non-empty zero-H3
  prose into a single Continuous Guidance fallback unit" and the trim/whitespace/preamble/collision cases
  in `content-parser.test.ts`).
- `"unit-0"` never collides with `unit-1…unit-N` or `TERMINAL_NEMAR_UNIT_ID`.
- Path B isolation and depcruise stayed green.

#### 03 — GFM lockstep (`7a71abb`)

- Widened **"Grounding Through the Feet"** (`c818490b-10ed-46c2-9890-1f35d34f4e25`) inside its third H3
  ("Return to the Room" → `unit-3`): table, strikethrough, task list. No fourth id.
- `UPDATE`-only migration `supabase/migrations/20260827220000_widen_treatment_gfm_table.sql`.
- Guest TS constant byte-identical with the SQL body; `content-parser.test.ts` seed fixture and
  "keeps the widened Grounding Through the Feet row byte-identical…" test.

#### 04 — All-or-Nothing loading + un-mocked GFM (`5d3ff9d`)

- Screen-local `resolving` → `ready` → `recovery` on `UnifiedPlayerScreen` (not `PlayerEngine` state).
- Fresh `startSession` mount, same-tab resume, rejected `getTreatment`, and genuinely empty parse all
  covered in `unified-player-screen.test.tsx`.
- Un-mocked GFM proof: `atomic-unit-view.test.tsx` "renders GFM table, checked task, and
  strikethrough-adjacent text from bundled Guest seed" against `TRACER_BULLET_SEED_TREATMENT_ROWS[1]`.
- E2E `<table>` assertion was reassigned to this ticket 08.

#### 05 — Narrowed picker Zero-H3 trigger (`f69d490`)

- Non-empty zero-H3 prose calls `startSession(..., ["unit-0"])` (`treatment-picker-screen.test.tsx`
  "calls startSession with unit-0 when non-empty zero-H3 prose resolves to Continuous Guidance").
- Genuinely empty parse still shows `ZERO_H3_GUARD_MESSAGE` and never calls `startSession`.
- Shared-copy regression binds the same `zero-h3-guard-message.ts` export ticket 04 renders.
- `TreatmentPickerScreen.tsx` control-flow shape unchanged.

#### 07 — Bootstrap Integration Test (`4595bcf`)

- `bootstrap-content-integrity.test.ts` table-drives every SQL `structured_markdown` write and every
  Guest seed row; asserts `parseStructuredMarkdown(...).length >= 1`.
- Hypothetical zero-H3 prose proves Heuristic Fallback; Wave 9 core H3-only replica still returns `[]`.
- Runs inside existing `npm test` glob; helper not exported from the public barrel.

#### 08 — E2E + wave closure (this ticket)

- `happy-path-e2e.test.tsx` now picks `TRACER_BULLET_SEED_TREATMENTS[1]` ("Grounding Through the Feet"),
  visits `unit-3` via `navigation-tree-jump-unit-3`, and asserts `screen.getByRole("table")`
  (`:133`, `:201-206`). Existing Terminal NEMAR "no" → Finish Anyway → Persistence Gate → promotion
  → cloud verification is unchanged. Ran against real Supabase: 1 passed.
- `wave-9-1-regression.test.tsx` proves `unit-0` "Continuous Guidance" is pickable/playable/Finishable
  through Player → Terminal NEMAR Yes → Finish (`success_declared === true`, `finished_at !== null`).
  Guest Finish is Persistence-Gated (DEC-017); the no-network test spies `onFinishRequested` onto
  `playerEngineActions.finish` (SessionEngine's authenticated passthrough) so Finish writes without a
  network promotion.
- Bootstrap Integration Test confirmed in the `npm test` gate (see Gates above).
- Glossary: "Continuous Guidance / הנחיה רציפה" added to `CONTEXT.md` (additive; see Part 5).

### User Story traceability (Wave 9.1 stories 22–32)

| Story | Status | Evidence |
|-------|--------|----------|
| 22. Zero-H3 prose still delivered | PASS | `content-parser.test.ts:26`; unit-0 regression |
| 23. Fallback is a first-class Atomic Unit | PASS | `wave-9-1-regression.test.tsx` (unit-0, tree, NEMAR, Finish) |
| 24. Empty content still shows Zero-H3 Guard | PASS | picker `:144`; player empty-parse case |
| 25. Resume/restore never shows hollow Active | PASS | `unified-player-screen.test.tsx` hold-back tests |
| 26. Load failure offers picker recovery | PASS | player rejected-getTreatment recovery test |
| 27. Build-time parse-length gate on both catalogs | PASS | `bootstrap-content-integrity.test.ts:116-125` |
| 28. Bootstrap test is inside `npm test` | PASS | `vitest.config.ts:6-8`; file included in the 30-file suite |
| 29. GFM table proven on real Guest/E2E content | PASS | `atomic-unit-view.test.tsx:73-94`; E2E `:201-206` |
| 30. Guest↔SQL lockstep after seed edits | PASS | `content-parser.test.ts` byte-identical test; bootstrap SQL + TS cases |
| 31. Resolutions survive `.scratch/` deletion | PASS | This file's core Appendix A plus this Wave 9.1 appendix |
| 32. Hardening specified before implementation | PASS | spec Wave 9.1 section; this closure |

### Should-fix carry-forward

- **Info affordance for `unit_rationale`:** still parsed and cached, still not rendered (Wave 9 scope).
- **Lazy Copy-on-Write / Personal Variants:** remains ADR-0002 / future wave scope.
- **Remote E2E credentials:** `happy-path-e2e.test.tsx` still requires `.env.local` + service role.
- **Boot-time rehydrate of `activePlayerSessionId`:** still out of Wave 9.1 scope; Decision B's gate
  covers it whenever that feature ships.
- Glossary addition from the spec's Further Notes is **done** in this ticket (`CONTEXT.md`).
