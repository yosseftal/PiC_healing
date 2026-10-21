# 11.6 — Persistence Gate Language Behavior

**What to build:** An Event Manager reaching the Persistence Gate sees its title, explanation, anchoring,
retry, and continue-without-saving states in the selected language. Existing auth/promotion authority remains
unchanged, and saving or discarding guest work preserves the independent language preference.

**Blocked by:** [11.1 — Persistent Language Choice](01-persistent-language-choice.md).

**Status:** done

**Dispatch state:** Done; committed and independent Standards/Spec reviews closed.

**Source:** [Approved Wave 11 specification](../specs/wave-11-i18n-spec.md), sections 2, 3.2–3.5, 4, and 6.2.

**Spec coverage:** AC-02, AC-05, AC-08, AC-11, AC-17, AC-20–21, AC-23–25.

## Context Injection (verbatim)

>   Promotion, guest discard, and sign-in do not clear the independent preference or copy it into therapeutic records.

> Radix portal content is outside the frame's DOM subtree. Explicitly bind the same locale/direction to Sheet content
> and any other portalled dialogs; do not rely on frame inheritance. The Persistence Gate also consumes the same authority.

## External Prerequisites

Spec OQ-01/OQ-02/OQ-05: Approved keep-work, sign-in, anchoring, retry, continue-without-saving,
and assistive text, including accurate labels for existing development auth affordances.
This ticket localizes the existing gate; it does not authorize real auth-provider implementation or new copy.

## Owned Slice and Integration Boundary

- Own Persistence Gate presentation, selected-locale metadata, gate message namespace, and UI/integration tests.
- Consume 11.1's mounted provider and independent preference; existing SessionEngine signals and promotion
  actions remain the only authority over gate visibility, pending state, success, failure, and guest discard.
- Retain existing focus handoff from Player Finish to the gate. Do not change shared Sheet/motion contracts,
  add a main-screen language control, or require a second locale confirmation before anchoring work.

## Acceptance Criteria

- [ ] TB-01: Opening the existing gate after choosing either locale produces approved localized title/body,
      sign-in labels, pending/recovery messages, retry, and continue-without-saving actions.
- [ ] TB-02: The gate uses the same locale authority and correct `lang`/`dir`, even outside the Frame subtree.
      Accessible names and translated full messages update without remounting the gate or engine providers.
- [ ] TB-03: A locale update while the gate is mounted retains pending request, promotion state, inputs,
      guest work, and focus ownership; pending work settling afterward displays the current-locale system message.
- [ ] TB-04: Gate visibility, auth capability/disabled states, retry behavior, and action payloads retain their
      current semantics. Locale changes never request Finish, trigger auth/promotion, or discard guest work.
- [ ] TB-05: Successful promotion, sign-in, and explicit guest discard leave `pic-web.locale.v1` intact.
      No locale or direction field enters guest snapshots, promotion payloads, timeline events, or account records.
- [ ] TB-06: Preference read/write failure preserves in-memory localization without blocking gate actions
      or introducing a new error/confirmation flow; reload falls back according to 11.1's preference contract.
- [ ] TB-07: Both locales retain reachable keyboard controls, proper existing focus handoff, bounded internal
      overflow, 44 x 44 CSS px targets, readable AA contrast, and unchanged personal content.
- [ ] TB-08: Integration tests prove locale preservation across promotion/discard through existing fake/real
      action seams without implementing or contacting a new auth service. Browser cases cover idle/pending/recovery states.
- [ ] TB-09: All approved gate keys/parameters have parity; no raw key, placeholder, or unintended fallback ships.
      Existing auth stubs stay factually identified rather than being presented as completed production capabilities.
- [ ] TB-10: Scoped tests/checks pass, existing gate/domain behavior remains intact, and implementation is web-only.

## Isolation Bounds / Do Not Touch

All application, dictionary, styling, configuration, and UI test changes stay inside `packages/pic-web`.
The active ticket may receive later Resolution; the approved spec and sibling tickets remain read-only.
Zero edits to `packages/pic-engine`, adapters, RPCs/migrations, auth schemas, domain tests, seed data, or root lockfile.
Do not implement auth providers, alter atomic promotion/idempotency, add account locale sync, or weaken existing gate tests.

## Verification and Completion Evidence

Extend existing Persistence Gate and guest-promotion UI tests at their established context/action seams.
Choose language through existing utilities before browser gate scenarios; use the provider seam for mounted-update tests.
Run affected unit/integration/browser tests, root typecheck, web depcruise/build, lint, line-length and scope checks.
Later Resolution must address TB-01–TB-10, including exact evidence that therapeutic payloads exclude locale preferences.

## Resolution — 2026-10-11

