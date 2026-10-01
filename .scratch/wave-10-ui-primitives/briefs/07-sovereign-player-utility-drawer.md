# Wave 10 sub-agent brief — Ticket 10.7

Implement the canonical `issues/07-sovereign-player-utility-drawer.md` after 10.6 is committed and gated. Read `docs/audits/wave-10-seam-map.md`, `CONTEXT.md`, `decisions.md`, and `CLAUDE.md`.

Read-write: Player presentation composition, Navigation Tree/Finish controls, their `pic-web` tests, and Ticket 10.7. Read-only: approved Wave 10 spec, completed primitives, Player and Session action interfaces. Off limits: `pic-engine`, adapters, migrations, parser, persistence, Terminal NEMAR progressive action pattern, and unrelated screens.

Frozen requirements: Navigation Tree and Finish Anyway live in the header-triggered Sheet; existing `jumpTo` and `SessionEngine.onFinishRequested` remain authoritative. Close the Sheet after successful reflected navigation; keep it open with nearby positive recovery after rejection. Sheet open/close preserves the unit and card scroll position. Finish Anyway stays enabled for null, Yes, and No responses.

Test first at `UnifiedPlayerScreen` and the existing Player utility seam. Run scoped web typecheck/build/depcruise, deterministic local tests, relevant browser tests, lint, and line length. Commit owned files with `[10.7]`; supply a `## Resolution` addressing every ticket acceptance criterion.
