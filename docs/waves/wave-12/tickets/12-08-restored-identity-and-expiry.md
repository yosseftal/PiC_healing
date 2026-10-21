# 08: Restore identity and handle expiry without losing work

**Ticket ID:** W12-08

**Wave:** 12

**Status:** done

**What to build:** A returning user's verified identity is reused at a real Persistence Gate, while session expiry or external
sign-out pauses authenticated writes and permits safe reauthentication without losing work.

**Blocked by:** W12-06 — Recover interrupted promotion without loss or duplicate success.

**Source:** [Approved Wave 12 specification](../specs/wave-12-spec.md), Implementation Decisions D (Returning identity and engine
limitation); User Stories 7, 21, 24-25 and 30.
The nine-ticket breakdown and dependencies were approved without changes on 2026-10-13.

## Context Injection (verbatim)

> Supabase identity can be restored independently of therapeutic
> SessionEngine mode.

## Owned vertical slice

Own the web Auth lifecycle, owner-scoped cache/request handling, reauthentication presentation, and integration with existing
reset and promotion actions. Engine bootstrap and authenticated workspace hydration are outside scope.

## Acceptance criteria

- [x] AC-01: Restore the SDK's persisted identity using one coordinated web client/listener lifecycle; at a real pending gate
  reuse a valid verified identity without asking for credentials again.
- [x] AC-02: After a fresh load, a new unanchored inquiry may remain in local Guest storage until its real gate. Reflect
  identity separately from persistence and never label local work as already saved.
- [x] AC-03: Do not mutate private SessionEngine mode or fabricate a promotion for login. Successful promotion in the current
  runtime retains the authenticated provider for subsequent work.
- [x] AC-04: Detect session expiry or external sign-out and stop authenticated writes before retry. Present localized
  reauthentication while preserving pending intent and recoverable drafts.
- [x] AC-05: Resume a pending write or promotion only for its verified owner using existing public contracts. A different user
  does not inherit old caches, pending actions, or Guest recovery ownership.
- [x] AC-06: Keep already-anchored records classified as saved records during expiry; never treat them as disposable Guest data
  or overwrite them through a newly fabricated Guest promotion.
- [x] AC-07: Starting anew after authentication detaches active focus and preserves saved groups, identity, and locale. Confirm
  loss of unsaved input; an empty/no-unsaved-input reset remains smooth.
- [x] AC-08: Unsubscribe/coordinate duplicate Auth events, invalidate stale owner-specific reads, and serialize lifecycle
  changes with reset/promotion so old callbacks cannot revive a discarded session.
- [x] AC-09: Test fresh-load identity reuse, expiry before saving, expiry during a pending operation, external sign-out,
  same-owner reauthentication, different-owner rejection, and authenticated new-group flow.
- [x] AC-10: Provide truthful boundaries: this ticket does not add saved-history browsing, cross-device Guest transfer, general
  account switching, or authenticated workspace hydration after reload.

## Verification and prior art

Extend Auth/Gate/composition tests and browser journeys using the existing application seams. Use actual Supabase identity where
required to establish session behavior; do not add an engine bootstrap API.

## Dependencies and exclusions

Can proceed alongside 07 once 06 is done, subject to a single writer for overlapping Auth/composition modules. Registration
behavior need not be implemented to verify returning-user expiry.

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

### Solution Path

- AC-01: A coordinated SDK client/listener restores server-verified identity and reuses it at a real pending Gate.
- AC-02: Identity remains separate from Guest persistence. Authenticated focus markers suppress server-only pointers
  on reload; current Guest facts are persisted before removing classification, including failed-write recovery.
- AC-03: Public engine actions/constructors remain authoritative. Real promotion retains the authenticated provider;
  no private mode mutation, bootstrap or fabricated Guest promotion was added.
- AC-04: Owner/revision/generation admission pauses expired writes and resumes the specific pending call. Independent
  Gate reauthentication stays usable while the original save waits, without repeating completed side effects.
- AC-05: Different owners are rejected, stale reads invalidated and retained draft names hidden until same-owner
  verification. Reset generations invalidate old continuations and ownership cannot silently change.
- AC-06: Anchored records remain saved records. Ambiguous Timeline outcomes are never replayed or announced saved.
  Durable uncertainty records deny later completion of that exact session, including after detachment/reload.
- AC-07: Reset confirms local loss and preserves saved groups, identity and locale. Uncertain-focus detachment first
  retains owner-bound facts; cancellation and storage/cleanup failure preserve the active no-replay barrier.
