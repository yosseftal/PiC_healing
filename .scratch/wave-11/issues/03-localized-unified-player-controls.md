# 11.3 — Localized Unified Player Controls

**What to build:** An Event Manager reads Player controls, unit-state display labels, Terminal NEMAR,
sovereign Finish controls, recovery messages, and accessibility text in the chosen language without changing
the session's meaning or authority. Language access remains available in every Player content phase.

**Blocked by:** [11.1 — Persistent Language Choice](01-persistent-language-choice.md).

**Status:** done

**Dispatch state:** Implemented and verified; independent parent review pending.

**Source:** [Approved Wave 11 specification](../../../docs/specs/wave-11-i18n-spec.md), sections 3.3–3.4, 4, and 6.2.

**Spec coverage:** AC-03–05, AC-08–10, AC-13–14, AC-24–25.

## Context Injection (verbatim)

> Separate **language access** from **Player utility eligibility**. The Sheet trigger remains available while Player content
> is resolving, empty, or reconnecting. Those phases may expose language controls alone; do not expose Finish or navigation
> where the existing source-content guard prohibits them. This preserves the Zero-H3 behavior and global language access.

> Localize engine-origin **display labels** such as Continuous Guidance and unit states through explicit semantic mappings;
> preserve the raw domain enum values and canonical parser output. Preserve stable test IDs and automation identities.

## External Prerequisites

Spec OQ-01/OQ-02/OQ-05: Approved Player, navigation/state, Terminal NEMAR, Finish, recovery/Zero-H3,
and assistive copy in both locales. Integrating and Finish Anyway remain pending until explicitly approved.
No invented Hebrew values, automatic translations, or placeholder values may satisfy this ticket.

## Owned Slice and Integration Boundary

- Own Player chrome, Navigation Tree display state labels, Terminal NEMAR/Finish messages, recovery presentation,
  guidance-region accessible names, and corresponding feature dictionary entries and tests.
- Consume 11.1's selector and locale API; keep Player utility eligibility distinct from language availability.
- Leave authored treatment bodies, translated catalog titles, and content resolution to 11.7.
  Establish localized display/accessibility surfaces that 11.7 can consume without replacing canonical unit records.
- Coordinate composition edits with 11.2; this ticket does not own shared CSS or animation mechanisms.

## Acceptance Criteria

- [ ] TB-01: Both approved dictionaries cover all Player chrome, utility title/description/close/content labels,
      navigation-state labels, guidance accessible names, and step announcements owned by this ticket.
      Use full-message templates and escaped/isolate dynamic text; no English concatenation or title lowercasing.
- [ ] TB-02: Switching updates the active Player presentation in place while preserving unit/session IDs, current
      engine state, pending async actions, stable test IDs, and already-established focus ownership.
- [ ] TB-03: Ordinary units, Continuous Guidance system labels, and Terminal NEMAR display labels are localized;
      raw enum values and canonical parser records are never translated, rewritten, or persisted as display strings.
- [ ] TB-04: Yes, No, Change response, Finish, and Finish Anyway retain their existing actions and eligibility.
      No response remains Integrating; language changes never declare success, alter use counts, or add a gate.
- [ ] TB-05: Language-only Sheet access works during resolving, empty, and recovery phases. Source-content guards
      still suppress prohibited Player utilities and execution; localization never creates a Finish bypass for empty source.
- [ ] TB-06: Main therapeutic controls stay within the two-choice contract. Navigation Tree remains the exclusive
      manual non-linear navigation mechanism; the utility selector adds no main action or new gesture.
- [ ] TB-07: Recovery and recorded-response banners retain calm, factual meaning in both locales. Async actions
      settling after a language change display current-locale messages without replaying the original action.
- [ ] TB-08: Required keys/parameters have parity and no unintended fallback; unknown runtime keys cannot leak.
      Fallback text carries actual-language metadata. Approved copy is required before this slice is complete.
- [ ] TB-09: Integration tests prove no therapeutic mutation on selection; browser tests exercise ordinary units,
      Terminal NEMAR Yes/No, Finish Anyway, resolving/recovery/empty phases, keyboard access and truthful metadata.
- [ ] TB-10: A demonstrable bilingual Player control flow passes scoped tests, root typecheck, web depcruise/build,
      lint, line-length and scope checks. Treatment-body localization remains explicitly deferred to 11.7.

## Isolation Bounds / Do Not Touch

All application, dictionary, styling, configuration, and UI test changes stay inside `packages/pic-web`.
Only this ticket markdown may be updated for later Resolution; spec and siblings remain read-only.
Zero edits to `packages/pic-engine`, adapters, migrations, domain enums/interfaces/tests, seeds, or root lockfile.
Do not change Player rules, rating behavior, auth, content parsing/caching, clinical instructions, or frozen motion tokens.

## Verification and Completion Evidence

Reuse existing Player, Terminal NEMAR, Navigation Tree, and Finish integration seams and browser fixtures.
Assert outward messages and existing action calls, not the dictionary's internal representation.
Later Resolution must address TB-01–TB-10 with real gate evidence and the approved-copy reference.

