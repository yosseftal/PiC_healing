# Wave 10 Sub-Agent Brief — Ticket 10.4

## Identity

- **Ticket:** 10.4 — Directional HorizontalSlideContainer
- **Wave:** 10 — Frontier 2
- **Escalation:** stop and report; do not guess

## Permissions

- **Read-Write:** New horizontal-slide component and dedicated tests inside `packages/pic-web`; Ticket
  10.4 only when available.
- **Read-Only:** Wave 10 specification, Ticket 10.1 Motion tokens, current screens, domain docs.
- **Off limits:** `pic-engine`, adapters, migrations, package manifests, lockfile, shared barrel, existing
  product screens/tests, unrelated files.

## Frozen Requirements

Implement Ticket 10.4 from:
`.scratch/wave-10-ui-primitives/issues/04-horizontal-slide-container.md`.

Use the approved specification at `.scratch/wave-10-ui-primitives.md`, especially Layer 3.2 and
Interaction Rules 5.2, 5.4, 5.5, and 5.6. Motion represents reflected navigation but never performs it.

## Seam Map

- Inputs are controlled active key, ordered keys or direction, one active child, and focus metadata.
- Output is presence-aware directional presentation using existing typed Motion tokens.
- Previous visual key may be local presentation state only.
- No gestures, domain navigation, Player actions, or repository knowledge.

## Conflict Avoidance

- Own slide-specific component and test files only.
- Do not edit the shared `src/index.ts`, visual-foundation files, Vite configuration, or package manifest.
- Do not integrate the router or Unified Player; Ticket 10.6 owns Player integration.

## Execution Contract

1. Use strict test-first implementation for forward, backward, neutral, focus, accessibility, and reduced
   motion.
2. Test observable transition contracts without coupling to private Motion internals.
3. Run scoped `pic-web` typecheck, build, depcruise, owned-file lint/line length, and targeted tests.
4. Use the approved environment exception; do not modify pre-existing root engine/remote gates.
5. Commit only owned files with an English `[10.4]` message.
6. Return a draft `## Resolution` mapping every AC; do not write into the original workspace from an
   isolated worktree.
