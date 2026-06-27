# PiC Healing - Project Manifesto & Guidelines V2

This document operationalizes the manifesto for product, UX, and implementation decisions.
Canonical domain terms: `CONTEXT.md`. Agreed architecture: `decisions.md` (DEC-001–DEC-013).

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

### E. Player & Structured Markdown
- **Player** (הנגן): Treatment execution engine displaying atomic steps **one per screen** (**DEC-015**).
- **Subjective Completion (EM Sovereignty):** **No validation gates**. The EM decides when a step is complete based on 
**internal readiness** (executed, understood, or intuitively skipped). Click **"Next"** when ready—no pressure (**DEC-015**).
- **Structured Markdown Standard:** All treatments authored in **Structured Markdown** (H3 headers = steps). Content Parser converts
  existing HTML + future Markdown into atomic JSON steps (**DEC-015**).
- **Finish & Integrating:** Clicking **"Finish"** (סיום) auto-increments `use_count` (**DEC-006**). 
Exiting before end preserves session as **Integrating** (not failed, EM can resume) (**DEC-015**).

### E. Post-Treatment: Integration & Growth
- Offer Reflective Journaling after a session (any step order); not only at end of linear wizard.
- Do not use failure framing when treatment is incomplete; use Integrating/In Progress states.
- Integration reasons may include repetition, pending user commitments, or natural body permeation time.
- **Personal Treatment Library `use_count`:** auto-increment **only** on Player **Finish** (סיום) after **required** steps; **optional**
  closing **yes/no** muscle-test (*did it end successfully?*) per protocol; **Integrating** mid-exits do **not** auto-increment; **auto-decrement**
  if user navigates **back** from **Finish**; **manual edit anytime** for Event Manager sovereignty (**DEC-007**); **Multitype Timeline** with
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
