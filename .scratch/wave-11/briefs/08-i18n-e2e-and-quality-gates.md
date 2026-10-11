# Wave 11 Sub-Agent Execution Brief

## Identity

- Ticket: 11.8 — i18n E2E and Quality Gates
- Wave: 11
- Frozen ticket: .scratch/wave-11/issues/08-i18n-e2e-and-quality-gates.md
- Orchestrator escalation: report conflicts or missing approval; do not guess.

## Permissions

- Read-Write: active ticket Resolution and owned implementation/tests inside packages/pic-web only.
- Owned surfaces: web-local E2E/validation fixtures and tests; dependency configuration; narrowly coordinated web
  integration fixes
- Read-Only: approved Wave 11 spec, CONTEXT.md, decisions.md, CLAUDE.md, engine/port/adapter source and sibling tickets.
- Off limits: all application changes outside packages/pic-web, including engines, adapters, migrations and root metadata.
- Work only on this ticket; do not implement a later ticket or alter frozen token/domain semantics.

## Frozen requirements (verbatim)

> Run actual `he`/RTL and `en`/LTR cases at 320x568, 390x844, 768x1024, and 1440x900 CSS pixel viewports.

> OQ-01 through OQ-05 block a complete bilingual release, but do not block specification delivery.
> Do not resolve them by silently retaining English UI, generating Hebrew, or changing engine/storage contracts.

> Root regression tests can depend on configured remote services. Report an unavailable environment separately from a
> passing test; do not disable TLS verification, replace real fixtures with weaker data, or declare an unrun gate green.

## Glossary injection (verbatim)

**Event Manager**:
The user's role: active director of their own healing, not a passive patient or generic end-user.
_Avoid_: Patient, user (when meaning the healing role), client

**Atomic Focus**:
One muscle-test question at a time; small sequential steps in the Player.
During one **Inquiry Session**, **one focus target** at a time for *inquiry flow*: **one Symptom Group** (symptom-led), **one
course-as-treatment workflow** (course-led), or a **timeline-first** technique/treatment visit (**DEC-004**).
The Event Manager may switch targets by opening a new Inquiry Session when they choose.
_Avoid_: Symptom Bucket as a separate entity; lock on one group across the whole app; two focus targets in one sitting

**Integrating**:
A treatment or session is still in progress — repetition, pending commitments, permeation time needed, or a **Terminal NEMAR**
"No" response (tagged `terminal_nemar_no`, vs. an ordinary mid-exit tagged `mid_exit`; both surface identically) (**DEC-006**,
**DEC-015**).
_Avoid_: Failed, error, incomplete, stuck, "In-Process, Not Yet Complete" as a separate label


## Seam map excerpt

- See docs/audits/wave-11-seam-map.md for owned boundaries, upstream/downstream dependencies, and risks.
- Test the approved public provider/screen/action/content seams. No new test seam needs to be invented.
- Existing engines own healing state, stable identities, ratings, Finish authority, and persistence.
- Other tickets may be independent in the graph, but shared-file edits are serialized by the orchestrator.

## Execution contract

- Execute the implement workflow with TDD at the already-approved observable seams: red before green, one slice at a time.
- Read the implement and TDD skills and existing neighboring code/tests before editing.
- Run scoped typecheck, frontend component/unit tests, depcruise, affected browser tests, build, and owned lint/line checks.
- If a sandbox failure blocks tests, request the needed tool escalation; do not weaken tests or bypass TLS.
- No new dependencies or root lockfile changes. Use the existing React, Radix, Motion, Markdown, and Intl capabilities.
- User approved drafting/using Hebrew UI copy on 2026-10-11; record new labels as product-approved, not website quotes.
- Three bundled seed treatments may be translated as product-approved Wave 11 content per the 2026-10-11 user answer.
- Do not describe those seeds as official website publications; preserve provenance as product-approved content.
- Preserve English test expectations by explicit locale fixtures where appropriate; production first use remains Hebrew.
- Report changed paths, meaningful red/green evidence, per-criterion Resolution, tests, risks, and any remaining blocker.
- Do not stage or commit; the orchestrator reviews and commits each verified ticket before dispatching its successor.
- Stop after this ticket. No later-ticket edits, unsolicited broad refactors, test skips, or external publishing.

## Do Not Touch / Out of Scope (verbatim from ticket)

All tests, validation tooling, configuration, assets, and authorized integration fixes stay inside `packages/pic-web`.
Only this ticket markdown may receive later Resolution; the approved spec and sibling tickets remain read-only.
Zero edits to `packages/pic-engine`, adapters, schemas/RPCs/migrations, domain tests/interfaces, canonical seeds,
root tooling/dependency metadata, or unrelated application behavior. Do not relax gates or invent therapeutic copy.
Wave handoff documents and execution briefs are outside this ticket-persistence pass and require their later phase.

## Acceptance Criteria (checklist)

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

