# Wave 11 Sub-Agent Execution Brief

## Identity

- Ticket: 11.6 — Persistence Gate Language Behavior
- Wave: 11
- Frozen ticket: docs/waves/wave-11/tickets/06-persistence-gate-language-behavior.md
- Orchestrator escalation: report conflicts or missing approval; do not guess.

## Permissions

- Read-Write: active ticket Resolution and owned implementation/tests inside packages/pic-web only.
- Owned surfaces: PersistenceGateModal; gate copy; gate unit/integration/browser tests
- Read-Only: approved Wave 11 spec, CONTEXT.md, decisions.md, CLAUDE.md, engine/port/adapter source and sibling tickets.
- Off limits: all application changes outside packages/pic-web, including engines, adapters, migrations and root metadata.
- Work only on this ticket; do not implement a later ticket or alter frozen token/domain semantics.

## Frozen requirements (verbatim)

>   Promotion, guest discard, and sign-in do not clear the independent preference or copy it into therapeutic records.

> Radix portal content is outside the frame's DOM subtree. Explicitly bind the same locale/direction to Sheet content
> and any other portalled dialogs; do not rely on frame inheritance. The Persistence Gate also consumes the same authority.

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

All application, dictionary, styling, configuration, and UI test changes stay inside `packages/pic-web`.
The active ticket may receive later Resolution; the approved spec and sibling tickets remain read-only.
Zero edits to `packages/pic-engine`, adapters, RPCs/migrations, auth schemas, domain tests, seed data, or root lockfile.
Do not implement auth providers, alter atomic promotion/idempotency, add account locale sync, or weaken existing gate tests.

## Acceptance Criteria (checklist)

- [ ] TB-01: Opening the existing gate after choosing either locale produces approved localized title/body,
      sign-in labels, pending/recovery messages, retry, and continue-without-saving actions.
- [ ] TB-02: The gate uses the same locale authority and correct `lang`/`dir`, even outside the Frame subtree.
      Accessible names and translated full messages update without remounting the gate or engine providers.
- [ ] TB-03: A locale update while the gate is mounted retains pending request, promotion state, inputs,
      guest work, and focus ownership; pending work settling afterward displays the current-locale system message.
- [ ] TB-04: Gate visibility, auth capability/disabled states, retry behavior, and action payloads retain their
      current semantics. Locale changes never request Finish, trigger auth/promotion, or discard guest work.
- [ ] TB-05: Successful promotion, sign-in, and explicit guest discard leave `pic-web.locale.v1` intact.
      No locale or direction field enters guest snapshots, promotion payloads, timeline events, or account records.
- [ ] TB-06: Preference read/write failure preserves in-memory localization without blocking gate actions
      or introducing a new error/confirmation flow; reload falls back according to 11.1's preference contract.
- [ ] TB-07: Both locales retain reachable keyboard controls, proper existing focus handoff, bounded internal
      overflow, 44 x 44 CSS px targets, readable AA contrast, and unchanged personal content.
- [ ] TB-08: Integration tests prove locale preservation across promotion/discard through existing fake/real
      action seams without implementing or contacting a new auth service. Browser cases cover idle/pending/recovery states.
- [ ] TB-09: All approved gate keys/parameters have parity; no raw key, placeholder, or unintended fallback ships.
      Existing auth stubs stay factually identified rather than being presented as completed production capabilities.
- [ ] TB-10: Scoped tests/checks pass, existing gate/domain behavior remains intact, and implementation is web-only.
