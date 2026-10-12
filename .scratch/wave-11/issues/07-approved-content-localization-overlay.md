# 11.7 — Approved Content Localization Overlay

**What to build:** An Event Manager sees approved localized treatment titles in the picker and matching
Atomic Unit guidance in the Player. Validated presentation overlays preserve canonical source identity and
progress; absent, unapproved, or stale translations retain original guidance with truthful metadata and notice.

**Blocked by:**

- [11.3 — Localized Unified Player Controls](03-localized-unified-player-controls.md).
- [11.5 — Shared Inquiry, Summary, and Treatment Selection](05-shared-inquiry-summary-and-treatment.md).

These tickets establish the localized Player and picker presentation surfaces consumed by this overlay.

**Status:** ready-for-agent

**Dispatch state:** Not dispatched; upstream tickets and explicit official-content approvals are prerequisites.

**Source:** [Approved Wave 11 specification](../../../docs/specs/wave-11-i18n-spec.md), sections 3.7, 4–5, and 6.2–6.3.

**Spec coverage:** AC-10, AC-15–18, AC-22, AC-24–25.

## Context Injection (verbatim)

> Repository presence establishes shipped fixtures, not therapeutic authorship or official website provenance.
> Confirm which candidates qualify as official before approving assets. Do not label these titles as website terms.
> Do not expand the catalog to courses or arbitrary future protocols under this wave.

> Never reparse translated Markdown to determine session unit IDs or mutate the source cache. Render localized Markdown
> through the current renderer/table scroller with the same safety policy. Locale-specific display caching must include
> treatment ID, validated source revision, and locale; stale asynchronous results cannot replace a newer locale selection.

## External Prerequisites

- Spec OQ-03/OQ-04: Authorized content owner confirms the official allowlist from the three shipped candidate
  treatments, source language/revision, authorship/provenance, publication permission, and complete approved assets.
- Spec OQ-01/OQ-02/OQ-05: Approved content-availability notice and other new assistive copy in both locales.
- Spec OQ-06: Changed canonical source requires fresh matching revision/fingerprint and approval before overlay reuse.
- Do not infer official status from the seed fixtures, invent treatment translations, or substitute synthetic assets
  for production approvals. Synthetic fixtures may test rejection/race behavior without claiming content coverage.

## Owned Slice and Integration Boundary

- Own the web-only approved content catalog, pure display resolver, localized content read at the existing Treatment
  Content seam, validated picker titles, Atomic Unit display fields, and corresponding tests.
- Keep `getParsedTreatmentContent` locale-independent and canonical for session startup and empty-source guards.
  Extend only the web facade for metadata needed to validate display; do not change RepositoryPort or the Content Parser.
- Assets contain source approval/revision, locale, treatment title, and unit title/body/rationale by canonical ID.
  Canonical caching and engine state retain their existing lifetime/authority; translated text is never persisted.
- Personal content bypasses overlays. Current contracts do not justify a new ownership inference: apply only an
  explicit official allowlist with matching source and preserve existing personal-copy semantics.

## Acceptance Criteria

- [ ] TB-01: The confirmed shipped official inventory has complete approved assets in both locales, including
      provenance/permission references, source-language metadata, title, and every canonical unit's display fields.
      Candidate seed presence alone is not treated as approval; courses and future arbitrary protocols are excluded.
- [ ] TB-02: A picker-to-Player demonstration uses actual canonical treatment IDs and approved matching assets.
      Catalog titles and guidance follow locale without changing the chosen treatment, active unit, or session IDs.
- [ ] TB-03: Validation compares the full canonical representation/fingerprint including unit IDs, order, titles,
      bodies, and rationale, plus approved source catalog title. Same IDs/count with a changed body still reject the overlay.
- [ ] TB-04: Unit parity is exact; no added, removed, split, merged, or reordered unit is accepted. Partial locale
      assets are rejected coherently for the treatment rather than silently mixing translated and original units.
- [ ] TB-05: Missing locale, stale source, unapproved/invalid asset, and unlisted identity display canonical source
      with approved availability notice and truthful metadata. Unknown source language is not inferred from direction.
