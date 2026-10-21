# W12-09 execution brief

## Identity

- Ticket: W12-09 — Verify the complete bilingual Wave 12 journey and quality gates
- Ticket specification: `docs/waves/wave-12/tickets/drafts/09-wave-12-e2e-journey-and-quality-gates.md`
- Wave: 12. Dispatch authority covers all remaining Wave 12 tickets, 04 → 09 sequentially.
- Authorized for implementation after all declared blockers are closed and the preceding ticket is committed.
- Escalation: report concrete spec/contract conflicts to the orchestrator; do not widen scope.

## Permissions

Read-write: owned implementation/test modules inside `packages/pic-web` and this ticket's Resolution.
Own the assembled web E2E journey, cross-feature regression cases, scoped web fixes required by those cases, and quality
evidence in this ticket. Feature owners' established seams remain authoritative.
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

> Preserve all existing behavioral coverage and add Wave 12 cases.

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

- Seam: App → end-to-end evidence.
- Owns: assembled web journeys and quality evidence.
- Consumer/downstream: wave closure.
- Risk to verify: Required remote/manual evidence cannot be silently skipped.
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
   code-review and commits verified work with `[W12-09]`. Do not commit or dispatch another implementation yourself.
7. If sandbox infrastructure blocks a test, report the exact failure promptly; do not bypass TLS, skip tests,
   or alter application behavior to accommodate the harness.

## Acceptance Criteria (checklist)

- [ ] AC-01: Run an assembled journey through reset, fresh inquiry, Player/Terminal, registration, verification, promotion,
  and a subsequent inquiry using official tokens and explicit Hebrew terminology. Also cover returning-user login.
- [ ] AC-02: Assert preserved group/session identities, symptom ratings, unit progress, terminal answer, pending Finish kind,
  and exactly one intended timeline/use increment; cover linked and unlinked promotion and Finish Anyway.
- [ ] AC-03: Exercise locale changes during drafts, Player, Gate, verification, and recovery; custom alias changes remain
  presentation-only and alias/provider state survives reset without a production alias editor.
- [ ] AC-04: Exercise cancel/confirm reset, promotion/reset races, delayed callbacks, interrupted promotion/reload, and
  restored/expired identity across the actual assembled seams. Saved groups remain intact.
- [ ] AC-05: Verify both locales at 320x568, 390x844, 768x1024, and 1440x900 CSS pixels: 100dvh main frame, internal
  overflow, at most two direct main choices, keyboard focus/traps/restoration, reduced motion, and accessible names.
- [ ] AC-06: Validate computed contrast on final default/hover/pressed/selected/recovery/focus surfaces. Preserve
  blind-by-default ratings, sovereign Finish Anyway, and non-judgmental Integrating language.
- [ ] AC-07: Retain offline Guest inquiry once required assets are available; network-dependent auth/recovery reports
  truthful availability without losing local work.
- [ ] AC-08: Run root npm run typecheck, npm run lint, and npm test including all-workspace dependency checks; run web npm
  test, npm run depcruise, npm run build, and npx playwright test --workers=2.
- [ ] AC-09: Preserve all coverage represented by the historical 442 root unit/integration tests and 161 Chromium Playwright
  cases, adding Wave 12 tests. Update intentional text/token/stub expectations only; no skipped failures, weaker thresholds,
  or increased retries.
- [ ] AC-10: Record real signup/login, email-confirmation, own-profile RLS/bootstrap, and promotion evidence with isolated
  fixtures and cleanup. Mocks alone do not satisfy release; retain TLS verification and protect credentials.
- [ ] AC-11: Record manual mobile keyboard/visual viewport, physical safe-area, zoom, and Hebrew screen-reader checks;
  distinguish completed checks from unavailable evidence and do not claim Chromium proves them.
- [ ] AC-12: Audit the complete implementation diff for web-only changes and zero dependency violations. Record a read-only
  cross-boundary duplication review; any permitted fix stays within web.
- [ ] AC-13: Record gate commands, results, counts, environment limitations, and unresolved blockers in Resolution. Close
  only when required gates pass; an unavailable required remote/manual check remains explicitly unverified.


## Manual evidence preparation

The parent prepared docs/waves/wave-12/archive/manual-release-checklist.md from09 AC-11.
The user's explicit manual-QA instruction below resolves availability; do not re-ask for devices or manual evidence.
User approved Supabase-generated links as07's isolated verification facility; that does not prove SMTP delivery.
Full442/161 historical coverage plus all new cases remains required; no final completion claim with unverified required gates.

## Event Manager manual-QA instruction (2026-10-15)

