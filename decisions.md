# PiC Architectural Decisions

Living record of agreements reached during co-architecture sessions (Grill-with-Docs).
Captured before feature specs or schema design.

---

## DEC-001 — Atomic Focus is a UX principle, not a separate container type

**Status:** Agreed (2026-06-02, updated per Yossef-Tal)

**Context:** Early drafts tied “Atomic Focus” only to one-question screens and the Player. Co-architect review also challenged “Symptom Buckets” as a separate persistence unit.

**Decision:** **Atomic Focus** applies to:

1. **Inquiry / decision-making** — one muscle-test question at a time (NEMAR flow).
2. **Treatment execution** — the Player breaks protocols into small sequential steps.
3. **Choosing what to work on** — during a given **Inquiry Session**, work stays on **one** Symptom Group (הקשר) at a time so inquiry and muscle tests stay clear. The Event Manager may **switch to another Symptom Group at any time** and **start a new Inquiry Session whenever they want** (on the same group or a different one). “Active” means *this visit*, not a lock on the account.

It is **not** a separate database entity or synonym for מכלי סימפטומים.

**Rationale:** Matches public teaching (simple steps) and clarified domain model (DEC-002).

**Consequences:**

- ~~Update manifesto Principle 5 in `README.md`~~ Done (2026-06-02).
- ~~Align `CLAUDE.md`~~ Done (2026-06-02).

---

## DEC-002 — Symptom Group, הקשר, מכלי סימפטומים, and Work Session are one unit

**Status:** Agreed (2026-06-02, Yossef-Tal & Sigal)

**Context:** English *context*, *symptom group*, and *work session* sounded like nested layers. Hebrew in `README.md` §4 lists parallel **קבוצות תסמינים** and **קורסים**, with **לכל הקשר** a continuous **סשן עבודה**.

**Decision:**

| Concept | Hebrew terms (same unit) | English canonical term |
|--------|---------------------------|-------------------------|
| Persistent healing thread | **קבוצת סימפטומים** = **מכלי הסימפטומים** = **הקשר** = **סשן עבודה** | **Symptom Group** (primary); **Work Session** acceptable when stressing continuity |
| One visit on that group | **סשן** (inquiry / rating / journal flow) | **Inquiry Session** |
| Items inside the group | **סימפטומים** (e.g. lower back + neck together) | **Symptom** |

**Formation workflow:**

1. The Event Manager **lists all symptoms** they want to address.
2. **Joint treatment muscle test:** can these symptoms be treated together?
   - Often **yes** → one Symptom Group.
   - If **no** → split into **separate Symptom Groups** (each becomes its own הקשר / סשן עבודה).
3. For a chosen group: full **log and documentation** over time; documentation may attach to **any object** in that Work Session (symptoms, treatments, inquiries, etc.) — the group’s logbook.
4. **Inquiry Sessions** can be started **whenever** on that group (Atomic Focus: one group per visit, not locked across visits).

**Inquiry Session flow (agreed nuance):** Steps (Empty Vessel, safety, NEMAR, treatment player, journal) are **available in any order**; the user may **start at any step**. **Recommended** order: Empty Vessel → safety → NEMAR → treatment player → journal. Matches flexible journey gate in README §3 (skip brain dump when not needed).

**Empty Vessel (agreed nuance):** Free writing (הכלי הריק / פינוי מנטלי) — **not only** listing all symptoms. It **can** be used to surface symptoms when building or updating groups, but also as **spontaneous** pre-session text (e.g. “how am I feeling today?”, something you now understand about this Symptom Group). Distinct from the Reflective Journal at the end, though content may later be linked or copied there if the user chooses.

**Example (Maya):** “Lower back” and “neck” are two **symptoms** in **one** Symptom Group / הקשר / Work Session (treated together). “Allergies” would be a **second** Symptom Group if the muscle test says they cannot be treated with the back/neck set.

**Rationale:** One persistent boundary per group; no extra “Healing Track” layer. מכלי and קבוצה are naming variants, not parent/child types.

**Consequences:**

- Schema/UI: `symptom_groups` (or equivalent) is the persistence root for logs, ratings, and Integrating state — not a separate `contexts` table unless we alias it.
- Glossary: drop **Symptom Vessel** and **Healing Track** as separate terms.
- ~~README §4 / glossary aligned to Symptom Group (הקשר)~~ Done (2026-06-02).
- **Open (next grill):** How **active courses** relate to a Symptom Group — parallel track per DEC-002 source text, not yet resolved.
