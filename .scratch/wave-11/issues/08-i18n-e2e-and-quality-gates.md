# 11.8 — i18n E2E and Quality Gates

**What to build:** Demonstrate the complete shipped bilingual experience from Guest Flow through approved
treatment guidance and Persistence Gate, with durable preference, safe direction/motion/focus, and unchanged
therapeutic behavior. Complete the cross-screen browser matrix and release-validation gates.

**Blocked by:**

- [11.4 — Symptom Group Creation and Blind Rating](04-symptom-group-creation-and-blind-rating.md).
- [11.6 — Persistence Gate Language Behavior](06-persistence-gate-language-behavior.md).
- [11.7 — Approved Content Localization Overlay](07-approved-content-localization-overlay.md).

Their transitive prerequisites include 11.1, 11.2, 11.3, and 11.5; these edges cover all seven implementation slices.

**Status:** done

**Dispatch state:** Implemented; two-axis review, commit and final root gates pending with the orchestrator.

**Source:** [Approved Wave 11 specification](../../../docs/specs/wave-11-i18n-spec.md), sections 5–6.

**Spec coverage:** AC-01–25, final approved-dictionary/content coverage, and Definition of Done.

## Context Injection (verbatim)

> Run actual `he`/RTL and `en`/LTR cases at 320x568, 390x844, 768x1024, and 1440x900 CSS pixel viewports.

> OQ-01 through OQ-05 block a complete bilingual release, but do not block specification delivery.
> Do not resolve them by silently retaining English UI, generating Hebrew, or changing engine/storage contracts.

> Root regression tests can depend on configured remote services. Report an unavailable environment separately from a
> passing test; do not disable TLS verification, replace real fixtures with weaker data, or declare an unrun gate green.

## External Prerequisites

- OQ-01–OQ-05: Complete approved UI copy, official content inventory/assets, provenance, and publication permission.
  No required shipped key may depend on fallback or pending approval; all preceding approval references must exist.
- OQ-07: Real-device cutouts, desktop zoom, mobile keyboard, and Hebrew screen-reader checks need manual QA evidence.
  Record unperformed checks as limitations rather than claiming browser automation proves them.
- Existing remote regression services/configuration must be available to pass their gates. Report unavailable gates separately.

## Owned Slice and Integration Boundary

- Own cross-screen Playwright coverage, dictionary/content release validation, web-local dependency-rule verification,
  and integration-test hardening. Extend existing fixtures rather than introducing a parallel simulated application.
- Each earlier ticket already provides tests for its own tracer bullet; this ticket verifies the assembled flow,
  matrix coverage, approval completeness, and quality gates rather than postponing all testing until the end.
- Small integration fixes remain web-only. A fix changing an upstream contract or approved semantics must be
  coordinated with its ticket owner; unrelated baseline repairs are not part of this ticket.

## Acceptance Criteria

- [ ] TB-01: Real-provider/selector Playwright coverage exercises `he`/RTL and `en`/LTR at every specified viewport,
      fresh/saved preference, every Guest Flow screen, ordinary guidance, Terminal NEMAR Yes/No, and Persistence Gate.
      Also cover Player resolving/recovery/empty phases with language-only utilities where appropriate.
- [ ] TB-02: Choose languages through the actual Sheet selector and reload to prove persistence. Keyboard selection,
      pressed state, Frame/document/portal metadata, modal trapping, inertness, dismissal, and focus restoration pass.
      Test-written `dir` values alone are not evidence of locale integration.
- [ ] TB-03: Frame bounds and document scroll dimensions stay inside the viewport with at most 1px rounding tolerance;
      document scroll positions remain zero and overflow stays locked. Cards, tables, and Sheet content scroll internally.
      Header/choices stay reachable; use containment rather than signed RTL `scrollLeft` assertions.
- [ ] TB-04: Both directions pass actual layout, logical-edge placement, mixed-text/punctuation, safe-area mapping,
      Hebrew wrapping, 44 x 44 CSS px target measurement, AA contrast, and visible focus checks.
      Screenshots alone do not prove contrast or accessibility.
- [ ] TB-05: Observe forward/backward/neutral and drawer transforms with observers attached before actions.
      Rapid and in-flight locale changes retain one settled reflected unit with no spurious announcement/action,
      duplicate callback, focus loss, or orphaned exiting controls. Reduced motion has zero spatial movement in both locales.
