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

**Symptom** (סימפטום):
One named concern inside a Symptom Group (e.g. lower back and neck as two symptoms in one group).
_Avoid_: Treating “symptom” as synonymous with the group itself

**Blind (re-)rating**:
Applies **only to a symptom** (e.g. intensity 1–10): part of **symptom–group healing paths** the product offers, with the prior score
hidden unless the Event Manager overrides. Each symptom has a **polarity** (Positive or Negative, reflecting the valence of the current
state), and the Event Manager may **flip polarity** during updates (e.g., "Back Pain" [Negative] → "Back Strength" [Positive]).
The Event Manager may also start **ad-hoc** re-rating when they choose — not only at a fixed session gate. **Smart-Link suggestion**
proactively invites rating when a technique is linked to a group or symptom, closing the feedback loop (**DEC-009**).
_Avoid_: Blind rating on visits with no symptom in scope; implying every healing path requires a blind rating; forcing the EM to rate
the same symptom with conflicting polarities simultaneously

**Polarity** (rating direction):
The **valence** or **direction** of a symptom's current rating: either **Positive** (strength, ease, improvement) or **Negative** (pain,
difficulty, challenge). The Event Manager may change polarity during any rating update, reflecting the healing journey where a state
evolves from negative to positive.
_Avoid_: Treating polarity as immutable; assuming a symptom name must match its polarity (EM can reframe)
