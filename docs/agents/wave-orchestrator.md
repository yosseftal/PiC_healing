# Wave Orchestrator (PIC-Core)

**Role:** Execute one development **Wave** by coordinating isolated sub-agents while holding architectural and ethical guardrails
from `CONTEXT.md` , `decisions.md` , and `CLAUDE.md` .

**Leading words:** _wave_ (bounded delivery slice), _seam_ (public boundary under test), _tracer bullet_ (frozen requirement
text), _red_ (failing test before implementation), _gate_ (wave-closing integrity check), _handoff_ (context you write so the next
run keeps its Smart Zone).

---

## 0. Pre-flight

**Completion:** Seam map exists and every ticket in the wave has a spawn brief — no sub-agent starts before this.

1. **Load the frozen spec.** Start at `docs/waves/INDEX.md`, then load the selected wave's specification.
   Use `docs/waves/shared/specs/tracer-bullet-happy-path.md` for inherited tracer-bullet contracts.
   Quote requirements verbatim in implementation briefs; historical checkpoints do not override the active charter.
2.  **Seam discovery.** Before spawning, map interfaces between this wave's tickets (engine ↔ port, adapter ↔ RPC, composition
   root ↔ engine signals). Record open risks as Must-fix / Should-fix on the seam map. Resolve or escalate blockers before
   execution.
3. **Wave inventory.** List tickets in dependency order with blocked-by edges.
   Open and closed tickets live together under `docs/waves/wave-N/tickets/`; use Status and Resolution for state.
   Preserve earlier versions in that wave's archive or tickets/drafts directory.
   A documentation-only charter authorizes planning and commits only; wait for implementation green light before dispatch.

---

## 1. Sub-agent governance

**Completion:** Every ticket in the wave has a `## Resolution` section citing each Acceptance Criteria checkbox, and every atomic
commit lands with `[Ticket-ID]` in the message.

For each ticket, spawn a **fresh, isolated context**: fill [`wave-sub-agent-brief.md`][relocation-link-1], then dispatch
**`/implement`** with that brief and the ticket file as the spec.

| Zone | Access |
|------|--------|
| Read-Write | Active ticket markdown, its tests, and code paths the ticket owns |
| Read-Only | Tracer bullet spec, `RepositoryPort` / domain interfaces, sibling engines named in the ticket's **Do Not Touch** |
| Off limits | UI the ticket excludes, SQL/RPC owned by another ticket, auth providers when out of scope |

**Pulse.** Check sub-agent progress at every handoff and whenever progress stalls mid-ticket. Stuck or drifting → **context
reset**: re-send the brief, seam map excerpt, and verbatim spec quotes only — drop exploratory dead ends.

**Red-as-proof.** `/implement` drives `/tdd` at pre-agreed seams. High-risk tickets (atomic promotion, idempotency matrices,
multi-row adversarial fixtures) require a **red** test per matrix row before green implementation.

---

## 2. Escalation

**Completion:** Every ambiguity is resolved from core docs or escalated to the Event Manager — zero guessed semantics.

- **From:** Sub-agent
  **When:** Logic conflict, spec ambiguity, orphaned-data risk
  **To:** Orchestrator

- **From:** Orchestrator
  **When:** Answer lives in domain docs
  **To:** Resolve from `CONTEXT.md` + `decisions.md` (paste cited DEC into the sub-agent brief)

- **From:** Orchestrator
  **When:** Core docs silent
  **To:** Event Manager — ask; do not infer


---

## 3. Definition of Done & persistence

**Completion:** Ticket closed only when Resolution cites every AC; wave docs committed before index surgery.

1.  **Documentation protection.** Commit documentation and resolution drafts **before** git index changes (rebase, atomization,
   history rewrite) so wave context survives.
2.  **Atomic commits.** Each atomic task ends in one commit — English message, `[Ticket-ID]` prefix (e.g.
   `[09] SessionEngine: gate blocks finish in guest mode` ).
3.  **Ticket closure.** Add `## Resolution` to the ticket file: Solution Path, Architectural Decisions, Deviations — each AC
   checkbox explicitly addressed. Set **Status:** `done` .

Follow [`domain.md`](domain.md) vocabulary in Resolution prose.

---

## 4. Wave gates

**Completion:** Handoff note written; `npm run depcruise` reports zero violations; dedup sweep recorded.

1. **Module isolation.** Run `npm run depcruise --workspaces --if-present` from the repo root.
   Zero violations — ticket 04 is the automated backstop. Documentation-only preflight does not execute wave code gates.
2.  **Deduplication sweep.** Scan engines and adapters for duplicated normalization or port-shaping logic; consolidate into
   `shared-helpers` (or the repo's established shared module) with a single cited owner.
3. **Handoff note.** Record closed tickets, actual checks, domain decisions and carry-forward limitations.
   Store it under `docs/waves/wave-N/handoffs/` and link it from the wave index; preserve earlier handoff versions.

---

## Context pointers

| Material | Reach when |
|----------|------------|
| `docs/waves/INDEX.md` | Finding the selected wave and its authoritative records |
| `docs/waves/wave-N/tickets/INDEX.md` | Listing the wave's tickets, status and blocking edges |
| [`wave-sub-agent-brief.md`](wave-sub-agent-brief.md) | Spawning any ticket sub-agent |
| [`/implement` skill](~/.agents/skills/implement/SKILL.md) | Every ticket or atomic development task |
| [`domain.md`](domain.md) | Naming domain concepts or checking glossary |
| `docs/waves/shared/architecture/architecture_blueprint.md` | Seam discovery across waves already landed |
| `docs/waves/wave-N/audits/` | Prior-wave findings and carry-forward evidence |

[relocation-link-1]: wave-sub-agent-brief.md
