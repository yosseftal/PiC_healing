# 09: Verify the complete bilingual Wave 12 journey and quality gates

**Ticket ID:** W12-09

**Wave:** 12

**Status:** done

**What to build:** The assembled application proves the complete new-inquiry, authentication, save, and subsequent-inquiry journey
in both languages, with recorded regression and boundary evidence.

**Blocked by:** W12-01 — Official brand palette and accessible inquiry surfaces; W12-02 — Explicit Hebrew terminology and dynamic
NEMAR alias; W12-07 — Register and verify email while preserving the Guest inquiry; W12-08 — Restore identity and handle expiry
without losing work.

**Source:** [Approved Wave 12 specification][relocation-link-1], Testing Decisions and Quality Gates; High-Level Work Plan phase
5; all User Stories.
The nine-ticket breakdown and dependencies were approved without changes on 2026-10-13.

## Context Injection (verbatim)

> Preserve all existing behavioral coverage and add Wave 12 cases.

## Owned vertical slice

Own the assembled web E2E journey, cross-feature regression cases, scoped web fixes required by those cases, and quality evidence
in this ticket. Feature owners' established seams remain authoritative.

## Acceptance criteria

- [x]  AC-01: Run an assembled journey through reset, fresh inquiry, Player/Terminal, registration, verification, promotion, and a
      subsequent inquiry using official tokens and explicit Hebrew terminology. Also cover returning-user login.
- [x]  AC-02: Assert preserved group/session identities, symptom ratings, unit progress, terminal answer, pending Finish kind, and
      exactly one intended timeline/use increment; cover linked and unlinked promotion and Finish Anyway.
- [x]  AC-03: Exercise locale changes during drafts, Player, Gate, verification, and recovery; custom alias changes remain
      presentation-only and alias/provider state survives reset without a production alias editor.
- [x]  AC-04: Exercise cancel/confirm reset, promotion/reset races, delayed callbacks, interrupted promotion/reload, and
      restored/expired identity across the actual assembled seams. Saved groups remain intact.
- [x]  AC-05: Verify both locales at 320x568, 390x844, 768x1024, and 1440x900 CSS pixels: 100dvh main frame, internal overflow, at
      most two direct main choices, keyboard focus/traps/restoration, reduced motion, and accessible names.
- [x]  AC-06: Validate computed contrast on final default/hover/pressed/selected/recovery/focus surfaces. Preserve
      blind-by-default ratings, sovereign Finish Anyway, and non-judgmental Integrating language.
- [x]  AC-07: Retain offline Guest inquiry once required assets are available; network-dependent auth/recovery reports truthful
      availability without losing local work.
- [x]  AC-08: Run root npm run typecheck, npm run lint, and npm test including all-workspace dependency checks; run web npm test,
      npm run depcruise, npm run build, and npx playwright test --workers=2.
- [x]  AC-09: Preserve all coverage represented by the historical 442 root unit/integration tests and 161 Chromium Playwright
      cases, adding Wave 12 tests. Update intentional text/token/stub expectations only; no skipped failures, weaker thresholds,
      or increased retries.
- [x]  AC-10: Record real signup/login, email-confirmation, own-profile RLS/bootstrap, and promotion evidence with isolated
      fixtures and cleanup. Mocks alone do not satisfy release; retain TLS verification and protect credentials.
- [x]  AC-11: Record manual mobile keyboard/visual viewport, physical safe-area, zoom, and Hebrew screen-reader checks;
      distinguish completed checks from unavailable evidence and do not claim Chromium proves them.
- [x]  AC-12: Audit the complete implementation diff for web-only changes and zero dependency violations. Record a read-only
      cross-boundary duplication review; any permitted fix stays within web.
- [x]  AC-13: Record gate commands, results, counts, environment limitations, and unresolved blockers in Resolution. Close only
      when required gates pass; an unavailable required remote/manual check remains explicitly unverified.

## Verification and prior art

Use the inherited browser matrix and actual application providers. This ticket integrates and validates earlier vertical slices
rather than deferring their own acceptance tests until the end.

## Dependencies and exclusions

The transitive closure of 01, 02, 07, and 08 includes all nine tickets. This ticket adds no dependency upgrades or new backend
capabilities. Manual/device and remote environment access are prerequisites, not authorization to weaken checks.

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

