# 06: Recover interrupted promotion without loss or duplicate success

**Ticket ID:** W12-06

**Wave:** 12

**Status:** done

**What to build:** After a dropped response, interrupted bookkeeping, or refresh during saving, the Event Manager can safely
recover the same work with the correct owner and no duplicate timeline/use increment.

**Blocked by:** W12-05 — Real Email/Password login and Guest promotion.

**Source:** [Approved Wave 12 specification][relocation-link-1], Implementation Decisions D (Promotion contract and cleanup); User
Stories 24-26 and 30; DEC-018.
The nine-ticket breakdown and dependencies were approved without changes on 2026-10-13.

## Context Injection (verbatim)

> If the RPC committed but the response was lost, retry its exact payload/key.

## Owned vertical slice

Own web promotion serialization, recovery envelope, cleanup ordering, and fault recovery through existing public contracts. Atomic
transactions, normalization, idempotency rules, and Finish semantics remain owned by the unchanged engine/adapter/RPC.

## Acceptance criteria

- [x]  AC-01: Freeze the exact Guest snapshot and stable idempotency key for one operation, bound to verified owner and flow
      generation; repeated clicks/callbacks reuse the operation and cannot change its payload.
- [x]  AC-02: Retain a web-owned recovery envelope containing snapshot, owner, pending Finish kind, and generation through
      interruption/reload, without credentials. Storage failure before safe recovery preparation must not silently discard the
      only draft.
- [x]  AC-03: Defer web-owned Guest cleanup until promotion and required completion reconciliation settle; remove the current
      early cleanup behavior without modifying SessionEngine internals.
- [x]  AC-04: RPC rejection restores the appropriate prior provider and keeps local recovery data. Retry under the same valid
      identity does not require another password submission.
- [x]  AC-05: A committed RPC with a lost response is retried with identical key/payload; it produces one row-set and one use
      increment. Never infer that an uncertain response means nothing was saved.
- [x]  AC-06: A post-promotion completion failure reconciles through existing idempotent public completion contracts without a
      second success effect; the UI reports pending/recovery until completion is known.
- [x]  AC-07: Refresh restores enough pending intent to recover for the same owner; stale callbacks after reset and callbacks for
      another owner cannot claim, delete, or promote the old snapshot.
- [x]  AC-08: Delete Guest/recovery residue only after confirmed completion or explicit applicable local discard. Discard never
      deletes already-anchored server data or lets flow persistence recreate the cleared Guest blob.
- [x]  AC-09: Reset and therapeutic writes cannot race the provider swap/recovery. Canceling a discard retains the operation and
      draft, and no false saved or reset-success announcement is emitted.
- [x]  AC-10: Prove the matrix: duplicate submission, pre-RPC rejection, RPC rejection, lost committed response, post-RPC
      completion failure, cleanup failure, reload, and owner/generation mismatch, for linked and unlinked sessions where
      applicable.

## Verification and prior art

Use one failing behavioral test per adversarial matrix row before implementation, per the orchestrator contract. Extend web
promotion and assembled-Gate tests; retain existing real RPC idempotency regressions unchanged.

## Dependencies and exclusions

Do not weaken or rewrite fingerprint/normalization behavior to make a retry pass. If a required recovery cannot use public
contracts, report the exact seam blocker instead of crossing into engine or SQL.

## Isolation bounds

- Implementation and tests: 100% inside `packages/pic-web`. This active ticket's Resolution is the documentation exception.
- Zero edits to `packages/pic-engine`, either adapter package or their tests, database migrations, backend schemas,
  RPC definitions, seeds, root tooling, manifests, or lockfiles. Read public contracts; call them unchanged.
- Adapter access stays in the existing web composition root/promote boundary; screens use contexts/actions.
- Preserve Dumb Reflection, Event Manager sovereignty, blind ratings, at most two direct main-frame choices,
  WCAG AA in RTL/LTR, and the approved scope exclusions.
- Treat the Wave 12 spec as frozen. Report an unmet public-contract dependency rather than widening this ticket.

## Completion contract

- Add behavioral tests at the existing application/feature seam and run relevant unit/browser checks, web typecheck,
  lint, and dependency isolation checks; preserve the inherited 442 unit/integration and 161 browser coverage.