## Resolution — 2026-10-11

Implemented against dispatch baseline `8dff295`, consuming the reviewed upstream motion correction `929e85f`.
All implementation, dictionary and test edits are within `packages/pic-web`; this Resolution is the only
documentation exception. No staging or commit was performed by the implementing agent.

The user approved drafting and using Hebrew UI controls, banners and assistive copy on 2026-10-11,
as recorded in the execution brief and `docs/audits/wave-11-seam-map.md`. Newly authored Hebrew/English
Player copy is product-approved copy grounded in PIC terminology, not a quotation or publication from the website.

### Criteria

- [x] TB-01: Complete Hebrew/English Player chrome, Sheet descriptions, navigation states, guidance/table
  accessible names, step announcements, Terminal NEMAR, Finish and recovery messages. Navigation entries
  use a complete parameterized template with React escaping and independent bidi isolation.
- [x] TB-02: Real selector integration preserves session/unit identity, canonical source cache, engine state,
  pending actions, DOM/focus ownership and card scroll; no locale dependency was added to content reads.
  Pending Yes/No responses, navigation recovery and Finish recovery settle once with current-locale messages.
- [x] TB-03: Explicit semantic state mapping preserves raw `unseen`, `in_view`, `skipped`, `completed` values.
  `unit-0` identifies the parser-origin Continuous Guidance title; an authored H3 with the identical English
  title remains untouched. Terminal NEMAR display names preserve its canonical ID and automation identities.
- [x] TB-04: Yes/No, Change response, standard Finish and Finish Anyway retain action arguments/eligibility.
  No remains `terminal_nemar_no` / Integrating, without success declaration or use-count mutation.
  Existing Finish actions still go through the Session Engine and preserve the preexisting Persistence Gate.
- [x] TB-05: The Sheet always offers language for a reflected Player session, including resolving/empty/recovery.
  Resolving, confirmed-empty and recovery with no non-terminal source units expose only language.
  Existing valid-session recovery retains its sovereign utilities; empty source cannot acquire a Finish path.
- [x] TB-06: Terminal NEMAR remains within the two-choice action contract; only Navigation Tree requests manual
  jumps. The selector stays in the Sheet, without a new main action or therapeutic gesture.
- [x] TB-07: Calm factual response/recovery messages are complete in both locales and render from current locale.
  Explicit pending-action tests prove selection never replays the original response/navigation/Finish request.
- [x] TB-08: Required key/parameter parity validation passes without fallback. Existing typed message resolver
  retains unknown-key containment and actual-language fallback metadata. No placeholder or unapproved copy ships.
- [x] TB-09: Screen/provider/action integration tests cover nonmutation, pending outcomes and source guards.
  Bilingual Chromium covers ordinary units, Terminal No/revision/Yes, both Finish paths, resolving/empty/recovery,
  keyboard language selection, truthful metadata, focus, card scroll and authored table reading position.
- [x] TB-10: Final frontend, scoped/root typecheck, web dependency boundaries, production build, owned lint,
  130-character checks, diff checks and scope checks pass. Treatment bodies/catalog translation remains 11.7;
  earlier screen migrations remain 11.4/11.5 and Gate copy remains 11.6.

### Meaningful TDD evidence

- Resolving language access: 1 genuine red (missing Sheet trigger), then 1 green with one pending source read.
- Navigation/accessibility: 1 genuine red (missing Hebrew guidance name), then 1 green including raw session equality.
- Pending Yes/No outcomes: 2 genuine reds (English recorded-response banners after selection), then 2 greens.
- Pending Finish recovery: 1 genuine red (English Finish Anyway), then 1 green with the same retry request.
- Empty/recovery guards: 2 genuine reds (English guard after selection), then 2 greens without execution utilities.
- Table label metadata: 1 genuine red (unknown language inherited by UI region), then 1 green with unknown authored text.
- Authored table preservation: 2 browser reds proved the inline Markdown renderer remounted the scroller on selection.
  A stable hoisted renderer and stable components map retain its DOM and reading position.
- Semantic source direction: 2 further genuine reds proved an inner `table dir="auto"` excluded Hebrew descendants
  from the outer scroller's automatic direction calculation. The table now keeps `lang=""` and inherits the scroller's
  semantic `dir="auto"`. Latin/Hebrew authored tables resolve LTR/RTL in both UI locales without language inference.
  Four browser greens assert source axis, DOM identity and exact relative reading offset after the first switch,
  then visible-cell absolute X/Y after the round trip. Mirroring the card's scrollbar gutter moves both region and
  cell by 15px; comparison uses the exact offset within the scroller, without widening an error threshold.

### Final gates on the semantic implementation

Executed from the repository root, sequentially for timing-sensitive test suites:

```powershell
npm run test:browser --workspace=pic-web -- tests/localized-player.browser.test.ts `
  tests/unified-player.browser.test.ts tests/locale-choice.browser.test.ts `
  tests/dynamic-rtl.browser.test.ts --workers=2
npm test -w packages/pic-web
npm run typecheck --workspace=pic-web
npm run typecheck
npm run depcruise --workspace=pic-web
npm run build --workspace=pic-web
```

