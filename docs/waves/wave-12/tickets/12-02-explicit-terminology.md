# 02: Explicit Hebrew terminology and dynamic NEMAR alias

**Ticket ID:** W12-02

**Wave:** 12

**Status:** done

**What to build:** The Event Manager reads נכון ומדויק throughout Hebrew interface prompts and accessible labels, with a
centrally resolved custom phrase available for future personalization.

**Blocked by:** None (can start immediately).

**Source:** [Approved Wave 12 specification](../wave-12-spec.md), Implementation Decisions C; User Stories 14-18.
The nine-ticket breakdown and dependencies were approved without changes on 2026-10-13.

## Context Injection (verbatim)

> A supplied alias is literal user wording and is not translated.

## Owned vertical slice

Own LocaleProvider, typed terminology message resolution, affected UI dictionary values/callers, and their web tests. This is
presentation-only; it introduces no alias editor or persistence.

## Acceptance criteria

- [x] AC-01: Remove every Hebrew abbreviation variant from UI dictionary values, including ASCII quotes, Hebrew gershayim, and
  typographic quotes. Cover headings, questions, navigation, recovery, source-availability messages, and accessible names using
  grammatical Hebrew.
- [x] AC-02: Hebrew defaults to exactly נכון ומדויק; English retains NEMAR. Add optional customNemarAlias and its setter to the
  existing i18n context, with null as the initial value and blank/whitespace input falling back to the locale default.
- [x] AC-03: Use designated typed placeholders supplied by the bound context. Preserve required-parameter checking, plural
  handling, resolved text/parts agreement, and truthful fallback language metadata; fallback defaults follow the actual template
  language.
- [x] AC-04: Render custom aliases as escaped literal text with bidi isolation, never HTML or template source. Do not globally
  replace rendered DOM or authored treatment text.
- [x] AC-05: Changing locale or alias preserves drafts, group/session/unit identities, terminal response, blind-rating
  visibility, voluntary links, and Finish Anyway eligibility; no therapeutic action is triggered.
- [x] AC-06: Keep the alias in memory at the provider level. Inquiry subtree resets must not reset the alias; providers are not
  keyed to the active inquiry. Cross-feature reset integration is verified in 09.
- [x] AC-07: Keep canonical NEMAR identifiers, engine payloads, personal text, authored content overlays, parser unit IDs,
  seeds, and server language preferences unchanged. Route any affected hardcoded UI wording through the dictionary.
- [x] AC-08: Tests cover default/custom/blank/mixed-direction/special-character aliases, fallback, accessible names, and a live
  locale/alias change in an active inquiry.

## Verification and prior art

Extend existing message-contract, locale-provider, localized inquiry, and Player tests. Use a provider fixture for custom
aliases; do not add a production editor just for testing.

## Dependencies and exclusions

Independent of 01 and 03. Shared dictionary edits require writer coordination, not an additional blocking edge.

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

Implemented; independent Standards and Spec reviews passed with zero findings.
All implementation checks passed; pending orchestrator closure and commit.
Closed by the orchestrator after all required ticket gates passed.

### Solution Path

- AC-01: All eight existing terminology-bearing UI messages now declare typed terminology slots in both dictionaries.
  Hebrew questions resolve to the exact approved phrase and headings use grammatical “בדיקה מסכמת” wording.
  The dictionary audit rejects ASCII, gershayim, typographic, and single-quote abbreviation variants.
  Recovery, source guard, terminal navigation, headings, and accessible names use dictionary templates.
- AC-02: LocaleProvider exposes customNemarAlias and setCustomNemarAlias, initialized to null.
  Nonblank aliases retain their complete literal wording; null, empty, and whitespace-only input use נכון ומדויק or NEMAR.
  Provider and resolver tests cover defaults, updates, blank input, mixed direction, quotes, markup, and brace syntax.
- AC-03: MessageDefinition has a designated terminology field separate from caller params. The context binds the resolver.
  Compile-only contracts reject caller-supplied aliases, missing required state/count, and nonnumeric plural counts.
  Resolver tests prove fallback defaults follow the actual Hebrew/English template, truthful metadata, plural behavior,
  and exact text/parts agreement. Aliases are inserted after template validation and never reparsed.
