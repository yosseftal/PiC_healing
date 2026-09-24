# Wave 10 Sub-Agent Brief — Ticket 10.3

## Identity

- **Ticket:** 10.3 — AtomicActionLayout and TherapeuticBanner
- **Wave:** 10 — Frontier 2
- **Escalation:** stop and report; do not guess

## Permissions

- **Read-Write:** New action-layout/banner components, compile-time fixtures, and dedicated tests inside
  `packages/pic-web`; Ticket 10.3 only when available.
- **Read-Only:** Wave 10 specification, Ticket 10.1 visual foundation, current screens, domain docs.
- **Off limits:** `pic-engine`, adapters, migrations, package manifests, lockfile, shared barrel, existing
  product screens/tests, unrelated files.

## Frozen Requirements

Implement Ticket 10.3 from:
`.scratch/wave-10-ui-primitives/issues/03-atomic-action-layout-and-banner.md`.

Use the approved specification at `.scratch/wave-10-ui-primitives.md`, especially Layer 3.3,
TherapeuticBanner, action/banner budgets, focus/state tokens, and recovery language.

## Seam Map

- Inputs are typed action and banner descriptors plus non-interactive primary content.
- Output is a main-frame layout with at most two rendered actions and two banners.
- Limits must be structural and compile-time enforceable.
- No engine state, domain statuses, or screen-specific behavior.

## Conflict Avoidance

- Own action/banner-specific component, type-fixture, and test files only.
- Do not edit the shared `src/index.ts`, visual-foundation files, Vite configuration, or package manifest.
- Do not integrate Terminal NEMAR; Ticket 10.8 owns that work.

## Execution Contract

1. Use strict test-first implementation, including compile-time rejection of a third action/banner.
2. Test accessibility semantics and positive recovery behavior, not private Tailwind class strings.
3. Run scoped `pic-web` typecheck, build, depcruise, owned-file lint/line length, and targeted tests.
4. Use the approved environment exception; do not modify pre-existing root engine/remote gates.
5. Commit only owned files with an English `[10.3]` message.
6. Return a draft `## Resolution` mapping every AC; do not write into the original workspace from an
   isolated worktree.
