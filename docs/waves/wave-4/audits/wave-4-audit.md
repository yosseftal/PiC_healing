Wave 4 Domain Logic Audit — GroupEngine & PlayerEngine
Auditor role: Independent Domain Logic Auditor
Scope: Tickets 07–08, types.ts widening, isolation scanner, CI hygiene
Date: 2026-07-31

Executive Verdict
READY FOR WAVE 5 (ADAPTERS)
Wave 4 engine implementations satisfy the manifesto pillars audited here — Atomic Focus, Sovereign Success, and Module Isolation — at the pic-engine layer. CI is genuinely green (66 domain + 9 contract tests, 0 depcruise violations, unchanged grandfather list). No Must-fix architectural or safety violations were found in the engine code itself. Several Should-fix items should be tracked into adapter work (Wave 5) and a future schema ticket.

Checklist Results
1. Strict Isolation & Import Leakage (DEC-011, DEC-015)
Check	Result	Evidence
PlayerEngine has zero rating knowledge
PASS
Imports only PlayerSession, PlayerUnit from ../types — no Symptom, Polarity, or Intensity
GroupEngine is sole rating owner
PASS
Only RepositoryPort + types; no sibling-engine imports or calls
depcruise guardrail
PASS
no-player-into-group / no-group-into-player — 0 violations (60 modules, 147 deps)
Source-scan tests
PASS
GroupEngine bans 4 siblings; PlayerEngine bans group-engine/session-engine + bare-identifier ban
stripComments / multi-line imports
PASS
Hardened scanner + 8 dedicated unit tests cover destructured imports, export * from, dynamic import()
PlayerEngine imports (clean):


index.ts
Lines 47-50
import type { PlayerSession, PlayerUnit } from "../types";
import type { RepositoryPort } from "../repository-port";
import type { LibraryEngine } from "../library-engine/index";
import type { TimelineEngine } from "../timeline-engine/index";
The bare-identifier ban correctly strips comments first, so doc-comment mentions of Symptom/Polarity/Intensity in player-engine/index.ts do not weaken the test. Runtime smoke test additionally proves no getGroup/saveGroup calls over a full lifecycle.

GroupEngine imports only ../types and ../repository-port — no engine-to-engine edges.

2. Sovereign Success Declaration (DEC-015 §4)
Check	Result
finishAnyway() sets success_declared: true unconditionally
PASS
Terminal NEMAR 'no' does not block finishAnyway()
PASS
Unseen/skipped units do not block finishAnyway()
PASS
finish() gated on terminal_nemar_response === 'yes' only
PASS
finishAnyway() checks only the idempotency guard (success_declared), then delegates to declareSuccess:


index.ts
Lines 223-229
async finishAnyway(sessionId: string): Promise<void> {
  const session = await this.loadSessionOrThrow(sessionId);
  if (session.success_declared) {
    return;
  }
  await this.declareSuccess(session);
}
No unit-state or Terminal NEMAR checks appear in this path. The literal Sovereign Success Declaration test covers terminal_nemar_response: "no" with unit "c" still unseen. Additional tests call finishAnyway() with null Terminal NEMAR (no respondTerminalNemar at all).

finish() and finishAnyway() converge on identical persistence via declareSuccess — correct per DEC-015 §4.

3. Blind-by-Default API (DEC-011)
Check	Result
Three-call API shape
PASS
rate() structurally cannot leak prior values
PASS
rated_at supports hasPriorRating without breaking NOT NULL semantics
PASS (domain); gap at SQL (see Should-fix)
API guarantees:

hasPriorRating → reads rated_at !== null only
rate() → Promise<void>; partial { polarity?, intensity? } with EmptyRatingUpdateError on {}
revealPriorRating → returns null when rated_at === null; never called implicitly by rate()
Placeholder seeding (negative / 0 with rated_at: null) correctly separates "named but unrated" from "has been rated" without making polarity/intensity nullable — consistent with the migration's NOT NULL columns and backfill pattern.

4. State Machine & Transitions
Check	Result
Flat 4-state model
PASS
in_view persisted via savePlayerSession
PASS (documented resolution)
Terminal NEMAR injected exactly once
PASS
No skip() public API
PASS
Navigation Tree via jumpTo only
PASS
Terminal NEMAR is always appended in startSession:


index.ts
Lines 100-105
const allUnitIds = [...unitIds, TERMINAL_NEMAR_UNIT_ID];
const units: PlayerUnit[] = allUnitIds.map((unit_id, index) => ({
  unit_id,
  state: index === 0 ? "in_view" : "unseen",
}));
Transition coverage is thorough: advance, forward jumpTo (skip intermediates), backward revisit of completed, skipped-unit upgrade path, Terminal NEMAR response handling.