- AC-04: LocalizedMessage renders literal inserts as React-escaped bdi elements with dir=auto.
  String-only labels use Unicode FSI/PDI around inserts. A dedicated terminal navigation template preserves alias isolation.
  Recovery-copy development validation ignores marked literal inserts without weakening its product-copy prohibition.
  A regression alias containing “error” proves arbitrary user wording cannot crash recovery.
- AC-05: Existing localized symptom/inquiry tests now change aliases while retaining drafts, polarity/intensity,
  hidden/revealed prior ratings, pending requests, group identity, and voluntary linking.
  New active Player cases preserve linked session data, canonical unit identity, Yes/No terminal answers,
  Integrating reason, mounted controls, and Finish/Finish Anyway availability; no respond, jump, or Finish is triggered.
- AC-06: Alias lifetime belongs to the existing unkeyed LocaleProvider above inquiry providers.
  A provider fixture remounts only its inquiry subtree and proves the alias survives; provider remount clears it.
  Only the existing locale preference is persisted. Full assembled reset integration remains W12-09.
- AC-07: Canonical identifiers and therapeutic records remain unchanged. Runtime and tests are confined to pic-web.
  Existing authored guidance and personal wording are preserved; alias data is absent from engine/promotion payloads.
  No adapter, engine, schema, seed, manifest, lockfile, server preference, or content overlay was edited.
- AC-08: Provider, typed resolver, localized inquiry, and Player tests cover the required variants and continuity.
  Two Chromium cases change aliases and locale during a live inquiry, asserting accessible names, bidi isolation,
  unmodified authored content and storage, retained terminal No, enabled Finish Anyway, and 320px viewport containment.
  Existing browser assertions retain all prior scenarios with the intentionally updated Hebrew copy.

### Architectural Decisions

- AC-01/02/03: Separate terminology metadata lets internal context data coexist with required caller parameters.
  Defaults are chosen only after a valid fallback template has been selected. No global replacement is performed.
- AC-04: Structured messages use bdi; string-only component contracts use isolatedMessageText.
  The editorial guard checks template text and retains its existing rejection of prohibited product copy.
- AC-05/06/07: Alias state is presentation-only and introduces neither a production editor nor persistence.
  Test-only provider setter access is shared by unit and browser fixtures and is not mounted in the production app.
- AC-08: Preserve baseline scenarios and exercise public presentation/application seams with existing engine contracts.

### Verification

- Red-to-green: explicit Hebrew defaults; fallback/custom literal resolver; provider lifetime; recovery with literal “error”.
- Focused regression command: npx vitest run packages/pic-web/src/i18n plus affected Player, terminal, picker,
  joint, localized inquiry/symptom, and action-layout suites: 11 files, 117 tests passed.
- npm run typecheck -w packages/pic-web: passed.
- npx eslint packages/pic-web/src packages/pic-web/tests: passed.
- npm run depcruise -w packages/pic-web: passed; 747 modules, 1560 dependencies, zero violations.
- npm test -w packages/pic-web: passed; 31 files, 235 tests.
- From packages/pic-web, npx playwright test --workers=2: initial run finished with 161 passed and two failed (4.1m).
  Both failures were new alias cases using terminal-nemar instead of canonical __terminal_nemar__ in their selector.
  Corrected the test-only selector; the complete rerun passed all 163 cases in 9.3m on 2026-10-14 (exit 0).
  No test skips, configuration changes, retry increases, or runtime changes were needed.
- Parent additionally verified npm run depcruise --workspaces --if-present: passed.
  Engine: 72 modules/199 dependencies; web: 747 modules/1560 dependencies; zero violations.
- Runtime/test diff: packages/pic-web only. This ticket is the documentation exception; approved untracked spec preserved.

- Independent parent-led code review against 018bf5274c9615053db219094b6cd14478c798a4:
  Standards: zero findings. Spec: zero findings.

### Deviations

- No product-scope deviations. The recovery editorial guard adjustment is necessary to honor literal user wording.
- Sandbox Vitest runs hit EPERM when renaming temporary SSR transform-cache files. Approved execution escalation
  resolved this infrastructure failure without test/config changes. Chromium also runs with approved escalation to use
  the installed browser rather than the sandbox profile, which lacks its binary.
- Historical root 442-test coverage is not claimed as rerun. Full assembled-wave, remote, and manual gates remain W12-09.
