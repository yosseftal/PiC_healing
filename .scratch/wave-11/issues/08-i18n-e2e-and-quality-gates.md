# 11.8 — i18n E2E and Quality Gates

**What to build:** Demonstrate the complete shipped bilingual experience from Guest Flow through approved
treatment guidance and Persistence Gate, with durable preference, safe direction/motion/focus, and unchanged
therapeutic behavior. Complete the cross-screen browser matrix and release-validation gates.

**Blocked by:**

- [11.4 — Symptom Group Creation and Blind Rating](04-symptom-group-creation-and-blind-rating.md).
- [11.6 — Persistence Gate Language Behavior](06-persistence-gate-language-behavior.md).
- [11.7 — Approved Content Localization Overlay](07-approved-content-localization-overlay.md).

Their transitive prerequisites include 11.1, 11.2, 11.3, and 11.5; these edges cover all seven implementation slices.

**Status:** ready-for-agent

**Dispatch state:** Not dispatched; upstream implementation and copy/content prerequisites must be complete first.

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
