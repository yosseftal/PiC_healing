# Wave 9 Sovereign Audit & Gap Report

**Date:** 2026-08-21
**Scope:** Structured Markdown Content Integration (commits `099b861`–`ae4be88`)
**Auditor:** Sovereign Domain Auditor (read-only diagnostics; no refinement commits)
**Mandate:** `docs/agents/pic-sovereign-domain-audit.md`

## Verdict: REFACTOR

Three Must-Fix Safe Container / Historical Integrity / durability gaps. Line length on Wave 9
files is clean. Picker Zero-H3 guard is correct and insufficient by itself.

No code was changed in this pass. Refinement waits on Event Manager approval of the gaps below.

---

## Strategic checks (A–D)

### A. Zero-H3 Restore Bypass — FAIL (Must-Fix)

**Picker guard (start path): PASS.** `TreatmentPickerScreen.tsx:34-40` asks the content seam
before `startSession`. Empty parse sets `zeroH3GuardTreatmentId` and returns. Copy is
`ZERO_H3_GUARD_MESSAGE` (`zero-h3-guard-message.ts:2-4`). Test:
`treatment-picker-screen.test.tsx` "shows the Zero-H3 guard and never calls startSession…".

**Player restore / mount path: FAIL.** `UnifiedPlayerScreen.tsx:14-36` never calls
`getParsedTreatmentContent`. It mounts whenever `activePlayerSessionId` and a session snapshot
exist. `deriveGuestFlowScreen` (`guest-flow-facts.ts:26-28`) routes to `"player"` as soon as
`activePlayerSessionId !== null` — no content-length check.

Two empty-content mount shapes:

1. **Terminal-NEMAR-only session.** `PlayerEngine.startSession` always appends
   `TERMINAL_NEMAR_UNIT_ID` (`player-engine/index.ts:100-105`). Empty `unitIds` still persist a
   one-unit session with Terminal NEMAR `in_view`
   (`player-engine.test.ts:51-58`). On that snapshot, `findActiveUnit` returns Terminal NEMAR,
   so the screen renders `TerminalNemarUnit` + `NavigationTreePanel` + `FinishBar`
   (`UnifiedPlayerScreen.tsx:28-34`). Sovereign Zero-H3 copy is never shown. Finish Anyway
   remains available (`FinishBar.tsx:24-31`), so the Event Manager can declare success on
   guidance that was never executable.

2. **Stale unit ids + live empty parse.** Session may still hold `unit-1`…`unit-N` while the
   seam returns `[]` (missing treatment, zero H3s after live re-fetch). Then
   `isTerminalNemar` is false and `AtomicUnitView` looks up a missing `unit_id`
   (`AtomicUnitView.tsx:40`). `unitContent` stays `null`; the article is empty
   (`AtomicUnitView.tsx:47-57`). Again, no Zero-H3 copy.

**Reload nuance (does not close the leak).** Guest player-session blobs survive in
`localStorage` (`pic-adapter-local-guest/src/index.ts:43-47`, `183-186`). Flow fact
`activePlayerSessionId` is in-memory only (`guest-flow-facts.ts:70`, `114-116`) and is **not**
rehydrated at boot (`App.tsx:6-12`, `composition-root.ts:177-183` only set it from
`startSession`). A full page reload currently drops the Event Manager off the player screen
even though the blob remains. That masks the exact "reload remounts empty player" story today.
It does **not** guard:

- same-tab resume (facts still set)
- tests that already restore via `savePlayerSession` + `setGuestFlowPlayerSession`
  (`unified-player-screen.test.tsx:31-35`)
- any future boot hydrator against the persisted blob
- live-render of empty content while the player is mounted

**Missing tests.** `unified-player-screen.test.tsx` has no empty-parse / Terminal-NEMAR-only
case and never asserts `ZERO_H3_GUARD_MESSAGE`.

**Approved refinement (not executed):** fallback in `UnifiedPlayerScreen` — if parsed content
is empty, render the same sovereign copy inline and do not present an empty player or a
Terminal-NEMAR-only run as executable guidance.