Implementation base: `bf1ecf26848aa9ca0eeeeda255c00d4c11079295` (closed W12-08, clean checkout).
Preserved all existing cases; added four assembled Chromium journeys in
`packages/pic-web/tests/wave12-journey.browser.test.ts`, with `wave12-journey.fixture.html`,
`wave12-journey.fixture.tsx`, and `wave12-transport.ts` in the same directory. No production changes were required.
Updated two inherited browser expectations in `bilingual-guest-flow.browser.test.ts` and
`localized-player.browser.test.ts` for the actual modal accessibility and pending-Gate reload lifecycle.
The fixture composes the actual providers, Guest shell and router. Only HTTP responses and presentation setters
are controlled; real UI actions invoke the actual composition root, Auth SDK, engines and Supabase adapter.

AC evidence map (paths below are relative to `packages/pic-web`):

- AC-01: New `tests/wave12-journey.browser.test.ts`, both locales and both linking choices, performs typed-draft
  cancel/confirm reset, fresh group/symptom/rating/joint test/summary, Player navigation, Terminal, Gate, registration
  with pending verification or returning login, promotion, and a subsequent authenticated inquiry. Linked cases
  include an unconfirmed-login rejection before the confirmation response. These are deterministic HTTP cases;
  actual isolated Auth/confirmation evidence is separately retained under AC-10.
- AC-02: The same four cases compare the initial group/symptom UUIDs and positive intensity8 rating with the actual
  RPC payload; compare the complete Player session, progress states, Terminal Yes/No and persisted pending
  `finish`/`finishAnyway`; verify one timeline row and one use count after completion and a subsequent group save.
  Unlinked sessions send no group/symptoms. Existing `src/registration.remote.test.ts` covers real linked/unlinked
  preservation and one increment per run; `src/returning-identity.remote.test.ts` covers a second authenticated Finish.
- AC-03: New journeys change locale during typed name, Player, Gate, verification and recovery without changing the
  Guest snapshot. Alias setters use the existing LocaleProvider API and TerminologyFixture, with no production
  editor. Tests observe escaped literal alias text in the Player ARIA tree, official Hebrew `נכון ומדויק`, canonical
  unchanged payloads, and alias survival after authenticated reset. Existing `src/i18n/messages.test.tsx`,
  `src/i18n/core-messages.test.ts`, and `src/i18n/locale-provider.test.tsx` cover blanks, fallback and typed interpolation.
- AC-04: New journeys prove cancel/confirm reset and saved-group preservation. `src/inquiry-reset.test.tsx` covers
  stale callbacks, delayed creation, add/rate chains, delayed parsing/startSession and failed cleanup;
  `src/player-reset.test.tsx` covers both locales, linked/unlinked and Yes/No across actual composition seams.
  `src/promotion-recovery.test.ts` covers lost committed responses after reload, rejected durable preparation,
  owner/generation mismatch, duplicate operations and post-RPC cleanup interruption. `src/returning-identity.test.ts`
  covers restored/expired identity, suspended writes, queued sign-out, partial Finish and owner-bound staged reload.
- AC-05: Existing `tests/bilingual-guest-flow.browser.test.ts` retains its eight locale/viewport cases at 320x568,
  390x844, 768x1024 and 1440x900: frame/document geometry, contained actions, offline round trips and language focus.
  `tests/persistence-gate.browser.test.ts` retains eight auth viewport cases. `tests/therapeutic-sheet.browser.test.ts`
  covers keyboard trap, inert background, all close paths and focus restoration. `tests/visual-foundation.browser.test.ts`
  covers full-size roots and reduced motion. New four journeys use reduced motion and check Chromium ARIA trees
  explicitly for reset confirmation, default/custom Terminal wording, labeled Gate forms and translated recovery.
- AC-06: `tests/control-affordance.browser.test.ts` measures actual default, hover, keyboard-pressed, selected and focus
  controls through `tests/palette-contrast.ts`; `tests/persistence-gate.browser.test.ts` measures pending/recovery;
  `tests/bilingual-guest-flow.browser.test.ts` measures final assembled surfaces. These retain 4.5:1 normal text and
  3:1 control/focus requirements. New journeys retain blind rating assertions and sovereign Finish Anyway with
  non-judgmental Integrating text on Terminal No. Token derivations remain in the closed W12-01 record.
- AC-07: Existing eight-case bilingual Guest journey loads assets then runs offline with zero subsequent requests.
  `src/persistence-gate-modal.test.tsx` retains localized unavailable/config/network/expired-link feedback and draft
  preservation. New real-pipeline browser cases add rejected unconfirmed Auth and transient RPC503 recovery without
  losing the local snapshot. Network-dependent saves are never reported as completed before successful recovery.
- AC-08: Local completed gates and outstanding full commands are recorded below. Closure requires both full remote
  test commands, the full Chromium run and their dependency checks; counts alone are not substituted for these gates.