Nuance: The in_view "ephemeral, never persisted" wording in types.ts and spec §B conflicts with the engine's need to write state between calls. The implementation's resolution — adapter-layer normalization in Wave 5 — is sound and test-driven. Worth reconciling docs, not blocking engines.

5. Side Effect Idempotency
Check	Result
recordUse + recordExecution once per successful finish
PASS
Repeat finish()/finishAnyway() no-op
PASS
idempotencyKey = session.id threaded end-to-end
PASS

index.ts
Lines 239-250
private async declareSuccess(session: PlayerSession): Promise<void> {
  const libraryRow = await this.libraryEngine.recordUse(session.treatment_id, session.id);
  await this.timelineEngine.recordExecution({
    treatmentId: session.treatment_id,
    libraryRowId: libraryRow.id,
    linkedGroupId: session.linked_group_id,
  });
  await this.repositoryPort.savePlayerSession({
    ...session,
    success_declared: true,
    finished_at: new Date().toISOString(),
  });
}
Adversarial tests prove:

recordUseSpy called with ("treatment-1", sessionId) exactly
Two sessions on same treatment → use_count === 2
Same-session retry → use_count stays at 2
Unit-state upgrades never invoke library/timeline side effects (skipped-upgrade test with recordUseSpy).

6. CI Hygiene
Gate	Result
npm run ci
PASS (independently verified)
Domain tests
66/66
Contract tests
9/9
depcruise
0 violations
Grandfather list
Unchanged (git diff empty, 17 lines)
Findings
Must-fix (architectural / safety violations)
None.

The engine layer correctly enforces:

Rating isolation (GroupEngine only)
Sovereign finishAnyway() (no hidden gates)
Blind-by-default API shape
Finish-only, session-keyed use_count idempotency
Player ↔ Group depcruise firewall
Should-fix (code hygiene / Wave 5 carry-forward)
SF-1 — rated_at missing from live SQL schema
Symptom.rated_at exists in domain types and engine logic, but 20260730194911_tracer_bullet_schema.sql adds only polarity/intensity to public.symptoms — no rated_at column. Wave 5 adapters (local-guest + Supabase) must either add rated_at timestamptz null or define an equivalent mapping (e.g. infer unrated from a sentinel). Engine logic is correct; persistence seam is not yet closed.

SF-2 — declareSuccess ordering: timeline not idempotent on crash-retry
Side effects run before success_declared is persisted. incrementUseCount is protected by idempotencyKey; appendTimelineEvent is not. A crash between recordExecution and savePlayerSession could produce duplicate timeline events on retry. Acceptable for tracer bullet; adapters should wrap Finish in a transaction or add timeline idempotency in Wave 5.

SF-3 — Mid-exit test weaker than spec literal
Ticket 08 requires persisting in_view units as unseen or skipped, never completed. The test only asserts not.toBe("completed") and the engine leaves the first unit as in_view. Documented and intentional for the stateless engine model, but spec/doc tension remains. Adapters normalizing in_view → unseen on read would align with §B without changing engine behavior.

SF-4 — GroupEngine in-memory symptomId → groupId index
Correct for spike happy path; documented limitation for "resume existing group" (trigger point 2). Future ticket must rebuild index from RepositoryPort or widen the port.

SF-5 — Same-group concurrent rate() lost-update
Accepted per DEC-009 Atomic Focus ("one symptom rated at a time"). Not a product-path issue; no CAS on RepositoryPort. Documented in tests.

SF-6 — types.ts / spec §B doc drift on in_view
PlayerUnitState doc says adapters never persist in_view; engine does persist it. Reconcile in adapter tickets (normalize on write/read) rather than re-opening Wave 4 engines.

Summary Matrix
Audit Area	Verdict
Module isolation
PASS
Sovereign Success (finishAnyway)
PASS
Blind-by-Default API
PASS
rated_at domain model
PASS
State machine + Terminal NEMAR
PASS
Side-effect idempotency (happy path)
PASS
CI authenticity
PASS
SQL / adapter readiness for rated_at
Deferred to Wave 5
Recommendation
Proceed to Wave 5 (Adapters). Open adapter tickets with explicit acceptance criteria for:

rated_at column or equivalent mapping on symptoms
in_view normalization at the persistence boundary
Atomic Finish (library increment + timeline append + success_declared in one transaction, or timeline idempotency keyed to session.id)
The Orchestrator's "CI green, 66 tests, zero grandfather growth" claim is confirmed. The rated_at widening and in_view persistence resolutions are architecturally justified within the tracer-bullet scope and do not constitute engine-layer violations.