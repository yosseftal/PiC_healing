# PiC Grill Session Backlog

Living list of subsystems requiring architectural grill questions.

---

## Completed Grill Questions (DEC-001–DEC-015)

**Resolved:** GQ-001 → GQ-012 → DEC-004 through DEC-015 (2026-06-22 through 2026-06-27).

See `decisions.md` for full context and rationale.

**Latest:** DEC-015 (2026-06-27) — Player Mechanics with Subjective Completion, Atomic Steps (Structured Markdown H3 parsing),
Content Pipeline, optional closing success NEMAR inquiry, and Integrating state.

---

## Open Subsystems Requiring Grill Questions

### 1. **Courses & Academy — Lessons, Progress, Library Integration** (HIGH PRIORITY - COMPLETED)
**Status:** ✅ Resolved (GQ-013 → DEC-016, 2026-06-27)

**Resolution:** DEC-016 establishes courses as parallel Work Sessions with **polymorphic lesson blocks** 
(Original Content, Treatment Reference, Insight/הגיג, Reflection Prompt) all authored in **Structured Markdown** 
(H3 headers = steps, same as treatments). Subjective navigation (skip, return, done). 
**Course completion** when all required blocks marked done. **Auto library sync:** first-time course treatment auto-adds
to Personal Treatment Library with use count reciprocity. ✅

---

### 2. **Freemium Model & Paywall Boundaries** (MEDIUM PRIORITY)
**Status:** Open (GQ-014, pending)

**Context:** DEC-003 mentions free teaching vs. paid persistent healing. CLAUDE.md §1B: "Core method education
(self-muscle-testing videos/text) must remain freely accessible. Freemium rule: diagnostic tables and logic
are open; persistent memory, tracking, and Reflective Journal require subscription."

**Gaps:** Which specific screens/features are free? When paywall triggers? What free user can do offline.
New user onboarding (show value before asking for payment). Trial mechanics (length, access scope). Upsell
timing (push points). Free user data rights. Grandfathering. Multi-currency or regional pricing.

**Subsystem scope:** Free feature set boundaries. Paid feature set boundaries. Onboarding funnel. Trial logic.
Upsell triggers & messaging. Account upgrade flow. Data export (free user rights).

**My Suggestion for GQ-014:**
```
Option 1: Layered Freemium (Recommended)
  - FREE: Core method education (videos, text, NEMAR inquiry engine, diagnostic tables).
    Offline work on any Symptom Group (unsaved).
  - TRIAL (14 days after signup): All features (save, timeline, journal, Personal Library, courses).
    At end of trial, free user regains read-only access to saved data; cannot create new groups.
  - PAID: Full access to save, track, reflective journal, courses, and export.

Option 2: Hard Paywall
  - FREE: Method education only (Academy Gate). No app data persistence.
  - PAID: Immediate (at signup, trial optional). All features.

Option 3: Feature-Gated Freemium
  - FREE: Create one Symptom Group (with history). No courses, no journal.
  - PAID: Unlimited groups, courses, journal, export.
```

**Recommendation:** Start with **Option 1 (Layered Freemium)** — lets users experience the full workflow in a trial, builds trust,
and makes upsell natural (data loss is the push).

### Audit Insight (Architecture Stress-Test, 2026-06-30)

**Audit finding — Blind Spot 2.4 (BLOCKER):** The freemium model is not merely a pricing decision. Its absence
blocks every Supabase RLS policy, every API guard, and the `subscription`/`entitlement` schema.
No feature can be access-controlled until this is resolved. **Elevate from MEDIUM to BLOCKER.**

**Core structural question:** What is the data structure that records what an EM is entitled to do?

**Proposed Solution Paths:**

**Path 1 — Entitlement Flag Table:**
A `user_entitlements` table stores boolean feature flags (`can_save`, `can_journal`, `can_create_groups`, etc.).
Each RLS policy and API guard reads these flags. Freemium gates become runtime configuration, not hardcoded logic.
- *Manifesto alignment:* Flexible; future upsell adds flags without schema migration.
- *Risk:* Flag proliferation; flags must stay synchronized with every subsequent product decision.

**Path 2 — Plan-Tier Enum (Simplest):**
A single `subscription_tier` field on the user record (enum: 'free' | 'trial' | 'paid'). All access-control
branches on this one field.
- *Manifesto alignment:* Simplest to implement and reason about.
- *Risk:* Cannot express per-course grants (required by DEC-003) without adding a separate grants table anyway.

**Path 3 — Typed Grant Model (Recommended — most PiC-native):**
A `user_grants` table with typed grants: `feature_grant` (persistent capability), `course_grant` (per-course
access per DEC-003), `trial_grant` (time-limited with expiry timestamp). Free tier = zero grants. Paid =
permanent feature grants. Courses = per-course grants. Trial = time-expiry feature grants.
- *Manifesto alignment:* Matches DEC-003's "per-course grant" language exactly. Data sovereignty is auditable
  (what data belongs to which grant scope). Trial mechanic is a time-expiry grant — no special-case logic.
- *Risk:* Marginally more complex than Path 2; the long-term integrity benefit outweighs the setup cost.

**Audit priority:** Resolve before any schema design begins. Grill GQ-014 before GQ-015 or GQ-016.

---

