# W12-06 execution brief

## Identity

- Ticket: W12-06 — Recover interrupted promotion without loss or duplicate success
- Ticket specification: `.scratch/pic-tracer-bullet/issues/06-wave-12-promotion-recovery-and-idempotency.md`
- Wave: 12. Dispatch authority covers all remaining Wave 12 tickets, 04 → 09 sequentially.
- Authorized for implementation after all declared blockers are closed and the preceding ticket is committed.
- Escalation: report concrete spec/contract conflicts to the orchestrator; do not widen scope.

## Permissions

Read-write: owned implementation/test modules inside `packages/pic-web` and this ticket's Resolution.
Own web promotion serialization, recovery envelope, cleanup ordering, and fault recovery through existing public contracts.
Atomic transactions, normalization, idempotency rules, and Finish semantics remain owned by the unchanged engine/adapter/RPC.
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

> If the RPC committed but the response was lost, retry its exact payload/key.

Read the full approved `docs/specs/wave-12-spec.md` section cited in the ticket before implementation.
Prior tracer-bullet/skill paths are historical references, not replacements for this Wave 12 specification.

## Glossary injection

> **Event Manager**:
> The user's role: active director of their own healing, not a passive patient or generic end-user.

> **Atomic Focus**:
> One muscle-test question at a time; small sequential steps in the Player.

Read relevant DEC entries in the approved spec's references when a therapeutic invariant is involved.
Canonical identifiers remain unchanged; the approved Wave 12 UI terminology takes precedence for presentation.

## Seam map excerpt

- Seam: Promotion → completion → cleanup.
- Owns: web recovery envelope and retry.
- Consumer/downstream: 07 and 08.
- Risk to verify: Committed-but-lost response must reuse exact payload/key.
- Full map: `docs/audits/wave-12-seam-map.md`.

## Execution contract

1. Apply `C:/Users/benda/.agents/skills/implement/SKILL.md`; use its TDD workflow at these existing seams.
2. Make one complete verifiable slice. Preserve prior-ticket changes; this is a shared checkout with serialized writers.
3. Run scoped typecheck, scoped web tests, depcruise, relevant browser tests, and lint. Do not weaken baseline coverage.
   Root-cwd commands: `npm run typecheck -w packages/pic-web`, `npm test -w packages/pic-web`,
   `npm run depcruise -w packages/pic-web`. Browser tests run from the web workspace with two workers.
4. Keep every new/changed line within the repository's 130-character limit; do not add dependencies or change lockfiles.
5. Report AC-by-AC evidence and update Resolution. Leave status pending closure until orchestrator verifies.
6. Ask orchestrator for the review fixed point after implementation; the orchestrator conducts the two-axis
   code-review and commits verified work with `[W12-06]`. Do not commit or dispatch another implementation yourself.
7. If sandbox infrastructure blocks a test, report the exact failure promptly; do not bypass TLS, skip tests,
   or alter application behavior to accommodate the harness.

## Acceptance Criteria (checklist)

- [ ] AC-01: Freeze the exact Guest snapshot and stable idempotency key for one operation, bound to verified owner and flow
  generation; repeated clicks/callbacks reuse the operation and cannot change its payload.
- [ ] AC-02: Retain a web-owned recovery envelope containing snapshot, owner, pending Finish kind, and generation through
  interruption/reload, without credentials. Storage failure before safe recovery preparation must not silently discard the
  only draft.
- [ ] AC-03: Defer web-owned Guest cleanup until promotion and required completion reconciliation settle; remove the current
  early cleanup behavior without modifying SessionEngine internals.
- [ ] AC-04: RPC rejection restores the appropriate prior provider and keeps local recovery data. Retry under the same valid
  identity does not require another password submission.
- [ ] AC-05: A committed RPC with a lost response is retried with identical key/payload; it produces one row-set and one use
  increment. Never infer that an uncertain response means nothing was saved.
- [ ] AC-06: A post-promotion completion failure reconciles through existing idempotent public completion contracts without a
  second success effect; the UI reports pending/recovery until completion is known.
- [ ] AC-07: Refresh restores enough pending intent to recover for the same owner; stale callbacks after reset and callbacks
  for another owner cannot claim, delete, or promote the old snapshot.
- [ ] AC-08: Delete Guest/recovery residue only after confirmed completion or explicit applicable local discard. Discard
  never deletes already-anchored server data or lets flow persistence recreate the cleared Guest blob.
- [ ] AC-09: Reset and therapeutic writes cannot race the provider swap/recovery. Canceling a discard retains the operation
  and draft, and no false saved or reset-success announcement is emitted.
- [ ] AC-10: Prove the matrix: duplicate submission, pre-RPC rejection, RPC rejection, lost committed response, post-RPC
  completion failure, cleanup failure, reload, and owner/generation mismatch, for linked and unlinked sessions where
  applicable.


## Resume checkpoint after verified W12-05

Start from e88f19e4cd3dcc716195a26b61cf88a725fbee13; W12-04 and05 are complete and committed.
Read .scratch/pic-tracer-bullet/wave-12-status.md for exact gate evidence and quota checkpoint.
W12-05 established lazy SDK Auth, verified owner/profile bootstrap, immutable in-memory retry request,
exclusive web write admission, and real linked/unlinked promotion evidence. Reuse these seams.
Durable recovery, lost response, post-promotion completion reconciliation, and early-cleanup correction remain06.
No06 implementation has been dispatched or stashed. User authorizes sequential continuation through09 when quota permits.
