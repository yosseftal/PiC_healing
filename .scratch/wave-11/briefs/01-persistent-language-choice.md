# Wave 11 Sub-Agent Execution Brief

## Identity

- Ticket: 11.1 — Persistent Language Choice in the Player Drawer
- Wave: 11
- Frozen ticket: .scratch/wave-11/issues/01-persistent-language-choice.md
- Orchestrator escalation: report conflicts or missing approval; do not guess.

## Permissions

- Read-Write: active ticket Resolution and owned implementation/tests inside packages/pic-web only.
- Owned surfaces: src/i18n/**; App.tsx; TherapeuticFrame.tsx; therapeutic-sheet.tsx; UnifiedPlayerScreen.tsx; index.html;
  package.json; owned tests
- Read-Only: approved Wave 11 spec, CONTEXT.md, decisions.md, CLAUDE.md, engine/port/adapter source and sibling tickets.
- Off limits: all application changes outside packages/pic-web, including engines, adapters, migrations and root metadata.
- Work only on this ticket; do not implement a later ticket or alter frozen token/domain semantics.

## Frozen requirements (verbatim)

> - Reserve the independent versioned key `pic-web.locale.v1`, containing only `he` or `en`. Read/write failures are caught.
>   A failed write leaves the new in-memory locale active for this visit; no blocking banner or auth gate is introduced.

> - Keep the provider and all engine/content providers mounted across changes. Never key the application, screen, Sheet,
>   or active Atomic Unit by locale. Locale changes rerender presentation, not service construction or domain navigation.

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
- Hebrew UI copy remains blocked until the orchestrator supplies the user answer. Do not invent approval.
- Three bundled seed treatments may be translated as product-approved Wave 11 content per the 2026-10-11 user answer.
- Do not describe those seeds as official website publications; preserve provenance as product-approved content.
- Preserve English test expectations by explicit locale fixtures where appropriate; production first use remains Hebrew.
- Report changed paths, meaningful red/green evidence, per-criterion Resolution, tests, risks, and any remaining blocker.
- Do not stage or commit; the orchestrator reviews and commits each verified ticket before dispatching its successor.
- Stop after this ticket. No later-ticket edits, unsolicited broad refactors, test skips, or external publishing.

## Do Not Touch / Out of Scope (verbatim from ticket)

All implementation, styling, configuration, and UI tests stay inside `packages/pic-web`.
The active ticket markdown is the only planning-document write target during later resolution.
Zero edits to `packages/pic-engine`, adapters, RepositoryPort, migrations, seed content, domain tests, or root lockfile.
No new dependencies, content translations, course work, auth implementation, or engine-state mirror.
The approved spec and sibling tickets are read-only. Shared composition edits require coordinated ownership.

## Acceptance Criteria (checklist)

- [ ] TB-01: A real Player utility interaction changes `he`/RTL to `en`/LTR and back without reload or auth.
      Hebrew is selected on first use; valid saved locale is applied before the first visible application layout.
- [ ] TB-02: Missing, empty, malformed, or unsupported stored values resolve to Hebrew. Unavailable window/storage,
      read errors, and write/quota errors do not throw or prevent an in-memory language change.
- [ ] TB-03: The independent `pic-web.locale.v1` key stores only `he` or `en`; reload restores the selection.
      Selecting the current locale is a no-op. StrictMode does not cause duplicate domain work.
- [ ] TB-04: Document, TherapeuticFrame, and portalled Sheet expose matching `lang` and `dir` from one authority.
      Provider cleanup restores previous document metadata without altering viewport-lock ownership.
- [ ] TB-05: The selector is a labelled group of two native buttons with autonyms, per-label language/direction,
      and `aria-pressed`. Tab/Shift+Tab and Enter/Space work; no main-screen action or flag is added.
- [ ] TB-06: Selection keeps the Sheet open, retains button identity/focus and background inertness, and preserves
      existing Escape/overlay/close dismissal and trigger focus restoration. Targets are at least 44 x 44 CSS px.
- [ ] TB-07: Typed resolution supports selected locale, Hebrew then English fallback, declared interpolation/plurals,
      escaped inserted text, and actual-language fallback metadata. Raw keys/parameter tokens never reach the UI.
      Missing required approved keys are validation failures, not accepted runtime fallbacks.
- [ ] TB-08: No browser-language negotiation, account sync, or unsolicited cross-tab language change is introduced.
      The active tab keeps its locale; the next reload reads the latest saved preference.
- [ ] TB-09: Switching does not remount engines/screens/active units or invoke jump, response, Finish, reveal,
      promotion, or other therapeutic actions; current unit/session IDs and source-content cache remain stable.
- [ ] TB-10: Unit/integration tests exercise storage failures and resolution contracts; a browser test uses the
      real selector to prove switch, focus, metadata, and reload behavior. Scoped checks pass and scope is verified.

