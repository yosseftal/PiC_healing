# PiC (Personal Information Center)

A self-healing knowledge platform: the user connects to their inner information Center via muscle testing, diagnoses, and applies
treatments. The app organizes and retrieves — it does not predict clinical outcomes.

## Language

**The Center**:
The user's Personal Information Center — the body as the source of answers accessed through muscle testing.
_Avoid_: Database (as if external), AI prediction, calculating outcomes

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
A treatment or session is still in progress — repetition, pending commitments, or permeation time needed.
_Avoid_: Failed, error, incomplete, stuck

**Smart-Linking**:
Journal entries, timeline events, and treatment or technique **executions** can relate to **multiple Symptom Groups, courses, or
other entities simultaneously** without a rigid parent-child tree. **Timing** (during session or retroactively), **scope** (one
event → many links), and **unlinking** (full EM authority) are all user-controlled (**DEC-008**). Linking and unlinking actions
are **logged as timeline events** (hidden by default) to maintain **Atomic Focus** without losing audit trails.
_Avoid_: Folder hierarchy, single-parent tagging only, silent auto-attachment to a Symptom Group or course, treating multiple
links as conflicts

**Reflective Journal**:
Networked chronological archive of thoughts and insights; may Smart-Link to symptoms, treatments, courses, timeline events, and
executions. The ordered journey matches the **Chronological Timeline** spine (**DEC-004**).
_Avoid_: Rigid single-parent filing for every entry

**Chronological Timeline**:
The **required** persistence spine for healing actions and insights: a **time-ordered** record aligned with the **Reflective Journal**.
Technique and treatment **executions** may exist as **standalone** timeline events until the Event Manager chooses further links. Every action is
logged with a **`log_type`** (Technique Execution, Manual Correction, Rating Refresh, Link Created, Link Removed, etc.);
**smart filtering** lets users hide technical corrections (including linking/unlinking actions) by default to maintain **Atomic Focus** (**DEC-007**, **DEC-008**).
_Avoid_: Pretending every save must belong to a Symptom Group or course row first; visual clutter from system corrections; forcing
transparency without user control

**Personal Treatment Library** (Personal Treatment Table):
The Event Manager’s **toolbox** — techniques and treatments they have **actually run** at least once. **First execution** from any source
(course, shared Treatments Table, library copy, self-invented entry, etc.) **creates or extends** the matching **logical** row, with
**provenance** of sources and a **monotonic use count only** (**DEC-005**). 
**Auto +1** when a **Player** run reaches **Finish** (סיום) after **all required** steps. 
Protocols may offer an **optional** closing **muscle-test** 
(**yes/no**: *Did this treatment or technique end successfully?*) — same **NEMAR** family; 
**not** required for **Finish** or +1 unless the protocol says so (**DEC-006**). 
**Manual +1** anytime from the library for off-app or intentional logs; 
the counter stays **secondary** and low-pressure (**DEC-006**). 
It is **separate** from any single Symptom Group’s Work Session; **Smart-Linking**
connects into a group or course when the Event Manager decides.
_Avoid_: Collapsing the library into one Symptom Group, or treating it as the same thing as the global Treatments Table; duration or
stopwatch-style totals **on the library row** (v1 is **use count only**); scoreboard pressure or clutter around the counter (**DEC-006**).