- Record exact verification commands/results and changed-path evidence. Required unavailable infrastructure is
  unverified, not a skipped green result. Full assembled-wave gates belong to W12-09.
- Before implementation dispatch, the orchestrator supplies the seam map and ticket-specific spawn brief and checks
  blockers. Shared-file writer coordination is separate from the approved functional dependency graph.
- During implementation, complete a per-AC Resolution and ticket-scoped atomic commit using this ticket ID.
  Ticket persistence alone does not check off acceptance criteria, create implementation commits, or dispatch work.

## Resolution

Implementation, independent review, and scoped verification are recorded below; orchestrator closure remains pending.
The orchestrator verified web-only paths and changed-line limits before this atomic ticket commit.

### Solution Path

- AC-01: Login submissions and public promotion callbacks share exclusive admission and one in-flight promise.
  Freeze the first snapshot with verified owner, pending Finish kind, and flow generation. Retries reuse that exact
  payload; the unchanged engine derives the same group/session UUID idempotency key. Duplicate callback tests
  first observed two RPCs and now observe one, even when the second callback supplies changed local work.
  Both exported promotion actions use this coordinator; fresh snapshots must match the current pending session.
- AC-02: `promotion-recovery.ts` persists the snapshot/owner/kind/generation before profile preparation or provider
  switching. No credentials or Auth tokens enter the envelope. Blocked recovery storage rejects before RPC and
  retains the only Guest draft; after storage returns, the original pending operation can retry.
- AC-03: Removed the early `onPromotionSucceeded` Guest clear. The engine action and confirmation read settle
  before web cleanup. Await queued flow writes, clear Guest storage, and remove recovery last. Publish the cleared
  Player pointer without another Guest-storage write, preventing resurrection after cleanup.
- AC-04: RPC rejection restores the previous provider and retains the exact owner-bound operation. Same-owner
  retry needs no additional password submission. Post-rejection therapeutic writes cannot overwrite pending intent.
  Rejected identity verification restores the credential form while retaining the original owner's recovery data.
  A verified identity also remains reusable when durable preparation fails before profile/RPC work.
- AC-05: Linked/unlinked tests simulate commit followed by a lost response, then retry the exact payload/key.
  Real normal-TLS Supabase tests verify one Timeline row, use_count1, and a completed PlayerSession after retry.
  Reload tests mutate the local draft after uncertainty and prove that the original payload still reaches RPC.
- AC-06: An interrupted post-RPC completion retains the Gate through a separate web recovery phase. The active
  engine's mode/gate/promotionStatus remain truthful. Retry rebinds the one authoritative SessionEngine through its
  public constructor and original pending gate, preserving the existing atomic-receipt Finish guard. Tests verify
  no extra Timeline append and authenticated provider/mode continuity after reconciliation.
- AC-07: Boot restores pending intent and Player focus from the durable envelope even if Guest cleanup already
  removed the original blob. Nonzero generation tests cover reset -> save -> cleanup interruption -> reload.
  Owner changes and stale generation/public callbacks reject without claiming or deleting the old operation.
- AC-08: Recovery clears only after confirmed completion/cleanup or explicit confirmed local discard. The shared
  reset coordinator clears both recovery forms and frozen request state; it never deletes authenticated server
  rows. Existing anchored-reset regressions remain green. Guest flow persistence cannot recreate the final blob.
- AC-09: The exclusive operation drains earlier writes and blocks competing writes/provider swaps. Reset awaits
  settlement and includes recovery residue in loss confirmation even after engine authentication. Assembled Gate
  testing proves canceling discard preserves exact recovery and permits one successful retry without false saved UI.
- AC-10: `promotion-recovery.test.ts` adds24 behavioral cases across duplicate submissions, pre-RPC verification and
  storage rejection, RPC rejection, committed response loss, completion failure, Guest/envelope cleanup failure,
  reload, changed owner, nonzero/stale generation, stale public callbacks, and assembled Gate/cancel behavior.
  Linked/unlinked branches run where snapshot shape or pending Finish kind matters. The real remote suite adds
  linked/unlinked response-loss regressions without changing existing atomic idempotency coverage.

