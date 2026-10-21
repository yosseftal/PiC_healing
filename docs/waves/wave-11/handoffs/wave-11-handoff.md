# Wave 11 handoff: bilingual UI and dynamic direction

Date: 2026-10-12. Baseline: `dddd56d`. Closure status: complete; all eight tickets committed and reviewed.

Wave 11 adds Hebrew/English presentation inside `packages/pic-web`. Hebrew is the first-use default;
`pic-web.locale.v1` remembers the browser preference. The actual utilities Sheet exposes accessible autonym
buttons, updates document/Frame/portal language and direction, and preserves selector focus while open.
Storage failure retains an in-memory preference and leaves the treatment journey available.

Group creation, symptom rating, joint inquiry, summary, treatment selection, Player controls, Terminal NEMAR,
and Persistence Gate now use the bilingual dictionaries. Personal names, drafts and authored personal guidance
remain unchanged. Locale changes do not invoke therapeutic actions, replace session identities, reveal blind
ratings, alter voluntary linking, change Finish eligibility, or enter persistence/promotion payloads.

Logical layout and direction-aware horizontal motion preserve the single viewport. Long content scrolls inside
cards/tables/Sheet; primary summary continuation and symptom Add/Done actions remain outside scrolling content.
Reduced motion removes spatial transitions. Semantic action identities prevent keyboard focus on Yes from
becoming focus on Finish after a Terminal response.

## Content and approvals

The user's 2026-10-11 approvals authorize drafted Hebrew UI copy and translations of the three bundled treatments
as product-approved content. These approvals supersede this run's frozen pending-copy/content prerequisites
(OQ-01–OQ-05). New labels and treatment assets do not claim publication or authorship on the official PIC website.
The adopted official terminology includes `מאגר מידע אישי`; tone remains calm, accessible and empowering.
The approved specification itself remains frozen; overrides are recorded in the execution seam map and briefs.

Web-owned assets include complete English/Hebrew titles and guidance, independent frozen source snapshots,
ordered canonical unit identities, approval/provenance and source revisions. Display overlays require exact
source/catalog/parsed-unit matches and complete approved assets before cache hits. A mismatch retains original
guidance with truthful language metadata and a localized availability notice. Null/rejected source reads remain
retryable. Translation text never drives parsing, startup identities or stored healing records.

OQ-06 remains the future-content policy: changed source requires a refreshed fingerprint and approval before
translation reuse. Courses, account synchronization, additional locales and wider content versioning are deferred.

## Ticket delivery and review

Existing tickets live in `.scratch/wave-11/issues/`; the later `pic-tracer-bullet/issues` reference was stale.
All eight briefs were persisted before implementation. Shared dictionaries/composition required serialized writers:
11.1 → 11.2 → 11.3 → 11.6 → 11.4 → 11.5 → 11.7 → 11.8.
Each ticket has a per-criterion Resolution, scoped verification and a separate Standards/Spec review of a pinned commit.

| Ticket | Delivery commits | Review outcome |
| --- | --- | --- |
| 11.1 Persistent language choice | `b617a0e`, `2e69889` | Standards: 0; Spec: runtime-locale boundary finding closed |
| 11.2 RTL layout and motion | `8dff295`, `929e85f` | Standards: 0; Spec: outgoing-motion interruption finding closed |
| 11.3 Unified Player controls | `d6d73a7`, `fb1af26` | Standards: action-identity finding closed; Spec: 0 |
| 11.6 Persistence Gate language | `31161c2` | Standards: 0; Spec: 0 |
| 11.4 Creation and blind rating | `b25b55b` | Standards: 0; Spec: 0 |
| 11.5 Inquiry, summary and picker | `b5b6a23`, `27719a0` | Standards: 0; Spec: scrolling-summary action finding closed |
| 11.7 Approved content overlay | `f34427d` | Standards: 0; Spec: 0 |
| 11.8 E2E and quality gates | `e9696e6` | Standards: 0 documented violations; Spec: 0; nonblocking helper cleanup below |

## Final verification

Root commands run on implementation commit `e9696e6`, after ticket 11.8's independent reviews closed.
Historical ticket passes are evidence for their slices, not substitutes for these assembled-wave gates.

