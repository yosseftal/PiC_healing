# W12-08 execution brief

## Identity

- Ticket: W12-08 — Restore identity and handle expiry without losing work
- Ticket specification: `docs/waves/wave-12/tickets/drafts/08-wave-12-restored-identity-and-expiry.md`
- Wave: 12. Dispatch authority covers all remaining Wave 12 tickets, 04 → 09 sequentially.
- Authorized for implementation after all declared blockers are closed and the preceding ticket is committed.
- Escalation: report concrete spec/contract conflicts to the orchestrator; do not widen scope.

## Permissions

Read-write: owned implementation/test modules inside `packages/pic-web` and this ticket's Resolution.
Own the web Auth lifecycle, owner-scoped cache/request handling, reauthentication presentation, and integration with existing
reset and promotion actions. Engine bootstrap and authenticated workspace hydration are outside scope.
Read-only: approved Wave 12 spec, CONTEXT.md, decisions.md, CLAUDE.md, public engine/adapter contracts,
and sibling tickets. Orchestrator owns seam map, handoff, tracking documents, and final commits.
- Implementation and tests: 100% inside `packages/pic-web`. This active ticket's Resolution is the documentation exception.
- Zero edits to `packages/pic-engine`, either adapter package or their tests, database migrations, backend schemas,
  RPC definitions, seeds, root tooling, manifests, or lockfiles. Read public contracts; call them unchanged.
- Adapter access stays in the existing web composition root/promote boundary; screens use contexts/actions.
- Preserve Dumb Reflection, Event Manager sovereignty, blind ratings, at most two direct main-frame choices,
  WCAG AA in RTL/LTR, and the approved scope exclusions.
- Treat the Wave 12 spec as frozen. Report an unmet public-contract dependency rather than widening this ticket.

## Frozen requirements (verbatim)

> Supabase identity can be restored independently of therapeutic
> SessionEngine mode.

Read the full approved `docs/waves/wave-12/specs/wave-12-spec.md` section cited in the ticket before implementation.
Prior tracer-bullet/skill paths are historical references, not replacements for this Wave 12 specification.

## Glossary injection

> **Event Manager**:
> The user's role: active director of their own healing, not a passive patient or generic end-user.

> **Atomic Focus**:
> One muscle-test question at a time; small sequential steps in the Player.

Read relevant DEC entries in the approved spec's references when a therapeutic invariant is involved.
Canonical identifiers remain unchanged; the approved Wave 12 UI terminology takes precedence for presentation.

## Seam map excerpt

- Seam: Restored identity → writes.
- Owns: web auth lifecycle and owner caches.
- Consumer/downstream: 09 assembled journey.
- Risk to verify: Engine has no authenticated-bootstrap setter; preserve scope limits.
- Full map: `docs/waves/wave-12/audits/wave-12-seam-map.md`.

## Execution contract

1. Apply `C:/Users/benda/.agents/skills/implement/SKILL.md`; use its TDD workflow at these existing seams.
2. Make one complete verifiable slice. Preserve prior-ticket changes; this is a shared checkout with serialized writers.
3. Run scoped typecheck, scoped web tests, depcruise, relevant browser tests, and lint. Do not weaken baseline coverage.
   Root-cwd commands: `npm run typecheck -w packages/pic-web`, `npm test -w packages/pic-web`,
   `npm run depcruise -w packages/pic-web`. Browser tests run from the web workspace with two workers.
4. Keep every new/changed line within the repository's 130-character limit; do not add dependencies or change lockfiles.
5. Report AC-by-AC evidence and update Resolution. Leave status pending closure until orchestrator verifies.
6. Ask orchestrator for the review fixed point after implementation; the orchestrator conducts the two-axis
   code-review and commits verified work with `[W12-08]`. Do not commit or dispatch another implementation yourself.
7. If sandbox infrastructure blocks a test, report the exact failure promptly; do not bypass TLS, skip tests,
   or alter application behavior to accommodate the harness.

## Acceptance Criteria (checklist)

- [ ] AC-01: Restore the SDK's persisted identity using one coordinated web client/listener lifecycle; at a real pending gate
  reuse a valid verified identity without asking for credentials again.
- [ ] AC-02: After a fresh load, a new unanchored inquiry may remain in local Guest storage until its real gate. Reflect
  identity separately from persistence and never label local work as already saved.
- [ ] AC-03: Do not mutate private SessionEngine mode or fabricate a promotion for login. Successful promotion in the current
  runtime retains the authenticated provider for subsequent work.
- [ ] AC-04: Detect session expiry or external sign-out and stop authenticated writes before retry. Present localized
  reauthentication while preserving pending intent and recoverable drafts.
- [ ] AC-05: Resume a pending write or promotion only for its verified owner using existing public contracts. A different
  user does not inherit old caches, pending actions, or Guest recovery ownership.
- [ ] AC-06: Keep already-anchored records classified as saved records during expiry; never treat them as disposable Guest
  data or overwrite them through a newly fabricated Guest promotion.
- [ ] AC-07: Starting anew after authentication detaches active focus and preserves saved groups, identity, and locale.
  Confirm loss of unsaved input; an empty/no-unsaved-input reset remains smooth.
- [ ] AC-08: Unsubscribe/coordinate duplicate Auth events, invalidate stale owner-specific reads, and serialize lifecycle
  changes with reset/promotion so old callbacks cannot revive a discarded session.
- [ ] AC-09: Test fresh-load identity reuse, expiry before saving, expiry during a pending operation, external sign-out,
  same-owner reauthentication, different-owner rejection, and authenticated new-group flow.
