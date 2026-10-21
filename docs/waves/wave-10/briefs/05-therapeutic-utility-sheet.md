# Wave 10 Sub-Agent Brief — Ticket 10.5

## Identity

- **Ticket:** 10.5 — Accessible Therapeutic Utility Sheet
- **Wave:** 10 — Frontier 2
- **Escalation:** stop and report; do not guess

## Permissions

- **Read-Write:** New local shadcn/Radix Sheet wrapper and dedicated unit/browser tests inside
  `packages/pic-web`; Ticket 10.5 only when available.
- **Read-Only:** Wave 10 specification, Ticket 10.1 dependencies/tokens, current screens, domain docs.
- **Off limits:** `pic-engine`, adapters, migrations, package manifests, lockfile, shared barrel, existing
  product screens/tests, unrelated files.

## Frozen Requirements

Implement Ticket 10.5 from:
`.scratch/wave-10-ui-primitives/issues/05-therapeutic-utility-sheet.md`.

Use the approved specification at `.scratch/wave-10-ui-primitives.md`, especially Layer 3.4 and the
Sheet-related viewport, action-budget, focus, direction, and motion rules.

## Seam Map

- Inputs are trigger, title, description, utility content, open state, and callbacks.
- Output is one accessible modal Sheet with internal scrolling and logical inline-end placement.
- Radix owns Dialog semantics; local UI owns calm styling and constrained API.
- No Navigation Tree, Finish, engine, repository, or app-navigation knowledge.

## Conflict Avoidance

- Own Sheet-specific component and test files only.
- Do not edit the shared `src/index.ts`, visual-foundation files, Vite configuration, or package manifest.
- Put browser coverage in a ticket-specific test file.
- Do not integrate Player utilities; Ticket 10.7 owns that work.

## Execution Contract

1. Use strict test-first implementation for focus trap/restoration, dismissal, inert background, internal
   scrolling, responsive width, and RTL placement.
2. Use the already-installed minimal dependencies; add no package.
3. Run scoped `pic-web` typecheck, build, depcruise, owned-file lint/line length, targeted Vitest, and
   ticket browser tests.
4. Use the approved environment exception; do not modify pre-existing root engine/remote gates.
5. Commit only owned files with an English `[10.5]` message.
6. Return a draft `## Resolution` mapping every AC; do not write into the original workspace from an
   isolated worktree.
