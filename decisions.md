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
   Symptom Group / הקשר, **or** one **course-as-treatment** workflow (**DEC-003**), so inquiry and muscle tests stay clear.
   The Event Manager may **switch target** and **start a new Inquiry Session whenever they want**. “Active” means *this visit*, not a
   lock on the account.

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
   Session; or the EM may take **one technique** learned from a course and run an **Inquiry Session** with that technique **whenever and
   wherever** they choose (including on another Symptom Group). No forced auto-link unless the EM opts in.
4. **Course as treatment:** When the EM chooses **a course as treatment**, an **Inquiry Session** for that visit **follows that
   course’s workflow** (course-led Atomic Focus for that sitting).
5. **Commerce:** Courses may be **free or paid**. Paid access is by **per-course grant**; the EM may **re-run** a granted course.
   **Course progress is included** in what the grant (or free offer) covers — not an extra “healing persistence” upsell on top of the
   course price.
6. **Freemium bucket (Q3 — teaching vs saved work):** **Core Gateway teaching** and **open diagnostic material** stay **freely accessible**
   per manifesto. **Course progress, completion, and run state** (where you are in the course, Integrating, course-scoped notes) are **the
   Event Manager’s personal healing record** for that **course Work Session** — not a throwaway “anonymous learner” silo. Classify that
   data as **persistent healing**: same **subscription-gated persistence** and **data-sovereignty** expectations as Symptom Group history
   (do not park real course saves in a cheap “learning-only” bucket that would dodge export/delete rules).

**Refines DEC-001 §3 (Atomic Focus):** During one **Inquiry Session**, **one Atomic Focus target** per visit: either **one Symptom Group**
(symptom-led) **or** **one course-as-treatment workflow** (course-led). Switching targets means **ending / starting** a session, same as
switching Symptom Groups today.

**Refines DEC-002 consequences:** Persistence is **not only** `symptom_groups`: add a **first-class course enrollment / progress** root
(name TBD in schema) alongside symptom groups. Cross-links when the EM attaches a course to a group remain **explicit**, not implied.

**Rationale:** Matches parallel Hebrew framing (קבוצות + קורסים), keeps EM sovereignty over stand-alone vs linked work, and aligns paid
grants with “you own your course run history.”

**Consequences:**

- OpenSpec / schema: model **course enrollment**, replay, grants, and Integrating state without folding courses into
  `symptom_groups`.
- UX copy: distinguish **Symptom Group Work Session** vs **course Work Session** where ambiguity would confuse the EM.
- ~~README / manifesto~~: follow-up optional pass to spell out “course-led Inquiry Session” and freemium bucket (persistent healing) in
  plain language.

---

## Grill — open questions (living)

### GQ-001 — Technique-only Inquiry Session: what is the persistence anchor?

**Status:** Open (posed 2026-06-08)

**Context:** **DEC-003** allows the Event Manager to take **one technique** learned from a course and run an **Inquiry Session** whenever
and wherever — including on another Symptom Group. We have not yet pinned **where** logs, blind ratings, Player / Integrating state, and
journal Smart-Links **must** attach when the visit is **not** the full **course-as-treatment** workflow.

**Question:** For a **technique-only** visit (one technique from a course, not the whole course run), what is the **required persistence
anchor**?

- **A.** Always **one Symptom Group** — pick or create a group so ratings and the group logbook stay coherent with **Atomic Focus** and
  blind refresh rules for that group.
- **B.** Anchor on **course enrollment / grant** only — technique practice lives under the **course Work Session**, even when the concern
  “feels” like a body symptom tied elsewhere.
- **C.** **Dual link** — one **primary** anchor (A or B) plus **optional** Smart-Link to the other.
- **D.** **No mandatory anchor** — minimal “scratch” save until the EM links; accept weaker queries / policy edge cases until then.

**Co-architect recommendation (non-binding):** **A** as default, **C** optional: default to a **chosen Symptom Group** so blind re-rating and
the group log stay one story; **explicit** Smart-Link to the originating **course** / lesson for Academy continuity. Use **D** only as a
narrow, loudly labeled scratch mode if you insist on it.

**Awaiting:** Yossef-Tal & Sigal
