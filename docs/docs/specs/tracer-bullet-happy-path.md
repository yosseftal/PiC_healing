# Spec: PiC Tracer Bullet — Happy Path (Guest → Group → Standalone Treatment → Finish)

**Status:** Draft, ready for ticketing
**Scope boundary:** Excludes NEMAR diagnosis (Causes/Treatments Table selection logic) — that subsystem is
gated behind **GQ-020**, currently open in `docs/grill-backlog.md`. This spec covers everything a solo
Event Manager (EM) can do end-to-end *without* the Left/Right NEMAR inquiry: bootstrap a session, create a
Symptom Group, run one standalone treatment through the full Unified Player, and have that execution
durably recorded.

## Seam (confirm before ticketing)

The tracer bullet is greenfield — no application code exists yet, only `supabase/migrations/20260308164004_initial_schema.sql`
and the decision record. Per the manifesto's explicit constraint ("Strictly separate the PIC Logic Engine
from the UI Rendering Layer... the UI is a 'dumb' reflection of the engine"), this spec fixes **one seam**
as the highest-value, and only, seam for this effort:

> **`pic-engine` (pure, framework-agnostic TypeScript) ↔ everything else.**

Everything that is *state, transition, or business rule* — Unified Player state machine, Guest Mode /
Persistence Gate lifecycle, Symptom Group / symptom validation, PTL `use_count` and Timeline write rules —
lives inside `pic-engine` and is tested directly against that module, with zero DOM, zero React, zero
Supabase client import. Everything else (React components, the Supabase adapter, the local Guest store
adapter) is a thin, mechanically-generated reflection of engine state and is tested only at a thin
smoke-test layer (see **Testing Decisions**). This is the one seam this spec optimizes for; if it doesn't
match expectations, raise it before tickets are cut from this spec.

---

## Problem Statement

The EM (Event Manager) — the person doing self-healing work in PiC — currently has no way to *use* the
product at all. Every decision that makes the healing methodology (Symptom Groups, the Unified Player,
Guest Mode, Personal Treatment Library) real has been made (`decisions.md` DEC-004 through DEC-017), but
none of it has been built. Worse, the one subsystem still genuinely unresolved — the Causes/Treatments
Table schema that powers NEMAR diagnosis (**GQ-020**) — sits on the critical path of *every* plan that starts
"first build the diagnosis flow," even though the EM's core Value Moment (starting a Symptom Group, running
a treatment through the full Player experience with its mandatory Terminal NEMAR, and seeing it land in
their toolbox and timeline) does not actually depend on that schema at all.

Without a way to prove the architecture end-to-end on the *resolved* subset of decisions, the team risks
(a) waiting on GQ-020 before anything ships, and (b) discovering integration problems between Guest Mode,
the Persistence Gate, and the Unified Player only after the NEMAR subsystem is also half-built on top of a
shaky foundation.

## Solution

Build a **tracer bullet**: a thin, fully-wired vertical slice through the exact happy path an EM would
walk on their very first visit, using only decisions that are already resolved:

1. Land in the app with zero setup (**Guest Mode**, DEC-017) — no account, no server contact.
2. Create one **Symptom Group** with one or more named symptoms, each with an initial **Polarity**
   (DEC-012, DEC-009).
3. Choose one **standalone treatment** (a piece of Structured Markdown content, not diagnosed via NEMAR —
   e.g. hand-picked from a fixed seed list for this spike) and run it through the **Unified Player**:
   automatic visibility-based unit transitions, the **Navigation Tree** as the only manual jump mechanism,
   the mandatory **Terminal NEMAR** unit, and **Finish** (or the sovereign **[Finish Anyway]** bypass)
   (DEC-015).
4. Hit the **Persistence Gate** at Finish: authenticate (Social Auth or Magic Link) and have the Guest
   Group **promoted in place** to the new account — or close the tab and let it evaporate (DEC-017).
5. See the **Personal Treatment Library** row's `use_count` increment exactly once, and see a
   corresponding **Chronological Timeline** event, both anchored to `auth.uid()` (DEC-005, DEC-006, DEC-007,
   DEC-017).

The build is split at the seam above: `pic-engine` implements 1–5 as pure state and transition logic against
two swappable adapters (`LocalGuestRepository`, `SupabaseRepository`) behind one `RepositoryPort`; the Web
UI is the first, thin renderer of that engine, built so that a future Native renderer needs no changes to
`pic-engine` at all — only a new adapter and a new set of components.