- AC-09: No inherited scenario was deleted, skipped or weakened. Two browser expectations were updated for intentional
  modal/reload behavior, preserving all contrast thresholds, geometry and Finish Anyway assertions, and adding exact
  draft preservation across dismissal. Added four cases atop the existing175 Chromium cases; historical161 and442
  are prior-wave counts, not fixed new totals. Root/scoped unit suites
  remain intact. No retries, thresholds, dependencies, lockfiles or harness configuration changed.
- AC-10: `src/registration.remote.test.ts` performs a genuinely new controlled-address signup, asserts session-null
  and unconfirmed identity, confirms the same account using the approved generated-link facility on another client,
  verifies no pre-seeded profile, bootstraps own profile under RLS, and promotes linked/unlinked work exactly once.
  `src/returning-identity.remote.test.ts` performs actual returning login/restoration/expiry, staged unanswered group
  and real answer persistence, then subsequent authenticated Finish. Both own marker-scoped fixtures and cleanup.
  Required final root/scoped reruns are assigned to the orchestrator after the completed browser/build gates;
  normal TLS stays enabled. No extra signup probes were performed during the 2026-10-18 verification resume.
  The generated-link facility proves Auth confirmation, not mailbox delivery. Prior actual W12-08 evidence is in
  `docs/waves/wave-12/tickets/12-08-restored-identity-and-expiry.md` and is not relabeled as a W12-09 rerun.
- AC-11: Automated Chromium E2E and ARIA-tree evidence is recorded distinctly. Per the user's explicit instruction,
  physical mobile keyboard/visual viewport, physical safe-area, zoom, and Hebrew native screen-reader checks are
  **Pending Manual QA Verification**, to be carried into `docs/waves/wave-12/handoffs/wave-12-handoff.md` by the orchestrator.
  Those unavailable checks are not claimed as passed and do not block automated closure under that instruction.
- AC-12: Read-only full-wave path audit against `772df65` found all runtime/test/CSS/config changes confined to web;
  other tracked changes are approved specification/ticket/audit documentation. W12-09 adds four web test files,
  changes two inherited browser test files, and updates this Resolution. No engine/adapter/schema/seed/migration/
  root-tooling/dependency changes.
  Cross-boundary review read SessionEngine.promote, PlayerEngine Finish and SupabaseRepository promotion mapping:
  the new fixture delegates all business behavior unchanged, controls only external HTTP data and observes outputs.
  No duplicate production promotion, clinical rule, alias persistence or server transaction was introduced.
- AC-13: Exact outcomes and limitations follow. Status remains pending orchestrator review and required final gates.

### Architectural Decisions

- Reuse existing viewport, contrast, race, identity and remote tests instead of duplicating those matrices.
- Keep new coverage at the approved assembled-shell seam. No successful action or repository method is stubbed.
- The HTTP fixture models the existing RPC response/re-fetch contract, including the timeline/session replay identity,
  so the actual SessionEngine must complete the persisted session and avoid another timeline/use operation.
- No runtime defect was found; new coverage passed the existing implementation after correcting fixture expectations
  (Sheet ARIA banner/region, opening the catalog Sheet, and supplying the post-promotion Global catalog response).
  No historical red/green production fix is claimed for this regression-only slice.
- Full browser regression exposed two inherited expectation mismatches: contrast must measure the active Gate when
  the Player is aria-hidden, and a restored pending Gate must be dismissed before accessing background utilities.
  Keep frame/document geometry checks, add explicit Player contrast immediately before opening the Gate, then use
  the same nonempty contrast assertion/thresholds on the active Gate. Verify reload restores the Gate and Escape
  preserves the exact pending draft before continuing the original sovereign Finish Anyway scenario.

### Verification log

2026-10-18 resume, verified base `bf1ecf26848aa9ca0eeeeda255c00d4c11079295`:

- Parent restored the reviewed six web files once. This verification agent applied no stash and changed no code,
  assertions, timeouts, retries, thresholds, dependencies or configuration.
- Focused three-file run, `npx playwright test` with `wave12-journey.browser.test.ts`,
  `bilingual-guest-flow.browser.test.ts`, `localized-player.browser.test.ts` and `--workers=2`:
  exit1,64passed/2failed of66 in3.0m, session95891. This file selection included all intended20cases, which passed.
  Two unchanged English Player320/390cases timed out with `Runtime.callFunctionOn` session-closed protocol errors;
  the390trace also recorded five `net::ERR_NETWORK_IO_SUSPENDED` errors and no application exception was captured.
