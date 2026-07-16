# Inquiry Session Flow Diagram (Organic Multi-Path Model)

**Reference:** DEC-014 — NEMAR inquiry flow, organic sequencing, self-sabotage as symptom, multi-layered logging.

---

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INQUIRY SESSION ENTRY                         │
│                  (Anchored to one Symptom Group)                 │
│                      DEC-001: Atomic Focus                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
           ┌─────────────────┐  ┌─────────────────┐
           │  EMPTY VESSEL   │  │  GROUP RATINGS  │
           │ (Free writing)  │  │ (Blind re-rate) │
           │   OPTIONAL      │  │ - All symptoms  │
           │  DEC-002        │  │ - Polarity &    │
           │                 │  │   Intensity     │
           │                 │  │ - Self-Sabotage │
           │                 │  │   if added      │
           │                 │  │ DEC-009, DEC-014│
           └────────┬────────┘  └────────┬────────┘
                    │                    │
                    └────────┬───────────┘
                             ▼
                   ┌─────────────────────┐
                   │   BODY GUIDANCE     │
                   │  (EM asks: What     │
                   │   does the body     │
                   │   need to explore   │
                   │   today?)           │
                   │  NEMAR muscle test  │
                   └────┬────────────┬───┘
                        │            │
         ┌──────────────┘            └──────────────┐
         ▼                                          ▼
    ┌──────────────────┐                  ┌──────────────────┐
    │  LEFT PATH:      │                  │  RIGHT PATH:     │
    │  DIAGNOSIS       │                  │  TREATMENT       │
    │ (Root Causes)    │                  │  (Solutions)     │
    │                  │                  │                  │
    │ NEMAR questions  │                  │ NEMAR questions  │
    │ on CAUSES TABLE  │                  │ on TREATMENTS    │
    │                  │                  │ TABLE            │
    │                  │                  │                  │
    │ Muscle test to   │                  │ Muscle test to   │
    │ narrow down:     │                  │ select:          │
    │ "What's the      │                  │ "What technique  │
    │  root cause?"    │                  │  should I use?"  │
    │                  │                  │                  │
    └────────┬─────────┘                  └────────┬─────────┘
             │                                     │
      ┌──────▼──────┐                      ┌──────▼──────┐
      │ Cause        │                      │ Treatment    │
      │ identified   │                      │ selected     │
      │              │                      │              │
      │ [Timeline    │                      │ [Timeline    │
      │  entry:      │                      │  entry:      │
      │ 'cause_      │                      │ 'treatment_  │
      │ identified'] │                      │ _selected']  │
      │              │                      │              │
      │ [Unit-level  │                      │ [Unit-level  │
      │  doc]        │                      │  doc]        │
      └──────┬───────┘                      └──────┬───────┘
             │                                     │
             └──────────┬──────────────────────────┘
                        │
            ┌───────────▼──────────────┐
            │  CONTINUE IN FLOW?       │
            │  (EM asks: What next?    │
            │   via body guidance)     │
            │  NEMAR muscle test       │
            └───────┬──────────────────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
    More          More         Ready to
   Causes        Treatments     Execute?
      │             │             │
      ▼             ▼             ▼
  Back to        Back to      ┌──────────┐
  LEFT path      RIGHT path   │  PLAYER  │
  (diagnose)     (select)     │ (Execute │
                              │treatment)│
                              │          │
                              │ No       │
                              │ required │
                              │ gate     │
                              │ ✓ Terminal
                              │  NEMAR   │
                              │  (mand.) │
                              │ [Timeline│
                              │  entry:  │
                              │ 'treatment
                              │ _executed│
                              │ ']       │
                              │ [+1 to   │
                              │ use_count│
                              │ DEC-006] │
                              └────┬─────┘
                                   │
                        ┌──────────▼──────────┐
                        │ INTEGRATING or      │
                        │ CONTINUE IN FLOW?   │
                        └────┬────────────┬───┘
                             │            │
                        CONTINUE       CLOSE
                             │            │
                             ▼            ▼
                        Back to      ┌────────────┐
                        Organic      │SESSION AUDIT│
                        Flow (Left   │            │
                        or Right)    │[Timeline   │
                                     │ entry:     │
                                     │'session_   │
                                     │closed']    │
                                     │            │
                                     │Comprehensive
                                     │session log:│
                                     │- Causes    │
                                     │  diagnosed │
                                     │- Treatments│
                                     │  executed  │
                                     │- Insights  │
                                     │- Sequence/ │
                                     │  context   │
                                     │            │
                                     │ Optional:  │
                                     │Reflective  │
                                     │Journal     │
                                     │entry       │
                                     └────────────┘
```

---

## Key Features Explained

### **1. Organic Flow Hub**
Once past Empty Vessel + Group Ratings, the EM navigates freely between Left and Right paths based on **real-time NEMAR guidance**
(muscle testing). There is **no mandatory order** — the body's wisdom directs the flow.

### **2. Left Path (Diagnosis / Root Cause)**
- EM asks NEMAR questions from the **Causes Table** (what are the root causes of this Symptom Group?).
- Multiple causes can be identified within one session.
- Each cause identified generates:
  - **Unit-level timeline entry** (`log_type: 'cause_identified'`)
  - **Unit-level documentation** (captured during session)

### **3. Right Path (Treatment Selection)**
- EM asks NEMAR questions from the **Treatments Table** (what treatments address these causes?).
- Multiple treatments can be selected within one session.
- Each treatment selected generates:
  - **Unit-level timeline entry** (`log_type: 'treatment_selected'`)
  - **Unit-level documentation** (captured during session)

### **4. Atomic Focus on Group, Not Path**
- **Atomic Focus** applies to the **Symptom Group** (one focus target per session), not to the NEMAR path.
- The EM stays anchored to one group but can flow between Left and Right paths infinitely within that session.
- Switching to a different Symptom Group = new Inquiry Session.

### **5. Player Execution**
- When the EM is ready to execute a treatment, they enter the **Unified Player**.
- The Player moves through Atomic Units automatically as the EM navigates — no manual buttons, no "required steps" gate
  (DEC-015).
- The final unit is a mandatory **Terminal NEMAR** ("Is it NEMAR this treatment ended successfully?"); a "Yes" enables
  **Finish**, while **[Finish Anyway]** stays sovereign regardless of response (DEC-015 §7b, GQ-024).
- On **Finish** (סיום):
  - `use_count` increments by 1 (DEC-006).
  - Timeline entry created (`log_type: 'treatment_executed'`).

### **6. Multi-Layered Documentation**

**Unit-Level Logs:**
- Each cause diagnosed → separate timeline entry + doc.
- Each treatment executed → separate timeline entry + doc.
- Granular, queryable history for analytics.

**Session-Level Audit:**
- At session close, a **comprehensive session record** is created capturing:
  - All units (causes, treatments, insights).
  - Chronological flow (e.g., "EM went Left → Right → Left → Player → Right again").
  - Session context (mood, blockers, breakthroughs).
  - Useful for narrative understanding and post-session reflection.

### **7. Integrating State**
- If a treatment is incomplete, the EM can exit the Player and the work is marked as **Integrating** (in progress, not failed).
- The EM can return to the organic flow (more diagnosis, more treatments) or close the session.

### **8. Session Closure**
- The EM can close the Inquiry Session anytime, triggering a **session audit** (comprehensive session log).
- Optional: capture **Reflective Journal** entry at this point (or later).
- All timeline entries + session audit remain forever in the Symptom Group's **Work Session** (DEC-002, DEC-004).

---

## Self-Sabotage as a Group-Specific Symptom (DEC-014)

**Not a mandatory pre-session gate.**

- EM may add "Self-Sabotage" as a symptom to any Symptom Group at any time.
- Each group has its own independent Self-Sabotage symptom (with Polarity + Intensity).
- When present, it is **rated like any other symptom** (blind re-rating, polarity flip, intensity update).
- This satisfies the "safety check" principle through standard group rating workflow — **no separate Safety Check UI needed**.
- If the EM doesn't feel Self-Sabotage is relevant to a group, they don't add it (group-specific autonomy).

---

## Example Scenario

**Maya's Session on "Lower Back + Neck" Symptom Group:**

1. **Empty Vessel** (optional): Writes "Today my neck is tighter, lower back feels stuck. I'm anxious I'll injure it."
2. **Group Ratings:**
   - Lower back pain: Negative, 7/10
   - Neck tension: Negative, 6/10
   - Self-Sabotage (she added it last session): Negative, 4/10 → she flips to Positive, 2/10 (realized she's more confident)
3. **Body guidance** (NEMAR): Asks, "Should I diagnose today?" → body says yes.
4. **LEFT PATH (Diagnosis):**
   - Asks NEMAR questions from Causes Table: "Is it posture?" → No. "Is it stress?" → Yes.
   - Cause identified: "Stress-related muscle tension."
   - [Timeline: 'cause_identified' + unit doc]
5. **Flow:** Asks, "Should I explore more?" → body says, "Let's treat now."
6. **RIGHT PATH (Treatment):**
   - Asks NEMAR questions from Treatments Table: "Should I use the tension release technique?" → Yes.
   - Treatment selected: "Tension Release Protocol."
   - [Timeline: 'treatment_selected' + unit doc]
7. **PLAYER:**
   - Moves through the protocol's Atomic Units.
   - Terminal NEMAR: "Is it NEMAR this ended successfully?" → body says yes.
   - Finish (סיום).
   - [Timeline: 'treatment_executed' + use_count +1]
8. **Integrating?** She feels the work is settling in. Exits.
9. **Session Audit:**
   - [Timeline: 'session_closed']
   - Comprehensive session record: "Identified stress as root cause. Executed tension release. Maya feels 30% relief, still integrating."
10. **Reflective Journal:** Optionally, Maya writes: "Interesting realization—the anxiety was worse than the actual pain. Relaxing now."

---

## Benefits of This Model

- **Flexibility:** Body-led, not system-led. EM and body determine the flow.
- **Granularity:** Unit-level logs enable precise tracking and analysis.
- **Context:** Session-level audit preserves the narrative, not just data points.
- **Autonomy:** Self-Sabotage is optional and group-specific, not a mandatory gate.
- **Continuity:** Multiple causes/treatments in one session without breaking Atomic Focus (which applies to the group, not the path).

---

## User Preference Logic for Atomic Discovery (DEC-014)

```
┌─────────────────────────────────────┐
│   EM Selects Discovery Mode         │
│  (or uses system default)            │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼────┐ ┌──▼────┐ ┌──▼────────┐
│Atomic  │ │Always │ │Pairwise   │
│(default)│ │Show   │ │Categories │
│        │ │Table  │ │           │
└───┬────┘ └──┬────┘ └──┬────────┘
    │         │         │
    ▼         ▼         ▼
┌─────────────────┐    ┌──────────────┐
│Category-Level   │    │Show Full     │
│NEMAR: "Is it    │    │Table/Category│
│Physical/        │    │for Intuitive │
│Emotional?"      │    │Selection     │
└────┬────────────┘    └──────────────┘
     │
     ├─ Yes
     │   │
     │   ▼
     │ ┌───────────────────────────┐
     │ │Item-by-Item NEMAR:        │
     │ │"Is [Item] most NEMAR?"    │
     │ │(one item per screen)      │
     │ └─────────┬─────────────────┘
     │           │
     │ ┌─────────┴─────────┐
     │ │ Yes / Found       │ (next item
     │ │                   │  or exit)
     │ │
     │ └─► Continue or Exit
     │
     └─ No
         │
         ▼
     ┌──────────────────────┐
     │ Global "No"          │
     │ Display Full Table   │
     │ for Intuitive        │
     │ Selection            │
     └──────────────────────┘

PAIRWISE FLOW (if EM selects "Pairwise Categories"):
┌────────────────────────────────────┐
│NEMAR Pair 1:                        │
│"Is it Physical OR Emotional?"       │
└────────┬───────────────────────────┘
         │
    ┌────┴────┐
    │          │
  Yes         No
    │          │
    ▼          ▼
┌─────────┐  ┌────────────────────────┐
│Split    │  │NEMAR Pair 2:           │
│into:    │  │"Is it Energetic OR     │
│"Physical│  │Conscious?"             │
│?"       │  └────────┬───────────────┘
│"Emotional│          │
│?"       │   ┌──────┴──────┐
│         │   │              │
└────┬────┘ Yes            No
     │   │    │              │
     │   │    ▼              ▼
     │   │  ┌──────────┐  ┌────────┐
     │   │  │Split &   │  │None    │
     │   │  │Ask       │  │Found   │
     │   │  │(similar) │  │(Manual │
     │   │  └──────────┘  │input)  │
     │   │                └────────┘
     │   │
     └───┴─► Narrow Down to Category or Item

KEY DECISION POINTS:
• EM chooses discovery mode upfront (or uses default)
• At each NEMAR question, global Yes/No → show full table (intuitive choice)
• Pairwise mode efficiently handles 4 categories in 2-3 questions
• Always show mode skips discovery, displays table immediately
```

---

## User Preference Settings (DEC-014)

**Discovery Mode Options:**

1. **Atomic Discovery (Default)**
   - Category-level NEMAR first: "Is it **Physical**?"
   - Then item-by-item within category
   - Best for: methodical, step-by-step decision-making

2. **Always Show Entire Table**
   - Skip all NEMAR questions, display full table immediately
   - Best for: EM who knows what they want or prefers visual scanning

3. **Always Show Entire Category**
   - Category-level NEMAR, then show full category (skip item-by-item)
   - Best for: faster discovery while maintaining some structure

4. **Pairwise Category Testing**
   - NEMAR groups categories two-by-two
   - More efficient than individual category questions
   - Best for: EM with binary muscle-test preference

**How to Switch Modes:**
- Settings → Discovery Preferences → [Select Mode]
- Can change anytime during session (affects next table interaction)

