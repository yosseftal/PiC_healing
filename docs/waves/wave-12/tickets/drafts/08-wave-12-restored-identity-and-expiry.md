# 08: Restore identity and handle expiry without losing work

**Ticket ID:** W12-08

**Wave:** 12

**Status:** done

**What to build:** A returning user's verified identity is reused at a real Persistence Gate, while session expiry or external sign-out pauses authenticated writes and permits safe reauthentication without losing work.

**Blocked by:** W12-06 — Recover interrupted promotion without loss or duplicate success.

**Source:** [Approved Wave 12 specification](../../../docs/specs/wave-12-spec.md), Implementation Decisions D (Returning identity and engine limitation); User Stories 7, 21, 24-25 and 30.
The nine-ticket breakdown and dependencies were approved without changes on 2026-10-13.

## Context Injection (verbatim)

> Supabase identity can be restored independently of therapeutic
> SessionEngine mode.

## Owned vertical slice

Own the web Auth lifecycle, owner-scoped cache/request handling, reauthentication presentation, and integration with existing reset and promotion actions. Engine bootstrap and authenticated workspace hydration are outside scope.

## Acceptance criteria

- [x] AC-01: Restore the SDK's persisted identity using one coordinated web client/listener lifecycle; at a real pending gate reuse a valid verified identity without asking for credentials again.
- [x] AC-02: After a fresh load, a new unanchored inquiry may remain in local Guest storage until its real gate. Reflect identity separately from persistence and never label local work as already saved.
- [x] AC-03: Do not mutate private SessionEngine mode or fabricate a promotion for login. Successful promotion in the current runtime retains the authenticated provider for subsequent work.
- [x] AC-04: Detect session expiry or external sign-out and stop authenticated writes before retry. Present localized reauthentication while preserving pending intent and recoverable drafts.
- [x] AC-05: Resume a pending write or promotion only for its verified owner using existing public contracts. A different user does not inherit old caches, pending actions, or Guest recovery ownership.
- [x] AC-06: Keep already-anchored records classified as saved records during expiry; never treat them as disposable Guest data or overwrite them through a newly fabricated Guest promotion.
- [x] AC-07: Starting anew after authentication detaches active focus and preserves saved groups, identity, and locale. Confirm loss of unsaved input; an empty/no-unsaved-input reset remains smooth.
- [x] AC-08: Unsubscribe/coordinate duplicate Auth events, invalidate stale owner-specific reads, and serialize lifecycle changes with reset/promotion so old callbacks cannot revive a discarded session.
- [x] AC-09: Test fresh-load identity reuse, expiry before saving, expiry during a pending operation, external sign-out, same-owner reauthentication, different-owner rejection, and authenticated new-group flow.
- [x] AC-10: Provide truthful boundaries: this ticket does not add saved-history browsing, cross-device Guest transfer, general account switching, or authenticated workspace hydration after reload.

## Verification and prior art

Extend Auth/Gate/composition tests and browser journeys using the existing application seams. Use actual Supabase identity where required to establish session behavior; do not add an engine bootstrap API.

## Dependencies and exclusions

Can proceed alongside 07 once 06 is done, subject to a single writer for overlapping Auth/composition modules. Registration behavior need not be implemented to verify returning-user expiry.

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

Resumed checkpoint 2026-10-15, base05bad952703626cb5bbb2d42682848c4c8adb66d.
The accepted review fixes and two narrow follow-up edge fixes have focused red/green proof. Final full web gate
passes347/347 and focused Chromium16/16; narrow independent re-review remains pending. Parent owns atomic commit/closure.
Stashac51f52 was already restored by parent, once.

### Solution Path and AC evidence

