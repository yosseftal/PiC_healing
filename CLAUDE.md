# PiC Healing - Project Manifesto & Guidelines V2

This document operationalizes the manifesto for product, UX, and implementation decisions.
Canonical domain terms: `CONTEXT.md`. Agreed architecture: `decisions.md` (DEC-001–DEC-016).

## 1. Project Vision
PiC (Personal Information Center) is a knowledge-management platform for self-healing.
It empowers users to access their body's "internal database" through a structured methodology,
turning subjective experiences into actionable wisdom.

## 2. Core Pillars (Implementation Logic)

### A. Symptom Groups, Empty Vessel & Ownership
- **Symptom Group** (קבוצת סימפטומים / מכלי הסימפטומים / הקשר) = **Work Session**
  (סשן עבודה): persistent log per group—history, documentation on any object in the
  group, ratings (with polarity), Integrating treatments. Groups remain
  **perpetually available**; the Event Manager may **archive/unarchive** anytime (**DEC-013**).
- **Formation:** List symptoms → **joint treatment muscle test** → one group if
  treated together; separate groups only when the test says split.
- **Symptoms** live inside a group (e.g. lower back + neck in one group); each symptom has
  a **polarity** (Positive or Negative) and the Event Manager may flip it during updates.
  **Renaming** (**DEC-012**) is independent; when the EM changes name or polarity, the system offers **soft suggestions**
  (not requirements) to review the other dimension. Renaming can happen anytime via group settings.
- **Empty Vessel** (הכלי הריק): optional free writing—symptom surfacing when building
  groups *or* spontaneous session notes (mood today, insights about the group).
  Recommended, not mandatory every visit.
- The Event Manager assigns and refines symptoms; the app organizes and retrieves.
- **Smart-Linking & Timeline (DEC-004, DEC-008):** The **chronological timeline** is the mandatory persistence spine for
  executions and insights. **Smart-Linking** is **intentional** (timing-flexible, multi-link, full unlinking authority) and
  logged as timeline events (**DEC-008**). The **Personal Treatment Library** records techniques/treatments the Event Manager
  has **run** at least once—**one logical row** per protocol with **provenance**, a **use count only** on the row (**DEC-005**;
  increment rules **DEC-006**, **DEC-007**), and **opt-in named variants** when materially different.

### B. The Gateway & Methodology Access
- Core method education (self-muscle-testing videos/text) must remain freely accessible.
- Freemium rule: diagnostic tables and logic are open; persistent memory, tracking,
  and Reflective Journal require subscription.

### C. Inquiry Sessions & NEMAR Flow
- **Inquiry Session** (סשן): one sitting with **one chosen focus**—**symptom-led** on a
  Symptom Group, **course-led** when a **course as treatment** is chosen, or **timeline-first**
  technique/treatment work. User may **switch focus** by **starting a new session anytime**.
- **NEMAR flow (Organic, multi-path):** Within a Symptom Group Inquiry Session, the EM flows organically between diagnosing
  root causes (Left path, using **Causes Table**) and selecting treatments (Right path, using **Treatments Table**), guided by
  real-time muscle testing (**NEMAR**). Categories are: Physical, Emotional, Energetic, Conscious (**DEC-014**).
- **Atomic Discovery (hierarchical NEMAR):** Category-level question first ("Is it **Physical**?"), then item-by-item 
  ("Is **this item** most NEMAR?"). Maintains **Atomic Focus** without overwhelming questions (**DEC-014**).
- **Intuitive Choice Rule:** If global NEMAR to category = Yes or No, system displays **entire table** for intuitive EM selection 
  instead of atomic discovery (**DEC-014**).
- **User preferences for discovery mode:**
  - **"Always show entire table"** (skip Atomic Discovery, show full table immediately).
  - **"Always show entire category"** (after category selection, show full category instead of item-by-item).
- **Pairwise category testing (optional):** EM can set mode to **"Show categories two by two"**: system groups 4 categories into pairs,
  asks NEMAR on pair ("Is it **Physical OR Emotional**?"), then splits into separate questions if Yes (**DEC-014**).
- **Steps** (flexible order; user may **start at any step**): Empty Vessel → Self-Sabotage rating (if added to group) → 
  NEMAR inquiry (Left/Right flow) → treatment player → Reflective Journal.
