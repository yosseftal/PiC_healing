# PiC Healing - Project Manifesto & Guidelines

## 1. Project Vision
PiC Healing is a knowledge-management platform for therapeutic wisdom, designed to empower users through adaptive inquiry and community growth.

## 2. Core Principles (The Manifesto)

### A. Growth & Mutuality (צמיחה והדדיות)
The system is an active partner in the user's evolution. 
- **The "No-Dead-End" Rule:** If a specific treatment or term is not found in the database, the system **never** returns a simple "Not Found" error. Instead, it must offer three specific pathways:
    1. **Inward Connection:** Guidance to connect internally and document a new personal insight.
    2. **Professional Support:** Referral to verified therapeutic resources.
    3. **Project Contribution:** Encouraging the user to become an active partner by contributing their finding to the community.

### B. Knowledge Expansion (התרחבות הידע)
We don't just display data; we organize and create it.
- Encourage users to document their private information center, turning subjective experiences into structured, accessible knowledge.

### C. Adaptive Inquiry (ניווט מבוסס עומק)
The user experience is dynamic and non-overwhelming.
- The diagnostic flow and information display must match the user's current skill level and immediate needs. 
- Hide advanced complexity from beginners; reveal nuanced therapeutic steps only as the user progresses.

## 3. Technical Standards & Patterns
- **Database:** Supabase (PostgreSQL) with Row Level Security (RLS).
- **Frontend:** React with TypeScript.
- **Tone & Language:** Use positive, constructive, and empowering language in all UI strings and system messages. (Avoid "Cannot", "Failed", "Illegal").
- **Code Style:** Clean, modular, and self-documenting.
- **Git Commits:** Every commit message must be written in simple English, readable for non-programmers.

## 4. OpenSpec Integration
- Follow the Spec-Driven Development (SDD) flow.
- All new features must start with a `proposal.md` in the `/openspec` folder.
- Ensure every technical spec aligns with the "Growth & Mutuality" principle.