| Gate | Final result |
| --- | --- |
| Root `npm run typecheck` | PASS: all four workspaces |
| Root `npm run lint` | PASS |
| Root `npm test` including all-workspace depcruise | PASS: 46 files / 442 tests, 54.01s; zero dependency violations |
| Full configured Chromium `npx playwright test --workers=2` from `packages/pic-web` | PASS: 161 / 161, 6.5m |
| Scoped web unit/component tests | PASS: 31 files / 229 tests, including final release assertions |
| Web dependency isolation and production build | PASS: 746 modules / 1551 dependencies; build 2698 modules |
| Changed-file 130-character and diff checks | PASS: every wave-changed tracked path; final staged docs checked at closure |
| Implementation diff against `dddd56d` | PASS: 84 web paths; only authorized planning/Resolution docs outside web |

The root test command also passed configured remote adapter regressions; no remote fixture was skipped or weakened.
All-workspace dependency checks cover engine (72 modules / 199 dependencies) and web (746 / 1551).
The full configured Chromium run uses two workers, with no new retries or changes to assertion thresholds.
Ticket 11.8's owned runs established 108 distinct passing browser cases; the final 161-case suite passed without skips.

The browser matrix uses both actual locales at 320×568, 390×844, 768×1024 and 1440×900 CSS pixels.
It exercises fresh/saved preference, keyboard Sheet selection, full Guest Flow, ordinary guidance, Terminal Yes/No,
and Persistence Gate; focused suites cover resolving/recovery/empty phases, pending requests, explicit blind reveals,
sovereign Finish Anyway, focus trapping/restoration, contrast/44px targets, logical safe areas and interrupted motion.
The assembled journey switches offline after assets are loaded and verifies no new requests or healing mutations.

Behavioral failures were fixed with their assertions retained: unsupported locales, outgoing interruption,
Terminal action focus, summary continuation, source/revision validation and retry, guidance scroll anchoring,
and small-screen symptom actions. Larger-viewport fixtures contain enough authored text to exercise real scrolling.
Only the new assembled scenario has a 60-second overall budget for a reload and 18 modal language round trips;
individual assertion budgets and legacy motion/test thresholds remain unchanged, with no new retries or skips.

Sandbox EPERM temporary-file renames and sandbox Chromium availability were infrastructure failures; authorized
runs used the existing runtime without TLS overrides or weaker fixtures. Existing production-build dynamic-import
and chunk-size warnings are retained. Final root regressions and the full configured Chromium suite both exited zero.

## Boundaries and carry-forward

All implementation, tests, dictionaries, assets, CSS and configuration changes belong to `packages/pic-web`.
Authorized documentation exceptions are the specification, seam map, briefs, tickets and this handoff.
No engine, adapter, port, canonical seed, schema/migration, root tooling or dependency metadata change is permitted.
The independent path audit found zero changes in those excluded surfaces against `dddd56d`.

The read-only deduplication sweep found normalization already shared through `normalizeInViewUnit` and engine
rehydration; adapter promotion delegates through established ownership. No consolidation was needed for Wave 11,
and none was performed across its strict seam. No glossary or DEC addition was required.

Standards review noted a nonblocking P3 possibility to share viewport/document assertions between
`tests/localized-player.browser.test.ts` and `tests/bilingual-guest-flow.browser.test.ts`.
The orchestrator deferred consolidation: the assembled helper awaits reflected transforms/ancestor animations,
while Player phase tests independently measure Frame/document bounds. Fixture-local checks preserve those
different prerequisites. No documented standard violation or unresolved Spec finding remains.

OQ-07 remains manual QA: physical-device cutouts, mobile keyboards/visual viewport changes, desktop zoom and
Hebrew screen-reader pronunciation were not manually verified. Chromium automation does not prove these checks.
No Safari/Firefox validation is claimed. Existing authentication stubs remain baseline behavior.

Execution references: [seam map](../audits/wave-11-seam-map.md),
[approved specification](../specs/wave-11-i18n-spec.md), and `.scratch/wave-11/{briefs,issues}/`.