- **Recommended order:** same as above, but EM may reorder or skip where the method allows.
- **Self-Sabotage as group-specific symptom:** Not a mandatory gate; instead, a dynamic symptom the EM can add/remove from any
  group. When present, rated like any other symptom (blind re-rating supported). Satisfies "safety check" through standard rating
  workflow (**DEC-014**).
- **Multi-layered documentation:** Unit-level logs (each cause identified, each treatment executed) + session-level audit (comprehensive
  session narrative) (**DEC-014**).
- **Atomic Focus during a session:** one muscle-test question and one Player step at a time,
  one **focus target** per visit (symptom group or course-as-treatment)—not locked across visits.

### D. Dynamic Assessment, Polarity Ratings & Smart-Linking
- Allow **symptom refinement** on **symptom–group inquiry paths** when that focus is active.
- **Rating dimensions:** Each symptom has **independent Polarity** (Positive/Negative valence) and **Intensity** (0–10 magnitude)
  (**DEC-010**). The EM may flip Polarity while Intensity persists (e.g., "Back Pain" 8/10 Negative → "Back Strength" 2/10 Positive),
  supporting long-term analytics regardless of how the symptom is framed.
- **Blind (re-)rating** applies **only to symptoms** on symptom-group paths with Polarity and Intensity (**DEC-010**). Blind rating
  UX hides both prior dimensions by default (**DEC-011**); the EM may easily request to reveal one or both via simple toggle
  affordances (**DEC-011**). The Event Manager may also start **ad-hoc** re-rating when they choose (**DEC-004**).
- **Bias prevention:** hide the previous rating dimensions during blind input unless the Event Manager explicitly requests override.
- **Smart-Link suggestion:** When a timeline execution is linked to a Symptom Group or symptom, the system proactively suggests
  rating associated symptoms, closing the feedback loop with "The Center" (**DEC-008**, **DEC-009**).
- **Atomic Focus in rating:** only one symptom rated at a time; a symptom belongs to only one Symptom Group at a time (**DEC-009**).

### E. Unified Player & Structured Markdown

**The Unified Player** (הנגן) is the treatment execution engine powering standalone treatments, techniques, and course lessons.
It uses a flat 4-state machine with exclusive Navigation Tree navigation (**DEC-015**, **DEC-015 §7a**).

- **Player** (הנגן): Unified engine displaying Atomic Units (H3-defined steps) one at a time (**DEC-015**).
  - **Flat 4-state model:** Unit states are `unseen` (not yet reached), `in_view` (currently rendered, ephemeral),
    `skipped` (bypassed via forward tree jump, persisted), and `completed` (engaged and navigated past, persisted).
  - **Visibility-based state transitions:** Unit states change automatically as the EM moves through content:
    - `unseen` → `in_view`: triggered by rendering/viewport visibility (automatic, no button required).
    - `in_view` → `completed`: triggered by navigating to the next unit (automatic, no button required).
    - `unseen` → `skipped`: triggered by forward jumps via Navigation Tree (intermediate units auto-skipped).
    - `skipped` → `in_view` → `completed`: triggered when revisiting and re-engaging a skipped unit ("upgrade" path,
      non-blocking metadata refinement, no duplicate success metadata).
  - **No manual "Done," "Skip," or "Back" buttons in the primary Player UI.** Movement and visibility are the triggers.
  - **Both `skipped` and `completed` are "past" states:** Neither blocks forward progress or reaching Finish.
  - **Exit during in_view:** If the EM exits while a unit is `in_view`, it remains persisted as `unseen` or `skipped`
    (not `completed`). State persistence occurs only upon navigation to the next unit.

- **Navigation Tree — Exclusive Non-Linear Navigation (DEC-015 §7a):**
  - The Navigation Tree (hierarchical outline of all Atomic Units) is the **only** manual mechanism for non-sequential movement.
  - **Forward jumps:** Selecting a future unit via the tree automatically transitions intermediate units from `unseen` to
    `skipped` state (persisted for future deepening).
  - **Backward navigation (Revisiting):** Selecting a prior unit navigates back without reverting state. `Completed` units
    remain `completed` (deepening, never undoing). `Skipped` units trigger the normal visibility-based state machine when
    re-engaged, allowing natural "upgrade" to `completed` via re-engagement and forward navigation.
  - Revisiting is pure deepening, never undoing, never revoking success metadata.
  - Skipped units are tracked distinctly for analytics and enabled deepening.
  - Navigation Tree logic applies uniformly across all content types (treatments, techniques, courses).

