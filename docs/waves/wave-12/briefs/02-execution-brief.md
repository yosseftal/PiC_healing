# W12-02 execution brief

## Identity

- Ticket: W12-02 — Explicit Hebrew terminology and dynamic NEMAR alias
- Ticket specification: `.scratch/pic-tracer-bullet/issues/02-wave-12-explicit-terminology.md`
- Wave: 12. Dispatch authority for this run covers 01 → 02 → 03 sequentially only.
- Authorized frontier ticket; wait for previous ticket verification and commit.
- Escalation: report concrete spec/contract conflicts to the orchestrator; do not widen scope.

## Permissions

Read-write: owned implementation/test modules inside `packages/pic-web` and this ticket's Resolution.
Own LocaleProvider, typed terminology message resolution, affected UI dictionary values/callers, and their web tests. This is
presentation-only; it introduces no alias editor or persistence.
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

> A supplied alias is literal user wording and is not translated.

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

- Seam: LocaleProvider → typed messages → UI.
- Owns: i18n and affected presentation callers/tests.
- Consumer/downstream: current inquiry state.
- Risk to verify: Resolve default per fallback language; render alias as literal bidi-isolated data.
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
   code-review and commits verified work with `[W12-02]`. Do not commit or dispatch another implementation yourself.
7. If sandbox infrastructure blocks a test, report the exact failure promptly; do not bypass TLS, skip tests,
   or alter application behavior to accommodate the harness.

## Acceptance Criteria (checklist)

- [ ] AC-01: Remove every Hebrew abbreviation variant from UI dictionary values, including ASCII quotes, Hebrew gershayim,
  and typographic quotes. Cover headings, questions, navigation, recovery, source-availability messages, and accessible names
  using grammatical Hebrew.
- [ ] AC-02: Hebrew defaults to exactly נכון ומדויק; English retains NEMAR. Add optional customNemarAlias and its setter to
  the existing i18n context, with null as the initial value and blank/whitespace input falling back to the locale default.
- [ ] AC-03: Use designated typed placeholders supplied by the bound context. Preserve required-parameter checking, plural
  handling, resolved text/parts agreement, and truthful fallback language metadata; fallback defaults follow the actual
  template language.
- [ ] AC-04: Render custom aliases as escaped literal text with bidi isolation, never HTML or template source. Do not
  globally replace rendered DOM or authored treatment text.
- [ ] AC-05: Changing locale or alias preserves drafts, group/session/unit identities, terminal response, blind-rating
  visibility, voluntary links, and Finish Anyway eligibility; no therapeutic action is triggered.
- [ ] AC-06: Keep the alias in memory at the provider level. Inquiry subtree resets must not reset the alias; providers are
  not keyed to the active inquiry. Cross-feature reset integration is verified in 09.
- [ ] AC-07: Keep canonical NEMAR identifiers, engine payloads, personal text, authored content overlays, parser unit IDs,
  seeds, and server language preferences unchanged. Route any affected hardcoded UI wording through the dictionary.
- [ ] AC-08: Tests cover default/custom/blank/mixed-direction/special-character aliases, fallback, accessible names, and a
  live locale/alias change in an active inquiry.

