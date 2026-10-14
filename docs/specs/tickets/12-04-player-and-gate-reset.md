# 04: Start anew from the Player and Persistence Gate

**Ticket ID:** W12-04

**Wave:** 12

**Status:** done

**What to build:** The Event Manager can leave an active Player or explicitly decline pending persistence through the same
loss-confirmation flow, while keeping saved history and control over the decision.

**Blocked by:** W12-03 — Start a new Symptom Group during creation and inquiry.

**Source:** [Approved Wave 12 specification](../wave-12-spec.md), Implementation Decisions A and D (Verification
continuity); User Stories 3-10 and 27.
The nine-ticket breakdown and dependencies were approved without changes on 2026-10-13.

## Context Injection (verbatim)

> Do not equate overlay dismissal, switching
> register/login forms, or opening email with the Event Manager's explicit choice to discard.

## Owned vertical slice

Extend 03's coordinator into Player utilities and the existing Gate discard path. Own pending-Finish/reset interaction and
related web tests; real credential forms belong to 05.

## Acceptance criteria

- [x] AC-01: Expose the shared new-group action from the Player and route the Gate's explicit continue-without-saving/decline
  action through the shared confirmation flow.
- [x] AC-02: Cancel preserves the active session/unit, terminal answer, pending Finish or Finish Anyway kind, and existing input;
  canceling a Gate discard confirmation returns to that Gate with its draft intact.
- [x] AC-03: Escape, outside dismissal, and ordinary overlay closure never silently discard Guest state. Maintain one modal focus
  owner and meaningful focus restoration.
- [x] AC-04: Confirmed discard clears the pending gate through existing public SessionEngine behavior and fully resets web
  pointers/flags before final Guest cleanup; refresh does not reopen a stale Player or Gate.
- [x] AC-05: Retain anchored groups and Player records on reset. Detaching focus does not declare success, mutate preserved unit
  states, increment use counts, or manufacture a therapeutic failure.
- [x] AC-06: Serialize reset with current Player writes and promotion operations; re-evaluate ownership after an operation
  settles. Stale callbacks cannot finish or promote the reset inquiry.
- [x] AC-07: On failed cleanup or pending write, keep sufficient local state for retry and present calm localized feedback
  without announcing a completed reset.
- [x] AC-08: Exercise linked and unlinked Players, terminal Yes/No, Finish Anyway, and pending Gate cases in both directions.
  Confirmation and success announcements remain keyboard/screen-reader accessible.

## Verification and prior art

Use existing Player, pending-Gate, composition, and browser fixtures. Existing test seams may supply authenticated records before
the real auth UI lands; actual login-to-reset integration is also checked by 05/08/09.

## Dependencies and exclusions

Reuse 03's action; do not create a second reset implementation. Later auth tickets must participate in the same operation
serialization.

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

Implementation, independent reviews, and scoped verification complete. Closed by the orchestrator.

### Solution Path

- AC-01: Player utilities expose the common new-group action. Gate decline uses the same reset coordinator and
  confirmation controls as the other inquiry screens; no immediate discard remains in the Gate UI.
- AC-02: Cancellation leaves Player records, unit states, terminal Yes/No, pending Finish/Finish Anyway, and Gate recovery
  state intact. Composition tests cover both pending kinds; the Player UI matrix covers linked/unlinked and both locales.
- AC-03: Gate is a controlled Radix modal. Confirmation stays within that modal; Escape/outside dismissal returns to its
  decline control. Ordinary Gate dismissal keeps the pending request. Sheet-to-Gate handoff waits for drawer closure,
  preventing overlapping focus ownership and stale background aria-hidden. Browser cases assert focus and one dialog.
- AC-04: Confirmed Guest reset uses public SessionEngine.discardGuestState, clears persisted flow pointers, then removes
  Guest storage. The visible transition publishes only after cleanup. Browser reload returns to fresh group creation.
- AC-05: Authenticated reset detaches focus and preserves group/Player records, unit states, terminal answers, identity,
  provider, and use counts. A linked/unlinked Yes/No composition matrix asserts exact retained records and zero new uses.
