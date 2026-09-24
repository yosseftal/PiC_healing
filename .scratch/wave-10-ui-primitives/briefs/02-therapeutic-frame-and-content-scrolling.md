# Wave 10 Sub-Agent Brief — Ticket 10.2

## Identity

- **Ticket:** 10.2 — TherapeuticFrame and Internal Content Scrolling
- **Wave:** 10 — Frontier 2
- **Escalation:** stop and report; do not guess

## Permissions

- **Read-Write:** New frame/content-card components and their dedicated unit/browser tests inside
  `packages/pic-web`; Ticket 10.2 only when available.
- **Read-Only:** Wave 10 specification, Ticket 10.1 visual foundation, current screens, domain docs.
- **Off limits:** `pic-engine`, adapters, migrations, package manifests, lockfile, shared barrel, existing
  product screens/tests, unrelated files.

## Frozen Requirements

Implement Ticket 10.2 from:
`.scratch/wave-10-ui-primitives/issues/02-therapeutic-frame-and-content-scrolling.md`.

Use the approved specification at `.scratch/wave-10-ui-primitives.md`, especially Layer 3.1 and
Interaction Rule 5.1. Preserve the exact viewport, internal-scroll, accessibility, safe-area, logical
direction, wide-table, and zoom contracts.

## Seam Map

- Inputs are presentation slots and accessible labels only.
- Outputs are rendered viewport, header, stage, and bounded content regions.
- No engine, repository, router, or screen knowledge.
- Use existing Wave 10 tokens and Tailwind foundation without editing that foundation.

## Conflict Avoidance

- Own frame-specific component and test files only.
- Do not edit the shared `src/index.ts`, visual-foundation files, Vite configuration, or package manifest.
- Put browser coverage in a ticket-specific test file.

## Execution Contract

1. Use strict test-first implementation at the primitive seam.
2. Add real-browser proof for document lock and internal content scrolling.
3. Run scoped `pic-web` typecheck, build, depcruise, owned-file lint/line length, targeted Vitest, and
   ticket browser tests.
4. Use the Event-Manager-approved environment exception: do not fix or claim green for pre-existing root
   engine/remote gates.
5. Commit only owned files with an English `[10.2]` message.
6. Return a draft `## Resolution` mapping every AC; do not write into the original workspace from an
   isolated worktree.