- [ ] TB-06: Empty canonical guidance stays guarded even when an asset exists. Nonempty zero-H3 Continuous
      Guidance keeps its canonical `unit-0` identity; its system title is localized without changing parser output.
- [ ] TB-07: Only allowlisted candidates eligible for localized picker titles request full source validation.
      Existing canonical cache is reused; other rows retain source titles without fetching every protocol.
      Selecting the locale introduces no translation-service or extra server request.
- [ ] TB-08: Display caches distinguish treatment, validated source revision, and locale. Rapid switching and
      stale async completion cannot replace the latest display, clear canonical cache, or mark units visited.
- [ ] TB-09: Markdown uses the existing renderer/table scroller and safety policy. Long approved guidance and
      GFM tables remain internally scrollable in both locales with actual-language metadata and readable layout.
- [ ] TB-10: Personal names, notes, authored/edited protocols, Hard Copies, and canonical source records stay
      unchanged. No localized display field enters library/timeline/guest promotion payloads; seed IDs/parity remain intact.
- [ ] TB-11: Pure resolver and integration tests cover changed bodies with identical IDs, renamed titles,
      reordered/partial assets, invalid approvals, empty/fallback guidance, personal bypass, races, and canonical startup IDs.
      Browser tests demonstrate approved titles/guidance and unavailable/stale fallback through the real selector.
- [ ] TB-12: Approved content coverage and scoped tests/checks pass with a web-only implementation diff.
      Missing approval or translation coverage is recorded as a blocker, not declared complete through fallback.

## Isolation Bounds / Do Not Touch

All content assets, implementation, dictionaries, styling, configuration, and UI tests stay inside `packages/pic-web`.
Only this ticket markdown may gain its later Resolution; the approved spec and sibling tickets remain read-only.
Zero edits to `packages/pic-engine`, Content Parser, adapters, RepositoryPort, migrations, canonical seeds/tests,
auth/account schemas, or root lockfile. No new server content-version contract, ownership schema, or snapshot model.
No machine translation, course content, clinical instruction changes, or writes of translated content to persistence.

## Verification and Completion Evidence

Reuse the existing content facade and canonical fixtures; test display outputs and unmodified startup/persistence inputs.
Run owned resolver/UI/browser tests, root typecheck, web depcruise/build, lint, line-length and implementation-scope checks.
Later Resolution must address TB-01–TB-12 with approval references, canonical parity evidence, and source-cache/race results.

## Resolution

Implemented and scoped verification completed 2026-10-12. **Implementation: done; orchestrator commit/review: pending.**
The user's 2026-10-11 authorization, recorded in the brief and seam map, approves all three bundled treatments
and drafted Hebrew UI copy as product content. It supersedes the official-content-pack/copy prerequisites for
this run. These assets do not claim therapeutic website authorship or publication provenance. Courses remain deferred.

- **TB-01:** All three approved IDs have frozen web-owned English source snapshots, source-language metadata,
  revision, permission/provenance, and complete English/Hebrew titles and three-unit assets. All rationales remain null.
  Source parity tests compare these literals to the independently imported canonical seed rows and parsed units.
- **TB-02:** Actual picker-to-Player Chromium cases show matching approved titles/guidance in both locales,
  preserve treatment/session/active-unit identities, and retain canonical startup IDs. Production first use remains Hebrew.
- **TB-03:** The pure resolver compares catalog/source title, ID, format and exact source representation, plus
  actual parsed IDs/order/titles/bodies/rationales. Changed body under identical IDs/count and real raw seed source rejects.
  Source validation never derives its expected snapshot from a live engine export.
- **TB-04:** Complete locale assets must preserve ordered unit IDs/count/order and rationale presence; partial,
  reordered, wrong-locale, unapproved and stale-revision assets reject the whole treatment display coherently.
