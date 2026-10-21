# Wave 11 Sub-Agent Execution Brief

## Identity

- Ticket: 11.4 — Symptom Group Creation and Blind Rating
- Wave: 11
- Frozen ticket: docs/waves/wave-11/tickets/04-symptom-group-creation-and-blind-rating.md
- Orchestrator escalation: report conflicts or missing approval; do not guess.

## Permissions

- Read-Write: active ticket Resolution and owned implementation/tests inside packages/pic-web only.
- Owned surfaces: SymptomGroupCreateScreen; SymptomAddStep; RatingControl; group/symptom/rating copy; owned tests
- Read-Only: approved Wave 11 spec, CONTEXT.md, decisions.md, CLAUDE.md, engine/port/adapter source and sibling tickets.
- Off limits: all application changes outside packages/pic-web, including engines, adapters, migrations and root metadata.
- Work only on this ticket; do not implement a later ticket or alter frozen token/domain semantics.

## Frozen requirements (verbatim)

>   It must not reveal a hidden prior rating, reinitialize a rating draft, or call a therapeutic action.

> Add the same language utility section to each screen's Sheet. The current Player drawer already owns Navigation Tree
> and Finish Anyway; share the language section rather than duplicating it. Earlier screens need a thin composition with
> one TherapeuticFrame, bounded content, and a Sheet trigger. Do not nest a second frame around the Player.

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

All implementation, dictionaries, styling, configuration, and UI tests stay inside `packages/pic-web`.
Only the active ticket markdown may gain its later Resolution; spec and sibling tickets remain read-only.
Zero edits to `packages/pic-engine`, adapters, schemas/migrations, domain interfaces/tests, seeds, or root lockfile.
No inferred clinical answers, new rating rules, automatic reveal, mandatory writing gate, or ownership changes.
Shared primitive changes remain owned by 11.2 and require coordination rather than duplicate local implementations.

## Acceptance Criteria (checklist)

- [ ] TB-01: Group-name creation and symptom-add/rate screens each have one bounded TherapeuticFrame,
      internal content scrolling, and a Sheet language selector; no nested full-height frame or document scrolling.
- [ ] TB-02: Both locales cover visible headings, labels, placeholders, actions, recovery states, accessible names,
      and symptom-count plural forms. Format display values only; domain values and timestamps remain unchanged.
- [ ] TB-03: Switch languages while editing group/symptom names and rating inputs. Drafts, active entity identities,
      polarity/intensity values, and form state survive; personal text is never passed through a translation dictionary.
- [ ] TB-04: Personal names use appropriate automatic-direction/isolation markup without altering stored strings
      or injecting bidi control characters into data. Hebrew/English/mixed names remain readable in either locale.
- [ ] TB-05: Prior polarity and intensity remain hidden by default. Selection never calls reveal or re-rating,
      resets a draft, or exposes history; an explicit reveal already chosen by the EM remains their choice.
- [ ] TB-06: The existing create/add/rate actions receive the same payload values and retain their submission,
      validation, and progression behavior. Polarity stays independent of intensity; counts remain derived.
- [ ] TB-07: The primary action area exposes at most two direct choices; tertiary utilities do not crowd it.
      Keyboard form behavior, Sheet focus restoration, and recovery affordances remain reachable in both locales.
- [ ] TB-08: Actual Hebrew and long labels wrap within the card; actionable targets remain at least 44 x 44 CSS px,
      AA contrast/focus visibility is preserved, and no clipping is hidden by smaller typography.
- [ ] TB-09: Integration tests demonstrate creation through symptom addition/rating, mid-draft switching,
      preserved hidden/revealed history, and zero action calls from selection. Browser tests prove phone containment.
- [ ] TB-10: Approved key/plural/parameter parity and all scoped checks pass; no personal data or engine state is
      rewritten by localization. The completed slice can be demonstrated independently of 11.5 using existing fixtures.