DEC-015 §7b, DEC-017 Safe Container, spec User Stories 5–6, Zero-H3 Guard copy decision.

### B. GFM Offline Verification — FAIL (Must-Fix)

**Pipeline exists: PASS.** `pic-web/package.json` has `react-markdown` and `remark-gfm`.
`AtomicUnitView.tsx:53` renders `unit_content` with `remarkPlugins={[remarkGfm]}`.

**Guest seed table fixture: FAIL.** `TRACER_BULLET_SEED_TREATMENT_ROWS`
(`tracer-bullet-seed-treatments.ts:7-49`) is three H3 + prose blocks, copied from
`supabase/migrations/20260730194911_tracer_bullet_schema.sql:78-129`. No GFM table, no
strikethrough, no task list. Comment at `:51-53` claims byte-identical SQL lockstep.

**Guest Mode table assertion: FAIL.**

- `atomic-unit-view.test.tsx:44-71` **"renders GFM markdown features…"** does assert
  `getByRole("table")`, a checked task-list checkbox, and strikethrough-adjacent text — **via
  `mockResolvedValue` on `getParsedTreatmentContent`**, not through Guest seed /
  `LocalGuestRepository.getTreatment`. Historical Integrity of authored Guest content is not
  proven.
- `happy-path-e2e.test.tsx` never asserts `<table>` / `<td>`. Player-phase checks
  `atomic-unit-unit-2` existence only (`:197-199`).

Citation **`[15/192]`** was not found in-repo. Treat it as the instruction to add a small GFM
table to one seed treatment.

**Lockstep constraint for the approved refinement.** Widening only the TypeScript seed would
break the byte-identical Guest↔SQL claim (`tracer-bullet-seed-treatments.ts:51-53`) and the
verbatim parser fixtures (`content-parser.test.ts:86-229`). Remote ID parity
(`tracer-bullet-seed-treatments.remote.test.ts:43-57`) checks **ids by title only**, not
markdown, so content drift would be silent. Refinement should keep Guest seed, SQL
(new UPDATE migration — do not rewrite an already-applied insert), and parser fixtures in
lockstep.

DEC-016 §5 live render / Historical Integrity; spec Implementation Decision on `remark-gfm`;
ticket 04 AC "tables, strikethrough, task lists all render correctly".

### C. Scratch Resolution Preservation — FAIL (Must-Fix)

`.scratch/` is gitignored (`.gitignore:4`). Wave 9 tickets live at
`.scratch/md_content_integration/issues/`. Ticket 08 AC required a `## Resolution` on every
issue file (`08-e2e-and-wave-closure.md:25-26`). `docs/agents/wave-orchestrator.md` §3 says
ticket closed only when Resolution cites every AC.

| ID | File | `## Resolution` on disk |
|----|------|-------------------------|
| 01 | `01-content-parser.md` | PRESENT (lines 31-69) |
| 02 | `02-repository-port-get-treatment.md` | **MISSING** |
| 03 | `03-local-guest-real-content.md` | **MISSING** |
| 04 | `04-content-seam-and-rendering.md` | **MISSING** |
| 05 | `05-picker-real-units-and-zero-h3-guard.md` | **MISSING** |
| 06 | `06-persistence-gate-silent-fail-fix.md` | PRESENT (lines 30-57) |
| 07 | `07-regression-guards.md` | **MISSING** |
| 08 | `08-e2e-and-wave-closure.md` | **MISSING** (and its own AC unmet) |

`docs/audits/wave-9-handoff.md` has no Resolution appendix. Durable record is the handoff
table plus this audit until the appendix is appended.

**Approved refinement (not executed):** append a structured appendix to
`docs/audits/wave-9-handoff.md` with all eight Resolution summaries (reconstruct 02–05, 07,
08 from commits/tests; copy 01 and 06). See Appendix A below for the reconstructed text.

### D. Code Hygiene & Line Length — PASS

`python3 scripts/check-max-line-length.py` on Wave 9 paths (`099b861^`..`ae4be88`), including
new files, reported **0** lines over 130 characters.