No physical device/native screen reader is available. The user explicitly instructed completing automated
Playwright E2E and ARIA accessibility-tree checks in Chromium, and recording physical-device keyboard, safe-area,
zoom and Hebrew screen-reader checks as "Pending Manual QA Verification" in docs/waves/wave-12/handoffs/wave-12-handoff.md,
following the established Wave11 handoff pattern. This supersedes the earlier requirement to block automated09
closure for unavailable manual evidence. Never claim those physical/manual checks passed or were proved by Chromium.

Wave11 handoff source located and read: docs/waves/wave-11/handoffs/wave-11-handoff.md, especially Boundaries and carry-forward.
Follow its explicit distinction between automated evidence and unverified manual QA; final Wave12 output remains
docs/waves/wave-12/handoffs/wave-12-handoff.md as requested. No further manual-device approval/question is needed.

## Shared hosted signup quota

Two successful live signup runs were followed by project email-send limits on both approved addresses. Do not
consume available sends with extra preflight signup probes. Required root npm test and scoped web npm test each
include the real registration case, so both full commands must still run and pass. Sequence other audits, build,
ARIA/browser checks and reviews between them when useful. If quota blocks a required run, preserve truthful evidence
and retry only after an actual cooldown/state change; never skip the case, weaken retries, change hosted settings,
or claim unavailable evidence green. Pass PIC_REGISTRATION_TEST_EMAIL through the test process environment.

## Root command worker control

The root test script is `vitest run && npm run depcruise --workspaces --if-present`.
Do not append --maxWorkers to npm test at root: npm would attach it to the final dependency-check command.
The installed Vitest4.1.10 implementation reads processenv VITEST_MAX_WORKERS (verified in its local dist source).
Set VITEST_MAX_WORKERS=2 and the approved PIC_REGISTRATION_TEST_EMAIL in the process, then run exact npm test.
This preserves root tooling and all tests/thresholds while keeping the established worker limit.
Full Vitest and Chromium remain sequential, including any parent verification runs.

## Verified dispatch base and final evidence targets

W12-08 committedbf1ecf26848aa9ca0eeeeda255c00d4c11079295; parent verified clean working tree.
All declared blockers01/02/07/08 and their transitive dependencies are closed. Do not apply old WIP stashes.
Current web baseline347unit tests/39files; focused08 Chromium16passed. Full historical root442/browser161 coverage
must be preserved together with all Wave12 additions. Root/build/full Chromium final gates are not yet executed.

Inspect existing coverage before adding cases. bilingual-guest-flow.browser.test.ts already covers both locales
at all4viewports, offline assets, frame geometry, language round trips and Terminal behavior; palette-contrast.ts
measures real computed surfaces. Other existing reset/registration/recovery/identity unit/browser suites cover
their owned matrices. Reuse those meaningful seams and cite their exact evidence; avoid duplicating entire suites.
Add the missing assembled successful Auth journey, subsequent inquiry, alias/locale continuity, and explicit ARIA
tree assertions. Browser transport mocks may support deterministic UI cases, but cannot replace actual remote
signup/confirmation/profile/promotion evidence. Do not stub success actions to skip the real application pipeline.

Two actual signup sends passed during08 at13:46UTC and13:51UTC. Avoid signup probes/repeated premature full runs;
sequence implementation, focused browser checks, reviews, build and audits before final required full commands.
If hosted quota blocks a required command, retain its failure and retry only after real cooldown/state change.
No new test skips/retries/weaker contrast/default assertion timeouts or disabled TLS are permitted.

Parent owns independent two-axis review, tracked closed record, final handoff and atomic commit/status.
Agent owns web implementation/tests and active09 Resolution with an explicit AC-to-test/evidence map.
Freeze tests/runtime for review while running final gates; do not commit or dispatch other agents.

## Final verification resume — 2026-10-18

User explicitly requested finishing09 and the final handoff. Parent verified clean08 basebf1ecf2 and applied
stash5b8bc6d9dc30355b98868f85226a5b48bde82490 without conflicts. Six reviewed web test paths are restored.
Both original and narrow Standards/Spec reviews returned0; corrections remain to be executed, not redesigned.
Run corrected20cases then full179Chromium with2workers using the established escalated host runner.
No parent heavy tests run concurrently. Report exact exit/count/duration, then root typecheck/lint, scopeddepc/build
as coordinated; parent owns final root/scoped remote test commands, documents and commits.
Keep runtime/tests frozen unless a concrete gate failure requires a bounded web-only correction and re-review.
All prior user approvals remain authoritative; do not re-ask about staging, controlled email, or manual device QA.
Quota refreshed0%/0%; last signup attempts were3days earlier, no signup probes are necessary before required runs.
