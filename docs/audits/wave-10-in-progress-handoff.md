# Wave 10 In-Progress Handoff

**Paused:** 2026-09-24
**Branch:** `main`
**Last Wave 10 implementation commit:** `4d9ee50`
**Approved specification:** `.scratch/wave-10-ui-primitives.md`
**Canonical tickets:** `.scratch/wave-10-ui-primitives/issues/`

## Pause State

Wave 10 is intentionally paused after Frontier 2. No implementation agent is active. Ticket 10.6 was
prepared but not dispatched and is `ready-for-agent`.

The Event Manager explicitly approved tracking the normally ignored Wave 10 scratch artifacts so the
specification, canonical ticket state, and prepared briefs survive a git push and can be resumed from
another computer.

## Completed Tickets

- **10.1 — Web Visual Foundation and Design Tokens:** `6b1163e`
- **10.2 — TherapeuticFrame and Internal Content Scrolling:** `bbd66fc`
- **10.3 — AtomicActionLayout and TherapeuticBanner:** `4ca2503`
- **10.4 — Directional HorizontalSlideContainer:** `4d9ee50`
- **10.5 — Accessible Therapeutic Utility Sheet:** `5e76f5b`

Every completed canonical ticket contains a `## Resolution` mapping its acceptance criteria.

## Current Gates

The post-Frontier-2 scoped gate is green:

- Deterministic local Vitest suite: **281 passed, 9 skipped**, 35 test files.
- Playwright Chromium suite: **11 passed**.
- `pic-web` typecheck: passed.
- `pic-web` production build: passed.
- `pic-web` dependency-cruiser: zero violations.
- Frontier 2 owned-file ESLint and line-length checks: passed.
- IDE diagnostics on integrated primitive files: none.

Known non-blocking build warnings remain:

- Existing ineffective dynamic-import warning for `guest-flow-facts.ts`.
- Main JavaScript bundle remains above Vite's 500 kB warning threshold.

## Approved Environment Exception

The ordinary root typecheck reports pre-existing nullability errors in unchanged `pic-engine` tests on
this machine. Remote Supabase tests are also environment-dependent through `.env.local`.

The Event Manager directed Wave 10 to:

- leave `pic-engine`, adapters, remote tests, and credentials unchanged;
- use deterministic local tests and scoped `pic-web` gates;
- document the exception without claiming the ordinary root gate passed.

The primary development environment is expected to retain its existing green root gate.

## Remaining Dependency Chain

1. **10.6 — Unified Player Atomic Guidance Frame**
   - Status: `ready-for-agent`
   - Blockers 10.2 and 10.4 are done.
   - Prepared brief:
     `.scratch/wave-10-ui-primitives/briefs/06-unified-player-atomic-guidance-frame.md`
2. **10.7 — Sovereign Player Utility Drawer**
   - Blocked by 10.5 and 10.6.
3. **10.8 — Terminal NEMAR Progressive Action Pattern**
   - Blocked by 10.3 and 10.7.
4. **10.9 — Responsive Hardening and Wave Closure**
   - Blocked by 10.8.

## Resume Procedure

1. Pull `main` on the new computer.
2. Confirm the forced-tracked `.scratch/wave-10-ui-primitives*` files are present.
3. Read the approved specification, Ticket 10.6, and its prepared brief.
4. Confirm `git status` is clean.
5. Run the deterministic local and scoped `pic-web` gates.
6. Dispatch Ticket 10.6 in a fresh isolated worktree using the prepared brief.
7. Integrate one ticket commit at a time and rerun scoped gates before advancing the frontier.

## Boundary Reminder

- Runtime and styling changes belong only in `packages/pic-web`.
- Root `package-lock.json` is the sole source/config exception for dependencies.
- `pic-engine`, adapters, migrations, and core tests remain off limits.
- Navigation Tree and Finish Anyway move to the Sheet only in Ticket 10.7.
- Terminal NEMAR progressive actions belong only to Ticket 10.8.

## Existing Non-Wave-10 Work

Pre-existing agent configuration and audit documentation were reviewed at pause time and committed
separately from Wave 10. Their history remains distinguishable from the UI implementation commits.