Wave 9 commits did not touch `scripts/ci-linelength-grandfather.txt`. Ticket 08's "zero
grandfather-list growth" holds for this wave.

Working-tree addition of `docs/visuals/architecture_blueprint.md` to the grandfather list is
**out of scope** (uncommitted, not a Wave 9 commit). Flagged only so it is not mistaken for
Wave 9 debt.

---

## Core audit dimensions

### 1. The Seam — PASS

- `packages/pic-engine/package.json` runtime `dependencies`: none (devOnly depcruise /
  `@types/node`). No `pic-web`, `pic-adapter-*`, `@supabase/*`, DOM/storage packages.
- `pic-engine/.dependency-cruiser.cjs:16-20` adds `no-player-into-content-parser`.
- `content-parser.test.ts:233-237` source-scans `player-engine/index.ts` for the parser.
- Grep of `packages/pic-engine/src` for `supabase` / `localStorage` / `fetch(` / `window.`
  hits comments and seed-migration citations only, not runtime I/O.
- Parser is pure (`content-parser/index.ts:17-58`). Seam fetch/parse/cache lives in
  `composition-root.ts:280-296`. `pic-web/.dependency-cruiser.cjs` still allows adapter
  imports only from `composition-root.ts` / `promote-path.ts`.

### 2. Dumb Reflection (DEC-015) — PASS (in scope)

Wave 9 `useState` hits:

- `TreatmentPickerScreen.tsx:18-20` — catalog list, link toggle, Zero-H3 presentation.
  Not engine session state.
- `AtomicUnitView.tsx:24` — async seam result for the active unit. Path B: content is **not**
  engine state. Cache has no subscribe API, so a local resolved value is required.
- `PersistenceGateModal.tsx:17` — `preRpcPromotionFailed` is ticket 06's explicit
  pre-engine catch, not a duplicate of `promotionStatus`.

No component stores `terminal_nemar_response` or unit state locally.

### 3. Blind-by-Default (DEC-011) — out of scope

Wave 9 does not touch rating UI. `unified-player-screen.test.tsx:158-170` asserts zero
`RatingControl` in the player tree.

### 4. EM Sovereignty — PASS, with a Safe Container caveat

`FinishBar.tsx:24-31` still always renders `[Finish Anyway]`. Wave 9 regression
`wave-9-regression.test.ts:27-41` re-asserts `finishAnyway` with Terminal NEMAR `no`.
Picker Zero-H3 copy offers a next action (choose another guidance).

Caveat: the A leak lets Finish Anyway fire on a Terminal-NEMAR-only / empty-content
session. Sovereignty is not gated; the Safe Container is. Tracked under A, not as a
separate sovereignty dead-end.

### 5. FK Alignment — PASS (current seeds); at risk if B is patched in TS only

Guest ids (`tracer-bullet-seed-treatments.ts:57-73`):

- `2c6e77bd-61db-4898-8612-84e976587ff7` Settling the Nervous System
- `c818490b-10ed-46c2-9890-1f35d34f4e25` Grounding Through the Feet
- `92be9fb3-7092-4a78-9fa2-4aee9ba34bc6` Loosening the Shoulders and Neck

Match `local-guest-repository.test.ts:333-338` and Wave 8 handoff. Remote parity test still
compares id-by-title only. **Do not introduce a fourth id for the GFM table.** Enrich an
existing row and keep SQL in lockstep.

---

## Must-Fix Items

1. **Zero-H3 restore bypass (Safe Container).** `UnifiedPlayerScreen.tsx:14-36` mounts
   recovered / empty-parse sessions as a player (Terminal NEMAR or empty article) instead of
   `ZERO_H3_GUARD_MESSAGE`. No covering test.
2. **GFM not proven on Guest seed (Historical Integrity).** Seed markdown has no table;
   Guest Mode tests never assert `<table>` through the bundled catalog.
3. **Scratch Resolutions will evaporate.** Six of eight issue files lack `## Resolution`;
   even 01 and 06 live only under gitignored `.scratch/`. Handoff has no appendix.

## Should-Fix Items

