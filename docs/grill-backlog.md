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

**Context:** DEC-003 mentions free teaching vs. paid persistent healing. CLAUDE.md §1B: "Core method education (self-muscle-testing
videos/text) must remain freely accessible. Freemium rule: diagnostic tables and logic are open; persistent memory, tracking, and
Reflective Journal require subscription."

**Gaps:** Which specific screens/features are free? When paywall triggers? What free user can do offline. New user onboarding (show value
before asking for payment). Trial mechanics (length, access scope). Upsell timing (push points). Free user data rights. Grandfathering.
Multi-currency or regional pricing.

**Subsystem scope:** Free feature set boundaries. Paid feature set boundaries. Onboarding funnel. Trial logic. Upsell triggers & messaging.
Account upgrade flow. Data export (free user rights).

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

---

### 3. **Integrating State Lifecycle & Completion Signals** (MEDIUM PRIORITY)
**Status:** Open (GQ-015, pending)

**Context:** Integrating is defined in CONTEXT.md and referenced throughout DEC-006, DEC-015 as a way to frame incomplete treatments
positively (not "failed"). Gaps: UX affordances for status, when/how EM can mark Integrating → Complete, time-based suggestions,
manual override, duration estimates.

**Subsystem scope:** Integrating state transitions. UI for viewing Integrating treatments. "Mark as Complete" affordance. Time tracking
(how long in Integrating?). Integration period estimates per treatment. Optional reminders. Filtering (show only Integrating, hide Integrating).

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

**Rationale:** Preserves EM sovereignty while offering structure for those who want guidance. Avoids pressure (reminders optional).
Honors the therapeutic reality that integration time is body-dependent.

---

### 4. **Offline-First Sync & Conflict Resolution** (MEDIUM PRIORITY)
**Status:** Open (GQ-016, pending)

**Context:** CLAUDE.md §3: "Offline Resilience: The app is designed to support 'Flight Mode' to ensure therapy continuity without
distractions, radiation, or dependency on network connectivity." Gaps: which tables auto-sync, sync triggers (on-demand vs. scheduled),
conflict resolution strategy, retry logic, offline workspace UX, quota limits.

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

**Rationale:** Journal is a **reflection tool**, not a data-entry burden. Smart-Linking suggestions are **lightweight** (not modal popups).
Most EM users will journal sporadically; avoid forcing it. Export is useful for shared care (therapist collaboration).


---

## Next Steps

1. **GQ-013 (Courses & Academy):** ✅ RESOLVED → DEC-016
2. **GQ-014 (Freemium Model):** [IN QUEUE] — Ready to grill on feature gates, trial mechanics, upsell timing.
3. **GQ-015 (Integrating Lifecycle):** [PENDING] — User-driven completion signals, soft reminders, time tracking.
4. **GQ-016 (Offline-First Sync):** [PENDING] — Last-write-wins, sync triggers, multi-device consistency.
5. **GQ-017 (Journal & Smart-Linking):** [OPTIONAL] — Journal UX, suggestion logic, export mechanics.

---

## Grill Session Summary

- **Grilled subsystems:** 13 questions → 16 decisions (DEC-001 through DEC-016)
- **Architecture Status:** Foundation COMPLETE
  - Inquiry Flow (DEC-014)
  - NEMAR with Atomic Discovery (DEC-014)
  - Player with Subjective Completion (DEC-015)
  - Courses with Polymorphic Lessons (DEC-016)
  - Smart-Linking (DEC-008)
  - Ratings with Polarity & Intensity (DEC-009, DEC-010)
  - Personal Treatment Library (DEC-005, DEC-006, DEC-007)
  - Structured Markdown as canonical protocol format (DEC-015)
- **Next Phase:** OpenSpec (feature specs, schema, tracer-bullet slices) — OR grill remaining subsystems (GQ-014 through GQ-017)
- **Remaining subsystems:** Freemium, Integrating lifecycle, Offline sync, Journal (4 potential grill questions, all optional refinements)

---

## Grill Session Cadence

- **Target:** 1 grill question per session (or batch related Qs).
- **Documentation:** Each GQ gets its own DEC-xxx after resolution.
- **Interdependencies:** Player (DEC-015) → Courses (GQ-013) → Freemium (GQ-014) (loose dependency).
- **Status:** All 15 decisions documented; ready for OpenSpec after next grill round (or ready to code with these 15 as-is).