| AC | Implemented evidence at this checkpoint | Closure status |
| --- | --- | --- |
|01|One refcounted SDK listener/client; verified restore and real Gate reuse.|Final gates/review pending.|
|02|Identity separate from Guest engine; subsequent authenticated focus marked before publication.|Both reload cases pass.|
|03|Public constructors/actions only; successful promotion retains authenticated provider.|No private bootstrap/fake promotion.|
|04|Exact-call admission/resume; original submitted Gate permits independent same-owner reauth.|Assembled red/green passed.|
|05|Owner/generation binding, other-owner rejection, stale-read invalidation, owner-only retained draft.|Covered; review pending.|
|06|Anchored records retained; uncertain append never replayed or claimed saved.|Durable facts permit detachment.|
|07|Reset preserves server work/identity/locale; confirmed detachment retains uncertainty.|Cancel/storage-failure retry pass.|
|08|Listener cleanup, queued admission, reset drain, token refresh; independent reauth submission.|Focused evidence passes.|
|09|22 deterministic identity/staging cases,5 live checkpoints,2 bilingual browser cases.|Full347/347; Chromium16/16.|
|10|Retained draft same-owner read-only; no private hydration, history or account switching.|Boundary remains explicit.|

Owner-bound staging was explicitly approved by the Event Manager; authoritative decision:
.scratch/wave-12/authenticated-draft-seam-decision.md. The earlier blocker-only selection was withdrawn.
Only NEW unanswered groups stage locally. Public GroupEngine creates/adds/rates the exact UUIDs; a real answer
flushes through unchanged authenticated saveGroup. Local phase distinguishes draft/flushing/anchored; exact partial
save retry and cleanup-only retry preserve payloads and server records. The live raw adapter still rejects an honest
unanswered draft with PostgreSQL23502; this negative proof is not successful new-group evidence.

Real positive proof used isolated admin-created confirmed returning Auth fixtures with actual password login,
own-profile preparation, marker-owned cleanup, and normal TLS. It consumed no signup email. The journey proved:
SDK persisted identity -> real Guest Gate promotion -> same-runtime authenticated group/add/rate staging -> zero
server group/symptom rows before answer -> exact IDs/ratings saved after actual answer -> linked authenticated
Finish -> timeline2/use_count2 -> reset preserves saved group. Admin fixtures do not replace W12-07 real signup proof.

### Architectural Decisions and truthful boundaries

- Identity lifecycle stays web-owned and independent of therapeutic SessionEngine mode.
- Auth callbacks are synchronous; getUser work runs from setTimeout after SDK callback return, avoiding Auth-lock deadlock.
- Provider admission checks verified owner/revision/generation immediately before each call; suspended calls retain their
  own continuation. Completed increment/Timeline work must never be repeated by restarting authenticated Finish.
- Only confirmed Auth rejection retries a non-idempotent append. An ambiguous append response is never replayed or
  announced saved. Existing public port has no receipt lookup/idempotency key for ordinary Timeline append.
- Partially completed ordinary Finish still requires same-owner reauthentication before reset. For an uncertain
  append, explicit confirmed detachment durably retains owner/generation/session IDs/exact attempted event in
  pic-web.uncertain-completions.v1 BEFORE canceling the parked continuation. This separate record never becomes
  promotion recovery or authorizes replay. Cancellation or retention failure keeps work; successful detachment
  clears old active partial markers only after successful reset and generation advance. Fallible Guest cleanup keeps
  the uncertainty barrier active, and retained session IDs permanently reject stale Finish/Finish Anyway, including
  after reload, without blocking new session IDs. Retained facts are deduplicated on reset retry. No reconciliation added.
- Gate reauthentication has independent submitting state/ref from the original suspended save; it resumes the
  exact rejected port call without repeating the promotion RPC, Timeline append or use-count increment.
- New authenticated group/Player actions durably mark their owner before creating/publishing/persisting pointers.
  Reload ignores these server-only pointers and honestly starts Guest; no authenticated hydration is attempted.
  Before clearing a retained authenticated marker for new Guest work, persist the suppressed/current Guest facts.
  If that write fails, retain the marker and old blob so a second reload still cannot restore server-only IDs.
- Restored authenticated staging cannot resume through public GroupEngine symptom lookup or SessionEngine bootstrap.
  Keep exact owner-bound envelope, verify owner before showing group/symptom names, keep prior ratings hidden, and
  offer explicit loss-confirmed discard. Do not flush a restored draft while engine is Guest or fabricate promotion.
- Corrected inherited web promotion recovery validator from invalid separate to canonical split_suggested; together
  remains accepted. Exact recovered split payload retains one promotion effect. No engine/adapter/schema changes.

### Red evidence and verification chronology