- AC-06: Whole snapshot/auth/provider-switch/promotion operations participate in the existing inquiry lifecycle. Reset
  waits for pending Player writes and promotion, then re-evaluates ownership. Cleanup closes admission; generation checks
  reject callbacks from the previous inquiry. Tests cover failed Player writes, successful promotion, and stale UI actions.
- AC-07: A web-owned recovery envelope retains current records, pointers, and exact pending intent before destructive
  cleanup. Public repository calls and onFinishRequested restore it; failed rearming preserves retry across reload.
  Tests cover cleanup plus rearming failure, failed boot restoration then retry/new creation, and envelope cleanup failure.
  The latest public Finish request also survives an earlier failed Gate write, including an older persisted Finish kind.
  Recovery never announces reset success. Malformed envelope facts/intent do not crash bootstrap.
- AC-08: Eight Player UI cases cover Hebrew/English, linked/unlinked, and terminal Yes/No. Four browser cases cover
  keyboard and outside dismissal at 320px/1440px, Gate reopening, focus restoration, confirmed reset, live success, and reload.
  Existing Gate regression cases cover four viewport widths in both directions, pending promotion, recovery, and retry.

### Architectural Decisions

- Reused 03's reset coordinator, lifecycle admission/settlement, flow generation, and remount boundary.
  Shared web confirmation controls remove duplicate request/recovery handling from the common Frame.
- Deferred engine-state notifications only during destructive cleanup. Promotion remains observable while reset waits,
  so provider rollback and post-operation ownership evaluation use the real settled SessionEngine state.
- Read pending intent through RepositoryPort.getGuestSessionGate. Restore only with public repository contracts and
  SessionEngine.onFinishRequested; never mutate private engine state. Successful recovery clears its envelope before
  resumed work/promotion, preventing stale Guest intent from being replayed against authenticated records.
  A web mirror of public request arguments preserves the latest kind when the engine's Gate persistence rejects.
  The mirror initializes from the public persisted Gate and clears on successful reset or promotion ownership change.
- Keep locale/auth providers mounted; reset clears only inquiry-owned state and keys. Gate form implementation remains05.
- Treatment selection closes its shared drawer after successful Player creation unless reset is awaiting confirmation.
  The inherited Player test fixture now resets public Gate state between cases, reflecting the new modal isolation.

### Verification

- Red evidence: pending Finish/Finish Anyway reset failed on the inherited stage refusal; Gate decline failed to show
  confirmation; new browser dismissal cases exposed stale background aria-hidden; full web runs exposed Picker drawer
  carry-over and delayed initial Gate autofocus. Each received a behavioral fix without weakening the test harness.
- `npm run typecheck -w packages/pic-web`: passed.
- `npm test -w packages/pic-web`: passed, 33 files / 274 tests, exit code zero. Full web ran alone before Chromium.
- `npm run depcruise -w packages/pic-web`: passed, 754 modules / 1608 dependencies, zero violations.
- `npx eslint packages/pic-web`: passed. `git diff --check`: passed. Every new/changed web line is at most130 characters.
- Focused Chromium passed24 tests in40.3 seconds, two workers, exit code zero. Command from packages/pic-web:
  `npx playwright test tests/inquiry-reset.browser.test.ts tests/player-reset.browser.test.ts`
  `tests/persistence-gate.browser.test.ts tests/unified-player.browser.test.ts --workers=2`
- Initial sandbox unit attempts hit Vite temp-cache rename EPERM before tests ran. Elevated test commands run normally;
  no TLS policy, timeout, retry policy, dependency, or harness changes were made.
- Independent Standards and Spec review: zero remaining findings on both axes, confirmed by the orchestrator.

### Deviations

- No scope or public-contract deviation. Runtime/test changes are entirely under packages/pic-web; this Resolution is
  the sole documentation exception owned by this agent. No engine, adapter, schema, migration, root, or lockfile edits.
- Focused browser suites satisfy this ticket; the full assembled-wave browser/root/manual gates remain W12-09.
- Closed after all required scoped gates and both independent reviews passed.
