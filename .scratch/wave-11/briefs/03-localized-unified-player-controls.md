# Wave 11 Sub-Agent Execution Brief

## Identity

- Ticket: 11.3 — Localized Unified Player Controls
- Wave: 11
- Frozen ticket: .scratch/wave-11/issues/03-localized-unified-player-controls.md
- Orchestrator escalation: report conflicts or missing approval; do not guess.

## Permissions

- Read-Write: active ticket Resolution and owned implementation/tests inside packages/pic-web only.
- Owned surfaces: UnifiedPlayerScreen; AtomicUnitView accessibility/system titles; NavigationTreePanel; TerminalNemarUnit;
  FinishBar; Player copy/tests
- Read-Only: approved Wave 11 spec, CONTEXT.md, decisions.md, CLAUDE.md, engine/port/adapter source and sibling tickets.
- Off limits: all application changes outside packages/pic-web, including engines, adapters, migrations and root metadata.
- Work only on this ticket; do not implement a later ticket or alter frozen token/domain semantics.

## Frozen requirements (verbatim)

> Separate **language access** from **Player utility eligibility**. The Sheet trigger remains available while Player content
> is resolving, empty, or reconnecting. Those phases may expose language controls alone; do not expose Finish or navigation
> where the existing source-content guard prohibits them. This preserves the Zero-H3 behavior and global language access.

> Localize engine-origin **display labels** such as Continuous Guidance and unit states through explicit semantic mappings;
> preserve the raw domain enum values and canonical parser output. Preserve stable test IDs and automation identities.

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

All application, dictionary, styling, configuration, and UI test changes stay inside `packages/pic-web`.
Only this ticket markdown may be updated for later Resolution; spec and siblings remain read-only.
Zero edits to `packages/pic-engine`, adapters, migrations, domain enums/interfaces/tests, seeds, or root lockfile.
Do not change Player rules, rating behavior, auth, content parsing/caching, clinical instructions, or frozen motion tokens.

## Acceptance Criteria (checklist)

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

