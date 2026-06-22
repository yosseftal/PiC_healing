# PiC Grill Session Backlog

Living list of subsystems requiring architectural grill questions.

---

## Completed Grill Questions (DEC-001–DEC-013)

**Resolved:** GQ-001 → GQ-010 → DEC-004 through DEC-013 (2026-06-22).

See `decisions.md` for full context and rationale.

---

## Open Subsystems Requiring Grill Questions

### 1. **NEMAR Inquiry Flow — Path Selection & Handoff** (HIGH PRIORITY)
**Status:** Open (GQ-011)

**Context:** README mentions "NEMAR path: Left (root cause in Causes Table) / Right (treatment in Treatments Table)."
Mechanics unclear: path selection timing, Left/Right atomicity, handoff to Player, session continuity.

**Subsystem scope:** How does the EM choose and navigate the two NEMAR paths? Can one Inquiry Session contain both Left + Right?

---

### 2. **Player Mechanics — Steps, Protocols, Execution** (HIGH PRIORITY)
**Status:** Open (GQ-012, pending)

**Context:** Player is referenced in DEC-006, DEC-011, DEC-012 (use_count auto +1 on Finish).
But Player structure undefined: what is a "Player step"? How do protocols map to steps? Ordering?

**Subsystem scope:** Protocol → Player execution flow. Step semantics (required, optional, conditional). Finish state. Error handling.

---

### 3. **Courses & Academy — Lessons, Progress, Library Integration** (HIGH PRIORITY)
**Status:** Open (GQ-013, pending)

**Context:** DEC-003 defines courses as parallel lane with NEMAR, Player, Integrating.
Gaps: lesson-to-step mapping, course replay and progress tracking, when/how techniques enter Personal Treatment Library, completion triggers.

**Subsystem scope:** Course lifecycle. Lesson progression. Technique extraction & library integration. Replay semantics.

---

### 4. **Empty Vessel & Safety Check (Self-Sabotage)** (MEDIUM PRIORITY)
**Status:** Open (GQ-014, pending)

**Context:** §3 in README mentions "Safety Check (Self-Sabotage)" and "Empty Vessel" as optional entry points.
Gaps: entry conditions, recommendation logic, blocking logic, content structure.

**Subsystem scope:** When/how does EM encounter these steps? UI affordances. Safety check content & muscle-test questions.

---

### 5. **Freemium Model & Paywall Boundaries** (MEDIUM PRIORITY)
**Status:** Open (GQ-015, pending)

**Context:** DEC-003 mentions free teaching vs. paid persistent healing.
Gaps: specific feature gates, onboarding flow for new users, grant mechanics, trial logic.

**Subsystem scope:** Which features require subscription? When does paywall trigger? Onboarding sequence. Upsell strategy.

---

### 6. **Integrating State Lifecycle** (MEDIUM PRIORITY)
**Status:** Open (GQ-016, pending)

**Context:** Integrating mentioned in DEC-006, DEC-009, DEC-013.
Gaps: how EM knows when Integrating → done? Is it terminal or a waypoint? Signaling & UX affordances.

**Subsystem scope:** Integrating state semantics. Transition triggers. Interaction with use_count and timeline.

---

### 7. **Offline-First Sync & Conflict Resolution** (MEDIUM PRIORITY)
**Status:** Open (GQ-017, pending)

**Context:** CLAUDE.md §3 mentions "support for 'flight mode' work clean of distractions."
Gaps: device sync strategy, which tables sync, conflict resolution, retry logic.

**Subsystem scope:** Offline persistence. Sync triggers. Merge strategies. Network recovery.

---

### 8. **Reflective Journal & Smart-Linking Mechanics** (LOW PRIORITY, foundation in place)
**Status:** May need refinement (GQ-018, optional)

**Context:** DEC-004, DEC-008 establish timeline + Smart-Linking. Journal entry creation, suggestion logic for linking.
Potential gaps: entry prompts, bulk linking, filtering/searching journal entries.

**Subsystem scope:** Journal UX flow. Smart-Link affordances within journal. Archive/search.

---

## Next Steps

1. **GQ-011 (NEMAR flow):** In progress — waiting for EM clarification on Left/Right atomicity and session handoff.
2. **GQ-012 (Player mechanics):** Scheduled after GQ-011.
3. **GQ-013 (Courses & Academy):** Scheduled after GQ-012.
4. **GQ-014–GQ-018:** Remaining subsystems, prioritized by implementation risk.

---

## Grill Session Cadence

- **Target:** 1 grill question per session (or batch related Qs).
- **Documentation:** Each GQ gets its own DEC-xxx after resolution.
- **Interdependencies:** NEMAR → Player → Courses (sequential dependency).

