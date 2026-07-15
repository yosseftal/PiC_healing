# PiC Architectural Decisions

Living record of agreements reached during co-architecture sessions (Grill-with-Docs).
Captured before feature specs or schema design.

---

## DEC-001 — Atomic Focus is a UX principle, not a separate container type

**Status:** Agreed (2026-06-02, updated per Yossef-Tal)

**Context:** Early drafts tied “Atomic Focus” only to one-question screens and the Player. Co-architect review also challenged
“Symptom Buckets” as a separate persistence unit.

**Decision:** **Atomic Focus** applies to:

1. **Inquiry / decision-making** — one muscle-test question at a time (NEMAR flow).
2. **Treatment execution** — the Player breaks protocols into small sequential steps.
3. **Choosing what to work on** — during a given **Inquiry Session**, work stays on **one focus target** at a time: usually **one**
   Symptom Group / הקשר, **or** one **course-as-treatment** workflow (**DEC-003**), **or** a **timeline-first** technique/treatment visit
   (**DEC-004**), so inquiry and muscle tests stay clear. The Event Manager may **switch target** and **start a new Inquiry Session whenever
   they want**. “Active” means *this visit*, not a lock on the account.

It is **not** a separate database entity or synonym for מכלי סימפטומים.

**Rationale:** Matches public teaching (simple steps) and clarified domain model (DEC-002).

**Consequences:**

- ~~Update manifesto Principle 5 in `README.md`~~ Done (2026-06-02).
- ~~Align `CLAUDE.md`~~ Done (2026-06-02).

---

## DEC-002 — Symptom Group, הקשר, מכלי סימפטומים, and Work Session are one unit

**Status:** Agreed (2026-06-02, Yossef-Tal & Sigal)

**Context:** English *context*, *symptom group*, and *work session* sounded like nested layers. Hebrew in `README.md` §4 lists parallel
**קבוצות תסמינים** and **קורסים**, with **לכל הקשר** a continuous **סשן עבודה**.

**Decision:**

| Concept | Hebrew terms (same unit) | English canonical term |
|--------|---------------------------|-------------------------|
| Persistent healing thread | **קבוצה** = **מכלי** = **הקשר** = **סשן עבודה** (full Hebrew in README §4) | **Symptom Group** (primary); **Work Session** when stressing continuity |
| One visit on that group | **סשן** (inquiry / rating / journal flow) | **Inquiry Session** |
| Items inside the group | **סימפטומים** (e.g. lower back + neck together) | **Symptom** |

**Course-side (parallel; see DEC-003):** The table above is only the **symptom-group** equivalence (קבוצה / מכלי / הקשר / סשן עבודה).
**קורסים** are **not** extra columns in that row — they are a **separate lane** with their own saved thread (**course Work Session**).
Each **distinct course run / enrollment** (including a **second time** through the same granted course, if the product opens a new run)
keeps its **own** continuity record; two runs ⇒ **two** **course Work Session** histories unless we later agree on a “single merged replay”
mode.

**Formation workflow:**

1. The Event Manager **lists all symptoms** they want to address.
2. **Joint treatment muscle test:** can these symptoms be treated together?
   - Often **yes** → one Symptom Group.
   - If **no** → split into **separate Symptom Groups** (each becomes its own הקשר / סשן עבודה).
3. For a chosen group: full **log and documentation** over time; documentation may attach to **any object** in that Work Session
   (symptoms, treatments, inquiries, etc.) — the group’s logbook.
4. **Inquiry Sessions** can be started **whenever** on that group (Atomic Focus: one group per visit, not locked across visits).

**Inquiry Session flow (agreed nuance):** Steps (Empty Vessel, safety, NEMAR, treatment player, journal) are **available in any order**;
the user may **start at any step**. **Recommended** order: Empty Vessel → safety → NEMAR → treatment player → journal. Matches flexible
journey gate in README §3 (skip brain dump when not needed).

**Empty Vessel (agreed nuance):** Free writing (הכלי הריק / פינוי מנטלי) — **not only** listing all symptoms. It **can** be used to
surface symptoms when building or updating groups, but also as **spontaneous** pre-session text (e.g. “how am I feeling today?”,
something you now understand about this Symptom Group). Distinct from the Reflective Journal at the end, though content may later be
linked or copied there if the user chooses.

**Example (Maya):** “Lower back” and “neck” are two **symptoms** in **one** Symptom Group / הקשר / Work Session (treated together).
“Allergies” would be a **second** Symptom Group if the muscle test says they cannot be treated with the back/neck set.

**Rationale:** One persistent boundary per group; no extra “Healing Track” layer. מכלי and קבוצה are naming variants, not parent/child
types.

**Consequences:**

- Schema/UI: `symptom_groups` (or equivalent) is the persistence root for logs, ratings, and Integrating state — not a separate
  `contexts` table unless we alias it.
- Glossary: drop **Symptom Vessel** and **Healing Track** as separate terms.
- ~~README §4 / glossary aligned to Symptom Group (הקשר)~~ Done (2026-06-02).
- ~~**Open (next grill):** How **active courses** relate to a Symptom Group~~ Resolved in **DEC-003** (2026-06-08).

---

## DEC-003 — Academy courses: parallel lane, own Work continuity, optional Symptom Group attachment

**Status:** Agreed (2026-06-08, Yossef-Tal & Sigal)

**Context:** README lists Symptom Groups and **courses** in parallel. We needed one model for NEMAR / Player / Integrating /
documentation, freemium boundaries, and how an Inquiry Session is “anchored.”

**Decision:**

1. **Parallel on-ramp:** **Courses (Academy)** are a **separate lane** with their **own progress model** — not a Symptom Group, not renamed
   into one.