- AC-08: SDK event deduplication, unsubscribe/remount handling, final admission and reset settlement prevent stale
  revival. Same-owner token refresh preserves active Player focus without an unnecessary credential interruption.
- AC-09: Deterministic, assembled UI, real Supabase and bilingual browser cases cover restored identity, expiry
  before/during saving, sign-out, same-owner reauthentication, different-owner rejection and new authenticated groups.
- AC-10: No history browsing, account switching, cross-device Guest transfer or authenticated workspace hydration.
  Reloaded staged drafts retain exact data for same-owner inspection; continuation of that old focus is unavailable.

### Architectural Decisions

The Event Manager approved owner-bound web staging after withdrawing the accidental blocker-only answer.
Only genuinely new unanswered groups stage as unsaved local work. The unchanged hosted schema rejects null answers
with PostgreSQL23502. Public GroupEngine methods create symptoms/ratings; the actual joint-treatment answer flushes
identical UUIDs/content through the unchanged authenticated saveGroup port. Partial-save and cleanup retries retain
work. Anchored groups never become disposable drafts. Engine, adapters and schema remain unchanged.

Full reload cannot publicly hydrate GroupEngine's symptom index or authenticated SessionEngine mode. Exact retained
envelopes are therefore owner-verified/read-only, with explicit discard confirmation. New Guest inquiry remains
honestly local until its real Gate. Focus metadata prevents authenticated pointers being mistaken for Guest data.

Ordinary authenticated Timeline append lacks a public receipt/idempotency contract for a lost response. A separate
owner/generation/session/event uncertainty record never authorizes replay or Guest promotion. Its active barrier
survives failed reset and clears only after successful cleanup/generation advancement; durable session guards remain.
New sessions can finish normally. No general receipt reconciliation, history UI or server deletion was introduced.
The web recovery validator now accepts canonical together/split_suggested instead of the invalid separate value.

### Verification

- npm run typecheck -w packages/pic-web: PASS.
- npx eslint packages/pic-web: PASS.
- npm run depcruise -w packages/pic-web: PASS;766modules/1670dependencies,zero violations.
- Final npm test -w packages/pic-web -- --maxWorkers=2: PASS;39files/347tests,70.38s on the final frozen runtime.
  Approved PIC_REGISTRATION_TEST_EMAIL supplied the synthetic project address. Actual signup, generated confirmation,
  own-profile bootstrap, linked/unlinked promotion and marker-owned cleanup passed with normal TLS.
- Focused four-file suite70/70; with unchanged Node source-cache2/2,72/72 across5files,7.25s.
- Live returning checkpoints5/5 passed13.99s and again in the final full suite: SDK restore/sign-out/reauthentication,
  raw23502, real Gate promotion, new staged group/symptom/rating with zero server rows before the real answer,
  exact-ID save afterward, linked Finish Timeline2/use_count2 and saved-group preservation after reset.
- From packages/pic-web, one npx playwright test command with returning-identity.browser.test.ts,
  persistence-gate.browser.test.ts, registration.browser.test.ts, player-reset.browser.test.ts and --workers=2:
  PASS;16/16,28.5s. Includes both locales and owner/keyboard/geometry checks for retained drafts at320x568.
- Independent final Standards0 / Spec0. Gate, uncertainty, reload and storage-failure findings were corrected and
  re-reviewed. Final diff/130-character checks passed;17runtime/test paths are strictly inside packages/pic-web.

Resumed fixes and storage-failure repairs have red-before-green evidence. One earlier partial-Finish reset case was
added after its mechanism; removing its guard failed the test, restoring it returned green. This is mutation
sensitivity, not historical test-first execution. Existing thresholds, retries, timeouts and TLS were retained.

An earlier sandbox run failed before discovery with39suites/0tests due Vite temporary-cache EPERM. The exact
escalated command passed. A pre-edge-fix full run passed346/346 in66.62s; final347/347 supersedes it. Historical
signup rate limits and the repaired Node import regression were failures, never skipped cases or final green claims.

### Deviations and carry-forward

- Generated links prove Auth confirmation and same-identity continuity, not mailbox delivery.
- Approved staging/read-only reload bounds are explicit; authenticated workspace hydration remains excluded.
- Full root/build/Chromium gates belong to W12-09. Physical keyboard/safe-area/zoom/Hebrew screen-reader evidence
  remains Pending Manual QA Verification under the user's explicit instruction.
- This closed Resolution is the authorized documentation exception. No engine, adapter, migration, schema, seed,
  root tooling, dependency/manifest or lockfile edits. All earlier Wave12 coverage remains required for final gates.
