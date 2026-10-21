# Wave 11 Sub-Agent Execution Brief

## Identity

- Ticket: 11.5 — Shared Inquiry, Summary, and Treatment Selection
- Wave: 11
- Frozen ticket: .scratch/wave-11/issues/05-shared-inquiry-summary-and-treatment.md
- Orchestrator escalation: report conflicts or missing approval; do not guess.

## Permissions

- Read-Write: active ticket Resolution and owned implementation/tests inside packages/pic-web only.
- Owned surfaces: JointTreatmentMuscleTestStep; SymptomGroupSummaryScreen; TreatmentPickerScreen; shared
  inquiry/summary/picker copy; owned tests
- Read-Only: approved Wave 11 spec, CONTEXT.md, decisions.md, CLAUDE.md, engine/port/adapter source and sibling tickets.
- Off limits: all application changes outside packages/pic-web, including engines, adapters, migrations and root metadata.
- Work only on this ticket; do not implement a later ticket or alter frozen token/domain semantics.

## Frozen requirements (verbatim)

> Adoption does not change route selection or form submission. Tertiary actions move to utilities when needed to keep
> the main action area within its existing two-choice contract.

> Translate complete messages, including Sheet close/content labels and state announcements. Avoid assembling phrases
> by concatenating English fragments or lowercasing a translated title. Interpolate names as escaped text and isolate them
> bidirectionally. Format any displayed counts/dates using the selected locale; persisted numbers and timestamps stay unchanged.

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

All implementation, dictionaries, styling, configuration, and UI tests stay inside `packages/pic-web`.
Only this ticket markdown may receive later Resolution; the spec and sibling tickets remain read-only.
Zero edits to `packages/pic-engine`, adapters, RepositoryPort, schemas/migrations, seed content, domain tests, or root lockfile.
No new inquiry rules, automatic linking, treatment content translation, source-parser changes, or auth/course workflows.
Shared layout is owned by 11.2; localized content overlays belong to 11.7.

## Acceptance Criteria (checklist)

- [ ] TB-01: Joint-treatment question, group summary, and treatment picker each render one bounded frame with
      shared Sheet language access in both locales. Switching keeps the current screen, focus context, and draft selection.
- [ ] TB-02: Approved full-message dictionaries cover each screen's headings, binary actions, summary/count forms,
      voluntary linking control, recovery/Zero-H3 states, and accessible names, with exact key/parameter/plural parity.
- [ ] TB-03: Joint-treatment response and group-finalization calls retain the same domain payloads and timing.
      Switching does not answer a question, finalize/split a group, or change derived routing facts.
- [ ] TB-04: Group/symptom names and other personal values remain unchanged, escaped, and bidirectionally isolated.
      Display counts use locale-appropriate forms; stored numbers and timestamps remain untouched.
- [ ] TB-05: Treatment selection retains the same catalog IDs, canonical parsed unit IDs, empty-source guard,
      and existing start-session action. UI localization never reparses translated labels into navigation identities.
- [ ] TB-06: Voluntary group linking is preserved across language changes, remains an EM choice, and is never
      silently enabled. Existing linked-group and standalone selection payloads are unchanged.
- [ ] TB-07: Main therapeutic actions remain within the two-choice contract. Long summaries/catalog content
      scroll internally; actual Hebrew/mixed labels preserve readable contrast, visible focus, and 44px minimum targets.
- [ ] TB-08: Recovery actions retain their meaning; in-flight reads/actions settling after selection display
      current-locale system messages with no duplicate calls, new clinical choices, or state reset.
- [ ] TB-09: Integration tests demonstrate joint testing through summary and picker into a canonical Player
      session using existing fixtures; switching alone invokes no therapeutic actions. Browser tests cover each adopted screen.
- [ ] TB-10: Approved dictionary coverage and scoped tests/checks pass, with a web-only implementation diff.
      The slice is complete without claiming translated treatment guidance before 11.7 lands.

