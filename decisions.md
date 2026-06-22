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

**Status:** Agreed (2026-06-08, Yossef-Tal & Sigal) — resolves **GQ-003**; **amended** same day (optional success muscle-test wording).

**Context:** **GQ-003** chose **option D (hybrid)** with **Ownership**, **NEMAR** alignment, **Integrating** language, and a **low-pressure**
toolbox metaphor.

**Decision:**

1. **Player path — automatic +1 on Finish (סיום):** When the Event Manager runs the **Player** for a technique/treatment mapped to a
   **Personal Treatment Library** row, **`use_count` increments once** when they complete **all required** Player steps and press
   **Finish** (סיום). Protocols may offer an **optional** closing **muscle-test** — **yes/no**: *Did this treatment or technique end
   successfully?* — in the same **NEMAR** inquiry family as other binary questions; it is **not** mandatory for **Finish** or for **+1**
   unless a specific protocol marks it required. **Finish** is the explicit **commit** that triggers auto +1 after required steps, not merely
   opening the Player or partial progress.
2. **Integrating / mid-exit — no silent auto +1:** If the Event Manager **leaves** the Player while the work is still **Integrating** (not
   framed as failure), **do not** auto-increment. They may later **manually** add a use when they honestly consider the practice “done
   enough” to count, or return and **Finish** when the flow allows—**never** double-count the same finished run (see §5).
3. **Manual increment — Ownership:** At **any time**, from the **Personal Treatment Library**, the Event Manager may **manually increase**
   **`use_count`** for any row—e.g. work **outside** the app, off-Player practice, or an intentional “log this session” choice. Manual
   entry honours **self-reported** experience without forcing Player completion.
4. **Low friction — analysis only:** The counter is a **secondary**, **non-intrusive** aid for light personal reflection; copy and UI
   must **not** create scoreboard pressure, clutter primary flows, or imply clinical benchmarking.
5. **No double-counting:** A **single** timeline session / Player run should produce **at most one automatic +1** from **Finish**; a second
   bump in the same sitting requires an **explicit extra manual** increment (two genuinely distinct uses the Event Manager chooses to
   record). OpenSpec lists edge cases (replay same recording, undo, etc.).

**Bilingual nuance (agreed, Hebrew team notes):**

- **Finish (סיום) & optional success muscle-test:** **`use_count`** auto +1 follows **Finish** after **required** Player steps. An **optional**
  closing **muscle-test** (**yes/no**: *Did this treatment or technique end successfully?*) may appear—in the **NEMAR** inquiry family; **not**
  required for **Finish** or +1 unless a protocol explicitly requires it.
- **סיום (עברית):** העלאת המונה קשורה ל-**סיום** אחרי כל שלבי הנגן הנדרשים. בסוף הפרוטוקול אפשר **מבחן שרירים כן/לא אופציונלי**: *האם הטיפול /
  הטכניקה הסתיימו בהצלחה?* — לא חובה אלא אם הפרוטוקול מחייב במפורש.
- **בהטמעה (Integrating):** Because unfinished treatment stays **Integrating**, the counter **must not** auto-rise on mid-exit; only
  **Finish** or a **conscious manual** choice advances it—preserving **non-failure** framing.
- **פשטות:** One clear action (**Finish** or manual +1) → one clear outcome—keeps the app feeling like a **simple program**.
- **ארגז כלים:** The library stays a **toolbox** of accumulated experience, not a stressful measuring instrument.

**Rationale:** Hybrid **D** with explicit **Finish** gate respects methodology rigour while **manual** use upholds autonomy and real-world
practice off-device.

**Consequences:**

- Player UX: prominent **Finish** (סיום); optional closing **yes/no success** muscle-test per protocol; wire auto +1 on **Finish** once
  **required** Player steps are complete (OpenSpec: ordering when both exist).
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

## DEC-007 — Personal Treatment Library `use_count`: auto-decrement on Player back-nav, manual edit, multitype timeline

**Status:** Agreed (2026-06-08, Yossef-Tal & Sigal) — resolves **GQ-004**

**Context:** **GQ-004** asked how to handle mistaken increments. Answer combines Player state sync, Event Manager ownership, and transparent logging.

**Decision:**

