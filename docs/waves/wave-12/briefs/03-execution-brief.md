# W12-03 execution brief

## Identity

- Ticket: W12-03 — Start a new Symptom Group during creation and inquiry
- Ticket specification: `docs/waves/wave-12/tickets/drafts/03-wave-12-inquiry-session-reset.md`
- Wave: 12. Dispatch authority for this run covers 01 → 02 → 03 sequentially only.
- Authorized frontier ticket; wait for previous ticket verification and commit.
- Escalation: report concrete spec/contract conflicts to the orchestrator; do not widen scope.

## Permissions

Read-write: owned implementation/test modules inside `packages/pic-web` and this ticket's Resolution.
Own the common utility reset action, web reset coordinator, draft-dirty reporting, flow generation/facts, and non-Player
inquiry integration. Necessary small prefactoring belongs in this working slice; Player and Gate integration is 04.
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

> A fresh group is created through
> GroupEngine only when the Event Manager submits the new name; reset itself creates no empty persisted group.

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

- Seam: Sheet → reset coordinator → flow facts.
- Owns: non-Player reset and web composition/draft lifecycle.
- Consumer/downstream: 04 Player/Gate reset.
- Risk to verify: Wait for writes, suppress stale reads, clear storage last; preserve recoverable draft on failure.
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
   code-review and commits verified work with `[W12-03]`. Do not commit or dispatch another implementation yourself.
7. If sandbox infrastructure blocks a test, report the exact failure promptly; do not bypass TLS, skip tests,
   or alter application behavior to accommodate the harness.

## Acceptance Criteria (checklist)

- [ ] AC-01: Expose קבוצת סימפטומים חדשה / New symptom group in the common Utility Drawer on group creation, symptom
  addition/rating, joint treatment, summary, and treatment selection; add no third direct main-frame choice.
- [ ] AC-02: An empty initial screen resets without prompting. Typed group text before an ID exists, unsaved symptom/rating
  input, and unanchored Guest records require confirmation; active-ID presence alone is not the dirty predicate.
- [ ] AC-03: Confirmation offers keeping the inquiry or discarding its local draft and starting new. Cancel, Escape, and
  outside dismissal preserve exact inputs, screen, records, and rating visibility.
- [ ] AC-04: Confirmed reset clears active group/player pointers, addition/finalization/summary flags, local draft/recovery
  state, and reveal overrides in one visible transition to a clean creation screen, even if the current screen is already
  creation.
- [ ] AC-05: Settle outstanding writes before cleanup and invalidate stale callbacks with a web-owned flow generation; a
  delayed create/add/rate/load cannot reopen or recreate the discarded inquiry.
- [ ] AC-06: Clear owned Guest storage after flow setters have finished writing. Storage or pending-write failure retains
  recoverable work and presents localized retry, without a false success announcement or global browser-storage clear.
- [ ] AC-07: Reset detaches focus without deleting/archiving/renaming saved groups or invoking Finish, Finish Anyway,
  sign-out, or use-count changes. Locale/identity providers remain mounted and existing preferences remain intact.
- [ ] AC-08: Use controlled Sheet confirmation without stacked focus traps; initial focus favors keeping work, cancel
  restores the trigger, and success closes the Sheet and focuses/announces the initial heading or name field in both locales.
- [ ] AC-09: Introduce a production action through existing web contexts/composition, not a test-reset helper or
  engine-internal mutation. New group creation still uses the public GroupEngine contract after the next name submission.