1. **`content_format` ignored.** Spec says non-`structured_markdown` resolves to `[]`.
   `composition-root.ts:293` always parses `structured_markdown`. No production format other
   than `structured_markdown` exists yet.
2. **No byte-identical Guest↔SQL markdown test.** Comments claim lockstep; only titles/ids
   are asserted remotely. Parser tests duplicate the SQL strings rather than reading the
   migration file.
3. **No boot rehydrate of `activePlayerSessionId`** from persisted `playerSessions`. Related
   to A's reload story; separate from the player-screen guard.
4. **Persistence Gate internal "failed" naming** (`preRpcPromotionFailed`,
   `promotionStatus === "failed"`) vs glossary "never Failed." User-visible copy is already
   "We could not anchor your session yet…" (`PersistenceGateModal.tsx:58`). Leave unless a
   later wave renames the engine status.

## Evidence Trail

- `packages/pic-web/src/TreatmentPickerScreen.tsx:34-40` — picker Zero-H3 guard
- `packages/pic-web/src/zero-h3-guard-message.ts:2-4` — sovereign copy
- `packages/pic-web/src/UnifiedPlayerScreen.tsx:14-36` — no content-length fallback
- `packages/pic-web/src/guest-flow-facts.ts:26-28` — any session id → player screen
- `packages/pic-web/src/AtomicUnitView.tsx:40-57` — empty article when parse misses unit
- `packages/pic-engine/src/player-engine/index.ts:100-105` — empty `unitIds` still get
  Terminal NEMAR
- `packages/pic-engine/src/player-engine/player-engine.test.ts:51-58` — that path is tested
  at engine layer
- `packages/pic-web/src/unified-player-screen.test.tsx` — no Zero-H3 restore case
- `packages/pic-engine/src/tracer-bullet-seed-treatments.ts:7-49` — no GFM table
- `packages/pic-web/src/atomic-unit-view.test.tsx:44-71` — GFM table via mock, not Guest seed
- `packages/pic-web/src/happy-path-e2e.test.tsx:197-199` — no table assertion
- `.scratch/md_content_integration/issues/02–05, 07, 08` — no `## Resolution`
- `docs/audits/wave-9-handoff.md` — no Resolution appendix
- `packages/pic-engine/package.json` — engine has no UI/adapter runtime deps
- `packages/pic-engine/.dependency-cruiser.cjs:16-20` — Path B isolation rule
- `packages/pic-web/src/FinishBar.tsx:24-31` — Finish Anyway always present
- DEC-015 §7b Terminal NEMAR; DEC-016 §5 live Pointer render; DEC-017 Safe Container;
  DEC-011 out of scope this wave

---

## Proposed refinement sweep (blocked until approval)

Single clean sweep, no grandfather exceptions for new files:

1. `UnifiedPlayerScreen` empty-parse fallback + `unified-player-screen.test.tsx` covering
   Terminal-NEMAR-only restore **and** live empty parse; same `ZERO_H3_GUARD_MESSAGE`.
2. Add a simple GFM table to one existing seed treatment; keep SQL + parser fixtures in
   lockstep; assert `<table>` via real Guest `getParsedTreatmentContent` (un-mocked) in
   `atomic-unit-view.test.tsx`.
3. Append Appendix A (below) to `docs/audits/wave-9-handoff.md`.
4. Re-run `python3 scripts/check-max-line-length.py` on every touched file.

---

## Appendix A — reconstructed Wave 9 Resolution summaries

For the handoff appendix after approval. 01 and 06 copied from scratch; 02–05, 07, 08
reconstructed from current source (those issue files have no Resolution section).

### 01 — Content Parser (`099b861`)

Copied from `.scratch/md_content_integration/issues/01-content-parser.md`.

- Shape `{unit_id, unit_order, unit_title, unit_content, unit_rationale}`:
  `packages/pic-engine/src/content-parser/index.ts`; test "starts a new unit at every H3…".
