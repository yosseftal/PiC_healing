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

### 1. **Courses & Academy — Lessons, Progress, Library Integration** (HIGH PRIORITY - NEXT)
**Status:** Open (GQ-013, ready to grill)

**Context:** DEC-003 defines courses as parallel lane with NEMAR, Player, Integrating.
DEC-015 establishes Structured Markdown (H3 = step) as the standard for all treatment protocols.
Gaps: do course **lessons** use the same H3 parsing, or do they have a different structure?
How do techniques "extracted" from a course lesson differ from standalone techniques?
When/how do course lesson techniques enter Personal Treatment Library?
Course completion triggers, lesson skipping, replay and progress tracking.

**Subsystem scope:** Course lesson structure. Lesson-to-step mapping (H3-based or custom?).
Technique extraction & library integration. Replay semantics. Progress UI. Course completion triggers.

**Key question for GQ-013:** Do course **lessons** follow the same **Structured Markdown + H3 header parsing** as standalone treatments
(DEC-015), or should courses use a different content format? How does the system distinguish between a lesson extracted to the library
vs. a technique executed standalone?

---

### 2. **Freemium Model & Paywall Boundaries** (MEDIUM PRIORITY)
**Status:** Open (GQ-014, pending)

**Context:** DEC-003 mentions free teaching vs. paid persistent healing.
Gaps: specific feature gates, onboarding flow for new users, grant mechanics, trial logic, upsell timing, data export.

**Subsystem scope:** Which features require subscription? When does paywall trigger? Onboarding sequence. Upsell strategy. Free user data rights.

---

### 3. **Integrating State Lifecycle** (MEDIUM PRIORITY)
**Status:** Open (GQ-015, pending)

**Context:** Integrating mentioned in DEC-006, DEC-009, DEC-013, DEC-015.
Gaps: how EM knows when Integrating → done? Is it terminal or a waypoint? Signaling & UX affordances.
Integration reasons (repetition, pending commitments, body permeation time). Can EM manually mark as done?
Time thresholds or user-initiated completion?

**Subsystem scope:** Integrating state semantics. Transition triggers. Interaction with use_count and timeline.
Optional vs. required transitions. "Mark as done" affordance. Integration duration guidance.

---

### 4. **Offline-First Sync & Conflict Resolution** (MEDIUM PRIORITY)
**Status:** Open (GQ-016, pending)

**Context:** CLAUDE.md §3 mentions "support for 'flight mode' work clean of distractions."
Gaps: device sync strategy, which tables sync, conflict resolution, retry logic, quota management.

**Subsystem scope:** Offline persistence. Sync triggers. Merge strategies. Network recovery. Data freshness. Multi-device consistency.

---

### 5. **Reflective Journal & Smart-Linking Mechanics** (LOW PRIORITY, foundation in place)
**Status:** May need refinement (GQ-017, optional)

**Context:** DEC-004, DEC-008 establish timeline + Smart-Linking. Journal entry creation, suggestion logic for linking.
Potential gaps: entry prompts, bulk linking, filtering/searching journal entries, journal export, journal-to-symptom suggestions.

**Subsystem scope:** Journal UX flow. Smart-Link affordances within journal. Archive/search. Export. Integration with rating suggestions.

---

## Next Steps

1. **GQ-013 (Courses & Academy):** [IN QUEUE] — Ready to grill on lesson structure (Structured Markdown same as treatments?),
technique extraction, progress tracking, library integration.
2. **GQ-014–GQ-017:** Remaining subsystems, prioritized by implementation risk.

---

## Grill Session Summary

- **Grilled subsystems:** 12 questions → 15 decisions (DEC-001 through DEC-015)
- **Architecture Status:** Foundation complete
  - Inquiry Flow (DEC-014)
  - NEMAR with Atomic Discovery (DEC-014)
  - Player with Subjective Completion (DEC-015)
  - Smart-Linking (DEC-008)
  - Ratings with Polarity & Intensity (DEC-009, DEC-010)
  - Personal Treatment Library (DEC-005, DEC-006, DEC-007)
- **Next Phase:** OpenSpec (feature specs, schema, tracer-bullet slices)
- **Remaining subsystems:** Courses, Freemium, Integrating lifecycle, Offline sync, Journal (5 potential grill questions)

---

## Grill Session Cadence

- **Target:** 1 grill question per session (or batch related Qs).
- **Documentation:** Each GQ gets its own DEC-xxx after resolution.
- **Interdependencies:** Player (DEC-015) → Courses (GQ-013) → Freemium (GQ-014) (loose dependency).
- **Status:** All 15 decisions documented; ready for OpenSpec after next grill round (or ready to code with these 15 as-is).
