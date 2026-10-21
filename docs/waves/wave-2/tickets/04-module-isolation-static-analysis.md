# 04 — Module-isolation static-analysis test (PlayerEngine ⟷ GroupEngine)

**What to build:** a `dependency-cruiser` rule, wired into a run command, that fails the build if
`PlayerEngine`'s module ever imports `GroupEngine` (or vice versa) — in place *before* either engine has
real logic, so it is a guardrail from day one rather than a check bolted on after a violation exists.

**Blocked by:** 02 (`RepositoryPort` interface + domain types).

**Status:** done

**Source:** `docs/specs/tracer-bullet-happy-path.md`, "Seam" section and Testing Decisions.

## Objective

> **Module isolation within the seam:** `PlayerEngine` and `GroupEngine` are separate modules with no
> dependency from `PlayerEngine` onto `GroupEngine` (or vice versa). `PlayerEngine` has zero knowledge of
> symptom ratings, Polarity, or Intensity — it is a pure execution engine whose lifecycle ends strictly at
> `finish()` / `finishAnyway()`. Rating logic lives entirely in `GroupEngine`, triggered only from Symptom
> Group screens, never from the Player.

> **Module isolation is directly tested, not just asserted in prose:** a static-analysis or
> dependency-graph test asserts `PlayerEngine`'s module has zero import edges into `GroupEngine` (and vice
> versa). This is the automated backstop for the "PlayerEngine has zero knowledge of ratings" requirement,
> catching a regression at build time rather than in code review.

## Definition of Done

- `dependency-cruiser` added as a dev dependency of `packages/pic-engine`.
- `packages/pic-engine/.dependency-cruiser.cjs` defines two forbidden rules, one per direction:

```js
module.exports = {
  forbidden: [
    {
      name: 'no-player-into-group',
      severity: 'error',
      from: { path: '^src/player-engine' },
      to: { path: '^src/group-engine' },
    },
    {
      name: 'no-group-into-player',
      severity: 'error',
      from: { path: '^src/group-engine' },
      to: { path: '^src/player-engine' },
    },
  ],
  options: {},
};
```

- Create placeholder directories `packages/pic-engine/src/group-engine/index.ts` and
  `packages/pic-engine/src/player-engine/index.ts`, each genuinely empty (no exports), purely so the rule
  has real paths to evaluate and passes vacuously. Tickets 07 and 08 fill these files in later — do not
  implement any logic in them here.
- Add an `npm run depcruise` script (in `packages/pic-engine/package.json` and wired into the root `npm
  test` or `npm run lint` command) that runs `npx depcruise --validate .dependency-cruiser.cjs src` and
  exits non-zero on any forbidden-rule violation.
- Manually verify the rule actually catches a violation once, while building this ticket: temporarily add
  `import {} from '../group-engine';` inside `player-engine/index.ts`, confirm `npm run depcruise` exits
  non-zero, then revert the import before committing. Do not leave the violating import in the final diff.

## Do Not Touch / Out of Scope

- Do not implement any real `GroupEngine` or `PlayerEngine` logic in the stub files — leave them empty;
  tickets 07 and 08 own their contents.
- Do not add rules restricting any other module pair (e.g. `LibraryEngine`/`TimelineEngine` importing each
  other is explicitly fine and out of scope for this rule).
- Do not add this check to `pic-web`, `pic-adapter-local-guest`, or `pic-adapter-supabase` — it is scoped
  to `pic-engine`'s internal module boundary only.

## Testing Requirement

The acceptance test for this ticket is the tool run itself, not a Vitest `it()` block:

- [x] `npx depcruise --validate .dependency-cruiser.cjs src` exits `0` with both stub files in place.
- [x] The same command, run against a deliberately-reintroduced violating import (verified manually, then
      reverted), exits non-zero — this proof must be described in the PR description since the violating
      state itself must not be committed.
- [x] The check is wired into a command (`npm test` or `npm run lint`) that tickets 07 and 08 cannot bypass
      without their CI run going non-zero.

## Acceptance Criteria

- [x] `.dependency-cruiser.cjs` forbids imports in both directions between `group-engine` and
      `player-engine`.
- [x] Placeholder stub directories exist for both modules, empty of logic.
- [x] `npm run depcruise` runs as part of the standard test/lint command and exits `0` on the stubs.

## Resolution

Landed on `main` with two complementary isolation mechanisms:

**1. dependency-cruiser firewall** (`packages/pic-engine/.dependency-cruiser.cjs`):

- Bidirectional forbidden rules: `no-player-into-group` and `no-group-into-player`.
- `npm run depcruise` in `pic-engine`; root `npm test` and `scripts/ci.sh` stage 2 run depcruise across all
  workspaces.
- `pic-web` has its own `.dependency-cruiser.cjs` guarding the web layer against importing engine internals
  directly (ticket 14).

**2. Module isolation scanner** (`packages/pic-engine/src/test-helpers/isolation-scanner.ts`):

- Lightweight source-scan helper for engine pairs **outside** the player↔group boundary (ticket 04 explicitly
  scoped depcruiser to only that pair).
- Used by `library-engine`, `timeline-engine`, and `session-engine` tests to assert zero import/export-from
  edges into forbidden sibling modules.
- Hardened in Wave 3 audit: strips comments, scans full source for relative module specifiers (handles
  multi-line imports and `export * from` re-exports).

Together these enforce Atomic Focus at the module boundary: `PlayerEngine` is a pure execution engine with
zero knowledge of symptom Polarity, Intensity, or rating logic — that lives exclusively in `GroupEngine`.