All focused Vitest commands used npx vitest run <listed-file> --maxWorkers=2 from repository root.
Initial sandbox temporary-file rename EPERM required authorized escalated test execution; TLS was preserved.

- returning-identity.test.ts initial restore: missing authLifecycle.start failed before implementation.
- Expired owner admission: saveGroup incorrectly called after SIGNED_OUT failed before guard implementation.
- Mid-Finish confirmed Auth rejection: operation rejected instead of staying pending failed before exact-call recovery.
- Ambiguous Timeline response: verified instead of uncertain failed before uncertain parking was introduced.
- Assembled localized reauth: missing dialog failed before reauth rendering was added.
- Queued signout after verification: saveGroup incorrectly called failed before final synchronous admission recheck.
- Same-owner TOKEN_REFRESHED: reauthenticate instead of checking failed before deferred refresh continuity correction.
- Approved staging: saveGroup incorrectly called before real answer failed before owner-bound staging implementation.
- Confirmed stage cleanup: saveGroup called twice failed before cleanup-only retry.
- Concurrent new drafts:2 fulfilled creations instead of1 failed before final staged UUID recheck.
- promotion-recovery.test.ts split_suggested: null recovery instead of failed failed before validator correction;
  all26 promotion recovery cases subsequently passed.
- Partial-Finish reset regression was requested after the mechanism existed. Honest sensitivity proof: temporarily
  removing its reset guard made the new regression fail (reset resolved confirmation instead of rejecting). Original
  runtime was restored immediately, then the focused suite passed. This is mutation sensitivity, not historical TDD.
- Real returning test initially combined3 cases and hit unchanged5000ms timeout in the long promotion/staging case.
  Split the same journey into5 explicit checkpoints, preserving all assertions/timeouts/retries. Final5 real cases
  plus17 deterministic cases passed22/22 in14.10s; fixture cleanup succeeded.
- Final focused four-file run: returning-identity.test.ts, promotion-recovery.test.ts, registration.test.ts,
  persistence-gate-modal.test.tsx:65/65 passed,4files,6.17s.
- npm run typecheck -w packages/pic-web: passed after frozen code and again after Node storage guard.
- npx eslint packages/pic-web: passed after Node guard and formatting fixes.
- npm run depcruise -w packages/pic-web: passed,766modules/1668dependencies,zero violations.
- Full gate: PIC_REGISTRATION_TEST_EMAIL=test-e2e@pic-healing.com;
  npm test -w packages/pic-web -- --maxWorkers=2: FAILED,68.45s,37passed/2failedfiles;
  339passed/1failedtests,340 discovered (one suite failed before discovery). Real signup returned
  over_email_send_rate_limit. Other suite was content-localization/source-cache.test.ts, Node localStorage undefined.
- Node regression fixed with typeof localStorage guard in hasAuthenticatedFocus. Unchanged source-cache.test.ts
  subsequently passed2/2 in1.03s. Full suite was NOT rerun afterward; do not combine counts into a green full gate.
- Focused Chromium from packages/pic-web:
  npx playwright test returning-identity.browser.test.ts persistence-gate.browser.test.ts
  registration.browser.test.ts player-reset.browser.test.ts --workers=2:16/16 passed27.8s.
  Includes2 new bilingual320x568 owner-verified retained-draft/keyboard confirmation/geometry/no-therapeutic-write cases.
- Browser and full Vitest did not overlap. Default thresholds, retries, timeouts and normal TLS remain unchanged.
- Removed blank EOF in promotion-recovery.ts and wrapped long new lines; remaining final scope/diff checks belong to resume.

### Accepted review findings: implemented on resume, independent review pending

1. P1 original Gate submission: regression first failed with missing password field during suspended completion.
   Independent reauth state/ref now passes user submit -> rejected savePlayerSession -> same-dialog credentials ->
   exact continuation, one RPC, no extra Timeline/increment. Original save serialization remains intact.
2. P2 uncertain detachment: regression first failed with permanent reset rejection. Confirmed retention/detachment
   now passes; old session remains unconfirmed, new Finish succeeds, durable uncertainty survives subsequent resets.
   Assembled confirmation initially failed missing informed warning; localized warning now passes alongside cancel,
   Storage.setItem failure retaining pending work, and successful explicit retry. Storage failure occurs before
   resetting=true, so retry cannot remain locked. Saved server rows are never deleted by reset.