**NEMAR** (נמ"ר):
Right, Accurate, Desirable — the muscle-test framing for whether to proceed with a line of inquiry or choice.
_Avoid_: NAMER (typo), yes/no without the three-part meaning where the method requires it

**Post-treatment success muscle-test** (optional):
An **optional** binary muscle-test (**yes/no**) at the end of a **treatment** or **technique** — *Did this end successfully?* Same family as
other **NEMAR** inquiries; **not** required unless the protocol explicitly mandates it. It does **not** replace **Finish** (סיום) as the commit
that closes the **Player** for **use_count** rules (**DEC-006**).
_Avoid_: Treating it as a different product “mode” from other muscle-test questions; forcing it when the protocol marks it optional

**Empty Vessel** (הכלי הריק / פינוי מנטלי):
Free, unstructured writing to clear mental space before or during work — not only a symptom list.
May include listing symptoms you care about (often when forming or updating groups), but also spontaneous session notes (e.g.
how you feel today, a new insight about this Symptom Group). Optional; recommended as a gate, not mandatory every visit.
_Avoid_: Treating it only as “symptom inventory”, required form fields, clinical intake questionnaire

**Symptom Group** (קבוצת סימפטומים / מכלי הסימפטומים / הקשר):
Symptoms that belong together for treatment — decided by listing all symptoms, then a joint treatment muscle test;
split into multiple groups only when the test says they cannot be treated together.
Carries the full persistent log (סשן עבודה): history, documentation on any object in the group, ratings, Integrating treatments.
_Avoid_: Symptom Vessel, Symptom Bucket (as a different type), Context (tech sense), separate “track” above the group

**Work Session** (סשן עבודה):
The continuous saved thread for one Symptom Group — same unit as הקשר, not a parent container.
_Avoid_: Inquiry Session, confusing with a single evening’s visit

**Inquiry Session** (סשן):
One sitting of work with **one chosen focus**: **symptom-led** work on a **Symptom Group**, or **course-led** work when
the Event Manager chose **a course as treatment** (that visit follows the course workflow).
**Timeline-first** visits are also allowed: e.g. executing a technique or treatment with **no** required Symptom Group or course row —
persistence starts on the **Chronological Timeline**; the Event Manager may **Smart-Link** later (**DEC-004**).
The user may **enter at any step** and **run steps in any order** where the method applies
(Empty Vessel, safety check, NEMAR inquiry, treatment player, journal).
**Recommended** order: Empty Vessel → safety → NEMAR → treatment player → journal.
A new session can start whenever the user chooses (any entry point).
_Avoid_: Work Session, appointment, mandatory linear wizard with no skip or reorder

**Course (Academy)**:
Structured **parallel lane** to Symptom Groups: its own progress, replays, and **continuous course Work Session** (NEMAR, Player,
Integrating, documentation for that course).
May run **standalone**, attach to a **Symptom Group**’s Work Session, or supply
**single techniques** the Event Manager applies in an Inquiry Session **whenever** they choose.
Access may be **free or paid** (**per-course grant**); progress is part of what that grant (or free offer) includes.
_Avoid_: Treating a course as the same entity as a Symptom Group; no auto-binding of a course to a group without EM choice

**Atomic Discovery** (DEC-014):
The system asks NEMAR questions hierarchically to help the EM narrow from categories (Physical, Emotional, Energetic, Conscious) to 
specific items. First: **category NEMAR** ("Is it **Physical**?"). Then: **item-by-item** within category. 
EM can override with preferences (**"Always show full table"**) or use **pairwise testing** 
(system groups categories two-by-two: "Is it **Physical OR Emotional**?" then splits if Yes).
_Avoid_: Forcing item-by-item through all items when global Yes or No; ignoring EM preferences

**Intuitive Choice Rule** (DEC-014):
When global NEMAR to a category/table returns clear Yes or No (not specific to one item), system displays 
**entire table** for **intuitive EM selection** instead of continuing atomic discovery. Honors body's wisdom 
("all could help" or "none fit").
_Avoid_: Forcing NEMAR after global answer; hiding table when body says yes to category

**Player** (הנגן):
The treatment execution engine. Presents a protocol's atomic steps one at a time (one screen per step). 
The EM advances by clicking **"Next"** based on internal readiness—there are **no technical validation gates**. 
The EM decides when each step is complete (executed, understood, or intuitively skipped). Clicking **"Finish"** (סיום) 
at any point auto-increments `use_count` (**DEC-006**, **DEC-015**). Exiting before the protocol's end preserves 
the session as **Integrating** (not failed). EM can resume later (**DEC-015**).
_Avoid_: Forcing step completion checks; blocking progression with validation; framing incomplete sessions as failures

**Structured Markdown** (DEC-015):
The canonical format for authoring all treatment protocols, techniques, and courses. Every **H3 header (###)** in the document
automatically defines one atomic **Player step**. A Content Parser converts existing HTML docs and future Markdown 
into JSON entries in the database, enabling fast retrieval and consistent step sequencing (**DEC-015**).
_Avoid_: Ad-hoc step definitions; mixing formats; dense paragraph-based protocols without clear step boundaries

**Symptom** (סימפטום):
One named concern inside a Symptom Group (e.g. lower back and neck as two symptoms in one group).
_Avoid_: Treating “symptom” as synonymous with the group itself

**Blind (re-)rating**:
Applies **only to a symptom** (e.g. intensity 0–10): part of **symptom–group healing paths** the product offers, with the prior score
and polarity hidden by default unless the Event Manager overrides (**DEC-011**). The Event Manager may also start **ad-hoc** re-rating
when they choose. Each symptom has a **polarity** (Positive or Negative, reflecting the valence of the current state), and the Event
Manager may **flip polarity** during updates (e.g., "Back Pain" [Negative] → "Back Strength" [Positive]) (**DEC-009**).
_Avoid_: Blind rating on visits with no symptom in scope; implying every healing path requires a blind rating; forcing the EM to rate
the same symptom with conflicting polarities simultaneously

**Polarity** (rating direction):
The **valence** or **direction** of a symptom's current rating: either **Positive** (strength, ease, improvement) or **Negative** (pain,
difficulty, challenge). The Event Manager may change polarity during any rating update, reflecting the healing journey where a state
evolves from negative to positive. Polarity is **independent** of **Intensity** (**DEC-010**).
_Avoid_: Treating polarity as immutable; assuming a symptom name must match its polarity (EM can reframe); confusing polarity with intensity

**Intensity** (rating magnitude):
The **quantitative magnitude** of a symptom's current state (e.g., 0–10 scale, where magnitude persists independently of polarity).
A symptom might transition from "Back Pain" 8/10 Negative to "Back Strength" 2/10 Positive; the magnitude tracks consistently, enabling
analytics to measure pure change regardless of how the EM frames the symptom. Intensity is **independent** of **Polarity** (**DEC-010**).
_Avoid_: Assuming intensity must increase or decrease with polarity flip; treating intensity as directional (up = good, down = bad)

**Polymorphic Lesson Block** (DEC-016):
One atomic unit within a course lesson, authored in **Structured Markdown** (H3 header = block). Four block types:
1. **Original Content:** Foundational teaching (video, text, theory).
2. **Treatment Reference:** Dynamic link to a shared protocol in the global Treatments Table (not a copy).
3. **Insight/הגיג:** Read-only reflection or breakthrough (curated wisdom).
4. **Reflection Prompt:** Open-ended question for EM journaling and integration.
All are navigable with **"Next"**, **"Skip"**, **"Done"** buttons; **no mandatory pre-treatment NEMAR** (**DEC-016**).
_Avoid_: Fixed lesson templates; forced linear progression; treating lesson blocks as different from treatment protocols in structure

**Course Work Session** (DEC-016):
A dedicated, persistent Work Session for a course enrollment. Can exist **independently** on the Chronological Timeline (no parent Symptom Group)
or be **nested** within a Symptom Group's Work Session (when EM tags course-as-treatment for a group).
Carries full chronological integrity, NEMAR machinery, Player execution, Integrating states, and retroactive linking to any logical unit
(other groups, courses, journal entries) for full data reciprocity (**DEC-016**).
_Avoid_: Forcing courses into a rigid hierarchical parent-child relationship with Symptom Groups; preventing independent course Work Sessions

**"Done" (בוצע) Action** (DEC-016):
EM's **declaration** that a block or lesson is complete, based on **internal readiness alone**—not technical execution. Clicking "Done" marks
the unit as "Completed" in the session record and advances to the next unit. EM can mark blocks "Done" at any time, even without physical
step-by-step execution (e.g., reading and saying "I know this—done") (**DEC-016**).
_Avoid_: Treating "Done" as requiring physical completion; blocking "Done" with validation gates; conflating "Done" with "Skip"

**"Skip" (דלג) Action** (DEC-016):
EM's **acknowledgment** of a block while **deferring it** for later. Clicking "Skip" marks the block as "Incomplete" and moves to the next unit.
Skipped blocks remain available for future sessions and are tracked in course progress UI (**DEC-016**).
_Avoid_: Treating "Skip" as "Done"; not tracking skipped blocks; preventing return to skipped blocks

**Diary vs. Toolbox Model** (DEC-016):
**Dual versioning approach** for treating content stability and updates:
- **Timeline as a "Diary" (Static Record):** When EM clicks **Finish** in Player, system saves a **textual snapshot** of the protocol as performed
  at that moment (stored as timeline event metadata). Ensures historical integrity: EM can review exactly what they did months or years ago.
- **Library as a "Live Toolbox" (Dynamic Reference):** Personal Treatment Library card **always points** to the **latest live version** of protocol
  from master Treatments Table (maintained by Sigal). No version alerts; EM always accesses current guidance.
- **Manual Variants (Ownership):** If EM wishes to deviate from live version, they manually create a **"Personal Variant"** (`variant_type: 'personal'`).
  Preserves Ownership principle; system stays simple (**DEC-016**).
_Avoid_: Version histories cluttering the library; forcing EM to decide which version to use; silent auto-updates confusing historical records