2. **Same therapeutic machinery per course:** For a given **course run / enrollment**, the product supports the same **NEMAR** inquiry
   pattern (נמ"ר — not “NAMER”), **Player**, **Integrating**, and **scoped documentation** as for symptom-led work. That thread is the
   course’s **continuous Work Session** (סשן עבודה) in the **course** sense: completion and history **substitute** for “no separate paper
   trail” — they **are** the durable work record for that course.
3. **Event Manager choice of shape:** A course may **stand alone**; may be chosen as work **inside** a Symptom Group’s broader Work
   Session; or the Event Manager may take **one technique** learned from a course and run an **Inquiry Session** with that technique **whenever and
   wherever** they choose (including on another Symptom Group). No forced auto-link unless the Event Manager opts in.
4. **Course as treatment:** When the Event Manager chooses **a course as treatment**, an **Inquiry Session** for that visit **follows that
   course’s workflow** (course-led Atomic Focus for that sitting).
5. **Commerce:** Courses may be **free or paid**. Paid access is by **per-course grant**; the Event Manager may **re-run** a granted course.
   **Course progress is included** in what the grant (or free offer) covers — not an extra “healing persistence” upsell on top of the
   course price.
6. **Freemium bucket (Q3 — teaching vs saved work):** **Core Gateway teaching** and **open diagnostic material** stay **freely accessible**
   per manifesto. **Course progress, completion, and run state** (where you are in the course, Integrating, course-scoped notes) are **the
   Event Manager’s personal healing record** for that **course Work Session** — not a throwaway “anonymous learner” silo. Classify that
   data as **persistent healing**: same **subscription-gated persistence** and **data-sovereignty** expectations as Symptom Group history
   (do not park real course saves in a cheap “learning-only” bucket that would dodge export/delete rules).

**Refines DEC-001 §3 (Atomic Focus):** During one **Inquiry Session**, **one Atomic Focus target** per visit: **one Symptom Group**
(symptom-led), **one course-as-treatment workflow** (course-led), or **timeline-first** technique/treatment work (**DEC-004**). Switching
targets means **ending / starting** a session, same as switching Symptom Groups today.

**Refines DEC-002 consequences:** Persistence is **not only** `symptom_groups`: add a **first-class course enrollment / progress** root
(name TBD in schema) alongside symptom groups. Cross-links when the Event Manager attaches a course to a group remain **explicit**, not implied.

**Rationale:** Matches parallel Hebrew framing (קבוצות + קורסים), keeps Event Manager sovereignty over stand-alone vs linked work, and aligns paid
grants with “you own your course run history.”

**Consequences:**

- OpenSpec / schema: model **course enrollment**, replay, grants, and Integrating state without folding courses into
  `symptom_groups`.
- UX copy: distinguish **Symptom Group Work Session** vs **course Work Session** where ambiguity would confuse the Event Manager.
- ~~README / manifesto~~: follow-up optional pass to spell out “course-led Inquiry Session” and freemium bucket (persistent healing) in
  plain language. ~~English `README.md` + `CLAUDE.md` pillars~~ Updated for **DEC-004** (2026-06-08).

---

## DEC-004 — Timeline-first persistence, Personal Treatment Library, intentional Smart-Linking

**Status:** Agreed (2026-06-08, Yossef-Tal & Sigal) — resolves **GQ-001**

**Context:** **GQ-001** asked where technique-only or ad-hoc treatment work **must** attach. The manifesto centres the **Reflective
Journal** as a chronological archive; **DEC-003** allows techniques without a full course-as-treatment flow. The team rejected **implicit
defaults** that would force a Symptom Group or course row before saving.

**Decision:**

1. **Baseline (prior grill option D):** There is **no mandatory** Symptom Group or course row as a **precondition** for logging a
   technique or treatment execution. The product must **not** silently default a visit onto a group or course to satisfy persistence.
2. **Mandatory anchor = Chronological Timeline:** The **only required** persistence anchor is the Event Manager’s **chronological
   timeline** — the same spine as the **Reflective Journal** principle (the journey told in time). Each technique or treatment **execution**
   is recorded as its **own** timeline event **unless** the Event Manager opts into further attachment (below).
3. **Intentional association (prior grill option C when used):** The Event Manager **chooses** whether a session or execution also belongs
   with a **Symptom Group**, a **Course** / run, both, or neither beyond the timeline. **Dual or multiple Smart-Links** are **available
   actions**, never automatic defaults. There is no prescribed “correct” topology — only the path chosen by the user, who owns linking
   choices.
4. **Personal Treatment Library (Personal Treatment Table):** Every account keeps a **personal toolbox** of techniques and treatments the
   Event Manager has **actually executed**. The **first execution** of any technique or treatment — from a **course**, the shared
   **Treatments Table**, a **library** copy, self-invented material, or elsewhere — **updates** this repository. It is **separate** from any
   one Symptom Group’s continuous log; Smart-Linking connects into group or course stories when the Event Manager decides it matters.
5. **Smart-Linking:** If the Event Manager decides an execution or visit is **relevant** to a Symptom Group (or analogously to a course),
   they may **Smart-Link during the session or retroactively**. The timeline stays the spine; links are overlays the Event Manager controls.

**Refines:**

- **DEC-001 / DEC-003:** **Atomic Focus** still governs *attention* during a visit (one muscle-test question and one Player step at a time).
  **Persistence** for ad-hoc or technique-first work **starts on the timeline** without forcing `symptom_groups` or course foreign keys.
- **DEC-002:** The Symptom Group remains the rich **Work Session** for group-bound healing; timeline + library add **non-group-first** rails.

**Consequences:**

- Schema must support a **timeline / journal spine**, **execution events**, **Personal Treatment Library**, and **Smart-Link** edges without
  required default foreign keys to `symptom_groups` or courses.
- UX must make **“timeline only”** obvious and trustworthy, and make **linking** an explicit, positive action — not recovery from mistaken
  auto-defaults.
- **Blind (re-)rating** applies **only to symptoms** (symptom intensity), as part of **symptom–group healing paths** the app offers — not
  by default for course-only, library-only, or timeline-only work unless a **symptom** is intentionally in scope. Group-scoped analytics that
  depend on symptom ratings follow the same scope.
- The Event Manager may **start ad-hoc re-rating** whenever they choose, not only at a fixed session entry (OpenSpec).
- **Personal Treatment Library** row identity, provenance, and **usage counter:** **DEC-005**; **increment behaviour:** **DEC-006**.

**Rationale:** Aligns chronology with the Reflective Journal, maximises Event Manager autonomy, and keeps Symptom Groups and Courses as
powerful **optional** contexts rather than silent gatekeepers.

---

## DEC-005 — Personal Treatment Library identity, provenance, and usage count

**Status:** Agreed (2026-06-08, Yossef-Tal & Sigal) — resolves **GQ-002**

**Context:** **GQ-002** asked how to represent the “same” technique from **different origins** (Treatments Table, course, self-tweak, etc.)
without cluttering the toolbox.

**Decision:**

1. **One logical toolbox row:** Prefer **one** **Personal Treatment Library** entry per **logical** technique or treatment the Event Manager
   uses, with a **provenance / source history** (where they first met it and subsequent sources). **Timeline executions** carry **source
   tags** pointing into that history.
2. **Opt-in variants only:** If the Event Manager considers a practice **materially different**, they may **split** an **explicitly named
   variant**—never silent duplicate cards for the same felt protocol.
3. **Usage counter (use count only):** Each library row stores **only** a **monotonic use count** — the number of times the Event Manager
   **recorded an execution** mapped to that row. **Do not** add duration-on-task, stopwatch totals, or time-summed minutes **on the library
   row** for v1 (other surfaces may evolve separately). **Increment rules:** **DEC-006** (resolves **GQ-003**).

**Rationale:** Keeps the toolbox readable, preserves learning lineage, and gives the Event Manager a simple **count of uses** without scope
creep into time accounting.

**Consequences:**

- Schema / UI: library entity + provenance list + **`use_count` only** on the row (no duration field on that row for v1); increment rules
  **DEC-006**.
- UX: surface **use count** quietly on the toolbox card (**DEC-006**: secondary, non-pressuring); avoid implying “minutes practiced” from the
  library card in v1.

---

## DEC-006 — Personal Treatment Library `use_count`: hybrid Player Finish + manual (GQ-003)

**Status:** Agreed (2026-06-08, Yossef-Tal & Sigal) — resolves **GQ-003**; **amended** same day (optional success muscle-test wording);
**amended again (2026-07-02)** — removes the "required steps" gate per **DEC-015** (resolves **GQ-018**).

**Context:** **GQ-003** chose **option D (hybrid)** with **Ownership**, **NEMAR** alignment, **Integrating** language, and a **low-pressure**
toolbox metaphor.

**Amendment (2026-07-02):** The unified **Unified Player** state machine (**DEC-015**) retires "required" vs. "optional" Player steps as a
technical gate (this was Audit Contradiction 1.1 — DEC-006 said "required," DEC-015 said "no gates," and they could not both be true).
**Finish is now available at the final Atomic Unit unconditionally.** §1 below is rewritten accordingly; §2–§5 are unchanged.

**Decision:**

1. **Player path — automatic +1 on Finish (סיום):** When the Event Manager runs the **Unified Player** for a technique/treatment mapped to
   a **Personal Treatment Library** row and triggers **Finish** (סיום) at the **final Atomic Unit** of that instance (**DEC-015** §2),
   **`use_count` increments once**. There is **no "required steps" precondition** — Finish is reachable regardless of how many prior units
   were marked `completed` vs. `skipped` (**DEC-015** §3–4). Protocols may still offer an **optional** closing **muscle-test** — **yes/no**:
   *Did this treatment or technique end successfully?* — in the same **NEMAR** inquiry family; it remains **not mandatory** for Finish or +1.
2. **Integrating / mid-exit — no silent auto +1:** If the Event Manager **leaves** the Unified Player before reaching Finish, the work stays
   **Integrating** (not framed as failure); **do not** auto-increment. They may later **manually** add a use, or return and **Finish**
   when the flow allows—**never** double-count the same finished run (see §5).
3. **Manual increment — Ownership:** At **any time**, from the **Personal Treatment Library**, the Event Manager may **manually increase**
   **`use_count`** for any row—e.g. work **outside** the app, off-Player practice, or an intentional “log this session” choice. Manual
   entry honours **self-reported** experience without forcing Player completion.
4. **Low friction — analysis only:** The counter is a **secondary**, **non-intrusive** aid for light personal reflection; copy and UI
   must **not** create scoreboard pressure, clutter primary flows, or imply clinical benchmarking.
5. **No double-counting:** A **single** Finish produces **at most one automatic +1**. Revisiting a "Successfully Completed" instance to
   deepen into previously skipped units (**DEC-015** §6) does **not** trigger a second Finish or a second +1 — only an explicit new
   session/run, or an explicit extra manual increment, records a genuinely distinct use.

**Bilingual nuance (agreed, Hebrew team notes):**

- **Finish (סיום) & optional success muscle-test:** **`use_count`** auto +1 follows **Finish** at the **final Atomic Unit**, unconditionally
  (no required-steps gate — **DEC-015**). An **optional** closing **muscle-test** (**yes/no**: *Did this treatment or technique end
  successfully?*) may appear—in the **NEMAR** inquiry family; **not** required for **Finish** or +1.
- **סיום (עברית):** העלאת המונה קשורה ל-**סיום** ביחידה האטומית האחרונה, ללא תנאי של "שלבים נדרשים". בסוף הפרוטוקול אפשר **מבחן שרירים
  כן/לא אופציונלי**: *האם הטיפול / הטכניקה הסתיימו בהצלחה?* — לא חובה.
- **בהטמעה (Integrating):** Because unfinished treatment stays **Integrating**, the counter **must not** auto-rise on mid-exit; only
  **Finish** or a **conscious manual** choice advances it—preserving **non-failure** framing.
- **פשטות:** One clear action (**Finish** or manual +1) → one clear outcome—keeps the app feeling like a **simple program**.
- **ארגז כלים:** The library stays a **toolbox** of accumulated experience, not a stressful measuring instrument.

**Rationale:** Hybrid **D** with explicit **Finish** gate respects methodology rigour while **manual** use upholds autonomy and real-world
practice off-device. Removing the required-steps precondition (2026-07-02) keeps the gate honest: **Finish is always reachable**, and its
meaning never depends on a technical judgment about which steps "counted."

**Consequences:**

- Player UX: prominent **Finish** (סיום), reachable unconditionally at the final Atomic Unit; optional closing **yes/no success**
  muscle-test per protocol; auto +1 wired to Finish alone — no required-step precondition to check (OpenSpec: UI detail only).
- Library UX: always-offered **manual +1** (wording TBD) with guardrails against accidental spam taps (OpenSpec: confirm or long-press if
  needed).
- Analytics copy: “for your reflection only”—never primary gamification.

---

## Grill — open questions (living)

### GQ-004 — Correcting a mistaken `use_count` increment?

**Status:** Open (posed 2026-06-08)

**Context:** **DEC-006** makes **Finish** and **manual +1** deliberate. Mis-taps, wrong row, or changed mind still occur.

**Question:** If the Event Manager **regrets** an increment, what is the default product behaviour?

- **A.** **No decrement** — append-only count; narrative correction only in journal/timeline.
- **B.** **Undo snackbar** — revert the last +1 within a short window (same session or minutes).
- **C.** **Explicit “−1”** — guarded (confirm, rate limit) on the library row.
- **D.** **Audit correction** — count unchanged; a logged **adjustment event** preserves analytics honesty.

**Co-architect recommendation (non-binding):** **B** for accidental **Finish** +1; **C**-style confirm for **manual +1** mistakes; consider
**D** if immutable audit is ever required.

**Awaiting:** Yossef-Tal & Sigal

---

## DEC-007 — Personal Treatment Library `use_count`: manual-edit sovereignty, multitype timeline (auto-decrement removed)

**Status:** Agreed (2026-06-08, Yossef-Tal & Sigal) — resolves **GQ-004**; **amended (2026-07-02)** — removes auto-decrement on
back-navigation per **DEC-015** (resolves **GQ-018**).

**Context:** **GQ-004** asked how to handle mistaken increments. Original answer combined Player state sync, Event Manager
ownership, and transparent logging.

**Amendment (2026-07-02):** The original §1 (auto-decrement on back-navigation) directly contradicted **EM Sovereignty**
(Audit Contradiction 1.3): it let a **navigation gesture** silently override an **explicit prior declaration** ("Finish") without the
Event Manager's consent. The unified **Unified Player** model (**DEC-015** §5) reframes back-navigation as **"Revisiting"** — reading
or reconsidering — never a revocation. §1 below replaces the removed auto-decrement clause; §2 (manual edit) and §3 (multitype
timeline) are unchanged in substance.

**Decision:**

1. **Revisiting is not revoking — no auto-decrement:** Navigating **back** from a **Finish** state (or at any point in the Unified Player)
   **never** changes `use_count` and **never** un-marks a `"Successfully Completed"` declaration. This is a **read/reconsider** action, not
   an undo action. The **only** way `use_count` moves after Finish is the sovereign **manual edit** in §2.
2. **Manual counter edit — Ownership:** The Event Manager retains the right to **manually edit** `use_count` **anytime** to reflect their
   **physical reality** (off-app practice, re-evaluation, corrections, or reversing a mistaken Finish). The counter is their **sovereign
   data**; this is now the **sole** correction path (no system-inferred adjustment exists).
3. **Multitype Timeline Architecture** (GQ-004 follow-up, unchanged):
   - **Event categorization:** Every action (Technique Execution, Manual Correction, Insight, Rating Refresh, Use Count Adjustment, etc.)
   is logged with a **specific `log_type`**.
   - **Smart filtering:** The **Chronological Timeline** displays a **filter UI** allowing users to choose which `log_type` entries to view.
   **By default**, technical/system corrections (e.g. "use_count adjusted manually") are **hidden** to maintain a clean, **Atomic Focus**
   workspace.
   - **Data integrity without clutter:** All changes are **permanently recorded**; visibility is user-controlled.

**Bilingual nuance:**

- **ריבונות** (Sovereignty): Event Manager's absolute ownership over their healing data; manual edits **always** allowed; no automatic
  system-side correction ever competes with that ownership.
- **חזרה אינה ביטול** (Revisiting is not revoking): Back-navigation in the Unified Player never touches `use_count` or completion state.
- **מרחב עבודה נקי** (Clean workspace): Multitype timeline + filtering keeps **Atomic Focus** alive even with full audit trail.

**Rationale:** Auto-decrement tied a data-integrity concern (mistaken Finish) to a UX gesture (back-navigation) that also has an entirely
legitimate, unrelated purpose (re-reading a step). Collapsing the two meant every EM who wanted to review a completed session risked
silently losing their recorded use. Removing it and routing **all** corrections through the existing, explicit **manual edit** control
keeps a single, unambiguous correction path — fully consistent with **Ownership**.

**Consequences:**

- Schema: `use_count` field on library row; timeline table includes `log_type` and optional `metadata`
(e.g. `{source: 'manual_edit', previous_value: 3, new_value: 5}`). No `auto_decrement` event type is needed.
- Player UX: Back-navigation is a pure navigation action — **no** side effects on `use_count` or completion state (OpenSpec: UI detail only).
- Library UX: **Manual edit** control (wording TBD: "Adjust count" or "Record use") with simple number input; optionally confirm if already >0.
- Timeline UX: Filter chip UI (Show: All / Events only / Corrections hidden); default = **Corrections hidden**; persisted user preference.
- Copy: "Your timeline, your view—you decide what to see." / "Going back is just re-reading — your progress stays exactly as you left it."

---

## DEC-008 — Smart-Linking timing, scope, conflict handling, and logging

**Status:** Agreed (2026-06-22, Yossef-Tal & Sigal) — resolves **GQ-005**

**Context:** **DEC-004** establishes Smart-Linking as intentional and user-controlled, never automatic. GQ-005 probed the mechanics:
timing (when can linking happen?), scope (can one event link to multiple groups?), unlinking (can EMs reverse links?), and
visibility (what timeline does an EM see when viewing a specific group?).

**Decision:**

1. **Timing of Smart-Linking (fully flexible):** The Event Manager may **link a timeline event** at **any point**:
   - **During an active Inquiry Session** (e.g., inside the Player or Reflective Journal steps) — immediate insight linking.
   - **Retroactively from the Chronological Timeline** — later reflection and organization.
   - No prescribed "correct" order; flexibility supports both spontaneous and deliberate linking.

2. **Scope & Multiple Links (no conflicts):** A **single timeline event may link to multiple entities simultaneously**
   (e.g., Symptom Group A + Symptom Group B + a specific Course). The system **rejects rigid folder hierarchy**; links are
   **overlays** on the timeline spine. **No conflict exists** because the Event Manager **defines the relevance** for each link.

3. **Unlinking (full Event Manager authority + light confirmation):** The Event Manager retains **absolute authority** to
   **unlink** an event from any Symptom Group or Course **at any time**. To prevent accidental data loss while preserving
   autonomy:
   - Unlinking is a **simple, accessible action**.
   - A **light confirmation prompt** accompanies it (e.g., "Remove link to Group A?" with Confirm/Cancel).
   - The EM may unlink without penalty; no "undo" window needed (can re-link retroactively anytime).

4. **Logging linking & unlinking actions:** Both **linking** and **unlinking** are **logged as timeline events**
   (log_type: 'link_created' / 'link_removed'). These appear in the Chronological Timeline as transparent, auditable actions
   and are **hidden by default** in the timeline filter (same as other technical corrections) to maintain **Atomic Focus**.

5. **Timeline visibility across group contexts (ADHD-friendly, with toggle):** To maintain **Atomic Focus** and prevent
   cognitive overload:
   - **Default:** When viewing a specific **Symptom Group's Work Session**, the EM sees **only events linked to that
     group** (clean, focused view).
   - **Toggle / Filter affordance:** A simple control (e.g., "Show All" or "Show Unlinked") allows the EM to see:
     - All unlinked events in the timeline (for retroactive linking discovery).
     - Events linked to other groups (for cross-referencing, if desired).
   - This supports **ADHD-friendly design** (reduce default cognitive load) without hiding information.

**Refines:**

- **DEC-004 (Smart-Linking):** Adds mechanics (timing, multiple links, unlinking, logging, filtering) that operationalize the
  "intentional, user-controlled" principle.
- **DEC-007 (Multitype Timeline Architecture):** Expands `log_type` categories to include 'link_created' and 'link_removed',
  hidden by default.

**Rationale:** Full flexibility (timing, multiple links, unlinking) respects Event Manager autonomy. Light confirmation and
logging (hidden by default) guard against accidental loss without creating friction. Group-scoped views + toggle + filtering
balance Atomic Focus (clean UX) with retroactive discovery (powerful organizing).

**Consequences:**

- Schema: timeline table tracks `log_type` values including 'link_created' (from_event_id, to_entity_type, to_entity_id) and
  'link_removed' (same fields); Smart-Link edge table (timeline_event_id ← many-to-many → group_id / course_id).
- UX: When viewing a Symptom Group's Work Session, render **linked events only** by default; add a filter chip UI toggle for
  "Show All / Show Unlinked."
- Player / Journal steps: Surfacing Smart-Link affordance (e.g., "Link to another group?" button) with simple modal or
  side panel.
- Copy: "Link events to groups and courses as they matter to your healing journey—one event, many threads."

---

---

## DEC-009 — Symptom rating polarity, directional flexibility, and Smart-Link integration

**Status:** Agreed (2026-06-22, Yossef-Tal & Sigal) — resolves **GQ-006**

**Context:** **DEC-004** introduces blind re-rating of symptoms. **DEC-008** allows one timeline event (execution) to link to
multiple Symptom Groups. **GQ-006** asked: if a technique links to multiple groups with overlapping symptoms, how should ratings
work? Answer refines the rating model with **polarity** (directional, not intensity-only).

**Decision:**

1. **Exclusive Polarity (one rating per symptom at a time):** Each symptom carries **exactly one rating** at any given time.
   That rating has a **polarity** — either **Positive** or **Negative** — never both simultaneously. Polarity represents the
   **direction** or **valence** of the symptom's current state (e.g., "Back Pain" as Negative; "Back Strength" as Positive).

2. **Directional Flexibility (EM can flip polarity):** The Event Manager has **absolute authority** to **change the direction**
   of a rating (Negative ↔ Positive) during any rating update or refresh. This reflects real healing journeys where a
   **pain-oriented symptom** evolves into a **strength-oriented state** (e.g., from "Back Pain" [Negative] to "Back Strength"
   [Positive]). The EM may also rename or reframe the symptom name when changing polarity if they choose.

3. **Atomic Focus in Rating:** **Only one symptom** is rated at a time (maintaining Atomic Focus). A symptom **belongs to only
   one Symptom Group** at a time, ensuring the Work Session stays focused. (A symptom cannot be "shared" across groups.)

4. **Rating Opportunity Triggers (three modes):**
   - **Session-scoped suggestion:** During an Inquiry Session on a **specific Symptom Group**, the app **optionally suggests**
     refreshing ratings for **all symptoms in that group** — still one symptom at a time, in sequence if the EM chooses.
   - **Smart-Link suggestion (close the feedback loop):** When a timeline event (technique execution) is **linked** to a
     Symptom Group or a **specific symptom**, the system **proactively suggests** rating those associated symptoms. This
     closes the feedback loop between the execution and "The Center" (the body's information).
   - **Ad-hoc / anytime:** The Event Manager may **independently rate any symptom at any time**, outside of structured
     sessions or linking actions.

5. **No multi-group rating collapse:** When an execution **links to multiple Symptom Groups**, the rating(s) apply to
   **symptom(s) in the linked groups independently**. The EM does not rate "Group A's pain intensity" vs. "Group B's pain
   intensity" in a single action. Instead, if both groups contain relevant symptoms, the EM rates each group's symptoms
   **separately** (or not at all, if they choose). This preserves **Atomic Focus** and prevents confusion about symptom
   ownership.

**Refines:**

- **DEC-004 (Blind rating):** Adds **polarity** dimension and **directional flexibility** (EM can flip); rating applies per
  symptom, one at a time.
- **DEC-008 (Smart-Linking):** Introduces **Smart-Link suggestion** to proactively prompt rating when a technique is linked,
  closing the feedback loop with "The Center."

**Rationale:** Polarity and directional flexibility honour the **healing journey narrative** (pain → strength; fear → confidence).
Exclusive polarity + Atomic Focus keep the UX simple and non-overwhelming. Multi-link scenarios don't collapse into one rating
because each Symptom Group's symptoms are distinct Work Session concerns.

**Consequences:**

- Schema: symptom row includes **`polarity`** field (Positive / Negative) + optional **`intensity`** or **`strength`** field (magnitude, TBD in
  OpenSpec). Rating history tracks polarity changes and timestamps.
- UX / Inquiry Session:
  - When suggesting a rating, display **current polarity** (but allow EM to flip it).
  - During **Smart-Link→suggest-rating**, surface a modal or side panel: "This technique is now linked to [Group Name]. Would you like to
    rate symptoms in that group?" with an affordance to rate or skip.
  - Always rate **one symptom** per action; optionally chain to the next symptom if the EM wants (sequence mode for convenience).
- Copy: "Rate symptoms one at a time — each reflects how you're experiencing this part of your healing journey."
- Glossary: clarify **Polarity** (direction) vs. intensity / strength (magnitude, TBD).

---

---

## DEC-010 — Polarity and Intensity as independent dimensions

**Status:** Agreed (2026-06-22, Yossef-Tal & Sigal) — resolves **GQ-007**

**Context:** **DEC-009** introduces **Polarity** (Positive or Negative valence). **GQ-007** asked whether Polarity and **Intensity**
(magnitude: 0–10) are separate data dimensions or linked/merged. Answer is **Option A: Separate**.

**Decision:**

1. **Independent Data Dimensions:** **Polarity** (direction: Positive or Negative) and **Intensity** (magnitude: typically 0–10)
   are **stored and tracked as separate fields** in the symptom rating record. This enables:
   - A symptom to **change polarity while maintaining magnitude continuity** (e.g., "Back Pain" 8/10 Negative → "Back Strength"
     2/10 Positive; the 2/10 reflects residual sensation, tracked consistently across the transformation).
   - Long-term analytics to **decouple valence from magnitude**, revealing pure growth trajectories regardless of how the EM
     currently frames the symptom.

2. **Unified UI Interaction (Atomic Focus):** Despite being separate in the data model, the UI presents Polarity + Intensity as a
   **single cohesive action** (e.g., polarity selection button, then intensity slider or step input). This maintains **Atomic
   Focus** and avoids cognitive overload—the EM experiences one rating action, not two.

3. **Future Analytics & AI:** Separating magnitude from valence is a standard practice in data science and supports future **AI
   agents** in identifying **patterns of growth** (declining intensity / increasing ease) across symptom reframings, without
   relying on label consistency.

4. **Intensity Scale (deferred to OpenSpec):** The specific range (0–10), directionality (does higher = better
   or worse?), and semantics (e.g., "intensity of pain" vs. "strength of ease") are TBD in OpenSpec. The architectural decision
   here is that the fields are **independent**, not the specific scale.

**Rationale:** Decoupling polarity and magnitude preserves data integrity, supports long-term insight, and future-proofs analytics
without complicating the present-moment UX.

**Consequences:**

- Schema: symptom rating record includes separate **`polarity`** (enum: Positive / Negative) and **`intensity`** (integer: 0–10)
  fields, plus `timestamp`, `history` (for tracking changes).
- Blind (re-)rating UX: when the EM rates, the system can hide/show prior polarity and intensity independently (e.g., hide both,
  or show only polarity to hint at direction but hide magnitude). Details in **GQ-008** (next).
- Analytics: query patterns like "all symptoms trending toward lower intensity" or "polarity-flipped symptoms that maintained
  low magnitude" become straightforward.
- Copy: "Rate the strength and direction—they tell your story separately."

---

---

## DEC-011 — Blind rating UX: both dimensions hidden by default, with easy override controls

**Status:** Agreed (2026-06-22, Yossef-Tal & Sigal) — resolves **GQ-008**

**Context:** **DEC-010** establishes Polarity and Intensity as independent fields. **GQ-008** asked: during blind re-rating, which
prior rating dimensions should the system show or hide? Answer is **Option A with an override affordance**.

**Decision:**

1. **Default: Both hidden (strongest bias prevention):** When offering a **blind re-rating** session, the system **hides both prior
   Polarity and prior Intensity** by default. The Event Manager rates fresh, with zero anchoring to the old state. This maximizes
   the integrity of the blind rating and prevents magnitude/polarity anchoring bias.

2. **Easy override controls (user autonomy):** The Event Manager can **easily request** to reveal one or both prior dimensions
   during the rating session via a simple affordance:
   - "Show prior polarity?" [toggle/button]
   - "Show prior intensity?" [toggle/button]
   - Or a combined "Show prior rating?" [toggle] if the EM wants both at once.
   - These controls are **always accessible**, not buried or punitive (e.g., no "click here to reduce bias protection").

3. **Rationale for override:** Respects **Event Manager ownership** — the EM may have legitimate reasons to see prior state
   (e.g., to remind themselves of context, to double-check consistency, or to intentionally track continuity). The system
   defaults to blind integrity but trusts the EM to choose otherwise when they need it.

**Refines:**

- **DEC-009 & DEC-010 (Blind rating):** Adds concrete UX rules: default both hidden, easy toggle to reveal.

**Rationale:** Blind rating integrity by default + EM sovereignty via easy override = best of both worlds.

**Consequences:**

- UX: When entering a blind re-rating flow, display a simple prompt or modal:
  ```
  "Rate this symptom (prior rating hidden to reduce bias)"
  
  ☐ Show prior polarity?
  ☐ Show prior intensity?
  
  [Polarity selection] [Intensity slider/input: 0–10]
  ```
  Checkboxes update the UI in real-time if tapped.
  
- Copy: "We hide your prior rating by default to keep your answer fresh. Check below if you'd like a reminder."
- Accessibility: Ensure toggle affordances are keyboard-navigable and screen-reader friendly.

---

---

## DEC-012 — Symptom name evolution: decoupled from polarity flip, optional anytime

**Status:** Agreed (2026-06-22, Yossef-Tal & Sigal) — resolves **GQ-009**

**Context:** **DEC-009** says the EM may flip Polarity and "may rename or reframe the symptom name when changing polarity if they
choose." **GQ-009** asked how to handle symptom renaming when Polarity flips. Answer is **Option A: Always optional, decoupled**.

**Decision:**

1. **Decoupled but Suggestive:** Symptom **name/label** and **Polarity** are **independent** concerns, but the system offers
   **light, optional suggestions** (not mandatory):
   - When **Polarity changes:** System suggests "You might want to review the symptom name" (soft nudge, no specific new name proposed).
   - When **symptom name changes:** System suggests "You might want to review the symptom polarity" (soft nudge).
   - Suggestions are **always skippable** and **never block** the action.
   - The EM may flip Polarity without renaming (e.g., keep "Back Pain" as Negative, then later flip to Positive).

2. **Renaming as Independent Action (MVP):** For the **MVP**, the Event Manager can **rename a symptom anytime** via a simple
   "Edit symptom name" action in the Symptom Group's settings or symptom card. Renaming is **always optional**, and suggestions
   (not requirements) are offered when the EM makes related changes.

3. **Post-MVP Enhancement:** Richer suggestion logic (e.g., AI-suggested names based on symptom history or polarity shift context)
   can be added post-MVP as a convenience feature.

4. **Semantics & UX:** The system **does not** warn or prevent confusing name-polarity pairs like "Back Pain" [Positive]. The EM
   owns their symptom language; if they choose to keep the name, it's valid. Suggestions are just nudges, not gates.

**Rationale:** Soft suggestions (nudges, not gates) + Event Manager autonomy. Respects the EM's choice to keep names even after
polarity changes, while offering helpful prompts for semantic clarity when they choose to make changes.

**Consequences:**

- Schema: symptom row includes **`name`** (string) and **`polarity`** (enum) as independent fields; no cascade or trigger between them.
- UX (MVP): Symptom card / Symptom Group settings → "Edit symptom name" button → simple text input → save. No auto-suggestion
  logic.
- Copy: "Name your symptom however makes sense to you. You can change it anytime in the group settings."
- Post-MVP roadmap: consider **Option B** (suggest rename on polarity flip) as a convenience enhancement.

---

---

## DEC-013 — Symptom Group lifecycle: perpetual with optional user-initiated archival

**Status:** Agreed (2026-06-22, Yossef-Tal & Sigal) — resolves **GQ-010**

**Context:** **DEC-002** establishes Symptom Groups as persistent **Work Sessions** (healing threads). **GQ-010** asked whether a
Symptom Group ever reaches a "done" or "archived" state. Answer is **Option A with user control**.

**Decision:**

1. **Perpetual by Default (No Forced Closure):** Symptom Groups are **never automatically marked as "done"** or hidden. They remain
   **perpetually available** in the EM's Symptom Group list and can be re-opened anytime. This honors the **self-healing as an
   ongoing journey** principle and avoids creating a sense of finality or forced closure.

2. **User-Initiated Archival (Optional):** The Event Manager may **manually archive** a Symptom Group at any time via a simple action
   (e.g., "Archive this group" button in group settings). Archived groups:
   - Move to an **"Archived"** or **"Inactive"** tab / view.
   - Remain fully **searchable, accessible, and restorable**.
   - Can be **un-archived anytime** if symptoms resurface or the EM wants to revisit them (e.g., full undo).

3. **No Forced Dormancy:** The system does **not** automatically transition a group to dormant or archived states based on inactivity
   timers or other heuristics. **Only the Event Manager decides** when a group feels "complete enough" to archive.

4. **Perpetual Timeline:** All documentation, ratings, and Integrating treatments remain **permanently** in the Work Session history,
   whether the group is active or archived.

**Rationale:** Perpetuity + user control honors the **Ownership** pillar (EM decides when/if to archive) and the self-healing continuum
(no false endpoints). Archival is a convenience feature for decluttering active views, not a lifecycle gate.

**Consequences:**

- Schema: Symptom Group row includes optional **`archived_at`** timestamp (null = active; set = archived). No cascade effects.
- UX:
  - Symptom Group list shows **Active** tab by default.
  - **Archived** tab / filter for archived groups.
  - "Archive" / "Unarchive" buttons in group settings (always available).
  - Archived groups remain visible in search results and Smart-Linking flows.
- Copy: "Archive a group when you want to focus on others. You can restore it anytime if symptoms return."

---

---

## DEC-014 — NEMAR inquiry flow: organic sequencing, self-sabotage as symptom, multi-layered logging

**Status:** Agreed (2026-06-22, Yossef-Tal & Sigal) — resolves **GQ-011**

**Context:** **DEC-001** defines Atomic Focus per Inquiry Session (one focus target). **GQ-011** clarified the mechanics of the two
NEMAR paths (Left: root cause diagnosis; Right: treatment selection). Answer is **Option C (Organic Flow)** with Self-Sabotage
redesigned as a dynamic symptom, and session documentation split into unit-level + session-level records.

**Decision:**

1. **Self-Sabotage as a Dynamic, Group-Specific Symptom (not a separate gate):**
   - **"Self-Sabotage"** (הכשלה עצמית) is **not** a mandatory pre-session check. Instead, it is a **symptom that can be added to any
     Symptom Group** at any time.
   - Each Symptom Group has its **own independent instance** of the Self-Sabotage symptom (if included), with independent
     **Polarity** and **Intensity** ratings (0–10).
   - Once a Self-Sabotage symptom is present in a group, the "safety check" is **satisfied by the standard symptom rating
     workflow** (blind re-rating, polarity flip, intensity update) — **no separate "Safety Check" UI flow** needed.
   - The EM may add or remove the Self-Sabotage symptom from a group based on current relevance.

2. **Organic Path Selection & Continuity (Option C):**
   - An Inquiry Session on a Symptom Group supports **organic flow** between Left (diagnose root causes) and Right (select treatments).
   - The session remains **anchored to one focus target** (one Symptom Group), honoring **Atomic Focus** on the group itself.
   - Within that group, the EM may:
     - Ask Left-path NEMAR questions (using a **Causes Table**) to diagnose causes.
     - Ask Right-path NEMAR questions (using a **Treatments Table**) to select treatments.
     - Execute treatments in the Player.
     - Return to Left or Right paths at any time during the same session.
   - **No prescribed order.** The body's NEMAR guidance (real-time muscle testing) directs the flow.

3. **Multi-Layered Documentation (Unit + Session audit):**
   - **Unit-level documentation:** Every individual unit of work (each cause diagnosed, each treatment executed) receives:
     - Its own **timeline entry** (log_type: 'cause_identified', 'treatment_executed', etc.).
     - Its own **documentation/note** (captured in Reflective Journal or inline during session).
   - **Session-level documentation:** In addition, the system maintains a **comprehensive session audit** that:
     - Records all units executed within that specific Inquiry Session.
     - Preserves the **chronological flow** of the session (EM navigated Left → Right → Left → Player, etc.).
     - Captures **session-level context** (mood, insights, blockers encountered during the session).
   - Both levels coexist: granular unit logs + holistic session story.

4. **Causes Table & Treatments Table:**
   - **Causes Table:** A structured reference of potential root causes (system-provided, group-specific, or EM-customized).
     EM muscle-tests Left-path NEMAR questions to narrow down actual causes for the group.
   - **Treatments Table:** A structured reference of available treatments/techniques (system-provided, course-derived, or
     EM-customized). EM muscle-tests Right-path NEMAR questions to select what to execute.
   - Both tables are **Smart-Linkable** to Symptom Groups; the EM may attach causes/treatments to group documentation.

5. **Atomic Discovery Mechanics (Category → Item Progression):**
   - **Category-level NEMAR inquiry (first):** Before drilling down into items, the EM muscle-tests a category question:
     - "Is the most **NEMAR** cause **Physical**?" / "Is the most **NEMAR** treatment **Energetic**?" etc.
     - Four categories: Physical, Emotional, Energetic, Conscious (system-defined, extensible).
   - **Item-by-item discovery (after category selected):** Once a category is chosen, the system presents items **one-by-one**:
     - "Is **'Being Worthy'** the most **NEMAR** cause for me right now?"
     - "Is **'Ocean of Thoughts'** the most **NEMAR** treatment for me right now?"
     - Maintains **Atomic Focus**: one question at a time, one item tested per step.
   - **Result:** EM narrows down from category → specific item without cognitive overload.

6. **Intuitive Choice Rule (Global Logic Exception):**
   - **Global NEMAR answer:** If the EM muscle-tests a **category-level or whole-table NEMAR question** 
   (e.g., "Is there a **NEMAR** treatment for me in this category?") and the body responds with a 
   **clear global 'Yes' or global 'No'** (not a specific item), the system **bypasses atomic item-by-item discovery** 
   and displays the **entire table** to the EM for **intuitive selection**.
   - **Intuitive choice UX:** EM scans the full table and selects what *feels* right, without being forced through 
   10+ NEMAR questions.
   - **User preference overrides:** The EM can set system-wide defaults to:
     - **"Always show entire table"** (skip Atomic Discovery entirely, show full table by default).
     - **"Always show entire category"** (skip item-by-item after category selection, show full category by default).
   - **Pairwise Category Testing (optional):** When viewing multiple categories 
   (e.g., Physical, Emotional, Energetic, Conscious), the EM can request **"Show categories two by two"**: 
   system asks NEMAR about pairs ("Is it **Physical OR Emotional**?"). Only if the answer is **Yes**, 
   the system splits into **two separate NEMAR questions** ("Is it **Physical**?" and "Is it **Emotional**?").
     This keeps category discovery efficient while respecting the body's binary choices.
   - **Rationale:** Honors the body's intelligence — sometimes the body says "all of these could help" (global Yes) or "none of the standard
     causes fit" (global No), and the EM needs visual context to make the final choice.

7. **Scope Definition & Completion Verification (Additional NEMAR Questions):**
   - **Scope question (before starting work):** "Is it **NEMAR** to treat the **entire symptom list** together 
   [in this session]?" If No, EM may narrow scope to specific symptoms.
   - **Completion question (after Player Finish or treatment execution):** 
   "Is it **NEMAR** that this treatment has finished successfully?" 
     Optional binary muscle-test to affirm completion (used alongside Integrating state, DEC-006).
   - Both are **voluntary NEMAR inquiries** the EM can trigger, not mandatory gates.

**Refines:**

- **DEC-001 (Atomic Focus):** Atomic Focus applies per **focus target** (Symptom Group), not per **path unit**. One group = one session;
  multiple causes/treatments within that session are supported.
- **DEC-002 (Work Session continuity):** Multi-layered docs enrich the group's persistent Work Session log with both granular and
  holistic narratives.
- **DEC-004 (Timeline):** Unit-level logs create additional timeline events; session audit provides cross-referencing.

**Rationale:** Organic flow honors the body's real-time guidance (NEMAR as a dynamic navigator, not a rigid gate). 
Self-Sabotage as a symptom simplifies UX (no special flow), increases relevance (group-specific), 
and aligns with the rating system. 
**Atomic Discovery** (category → item progression) maintains **Atomic Focus** while navigating complex tables—
no cognitive overload from asking 10+ individual questions. **Intuitive Choice Rule** honors moments 
when the body provides a global answer (Yes or No to whole category), allowing the EM to use intuition 
for final selection. Multi-layered docs preserve both precision (unit work) and narrative (session context).

**Consequences:**

- Schema:
  - Symptom Group row includes optional **`self_sabotage_rating`** (Polarity, Intensity, history). 
  Can be null if not added to group.
  - **Causes Table & Treatments Table** rows include **`category`** field (enum: Physical, Emotional, Energetic, Conscious).
  - Session/Inquiry record includes **`session_audit`** (JSONB or text) capturing all unit types and flow sequence.
  - Timeline events gain expanded **`log_type`** values: 
  'cause_identified', 'treatment_selected', 'treatment_executed', 'session_opened', 'session_closed', etc.

- UX (Inquiry Session on Symptom Group):
  - **No mandatory "Safety Check" step.** If Self-Sabotage symptom exists in group, EM rates it as part of group rating workflow.
  - **No "Choose Left or Right" picker.** EM flows organically: starts with Empty Vessel, then navigates to Causes Table or
    Treatments Table based on intent or body guidance.
  - **Atomic Discovery UI for Tables (configurable defaults):**
    - **User preferences:** EM can set system-wide defaults to:
      - "Always show entire table" (skip Atomic Discovery, show full table immediately).
      - "Always show entire category" (after category selection, show full category rather than item-by-item).
    - **Scope question (optional):** "Is it NEMAR to treat the entire symptom list together?" [Yes/No muscle test].
    - **Category selection (with pairwise option):**
      - **Standard:** "Is the most NEMAR [Cause/Treatment] **Physical** / **Emotional** / **Energetic** / **Conscious**?" 
        [One-at-a-time or direct picker].
      - **Pairwise mode (if EM prefers):** System groups categories two-by-two. NEMAR question: "Is it **Physical OR Emotional**?" 
        If Yes, system then asks: "Is it **Physical**?" and "Is it **Emotional**?" separately to narrow further. If No, 
        system moves to next pair (e.g., "Is it **Energetic OR Conscious**?").
    - **Item-by-item after category (if not overridden by user preference):** 
    "Is **[Item Name]** the most NEMAR [Cause/Treatment] for me right now?" 
      [Presented sequentially, one item per screen—Atomic Focus].
    - **Intuitive Choice override:** If global NEMAR to category/table = Yes or No, display full table for intuitive scan + selection.
  - **Unit affordances:** "What did you discover?" (cause), "What did you execute?" (treatment) capture unit-level docs.
  - **Completion verification (optional):** "Is it NEMAR that this treatment has finished successfully?" 
    [Optional yes/no muscle test after Player Finish].
  - **Session audit:** At session close (or anytime), display/download comprehensive session log: "Today in this group: [causes
    diagnosed], [treatments run], [insights captured]."

- Copy: "Your body guides you. Diagnose causes, select treatments, or flow between them—whatever feels right. 
We ask one question at a time. When your body says 'yes or no to all,' we show you the full menu to choose from." 
or flow between them—whatever feels right. We log every discovery."

---

## Diagram: Inquiry Session Flow (Organic Multi-Path Model)

```
┌─────────────────────────────────────────────────────────────────┐
│                    INQUIRY SESSION ENTRY                         │
│                  (Anchored to one Symptom Group)                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
           ┌─────────────────┐  ┌─────────────────┐
           │  EMPTY VESSEL   │  │  GROUP RATINGS  │
           │ (Free writing)  │  │ (+ Self-Sabotage│
           │   OPTIONAL      │  │  if added)      │
           └────────┬────────┘  └────────┬────────┘
                    │                    │
                    └────────┬───────────┘
                             ▼
                   ┌─────────────────────┐
                   │  ORGANIC FLOW GATE  │
                   │  (Body guides EM)   │
                   └────┬────────────┬───┘
                        │            │
         ┌──────────────┘            └──────────────┐
         ▼                                          ▼
    ┌─────────────┐                        ┌─────────────────┐
    │  LEFT PATH  │                        │   RIGHT PATH    │
    │ (NEMAR on   │                        │  (NEMAR on      │
    │  Causes)    │                        │  Treatments)    │
    └────┬────────┘                        └────┬────────────┘
         │                                      │
         ├─ Cause identified                    ├─ Treatment selected
         │  [Timeline: cause_identified]        │  [Timeline: treatment_selected]
         │  [Unit doc captured]                 │  [Unit doc captured]
         │                                      │
         └──────────┬───────────────────────────┘
                    │
        ┌───────────▼───────────┐
        │  CONTINUE IN SESSION? │
        └───────┬───────────────┘
                │
     ┌──────────┴──────────┐
     │                     │
   YES                    NO
     │                     │
     ▼                     ▼
┌──────────┐        ┌────────────────┐
│ Back to  │        │ SESSION AUDIT  │
│ Organic  │        │ (Comprehensive │
│  Flow    │        │  session log)  │
│ (Left or │        │ [Session Finish│
│  Right)  │        │  Timeline]     │
└────┬─────┘        └────────┬───────┘
     │                       │
     └───────────────────────┼───────────────────────┐
                             │                       │
                      ┌──────▼──────┐     ┌──────────▼──────┐
                      │   PLAYER    │     │ REFLECTIVE      │
                      │ (Execute    │     │ JOURNAL         │
                      │ treatment)  │     │ (Optional)      │
                      └──────┬──────┘     └─────────────────┘
                             │
                      ┌──────▼──────────┐
                      │ Player Finish   │
                      │ (use_count +1)  │
                      │ [Timeline: tech │
                      │  _executed]     │
                      └────────┬────────┘
                               │
                      ┌────────▼────────┐
                      │ Integrating or  │
                      │ Continue in     │
                      │ Organic Flow?   │
                      └─────────────────┘
```

---

**Key Features of the Diagram:**

1. **Organic Flow Hub:** Once past Empty Vessel + Ratings, the EM flows freely between Left (Causes) and Right (Treatments).
2. **No Prescribed Order:** Multiple causes can be diagnosed before any treatment. Multiple treatments can be selected/executed.
3. **Unit-Level Logging:** Each cause identified and each treatment executed generates its own timeline entry.
4. **Session Audit:** At session close, a comprehensive record captures the entire session narrative.
5. **Player Integration:** Treatment execution (via Player) is one possible unit within the session, not the only path.
6. **Post-Player:** After Finish, EM can continue in the organic flow (more causes, more treatments) or close the session.

---

## DEC-015 — Unified Player: atomic units, visibility-based state machine, and sovereign completion

**Status:** Agreed (2026-06-27, Yossef-Tal & Sigal) — resolves **GQ-012**; **substantially amended (2026-07-02)** — resolves
**GQ-018** (Completion Semantics), fixing Audit Contradictions **1.1, 1.2, 1.3, 1.4**.

**Context:** **DEC-006** defines Player **Finish** (סיום) as the trigger for auto +1 use_count. **DEC-014** establishes Atomic
Discovery for treatment/cause selection. **GQ-012** originally refined Player architecture around **Event Manager Sovereignty**
and **Atomic Focus**, introducing a **Structured Markdown content pipeline**.

**Amendment (2026-07-02, GQ-018):** The Architecture Stress-Test found that DEC-006's "required steps" language, this decision's
"no validation gates" principle, and **DEC-016**'s separate Done/Skip/Back button set for courses described **three incompatible
completion models** for what should be one Player. This amendment replaces §1 and §4 below in full, and establishes **one**
state machine — the **Unified Player** — that governs **every** sequence of atomic content in PiC: standalone treatments,
techniques, and course lessons alike. §2 (Structured Markdown) and §3 (content pipeline) are retained essentially unchanged.

**Amendment (2026-07-13, Visibility-Based Completion):** Further refined the Unit-Level Actions model (§2) to replace manual
"Done"/"Skip"/"Back" buttons with an automatic visibility-based state machine. **Movement through content** (navigation or
rendering) now serves as the technical trigger for unit-state transitions, eliminating manual confirmation gates while preserving
the EM's agency via the container-level **Finish** action.

**Decision:**

1. **One Player, One Model — the "Unified Player":**
   - There is **no functional distinction** between a "Treatment Player" and a "Course Player." Both are the same
     **Unified Player** engine: a sequence of **Atomic Units** — the umbrella term replacing the separate vocabularies of
     "Player step" (treatments) and "lesson block" (courses, **DEC-016**). Every Atomic Unit is authored in **Structured
     Markdown** (H3 = one unit, per §2 below).
   - A course's Atomic Units may include a **Treatment Reference** (**DEC-016** block type): entering it opens a **nested
     Unified Player instance** scoped to that protocol's own Atomic Units, governed by the identical state machine below.
     Nesting is expected and supported, not an edge case.

2. **Unit-Level State Transitions — Flat 4-State Model (Visibility-Based, No Manual Gates):**
   - **Atomic Unit states (flat enum):** Each Atomic Unit has a persisted state:
     - `unseen` — The unit has not yet been rendered or reached by the EM.
     - `in_view` — The unit is currently visible in the viewport (**ephemeral, session-based state**, not persisted to disk).
     - `skipped` — The unit was bypassed via a forward jump in the Navigation Tree (persisted, indicating "once passed over").
     - `completed` — The unit was engaged with (rendered and navigated past, persisted, indicating "fully engaged").
   - **State transitions — visibility and navigation triggers:**
     - `unseen` → `in_view`: Triggered when the unit is **rendered in the viewport** (automatic, no button required).
     - `in_view` → `completed`: Triggered when the EM **navigates to the next unit** (forward or backward, automatic).
     - `unseen` → `skipped`: Triggered when the EM **uses the Navigation Tree to forward-jump** past the unit without rendering it
       (intermediate units between current and selected are auto-marked `skipped`).
     - **Upgrade transition (re-engagement of skipped units):**
       - `skipped` → `in_view`: When a `skipped` unit is **revisited and rendered** (e.g., via backward tree navigation), it
         transitions to `in_view` per the visibility trigger.
       - `in_view` → `completed`: When the EM **navigates forward** from the re-engaged `skipped` unit, it transitions to
         `completed` (semantic result: the record "cleans" — what was skipped is now fully engaged).
   - **Both `skipped` and `completed` are "past" states — non-blocking:** Neither state blocks the EM's ability to progress
     forward, reach the final unit, or trigger the **Finish** action. The system treats both as "progressed beyond."
   - **EM agency preserved — backward navigation and revisiting:** The EM may navigate **backward** at any time to revisit prior
     units. Navigating backward to a `completed` unit **does not revert** it to `unseen`, `in_view`, or `skipped` — it remains
     `completed`. This preserves the non-linear therapeutic reality: revisiting content is "deepening," not "undoing."
   - **Exit during in_view:** If the EM exits the session while a unit is in `in_view` (rendered but not yet navigated past), that
     unit's persisted state remains **unchanged** (`unseen` or `skipped`). The transition to `completed` occurs only upon active
     navigation to another unit.
   - **Step Completion (unit-state transition) vs. Overall Success Declaration (Finish):** Unit-state transitions happen
     automatically and silently as the EM moves through content. They are **local**, **ephemeral** (in_view), or **persisted**
     (unseen/skipped/completed), and they are **not** success metadata. Overall success is declared only via the explicit
     **Finish** action at the container level (§4 below).
   - **No validation gates in unit-level logic:** The system never blocks the EM from progressing to the next unit, skipping
     forward via the Navigation Tree, or navigating backward. Movement is the EM's declaration of progress; the system honors it.

3. **Abolishing "Required" as a Technical Gate:**
   - **No unit — standalone step or course block — can block the EM from reaching "Finish."** There is no system-enforced
     "required steps" check anywhere in the Unified Player.
   - `is_optional` (and any course-side `is_required` flag) becomes a **purely editorial signal** from the content author
     (e.g. Sigal): a **display hint** only (such as subtle emphasis in the UI), **never** a technical condition the system
     evaluates before allowing Finish. This retires the "required steps" clause of **DEC-006** §1 and the "required blocks"
     gate of **DEC-016** §3–4 (see amendments to those decisions).
   - **Intuitive progression, unchanged from the original decision:** the EM decides when a unit is complete based on
     internal readiness (whether they fully executed the action, understood it, or intuitively chose to skip it).

4. **Container-Level Finish Action and Terminal Button Logic (Two-Option Switch):**
   - **Finish is the sole success trigger:** Available **only** after the **Terminal NEMAR** (§7b) has been engaged with a **Yes**
     response. The Terminal NEMAR is the mandatory final step preceding Finish (סיום) in all Unified Player instances. Pressing
     **[Finish]** (סיום) triggers **success metadata**:
     - If the instance maps to a Personal Treatment Library row: `use_count` +1 (**DEC-006**).
     - If the instance is a course: course status → `"Successfully Completed"` (**DEC-016** §4).
     - A Diary-model timeline snapshot is recorded (**DEC-016** §5), unchanged.
   - **Terminal button behavior — conditional branching based on Terminal NEMAR response:** At the Terminal NEMAR unit:
     - **If the EM selects "Yes":** The system displays a standard **[Finish]** button. Pressing it triggers success declaration
       immediately, recording the session as `"Successfully Completed"` and incrementing success metadata.
     - **If the EM selects "No":** The specific remedial logic is TBD (awaiting therapeutic guidance). The session is marked
       "In-Process, Not Yet Complete." The EM retains sovereign access to **[Finish Anyway]** (see below).
   - **Sovereign bypass — [Finish Anyway] remains always available:** Regardless of Terminal NEMAR response or prior unit states,
     the EM may access **[Finish Anyway]** to force success declaration and close the session. This honors EM sovereignty: they
     are
     the director of their own process and may choose to complete even if the Terminal NEMAR indicates "No" or if prior units
     remain skipped. **[Finish Anyway]** always triggers success metadata (`use_count` +1, course completion) without judgment.
   - **Non-blocking sovereignty:** The Terminal NEMAR is a mandatory touchpoint but not a technical gate. The EM's choice is
     always respected and acted upon.

5. **No Auto-Decrement — "Revisiting" Is Not "Revoking":**
   - Navigating "Back" — at any point, including after Finish — is **"Revisiting."** It **never** decrements `use_count`,
     **never** un-marks `"Successfully Completed"`, and **never** alters any unit's stored state automatically. This
     retires **DEC-007** §1 (auto-decrement on back-navigation) in its entirety.
   - The **only** sovereign path to correct `use_count` after the fact is the **manual edit** in the Personal Treatment
     Library (**DEC-007** §2, unchanged) — an explicit EM reassessment, never inferred from navigation behavior.

6. **Persistence of Unit State Beyond Finish ("Deepening"):**
   - Every Atomic Unit's **automatically-computed state** — `completed` / `unseen` / skipped (subset of unseen) — is
     **permanently recorded** and remains available **after** a "Successfully Completed" or Finish declaration.
   - The EM may return to a "Successfully Completed" instance at any time and **"deepen"** into previously skipped or unseen
     units by navigating backward. Revisiting units causes their states to remain `completed` (revisiting does not revert state,
     per §2). The EM may engage the content more deeply, spend longer on reflection, or simply re-read for reinforcement.
   - **Deepening does not trigger a second Finish or a second `use_count` +1** (**DEC-006** §5) unless the EM explicitly starts a
     new session/run. The first Finish declaration is final for success metadata purposes; revisiting is pure learning, not a
     new attempt.
   - This models the therapeutic reality that healing content can be revisited and re-absorbed without ever having to "undo" a
     prior success to keep learning.

7. **Reflection Prompt Units (Standard Polymorphic Atomic Unit Type):**
   - A **Reflection Prompt** is a standard **Atomic Unit type** available in **any Unified Player instance** — treatments,
     techniques, courses, or any other content sequence. It is **not** course-specific.
   - When the EM reaches a Reflection Prompt unit in sequence (rendered in viewport via the visibility-based state machine in
     §2), the system **automatically surfaces a journal-input affordance** — this is simply what that unit *is*, not a forced
     interruption of the Unified Player model. The EM may enter reflective text inline.
   - The unit's state transitions automatically as the EM moves through content (per §2); entering text does **not** require
     explicit confirmation. **Progressing to the next unit** commits any entered text as a linked entry to the **Reflective
     Journal** (with automatic Smart-Link to the current context: the Symptom Group, course enrollment, or timeline event
     scope). If the EM navigates **backward** to revisit the Reflection Prompt unit, the journal entry is **preserved and
     editable**, supporting non-linear reflection.
   - **No manual "Done" button required** — the automatic state transition (movement/visibility) serves as the submission
     trigger. The EM's agency is preserved entirely: they may spend as long as they like on a Reflection Prompt before moving
     forward, or skip it entirely by navigating forward without engaging.

7a. **Navigation Tree — Exclusive Non-Linear Manual Navigation:**
   - **Exclusivity principle:** The **Navigation Tree** (a hierarchical outline of all Atomic Units in the sequence) is the
     **only** manual mechanism for non-sequential movement within the Unified Player. There is **no "Skip" button** in the
     primary Player UI.
   - **Navigation Tree representation:** The tree displays all H3-defined Atomic Units as selectable nodes, ordered sequentially.
     The EM's current position is marked. The tree is always accessible during a Player session.
   - **Forward jump via tree selection (setting the skipped state):**
     - When the EM selects a **future Atomic Unit** in the tree (forward of the current unit), the system automatically
       transitions all **intermediate units** (those between current and selected) from `unseen` to the `skipped` state.
     - The `skipped` state is a persisted "past" state indicating the unit was bypassed via forward jump, not engaged directly.
     - The EM may continue forward from the selected unit or may return to skipped units anytime via tree navigation.
     - **No blocking gates:** The `skipped` state does not prevent the EM from reaching the **Finish** action at the final unit.
   - **Backward navigation via tree selection (revisiting & upgrade path):**
     - When the EM selects a **previous Atomic Unit** in the tree (backward from the current unit), the system navigates to
       that unit and renders it for engagement.
     - If that unit is in `completed` state: Navigating backward **does not revert** it to `unseen`, `in_view`, or `skipped`
       — it remains `completed`. This preserves the non-linear therapeutic reality: revisiting is "deepening," not "undoing."
     - **If that unit is in `skipped` state (upgrade path):** Rendering the unit transitions it to `in_view` (per the visibility
       trigger in §2). When the EM **navigates forward** from this re-engaged unit, it transitions from `in_view` to `completed`
       (the record "cleans" — what was skipped is now fully engaged). This is a **metadata refinement only**, never blocking
       progress or triggering duplicate success metadata.
     - Backward navigation never decrements `use_count` or revokes a prior **Finish** declaration.
   - **Consistency across content types:** Navigation Tree logic applies uniformly to standalone treatments, techniques, and
     course lessons — all share the Unified Player engine and the same state-machine rules.

7b. **Terminal NEMAR — Mandatory Final Muscle Test Before Finish:**
   - **Mandatory sequence:** The Terminal NEMAR is now a **mandatory Atomic Unit** that must appear as the **final step** in every
     Unified Player sequence (treatments, techniques, courses), immediately preceding the Finish (סיום) action. The EM must pass
     through this unit to reach the final success trigger.
   - **Muscle Test Inquiry:** The Terminal NEMAR unit displays a binary inquiry:
     - **"Is it NEMAR that this [Treatment/Course/Technique] ended successfully?"**
     - The interface provides **Yes** and **No** buttons based on the EM's body response via muscle testing.
   - **The "Yes" Path (Success Flow):**
     - If the EM selects **Yes**, it indicates the therapeutic/learning process is complete and successful (per the body's
       wisdom).
     - The system enables the **[Finish]** (סיום) button, allowing the EM to trigger success metadata (`use_count` +1 for
       treatments, course status `"Successfully Completed"` for courses) and close the session.
   - **The "No" Path (In-Progress Flow — Therapeutic Guidance TBD):**
     - If the EM selects **No**, it indicates the process is not yet complete or successful.
     - **Specific remedial logic is TBD — awaiting therapeutic guidance.** For now, define the state as "In-Process, Not Yet
       Complete" without specific next steps.
     - The system does **not** block forward progress; the EM retains sovereign access to the **[Finish Anyway]** branch (§4)
       regardless of Terminal NEMAR response, honoring their authority over their own process.
   - **Non-Blocking Sovereignty:** While Terminal NEMAR is mandatory to reach, the EM's sovereign bypass (§4, **[Finish Anyway]**)
     remains always available. The Terminal NEMAR is a mandatory touchpoint, not a technical gate.
   - **Consistency:** Applied uniformly to all Unified Player instances (standalone treatments, nested Treatment References in
     courses, and course lessons themselves).
   - **Interaction:** Terminal NEMAR is a standard Atomic Unit and follows all visibility-based state transitions (§2) and
     Navigation Tree rules (§7a). The EM may navigate backward to revisit the Terminal NEMAR anytime without revoking prior
     success metadata (§5).

8. **Structured Markdown as Content Standard (unchanged from original DEC-015):**
   - All treatments, protocols, techniques, and course lessons are authored or converted to **Structured Markdown**.
   - **Atomic rule:** every **H3 header (###)** in the document automatically defines one Atomic Unit.
     - Example:
       ```markdown
       ### Step 1: Relax Your Shoulders
       Take a deep breath and let your shoulders drop naturally.

       ### Step 2: Feel the Release
       Notice where you feel the release happening in your body.

       ### Step 3: Hold the Awareness
       Maintain this feeling for 30 seconds without forcing.
       ```
   - **Benefits:** Clear, simple parsing logic; easy for EM and course creators to add steps; consistent structure across all protocols.

9. **Content Transformation Pipeline — Unit Rationale Extraction:**
   - A **Content Parser** converts existing HTML content and future Structured Markdown into JSON Atomic Unit entries, with the
     following schema:
     - `unit_number`, `unit_title`, `unit_content` (primary therapeutic content)
     - `unit_order` (sequencing)
     - `unit_rationale` (optional, extracted via blockquote parsing — see below)
     - `is_optional` (optional, display hint only, non-enforced)
   - **Structured Markdown parsing rule for unit_rationale:**
     - Any **blockquote (>)** appearing immediately after an H3 header is extracted as the `unit_rationale` field.
     - Example:
       ```markdown
       ### Step 1: Feel Your Breath
       > This step activates parasympathetic nervous system awareness, allowing the body to recognize safety signals naturally.
       
       Take three slow breaths and notice where you feel the air moving in your body.
       ```
       Parsed as:
       - `unit_title`: "Step 1: Feel Your Breath"
       - `unit_rationale`: "This step activates parasympathetic nervous system awareness, allowing the body to
         recognize safety signals naturally."
       - `unit_content`: "Take three slow breaths and notice where you feel the air moving in your body."
   - **Ownership & Authority:** The `unit_rationale` content is 100% authored by the content creator (e.g., Sigal) and reflects
     their clinical/therapeutic reasoning. This architectural update provides the container only; therapeutic intent remains
     entirely theirs.
   - **Separation of concerns:** `unit_rationale` is persisted as distinct metadata in the JSON structure, separate from
     `unit_content`, enabling deepening without cluttering the primary unit view.
   - The parser applies uniformly to **all content types** (standalone treatments, techniques, and course lessons) processed by
     the Unified Player. If no blockquote follows an H3 header, `unit_rationale` is omitted or set to `null`.
   - Graceful degradation: If parsing fails, the unit falls back to a single `unit_content` container (no rationale layer).

9a. **The "Info" Affordance — Optional, Non-Blocking Deepening UI:**
   - **Purpose:** Surface the `unit_rationale` metadata without cluttering the primary unit view or interrupting Atomic Focus.
   - **Mechanism:** An optional, non-blocking UI affordance (e.g., a subtle "info" icon, label, or button) is displayed alongside
     or near the unit title when `unit_rationale` is present. Interaction is entirely optional.
   - **Pull-Based Visibility:** The rationale layer is **hidden by default**. It is only revealed when the EM explicitly requests
     it (e.g., by tapping the "info" icon). This preserves the primary unit's clarity and Atomic Focus (§1, DEC-001).
   - **Content and Intent:** When revealed, the `unit_rationale` displays the clinical/therapeutic reasoning authored by the
     content creator (e.g., why this step is included, what mechanism it targets). This context supports **deepening** — allowing
     the EM to understand the "why" behind the "what" without requiring it.
   - **Non-Blocking Navigation & Finish:**
     - Opening, reading, or closing the rationale layer does **not** affect unit state transitions (§2).
     - Interacting with rationale does **not** block forward navigation, backward navigation, or the **Finish** action.
     - The rationale layer is a **pure information layer**, never a gate.
   - **Consistency:** This affordance applies uniformly to all content types in the Unified Player (standalone treatments,
     techniques, and course lessons) where `unit_rationale` is present.
   - **Deferred to OpenSpec:** Button styling, icon design, accessibility, animation, and specific placement are deferred to the
     OpenSpec phase. This decision specifies the logical layer (hidden by default, optional interaction) only.

**Refines / Supersedes:**

- **Supersedes DEC-006 §1:** removes the "required steps" precondition; the `use_count` trigger is now purely "Finish at the
  final Atomic Unit of a library-mapped instance" (amended DEC-006, 2026-07-02).
- **Supersedes DEC-007 §1:** removes auto-decrement on back-navigation entirely (amended DEC-007, 2026-07-02).
- **Supersedes DEC-016 §3–4:** removes the "required blocks" gate; unifies course Player mechanics with this decision's
  visibility-based state machine instead of describing a separate button set (amended DEC-016, 2026-07-02).
- **DEC-001 (Atomic Focus):** Atomic Focus now applies uniformly to **one Atomic Unit at a time**, in **any** Unified Player
  instance — treatment, technique, or course lesson — collapsing what were previously two described navigation models into
  one.

**Rationale:** A single, content-type-agnostic Player removes the two-button-set contradiction (Audit 1.2) at its root: there
is only one Player component, one state machine, used everywhere. The **visibility-based state machine** (movement/rendering as
the trigger for unit-state transitions, per §2) removes the need for manual "Done"/"Skip"/"Back" buttons while preserving EM
agency through the container-level **Finish** action. Success becomes purely an act of EM declaration, never a computed gate.
Removing auto-decrement (Audit 1.3) closes the one place where the system silently overrode an EM's declared completion:
"Revisiting" is now always safe, never punitive. Persistence of unit state after Finish honors the non-linear, permeative
nature of healing (**CLAUDE.md** §2.E, §2.G) without requiring the EM to "undo" success in order to keep learning.

**Consequences:**

- **Schema:**
  - `player_steps` / `lesson_blocks` unify under a single **Atomic Unit** concept with the following fields:
    - `unit_state` (enum: `unseen` / `in_view` / `skipped` / `completed`). Ephemeral: `in_view` (session-based, computed
      in real-time); Persisted: `unseen`, `skipped`, `completed`.
    - `unit_title`, `unit_content` (primary therapeutic content, authored by content creator).
    - `unit_rationale` (optional, extracted from blockquote after H3 header; contains clinical/therapeutic reasoning).
    - `unit_order` (sequencing).
    - `is_optional` (optional, non-enforced editorial display hint; rename to `is_recommended` in OpenSpec).
  - The former `is_optional` boolean is retained **only** as a non-enforced editorial display hint (consider renaming to
    `is_recommended` in OpenSpec to avoid implying enforcement).
  - `inquiry_session` / `course_sessions` gain a `finished_at` timestamp (set only by the explicit Finish action) distinct
    from unit-level `unit_state` completion, and a `success_declared` boolean set **only** by Finish — never inferred.
  - `protocols` / course tables retain `content_format` (enum: `structured_markdown`, `other`).
  - A viewport/render event triggers the `unseen` → `in_view` transition; a navigation-forward event triggers the
    `in_view` → `completed` transition (no manual buttons required).
  - **Unit Rationale metadata:** Extracted via blockquote parsing (§9), persisted separately from `unit_content`, surfaced via
    optional "info" affordance (§9a) with pull-based visibility (hidden by default).
  - **Flat 4-state transitions (§2):**
    - `unseen` → `in_view`: Unit rendered in viewport (automatic).
    - `in_view` → `completed`: EM navigates to next unit (automatic).
    - `unseen` → `skipped`: EM uses Navigation Tree to forward-jump past the unit (automatic).
    - `skipped` → `in_view` → `completed`: EM revisits skipped unit, renders it, then navigates forward ("upgrade" path,
      non-blocking metadata refinement, no duplicate `use_count` trigger).
  - **Navigation Tree state machine (§7a — exclusive non-linear navigation):**
    - Forward jump via tree selection: intermediate units `unseen` → `skipped` (persisted, enabling future deepening).
    - Backward navigation via tree selection: "Revisiting" — `completed` units never revert state, `skipped` units upgrade via
      the normal visibility-based transitions when re-engaged. No state reversion, no use_count changes, pure deepening.
    - Non-revocation principle: backward movement never decrements success metadata or undoes a prior Finish declaration.
    - Both `skipped` and `completed` are "past" states — neither blocks Finish action.
- **Player state machine (not UI/UX):** This decision specifies the **flat 4-state transition logic**:
  - Unit rendering → `unseen` to `in_view` (automatic).
  - Navigation forward / progression → `in_view` to `completed` (automatic).
  - Navigation Tree forward jump → `unseen` to `skipped` (automatic, intermediate units).
  - Navigation Tree backward to skipped unit → `skipped` to `in_view` (automatic render), then `in_view` to `completed` (automatic
    navigation, "upgrade" path).
  - Navigation backward / revisiting → remains in prior state (`completed` never reverts, `skipped` can upgrade), can re-engage
    for deepening (never revokes state or success metadata).
  - Terminal button display logic (§4) is computed from persisted `unit_state` values, not from UI interaction.
  - **Exclusive skipping via Navigation Tree (§7a):** The Navigation Tree is the **only** manual mechanism for setting the
    `skipped` state. There is **no "Skip" button** in the primary Player UI. Forward jumps via tree selection trigger automatic
    `unseen` → `skipped` transitions for intermediate units.
  - Button placement, visual styling, and interaction affordances are deferred to OpenSpec.
- **Player UX (deferred to OpenSpec):** This decision defines the state machine, not the screen. Button placement,
  visual styling, modal design, scroll mechanics, and viewport-detection methods all belong to OpenSpec. The state
  machine here is content-agnostic: HTML render, canvas, audio timeline, PDF viewport, etc., all trigger state
  transitions via the same visibility-based logic.
- **Content Pipeline (Unit Rationale Extraction):** HTML scraper intake → JSON Atomic Units with optional `unit_rationale`
  extraction (§9); new content authored directly in Structured Markdown with blockquote parsing for rationale (§9); graceful
  degradation to single `unit_content` if parsing fails. Rationale metadata is persisted separately and surfaced via optional
  "info" affordance with pull-based visibility — hidden by default, never blocking navigation or Finish.
- **Analytics:** `use_count` and course-completion metrics are now computed from one unambiguous trigger (Finish at the
  final Atomic Unit) — no dual interpretation across treatment vs. course contexts.
- **Terminal NEMAR — Mandatory Completion Validation (§7b):**
  - Terminal NEMAR is a mandatory Atomic Unit that appears as the final step before Finish (סיום) in all Unified Player instances.
  - Binary inquiry: "Is it NEMAR that this [Treatment/Course/Technique] ended successfully?" (Yes/No muscle test).
  - **Yes path:** Enables standard [Finish] button, triggering success metadata (`use_count` +1, course completion).
  - **No path:** Marks session as "In-Process, Not Yet Complete." Specific remedial logic TBD (awaiting therapeutic guidance).
  - **Sovereign bypass remains always available:** [Finish Anyway] button available regardless of Terminal NEMAR response,
    honoring EM authority to close session on their terms.
  - Terminal NEMAR follows all visibility-based state transitions (§2) and Navigation Tree rules (§7a). Revisiting Terminal NEMAR
    never revokes prior success metadata (§5, §7b).
- **Copy:**
  - "Move through each part at your own pace — jump ahead using the outline whenever you're ready."
  - "When you reach the end, Finish is yours to declare, whenever you're ready — skipped units and all."
  - "Going back is just re-reading. Nothing you've already finished changes."
  - "Navigate your own path: step by step, or jump ahead with the outline."
  - "Each step has an optional 'why' — tap to learn the clinical reasoning behind it, or skip and just do."

---

## DEC-016 — Course architecture: polymorphic lesson blocks, subjective navigation, content versioning

**Status:** Refined (2026-06-29, Yossef-Tal & Sigal) — resolves **GQ-013** with critical refinements; **amended (2026-07-02)** —
§3–4 rewritten to adopt the unified Unified Player model per **DEC-015** (resolves **GQ-018**).

**Context:** **DEC-003** defines courses as a parallel lane with NEMAR, Player, Integrating. **DEC-015** establishes Structured Markdown
(H3 = step) as the content standard for all protocols. **GQ-013** clarified how course lessons integrate with the Player, Personal Treatment Library, 
and EM autonomy. 
**Refinement (2026-06-29):** Adds clarity on "Done" semantics, contextual reciprocity (nested vs. independent), and
content versioning model (Diary vs. Toolbox).

**Amendment (2026-07-02, GQ-018):** §3 originally described a course-specific Done/Skip/Back button set as if it were distinct from
the standalone treatment Player's Next/Finish — this was Audit Contradiction 1.2 (two incompatible Player button sets). §4 originally
gated course completion on "all required blocks explicitly done," which both contradicted §3's "no technical gates" and could never
be reconciled with **DEC-006**'s equally contradictory "required steps" language — this was Audit Contradiction 1.4. **DEC-015**'s
unified Unified Player now resolves both: course lesson units and treatment steps are the same **Atomic Unit** concept, and course
completion follows the identical **Finish**-based state machine as any other Unified Player instance. §3 and §4 below are rewritten
accordingly; §1, §2, §5, and §6 are unchanged in substance.

**Decision:**

1. **Course Work Session: Polymorphic Context**
   - Each course **enrollment** creates a dedicated **Course Work Session** — distinct from Symptom Group Work Sessions.
   - **Context polymorphism:** A Course Work Session can exist:
     - **Independently** on the Chronological Timeline (linked only to timeline events, no parent Symptom Group).
     - **Nested** within a Symptom Group's Work Session (when EM tags course-as-treatment for a group).
   - **Retroactive Integrity:** All course activities (lessons, treatments, reflections) are **retroactively linkable** to any logical unit
     on the timeline (Symptom Groups, other courses, journal insights) — ensuring full **data reciprocity** without rigid hierarchies.
   - Follows the same **chronological integrity** as Symptom Groups: every lesson execution is logged as a **timeline event**.

2. **Polymorphic Lesson Blocks (Content Standard)**
   - **Lessons use Structured Markdown (H3 = step)** per **DEC-015**, enabling consistent parsing.
   - Each **lesson is a container** that can hold **one or more block types** (the same polymorphic block types are also
     available as Atomic Units in any Unified Player sequence per **DEC-015** §7):
     - **Original Content:** Unique text, videos, audio, or instructions authored for the course.
     - **Treatment Reference:** A dynamic **link to an existing protocol** from the **Treatments Table** (or Personal Treatment Library).
       When rendered, displays the protocol's steps using the same Player as standalone treatments.
     - **Insight/Inspiration (הגיג):** A standalone **"Hagig"** from the shared collection — displayed as read-only inspiration, not executable.
     - **Reflection Prompt:** A standard **Atomic Unit type** (per **DEC-015** §7) — a journal-input surface. Reaching it
       automatically offers the EM an affordance to reflect and commit text as a linked Reflective Journal entry. Not
       course-specific; available in any Unified Player sequence.

3. **Subjective Navigation & "Soft Completion" (rewritten 2026-07-02 — see DEC-015)**
   - **No pre-treatment NEMAR inside course:** When a **treatment is presented within a course**, there is **no mandatory NEMAR inquiry**.
     The system **trusts the EM's readiness**. (Unchanged.)
   - **No technical validation gates:** The system **never enforces** "required" blocks — this is now a hard architectural rule, not a
     course-specific one; see **DEC-015** §3.
   - **Course lesson blocks use the exact same unit-level actions as every other Unified Player instance** — **"Done" (בוצע)**,
     **"Skip" (דלג)**, **"Back" (חזור)** — defined once in **DEC-015** §2, not redefined here. There is **no separate course button set**;
     a Treatment Reference block opens a **nested Unified Player** governed by the identical model (**DEC-015** §1).
   - **Sovereignty Rule (unchanged):** The EM can mark a block or a whole lesson unit as "Done" at any time, based on internal readiness,
     **regardless of physical execution**. (E.g., EM reads a treatment and says "I know this—done" without stepping through every instruction.)

4. **Course Completion & Success (rewritten 2026-07-02 — see DEC-015)**
   - **Completion trigger:** A course is a Unified Player instance like any other. It is marked **"Successfully Completed"** when the EM
     triggers the terminal button action at the final Atomic Unit (**DEC-015** §2) — either pressing **[Finish]** (if all units
     completed) or choosing **[Finish Anyway]** (if units remain skipped/unseen), per the **Two-Option Switch** logic in **DEC-015** §4.
     "Required" is now a purely editorial hint (**DEC-015** §3); it can never block or gate course completion.
   - **Terminal button logic:** Per **DEC-015** §4, when skipped/unseen units remain, the EM sees **[Review Skipped]** and
     **[Finish Anyway]** instead of a single Finish — allowing an optional pass through deferred content without ever forcing it.
     **[Finish Anyway]** always succeeds — course completion never depends on how many units were skipped.
   - **Optional success NEMAR:** Upon Finish, optional **NEMAR inquiry: "Is it NEMAR that this course ended successfully?"**
     Result stored as metadata on session closure log. (Unchanged.)
   - **Deepening after completion:** Per **DEC-015** §6, the EM may return to a "Successfully Completed" course and mark previously
     skipped units "Done" without re-triggering completion metadata or a second success declaration.


5. **Content Versioning: Diary vs. Toolbox (Simple Model)**
   - **Problem solved:** Prevent versioning clutter while ensuring both historical integrity and current guidance.
   - **Timeline as a "Diary" (Static Record):**
     - When EM clicks **Finish** in the Player, the system **saves a textual snapshot** of the protocol **as it was performed** at that moment.
       This snapshot is stored as **timeline event metadata**.
     - **Historical integrity:** If EM looks back a year later, they see **exactly what they did then** — textual record of the steps they followed.
     - Supports both course lessons and ad-hoc treatments (same logic).
   - **Library as a "Live Toolbox" (Dynamic Reference):**
     - The **Personal Treatment Library card always points** to the **latest live version** of the protocol
       from the **master Treatments Table** (maintained by Sigal).
     - **No version alerts:** EM always accesses the most **updated guidance**. Updates are transparent and always-current.
     - **No version history clutter:** Library remains clean and lightweight.
   - **Manual Variants (for customization):**
     - If EM wishes to **deviate** from the live version, they manually create a **"Personal Variant"** (tagged as `variant_type: 'personal'`) in the library.
     - This **preserves Ownership:** EM can customize without system interference. Variants are **linked to provenance** (e.g., "Variant of Protocol X").
     - System remains simple; EM remains architect.

6. **Technique Extraction & Personal Treatment Library Sync**
   - **First-time execution trigger:** If EM **never executed** a course treatment, clicking **Finish** **automatically adds it** to
     Personal Treatment Library.
   - **Provenance tracking:** Library entry includes **source metadata** (e.g., "Source: Course X, Lesson Y") and creation timestamp.
   - **Use count reciprocity:** Completing a treatment **within a course** **increments `use_count`** in the Personal Treatment Library.
     One unified counter, all sources contribute (courses, ad-hoc sessions, Treatments Table).
   - **Content link vs. snapshot:**
     - Library card points to **live version** (allows EM to see updated guidance).
     - Timeline event embeds **static snapshot** (what was actually performed).

**Refines:**

- **DEC-003 (Courses):** Adds mechanics for lesson structure, polymorphic context, and Player integration.
- **DEC-015 (Unified Unified Player, amended 2026-07-02):** Course lesson units **are** Atomic Units — no separate Player model,
  no separate button set, no required-blocks gate. §3–4 above now defer entirely to **DEC-015**'s state machine.
- **DEC-005 & DEC-006 (Personal Treatment Library):** First-time course execution auto-populates library with provenance; use_count reciprocity.
- **DEC-004 (Chronological Timeline):** Snapshot storage on timeline ensures diary integrity; library points to live version.

**Rationale:**
- **Polymorphic lesson blocks** enable course creators to mix original content with dynamic links to shared protocols, rapid assembly without duplication.
- **No pre-treatment NEMAR** respects EM's body wisdom and autonomy.
- **"Done" semantics clarify EM sovereignty:** Declaration based on readiness, not execution. Removes friction between system and EM intent.
- **Unifying with the standalone Unified Player (2026-07-02):** Removes the two-button-set contradiction and the required-blocks
  gate at their root — a course is not a special case, it is the same Player used everywhere.
- **Diary vs. Toolbox model is elegant:** Preserves history, enables updates, avoids clutter. Ownership remains with EM (manual variants).
- **Retroactive linking** ensures full data reciprocity: courses can connect to any logical unit, any time.

**Consequences:**

- **Schema:**
  - `course_sessions` table: `course_id`, `course_status` (enum: 'in_progress', 'completed', 'integrating'), 
  `contextual_binding` (nullable `symptom_group_id` or null for standalone), `retroactive_links` (JSONB: array of linked entities).
  - `course_lessons` table: `course_id`, `lesson_number`, `lesson_blocks` (JSONB: polymorphic array with `block_type`, `content`,
    `is_recommended` display hint — **not** an enforced gate, per **DEC-015** §3).
  - `lesson_progress` is superseded by **DEC-015**'s unified `unit_state` (enum: `unseen` / `completed` / `skipped`) — one state
    model for course blocks and treatment steps alike, not a course-specific table.
  - `personal_library_entries`: add `variant_type` (enum: 'original', 'personal', 'course_extracted'), `source_metadata` (JSONB).
  - `timeline_events`: add `snapshot` (JSONB, only for Finish events: stores static copy of protocol/course steps as performed).

- **Player UX (course):** No course-specific button set. A course is a Unified Player instance; it uses the **same**
  Done/Skip/Back unit-level actions and the **same** Finish container-level action defined once in **DEC-015** §2.
  Treatment Reference blocks open a **nested** Unified Player instance (**DEC-015** §1), not a different component.

- **Library sync:** On treatment Finish within a course → check library → create new entry with `variant_type: 'course_extracted'`
  or append source, increment `use_count` (per the amended, gate-free trigger in **DEC-006** §1).

- **Timeline storage:** On Finish, embed snapshot of protocol/course steps (textual array) as
  `timeline_event.metadata.protocol_snapshot`.

- **Copy:**
  - "Take lessons at your own pace. Mark 'Done' when you're ready—this step, or the whole lesson. No pressure to do every step step-by-step."
  - "When you reach the end, Finish is yours to declare — skipped units and all."
  - "Every technique you complete builds your personal toolbox. Revisit it anytime—always up-to-date with Sigal's latest guidance."
  - "You're the architect of your healing. Skip lessons now, return later. Nothing is forced."

---

*Next: I'll update CLAUDE.md, CONTEXT.md, and README.md to reflect DEC-014.*

**Resolved:** GQ-011 → **DEC-014** (2026-06-22).

**Resolved (total):** **GQ-001** → **DEC-004**; **GQ-002** → **DEC-005**; **GQ-003** → **DEC-006**; **GQ-004** → **DEC-007**;
**GQ-005** → **DEC-008**; **GQ-006** → **DEC-009**; **GQ-007** → **DEC-010**; **GQ-008** → **DEC-011**; **GQ-009** → **DEC-012**;
**GQ-010** → **DEC-013**; **GQ-011** → **DEC-014**; **GQ-012** → **DEC-015**; **GQ-013** → **DEC-016** (2026-06-29).

---

## GQ-018 — Completion Semantics Canonicalization (2026-07-02)

**Status:** Resolved (2026-07-02, Yossef-Tal & Sigal) — amends **DEC-006**, **DEC-007**, **DEC-015**, **DEC-016**

**Context:** The Architecture Stress-Test (2026-06-29/30) identified four contradictions in the completion/use_count logic
spread across four decisions: **1.1** "required steps" (DEC-006) vs. "no gates" (DEC-015); **1.2** two incompatible Player
button sets (standalone Next/Finish vs. course Done/Skip/Back); **1.3** auto-decrement on back-navigation (DEC-007)
silently overriding EM declarations; **1.4** "required blocks" gating course completion (DEC-016) while simultaneously
claiming no technical gates exist.

**Resolution:** A single unified **Unified Player** state machine, fully specified in the amended **DEC-015**:

- **One Player, one model** for treatments, techniques, and course lessons — "Atomic Unit" replaces "step" and "block."
- **Unit-level actions** (Done / Skip / Back) are reversible, low-stakes, and identical everywhere. **Container-level terminal button
  logic** (refined 2026-07-06) branches conditionally at the final unit:
  - **If all units `completed`:** standard **[Finish]** → success declaration.
  - **If any unit `skipped` or `unseen`:** two explicit options — **[Review Skipped]** (navigate to first deferred unit, optional
    affordance) and **[Finish Anyway]** (success regardless) — both equally sovereign, neither gated or judged.
- **"Required" is abolished as a technical gate** — retained only as a non-enforced editorial display hint.
- **Terminal-button branching:** The EM sees mutually-exclusive active choices that reflect their unit states without judgment. 
  Both paths are sovereign.
- **Auto-decrement is removed entirely.** Back-navigation is "Revisiting," never "Revoking." The sole correction path for
  `use_count` is the sovereign manual edit already defined in DEC-007 §2.
- **Unit state persists after Finish**, allowing the EM to "deepen" into skipped units later without re-triggering success
  metadata.

**Amended decisions:** **DEC-006** §1 (removed required-steps precondition); **DEC-007** §1 (auto-decrement replaced with
"Revisiting is not revoking"); **DEC-015** (substantially rewritten — now the canonical Unified Player state machine);
**DEC-016** §3–4 (rewritten to defer to DEC-015 instead of describing a separate course Player model).

**Deferred to OpenSpec:** Specific label copy, button styling, and the "deepen later" re-entry UI. This decision defines the
Responsibility Switch logic (the branching between a single [Finish] and the dual [Review Skipped] + [Finish Anyway] choices), 
while the final interaction choreography and layout remain UI/UX concerns per the grill's structural directive.

**Resolved (total, updated):** **GQ-001** → **DEC-004**; **GQ-002** → **DEC-005**; **GQ-003** → **DEC-006**;
**GQ-004** → **DEC-007**; **GQ-005** → **DEC-008**; **GQ-006** → **DEC-009**; **GQ-007** → **DEC-010**;
**GQ-008** → **DEC-011**; **GQ-009** → **DEC-012**; **GQ-010** → **DEC-013**; **GQ-011** → **DEC-014**;
**GQ-012** → **DEC-015**; **GQ-013** → **DEC-016**; **GQ-018** → amends **DEC-006, DEC-007, DEC-015, DEC-016** (2026-07-02).