## User Stories

**Guest Mode Bootstrap**

1. As an unauthenticated visitor, I want to open the app and start working immediately, so that nothing
   about creating an account stands between me and beginning my healing work.
2. As a Guest EM, I want my Symptom Group and Player progress to persist locally across a page reload
   within the same browser session, so that a refresh doesn't destroy work I haven't yet chosen to persist.
3. As a Guest EM, I want the app to work with no network requests until I explicitly reach a Persistence
   Gate moment, so that I can work in Flight Mode / poor connectivity from the very first screen.
4. As a Guest EM, I want it to be clear (via copy, not a blocking dialog) that my current work is temporary
   until I save it, so that I'm not surprised later when the Persistence Gate appears.
5. As a Guest EM who closes the tab without authenticating, I want my Guest Group to simply disappear with
   no server trace, so that I never wonder whether "anonymous" data about me exists somewhere.

**Symptom Group Initialization**

6. As an EM (Guest or authenticated), I want one screen dedicated to naming a new Symptom Group, so that
   creating a group is a single, unambiguous action (Atomic Focus).
7. As an EM, I want to add one or more symptoms to the group I'm creating, each with its own name, so that
   a group can represent multiple related symptoms treated together (e.g. lower back + neck).
8. As an EM, I want to set each symptom's initial Polarity (Positive or Negative) as part of adding it, so
   that the direction of the symptom's framing is recorded from the start (DEC-009).
9. As an EM, I want adding a second (or third) symptom to the same group to be a repeatable, one-at-a-time
   action rather than a multi-symptom form, so that I never lose Atomic Focus while building the group.
10. As an EM, I want to see the group I just created immediately, with its symptoms and their polarities
    listed, so that I have confirmation the group now exists before I move on.
11. As a Guest EM, I want group creation to work identically to an authenticated EM's, so that I don't
    discover feature gaps only after I've committed to an account.

**Standalone Treatment Selection (non-NEMAR)**

12. As an EM, I want to pick a standalone treatment directly from a simple list (not via diagnosis), so
    that I can exercise the Unified Player without depending on the not-yet-built NEMAR flow.
13. As an EM, I want the treatment I pick to be optionally linked to the Symptom Group I just created, so
    that the Smart-Linking and timeline association behavior can be exercised end-to-end (DEC-008), while
    understanding that linking is fully optional per Smart-Linking's "intentional, never automatic" rule.

**Unified Player Execution**

14. As an EM, I want the treatment's content rendered one Atomic Unit at a time, so that I'm never
    overwhelmed by the full protocol at once (Atomic Focus, DEC-015 §1).
15. As an EM, I want a unit to automatically register as "in view" the moment it renders, with no button to
    press, so that my progress tracking never interrupts my actual healing work (DEC-015 §2).
16. As an EM, I want navigating to the next unit to automatically mark the previous one `completed`, so
    that completion is a side effect of moving forward, not a separate declaration.
17. As an EM, I want a Navigation Tree showing every unit in the treatment, so that I can jump to any part
    of the protocol at any time without hunting for a "skip" button that doesn't exist (DEC-015 §7a).
18. As an EM, I want jumping forward past several units via the tree to mark those intermediate units
    `skipped` (not `completed`), so that the system accurately reflects that I bypassed them rather than
    engaged with them.
19. As an EM, I want to jump backward to a `skipped` unit, engage with it, and move forward again, so that
    it "upgrades" to `completed` without any penalty or duplicate success side effect (DEC-015 §7a upgrade
    path).
20. As an EM, I want to jump backward to a `completed` unit purely to re-read it, so that "revisiting" is
    always safe and never reverts state or success metadata (DEC-015 §5).
21. As an EM, I want to close the app while a unit is only "in view" (not yet navigated past), so that on
    return that unit is still `unseen`/`skipped` as appropriate, never silently `completed`.
