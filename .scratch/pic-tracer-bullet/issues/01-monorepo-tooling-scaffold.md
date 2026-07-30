# 01 — Monorepo & tooling scaffold

**What to build:** the empty workspace skeleton (packages, TypeScript config, test runner, lint) that every
other tracer-bullet ticket builds on top of, with zero business logic.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md` (whole spec — "no application code exists yet" per the
Seam section), `CLAUDE.md` §3 Technical Standards (line-length hook, React/Supabase/TypeScript stack).

## Objective

This repo is greenfield: only `supabase/migrations/20260308164004_initial_schema.sql` and the decision
record exist. Every later ticket assumes a working workspace layout, TypeScript config, and test runner
already exist. This ticket is pure prefactoring — "make the change easy, then make the easy change" — so no
later ticket has to invent build tooling from scratch.

## Definition of Done

- Root `package.json` declares npm (or pnpm — pick one and use it consistently) workspaces covering
  `packages/*`.
- Four package directories exist, each with its own `package.json` and a `tsconfig.json` that extends a
  shared root `tsconfig.base.json` with `"strict": true`:
  - `packages/pic-engine`
  - `packages/pic-adapter-local-guest`
  - `packages/pic-adapter-supabase`
  - `packages/pic-web`
- **Vitest** is installed and configured (root `vitest.config.ts`, or one per package referenced from a
  root workspace config) such that `npm test` runs across all packages and exits `0` with zero test files
  present.
- ESLint is configured with a TypeScript parser at the root; `npm run lint` exits `0` on the empty scaffold.
- Each package has a placeholder `src/index.ts`. Leave it genuinely empty (no exports, no narrating
  comment) — the point is an importable, compilable, empty module.
- `npx tsc --noEmit` (run per-package or via a root script) passes for all four packages.

## Do Not Touch / Out of Scope

- Do not define `RepositoryPort`, domain types, or any engine logic — ticket 02.
- Do not add the Supabase client dependency yet — tickets 11/12/13.
- Do not add React/Vite wiring beyond an empty `pic-web` package skeleton — ticket 14 builds the app shell.
- Do not write any SQL migrations.
- Do not add `dependency-cruiser` config yet — that is ticket 04's job specifically (it needs real
  `group-engine`/`player-engine` stub directories to point at, which don't exist until ticket 02/04).

## Testing Requirement

There is no business logic yet, so there are no `it()` blocks for this ticket. The acceptance test is
purely tooling-level:

- [ ] `npm test` (or `npm run test --workspaces`) exits `0` with "0 tests" reported.
- [ ] `npm run lint` exits `0`.
- [ ] `npx tsc --noEmit` exits `0` for every package.

## Acceptance Criteria

- [ ] Root workspace config lists all four packages.
- [ ] Each package has `package.json` + `tsconfig.json` extending the shared strict base config.
- [ ] Vitest, ESLint, and TypeScript all run cleanly with zero errors on the empty scaffold.
- [ ] No file in the scaffold contains any business logic, type definition, or SQL.