- [ ] AC-10: Provide truthful boundaries: this ticket does not add saved-history browsing, cross-device Guest transfer,
  general account switching, or authenticated workspace hydration after reload.

## Verified dispatch base and Auth evidence

W12-07 committed 05bad952703626cb5bbb2d42682848c4c8adb66d; working tree clean.
Reuse its signup/verification context and 06 exact frozen promotion recovery coordinator; no alternate save path.
Signup response IDs are untrusted; server-verified same-email getUser establishes owner. Pending metadata and
frozen work survive reload/storage failure without tokens/passwords. Preserve these regressions.
Real signup passed twice, including the 319-test full web suite. A test-only cleanup error-preservation change
then passed local gates and reviews; repeated actual signup subsequently hit email quota on both approved addresses.
Those repetitions are recorded as failed, not green. Full 08/09 gates must verify signup again when quota permits.
User-approved addresses: test-e2e@pic-healing.com or automated-test@pic-healing.com; process environment
PIC_REGISTRATION_TEST_EMAIL is required for the full web/root real registration test. Avoid repeated early signup
probes; retry required full gates after implementation. No skips, weaker retries/timeouts, or hosted changes.
Browser runners and full Vitest must run sequentially; use unit maxWorkers=2 and browser workers=2.

### Known seam risk

Authenticated Finish is a public operation with multiple writes. Do not blindly replay a partly completed Finish
or fabricate a Guest promotion after expiry. Use existing public contracts with owner-bound web admission/recovery.
If genuine uncertainty cannot be reconciled, report the exact contract instead of editing engine/backend code.
Use one SDK client/listener lifecycle. Identity stays separate from SessionEngine mode; saved records remain anchored.

## Orchestrator seam clarification during dispatch

The agent confirmed authenticated Finish calls recordUse(session.id), then non-idempotent Timeline append,
then savePlayerSession(success_declared). Do not replay that entire operation after a partial write.
Approved spec lines 290-293 require stopping authenticated writes on expiry/sign-out, verified reauthentication,
preserving anchored classification, and separating owner caches. Existing public contracts permit pausing the
specific repository-call continuation and resuming it only for the same verified owner and valid generation.
A confirmed Auth rejection may retry the exact call. An ambiguous lost append response has no public receipt/read
contract: retain a truthful uncertain state and never blindly replay it or announce Saved. Record that precise
limitation instead of inventing general authenticated transaction recovery or editing engine/adapters.
Required normal expiry cases still need red/green evidence: preserve completed writes, no duplicate Timeline,
reset and owner-change cancellation without deadlock, and no stale continuation or fabricated Guest promotion.

## Event Manager approval: authenticated draft staging (2026-10-15)

The user withdrew the accidental blocker-only response, reviewed the standalone question, and explicitly approved
owner-bound web draft staging. The approved design is docs/waves/wave-12/archive/authenticated-draft-seam-decision.md.
Only new unanswered groups may stage as unsaved local work under owner/generation. Retain authenticated provider
and engine mode, use existing GroupEngine/public port contracts, save the exact group after its real answer,
and preserve reset/expiry/partial-save/cleanup/reload safeguards. No fake answers or backend/schema/core changes.
Actual SQL23502 remains the direct-adapter contract test; add real successful staged new-group evidence.

## Reload boundary clarification after approval

GroupEngine's private symptom index cannot hydrate existing staged symptom IDs after reload through public APIs;
SessionEngine also starts honestly Guest. Per08 AC10, general authenticated workspace hydration is excluded.
Supported same-runtime staging must work fully. On full reload retain the exact unsaved envelope, expose only to
its same server-verified owner, and use an honest read-only/limited-resume notice. Do not flush an old authenticated
staged group while the engine is Guest, fabricate mode, silently re-key symptoms, or overwrite a retained envelope.
Discard/new-start must confirm local loss; cancellation retains the draft. Record the precise hydration dependency.

## Resume dispatch — 2026-10-15

User explicitly requested applying stashac51f52 and finishing08 then09. Parent verified clean07 base
05bad952703626cb5bbb2d42682848c4c8adb66d and applied ac51f52dd23fbeb5589be1117b663a3ffa965db4 successfully.
All15 restored web paths are unverified WIP; retain both safety stashes until verified closure.
Primary quota refreshed to1%, weekly16%; continue continuously with lossless per-ticket checkpoints.

Read docs/waves/wave-12/archive/08-review-checkpoint.md and this ticket's existing detailed Resolution before editing.
Resolve the three accepted review findings with focused red/green evidence:

1. Separate reauth submission state/ref from the original suspended Gate save, allowing same-dialog same-owner
   credentials to resume exactly that pending operation. Never rerun completed Finish/Timeline/use-count work.
2. Permit explicit informed focus detachment after uncertain Timeline append only after durable owner-bound
   uncertainty facts are preserved. No replay/Saved claim/server deletion; cancellation retains; storage failure
   prevents detachment; old active partial markers must not affect a new focus. No general receipt reconciliation.
3. Mark subsequent authenticated group/Player focus before publishing or persisting pointers so reload cannot
   restore server-only IDs through Guest storage. Keep the approved read-only staging/hydration boundary.

Run focused regressions (prior65unit/16Chromium coverage preserved), real returning identity checks, full scoped
web test, typecheck, lint and depcruise. Keep heavy Vitest/browser runners sequential with2workers. Use processenv
PIC_REGISTRATION_TEST_EMAIL for an approved address. Signup email quota must pass, not be skipped or waived.
Freeze implementation/tests for parent independent two-axis re-review before atomic08 commit. Parent owns
closed-ticket record, commit and status checkpoint. Do not start09 or commit independently.