### 3. **Integrating State Lifecycle & Completion Signals** (MEDIUM PRIORITY)
**Status:** Open (GQ-015, pending)

**Context:** Integrating is defined in CONTEXT.md and referenced throughout DEC-006, DEC-015 as a way to frame
incomplete treatments positively (not "failed"). Gaps: UX affordances for status, when/how EM can mark
Integrating → Complete, time-based suggestions, manual override, duration estimates.

**Subsystem scope:** Integrating state transitions. UI for viewing Integrating treatments. "Mark as Complete"
affordance. Time tracking (how long in Integrating?). Integration period estimates per treatment. Optional
reminders. Filtering (show only Integrating, hide Integrating).

**My Suggestion for GQ-015:**
```
Recommended Approach: User-Driven with Optional Guidance

1. **Visibility:**
   - Integrating treatments appear in a dedicated "In Progress" tab on the group.
   - Shows: treatment name, entry date, duration in Integrating, reason (repetition/pending/permeation).

2. **Manual Completion:**
   - EM can click "Mark as Complete" on any Integrating treatment at any time (sovereign choice).
   - System asks (optional): "Why did this complete? (Symptom improved / Other reason / Skip)?"
   - Records reason on timeline.

3. **Soft Reminders (Optional, User-Controlled):**
   - "This treatment has been integrating for 5 days. How's it feeling?"
   - Only if EM enables "Integration reminders" in settings.
   - No push notifications (only in-app).

4. **Time Estimates:**
   - Some protocols may include an "Estimated integration time" (e.g., 3–7 days).
   - System shows as a soft indicator, not a hard deadline.

5. **Bulk Actions:**
   - EM can mark all Integrating for a group as "Complete" in one action
     if symptoms have resolved or time milestone reached.
```

**Rationale:** Preserves EM sovereignty while offering structure for those who want guidance. Avoids pressure
(reminders optional). Honors the therapeutic reality that integration time is body-dependent.

### Audit Insight (Architecture Stress-Test, 2026-06-30)

**Audit finding — Contradiction 1.3 (HIGH):** Auto-decrement on back-navigation (DEC-007) is the only place
in the entire architecture where the system overrides an EM declaration without the EM's consent. An EM who
navigates "Back" to re-read a treatment step did not intend to revoke their completion. This conflicts with
EM Sovereignty as the governing principle of DEC-015.

**Proposed Solution Paths:**

**Path 1 — Remove Auto-Decrement; Replace with an Explicit Undo Window (Recommended):**
Clicking "Finish" triggers use_count +1 immediately. A brief "Undo" affordance appears (dismisses on session
close or when EM taps it). If EM taps Undo, the +1 is reversed and the session reverts to Integrating. After
the window closes, only manual edit (per DEC-007 §2) can adjust the count. Back-navigation has zero use_count
effect — it is a reading action, not a revocation.
- *Manifesto alignment:* Strongest sovereignty expression. Explicit Undo = explicit EM intent. No system-side
  inference about what navigation means.
- *Risk:* Undo window timing must feel unhurried in a therapeutic context; consider tying it to session close
  rather than a countdown.

**Path 2 — Soft Prompt on Back-Navigation from Finish:**
Back-navigation from the Finish state triggers a soft question: "Are you revisiting, or would you like more
time with this? [Keep as done] [Return to Integrating]." EM makes an explicit choice. No silent auto-action.
- *Manifesto alignment:* Explicit choice preserves sovereignty. Adds one interaction but removes ambiguity.
- *Risk:* Could feel like an interruption during the organic post-treatment flow (NEMAR → Player → Journal).

**Path 3 — Scope-Limited Auto-Decrement (Refine DEC-007, not replace it):**
Auto-decrement only applies while the Player session is still actively open (app in foreground, Player mounted).
Once EM closes the Player or backgrounds the app, the Finish declaration stands — only manual edit applies.
- *Manifesto alignment:* Partial sovereignty. Navigation within a live, uncommitted session can be treated as
  still mid-action; once the EM has left the Player, the declaration is final.
- *Risk:* "Session still active" is ambiguous on mobile; app-backgrounding is not the same as explicit close.

**Audit priority:** Fold Path resolution into GQ-018 (Completion Semantics) before any Player code is written.

---

### 4. **Offline-First Sync & Conflict Resolution** (MEDIUM PRIORITY)
**Status:** Open (GQ-016, pending)

**Context:** CLAUDE.md §3: "Offline Resilience: The app is designed to support 'Flight Mode' to ensure therapy continuity without
distractions, radiation, or dependency on network connectivity." Gaps: which tables auto-sync, sync triggers
(on-demand vs. scheduled), conflict resolution strategy, retry logic, offline workspace UX, quota limits.

**Subsystem scope:** Offline persistence model. Sync triggers & scheduling. Conflict resolution (last-write-wins? merge logic?).
Network recovery. Multi-device consistency. Offline quota (storage limits). Sync status UI. Data freshness indicators.