- [ ] TB-06: Locale changes preserve names/drafts, Blind-by-Default and explicit reveals, chosen linking,
      canonical unit IDs/states, pending gate/request, Terminal NEMAR meaning, and use-count/Finish authority.
      No therapeutic action or persistence mutation is attributable to choosing a language.
- [ ] TB-07: Approved treatment assets and stale/unavailable-source fallback are verified from picker through
      Player. Personal content remains unchanged, actual-language metadata is truthful, and empty canonical source stays guarded.
- [ ] TB-08: Bundled dictionaries/assets switch offline once application assets are loaded with no new server
      request or auth requirement. Do not claim a new service worker or offline-installation feature.
- [ ] TB-09: Complete approved UI key, nonempty value, interpolation/plural, and treatment-inventory validation passes.
      No raw keys, literal pending values, unapproved translations, or unintended required-key fallbacks ship.
- [ ] TB-10: Root typecheck, root lint, scoped/all-workspace depcruise, frontend unit/browser suites, web production
      build, root regressions, and changed-file 130-character standards pass with genuine recorded results.
      No skipped/weakened assertions, extra retries masking races, or TLS overrides are introduced.
- [ ] TB-11: Review the implementation diff separately from depcruise: every implementation/test/config/asset change
      is inside `packages/pic-web`; engines, adapters, ports, schemas, migrations, seeds, and root metadata are untouched.
      Preserve the no-adapter-import rule and verify locale/dictionary modules introduce no engine/adapter dependency.
- [ ] TB-12: Every Wave 11 AC is covered by explicit evidence; manual/device and remote-service limitations are
      reported honestly. All copy/content release prerequisites are closed before claiming the bilingual wave complete.
      Courses, account synchronization, extra locales, and broader content versioning remain outside scope.

## Isolation Bounds / Do Not Touch

All tests, validation tooling, configuration, assets, and authorized integration fixes stay inside `packages/pic-web`.
Only this ticket markdown may receive later Resolution; the approved spec and sibling tickets remain read-only.
Zero edits to `packages/pic-engine`, adapters, schemas/RPCs/migrations, domain tests/interfaces, canonical seeds,
root tooling/dependency metadata, or unrelated application behavior. Do not relax gates or invent therapeutic copy.
Wave handoff documents and execution briefs are outside this ticket-persistence pass and require their later phase.

## Verification and Completion Evidence

Run these from the repository root during later execution, not during ticket persistence:

- `npx vitest run packages/pic-web/src`
- `npm run test:browser --workspace=pic-web`
- `npm run depcruise --workspace=pic-web`
- `npm run depcruise --workspaces --if-present`
- `npm run typecheck`
- `npm run lint`
- `npm run build --workspace=pic-web`
- `npm test`

Use the existing changed-file line-length checker and a separate implementation-diff review.
Later Resolution must map TB-01–TB-12 and AC-01–AC-25 to observed tests/checks and approved content/copy evidence.
Historical Wave 10 passes or ticket creation are not Wave 11 verification.

## Resolution — 2026-10-12

Implementation and scoped verification are done; parent review/commit and final root gates are pending.
The user's 2026-10-11 approvals, recorded in the execution brief and seam map, close UI-copy and three-bundled-treatment
prerequisites for this run. All 110 required messages and all three English/Hebrew content assets are product-approved.
They are not represented as website quotations/publications. No new approval or translation-service dependency was added.

The real content fixture now has a complete-flow mode using AppProviders, GuestFlowRouter and GuestModeShell.
Its action observations delegate every mutation to the original engine action; there is no replacement healing simulation.
Eight assembled cases exercise Hebrew/English at 320x568, 390x844, 768x1024 and 1440x900. They cover fresh Hebrew,
actual keyboard Sheet selection, preference reload, creation, add/rate, joint inquiry, summary, voluntary linking,
approved picker/Player, Terminal No/revision/Yes, explicit Finish and Gate. Offline selector round trips after loaded
assets introduce no requests/auth requirement and preserve the canonical session and guest persistence byte-for-byte.

Direct geometry before actions found Done below the 320x568 viewport: bottom 618.015625px, with the card at zero.
SymptomAddStep now uses the same single submit form around a bounded scrolling input/rating card and stationary
Add/Done row. Existing trim, rating, retry, draft/history, counts and action payload behavior remain unchanged.
The flow measures Confirm, Add/Done and summary Continue before clicks; Add/Done also pass at reading scroll and
after locale switches. Playwright auto-scroll is not used to conceal primary-choice clipping.