- **Subjective Completion (EM Sovereignty):** No validation gates. The EM moves through content at their own pace;
  state transitions follow automatically. **Finish** (סיום) is the **only** trigger for success metadata (`use_count` +1, course
  completion status) (**DEC-006**, **DEC-015**). The Terminal NEMAR (see below) is a mandatory step preceding Finish, but the EM
  retains sovereign authority via the **[Finish Anyway]** bypass.

- **Terminal NEMAR — Mandatory Closing Muscle Test (DEC-015 §7b):**
  - Terminal NEMAR is a **mandatory Atomic Unit** appearing as the final step before Finish (סיום) in all Unified Player
    instances.
  - **Muscle test inquiry:** "Is it NEMAR that this [Treatment/Course/Technique] ended successfully?"
  - **Yes response:** Enables standard [Finish] button, triggering success metadata (`use_count` +1, course completion).
  - **No response:** Marks session as **Integrating** (בהטמעה) — the same non-failure state used for ordinary mid-exits,
    internally tagged `reason: 'terminal_nemar_no'` for analytics only (never a new "incomplete" label). Remedial flow (what
    happens next) TBD — awaiting therapeutic guidance from Sigal.
  - **Sovereign bypass:** [Finish Anyway] remains always available, allowing EM to force completion regardless of Terminal NEMAR
    response or prior unit states, honoring their authority over their own healing process (**DEC-015 §4**).
  - **Standard Atomic Unit:** Terminal NEMAR follows all visibility-based state transitions and Navigation Tree rules. Revisiting
    it never revokes prior success metadata. It is a mandatory touchpoint, not a technical gate.

- **Structured Markdown Standard:** All treatments authored in **Structured Markdown** (H3 headers = Atomic Units). Content Parser
  converts existing HTML + future Markdown into atomic JSON units (**DEC-015**).

- **Unit Rationale — Optional Deepening Metadata (DEC-015 §9–9a):**
  - **Markdown parsing:** Any blockquote (>) appearing immediately after an H3 header is extracted as `unit_rationale` metadata,
    separate from primary `unit_content`.
  - **Content ownership:** Rationale text is 100% authored by the content creator (e.g., Sigal) and reflects clinical/therapeutic
    reasoning. This architecture provides only the metadata container.
  - **"Info" affordance:** An optional, non-blocking UI element (e.g., "info" icon) surfaces the rationale when present.
    Interaction is entirely optional.
  - **Pull-based visibility (Atomic Focus preservation):** Rationale is **hidden by default**. It is revealed only upon explicit
    EM request (e.g., tapping an info icon), preserving primary unit clarity and Atomic Focus.
  - **Non-blocking deepening:** Opening, reading, or closing the rationale never affects unit state transitions, navigation, or
    Finish action. Rationale is a pure information layer.
  - **Consistency:** Applied uniformly across all content types (treatments, techniques, courses) in the Unified Player.

- **Finish & Integrating:** Clicking **"Finish"** (סיום) at the final unit auto-increments `use_count` (**DEC-006**).
  Exiting before the final unit preserves session as **Integrating** (not failed, EM can resume) (**DEC-015**).

- **Reflection Prompts:** A standard Atomic Unit type available in any Unified Player sequence (treatments, techniques,
  courses). Journal input affordance surfaces automatically when a Reflection Prompt unit is reached. No manual submission button
  required; progression to the next unit commits the entry (**DEC-015 §7**).

### F. Courses: Polymorphic Lessons, Contextual Binding & Content Versioning
- **Course Work Session & Polymorphic Context:** Courses are parallel lanes with dedicated Work Sessions. A Course Work
  Session can be **independent** (linked only to timeline, no parent Symptom Group) or **nested** (tagged as treatment for a
  Symptom Group). All course activities are **retroactively linkable** to any logical unit (groups, journal, other courses) for
  full data reciprocity (**DEC-016**).
- **Polymorphic Lesson Blocks:** Lessons use **Structured Markdown (H3 = Atomic Unit)** and can contain **four block types**:
  Original Content, Treatment Reference (dynamic link to shared protocols), Insight/הגיג (read-only inspiration), Reflection
  Prompt (**DEC-016**).