22. As an EM, I want the very last unit in every treatment to be a mandatory **Terminal NEMAR** ("Is it
    NEMAR that this treatment ended successfully?"), so that the muscle-test closing ritual is never
    skippable by content design (DEC-015 §7b).
23. As an EM who answers "Yes" to the Terminal NEMAR, I want a standard **[Finish]** button to appear, so
    that I can declare success and close out the session.
24. As an EM who answers "No" to the Terminal NEMAR, I want the session to be marked **Integrating** (never
    "Failed" or "Incomplete") and to still see a **[Finish Anyway]** option, so that my sovereignty over my
    own process is never overridden by a muscle-test result (DEC-015 §4, §7b).
25. As an EM, I want [Finish Anyway] to always be available regardless of unit states or Terminal NEMAR
    response, so that I remain the sovereign director of when my session ends.

**Persistence Gate & Promotion**

26. As a Guest EM who presses [Finish] or [Finish Anyway], I want to be prompted to authenticate at exactly
    that moment (not before), so that I only face the account question once I have something worth saving
    (DEC-017 §2).
27. As a Guest EM at the Persistence Gate, I want to authenticate via Social Auth (Apple/Google) or a Magic
    Link, so that I have low-friction options appropriate to my device.
28. As a Guest EM who successfully authenticates at the gate, I want my Guest Group (with its symptoms,
    Player session, and pending Finish) promoted in place to my new account with no visible re-entry of
    data, so that authenticating feels like "saving," not "starting over."
29. As a Guest EM who declines to authenticate at the gate, I want my in-progress Finish to simply not
    persist (the Guest Group evaporates on close), so that there's no partial, owner-less server state.
30. As an already-authenticated EM, I want to reach the exact same Finish flow with no Persistence Gate
    interruption at all, so that returning EMs never see friction that only applies to first-time Guests.

**Library & Timeline Write**

31. As an EM whose Finish (or Finish Anyway) succeeds, I want the treatment's Personal Treatment Library
    row to have its `use_count` incremented by exactly one, so that my toolbox reflects real usage without
    double-counting (DEC-005, DEC-006 §5).
32. As an EM running a treatment for the very first time, I want a new Personal Treatment Library row to be
    created automatically (with correct provenance) rather than requiring me to add it manually first, so
    that my toolbox grows organically from what I actually do.
33. As an EM, I want a Timeline event to be written for this execution, linking to the Personal Treatment
    Library entry (not a content snapshot), so that reviewing this event later always renders the library
    entry's current state (DEC-015 §4, DEC-016 §5).
34. As an EM, I want the Timeline event to carry a `log_type` (e.g. `treatment_execution`) so that it can be
    filtered alongside other event types later without special-casing (DEC-007 §3).
35. As an EM, I want every write from this flow — Symptom Group, Player session, Library row, Timeline
    event — to be anchored to my `auth.uid()` once promoted, and to live nowhere on a server before that
    point, so that data sovereignty is never ambiguous (DEC-017).

## Implementation Decisions

### A. Modules

- **`pic-engine`** (new package, framework-agnostic TypeScript, zero React/Supabase imports at its core):
  - `SessionEngine` — Guest Mode bootstrap, Persistence Gate trigger detection, promotion orchestration.
  - `GroupEngine` — Symptom Group / symptom creation and validation (name, polarity).
  - `PlayerEngine` — the Unified Player flat 4-state machine: unit state transitions, Navigation Tree
    forward/backward logic, Terminal NEMAR gating, Finish / Finish Anyway.
  - `LibraryEngine` — `use_count` increment rule (Finish-only, exactly-once), first-execution row creation.
  - `TimelineEngine` — event construction (`log_type`, links, no snapshot).
  - `RepositoryPort` — the one interface all engines depend on for persistence (`getGroup`, `saveGroup`,
    `getPlayerSession`, `savePlayerSession`, `getOrCreateLibraryRow`, `incrementUseCount`, `appendTimelineEvent`,
    `promoteGuestToAccount`). No engine imports a concrete adapter.
- **`pic-adapter-local-guest`** — implements `RepositoryPort` against an in-memory/`localStorage`-backed
  store. No network calls. This is what Guest Mode runs against.
- **`pic-adapter-supabase`** — implements `RepositoryPort` against Supabase Postgres/Auth, always scoped by
  `auth.uid()`.
- **`pic-web`** — React app. Owns routing/screens and renders `pic-engine` state via `useSyncExternalStore`
  or equivalent; contains no business logic — every conditional a component renders is a read of engine
  state, never a re-derivation of it. Selects the adapter at startup (local-guest until promotion, then
  Supabase) and hands it to the engine layer; components never import an adapter directly.
- **Future `pic-native`** (out of scope to build, in scope to not preclude): would reuse `pic-engine` and
  `pic-adapter-supabase` unchanged, adding only a native-storage `RepositoryPort` implementation and native
  components. This spec's module boundary is what makes that a zero-engine-change addition later.

### B. Data Schema

**Guest store (local-only, `pic-adapter-local-guest`, no `user_id`, never in Supabase):**
- `guest_group`: `id` (client UUID), `name`, `symptoms: [{ id, name, polarity: 'positive' | 'negative' }]`,
  `created_at`.
- `guest_player_session`: `id`, `treatment_id`, `linked_group_id` (nullable), `units: [{ unit_id, state:
  'unseen' | 'in_view' | 'skipped' | 'completed' }]` (`in_view` never persisted, computed at read time),
  `terminal_nemar_response: 'yes' | 'no' | null`, `finished_at: timestamp | null`,
  `integrating_reason: 'mid_exit' | 'terminal_nemar_no' | null`.

**Supabase schema (extends `supabase/migrations/20260308164004_initial_schema.sql`; all RLS via
`auth.uid()` per DEC-017):**
- `profiles` — already migrated; this spec adds no new columns beyond DEC-017's `id`, `email`,
  `consent_timestamp`, `role`, `last_server_auth_at` (deletion fields out of scope for this spike).
- `symptom_groups` — already migrated (`id`, `user_id`, `name`, `created_at`); this spec adds no columns.
- `symptoms` — extend the existing table with `polarity` (`enum: 'positive' | 'negative'`, not null); the
  existing `inquiry_prompts` column is unused by this spike (NEMAR-only) and left as-is.
- `treatments` (new, minimal seed table for this spike only — **not** the full Treatments Table that
  GQ-020 will define): `id`, `title`, `structured_markdown` (Structured Markdown source, H3 = Atomic Unit),
  `content_format` (`'structured_markdown'`), seeded with a handful of fixed rows so the Player has
  something real to run. Explicitly a placeholder: GQ-020's resolution will define the production
  Treatments Table this seed table is superseded by.
- `player_sessions` (new): `id`, `user_id`, `treatment_id`, `linked_group_id` (nullable FK to
  `symptom_groups`), `units` (jsonb: `[{unit_id, unit_order, state, unit_title}]`, `in_view` never
  persisted here either), `terminal_nemar_response`, `success_declared` (bool, set only by Finish),
  `integrating_reason` (`'mid_exit' | 'terminal_nemar_no'`, nullable), `finished_at` (nullable timestamp),
  `created_at`.
- `personal_treatment_library` (new): `id`, `user_id`, `treatment_id` (FK), `use_count` (int, default 0),
  `provenance` (jsonb, e.g. `{source: 'standalone_player', first_seen_at}`), `variant_type`
  (`'original'` for this spike — `'course_extracted'` / `'personal'` are out of scope), `global_reference_id`
  (FK to `treatments.id`, null only for future `'personal'` rows), `protocol_content` (null for this
  spike — Pointer state only; Lazy Flip / Hard Copy editing is out of scope), `created_at`.
- `timeline_events` (new): `id`, `user_id`, `log_type` (`'treatment_execution'` for this spike; enum left
  open for future types per DEC-007 §3), `treatment_id` (nullable), `library_row_id` (nullable FK),
  `linked_group_id` (nullable FK — Smart-Link per DEC-008), `metadata` (jsonb), `created_at`.

All four new tables get `alter table ... enable row level security;` and a
`create policy ... using (auth.uid() = user_id)` policy, matching the existing migration's pattern exactly.

### C. Unified Player State Machine (implemented in `PlayerEngine`, DEC-015)

- **States (flat enum):** `unseen`, `in_view` (ephemeral, never persisted), `skipped`, `completed`.
- **Transitions:** `unseen → in_view` on render; `in_view → completed` on navigate-forward;
  `unseen → skipped` on Navigation-Tree forward jump (applies to every intermediate unit between current
  and target); `skipped → in_view → completed` on revisit-then-advance ("upgrade," no duplicate side
  effects).
- **Navigation Tree is the only manual jump mechanism** — `PlayerEngine` exposes exactly one navigation
  entry point (`jumpTo(unitId)`) plus an implicit `advance()` triggered by rendering the next unit in
  sequence; there is no `skip()` API and no component may implement one.
- **Terminal NEMAR** is a regular Atomic Unit (last in sequence, always injected by `PlayerEngine` even if
  the seed content forgets it) whose only special behavior is: `response === 'yes'` unlocks `finish()`,
  `response === 'no'` sets `integrating_reason = 'terminal_nemar_no'` but does not block `finishAnyway()`.
- **`finish()` / `finishAnyway()`** are the only two calls that set `success_declared = true`,
  `finished_at`, and trigger the one-time side effects in §D below. Every other engine call is pure state
  transition with no side effects outside the Player session itself.
- **Exactly-once side effects:** `PlayerEngine` calls `LibraryEngine.recordUse(treatmentId)` and
  `TimelineEngine.recordExecution(...)` exactly once per `finish()`/`finishAnyway()` call, never on
  revisiting an already-`success_declared` session (DEC-006 §5).

### D. Guest Mode / Persistence Gate (implemented in `SessionEngine`, DEC-017)

- App boot: `SessionEngine` starts against `pic-adapter-local-guest` with no network call, unconditionally.
- The Persistence Gate is not a screen the EM can navigate to directly — it is a side effect
  `SessionEngine` triggers only when `PlayerEngine.finish()`/`finishAnyway()` is about to run its one-time
  side effects (§C) and the current adapter is still `local-guest`.
- On successful auth, `SessionEngine.promote(guestState, newUserId)` writes the Guest Group, Player
  session, Library row, and Timeline event to `pic-adapter-supabase` in one logical operation (a single
  Postgres transaction via an RPC/edge function, not four separate client calls, to avoid a partial
  promotion), then swaps the active adapter for the rest of the app session.
- On decline/close, nothing is written; the in-memory/`localStorage` Guest state is simply abandoned (or
  explicitly cleared) — no server contact ever happened.

### E. UI Component Hierarchy (Web, `pic-web`; each screen = one Atomic Focus action)

```
App
├── GuestModeShell                     (mounts SessionEngine against local-guest adapter on boot)
│   └── PersistenceGateModal           (renders only when SessionEngine signals gate-triggered)
├── SymptomGroupCreateScreen           (name input → confirm; one action)
│   └── SymptomAddStep                 (repeatable: name + polarity toggle; one symptom per pass)
├── SymptomGroupSummaryScreen          (read-only confirmation of what GroupEngine just created)
├── TreatmentPickerScreen              (flat seed list; optional "link to group" toggle)
└── UnifiedPlayerScreen
    ├── AtomicUnitView                 (renders exactly one unit's unit_content; triggers in_view)
    ├── NavigationTreePanel            (the only jump affordance; calls jumpTo(unitId))
    ├── TerminalNemarUnit              (Yes/No; a specialization of AtomicUnitView, not a separate screen)
    └── FinishBar                      ([Finish] xor [Finish Anyway], computed from PlayerEngine state)
```

No component holds `useState` for anything derivable from `pic-engine` (unit states, gate-triggered flag,
`use_count`); each subscribes to the engine and re-renders on its emitted state, keeping the "dumb
reflection" property testable by inspection, not convention.

### F. Explicitly Out of Scope for GQ-020 (documented here so it isn't silently reintroduced)

- No Causes Table, no Treatments Table beyond the flat seed `treatments` rows above, no Left/Right NEMAR
  path, no "diagnosed cause" entity. `TreatmentPickerScreen` is a flat list precisely so the spike never
  needs a diagnosis engine.
- The seed `treatments` table is a throwaway fixture, not a migration path — when GQ-020 resolves, its
  production schema replaces this table; `player_sessions.treatment_id` should be designed to point at
  whatever GQ-020 lands on with minimal churn (a stable UUID FK, no denormalized fields copied from the
  seed table).

## Testing Decisions

- **Primary seam, primary test target:** `pic-engine`'s public API (`SessionEngine`, `GroupEngine`,
  `PlayerEngine`, `LibraryEngine`, `TimelineEngine`) is tested directly, in-process, against a fake
  in-memory `RepositoryPort` implementation — no DOM, no React, no real Supabase. This is the highest, and
  intended to be close to the *only*, place business-rule tests live. Prior art: none yet in this
  greenfield repo — this spike establishes the pattern.
