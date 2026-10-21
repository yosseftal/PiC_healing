# Wave 11 Sub-Agent Execution Brief

## Identity

- Ticket: 11.7 — Approved Content Localization Overlay
- Wave: 11
- Frozen ticket: docs/waves/wave-11/tickets/07-approved-content-localization-overlay.md
- Orchestrator escalation: report conflicts or missing approval; do not guess.

## Permissions

- Read-Write: active ticket Resolution and owned implementation/tests inside packages/pic-web only.
- Owned surfaces: treatment-content-context; composition-root content read only; AtomicUnitView; picker display; web content
  assets/resolver/tests
- Read-Only: approved Wave 11 spec, CONTEXT.md, decisions.md, CLAUDE.md, engine/port/adapter source and sibling tickets.
- Off limits: all application changes outside packages/pic-web, including engines, adapters, migrations and root metadata.
- Work only on this ticket; do not implement a later ticket or alter frozen token/domain semantics.

## Frozen requirements (verbatim)

> Repository presence establishes shipped fixtures, not therapeutic authorship or official website provenance.
> Confirm which candidates qualify as official before approving assets. Do not label these titles as website terms.
> Do not expand the catalog to courses or arbitrary future protocols under this wave.

> Never reparse translated Markdown to determine session unit IDs or mutate the source cache. Render localized Markdown
> through the current renderer/table scroller with the same safety policy. Locale-specific display caching must include
> treatment ID, validated source revision, and locale; stale asynchronous results cannot replace a newer locale selection.

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

- See docs/waves/wave-11/audits/wave-11-seam-map.md for owned boundaries, upstream/downstream dependencies, and risks.
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

All content assets, implementation, dictionaries, styling, configuration, and UI tests stay inside `packages/pic-web`.
Only this ticket markdown may gain its later Resolution; the approved spec and sibling tickets remain read-only.
Zero edits to `packages/pic-engine`, Content Parser, adapters, RepositoryPort, migrations, canonical seeds/tests,
auth/account schemas, or root lockfile. No new server content-version contract, ownership schema, or snapshot model.
No machine translation, course content, clinical instruction changes, or writes of translated content to persistence.

## Acceptance Criteria (checklist)

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