- **Subjective Navigation:** Courses use the same **Unified Player** engine and **Navigation Tree** mechanism as standalone
  treatments (**DEC-015**, **DEC-015 §7a**). No mandatory NEMAR before treatments; EM decides readiness. EM navigates via the
  Navigation Tree, with automatic flat 4-state transitions (`unseen` / `in_view` / `skipped` / `completed`). No technical gates.
  **Sovereignty:** EM can skip any block via forward Navigation Tree jumps; skipped units remain available for later deepening or
  "upgrade" to completed via re-engagement. EM can revisit any block anytime; `completed` blocks never revert state.
- **Course Completion:** Course marked "Successfully Completed" when EM clicks **"Finish"** at the final Atomic Unit, gated by
  the same mandatory **Terminal NEMAR** as any other Unified Player instance (**DEC-015 §4, §7b**). Both `skipped` and
  `completed` units are "past" states and do not block completion.
- **Content Versioning (Linked Journey vs. Toolbox, DEC-016 §5, GQ-025):** No snapshot is ever stored on the Timeline. A Timeline
 event **links** to its Personal Treatment Library entry, which is either a **Pointer** (unedited, always renders **live** from the
 master Treatments Table — no version alerts) or a **Hard Copy** (renders from its own persisted content). The EM's **first edit of
 any kind** performs a lazy **Copy-on-Write** flip from Pointer to Hard Copy; self-invented treatments and named **Personal Variants**
 (`variant_type: 'personal'`) are Hard Copy from creation. **Ownership principle:** when the EM updates a protocol in their library,
 that update is **live** across every past and future execution linked to it — their current healing wisdom, not a frozen snapshot of
 an earlier understanding. "Historical integrity" means *when and that it happened*, not a verbatim record of the exact wording
 followed at that moment.
- **Library Sync:** Completing a treatment in a course **auto-adds it** to Personal Treatment Library (first-time execution).
  **Use count reciprocity:** Course execution increments universal `use_count` in library. Toolbox grows organically
  (**DEC-016**).

### G. Post-Treatment: Integration & Growth
- Offer Reflective Journaling after a session (any step order); not only at end of linear wizard.
- Do not use failure framing when treatment is incomplete; use the **Integrating** state (never "Failed," "Error," or a new
  "In-Process, Not Yet Complete" label).
- Integration reasons may include repetition, pending user commitments, or natural body permeation time.
- **Personal Treatment Library `use_count`:** auto-increment **only** on Player **Finish** (סיום), reachable unconditionally at
  the final Atomic Unit — **no "required steps" gate** (**DEC-006**, **DEC-015**); gated by the mandatory **Terminal NEMAR**
  (**DEC-015 §7b**), with **[Finish Anyway]** always sovereign; **Integrating** mid-exits and Terminal-NEMAR "No" responses do
  **not** auto-increment; **no auto-decrement** on back-navigation — "Revisiting" never touches `use_count` (**DEC-007**);
  **manual edit anytime** for Event Manager sovereignty (**DEC-007**); **Multitype Timeline** with
  **`log_type`** categorization + **smart filtering** (corrections hidden by default) for clean workspace (**DEC-007**). Keep the metric
  **secondary** and non-pressuring.

## 3. Technical Standards
- **Line length:** no line may exceed 130 characters (enforced on staged files via
  `scripts/check-max-line-length.py`; enable with
  `git config core.hooksPath .githooks`).
- Stack: React, Supabase, TypeScript.
- UI/UX: Atomic Focus—one screen, one action; symptom-led visits stay on one Symptom Group; course-led and timeline-first technique visits
  follow `decisions.md` (**DEC-003**, **DEC-004**).
- Tone: strictly positive and empowering language in UI/system copy.
- Git: human-readable English commit messages.
- Persistence for healing work: `symptom_groups`, course enrollments, **chronological timeline / journal spine**, and **Personal
  Treatment Library** per `decisions.md` (**DEC-002**—**DEC-004**); avoid separate “context” buckets unless aliased to those concepts.

## 4. OpenSpec Alignment
- Use Spec-Driven Development workflow for new features.
- Ensure proposals, specs, and tasks reflect the pillars above and `decisions.md`.
- Preserve positive, non-blocking language and avoid dead-end UX flows (no mandatory linear wizard).

## Agent skills

### Issue tracker

GitHub Issues on `yosseftal/PiC_healing` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles use default label names (`needs-triage`, `needs-info`,
`ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md`, `decisions.md`, and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