### Architectural Decisions

- Keep all runtime/test changes inside `packages/pic-web`; adapter access stays in composition/promote wiring.
- Preserve engine normalization, RPC fingerprints/transactions, and existing Finish replay rules unchanged.
- Reconciliation uses a public-constructor rebind of the single active SessionEngine, sharing the existing Player
  and RepositoryPort. Unsubscribe the consumed instance and subscribe the replacement to the same web store.
- Web recovery/save phase has its own external store. It controls Gate visibility and messages without changing
  SessionEngine domain fields. The E2E waits for engine success plus completed web cleanup before checking no blob.
- Invalid/unreadable recovery data is retained without boot-time deletion; validated envelopes restore generation
  monotonically. Authentication secrets remain only in the SDK/transient form state.

### Verification

- Required red/green evidence: duplicate durable-envelope tests failed because storage was absent; completion
  rejection tests failed because early callback cleanup removed Guest data; cleanup tests exposed lost recovery;
  lost-response/reload tests exposed changed RPC payload; pre-RPC identity rejection suppressed credential recovery;
  RPC rejection allowed another Finish; stale public callback crossed a completed reset; duplicate public callbacks
  invoked two RPCs. Each failure was observed before its corresponding implementation correction.
- Review regressions also reproduced false credential requirements after recovery-storage rejection, a stale
  callback crossing reset into a newer inquiry's Gate, and exported raw promotion bypassing pending-intent checks.
  Fixes retain server-verified identity independently of storage and route every promotion export through the same
  matching-pending-session coordinator. Legacy fixtures now establish a real Gate instead of a fabricated login.
- Final review regression first showed that a storage-rejected frozen snapshot could be replaced by a changed
  same-session public callback. The coordinator now selects existing memory/durable intent before supplied data,
  validates owner/generation and exact pending session/kind, and freezes before attempting durable storage.
- Independent Standards and Spec reviews both report zero remaining findings after the narrow corrections.
  Focused recovery/Gate/unchanged Player reset passed42tests with two workers and original timeouts.
- Scoped typecheck passed: `npm run typecheck -w packages/pic-web`, exit0; final run5.98seconds.
- Final full web suite ran alone: `npm test -w packages/pic-web -- --maxWorkers=2`,35files/305tests passed,
  exit0 in40.07seconds. The worker cap reduces host transform contention without changing coverage or timeouts.
  Includes both new real remote response-loss cases and existing real profile/promotion/idempotency checks.
- An earlier unbounded final run had302/304 passing with two unchanged Player-reset5000ms timeouts under host load.
  The original reset cases passed in the focused run and all305 passed with the worker cap; no timeout changes.
- First full suite exposed the old happy-path E2E waiting only for raw engine success before expecting no blob.
  Added a web-recovery-complete assertion to that existing wait; preserved timeout and all persistence assertions.
- Dependency isolation passed: `npm run depcruise -w packages/pic-web`,758modules/1626dependencies, zero violations.
- Scoped lint passed: `npx eslint packages/pic-web`, exit0.
- Final focused Chromium passed24tests with two workers in40.8seconds, exit0, after the complete web suite.
  Command from `packages/pic-web`: `npx playwright test tests/inquiry-reset.browser.test.ts`
  `tests/player-reset.browser.test.ts tests/persistence-gate.browser.test.ts tests/unified-player.browser.test.ts --workers=2`.
- `git diff --check` passed. All changed/new web lines are at most130characters; runtime/test paths stay inside
  `packages/pic-web`. No commits were made by the implementation agent; the orchestrator owns atomic closure.
- Sandbox Vite-cache rename EPERM required escalated test execution. Normal TLS, retries, timeouts, dependencies,
  RPC/engine/adapter implementations, schemas, migrations, and lockfiles remain unchanged.

### Deviations

- No domain, public-contract, or isolation-bound deviation. This active Resolution is the sole documentation
  exception; all runtime/tests stay in the web package. Registration/verification remains07 and expiry remains08.
- Independent Standards/Spec review and final changed-line/path checks passed; the ticket is closed.

[relocation-link-1]: ../../specs/wave-12-spec.md