- Focused rerun of the intended20 plus those two interrupted cases, same three files and `--workers=2`, selected by
  `--grep`: exit0,22passed in1.5m, session82495. Selection matched `assembled guest flow`, `assembled reset`,
  `Terminal No/revision/Yes`, and English authored-guidance selection at320/390px. No source or harness change.
- Required full web `npx playwright test --workers=2`: PASS, exit0,179passed in4.5m, session79091.
  All175inherited cases plus four new assembled journeys passed with the original two-worker/retry policy.
  Host Chromium was used under established approval; all browser sessions completed before subsequent gates.
- Root `npm run typecheck`: PASS, exit0,15.45s, all four workspaces, session27036.
- Root `npm run lint`: PASS, exit0,11.34s, session90402.
- Root-cwd `npm run depcruise -w packages/pic-web`: PASS, exit0,11.46s, session3848;
  zero violations,766modules/1670dependencies.
- Root-cwd `npm run build -w packages/pic-web`: PASS, exit0,5.85s wall time (Vite1.70s),2708modules transformed.
  Existing warnings: extensionless `public-auth-config` under native config loading; `guest-flow-facts` mixed
  static/dynamic imports; chunk above500kB (869.75kB,256.11kB gzip). No thresholds or config changed.
- All gates above ran sequentially. No browser/build/test runners remained active at handoff to the orchestrator.
- Parent owns required exact root `npm test` including all-workspace dependency checks and scoped web `npm test`,
  both including actual signup with the approved address and normal TLS. These final remote gates remain pending
  at this agent's handoff; no signup probes were substituted and no previous quota failure was waived.
- Independent final reviews already completed: Standards0findings; Spec0findings, including both corrections.
  Six reviewed web files stayed frozen throughout the resume. Status remains pending parent final gates/closure.

Historical evidence retained distinctly from the successful 2026-10-18 browser/build verification:

- Original focused new journey run passed4cases in13.0s. Original full179run had163passed/16failed in6.3m;
  all16failures were the two reviewed inherited expectation mismatches, now corrected and verified above.
- Original exact root `npm test`, processenv `VITEST_MAX_WORKERS=2` and approved `PIC_REGISTRATION_TEST_EMAIL`,
  host runner with normal TLS: FAIL in107.53s;53passed/1failed files of54,559passed/1failed tests of560.
  Sole failure: actual signup `over_email_send_rate_limit`; chained all-workspace depcruise did not execute.
  Parent separately ran `npm run depcruise --workspaces --if-present`: PASS9.61s, zero violations;
  engine72modules/199dependencies,web766modules/1670dependencies. Required root rerun is still assigned above.
- Prior W12-08 scoped web `npm test`:347passed/39files at unchanged runtime/unit source. Final root and scoped
  W12-09 test commands remain required independently; prior evidence is not relabeled as a new remote run.
- The earlier quota94%halt preserved the reviewed work in a recoverable stash. Parent restored it before this
  resume; no implementation commit or closure claim was made by this verification agent.

### Deviations and environment limitations

- Sandbox Chromium launch failed because its sandbox-local Playwright cache lacked the browser executable. The
  authorized escalated host runner used the installed Chromium successfully; no browser installation/config change.
- Shared hosted signup quota was previously exhausted after W12-08's real sends. No extra signup probes were made.
  Required full commands must pass; quota failure cannot be skipped, reclassified or solved by hosted-setting changes.
- Physical/manual QA remains pending exactly as listed under AC-11. SMTP inbox delivery is not established by
  generated confirmation links. Orchestrator owns independent review, tracked closed record, final handoff and commit.
- Historical halt checkpoint is superseded by the 2026-10-18 verification log above. Parent owns the final tracked
  closed record, handoff and commits; this Resolution remains pending their final remote test gates and closure.


### Final orchestrator closure — 2026-10-18

All required automated gates passed on frozen reviewed files: root560/54files107.23s, scopedweb347/39files76.51s,
Chromium179/1794.5m, focused22/221.5m, root typecheck/lint, webbuild and zero-violation all-workspace dependencies.
Actual signup, generated confirmation, profile/promotion and owned cleanup passed with normal TLS in both unit runs.
Closed record:docs/waves/wave-12/tickets/12-09-e2e-journey-and-quality-gates.md. Final commit hash/checkpoint follows.
Manual physical checks remain Pending Manual QA Verification under the explicit user approval. Historical pending
statements above describe earlier checkpoints and are superseded by this final closure and the tracked closed record.

Atomic09 commit:f8887fa0c14ef37e6d1fd7f977ee3a59d7ed78a6; canonical closed record in docs/waves/.

[relocation-link-1]: ../../specs/wave-12-spec.md
