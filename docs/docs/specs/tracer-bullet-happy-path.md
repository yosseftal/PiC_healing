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

## Architect's Review of Five Requested Refinements

Before integrating these into the body below, a straight assessment of each — including one partial
objection, as requested.

1. **Joint Treatment Muscle Test — agreed, no conflict.** This is Symptom Group *formation* logic
   (DEC-002, README §4: "list symptoms, then a joint treatment muscle test — keep together when the test
   allows; split into separate groups only when it does not"), not diagnosis. It's structurally identical
   to the Terminal NEMAR already in the Player — one yes/no muscle-test question — and has zero dependency
   on the Causes/Treatments Table. It costs one Atomic Unit of complexity and materially improves
   methodology fidelity. Integrated below, with the actual splitting flow left out of scope exactly as you
   proposed.
2. **Atomic Promotion as a single transaction — agreed, already implicit, now a hard requirement.** The
   original draft already said "one logical operation... not four separate client calls"; this refinement
   promotes that from a design note to an explicit, testable requirement with idempotency and rollback
   behavior spelled out, since a partial promotion (e.g. a `symptom_group` written but the `timeline_event`
   lost) is the single highest-risk sovereignty bug this spike could ship.
3. **Intensity Magnitude — partial objection, flagged for the record.** DEC-010 (Polarity and Intensity as
   independent dimensions) is settled, and the *schema* should reflect that from day one — I'm implementing
   that outright, no objection. But the *scale semantics* — whether higher intensity reads as "worse," as
   "more sensation regardless of valence," or as "closer to healed" — and whether blind-rating defaults
   apply to it, is **GQ-021**, still an *open* grill question that `docs/grill-backlog.md` itself says
   blocks "all rating screen design." Shipping a 0–10 slider with asserted semantics right now means this
   tracer bullet quietly *pre-decides* GQ-021 instead of proving already-resolved architecture — the exact
   trap this spec otherwise avoids by excluding GQ-020.
   **Alternative that satisfies the underlying goal (validate the growth-tracking data model early) without
   that risk:** implement the schema as fully independent `polarity` / `intensity` fields per DEC-010 (no
   compromise there), and implement the UI slider using **Path A1 — Absolute Magnitude**, the backlog's own
   *Recommended* candidate for GQ-021 — but label it explicitly, in this spec and in the code comment at the
   slider component, as a **provisional working hypothesis this spike is gathering evidence for**, not a
   shipped product decision. A line has also been added back to `docs/grill-backlog.md`'s GQ-021 entry
   pointing at this spike, so the eventual grill session treats the spike's outcome as input, not as a
   fait accompli that quietly closed the question. This is the version integrated below.
4. **Stable UUIDs — agreed, trivial, already almost true.** The original draft already used
   `gen_random_uuid()`-style UUID primary keys by convention (matching the existing migration). This
   refinement makes it an explicit, checked requirement rather than an implicit one and names exactly which
   downstream columns depend on it.
5. **Net effect on the seam:** none of the four accepted refinements introduce a new top-level module or
   cross the `pic-engine` / UI boundary — they extend `GroupEngine` (muscle test, intensity), `SessionEngine`
   (promotion transaction), and the seed schema (UUIDs) in place.

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
2. Create one **Symptom Group** with one or more named symptoms, each with an initial **Polarity** and
   **Intensity** (DEC-012, DEC-009, DEC-010), then confirm the group via a **Joint Treatment Muscle Test**
   (DEC-002, README §4) before it's finalized.
3. Choose one **standalone treatment** (a piece of Structured Markdown content, not diagnosed via NEMAR —
   e.g. hand-picked from a fixed seed list for this spike) and run it through the **Unified Player**:
   automatic visibility-based unit transitions, the **Navigation Tree** as the only manual jump mechanism,
   the mandatory **Terminal NEMAR** unit, and **Finish** (or the sovereign **[Finish Anyway]** bypass)
   (DEC-015).
4. If the treatment was linked to the Symptom Group, see a **Smart-Link rating suggestion** at the Terminal
   NEMAR / post-Finish moment offering to re-rate the linked symptom's **Polarity and Intensity** — closing
   the feedback loop with "the Center" (DEC-009 §4, DEC-010).
5. Hit the **Persistence Gate** at Finish: authenticate (Social Auth or Magic Link) and have the Guest
   Group **promoted in place**, atomically, to the new account — or close the tab and let it evaporate
   (DEC-017).
6. See the **Personal Treatment Library** row's `use_count` increment exactly once, and see a
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
8. As an EM, I want to set each symptom's initial Polarity (Positive or Negative) and Intensity (0–10) as
   part of adding it, in one combined rating action, so that the direction and magnitude of the symptom's
   current state are both recorded from the start without feeling like two separate steps (DEC-009,
   DEC-010 §2).
9. As an EM, I want adding a second (or third) symptom to the same group to be a repeatable, one-at-a-time
   action rather than a multi-symptom form, so that I never lose Atomic Focus while building the group.
10. As an EM, I want to see the group I just created immediately, with its symptoms, polarities, and
    intensities listed, so that I have confirmation the group now exists before I move on.
11. As a Guest EM, I want group creation to work identically to an authenticated EM's, so that I don't
    discover feature gaps only after I've committed to an account.
12. As an EM who has finished listing the symptoms for a new group, I want to be asked a single **Joint
    Treatment Muscle Test** question ("Is it NEMAR to treat these symptoms together?") before the group is
    finalized, so that group formation follows the actual methodology rather than an arbitrary UI grouping
    (DEC-002, README §4).
13. As an EM whose Joint Treatment Muscle Test answer is "Yes," I want the group to finalize immediately
    with no further steps, so that the common case stays a single Atomic Focus action.
14. As an EM whose Joint Treatment Muscle Test answer is "No," I want to see a clear, non-blocking
    suggestion that these symptoms may heal better as separate groups, so that I'm informed by the
    methodology even though this spike doesn't yet build the actual splitting flow.
15. As an EM, I want the "No" suggestion to never force me to split — I can finalize the group as one unit
    anyway if I choose — so that the muscle test informs rather than overrides my sovereignty over how I
    organize my own healing work.

**Standalone Treatment Selection (non-NEMAR)**

16. As an EM, I want to pick a standalone treatment directly from a simple list (not via diagnosis), so
    that I can exercise the Unified Player without depending on the not-yet-built NEMAR flow.
17. As an EM, I want the treatment I pick to be optionally linked to the Symptom Group I just created, so
    that the Smart-Linking and timeline association behavior can be exercised end-to-end (DEC-008), while
    understanding that linking is fully optional per Smart-Linking's "intentional, never automatic" rule.

**Unified Player Execution**

18. As an EM, I want the treatment's content rendered one Atomic Unit at a time, so that I'm never
    overwhelmed by the full protocol at once (Atomic Focus, DEC-015 §1).
19. As an EM, I want a unit to automatically register as "in view" the moment it renders, with no button to
    press, so that my progress tracking never interrupts my actual healing work (DEC-015 §2).
20. As an EM, I want navigating to the next unit to automatically mark the previous one `completed`, so
    that completion is a side effect of moving forward, not a separate declaration.
21. As an EM, I want a Navigation Tree showing every unit in the treatment, so that I can jump to any part
    of the protocol at any time without hunting for a "skip" button that doesn't exist (DEC-015 §7a).
22. As an EM, I want jumping forward past several units via the tree to mark those intermediate units
    `skipped` (not `completed`), so that the system accurately reflects that I bypassed them rather than
    engaged with them.
23. As an EM, I want to jump backward to a `skipped` unit, engage with it, and move forward again, so that
    it "upgrades" to `completed` without any penalty or duplicate success side effect (DEC-015 §7a upgrade
    path).
24. As an EM, I want to jump backward to a `completed` unit purely to re-read it, so that "revisiting" is
    always safe and never reverts state or success metadata (DEC-015 §5).
25. As an EM, I want to close the app while a unit is only "in view" (not yet navigated past), so that on
    return that unit is still `unseen`/`skipped` as appropriate, never silently `completed`.
26. As an EM, I want the very last unit in every treatment to be a mandatory **Terminal NEMAR** ("Is it
    NEMAR that this treatment ended successfully?"), so that the muscle-test closing ritual is never
    skippable by content design (DEC-015 §7b).
27. As an EM who answers "Yes" to the Terminal NEMAR, I want a standard **[Finish]** button to appear, so
    that I can declare success and close out the session.
28. As an EM who answers "No" to the Terminal NEMAR, I want the session to be marked **Integrating** (never
    "Failed" or "Incomplete") and to still see a **[Finish Anyway]** option, so that my sovereignty over my
    own process is never overridden by a muscle-test result (DEC-015 §4, §7b).
29. As an EM, I want [Finish Anyway] to always be available regardless of unit states or Terminal NEMAR
    response, so that I remain the sovereign director of when my session ends.

**Feedback Loop: Post-Treatment Rating**

30. As an EM whose treatment was linked to a Symptom Group, I want to be offered the chance to re-rate the
    linked symptom's Polarity and Intensity right after the Terminal NEMAR, so that the feedback loop
    between "doing the work" and "checking the body's current state" closes within the same sitting
    (DEC-009 §4 Smart-Link suggestion).
31. As an EM offered a post-treatment rating suggestion, I want it to be a clearly optional, dismissible
    prompt — never a gate in front of Finish — so that the Player's "no validation gates" principle
    (DEC-015 §3) is never violated by a rating suggestion.
32. As an EM, I want the post-treatment Intensity slider to behave identically to the one I used during
    group creation (same 0–10 range, same Absolute-Magnitude semantics), so that a rating means the same
    thing regardless of when I take it.

**Persistence Gate & Promotion**

33. As a Guest EM who presses [Finish] or [Finish Anyway], I want to be prompted to authenticate at exactly
    that moment (not before), so that I only face the account question once I have something worth saving
    (DEC-017 §2).
34. As a Guest EM at the Persistence Gate, I want to authenticate via Social Auth (Apple/Google) or a Magic
    Link, so that I have low-friction options appropriate to my device.
35. As a Guest EM who successfully authenticates at the gate, I want my Guest Group (with its symptoms,
    Player session, and pending Finish) promoted in place to my new account with no visible re-entry of
    data, so that authenticating feels like "saving," not "starting over."
36. As a Guest EM whose promotion is interrupted mid-write (e.g. network drop after the group is written but
    before the timeline event is), I want the system to guarantee I never end up with a half-saved account
    — either everything from my Guest session lands, or nothing does — so that I can safely retry without
    fear of silent data loss or duplication.
37. As a Guest EM who declines to authenticate at the gate, I want my in-progress Finish to simply not
    persist (the Guest Group evaporates on close), so that there's no partial, owner-less server state.
38. As an already-authenticated EM, I want to reach the exact same Finish flow with no Persistence Gate
    interruption at all, so that returning EMs never see friction that only applies to first-time Guests.

**Library & Timeline Write**

39. As an EM whose Finish (or Finish Anyway) succeeds, I want the treatment's Personal Treatment Library
    row to have its `use_count` incremented by exactly one, so that my toolbox reflects real usage without
    double-counting (DEC-005, DEC-006 §5).
40. As an EM running a treatment for the very first time, I want a new Personal Treatment Library row to be
    created automatically (with correct provenance) rather than requiring me to add it manually first, so
    that my toolbox grows organically from what I actually do.
41. As an EM, I want a Timeline event to be written for this execution, linking to the Personal Treatment
    Library entry (not a content snapshot), so that reviewing this event later always renders the library
    entry's current state (DEC-015 §4, DEC-016 §5).
42. As an EM, I want the Timeline event to carry a `log_type` (e.g. `treatment_execution`) so that it can be
    filtered alongside other event types later without special-casing (DEC-007 §3).
43. As an EM, I want every write from this flow — Symptom Group, Player session, Library row, Timeline
    event — to be anchored to my `auth.uid()` once promoted, and to live nowhere on a server before that
    point, so that data sovereignty is never ambiguous (DEC-017).
44. As a future maintainer replacing the seed `treatments` table with GQ-020's production Treatments Table,
    I want every reference to a treatment (Library row, Timeline event, Player session) to already be a
    stable UUID foreign key, so that the swap is a data migration, not a schema rewrite touching every
    dependent table.

## Implementation Decisions

### A. Modules

- **`pic-engine`** (new package, framework-agnostic TypeScript, zero React/Supabase imports at its core):
  - `SessionEngine` — Guest Mode bootstrap, Persistence Gate trigger detection, atomic promotion
    orchestration.
  - `GroupEngine` — Symptom Group / symptom creation and validation (name, polarity, intensity), the Joint
    Treatment Muscle Test gate, and the shared `rate(symptomId, polarity, intensity)` action reused by both
    group-creation rating and the post-treatment feedback-loop rating.
  - `PlayerEngine` — the Unified Player flat 4-state machine: unit state transitions, Navigation Tree
    forward/backward logic, Terminal NEMAR gating, Finish / Finish Anyway, and triggering the optional
    post-Finish Smart-Link rating suggestion (delegates the actual rating to `GroupEngine.rate`).
  - `LibraryEngine` — `use_count` increment rule (Finish-only, exactly-once), first-execution row creation.
  - `TimelineEngine` — event construction (`log_type`, links, no snapshot).
  - `RepositoryPort` — the one interface all engines depend on for persistence (`getGroup`, `saveGroup`,
    `getPlayerSession`, `savePlayerSession`, `getOrCreateLibraryRow`, `incrementUseCount`, `appendTimelineEvent`,
    `promoteGuestToAccount`). No engine imports a concrete adapter. `promoteGuestToAccount` is documented on
    the port as **atomic-or-nothing** — see §E.
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
- `guest_group`: `id` (client UUID), `name`, `symptoms: [{ id, name, polarity: 'positive' | 'negative',
  intensity: 0..10 }]`, `joint_treatment_muscle_test: 'together' | 'split_suggested'`,
  `joint_treatment_test_at: timestamp`, `created_at`. The group record cannot be marked finalized by
  `GroupEngine` until `joint_treatment_muscle_test` is set (see §C-Group below) — this is a `GroupEngine`
  invariant, not a UI-only validation, so it holds even if a future renderer forgets to enforce it visually.
- `guest_player_session`: `id`, `treatment_id`, `linked_group_id` (nullable), `units: [{ unit_id, state:
  'unseen' | 'in_view' | 'skipped' | 'completed' }]` (`in_view` never persisted, computed at read time),
  `terminal_nemar_response: 'yes' | 'no' | null`, `finished_at: timestamp | null`,
  `integrating_reason: 'mid_exit' | 'terminal_nemar_no' | null`,
  `post_finish_rating: { symptom_id, polarity, intensity } | null` (feedback-loop rating, only present when
  `linked_group_id` is set and the EM engaged the optional suggestion).

**Supabase schema (extends `supabase/migrations/20260308164004_initial_schema.sql`; all RLS via
`auth.uid()` per DEC-017; every primary key in every table below — new or existing — is
`uuid default gen_random_uuid()`, matching the existing migration; no table introduced by this spec uses a
serial/int identity column):**
- `profiles` — already migrated; this spec adds no new columns beyond DEC-017's `id`, `email`,
  `consent_timestamp`, `role`, `last_server_auth_at` (deletion fields out of scope for this spike).
- `symptom_groups` — extend the existing table (`id`, `user_id`, `name`, `created_at`) with
  `joint_treatment_muscle_test` (`enum: 'together' | 'split_suggested'`, not null — DEC-002) and
  `joint_treatment_test_at` (timestamp).
- `symptoms` — extend the existing table with `polarity` (`enum: 'positive' | 'negative'`, not null,
  DEC-009) and `intensity` (`int`, 0–10 inclusive check constraint, not null, DEC-010 §1 — independent
  column from `polarity`, never derived from it). The existing `inquiry_prompts` column is unused by this
  spike (NEMAR-only) and left as-is.
- `treatments` (new, minimal seed table for this spike only — **not** the full Treatments Table that
  GQ-020 will define): `id uuid default gen_random_uuid() primary key`, `title`, `structured_markdown`
  (Structured Markdown source, H3 = Atomic Unit), `content_format` (`'structured_markdown'`), seeded with a
  handful of fixed rows so the Player has something real to run. Every downstream reference to a treatment
  (`player_sessions.treatment_id`, `personal_treatment_library.global_reference_id`,
  `timeline_events.treatment_id`) is a `uuid` FK to this table's `id`, so replacing this seed table with
  GQ-020's production Treatments Table is a data migration (re-insert the same rows, same UUIDs, into the
  new table, or point the FK at the new table) — never an FK column type change or a rewrite of the three
  dependent tables.
- `player_sessions` (new): `id`, `user_id`, `treatment_id`, `linked_group_id` (nullable FK to
  `symptom_groups`), `units` (jsonb: `[{unit_id, unit_order, state, unit_title}]`, `in_view` never
  persisted here either), `terminal_nemar_response`, `success_declared` (bool, set only by Finish),
  `integrating_reason` (`'mid_exit' | 'terminal_nemar_no'`, nullable), `finished_at` (nullable timestamp),
  `post_finish_rating` (jsonb, nullable — mirrors the Guest-store shape above), `created_at`.
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

### C. Symptom Group Formation & Rating (implemented in `GroupEngine`, DEC-002, DEC-009, DEC-010)

- **Joint Treatment Muscle Test as a `GroupEngine` invariant, not a UI checkbox:** `GroupEngine.finalizeGroup(draft)`
  refuses to persist a group whose `joint_treatment_muscle_test` field is unset. The muscle test is
  presented as one binary Atomic Unit-style question ("Is it NEMAR to treat these symptoms together?")
  after the last symptom is added and before finalization — structurally the same shape as the Player's
  Terminal NEMAR, reusing the same yes/no interaction pattern for consistency.
  - **`'together'`:** finalize immediately, no further steps.
  - **`'split_suggested'`:** finalize is still permitted (sovereignty — the EM is never blocked from
    keeping symptoms in one group), but `GroupEngine` returns a non-blocking advisory the UI surfaces as a
    dismissible suggestion. **Actual group-splitting (creating N groups from one draft) is out of scope**
    (§ Out of Scope) — this spike implements the test and its persisted answer, not the split mechanic.
- **Rating is one shared action, used twice:** `GroupEngine.rate(symptomId, { polarity, intensity })` is
  the single entry point for setting a symptom's Polarity + Intensity, called both during group creation
  (initial rating, no prior value to hide) and by `PlayerEngine`'s post-Finish Smart-Link suggestion
  (DEC-009 §4) when a treatment was linked to a group. There is no separate "initial rating" vs.
  "feedback-loop rating" code path — one function, two call sites, exactly the kind of duplication DEC-010
  §2's "single cohesive action" language is meant to prevent.
- **Provisional Intensity semantics (see Architect's Review above):** `intensity` is stored as a plain
  0–10 integer with **Path A1 (Absolute Magnitude)** semantics — higher always means "more sensation,"
  independent of polarity. This is explicitly the *recommended, not yet formally resolved* answer to
  **GQ-021**; the slider component and its copy carry a code comment flagging this, and this spike's
  outcome should be reported back into the GQ-021 grill session rather than treated as having silently
  closed it. Blind re-rating (DEC-011) is **not** implemented — every rating in this spike is either a
  first-time rating (nothing to hide) or an explicit, un-blinded feedback-loop rating.

### D. Unified Player State Machine (implemented in `PlayerEngine`, DEC-015)

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
  `finished_at`, and trigger the one-time side effects below. Every other engine call is pure state
  transition with no side effects outside the Player session itself.
- **Exactly-once side effects:** `PlayerEngine` calls `LibraryEngine.recordUse(treatmentId)` and
  `TimelineEngine.recordExecution(...)` exactly once per `finish()`/`finishAnyway()` call, never on
  revisiting an already-`success_declared` session (DEC-006 §5).

### E. Guest Mode / Persistence Gate — Atomic Promotion (implemented in `SessionEngine`, DEC-017)

- App boot: `SessionEngine` starts against `pic-adapter-local-guest` with no network call, unconditionally.
- The Persistence Gate is not a screen the EM can navigate to directly — it is a side effect
  `SessionEngine` triggers only when `PlayerEngine.finish()`/`finishAnyway()` is about to run its one-time
  side effects (§D) and the current adapter is still `local-guest`.
- **Atomic Promotion is a hard requirement, not a design preference.** On successful auth,
  `SessionEngine.promote(guestState, newUserId)` calls `RepositoryPort.promoteGuestToAccount(...)`, which
  **must** be implemented as a **single Supabase RPC (Postgres function, `security definer`, called via
  `supabase.rpc(...)`)** that writes the Symptom Group, symptoms, Player session, Library row, and Timeline
  event inside **one Postgres transaction**:
  - **All-or-nothing:** if any insert fails (constraint violation, connection drop mid-call), the entire
    transaction rolls back — the client must never observe a state where, e.g., the group exists but the
    timeline event doesn't. There is no client-side "insert four times and hope" implementation; the RPC
    itself is the transaction boundary.
  - **Idempotent under retry:** the RPC accepts a client-generated idempotency key (the Guest Group's
    client-side UUID, reused as the eventual `symptom_groups.id`); calling it twice with the same key and
    payload is a no-op the second time (checked via `on conflict do nothing` / an existence check inside
    the function), so a client retry after a dropped response never double-writes or double-increments
    `use_count`.
  - **No partial adapter swap:** `pic-web` only swaps its active adapter from `local-guest` to `supabase`,
    and only clears the local Guest state, **after** the RPC call returns success. A failed or timed-out
    call leaves the EM exactly where they were, on `local-guest`, free to retry — never in a state where the
    UI believes it's authenticated but the promotion silently didn't land.
- On decline/close, nothing is written; the in-memory/`localStorage` Guest state is simply abandoned (or
  explicitly cleared) — no server contact ever happened.

### F. UI Component Hierarchy (Web, `pic-web`; each screen = one Atomic Focus action)

```
App
├── GuestModeShell                     (mounts SessionEngine against local-guest adapter on boot)
│   └── PersistenceGateModal           (renders only when SessionEngine signals gate-triggered;
│                                        shows a retry affordance on promotion failure, never a
│                                        "partially saved" state)
├── SymptomGroupCreateScreen           (name input → confirm; one action)
│   ├── SymptomAddStep                 (repeatable: name + polarity toggle + intensity slider;
│   │                                    one symptom per pass — GroupEngine.rate under the hood)
│   └── JointTreatmentMuscleTestStep   (single yes/no question, shown once all symptoms are added;
│                                        gates GroupEngine.finalizeGroup)
├── SymptomGroupSummaryScreen          (read-only confirmation of what GroupEngine just created,
│                                        including the muscle-test result and any split suggestion)
├── TreatmentPickerScreen              (flat seed list; optional "link to group" toggle)
└── UnifiedPlayerScreen
    ├── AtomicUnitView                 (renders exactly one unit's unit_content; triggers in_view)
    ├── NavigationTreePanel            (the only jump affordance; calls jumpTo(unitId))
    ├── TerminalNemarUnit              (Yes/No; a specialization of AtomicUnitView, not a separate screen)
    ├── PostFinishRatingPrompt         (optional, dismissible; renders only if linked_group_id is set;
    │                                    reuses the same polarity toggle + intensity slider as
    │                                    SymptomAddStep via GroupEngine.rate)
    └── FinishBar                      ([Finish] xor [Finish Anyway], computed from PlayerEngine state)
```

No component holds `useState` for anything derivable from `pic-engine` (unit states, gate-triggered flag,
`use_count`); each subscribes to the engine and re-renders on its emitted state, keeping the "dumb
reflection" property testable by inspection, not convention. The polarity+intensity input control is a
single shared component instantiated in both `SymptomAddStep` and `PostFinishRatingPrompt` — never
reimplemented — so the "provisional GQ-021 semantics" comment (§C) lives in exactly one place.

### G. Explicitly Out of Scope for GQ-020 (documented here so it isn't silently reintroduced)

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
  (e.g. "`incrementUseCount` is idempotent under retry," "`promoteGuestToAccount` moves all five entities
  atomically") and is run once against `pic-adapter-local-guest` and once against `pic-adapter-supabase`
  (the latter against a local Supabase instance via `supabase start`, not a mocked client) — this is what
  guarantees Web/Native parity without duplicating business-rule tests per adapter.
- **UI layer:** thin smoke tests only (one per screen: "renders without throwing given engine state X,
  calls the right engine method on the one action it exposes"). No business-rule assertions belong at this
  layer — if a UI test needs to assert on `use_count` math, that's a signal the rule leaked out of
  `pic-engine`.
- **State-machine coverage (drives TDD red-green order):** every transition listed in §D above gets its own
  test before implementation, including the two non-obvious "past-state" cases DEC-015 flags explicitly:
  revisiting a `completed` unit doesn't revert it, and jumping backward to a `skipped` unit then advancing
  upgrades it to `completed` without a duplicate `use_count` increment.
- **Joint Treatment Muscle Test gate (§C):** a red-green pair before any UI exists —
  `finalizeGroup` throws/rejects when `joint_treatment_muscle_test` is unset; both `'together'` and
  `'split_suggested'` finalize successfully once set, proving the test informs without blocking.
- **Rating dimension independence (§C, DEC-010):** a direct test that flipping `polarity` on an existing
  symptom leaves its `intensity` value untouched (and vice versa) — this is the one test that would catch
  an accidental coupling of the two fields, which is precisely the bug DEC-010 exists to prevent.
- **Guest→Promotion is the highest-risk integration point** and gets explicit, adversarial tests, not just a
  happy-path check:
  - **Happy path:** build a full Guest state (group with muscle-test result and rated symptoms + finished
    player session, with and without a post-Finish rating), call `promote()`, assert all five Supabase rows
    exist, correctly `user_id`-scoped, and the local Guest state is gone.
  - **Simulated mid-transaction failure:** force the RPC to fail after partial internal work (e.g. inject a
    constraint violation on the last insert inside the transaction, or use `pg_sleep` + connection kill in
    the local Supabase instance) and assert **zero** rows landed — proving the "all-or-nothing" requirement
    in §E is real, not aspirational prose.
  - **Retry idempotency:** call `promote()` twice with the same idempotency key (simulating a client retry
    after a dropped response) and assert exactly one set of rows exists and `use_count` was incremented
    exactly once, not twice.

## Out of Scope

- NEMAR diagnosis: Causes Table, Treatments Table (production schema), Left/Right path muscle testing,
  Atomic Discovery, diagnosed-cause lifecycle — all of **GQ-020**, unaffected by this spec.
- **Symptom Group splitting mechanic:** when the Joint Treatment Muscle Test answers `'split_suggested'`,
  this spike persists the answer and surfaces the advisory — it does **not** implement the actual flow of
  turning one draft group into two finalized groups. That's meaningfully more UI/UX and data-migration
  surface (what happens to symptoms already rated? does the second group get its own muscle test?) than a
  tracer bullet needs to prove the methodology step exists.
- **GQ-021's remaining open scope** — this spike takes a *provisional* position on Absolute Magnitude
  semantics (see Architect's Review and §C) but explicitly does **not** resolve: blind re-rating defaults
  across the three rating-trigger modes (session-scoped / Smart-Link / ad-hoc — Part B of GQ-021), or final
  UI copy for the intensity scale. Treat this spike's intensity UI as evidence for that grill session, not
  as its resolution.
- Freemium/entitlement gating (**GQ-014**), Library Sync/first-execution matching across courses
  (**GQ-022** — no courses exist in this spike), CMS/content governance (**GQ-023**), offline sync conflict
  resolution (**GQ-016**), practitioner/reciprocity access (**GQ-026**).
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
  `RepositoryPort` contract + fake → `GroupEngine` (including the muscle-test gate and shared `rate()`) →
  `PlayerEngine` (largest ticket, may want its own split by state-machine section) →
  `LibraryEngine`/`TimelineEngine` → `SessionEngine` (Guest/Promotion, depends on all four) →
  `pic-adapter-local-guest` → the **atomic promotion RPC** as its own dedicated ticket inside
  `pic-adapter-supabase` (highest-risk piece in the whole spike — give it room, and the adversarial tests
  from **Testing Decisions**, not just the happy path) → `pic-web` screens (can start once the engine
  ticket they render is closed, in parallel with adapter work).
- This spike's provisional Intensity semantics (Path A1) should be reported back as input to the formal
  **GQ-021** grill session once implemented — see the cross-reference added to `docs/grill-backlog.md`.
