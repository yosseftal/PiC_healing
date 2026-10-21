# Wave 10 sub-agent brief — Ticket 10.8

Implement the canonical `issues/08-terminal-nemar-progressive-actions.md` after 10.7 is committed and gated. Read `docs/audits/wave-10-seam-map.md`, `CONTEXT.md`, `decisions.md`, and `CLAUDE.md`.

Read-write: Terminal NEMAR presentation composition, its `pic-web` tests, and Ticket 10.8. Read-only: approved Wave 10 spec, completed primitives and Sheet integration, existing response and Finish actions. Off limits: `pic-engine`, adapters, migrations, persistence, promotion, parser, and other screens.

Frozen requirements: null response shows exactly Yes and No; Yes shows one calm banner, Finish, and Change response; No shows one Integrating banner and Change response. Change response is presentation-only until a new choice is selected. Finish Anyway remains enabled in the Sheet for all responses. The existing response and `SessionEngine.onFinishRequested` seams remain authoritative; no new completion gate.

Test first at the existing Terminal NEMAR and Unified Player seams. Run scoped web typecheck/build/depcruise, deterministic local tests, relevant browser tests, lint, and line length. Commit owned files with `[10.8]`; supply a `## Resolution` addressing every ticket acceptance criterion.