- **What "good test" means here:** assert on `RepositoryPort` calls and returned/emitted engine state
  (e.g. "after `finish()`, `incrementUseCount` was called exactly once and `success_declared === true`"),
  never on internal private fields or on which functions were called in which order beyond what the
  `RepositoryPort` contract exposes. Tests must survive a full internal rewrite of `PlayerEngine` as long
  as the port contract and emitted state shape are honored.
- **Contract tests, run against both adapters:** one shared test suite asserts `RepositoryPort` behavior
  (e.g. "`incrementUseCount` is idempotent under retry," "`promoteGuestToAccount` moves all four entities
  atomically") and is run once against `pic-adapter-local-guest` and once against `pic-adapter-supabase`
  (the latter against a local Supabase instance via `supabase start`, not a mocked client) — this is what
  guarantees Web/Native parity without duplicating business-rule tests per adapter.
- **UI layer:** thin smoke tests only (one per screen: "renders without throwing given engine state X,
  calls the right engine method on the one action it exposes"). No business-rule assertions belong at this
  layer — if a UI test needs to assert on `use_count` math, that's a signal the rule leaked out of
  `pic-engine`.
- **State-machine coverage (drives TDD red-green order):** every transition listed in §C above gets its own
  test before implementation, including the two non-obvious "past-state" cases DEC-015 flags explicitly:
  revisiting a `completed` unit doesn't revert it, and jumping backward to a `skipped` unit then advancing
  upgrades it to `completed` without a duplicate `use_count` increment.
- **Guest→Promotion is the highest-risk integration point** and gets an explicit end-to-end test: build a
  full Guest state (group + finished player session), call `promote()`, assert all four Supabase rows exist
  correctly `user_id`-scoped and the local Guest state is gone — this is the test most likely to catch a
  partial-write bug before it becomes a data-sovereignty incident.

## Out of Scope

- NEMAR diagnosis: Causes Table, Treatments Table (production schema), Left/Right path muscle testing,
  Atomic Discovery, diagnosed-cause lifecycle — all of **GQ-020**, unaffected by this spec.
- Freemium/entitlement gating (**GQ-014**), Intensity rating scale and blind re-rating UX (**GQ-021** —
  this spike creates symptoms with Polarity only, no Intensity input), Library Sync/first-execution
  matching across courses (**GQ-022** — no courses exist in this spike), CMS/content governance
  (**GQ-023**), offline sync conflict resolution (**GQ-016**), practitioner/reciprocity access
  (**GQ-026**).
- Account deletion (Verified Sovereign Choice, Immediate/Safe Delete) — DEC-017 §6 is out of scope for this
  spike; only Guest bootstrap and promotion are in scope.
- Biometric unlock / 30-day offline grace window (DEC-017 §4) — deferred; this spike's Guest Mode already
  covers the offline story that matters for the tracer bullet.
- Manual `use_count` edit from the Library screen (DEC-007 §2) — only the automatic Finish-triggered
  increment is in scope.
- Smart-Link suggestion prompts, unlinking UI, and multi-group linking (DEC-008) — this spec allows *one*
  optional link at treatment-pick time only; the full Smart-Linking surface is future work.
- Reflection Prompt Atomic Unit type, `unit_rationale` "info" affordance (DEC-015 §7, §9–9a) — the seed
  treatment content for this spike can omit blockquotes and reflection units entirely; the parser should
  not error if they're absent, but building the affordance UI is not required to prove the tracer bullet.
- Native app implementation — only the module boundary that makes it a low-risk future addition.

## Further Notes

- This spec deliberately treats the seed `treatments` table as disposable scaffolding, not a step toward
  GQ-020's resolution — resist the temptation to grow it in place once NEMAR work starts; replace it.
- The single highest-value proof this tracer bullet is designed to produce isn't any one screen — it's that
  `pic-engine` can be fully exercised, and fully trusted, without ever booting `pic-web` or Supabase. If
  that property breaks down during implementation (business logic creeping into components, or into
  Supabase RPC functions instead of `pic-engine`), treat it as a spec violation worth stopping for, not a
  minor implementation detail.
- Recommend ticketing order (via `/to-tickets`) follows the module list in §A roughly bottom-up:
  `RepositoryPort` contract + fake → `GroupEngine` → `PlayerEngine` (largest ticket, may want its own
  split by state-machine section) → `LibraryEngine`/`TimelineEngine` → `SessionEngine` (Guest/Promotion,
  depends on all four) → `pic-adapter-local-guest` → `pic-adapter-supabase` (+ migration) → `pic-web`
  screens (can start once the engine ticket they render is closed, in parallel with adapter work).