- **TB-05:** Source fallback preserves canonical guidance and has required approved bilingual availability copy.
  Unknown source uses empty lang/auto dir; validated English fallback uses en/ltr; approved Hebrew uses he/rtl.
  Renamed rows, edited/personal identities and unavailable source metadata cannot claim approved display.
- **TB-06:** Empty actual units never gain guidance from an asset and keep existing startup/Player guards.
  Nonempty unit-0 retains canonical identity/body/parser title while its system heading follows the UI locale.
- **TB-07:** Picker validation reads only the three allowlisted candidates. The web source-metadata facade
  shares the repository source with the existing tab-scoped canonical cache; other catalog rows are not fetched.
  Locale selection causes no additional content read or network request. Null/rejected reads remain explicitly retryable.
- **TB-08:** Display-cache keys include treatment, validated revision and locale, with validation before cache hits.
  Delayed-read locale round trips and changed-treatment races use current identity/locale and invoke no advance/jump.
- **TB-09:** Existing ReactMarkdown safety, GFM and table scroller remain. A stable table component plus content
  metadata context retains table DOM through switching. Existing long-source card/table scroll assertions pass unchanged.
  Fallback notice follows guidance to preserve reading scroll when translated notice height changes.
- **TB-10:** Personal wording/source records stay unchanged. Overlays supply rendering fields only; startup sends
  canonical IDs, while existing engine actions own session/library/timeline/promotion data. Browser snapshot comparisons
  and existing persistence regressions pass; translated guidance is never supplied to any persistence action.
- **TB-11:** Resolver/provider/source-cache tests cover body/title/rationale/order/format/catalog changes, empty
  and Continuous Guidance, personal bypass, asset approval/completeness/revision, validation-before-cache and races.
  Browser tests exercise matching assets and stale/unavailable fallback through the actual utility selector.
- **TB-12:** Approved coverage is complete for all three treatments/two locales; no approval or coverage blocker.
  Implementation owns **22 web paths**; only this Resolution is outside web. No engine/adapter/contract/seed/migration,
  dependency/root-tooling, staging or commit changes.

Behavioral red→green evidence: picker/Player first rendered English instead of approved Hebrew; stale asset revision
was incorrectly accepted; a null source poisoned retry; metadata validation failure blanked canonical guidance; and
eight Chromium long-card cases shifted scrollTop by 28–56px when the notice changed locale. Their fixes pass without
weakened scroll thresholds or therapeutic assertions. Initial module-scaffold failure is separate from these behavior failures.

Verification:

- Full web: `npm run test --workspace=pic-web -- --maxWorkers=2` — **31 files / 229 tests**.
- Final asset/content/copy: `npx vitest run packages/pic-web/src/content-localization
  packages/pic-web/src/i18n/core-messages.test.ts --maxWorkers=1` — **4 files / 36 tests**.
- Affected Chromium: content-localization, localized-player, localized-inquiry-selection — **39 / 39**, worker 1.
  After asset line formatting/GFM restoration, owned content Chromium repeated cleanly: **11 / 11**.
- Scoped and root typechecks pass. Web depcruise passes: **746 modules / 1551 dependencies**.
  Production build, owned ESLint, 130-character scan and git diff check pass.
- Build retains the existing dynamic-import/chunk-size warnings. Sandbox Vitest EPERM temp renames and missing
  sandbox Chromium were reported as infrastructure failures and rerun with approved escalation; no TLS overrides/skips.

Owned additions are `src/content-localization/{approved-content,permission,treatment-1,treatment-2,treatment-3,
types,resolver,use-treatment-display,TreatmentPickerTitle}` with three test files, plus the content-localization
browser test/fixture. Integration touches AtomicUnitView, TreatmentPickerScreen, composition-root, the shared required
availability message, and existing web tests' explicit locale/validated-metadata expectations. Canonical guidance is
never parsed from translated Markdown, and locale/dictionary runtime modules still import no engine or adapter.

Real mobile keyboard/visual viewport changes, device cutouts, desktop zoom and Hebrew screen-reader pronunciation
remain unverified manually. Chromium covers the specified 320, 390, 768 and 1440px viewports; no Safari/Firefox claim.