Hebrew UI copy was explicitly product-approved on 2026-10-11 and uses the PIC session vocabulary and empowering tone.
These newly authored labels are product-approved copy, not website quotations. Apple/Google remain disabled stubs;
the existing development sign-in remains identified as a development demonstration. No auth capability was added.

- TB-01: Done. Nine typed `gate.*` messages cover title, explanation, sign-in stubs, pending, recovery, retry and discard
  in Hebrew and English. The existing English labels remain explicit fixtures in the gate tests.
- TB-02: Done. `PersistenceGateModal` consumes the existing LocaleProvider and binds `lang`/`dir` directly to its native
  dialog outside the Frame. Provider tests retain the same dialog and focused controls across message/name updates.
- TB-03: Done. Deferred sign-in and real SessionEngine promotion tests switch the mounted provider during pending and
  recovery. Requests, guest snapshot, promotion state and focus stay intact; settlement uses the current language.
  The existing gate has no editable inputs; personal session content stays unchanged in integration/browser checks.
- TB-04: Done. Existing visibility, auth disabled states and native action delegates remain intact. Provider changes
  make no additional sign-in, Finish, promotion or discard calls. Only explicit retry starts another attempt.
- TB-05: Done. Both selected locales survive successful promotion and development sign-in; explicit discard preserves
  the key and browser reload restores the choice. Exact snapshot equality is `{ group, playerSession }`; exact promotion
  equality is `{ idempotencyKey, group, playerSession, newUserId }`. Stored group/session equality, exact timeline fields
  (`log_type`, `treatment_id`, `library_row_id`, `linked_group_id`, `metadata`) and exact credential equality
  (`email`, `password`) exclude locale/direction leakage. No account locale write or sync was introduced.
- TB-06: Done. Key-specific preference read/write failures retain in-memory language and allow sign-in, retry and discard.
  Remount falls back to Hebrew through 11.1's existing storage contract without an extra error/confirmation flow.
- TB-07: Done for automated evidence. Hebrew and English Chromium cases at 320 CSS px retain the existing Finish-to-gate
  focus handoff, keyboard sign-in/retry/discard, disabled stubs, bounded internal overflow and 44 px targets. Computed
  active text contrast meets 4.5:1. Personal content remains unchanged. Manual device/accessibility limits are below.
- TB-08: Done. Existing fake authenticated RepositoryPort and development sign-in boundary prove preference preservation;
  mounted provider/action tests cover pending and recovery. Browser fixtures defer the existing promotion action at the
  repository boundary and contact no new auth service. Both locales cover idle, pending, recovery, retry and discard.
- TB-09: Done. Required dictionary validation covers all nine gate keys with complete parameter-free parity and no
  fallback. English identifies stubs; Hebrew identifies unavailable Apple/Google and the development demonstration.
- TB-10: Done. Scoped and affected gates pass; application changes stay inside `packages/pic-web`. Engine, adapters,
  schemas, contracts, seed data, dependency metadata and root tooling remain unchanged.

### Verification

TDD red: the new Hebrew dialog test failed against the English-only gate (`Keep your session`). Green: localized gate
and dictionary tests passed 2 files / 7 tests. Subsequent provider/action checks passed at the approved existing seams.

- `npm run typecheck -w packages/pic-web`: passed; `npm run typecheck`: passed all four workspaces.
- `npm test -w packages/pic-web`: passed 26 files / 185 tests, including existing remote integration behavior.
- `npm run depcruise -w packages/pic-web`: passed, 731 modules / 1465 dependencies, zero violations.
- `npm run test:browser -w packages/pic-web -- tests/persistence-gate.browser.test.ts --workers=2`: 2 Chromium cases passed.
- Affected `localized-player.browser.test.ts` and `unified-player.browser.test.ts`, grep
  `Terminal NEMAR retains|sovereign Finish`, workers 2: 4 Chromium cases passed.
- `npm run build -w packages/pic-web`: passed with existing dynamic-import and chunk-size warnings.
- Owned ESLint, 130-character line checks and whitespace/scope checks: passed.

The initial sandbox browser launch failed because its cache path lacked Chromium. The approved escalated rerun used
installed Chromium and passed; no test was skipped or weakened. Timing-sensitive tests ran apart from build/typecheck.

Manual evidence remains unverified for physical device cutouts, mobile soft keyboards, desktop zoom and Hebrew screen-reader
pronunciation. Chromium evidence does not substitute for those checks. Existing auth-provider stubs remain the product limit.

## Orchestrator closure

Closed on 2026-10-12. Commits and separate review results: 31161c2; Standards 0; Spec 0.
All reported corrective findings are closed; no blocking Standards or Spec finding remains.
The original Resolution records slice verification at implementation time.
Final assembled-wave gates and manual limitations are recorded in docs/waves/wave-11/handoffs/wave-11-handoff.md.
