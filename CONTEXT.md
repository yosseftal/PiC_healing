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
A treatment or session is still in progress — repetition, pending commitments, permeation time needed, or a **Terminal NEMAR**
"No" response (tagged `terminal_nemar_no`, vs. an ordinary mid-exit tagged `mid_exit`; both surface identically) (**DEC-006**,
**DEC-015**).
_Avoid_: Failed, error, incomplete, stuck, "In-Process, Not Yet Complete" as a separate label

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
**Auto +1** when a **Unified Player** run reaches **Finish** (סיום) — reachable unconditionally, with **no "required steps"
gate** — gated only by the mandatory closing **Terminal NEMAR** (**yes/no**: *Is it NEMAR that this ended successfully?*); a
"No" response stays **Integrating**, never blocking the sovereign **[Finish Anyway]** (**DEC-006**, **DEC-015**). 
**Manual +1** anytime from the library for off-app or intentional logs; 
the counter stays **secondary** and low-pressure (**DEC-006**). 
It is **separate** from any single Symptom Group’s Work Session; **Smart-Linking**
connects into a group or course when the Event Manager decides.
Each row is also a **hybrid Pointer or Hard Copy** entry (**DEC-016** §5, **GQ-025**): a **Pointer** (`variant_type:
`'original'` or `'course_extracted'`, `protocol_content` null) renders live from the master Treatments Table until the Event
Manager's first edit performs a **Lazy Flip** to a self-contained **Hard Copy**. **Self-invented** treatments (created directly
in the library, no Treatments Table origin) are **`variant_type: 'personal'`**, **Hard Copy from creation** (`protocol_content`
populated immediately, `global_reference_id` **NULL**) — never `'original'`, so they cannot be mistaken for a live template.
Every Hard Copy is the EM's sovereign **physical reality** — their own persisted protocol, whether from self-invention, a
named Personal Variant fork, or Lazy Flip. The library entry — whichever state it holds — is the **single source of truth for rendering** 
every past and future Timeline execution linked to it; the Timeline itself stores no snapshot.
_Avoid_: Collapsing the library into one Symptom Group, or treating it as the same thing as the global Treatments Table; classifying
self-invented treatments as `variant_type: 'original'`; duration or
stopwatch-style totals **on the library row** (v1 is **use count only**); scoreboard pressure or clutter around the counter (**DEC-006**);
implying a past execution froze the exact content followed at that moment (see **Linked Journey vs. Toolbox Model**).

**Global Content** (row ownership):
A database row with no owning Event Manager — `user_id` is `NULL` by design, e.g. seed `treatments` rows authored by
the content team and shared identically across every EM. Readable by all (including unauthenticated Guests, subject to
each adapter's own access rules), writable only by system/migration processes, never by a single EM's own actions.
_Avoid_: "Sovereign" for this concept (that term already means EM agency/autonomy over their own healing process — see
**Verified Sovereign Choice**, **[Finish Anyway]** — not row ownership); "public" alone (ambiguous with network exposure);
treating a Global row as anyone's personal data.

**Personal Content** (row ownership):
A database row owned by exactly one Event Manager — `user_id` is a real UUID matching that EM's `auth.uid()`, e.g. any
row in the **Personal Treatment Library**, a **Symptom Group**, or a **Timeline** event. Readable and writable only by
its owner (enforced via RLS `auth.uid() = user_id`).
_Avoid_: Confusing with **Global Content**; assuming every table needs one or the other exclusively — a **hybrid**
table (nullable `user_id`) can hold both kinds of row side by side (e.g. a shared seed catalog today, EM-authored
entries in the same table later) without a schema migration to add ownership after the fact.

**NEMAR** (נמ"ר):
Right, Accurate, Desirable — the muscle-test framing for whether to proceed with a line of inquiry or choice.
_Avoid_: NAMER (typo), yes/no without the three-part meaning where the method requires it

**Post-treatment success muscle-test**:
The binary muscle-test (**yes/no**: *Did this end successfully?*) at the end of a treatment, technique, or course — this **is**
the **Terminal NEMAR** (see below), not a separate optional inquiry. Superseded from "optional" to **mandatory** on 2026-07-13
(**DEC-015** §7b, resolves **GQ-024**); it does not replace **Finish** (סיום) as the commit that closes the **Unified Player**
for `use_count` rules, and a "No" response never blocks it (**DEC-006**).
_Avoid_: Treating it as a separate, still-optional inquiry distinct from Terminal NEMAR; forcing a specific remedial flow on "No"
(TBD, awaiting therapeutic guidance)

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

**Unified Player** (הנגן):
The single execution engine for every content sequence in PiC — standalone treatments, techniques, and course lessons alike.
There is **no separate** "Treatment Player" or "Course Player"; a course's Treatment Reference block simply opens a **nested**
Unified Player instance. Presents a sequence of **Atomic Units**, advancing automatically as the EM moves through content — there
are **no manual "Next"/"Skip"/"Back" buttons** and **no technical validation gates**. The EM decides when a unit is complete by
moving past it (executed, understood, or intuitively skipped); the system never checks *how*. The sequence ends at a mandatory
**Terminal NEMAR** unit; a "Yes" response enables **"Finish"** (סיום), which auto-increments `use_count`. Exiting before Finish,
or a Terminal NEMAR "No" response, preserves the session as **Integrating** (not failed); the EM can always resume, and
**[Finish Anyway]** remains sovereign regardless of Terminal NEMAR response or unit states (**DEC-006**, **DEC-015**).
_Avoid_: "Treatment Player" / "Course Player" as separate concepts; manual Done/Skip/Back buttons; blocking progression with
validation; framing incomplete sessions as failures; a "required steps" gate on Finish

**Structured Markdown** (DEC-015):
The canonical format for authoring all treatment protocols, techniques, and courses. Every **H3 header (###)** in the document
automatically defines one **Atomic Unit**. A blockquote (`>`) immediately following an H3 is extracted as that unit's
**Unit Rationale**. A Content Parser converts existing HTML docs and future Markdown into JSON entries in the database,
enabling fast retrieval and consistent unit sequencing (**DEC-015**).
_Avoid_: Ad-hoc step definitions; mixing formats; dense paragraph-based protocols without clear unit boundaries; "Player step" or
"lesson block" as separate vocabularies

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
All are navigated via the same **Unified Player** — automatic visibility-based transitions and the **Navigation Tree**, no
manual buttons; **no mandatory pre-treatment NEMAR** (**DEC-015**, **DEC-016**).
_Avoid_: Fixed lesson templates; forced linear progression; treating lesson blocks as different from treatment protocols in
structure; a separate course-specific button set

**Course Work Session** (DEC-016):
A dedicated, persistent Work Session for a course enrollment. Can exist **independently** on the Chronological Timeline (no parent Symptom Group)
or be **nested** within a Symptom Group's Work Session (when EM tags course-as-treatment for a group).
Carries full chronological integrity, NEMAR machinery, Player execution, Integrating states, and retroactive linking to any logical unit
(other groups, courses, journal entries) for full data reciprocity (**DEC-016**).
_Avoid_: Forcing courses into a rigid hierarchical parent-child relationship with Symptom Groups; preventing independent course Work Sessions

**Atomic Unit** (DEC-015):
The single content-unit concept in the Unified Player, replacing the separate vocabularies of "Player step" (treatments) and
"lesson block" (courses). Each Atomic Unit holds one of four states, set automatically — never via a manual button:
**`unseen`** (not yet reached), **`in_view`** (currently rendered, ephemeral), **`skipped`** (bypassed via a Navigation Tree
forward jump, persisted), or **`completed`** (rendered and navigated past, persisted). A `skipped` unit can be revisited and
"upgraded" to `completed` by rendering it and navigating forward again; this never re-triggers success metadata (**DEC-015**).
_Avoid_: "Player step" / "lesson block" as separate terms; manual "Done"/"Skip" buttons; treating `skipped` or `unseen` as
blocking Finish

**Navigation Tree** (DEC-015):
The **exclusive** manual mechanism for non-sequential movement within the Unified Player — a hierarchical outline of every
Atomic Unit in the sequence. Selecting a future unit auto-marks intervening units `skipped`; selecting a prior unit is
**"Revisiting"** (deepening), never undoing — a `completed` unit stays `completed`, and revisiting never touches `use_count` or
a prior Finish declaration (**DEC-015**).
_Avoid_: A separate "Skip" button; treating backward navigation as "Revoking"; any manual mechanism for setting `skipped`
outside the tree

**Terminal NEMAR**:
A mandatory **Atomic Unit** appearing as the final step before Finish (סיום) in every Unified Player instance: "Is it NEMAR that
this [Treatment/Course/Technique] ended successfully?" **Yes** enables the standard **Finish** button; **No** marks the session
**Integrating** (remedial logic TBD). **[Finish Anyway]** stays sovereign and available regardless of response or prior unit
states (**DEC-015**).
_Avoid_: Treating Terminal NEMAR as a technical gate; blocking [Finish Anyway] on a "No" response; a new "incomplete" label for
the "No" path

**Unit Rationale**:
Optional clinical/therapeutic reasoning behind an Atomic Unit, authored as a blockquote immediately following its H3 header in
Structured Markdown. **Hidden by default** (pull-based visibility) and surfaced only via an explicit "info" affordance, so it
never competes with the primary unit content or interrupts **Atomic Focus** (**DEC-015**).
_Avoid_: Showing rationale by default; treating it as required reading; letting it affect unit-state transitions or Finish

**Linked Journey vs. Toolbox Model** (DEC-016, renamed **GQ-025**):
**Hybrid Pointer-to-Copy approach** — no textual snapshot exists anywhere in the system:
- **Timeline as a "Linked Journey" (no snapshot):** A Timeline event never embeds protocol content; it **links** to the Personal
  Treatment Library entry via `treatment_id`. Reviewing a past execution renders through that entry's **current** state — live guidance
  for a Pointer entry, or the EM's own persisted content for a Hard Copy entry. Historical integrity means **temporal/provenance**
  integrity (when it happened, that it happened, what it links to) — not a verbatim record of the exact wording followed at that moment.
- **Library entry: hybrid Pointer / Hard Copy state:** Every Personal Treatment Library entry is either a **Pointer** (unedited: renders
  live from the master Treatments Table, no version alerts, always current) or a **Hard Copy** (edited or self-invented: renders from
  its own persisted content, live link severed). The **first** edit of any kind performs a **Lazy Flip** (Copy-on-Write) from Pointer to
  Hard Copy for that entry. **Self-invented** entries are **`variant_type: 'personal'`** with `global_reference_id` NULL (Hard
  Copy from creation); named **Personal Variant** forks share `'personal'` but link to a parent in provenance.
- **Single source of truth:** The library entry — in whichever state it holds — is what every past and future Timeline execution of
  that treatment renders through. There is one row, never one row plus frozen copies per execution.
_Avoid_: Reintroducing per-execution snapshots; treating "historical integrity" as a promise of verbatim content; forcing EM to decide
which version to use; a separate orthogonal "is it live" flag (state is derived from `protocol_content` presence + `variant_type`)

**Guest Group / Guest Mode** (DEC-017):
A temporary, **local-only** Symptom Group an unauthenticated EM can create to run a **complete** NEMAR session (diagnosis,
treatment selection, Terminal NEMAR) before ever signing up — a full "Value Moment," not a restricted preview. If the EM
authenticates before closing the app, the Guest Group **promotes** in place to the new account; otherwise it **evaporates**
on close. Never modeled in Supabase; exists only on-device until promotion.
_Avoid_: Treating Guest Mode as a locked-down demo; server-side rows for unauthenticated data; silent data loss without the
EM's own choice to walk away

**Persistence Gate** (DEC-017):
The point at which an unauthenticated EM is asked to create an account — never before or during inquiry, only when the EM
tries to **anchor** the work: clicking **Finish** (סיום), syncing a Reflective Journal entry, or explicitly choosing "Persist
this Group." Framed as a "Safe Container" for wisdom already discovered, not a barrier to starting.
_Avoid_: Gating NEMAR inquiry or Terminal NEMAR itself; framing account creation as blocking access to the method

**Verified Sovereign Choice** (DEC-017):
The account deletion flow: a mandatory re-authentication ("Identity Lock") confirms the request is genuinely the account
owner's, then the EM chooses between **Immediate Delete** (irreversible, single-transaction) and **Safe Deletion** (14-day
soft-delete recovery window before automated purge). Both honor data sovereignty; the choice protects against unauthorized
access and against an irreversible action taken during emotional volatility.
_Avoid_: A single unverified delete action; treating the 14-day window as reducing the EM's absolute right to delete —it is
still their request that triggers the eventual purge, with no staff intervention
