# W12-04 execution brief

## Identity

- Ticket: W12-04 — Start anew from the Player and Persistence Gate
- Ticket specification: `.scratch/pic-tracer-bullet/issues/04-wave-12-player-and-gate-reset.md`
- Wave: 12. Dispatch authority covers all remaining Wave 12 tickets, 04 → 09 sequentially.
- Authorized for implementation after all declared blockers are closed and the preceding ticket is committed.
- Escalation: report concrete spec/contract conflicts to the orchestrator; do not widen scope.

## Permissions

Read-write: owned implementation/test modules inside `packages/pic-web` and this ticket's Resolution.
Extend 03's coordinator into Player utilities and the existing Gate discard path. Own pending-Finish/reset interaction and
related web tests; real credential forms belong to 05.
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

> Do not equate overlay dismissal, switching
> register/login forms, or opening email with the Event Manager's explicit choice to discard.

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

- Seam: Player/Gate → reset coordinator.
- Owns: Player and Gate reset integration.
- Consumer/downstream: 05 Auth.
- Risk to verify: No Finish side effects on reset; one focus owner.
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
   code-review and commits verified work with `[W12-04]`. Do not commit or dispatch another implementation yourself.
7. If sandbox infrastructure blocks a test, report the exact failure promptly; do not bypass TLS, skip tests,
   or alter application behavior to accommodate the harness.

## Acceptance Criteria (checklist)

- [ ] AC-01: Expose the shared new-group action from the Player and route the Gate's explicit continue-without-saving/decline
  action through the shared confirmation flow.
- [ ] AC-02: Cancel preserves the active session/unit, terminal answer, pending Finish or Finish Anyway kind, and existing
  input; canceling a Gate discard confirmation returns to that Gate with its draft intact.
- [ ] AC-03: Escape, outside dismissal, and ordinary overlay closure never silently discard Guest state. Maintain one modal
  focus owner and meaningful focus restoration.
- [ ] AC-04: Confirmed discard clears the pending gate through existing public SessionEngine behavior and fully resets web
  pointers/flags before final Guest cleanup; refresh does not reopen a stale Player or Gate.
- [ ] AC-05: Retain anchored groups and Player records on reset. Detaching focus does not declare success, mutate preserved
  unit states, increment use counts, or manufacture a therapeutic failure.
- [ ] AC-06: Serialize reset with current Player writes and promotion operations; re-evaluate ownership after an operation
  settles. Stale callbacks cannot finish or promote the reset inquiry.
- [ ] AC-07: On failed cleanup or pending write, keep sufficient local state for retry and present calm localized feedback
  without announcing a completed reset.
- [ ] AC-08: Exercise linked and unlinked Players, terminal Yes/No, Finish Anyway, and pending Gate cases in both directions.
  Confirmation and success announcements remain keyboard/screen-reader accessible.