3. P2 subsequent focus: both regressions first failed restoring server-only group/Player IDs into Guest storage.
   Marker-before-create now passes reset -> authenticated Player -> fresh App and answered group -> fresh App,
   both showing new group screen with null active pointers, truthful Guest mode and no fabricated promotion.

### Resumed verification and second review fixes

- Initial resumed focused four files69/69 passed8.01s; unchanged Node cache regression2/2 passed in combined71/71.
- Initial resumed typecheck caught invalid Testing Library exact options in new tests. Removed those test-only
  options without changing role/name matches; final typecheck passed. Lint/dependency checks passed.
- Real returning journey5/5 passed13.99s, including actual staging, answer/save, Finish timeline2/use_count2 and cleanup.
- First full npm test workspace attempt failed before discovery:39suites,0tests,46.04s; sandbox EPERM renaming
  Vite cache files in AppData temporary storage. It performed no signup. Exact escalated command, normal TLS,
  then passed39files/346tests66.62s,13:46:06UTC start and about13:47:13UTC completion. Real signup passed using
  test-e2e@pic-healing.com, generated confirmation link and marker-owned cleanup. This pass PRECEDES edge fixes below.
- Narrow Spec re-review found Guest-first-write failure after marker removal: both Player/group regressions failed
  with server-only IDs restored on the next reload. Durable Guest facts now precede marker removal; both pass.
- Narrow Spec re-review found uncertainty cleared before fallible reset cleanup: regression failed verified versus
  uncertain after Guest cleanup failure. Cancellation now only stops parked continuation. Successful final detachment
  clears active uncertainty, while durable session denial prevents old completion replay after reset/reload. Proof covers
  preserved facts -> Guest cleanup failure -> old Finish denied -> reset retry -> new Finish succeeds -> stale callback
  denied -> fresh Guest gate cannot accept old uncertain session. Existing partial-Finish reauth remains covered.
- Final focused four files70/70 plus unchanged Node cache2/2 passed72/72,5files,7.25s. Final typecheck and scoped lint
  passed; depcruise766modules/1670dependencies,zero violations. Diff whitespace and130-character new-line checks pass.
- Final exact second-freeze snapshot: PIC_REGISTRATION_TEST_EMAIL=test-e2e@pic-healing.com;
  npm test -w packages/pic-web -- --maxWorkers=2 passed39files/347tests70.38s. Started13:51:39UTC, completed
  about13:52:50UTC. Real signup/confirmation/profile/promotion and all5 returning checkpoints passed; marker-owned
  cleanup completed, normal TLS, existing thresholds/retries/timeouts unchanged. This is the second actual signup
  since13:46UTC; no extra signup probes were run. Browser runner starts only after full Vitest exits.
- Final Chromium command from packages/pic-web: npx playwright test returning-identity.browser.test.ts
  persistence-gate.browser.test.ts registration.browser.test.ts player-reset.browser.test.ts --workers=2:
  16/16 passed28.5s, including bilingual320px owner-only retained draft and reversible keyboard confirmation.
  This runner began after final full Vitest exited. No test skips, raised timeouts/retries or TLS changes.
- Runtime/test second freeze remains active; parent narrow independent re-review/atomic commit/closure pending.

### Resume checklist and limitations

- Stash restoration completed once; preserve backups until verified closure. Do not apply any stash again.
- All five accepted findings are implemented within public contracts and strict web-only scope.
- Final focused/typecheck/lint/depc/full live web/Chromium gates pass; narrow re-review remains outstanding.
- Historical signup quota failures remain recorded distinctly. Current final actual signup gate passed; no skips,
  weaker assertions, raised thresholds or TLS changes. Parent owns verified08 commit and closure.
- Final W12-09 assembled/root/browser gates and physical Pending Manual QA Verification remain separate work.
- No active exec sessions remain after browser75904 completed; writer stopped without starting review fixes.

## Parent closure

Verified atomic commit bf1ecf26848aa9ca0eeeeda255c00d4c11079295; final Standards0 / Spec0.
Canonical closed record: docs/specs/tickets/12-08-restored-identity-and-expiry.md.
Earlier pending/paused notes above are historical. Next ticket09; working tree clean.
