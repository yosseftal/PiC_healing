# Wave Sub-Agent Brief (template)

Orchestrator fills this template per ticket spawn. Sub-agent treats it as the full Smart Zone boundary.

---

## Identity

- **Ticket:** `{NN}` — `{title from ticket H1}`
- **Wave:** `{wave id or range}`
- **Orchestrator escalation channel:** stop and report — do not guess

## Permissions

| Zone | Paths |
|------|-------|
| Read-Write | `{ticket .md}`, `{owned src + test globs}` |
| Read-Only | `docs/docs/specs/tracer-bullet-happy-path.md`, `{interfaces}`, `{sibling engines listed in Do Not Touch}` |
| Off limits | `{verbatim from ticket Do Not Touch / Out of Scope}` |

## Frozen requirements (verbatim)

Paste the ticket's **Context Injection** block or the orchestrator's quoted tracer-bullet excerpt here. Implement exactly this text — no reinterpretation.

## Glossary injection

Paste only the `decisions.md` entries (DEC-xxx) the ticket cites plus any CONTEXT.md terms the sub-agent must not rename.

## Seam map excerpt

| Seam | This ticket owns | Upstream | Downstream | Risk |
|------|------------------|----------|------------|------|
| `{name}` | `{yes/no}` | `{ticket or module}` | `{ticket or module}` | `{Must-fix / Should-fix / clear}` |

## Execution contract

Run **`/implement`** on this brief and the ticket file. The implement skill owns `/tdd`, typecheck, and `/code-review`.

1. Matrix tickets: one **red** test per adversarial row before shared implementation.
2. Match existing module conventions — read surrounding code first.
3. Escalate on logic conflict, spec hole, or write that would orphan data.
4. End with: passing tests, `[Ticket-ID]` commit(s), draft `## Resolution` mapping every AC checkbox.

## Acceptance Criteria (checklist)

Copy unchecked AC items from the ticket file here. Sub-agent checks them off in Resolution, not in this brief.
