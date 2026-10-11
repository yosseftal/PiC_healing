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
