Wave 5 / Wave 7 Domain Logic & Architecture Audit
Fixed point: main (bcfeb99) — Wave 5/7 work is uncommitted on the working tree (git diff main).

CI: npm run ci green — 96 domain + 9 contract tests, 0 depcruise violations.

Standards
Hard violations: None in scoped files for EM terminology, Integrating framing, line length in implementation code, or useSyncExternalStore dumb-reflection pattern.

Judgement calls:

Finding	Smell / Standard	Location
normalizeForPermanentStore duplicates withInViewNormalized in LocalGuestRepository
Duplicated Code / Divergent Change (DEC-015)
session-engine/index.ts + pic-adapter-local-guest/index.ts
discardGuestState() resets engine bookkeeping only; no localStorage clear
Middle Man / incomplete DoD
session-engine/index.ts — ticket 09 says “abandons/clears the local Guest state”
repositoryPort exported on compositionRoot but not via React Context
Convention leak
composition-root.ts — ticket 14 DoD says reach tree “via context”
GuestModeShell comment says it “mounts SessionEngine” — wiring is in composition-root
Mysterious Name
GuestModeShell.tsx
Grandfather list grew by one entry (docs/audits/wave-4-audit.md)
CI hygiene drift
scripts/ci-linelength-grandfather.txt header says list “must never grow”
Passes: Single module-level singleton construction; zero useState/useEffect in pic-web; dependency-cruiser enforces adapter-import firewall; test carve-out for app-shell.test.tsx is deliberate.

Spec
Implemented correctly (ticket 09 / 14 acceptance)
Requirement	Evidence
Guest onFinishRequested sets gateTriggered, blocks finish()
106:113:packages/pic-engine/src/session-engine/index.ts
Authenticated passthrough with no gate
Test + mode === "authenticated" branch
promote() success flips mode only after RPC resolves
127:150:packages/pic-engine/src/session-engine/index.ts
promote() failure leaves mode: 'guest', permits retry
Failure + retry test passes
Replay of gated finish/finishAnyway exactly once after success
Tests cover both kinds
discardGuestState() never calls RepositoryPort
Spy test passes
in_view → unseen at promotion boundary
SessionEngine + LocalGuestRepository both normalize
idempotencyKey = group.id for promote; session.id for recordUse
Matches §E “Guest Group's client-side UUID” vs per-session use_count
Composition root singleton outside React
19:23:packages/pic-web/src/composition-root.ts
Dumb reflection via useSyncExternalStore
session-engine-context.tsx
Component hierarchy stub
App → GuestModeShell → PersistenceGateModal
Partial / missing (deferred or gap)
Item	Verdict	Spec reference
Adapter swap after promotion
Deferred (ticket 15/20)
§E “No partial adapter swap” at pic-web layer — swapToSupabaseAdapter is a documented no-op stub
PersistenceGateModal UI
Deferred (ticket 15)
Returns null when gateTriggered — wiring only
rated_at at adapter boundary
Gap (Wave 4 carry-over)
Domain GroupEngine.hasPriorRating correct; LocalGuestRepository has no symptom persistence path yet
Gate/pending state on page refresh
Gap
User Story 2 persists group/player via localStorage; gateTriggered, pendingFinishRequest, promotionStatus are in-memory only — Finish intent lost on reload
discardGuestState clears guest storage
Partial
Engine fields only; no adapter clear hook
Implemented but wrong / integration-blocking
promotionStatus: 'pending' invisible to React subscribers — sessionEngineActions.promote calls notify() only after await promote() completes. Ticket 15’s pending-state UI cannot render mid-RPC:

composition-root.ts
Lines 67-69
async promote(guestState: GuestSnapshot, newUserId: string): Promise<void> {
  await sessionEngine.promote(guestState, newUserId);
  sessionEngineStore.notify();
Production promote path unreachable today — SessionEngine.promote() calls guestRepository.promoteGuestToAccount(), but LocalGuestRepository always throws GuestRepositoryCannotPromoteError. This correctly prevents “authenticated UI / guest data” limbo, but E2E promotion cannot succeed until ticket 13/15 routes promote to Supabase and swaps the active port.

Readonly RepositoryPort binding — All engines hold private readonly repositoryPort. Post-promotion finish side effects still target the guest adapter unless a swap/rebind strategy lands in ticket 15/20. Documented seam, but a hard prerequisite for real integration.

Double side-effect seam for ticket 13 — FakeRepositoryPort.promoteGuestToAccount writes group/session/library/timeline; replayed finish() then increments use_count with session.id. Different idempotency keys prevent double-increment on the same key, but ticket 13’s RPC must align with this replay contract (noted in session-engine/index.ts header).

Checklist Deep-Dive
Composition Root & DI (Wave 7) — PASS

composition-root.ts
Lines 19-23
const guestRepository: RepositoryPort = new LocalGuestRepository();
const libraryEngine = new LibraryEngine(guestRepository);
const timelineEngine = new TimelineEngine(guestRepository);
const playerEngine = new PlayerEngine(guestRepository, libraryEngine, timelineEngine);
const sessionEngine = new SessionEngine(guestRepository, playerEngine);
Exactly one LocalGuestRepository + SessionEngine at module load; rerender smoke test confirms stable identity.
Zero useState/useEffect in pic-web components.
Adapter imports only in composition-root.ts (+ exempt test file); depcruise 0 violations.
Persistence Gate Orchestration (Wave 5) — PASS (engine layer)
Guest path: gate blocks, remembers pending request.
Sovereign path: authenticated mode calls through immediately; post-promote replay runs once.
Failure path: mode stays guest, gateTriggered stays true, guest data untouched.
No Partial Swap Rule — PASS (engine); NOT YET WIRED (pic-web)
At the SessionEngine layer, mode flips to 'authenticated' only after promoteGuestToAccount resolves. On failure, the EM remains on guest with retryable state — no false-authenticated limbo.

At the pic-web layer, no adapter swap or guest clear occurs yet (intentional ticket 14 deferral). The current wiring cannot produce “UI thinks logged in but data didn’t move” because promote cannot succeed against LocalGuestRepository.

Persistence Boundary Normalization — PASS
LocalGuestRepository: read/write normalization of in_view → unseen.
SessionEngine.promote(): defensive re-normalize before RPC payload.
rated_at: correct in GroupEngine; adapter gap remains (Wave 4 SF-1 carry-over).
Adversary: Pending State Resilience — FAIL (refresh); PASS (network retry)
Scenario	Result
Network drop during promote()
Retry works; pending Finish preserved; tests prove fail-then-succeed
Page refresh while gate triggered
Finish intent lost — pendingFinishRequest not persisted; modal won’t reappear
Idempotency seal
group.id for promote RPC; session.id for use_count — distinct keys, water-tight per key
Terminology & CI — PASS (terminology); SHOULD-FIX (grandfather)
No “User” or “Failed” in pic-web/session-engine implementation code.
96 domain tests (exceeds 66+ threshold).
Grandfather list grew by 1 line — violates its own “must never grow” rule.
Verdict
REFACTOR REQUIRED
Wave 5 SessionEngine domain logic and Wave 7 shell scaffolding meet ticket 09/14 acceptance criteria and preserve DEC-017 gate semantics at the engine layer. They are not ready to integrate with ticket 15 (Persistence Gate Modal) or ticket 13 (promotion RPC) without targeted fixes in the composition/orchestration layer.

Must-fix (architectural breaches)
composition-root.ts — notify on promotionStatus: 'pending' before awaiting promote(), so dumb-reflection subscribers can render pending UI (ticket 15 contract).
Persist or re-derive gate + pending Finish across page refresh — either persist gateTriggered/pendingFinishRequest alongside guest blob, or document an explicit re-derivation rule (e.g. re-open gate when guest session has terminal_nemar answered but success_declared === false and no auth).
Define adapter rebind strategy before ticket 15 lands — readonly RepositoryPort in all engines requires a concrete swap mechanism (delegating port, factory rebind, or post-promote engine reconstruction); stub alone is insufficient for E2E.
Should-fix (documentation / testing gaps)
Revert or reflow docs/audits/wave-4-audit.md to shrink grandfather list (do not grandfather audit docs).
Wire discardGuestState() to a LocalGuestRepository.clear() API at composition root.
Consolidate in_view normalization into one shared helper (adapter + SessionEngine).
Expose repositoryPort via Context or remove export to match ticket 14 convention.
Track rated_at adapter persistence (Wave 4 SF-1) into adapter ticket scope.
Document ticket 13 RPC contract: promotion payload vs replayed finish() side effects must not double-write timeline or use_count.
Summary: Standards — 0 hard violations, 5 judgement-call gaps (worst: pending notify omission breaks dumb reflection). Spec — ticket 09/14 criteria met; 3 integration-blocking seams (pending UX, refresh resilience, adapter rebind). Worst issue per axis: Standards — promote notify() timing; Spec — Finish intent lost on page refresh while gate is open.