**My Suggestion for GQ-016:**
```
Recommended Approach: SQLite Local Cache + Last-Write-Wins Merge

1. **Offline Persistence:**
   - All core tables (symptom_groups, symptoms, timeline, personal_library, journal) cached locally on device.
   - Read-only remote fetch first (populate cache); all writes go to local cache immediately.
   - Symptoms, timeline, journal entries fully editable offline.

2. **Sync Triggers:**
   - **Automatic:** On app foreground (if network available) or every 5 min (if network available).
   - **Manual:** "Sync Now" button in Settings.
   - **Quota:** Sync limited to changes in last 30 days for new users; older data lazy-loaded on demand.

3. **Conflict Resolution (Last-Write-Wins):**
   - If EM edits same field on two devices (offline sync delay), keep the version with later timestamp.
   - Non-destructive: both edits visible in timeline (annotation: "synced from device X, replaced by Y").
   - Rare for Symptom Groups (EM typically on one device); more common for journal entries.

4. **Offline UX:**
   - Indicator in app header: "Offline" (red), "Syncing" (yellow), "Synced" (green).
   - All operations (read/write) work offline. Toast: "Data will sync when online."
   - No artificial blocking or "offline-mode" screens.

5. **Multi-Device Consistency:**
   - Each device syncs independently. Last successful sync timestamp stored locally.
   - On conflict, user sees merge popup: "Edited on two devices. Keep: [Device A] [Device B] [Merge]?"
   - If no conflict (99% of cases), silent merge.

6. **Storage Quota:**
   - Free users: 100 MB local cache (typically 500+ sessions).
   - Paid users: Unlimited local cache.
   - Old journal entries (>6 months) lazy-loaded on scroll.
```

**Rationale:** Simple, predictable conflict model. Offline-first (never block therapy for network). Visibility without clutter.
Multi-device support with clear resolution when rare conflicts occur.

### Audit Insight (Architecture Stress-Test, 2026-06-30)

**Audit finding — Blind Spot 2.8 (MEDIUM):** The `current_step_index` field on `inquiry_session` can diverge
across devices. The proposed last-write-wins model could silently reset a completed Player session if a stale
offline device syncs later with a newer timestamp than the device that reached Finish. This would violate the
"Integrating is not failure" principle by rolling back a completed session without EM consent.

**Proposed Solution Paths:**

**Path 1 — Monotonic Progress Model:**
`current_step_index` only moves forward during sync. Higher step index always wins on conflict. Session
completion state is monotonically sticky: once Complete, it never reverts to Integrating in sync. On
simultaneous Finish conflict (two devices), first-received Finish wins; the second is a no-op.
- *Manifesto alignment:* Predictable. Prevents regression of a declared completion.
- *Risk:* If EM deliberately restarted from step 1 on Device B (not merely offline lag), Device A's higher
  index overrides their intent silently.

**Path 2 — Snapshot-on-Finish Only (Recommended — most PiC-native):**
`current_step_index` is ephemeral and never continuously synced. Only three meaningful state transitions sync:
Finish (Complete), Integrating exit, Session opened. The step index is local-only until one of these fires.
Healing happens in the present moment — the mid-session step count is not a healing record.
- *Manifesto alignment:* Strongest Atomic Focus alignment. Each session is an atomic unit. Minimal sync
  surface reduces conflict surface area.
- *Risk:* App crash mid-session loses step position. EM resumes from beginning or last explicit save point.