- Chromium: **51 passed**, 55.5s; 22 new bilingual cases plus 29 affected existing cases; 2 workers.
- Frontend: **26 files / 173 tests passed**, 15.49s, no skips in the full run.
- Scoped and root typechecks: passed; root covers all four configured workspaces.
- Web depcruise: no violations, **731 modules / 1461 dependencies**.
- Web build: passed, **2689 modules**; existing mixed dynamic/static import and >500kB chunk notices remain.

Owned lint and line-length checks used this exact path set:

```powershell
$playerOwnedPaths = @(
  'packages/pic-web/src/AtomicUnitView.tsx',
  'packages/pic-web/src/FinishBar.tsx',
  'packages/pic-web/src/NavigationTreePanel.tsx',
  'packages/pic-web/src/TerminalNemarUnit.tsx',
  'packages/pic-web/src/UnifiedPlayerScreen.tsx',
  'packages/pic-web/src/action-layout/AtomicActionLayout.tsx',
  'packages/pic-web/src/i18n/core-messages.ts',
  'packages/pic-web/src/i18n/core-messages.test.ts',
  'packages/pic-web/src/terminal-nemar-unit.test.tsx',
  'packages/pic-web/src/unified-player-screen.test.tsx',
  'packages/pic-web/src/happy-path-e2e.test.tsx',
  'packages/pic-web/tests/localized-player.browser.test.ts',
  'packages/pic-web/tests/unified-player.browser.test.ts',
  'packages/pic-web/tests/unified-player.fixture.tsx',
  'packages/pic-web/src/therapeutic-frame/TherapeuticFrame.tsx'
)
npx eslint @playerOwnedPaths
```

The bundled Python executable ran `scripts/check-max-line-length.py @playerOwnedPaths`: passed, max 130.
The default `python.exe` Windows Apps alias was unavailable; the configured bundled Python ran the same checker.
`git diff --check` passed. `git status --short` / diff scope show only the 15 owned web paths and this ticket.
Zero engine, adapter, contract, migration, seed, root configuration or dependency edits.

Sandbox Vitest temporarily hit an EPERM cache rename before execution; the approved escalated rerun passed.
Sandbox Playwright could not see the installed Chromium; approved escalated browser runs used it successfully.
Test-only stale accessible-name locators were corrected to stable Sheet identity while retaining accessible-name,
focus and metadata assertions. These environment/test-fixture failures are not claimed as passing test evidence.

### Integration notes and limits

- Parent approved the narrow shared APIs: optional `actionsLabel` / `selectedLabel` on AtomicActionLayout,
  stable action wrapper keys independent of translated labels, and optional semantic `dir` on the table scroller.
  Defaults preserve existing standalone callers. Terminal NEMAR has a focused control/edit-state regression.
- Terminal NEMAR descriptors never set `disabled`; Player cannot expose the remaining English `Unavailable`
  indicator. 11.4/11.5 must add/pass an approved optional `unavailableLabel` if their migrated actions use it.
- Unknown authored titles/bodies retain `lang=""`, automatic source direction and escaped personal text.
  Table UI labels carry the selected locale separately. 11.7 may attach known source-language metadata only
  after validating complete content assets, and may legitimately clamp reading position after source reflow.
- Chromium automation covers both locales and ordinary guidance at 320x568, 390x844, 768x1024 and 1440x900.
  No Safari/Firefox, physical cutout, real mobile keyboard, browser zoom or Hebrew screen-reader pronunciation
  manual run was performed. Existing Chromium zoom/reduced-motion cases pass; they do not replace device QA.
- The full configured Chromium suite and root regression/lint wave gates remain the orchestrator's closure work.
  No additional therapeutic content, Gate copy, earlier screen or downstream ticket implementation was included.

### Independent review correction: semantic action identity

Standards review found one P2 judgment concern: slot keys retained a focused Yes control when it became Finish.
Spec review found zero mismatches. TB-02 and DEC-015 require distinct response and explicit Finish affordances.
Optional locale-independent ActionDescriptor.id now identifies each Terminal action, including its retry.
Legacy callers retain their original label-based fallback; translated callers must supply semantic IDs.
Locale-only changes retain Yes/No DOM and edit state. Semantic action changes replace the old focused control.

The focused Yes-to-Finish regression failed on the original patch, then passed after the identity correction.
Coverage includes No/Change response, response/Finish retries, and both locales' keyboard-repeat behavior.
Another Enter after Yes does not focus or activate Finish or open the Gate.

- Terminal component tests: 10 passed; complete frontend: 26 files / 178 tests passed.
- Affected Chromium Terminal NEMAR / sovereign Finish cases: 4 passed, 11.1s.
- Scoped/root typechecks, owned lint, 130-character and whitespace/scope checks: passed.
- Web depcruise: zero violations, 731 modules / 1462 dependencies; build: passed, 2689 modules.
- Four web paths plus this ticket changed; zero engine, adapter, contract, seed or root tooling edits.

The original 51-case Chromium evidence remains above; final wave closure reruns the full configured suite.
Parent review of the committed correction remains pending.