- Order-based ids: `index.ts:49-51`; test "uses order-based unit_id values…".
- Blockquote rationale: `index.ts:33-40`; two rationale tests in `content-parser.test.ts`.
- Zero H3 / empty string → `[]`, never throws: two empty-array tests.
- Verbatim SQL seed fixtures: describe block "tracer bullet seed treatments…".
- Path B isolation: `.dependency-cruiser.cjs` `no-player-into-content-parser`; test
  "player-engine never imports content-parser".
- Barrel: `packages/pic-engine/src/index.ts:71-72`.

### 02 — `RepositoryPort.getTreatment` (`4509304`)

Reconstructed (no Resolution in the issue file).

- `Treatment` type: `repository-port.ts:108-114`.
- `getTreatment`: `repository-port.ts:175-176`.
- Contract: `repository-port.contract.ts` describe `"getTreatment"` (existing id / unknown
  id → null).
- Fake: `test/fakes/fake-repository-port.ts:183-190`.
- Delegating port: `delegating-repository-port.ts:70-72`.
- Supabase: `supabase-repository.ts:602-619` (`maybeSingle` + `wrapError`).

### 03 — Local Guest real content (`3eca3c3`)

Reconstructed.

- `TRACER_BULLET_SEED_TREATMENT_ROWS` carries markdown + `content_format`:
  `tracer-bullet-seed-treatments.ts:55-74`; `TRACER_BULLET_SEED_TREATMENTS` remains the
  cheap `{id, title}` list (`:79-80`).
- `LocalGuestRepository.getTreatment`: `pic-adapter-local-guest/src/index.ts:292-294`.
- Flight-mode / FK tests: `local-guest-repository.test.ts:332-357`.

### 04 — Content seam + `AtomicUnitView` (`125e90a`)

Reconstructed.

- Deps: `pic-web/package.json` `react-markdown`, `remark-gfm`.
- Cache/seam: `composition-root.ts:280-296`; context: `treatment-content-context.tsx`.
- `UnifiedPlayerScreen` threads `session.treatment_id` (`:31`).
- Rendering: `AtomicUnitView.tsx:47-54`.
- Tests: Guest title/body (`atomic-unit-view.test.tsx:25-42`); GFM **mocked**
  (`:44-71`) — see Must-Fix B; rationale not rendered (`:73-99`); advance-once
  (`:101-136`).

### 05 — Picker real units + Zero-H3 (`6aedac8`)

Reconstructed.

- `handleSelect` uses seam then `startSession` (`TreatmentPickerScreen.tsx:34-46`).
- Zero-H3 inline copy (`:37-39`, `:67-69`); `zero-h3-guard-message.ts`.
- Tests: parsed ids reach `startSession`; empty parse never calls it
  (`treatment-picker-screen.test.tsx:41-132`).
- **Gap:** guard is picker-only; player restore unguarded (Must-Fix A).

### 06 — Persistence Gate silent-fail (`03ca2a7`)

Copied from `.scratch/md_content_integration/issues/06-persistence-gate-silent-fail-fix.md`.

- Catch: `PersistenceGateModal.tsx:26-29` → `preRpcPromotionFailed`.
- Retry UI: `:55-62`.
- Tests: `"surfaces pre-RPC sign-in failure into retry UI when env credentials are missing"`
  (`persistence-gate-modal.test.tsx:131`); decline still clears storage (`:150`); RPC
  `promotionStatus failed` still shows retry (`:106`).

### 07 — Regression guards (`2651d63`)

Reconstructed.

- Terminal NEMAR still appended on real parsed seed units:
  `wave-9-regression.test.ts:13-25`.
- `finishAnyway` still sovereign: `:27-41`.
- `PlayerUnit` still `{unit_id, state}` only: `:44-47`.
- Timeline links without markdown snapshot: `:49-67`.

### 08 — E2E + wave closure (`fab5faa`, handoff pin `ae4be88`)

Reconstructed.

- `happy-path-e2e.test.tsx` Player phase uses `unit-2` / Terminal NEMAR, not `intro` /
  `practice` (`:183-201`).
- Handoff: `docs/audits/wave-9-handoff.md`.
- **Unmet AC:** every scratch issue file did **not** gain `## Resolution` (C).
