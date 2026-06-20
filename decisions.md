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

*Add **GQ-00n** below when the next question is posed.*

**Resolved:** **GQ-001** → **DEC-004**; **GQ-002** → **DEC-005**; **GQ-003** → **DEC-006** (2026-06-08).
