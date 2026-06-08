# PiC Healing - Project Manifesto & Guidelines V2

This document operationalizes the manifesto for product, UX, and implementation decisions.
Canonical domain terms: `CONTEXT.md`. Agreed architecture: `decisions.md` (DEC-001, DEC-002).

## 1. Project Vision
PiC (Personal Information Center) is a knowledge-management platform for self-healing.
It empowers users to access their body's "internal database" through a structured methodology,
turning subjective experiences into actionable wisdom.

## 2. Core Pillars (Implementation Logic)

### A. Symptom Groups, Empty Vessel & Ownership
- **Symptom Group** (קבוצת סימפטומים / מכלי הסימפטומים / הקשר) = **Work Session**
  (סשן עבודה): persistent log per group—history, documentation on any object in the
  group, ratings, Integrating treatments.
- **Formation:** List symptoms → **joint treatment muscle test** → one group if
  treated together; separate groups only when the test says split.
- **Symptoms** live inside a group (e.g. lower back + neck in one group).
- **Empty Vessel** (הכלי הריק): optional free writing—symptom surfacing when building
  groups *or* spontaneous session notes (mood today, insights about the group).
  Recommended, not mandatory every visit.
- The Event Manager assigns and refines symptoms; the app organizes and retrieves.

### B. The Gateway & Methodology Access
- Core method education (self-muscle-testing videos/text) must remain freely accessible.
- Freemium rule: diagnostic tables and logic are open; persistent memory, tracking,
  and Reflective Journal require subscription.

### C. Inquiry Sessions & NEMAR Flow
- **Inquiry Session** (סשן): one sitting on **one chosen Symptom Group**. User may
  **switch groups** and **start a new session anytime**.
- **Steps** (flexible order; user may **start at any step**): Empty Vessel → Safety
  Check (Self-Sabotage) → NEMAR inquiry → treatment player → Reflective Journal.
- **Recommended order:** same as above. NEMAR path: Left (root cause in Causes Table)
  / Right (treatment in Treatments Table) → execution instructions.
- **Atomic Focus during a session:** one group, one muscle-test question at a time,
  small Player steps—not locked across visits.

### D. Dynamic Assessment & Blind Ratings
- Allow symptom refinement at the start of any Inquiry Session.
- Require blind re-rating (1-10) at each new Inquiry Session on that group.
- Hide previous rating during input to reduce bias, unless the user explicitly requests override.

### E. Post-Treatment: Integration & Growth
- Offer Reflective Journaling after a session (any step order); not only at end of linear wizard.
- Do not use failure framing when treatment is incomplete; use Integrating/In Progress states.
- Integration reasons may include repetition, pending user commitments, or natural body permeation time.

## 3. Technical Standards
- **Line length:** no line may exceed 130 characters (enforced on staged files via
  `scripts/check-max-line-length.py`; enable with
  `git config core.hooksPath .githooks`).
- Stack: React, Supabase, TypeScript.
- UI/UX: Atomic Focus—one screen, one action; one Symptom Group per Inquiry Session visit.
- Tone: strictly positive and empowering language in UI/system copy.
- Git: human-readable English commit messages.
- Persistence root for healing work: `symptom_groups` (or equivalent)—not separate
  “context” / “bucket” tables unless aliased to Symptom Group.

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