The expanded tablet summary initially had only 113px scroll capacity. Summary-only fixture personal names were
lengthened, retaining 30 symptoms and the exact 120px before/after-switch assertions; no application threshold changed.
The new assembled scenario gets a 60s total budget for reload plus 18 modal language selections; its assertions retain
the existing 5s expect budget. Legacy test timeouts/configuration, motion thresholds and retries remain unchanged.

Evidence abbreviations below name files under `packages/pic-web`: FLOW = `tests/bilingual-guest-flow.browser.test.ts`;
CREATE = `tests/localized-symptom-creation.browser.test.ts`; INQUIRY = `tests/localized-inquiry-selection.browser.test.ts`;
PLAYER = `tests/localized-player.browser.test.ts`; GATE = `tests/persistence-gate.browser.test.ts`;
CONTENT = `tests/content-localization.browser.test.ts`; LOCALE = `tests/locale-choice.browser.test.ts`;
MOTION = `tests/dynamic-rtl.browser.test.ts`. Prior evidence is explicitly identified, not a claim of rerunning those suites here.

| Ticket requirement | Evidence / result |
| --- | --- |
| TB-01 | FLOW: 8 real journeys; CREATE: 16, INQUIRY: 24, PLAYER: 52, GATE: 8 cases cover both locales/all four sizes. |
| TB-02 | FLOW keyboard/pressed/document/Frame/portal/focus/reload; prior LOCALE and Sheet trap/inert/close-path tests. |
| TB-03 | Direct geometry, locked zero document scroll; exact card 40/120/200px and internal Sheet/table assertions retained. |
| TB-04 | CREATE/INQUIRY/GATE 44px targets; picker label >=44px, native checkbox 20px; prior AA/focus/edge tests. |
| TB-05 | Prior MOTION: transforms before actions, both directions, interruptions, rapid switches, one callback, zero movement. |
| TB-06 | FLOW action/storage/session invariance; CREATE blind/reveal drafts; pending group/Gate tests; PLAYER Finish identity. |
| TB-07 | Prior CONTENT and resolver tests: 3 approved assets, full source/unit match, stale/personal/empty fallback. |
| TB-08 | FLOW offline loaded-asset switches through the selector preserve session; no requests or auth action. |
| TB-09 | All 110 keys resolve in both locales without fallback/raw/pending text; parameters/plurals and 3 assets validate. |
| TB-10 | Scoped units/types/depcruise/build/lint/130/diff pass; root types pass. Final root regressions/gates await parent. |
| TB-11 | 12 web paths plus this Resolution; separate path review; locale dependency rule and existing adapter rule retained. |
| TB-12 | Every AC mapped below; product approvals closed; physical devices/manual checks explicitly unverified. |

| Wave acceptance criterion | Explicit evidence |
| --- | --- |
| AC-01 | FLOW fresh browser storage renders Hebrew before any selection; locale-provider missing/invalid preference cases. |
| AC-02 | FLOW selector/reload; GATE discard/reload and component successful promotion retain preference. |
| AC-03 | FLOW/INQUIRY/PLAYER open the actual Sheet; selector is present in utilities throughout the real router. |
| AC-04 | FLOW switches on every Guest Flow screen; PLAYER resolves/empty/recovery at all four sizes. |
| AC-05 | Immediate document/Frame/portal updates in FLOW; pending action/Gate messages settle in current locale. |
| AC-06 | FLOW/PLAYER/GATE bind he/rtl and en/ltr; prior MOTION logical-edge and safe-area mapping measurements. |
| AC-07 | FLOW Space, LOCALE Enter/Space/Tab, native-button pressed/autonym metadata and labelled group assertions. |
| AC-08 | FLOW/GATE portal/document metadata; CONTENT guidance lang/dir. Actual screen-reader pronunciation unverified. |
| AC-09 | FLOW selection retains focused selector and open Sheet, then Escape restores trigger; prior LOCALE trap/inert checks. |
| AC-10 | FLOW canonical ordered IDs/session snapshot remains exact offline; CONTENT and presentation race/cache tests. |
| AC-11 | FLOW/CREATE retain group/symptom values and polarity/intensity; pending save/reveal component tests. |
| AC-12 | CREATE all-size real prior history stays blind until explicit reveal; retained reveal/drafts and no selector action. |
| AC-13 | PLAYER all-size sovereign Finish Anyway; FLOW explicit Finish requests Gate without prematurely finishing. |
| AC-14 | PLAYER/FLOW Terminal No shows Integrating, permits revision and does not invoke Finish. |
| AC-15 | FLOW approved title/guidance; prior CONTENT 8 picker/Player cases; resolver covers 3 bilingual assets. |
| AC-16 | Resolver source/title/order/body/rationale/approval defects; prior CONTENT stale/unavailable canonical fallback. |
| AC-17 | FLOW/CREATE/INQUIRY names preserved/escaped; PLAYER source content/DOM and resolver personal/Continuous bypass. |
| AC-18 | PLAYER exact long-card scroll; INQUIRY exact summary/Sheet scroll; prior GFM/table containment/DOM tests. |
| AC-19 | Prior MOTION both locales: zero step/drawer movement and duration with reduced motion; timing unchanged. |
| AC-20 | FLOW direct action bounds; CREATE/INQUIRY/GATE 44x44 measures; picker label retains visual checkbox <44px test. |
| AC-21 | GATE rendered contrast >=4.5, INQUIRY solid focus; prior foundation/control/MOTION contrast/wrapping tests. |
| AC-22 | FLOW switches Hebrew/English offline after loaded assets with zero requests or auth; bundled resolver/cache behavior. |
| AC-23 | Locale-provider denied/quota/unavailable-storage and GATE key-specific failure tests preserve in-memory language. |
| AC-24 | Core message validation: 110 complete nonempty keys, interpolation/plural parity, no raw/pending/required fallback. |
| AC-25 | Separate web-only path scan; enforced locale no-engine/adapter rule plus retained composition-root adapter boundary. |