1. **Auto-decrement on Player back-navigation:** If the Event Manager navigates **back** from a **Finish** state to a prior step 
(or abandons the Player after **Finish** was pressed), the system **automatically decrements** `use_count` by **1**. 
This ties the counter to **Player state**, not just the forward path—intuitive and reversible.
2. **Manual counter edit — Ownership:** The Event Manager retains the right to **manually edit** `use_count` **anytime** to reflect their 
**physical reality** (off-app practice, re-evaluation, corrections). The counter is their **sovereign data**.
3. **Multitype Timeline Architecture** (GQ-004 follow-up):
   - **Event categorization:** Every action (Technique Execution, Manual Correction, Insight, Rating Refresh, Use Count Adjustment, etc.) 
   is logged with a **specific `log_type`**.
   - **Smart filtering:** The **Chronological Timeline** displays a **filter UI** allowing users to choose which `log_type` entries to view. 
   **By default**, technical/system corrections (e.g. "use_count adjusted −1") are **hidden** to maintain a clean, **Atomic Focus** workspace.
   - **Data integrity without clutter:** All changes are **permanently recorded**; visibility is user-controlled.

**Bilingual nuance:**

- **ריבונות** (Sovereignty): Event Manager's absolute ownership over their healing data; manual edits **always** allowed.
- **סנכרון** (Sync): Player state ↔ `use_count`; back-nav = auto-decrement.
- **מרחב עבודה נקי** (Clean workspace): Multitype timeline + filtering keeps **Atomic Focus** alive even with full audit trail.

**Rationale:** Combines **trust in the Event Manager** (ownership), 
**intuitive reversibility** (Player state sync), and 
**transparent integrity** (logged but filterable timeline) without creating visual clutter or losing auditability.

**Consequences:**

- Schema: `use_count` field on library row; timeline table includes `log_type` and optional `metadata` 
(e.g. `{source: 'manual_edit', previous_value: 3, new_value: 5}`).
- Player UX: Back-navigation automatically adjusts `use_count`; no separate undo affordance needed for Player completions.
- Library UX: **Manual edit** control (wording TBD: "Adjust count" or "Record use") with simple number input; optionally confirm if already >0.
- Timeline UX: Filter chip UI (Show: All / Events only / Corrections hidden); default = **Corrections hidden**; persisted user preference.
- Copy: "Your timeline, your view—you decide what to see."

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

## Grill — open questions (living)

### GQ-011 — NEMAR inquiry flow: Left (root cause) vs. Right (treatment) path mechanics and atomicity

**Status:** Open (posed 2026-06-22)

**Context:** README and CLAUDE.md mention "NEMAR path: Left (root cause in Causes Table) / Right (treatment in Treatments Table)
→ execution instructions" (**DEC-003**). But the mechanics are fuzzy: how does the EM choose Left vs. Right? Can one Inquiry Session
contain both, or is each path **atomic** (one per session, honoring **Atomic Focus**)?

**Questions:**

1. **Path selection timing:** When an Event Manager starts an Inquiry Session on a Symptom Group, how do they **choose** Left vs. Right?
   - **A.** At session entry: "Are you diagnosing root cause or selecting treatment?" [Left/Right picker].
   - **B.** System-guided: based on symptom history or EM profile, suggest one path.
   - **C.** Organic: EM naturally flows to Left or Right based on intent during Empty Vessel or initial NEMAR question.
   - **D.** Other?

2. **Left path (root cause diagnosis) workflow:**
   - The EM asks NEMAR questions from a **Causes Table** (EM defined? system-provided?).
   - They work through potential root causes until they isolate one or more.
   - Then what?
     - End session (diagnosis only)?
     - Offer "Switch to Right path to treat?" (new session or same session)?
     - Auto-suggest treatment based on diagnosed cause?

3. **Right path (treatment selection) workflow:**
   - The EM asks NEMAR questions from a **Treatments Table** (EM defined? system-provided?).
   - They select a treatment protocol.
   - Launch the Player to execute.
   - After Player Finish, can they ask more treatment questions, or is the Inquiry Session done?

4. **Path atomicity & Atomic Focus:**
   - **Option A (Atomic per path):** One Inquiry Session = one path only (Left-only or Right-only). Switching paths = new session.
   - **Option B (Sequential within session):** One Inquiry Session can flow Left → Right → Player (one continuous thread).
   - **Option C (Flexible):** EM chooses anytime—can do Left-only, Right-only, or Left → Right in one session.

**Co-architect recommendation:** Lean toward **Option A (atomic per path)** to honor **Atomic Focus** rigorously. But awaiting your design intent.

---

*No other open items. Next: GQ-012 (Player mechanics), GQ-013 (Courses & Academy), etc. See `docs/grill-backlog.md` for full subsystem list.*

**Resolved:** **GQ-001** → **DEC-004**; **GQ-002** → **DEC-005**; **GQ-003** → **DEC-006**; **GQ-004** → **DEC-007**;
**GQ-005** → **DEC-008**; **GQ-006** → **DEC-009**; **GQ-007** → **DEC-010**; **GQ-008** → **DEC-011**; **GQ-009** → **DEC-012**;
**GQ-010** → **DEC-013** (2026-06-22).
