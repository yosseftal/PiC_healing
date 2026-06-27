# PiC Grill Session Backlog

Living list of subsystems requiring architectural grill questions.

---

## Completed Grill Questions (DEC-001–DEC-014)

**Resolved:** GQ-001 → GQ-011 → DEC-004 through DEC-014 (2026-06-22 through 2026-06-27).

See `decisions.md` for full context and rationale.

**Latest:** DEC-014 (2026-06-27) — NEMAR Inquiry Flow with Atomic Discovery Mechanics, Intuitive Choice Rule, 
Scope Definition, and Completion Verification.

---

## Open Subsystems Requiring Grill Questions

### 1. **Player Mechanics — Steps, Protocols, Execution** (HIGH PRIORITY - NEXT)
**Status:** Open (GQ-012, ready to grill)

**Context:** Player is referenced in DEC-006, DEC-011, DEC-012, DEC-014 (use_count auto +1 on Finish, closing 
success muscle-test).But Player structure undefined: what is a "Player step"? How do protocols map to steps? Ordering? 
Branching? Error recovery?

**Subsystem scope:** Protocol structure, step types (required, optional, conditional), sequencing (linear vs. tree), 
Finish state, integration with Integrating state, Player state persistence, error handling.

**Key question for GQ-012:** Are Player steps atomic (each step = one action), linear (always sequential), or tree-based 
(conditional branching based on NEMAR or user choice)?

---

### 2. **Courses & Academy — Lessons, Progress, Library Integration** (HIGH PRIORITY)
**Status:** Open (GQ-013, pending)

**Context:** DEC-003 defines courses as parallel lane with NEMAR, Player, Integrating.
Gaps: lesson-to-step mapping, course replay and progress tracking, when/how techniques enter Personal Treatment Library, 
course completion triggers, lesson skipping.

**Subsystem scope:** Course lifecycle. Lesson progression. Technique extraction & library integration. Replay semantics.

---

### 3. **Empty Vessel & Safety Check (Self-Sabotage)** (RESOLVED IN DEC-014)
**Status:** Resolved in DEC-014

**Context:** Self-Sabotage is now a dynamic, group-specific symptom (DEC-014), not a mandatory pre-session gate.
Empty Vessel remains optional entry point (DEC-002).

---

### 4. **Freemium Model & Paywall Boundaries** (MEDIUM PRIORITY)
**Status:** Open (GQ-014, pending)

**Context:** DEC-003 mentions free teaching vs. paid persistent healing.
Gaps: specific feature gates, onboarding flow for new users, grant mechanics, trial logic, upsell timing.

**Subsystem scope:** Which features require subscription? When does paywall trigger? Onboarding sequence. Upsell strategy.

---

### 5. **Integrating State Lifecycle** (MEDIUM PRIORITY)
**Status:** Open (GQ-015, pending)

**Context:** Integrating mentioned in DEC-006, DEC-009, DEC-013, DEC-014.
Gaps: how EM knows when Integrating → done? Is it terminal or a waypoint? Signaling & UX affordances. Integration reasons 
(repetition, pending commitments, body permeation time). Transition to completion.

**Subsystem scope:** Integrating state semantics. Transition triggers. Interaction with use_count and timeline. 
Optional vs. required transitions.

---

### 6. **Offline-First Sync & Conflict Resolution** (MEDIUM PRIORITY)
**Status:** Open (GQ-016, pending)

**Context:** CLAUDE.md §3 mentions "support for 'flight mode' work clean of distractions."
Gaps: device sync strategy, which tables sync, conflict resolution, retry logic, quota management.

**Subsystem scope:** Offline persistence. Sync triggers. Merge strategies. Network recovery. Data freshness.

---

### 7. **Reflective Journal & Smart-Linking Mechanics** (LOW PRIORITY, foundation in place)
**Status:** May need refinement (GQ-017, optional)

**Context:** DEC-004, DEC-008 establish timeline + Smart-Linking. Journal entry creation, suggestion logic for linking.
Potential gaps: entry prompts, bulk linking, filtering/searching journal entries, journal export.

**Subsystem scope:** Journal UX flow. Smart-Link affordances within journal. Archive/search. Export.

---

## Next Steps

1. **GQ-012 (Player mechanics):** [IN QUEUE] — Waiting for EM clarification on step structure (atomic, linear, or tree-based).
2. **GQ-013 (Courses & Academy):** Scheduled after GQ-012.
3. **GQ-014–GQ-017:** Remaining subsystems, prioritized by implementation risk.

---

## Grill Session Cadence

- **Target:** 1 grill question per session (or batch related Qs).
- **Documentation:** Each GQ gets its own DEC-xxx after resolution.
- **Interdependencies:** NEMAR (DEC-014) → Player (GQ-012) → Courses (GQ-013) (sequential dependency).
- **Status:** All 14 decisions documented; ready for OpenSpec (feature specs) after GQ-012 resolution.

