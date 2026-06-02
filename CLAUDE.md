# PiC Healing - Project Manifesto & Guidelines V2

This document operationalizes the manifesto for product, UX, and implementation decisions.

## 1. Project Vision
PiC (Personal Information Center) is a knowledge-management platform for self-healing.
It empowers users to access their body's "internal database" through a structured methodology,
turning subjective experiences into actionable wisdom.

## 2. Core Pillars (Implementation Logic)

### A. The "Empty Vessel" & Absolute Ownership
- Start every session with a Brain Dump ("Empty Vessel") to clear cognitive load and allow new insights.
- The user is the architect: they manually split raw input into Symptom Fragments and assign them to groups.
- Require a Joint Treatment Test (muscle test) to decide whether symptoms stay together or split
  into separate Symptom Buckets for Atomic Focus.

### B. The Gateway & Methodology Access
- Core method education (self-muscle-testing videos/text) must remain freely accessible.
- Freemium rule: diagnostic tables and logic are open; persistent memory, tracking,
  and Reflective Journal require subscription.

### C. Systematic Inquiry Flow (NEMAR)
- Begin with a Safety Check for Self-Sabotage blockers.
- Left Path (Root Cause): ask whether it is NEMAR (Right/Accurate/Desirable) to diagnose
  a cause; if yes, classify Physical/Emotional/Energetic/Conscious and map in Causes Table.
- Right Path (Treatment): identify the most precise intervention from Treatments Table.
- Define execution instructions: technique, provider, duration, frequency, and recurrence.

### D. Dynamic Assessment & Blind Ratings
- Allow symptom refinement at the start of any session.
- Require blind re-rating (1-10) at each new session.
- Hide previous rating during input to reduce bias, unless the user explicitly requests override.

### E. Post-Treatment: Integration & Growth
- End each session with Reflective Journaling prompts for insights and personal tasks.
- Do not use failure framing when treatment is incomplete; use Integrating/In Progress states.
- Integration reasons may include repetition, pending user commitments, or natural body permeation time.

## 3. Technical Standards
- Stack: React, Supabase, TypeScript.
- UI/UX: "One screen, one action" (Atomic Focus).
- Tone: strictly positive and empowering language in UI/system copy.
- Git: human-readable English commit messages.

## 4. OpenSpec Alignment
- Use Spec-Driven Development workflow for new features.
- Ensure proposals, specs, and tasks reflect the five pillars above.
- Preserve positive, non-blocking language and avoid dead-end UX flows.

## Agent skills

### Issue tracker

GitHub Issues on `yosseftal/PiC_healing` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles use default label names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.