Verification and command evidence:

- `npm run test:browser --workspace=pic-web -- tests/bilingual-guest-flow.browser.test.ts
  tests/localized-symptom-creation.browser.test.ts tests/localized-inquiry-selection.browser.test.ts
  tests/persistence-gate.browser.test.ts --workers=2`: **54 passed / 2 failed**, 4.3m. Both failures were the new 768px
  summary fixture's 113px capacity, before the fixed 120px requirement could be exercised. All 8 FLOW, 16 CREATE and 8 GATE pass.
- Corrective `npm run test:browser --workspace=pic-web -- tests/localized-player.browser.test.ts
  tests/localized-inquiry-selection.browser.test.ts --workers=2`: **76/76 passed**, 2.6m: 52 PLAYER and 24 INQUIRY.
  Together these runs establish **108 distinct owned passing cases**. The final combined configured run belongs to the parent.
- Prior Ticket 11.7 CONTENT/PLAYER/INQUIRY affected Chromium **39/39** and owned CONTENT **11/11** remain recorded evidence
  for approved/stale/unavailable/GFM display; prior Ticket 11.2 MOTION/Sheet/foundation evidence covers motion and contrast.
- `npm run test --workspace=pic-web -- --maxWorkers=2`: **31 files / 229 tests passed**, including strengthened release checks.
- `npm run typecheck --workspace=pic-web`: passed; `npm run typecheck`: all four workspaces passed during this ticket.
- `npm run depcruise --workspace=pic-web`: passed, **746 modules / 1551 dependencies**, zero violations.
- `npm run build --workspace=pic-web`: passed, **2698 modules**; existing mixed dynamic/static-import and large-chunk notices.
- `npx eslint @lintPaths` over every owned JS/TS/CJS path: passed; bundled Python
  `scripts/check-max-line-length.py @ownedPaths` over all 12 changed/untracked web files: passed at 130 characters.
- `git diff --check` and separate baseline `f34427d` path review: passed. The parent-owned handoff is excluded from this slice.

The initial sandbox Chromium launch failed before tests because its browser path was unavailable. Approved escalation used
the installed browser. The first long-flow batch exhausted the original 30s scenario budget late in the journey; only the new
assembled test received the documented total budget. No assertion, clinical choice, TLS setting, retry or skip was relaxed.
Final repository lint, all-workspace depcruise, root `npm test`, and full configured Chromium are pending parent closure after
review/commit. They are not claimed green here, and no remote-service availability is inferred from scoped web passes.

Physical cutouts, mobile keyboards/visual viewport, real desktop zoom and Hebrew screen-reader pronunciation remain
unverified without actual devices/manual runs. Chromium evidence does not prove these. No Safari/Firefox, service worker,
offline installation, course translation, account synchronization, extra locale or broader content-versioning claim is made.
No engine, adapter, port, seed, schema/migration, dependency/root tooling, staging, commit, PR or publishing change was made.