**Path 3 — Session-Locked to Initiating Device:**
An active Player session is "owned" by the device that opened it. Other devices see it as read-only ("in
progress on another device"). Takeover from a new device requires explicit EM action.
- *Manifesto alignment:* Eliminates divergence entirely. But restricts EM freedom across devices.
- *Risk:* Lock detection requires a network check, which is incompatible with full Flight Mode operation.

**Audit priority:** Add `session_save_events` (Finish, Integrating exit, session opened) as the sync unit —
not `current_step_index` — to the GQ-016 scope definition.

---

### 5. **Reflective Journal & Smart-Linking Mechanics** (LOW PRIORITY, foundation in place)
**Status:** Open (GQ-017, optional refinement)

**Context:** DEC-004, DEC-008 establish timeline + Smart-Linking. Journal is part of Chronological Timeline. Gaps: journal entry
creation UX, Smart-Link suggestion triggers, bulk linking, filtering/search, export, auto-prompts after sessions.

**Subsystem scope:** Journal entry creation flow. In-session vs. post-session prompts. Smart-Link affordances. Search & filtering.
Bulk operations. Export (PDF, CSV). Integration with rating suggestions (DEC-009).

**My Suggestion for GQ-017:**
```
Recommended Approach: Lightweight, Non-Intrusive Journal Flow

1. **Journal Entry Creation:**
   - **Post-session prompt:** "Would you like to journal insights from this session?" (optional, dismissible).
   - **Ad-hoc entry:** "+" button in journal tab, creates blank entry with date/time.
   - **Auto-prompt:** Only after Player **Finish** or symptom rating, not after every interaction.

2. **Smart-Link Suggestions:**
   - When EM writes a new journal entry, scan text for keywords (symptom names, technique names, group names).
   - Show as non-blocking suggestions: "Link to group: [Lower Back]? [✓] [✕]"
   - EM can accept/reject instantly; no modal blocking.

3. **In-Session Journaling:**
   - Optional "Quick Note" box during Player (small text input, appears after Finish).
   - Saves as inline timeline entry linked to that technique execution.
   - Keeps journaling lightweight (not a separate, heavy flow).

4. **Filtering & Search:**
   - Filter journal by: date range, linked Symptom Group, linked technique, free text search.
   - Default: show last 30 days. "Show all" loads full archive.
   - Search across entry text + linked entities.

5. **Bulk Linking:**
   - Select multiple journal entries: "Bulk link to: [group/technique/course]?"
   - Useful for retroactive linking (e.g., "I kept notes in Notes app; now I'll link them all").

6. **Export:**
   - **PDF:** Timeline of entries (formatted, readablefor printing/sharing with therapist).
   - **CSV:** Raw data (entry text, links, date, polarity/intensity if rated).
   - Free user: export limited to last 30 days. Paid: full export.

7. **Integration with Rating Suggestions (DEC-009):**
   - After technique execution + journal entry, if related symptom exists in group:
     "You journaled about lower back. Would you like to re-rate lower back [1-10]?"
   - Non-blocking; EM can journal without re-rating.
```

**Rationale:** Journal is a **reflection tool**, not a data-entry burden. Smart-Linking suggestions are
**lightweight** (not modal popups). Most EM users will journal sporadically; avoid forcing it. Export is
useful for shared care (therapist collaboration).

### Audit Insight (Architecture Stress-Test, 2026-06-30)

**Audit finding — Contradiction 1.5 (MEDIUM):** DEC-008 classifies `link_created` / `link_removed` events as
technical corrections (hidden by default). It is undefined whether these meta-events appear in a Symptom
Group's scoped timeline when that group is the *destination* of a link. This gap will produce inconsistent
implementations of the group Work Session view.

**Proposed Solution Paths:**

**Path 1 — Meta-Events in Destination Group, Hidden by Default (Recommended):**
`link_created` and `link_removed` events appear in the linked group's scoped timeline but are filtered by
the existing "Corrections hidden" default (per DEC-007, DEC-008). EM enables "Show corrections" to audit
linking history for this group. No special cases; consistent with the established filter model.
- *Manifesto alignment:* Architecturally clean. Consistent. Default view stays uncluttered.
- *Risk:* EM may not immediately notice that an event was linked to their group during the current session.

**Path 2 — Newly Linked Events Visible Within Active Session Only:**
Within an active session, newly created links to this group surface as a lightweight, auto-dismissing banner
("Event X was just linked here — [View]"). Historical link events remain hidden (corrections filter). After
session close, all link meta-events return to hidden-by-default.
- *Manifesto alignment:* Balances in-session awareness (know when something was just linked) with long-term
  Atomic Focus (no permanent noise in the group view).
- *Risk:* Session-scoped visibility logic adds implementation complexity.

**Path 3 — Link Meta-Events Only in Global Timeline, Not in Group Views:**
Link/unlink events appear only in the unscoped global chronological timeline. Group-scoped views show only
substantive events: executions, ratings, journal entries.
- *Manifesto alignment:* Purest group-view Atomic Focus. Simplest to implement.
- *Risk:* EM cannot trace "how did this event end up in my group?" from within the group's own Work Session.

**Audit priority:** Resolve definitively during GQ-017 grill. This answer sets the filter model for all
group-scoped timeline views across the product.

---

---

### 6. **Completion Semantics Canonicalization** (⚠️ IMMEDIATE PRIORITY — BLOCKS ALL PLAYER IMPLEMENTATION)
**Status:** Open (GQ-018, identified 2026-06-30 Architecture Stress-Test)

**Context:** Three separate decisions use overlapping completion vocabulary with different meanings:
- DEC-006: use_count +1 when EM completes **"all required Player steps"** and presses Finish.
- DEC-015: **"No system-enforced required steps."** Finish is available at any point → use_count +1.
- DEC-016: Course blocks use **"Done (בוצע)"** for completion. Standalone Player uses **"Finish (סיום)"**.
- DEC-007: Back-navigation from Finish auto-decrements use_count (see Contradiction 1.3 / GQ-015 insight).

**Contradictions addressed:** 1.1 (Required Steps Paradox), 1.2 (Two Player Button Sets), 1.3
(Sovereignty vs. Auto-Decrement), 1.4 (Required Blocks in Courses).

**Gaps requiring resolution:**
- Is "Finish" and "Done" the same semantic action in different surface contexts, or genuinely different concepts?
- Which button set is canonical for the Player when embedded inside a course Treatment Reference block?
- Does "required steps" have any enforced meaning, or is it a display label only?
- Does clicking "Done" on a Treatment Reference block trigger use_count +1?
- Is `is_optional` on `player_steps` a gate, a hint, or deprecated?

**Proposed Solution Paths:**

**Path A — One Declaration, Two Labels (Unify Semantics, Keep Both Words):**
Both "Finish (סיום)" and "Done (בוצע)" map to a single semantic: **EM Declaration of Completion.**
Both trigger identical logic — (1) mark the unit complete, (2) if the unit is a treatment execution,
increment use_count. The button label differs per surface (Finish in standalone Player; Done in course blocks)
but the underlying action is identical. `is_optional` becomes a UI display hint only (suggested emphasis,
never a gate). "Required steps" is retired as a technical concept — all steps are equal; EM decides readiness.
- *Manifesto alignment:* Strongest EM Sovereignty. One clear action, one clear outcome. Eliminates the
  contradiction at its root. Simplest implementation path.
- *Risk:* Must update all copy referencing "required steps" in DEC-006, DEC-015, DEC-016, CLAUDE.md.

**Path B — Two Verbs, Two Distinct Semantics (Keep Mechanical Difference):**
"Finish (סיום)" means: "I completed this treatment execution — trigger use_count +1."
"Done (בוצע)" means: "I acknowledge this course block as complete for course progress tracking."
A Treatment Reference block in a course requires the inner Player to reach "Finish" before "Done"
is valid. Two separate completion events, two separate state updates.
- *Manifesto alignment:* Creates an invisible inner gate (must press Finish before Done can fire).
  Conflicts with "no validation gates" (DEC-015). The EM experiences two sequential confirmations
  for the same therapeutic act — not atomic.
- *Risk:* High implementation complexity. Two Player component modes with different interaction models.

**Path C — Single Neutral Verb, Context-Free (Maximum Sovereignty):**
Replace both "Finish" and "Done" with a single context-neutral phrase: **"I'm ready" / "סיימתי"**.
The system records this as a completion event. Whether use_count increments depends only on whether the
unit was a treatment execution (any type, any context). `is_optional` and "required" are removed from
the data model entirely — they are content-author editorial opinions, not system logic.
- *Manifesto alignment:* Purest expression of "Body as Database" (the EM's internal state is the only
  authority). Removes all mechanical tension from the vocabulary.
- *Risk:* Requires rewriting all existing button copy in DEC-015 and DEC-016. Highest doc-update cost.

**Recommendation:** Path A is most PiC-native. It preserves the emotional resonance of both Hebrew words
(סיום for endings, בוצע for accomplishment) while unifying their underlying logic. The decisive move is
to retire "required steps" as a gating concept and redeclare `is_optional` as a display-only attribute.

**Must also resolve in this grill:**
- The back-navigation decrement (see GQ-015 Audit Insight, Path 1 recommended).
- The blind rating entry path scope (see GQ-021, Part B).

---

### 7. **Authentication & User Identity Model** (⚠️ BLOCKER — MUST PRECEDE ANY SCHEMA DESIGN)
**Status:** Open (GQ-019, identified 2026-06-30 Architecture Stress-Test)

**Context (Blind Spot 2.1):** No decision addresses the user account model, authentication mechanism, or
RLS structure. Every table in the schema requires a `user_id` binding. Data sovereignty (promised in README)
requires knowing exactly what "all personal data" means for each user before any deletion or export can work.

**Information requirements:** The system must know about each EM:
- A stable unique identity (UUID) that persists across devices and sessions.
- What entitlements they hold (feeds GQ-014 / Path 3 grant model).
- Whether they have consented to data storage (GDPR / data sovereignty).
- Which data rows belong to them (RLS scope anchor).
- Last sync timestamp per device (feeds GQ-016).

**Proposed Solution Paths:**

**Path A — Magic Link / Passwordless Email:**
EM authenticates via email magic link (Supabase Auth built-in). No passwords. All data scoped by `user_id`
(UUID) via Supabase RLS. Device-level biometric (Face ID / fingerprint) for subsequent unlocks.
- *Manifesto alignment:* Minimum friction for the healing focus. No password anxiety. Flight Mode friendly
  after first auth (biometric unlocks local cache without network).
- *Risk:* Magic link requires email access; if EM loses email access, account recovery is complex.

**Path B — Social Auth + Email Fallback (Recommended — most PiC-native for mobile):**
EM signs in via Apple Sign-In or Google OAuth, with email magic link as fallback. Biometric unlocks
local cache after first auth. Apple Sign-In is required for App Store distribution (iOS policy).
- *Manifesto alignment:* Lowest friction path for the majority of mobile users. Supports Flight Mode.
  Per DEC-003's mobile roadmap, this is the correct direction.
- *Risk:* Social auth token lifecycle requires management; revocation scenarios must be handled.

**Path C — Anonymous-First with Account Upgrade:**
EM uses the app anonymously (local-only data) until they voluntarily create an account. At account
creation, local data migrates to server-scoped storage. No data lost in transition.
- *Manifesto alignment:* "No barrier to starting your healing journey" — highest alignment with the
  Ownership pillar. However, anonymous-to-account migration is the most complex technical path and
  creates a period where data sovereignty guarantees cannot be honored (no server record to delete).
- *Risk:* Two-tier data model (local-only vs. server-scoped) conflicts with data sovereignty promises.

**Structural requirement (all paths):** Define the `users` record fields and the RLS anchor pattern
before any other table schema is designed. Every table's `WHERE user_id = auth.uid()` depends on this.

---

### 8. **Causes & Treatments Table Schema and Diagnosed Cause Lifecycle**
**Status:** Open (GQ-020, identified 2026-06-30 Architecture Stress-Test — BLOCKER for NEMAR flow)

**Context (Blind Spot 2.2 + 2.7):** DEC-014 refers extensively to "Causes Table" and "Treatments Table"
as the engine of the NEMAR inquiry flow. Their schema, content governance, and the lifecycle of a diagnosed
cause are completely undefined. The NEMAR flow (the product's central feature) cannot be implemented without
resolving this.

**Information requirements:** These tables must express:
- **Item identity:** name (multilingual), category (Physical / Emotional / Energetic / Conscious), status
  (active / retired), and whether it is system-provided or EM-created.
- **Stable protocol ID:** a canonical ID that links a treatment item to its Personal Library row
  (feeds GQ-022 matching logic).
- **Cause item specifics:** body system, layer, typical pattern (if system-provided).
- **Treatment item specifics:** a link to the Structured Markdown protocol, estimated duration, provider
  type (self / practitioner / course).
- **Diagnosed cause (Left-path outcome):** which item, which session, which Symptom Group, timestamp,
  and whether it is still considered active or has been resolved.

**Proposed Solution Paths:**

**Path A — Unified Table with Item-Type Discriminator:**
One table (`nemar_items`) with `item_type` (enum: 'cause' | 'treatment') and `category`. Both Left-path
and Right-path draw from the same table. Simplest schema; causes and treatments share provenance.
- *Manifesto alignment:* Schema simplicity. However, conflates two conceptually distinct things: root
  causes of a condition vs. therapeutic interventions. Left/Right path metaphor breaks down in the data.
- *Risk:* Treatment-specific fields (protocol markdown, duration) become nullable noise on cause rows.

**Path B — Separate Tables with Shared Category Enum (Recommended):**
`causes_table` and `treatments_table` as distinct entities sharing the `category` enum. Causes carry
fields relevant to diagnosis (body system, pattern). Treatments carry fields relevant to execution
(protocol_id linking to Structured Markdown, provider type, duration estimate).
- *Manifesto alignment:* Most PiC-native. Mirrors the Left/Right path architecture of NEMAR. Clean
  separation of "what causes the symptom" from "how to address it." Easier to extend independently.
- *Risk:* Slightly more schema surface; worth it for methodological integrity.

**Path C — Content-as-Markdown with Tag System:**
All causes and treatments are Markdown documents (consistent with DEC-015) tagged with category, type,
and custom EM tags. NEMAR flow queries by tags. No rigid table structure.
- *Manifesto alignment:* Maximally flexible. One content model for courses, causes, and treatments.
- *Risk:* Tag-based querying for NEMAR category selection is imprecise and difficult to filter atomically.
  Atomic Discovery (category-level question, then item-by-item) requires structured fields, not free tags.

**Diagnosed Cause Lifecycle Sub-question (must resolve in this grill):**
When a cause is identified on the Left path, is it stored as:
- **(a) Persistent entity** (`diagnosed_causes` table with its own lifecycle: active / resolved / archived).
  Enables: "show all active causes for this group," cross-session cause tracking, resolution events.
- **(b) Timeline event only** (`log_type: 'cause_identified'` on the timeline, no persistent entity).
  Simpler. But: causes can only be found by scanning timeline events; no native lifecycle query.

**Recommendation:** Path B for table structure. Option (a) for diagnosed cause persistence. The ability
to see "what causes are still active in this group" is essential for the healing narrative.

---

### 9. **Intensity Scale Direction & Rating Entry Path Scope**
**Status:** Open (GQ-021, identified 2026-06-30 Architecture Stress-Test — HIGH PRIORITY)

**Context (Blind Spot 2.5 + Contradiction 1.7):** DEC-010 §4 explicitly defers: "does higher = better or
worse?" to OpenSpec. DEC-011 does not specify whether blind rating applies to all three rating modes
defined in DEC-009 (session-scoped, Smart-Link triggered, ad-hoc). Both gaps block every rating screen.

**Part A — Intensity Scale Direction:**

**Path A1 — Absolute Magnitude Model (Recommended):**
Intensity (0–10) always means "how strong is this sensation, regardless of polarity." Higher = more
intense. For a Negative symptom: 8/10 = high pain. For a Positive symptom: 8/10 = high strength.
Polarity tells direction; intensity tells volume. The two dimensions are fully independent — matching
exactly what DEC-010 intended.
- *Manifesto alignment:* Consistent across all rating events regardless of how the EM has reframed the
  symptom. Analytics can ask "is this sensation getting stronger or weaker?" independently of polarity.
  The healing narrative emerges from the combination of polarity + intensity over time.
- *Risk:* Counter-intuitive for users who expect "high number = improvement." Requires clear copy.

**Path A2 — Progress-Oriented Model:**
Intensity means "how close am I to full healing?" Higher = more healed (lower pain OR higher strength).
Polarity determines which "direction" 10 represents.
- *Manifesto alignment:* Intuitive for a healing goal. But when polarity flips, the entire historical
  scale re-calibrates retroactively (an EM who rated pain 3/10 meaning severe must re-interpret all prior
  ratings). Cross-time analytics become unreliable.
- *Risk:* Breaks the "pure growth trajectory" promised in DEC-010 §3.

**Path A3 — Separate Scales per Polarity:**
Negative: 0 = no pain, 10 = maximum pain. Positive: 0 = no strength, 10 = maximum strength.
Polarity flip resets scale semantics. Historical data requires polarity-aware query normalization.
- *Manifesto alignment:* Intuitively correct per individual rating event. But cross-time analytics
  (the promise of DEC-010) require a normalization layer on every query.
- *Risk:* Complexity in every analytics query; contradicts the "independent dimensions" goal of DEC-010.

**Recommendation:** Path A1 (Absolute Magnitude). It is the only model where the number means the same
thing across all rating events regardless of symptom reframing. Copy must make this clear to the EM.

**Part B — Blind Rating Entry Path Scope:**

**Path B1 — Blind Default for All Three Modes:**
All rating modes (session-scoped, Smart-Link triggered, ad-hoc) default to blind. Maximum bias prevention.
- *Manifesto alignment:* Strongest integrity. But applies blind default even when the EM explicitly
  navigated to a symptom to check a specific number — overriding their intent.
- *Risk:* Blind on ad-hoc navigation frustrates an EM who opened the rating screen intentionally.

**Path B2 — Blind Default for Session-Scoped Mode Only (Recommended):**
Only the structured session rating (suggested during an Inquiry Session flow) defaults to blind. Smart-Link
triggered and ad-hoc ratings show prior state by default, because the EM navigated there intentionally.
- *Manifesto alignment:* Most PiC-native. Differentiates EM intent: session suggestion (interrupt for a
  fresh read) vs. intentional navigation (check a number). Sovereignty governs.
- *Risk:* Three rating entry paths have different defaults; UX routing must distinguish them cleanly.

**Path B3 — EM Global Preference Setting:**
One setting: "Prefer blind ratings" (on/off). If on, all three paths default to blind. If off, all
paths show prior state. EM sovereignty at the meta-level.
- *Manifesto alignment:* Full sovereignty at the cost of discoverability. New EMs may not find the setting
  and miss the bias-prevention benefit.
- *Risk:* Defaults matter more than settings; this path defers the design question rather than resolving it.

---

### 10. **Library Sync Protocol & First-Time Execution Detection**
**Status:** Open (GQ-022, identified 2026-06-30 Architecture Stress-Test — HIGH PRIORITY)

**Context (Contradiction 1.6):** DEC-016 §6 says first-time course treatment execution auto-adds to library.
DEC-005 says one logical row per logical technique. The matching algorithm — how does the system determine
whether a library row already exists for a given treatment reference in a course? — is undefined. A race
condition under multi-device offline use can create duplicate library rows, violating DEC-005.

**Information requirements:** A treatment execution event must be matchable to a Personal Library row by a
stable, cross-source `protocol_id`. This ID must exist on: Treatments Table items, Treatment Reference
blocks in courses, and Personal Library rows. The ID must be consistent regardless of the source surface.

**Proposed Solution Paths:**

**Path A — Canonical Protocol ID (Global Stable Identifier, Recommended):**
Every treatment/technique in the system has a globally unique `protocol_id` assigned at content creation.
The Personal Library row is keyed by `protocol_id`. "First-time" check: does a library row with this
`protocol_id` exist for this user? Yes → increment use_count. No → create row with provenance.
Variants have their own `protocol_id` linked to a parent `protocol_id`.
- *Manifesto alignment:* Deterministic. No ambiguity. The algorithm is a single lookup, not inference.
- *Risk:* Requires Sigal's content authoring process to assign IDs consistently. Self-invented EM entries
  need a client-generated UUID.

**Path B — Fuzzy Name Matching with EM Confirmation:**
On first execution of a treatment, system checks the library by name similarity. If a close match exists,
it asks the EM: "Is this the same as [Library Row X]? [Yes — link it] [No — create new entry]."
- *Manifesto alignment:* Maximum EM sovereignty (EM defines what "the same" means). But introduces friction
  mid-treatment at an inopportune moment. Inconsistent behavior across devices.
- *Risk:* Interrupts healing flow; violates Atomic Focus at the Player completion moment.

**Path C — Execution-First, Background Deduplication:**
Every treatment execution creates a timeline event immediately. Library sync runs as a background job
(on session close or network reconnect) that deduplicates using `protocol_id`. No mid-execution decisions.
First-received Finish wins for use_count on simultaneous conflict (same logic as GQ-016 Finish conflict).
- *Manifesto alignment:* Zero friction at the Finish moment. Deduplication is a backend concern, not
  an EM concern. Best Atomic Focus alignment at the point of completion.
- *Risk:* Background job complexity; must handle offline-queue race conditions explicitly.

**Recommendation:** Path A for the canonical ID structure (required regardless of other choices).
Path C's background deduplication for race condition handling. These are complementary.

---

### 11. **Content Authoring, Governance & Mid-Session Protocol Updates**
**Status:** Open (GQ-023, identified 2026-06-30 Architecture Stress-Test — MEDIUM PRIORITY)

**Context (Blind Spot 2.3 + Contradiction 1.8):** No CMS or content governance model is defined. When Sigal
updates a protocol in the master Treatments Table, active course sessions see changed content mid-enrollment
without any warning — the "no version alerts" rule (DEC-016) creates a silent content drift problem for
in-progress sessions.

**Information requirements:** Content governance must express:
- Who can create, edit, and publish content (Sigal only? Certified practitioners? Tiered access?).
- What states content items can be in (draft / published / retired).
- What happens to active course sessions when a linked protocol is updated or retired.
- How a Treatment Reference block in a course maintains its link to the master protocol if that protocol
  is deleted.

**Proposed Solution Paths:**

**Path A — Snapshot on Enrollment (Recommended — most PiC-native):**
When EM enrolls in a course, the system saves a snapshot of the current protocol versions used by that
course's Treatment Reference blocks. The enrolled session uses these snapshots. Sigal's updates do not
affect active sessions. EM must explicitly "Refresh course content" to adopt updated versions.
The library card always points to the live version (Diary vs. Toolbox model per DEC-016 §5). The enrolled
session becomes the "Diary entry" at enrollment time — consistent with the model already agreed.
- *Manifesto alignment:* Strongest historical integrity. EM never experiences surprise content changes
  mid-healing journey. Precisely extends the Diary vs. Toolbox model to course enrollment.
- *Risk:* Slightly more storage (enrollment snapshots). Refresh mechanism requires explicit design.

**Path B — Live Content with Change Notification:**
Course sessions always display live content. When Sigal updates a protocol, active sessions receive an
in-app notification: "Sigal updated this protocol. [See what changed] [Dismiss]."
- *Manifesto alignment:* EM always has the latest guidance. But content change mid-session interrupts
  Atomic Focus and may confuse an EM mid-protocol.
- *Risk:* Notification complexity; mid-session content drift undermines healing continuity.

**Path C — Versioned Content with EM-Controlled Upgrade:**
Sigal publishes protocol versions (v1, v2). Active sessions stay on their enrolled version. EM sees:
"A newer version is available. [Upgrade] [Stay on current]."
- *Manifesto alignment:* Maximum EM control over their content experience.
- *Risk:* "Version" language is software vocabulary that conflicts with the healing tone of the product.
  Adds UI complexity for a scenario (mid-enrollment updates) that should be invisible to most EMs.

---

## Next Steps

**Priority order revised after Architecture Stress-Test (2026-06-30):**

| Priority | GQ | Topic | Reason |
|---|---|---|---|
| 🔴 IMMEDIATE | GQ-018 | Completion Semantics | Blocks all Player implementation |
| 🔴 BLOCKER | GQ-019 | Auth & User Identity | Blocks all schema design (no RLS without user model) |
| 🔴 BLOCKER | GQ-020 | Causes/Treatments Schema | Blocks all NEMAR flow implementation |
| 🟠 HIGH | GQ-014 | Freemium Model | Blocks all access control (elevated from MEDIUM) |
| 🟠 HIGH | GQ-021 | Intensity Scale & Rating Paths | Blocks all rating screen design |
| 🟠 HIGH | GQ-022 | Library Sync Protocol | Blocks course → library integration |
| 🟡 MEDIUM | GQ-023 | Content Authoring/Governance | Blocks content operations pipeline |
| 🟡 MEDIUM | GQ-015 | Integrating Lifecycle | Refine after GQ-018 resolves auto-decrement |
| 🟡 MEDIUM | GQ-016 | Offline-First Sync | Session state model feeds from GQ-018 |
| 🟢 LOW | GQ-017 | Journal & Smart-Linking | Foundation in place; refine when ready |

**Resolved:**
1. ✅ GQ-013 → DEC-016 (Courses & Academy)

---

## Grill Session Summary

- **Grilled subsystems:** 13 questions → 16 decisions (DEC-001 through DEC-016)

- **Architecture Status (revised 2026-06-30): Foundation Conceptually Sound — Critical Gaps Identified**

  *What IS implementation-ready (tracer-bullet spike only):*
  - Symptom Group entity and archival lifecycle (DEC-002, DEC-013)
  - Polarity + Intensity as independent schema fields (DEC-010)
  - Timeline `log_type` categorization and filter architecture (DEC-007, DEC-008)
  - Structured Markdown → JSON content pipeline (DEC-015)
  - Smart-Link edge table concept (DEC-008)

  *What is NOT ready for general OpenSpec — critical gaps requiring resolution first:*
  - ⚠️ Auth/User model absent → no RLS policy can be written → nothing is deployable (GQ-019)
  - ⚠️ Freemium enforcement undefined → no access control on any feature (GQ-014)
  - ⚠️ Causes/Treatments Table schema undefined → NEMAR flow cannot be built (GQ-020)
  - ⚠️ "Required steps" contradiction → Player Finish logic is ambiguous (GQ-018)
  - ⚠️ Two Player button sets → two incompatible UIs for the same component (GQ-018)
  - ⚠️ Intensity scale direction deferred → rating UX and analytics are blocked (GQ-021)
  - ⚠️ First-time library detection undefined → course → library sync is not implementable (GQ-022)

- **Prior status "Foundation COMPLETE" is revised.** The 16 decisions cover the philosophical and UX
  surface with genuine depth. The failure mode is precision: terms like "required," "Finish," and "Done"
  accumulated multiple meanings across decisions without being canonicalized. The architecture is not yet
  closed for OpenSpec. It requires GQ-018 through GQ-022 (estimated 3–4 resolution sessions) before
  the first full sprint can proceed safely.

- **What CAN begin now:** A tracer-bullet spike limited to the simplest happy path — create a Symptom
  Group, add a symptom, rate it, view the timeline event — is feasible with current decisions.

---

## Grill Session Cadence

- **Target:** 1–2 grill questions per session (batch closely related Qs; e.g., GQ-018 + GQ-015 §1.3).
- **Documentation:** Each GQ gets its own DEC-xxx after resolution.
- **Critical path:** GQ-018 → GQ-019 → GQ-020 → GQ-014 → GQ-021 → GQ-022 → OpenSpec.
- **Dependency note:** GQ-015 (Integrating Lifecycle) and GQ-016 (Offline Sync) should follow GQ-018,
  because the Integrating state transition logic and session sync model both depend on the Finish/Done
  semantics being canonicalized first.
- **Status:** Architecture stress-tested (2026-06-30). 6 new GQs added (GQ-018–GQ-023). Ready to grill
  GQ-018 immediately.
