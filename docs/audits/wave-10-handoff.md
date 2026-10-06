# Wave 10 Handoff — Therapeutic Unified Player

**Date:** 2026-10-02

The approved 2026-10-06 remediation supersedes this historical gate baseline and carry-forward items
where explicitly resolved. See [Wave 10 remediation handoff](wave-10-remediation-handoff.md).

**Approved specification:** `.scratch/wave-10-ui-primitives.md`

**Canonical tickets:** `.scratch/wave-10-ui-primitives/issues/`

## Closed ticket chain

| Ticket | Delivered seam |
| --- | --- |
| 10.1 | Web-only Tailwind v4, design tokens, and viewport normalization |
| 10.2 | `TherapeuticFrame` and internally scrolling content/table regions |
| 10.3 | Two-action `AtomicActionLayout` and restrained banners |
| 10.4 | Reflected-key horizontal slide with direction and reduced-motion support |
| 10.5 | Accessible `TherapeuticSheet` with logical placement and focus behavior |
| 10.6 | Unified Player frame, active unit card, and reflected slide composition |
| 10.7 | Navigation Tree and Finish Anyway in the Player utility Sheet |
| 10.8 | Terminal NEMAR Yes/No, Integrating, Finish, and response-revision pattern |
| 10.9 | Composed Player browser matrix and reliable Playwright server lifecycle |

All nine canonical tickets record `Status: done` and a `## Resolution`. Ticket 10.9's repository-wide
gate criterion remains unchecked because existing unrelated root gates fail. It is closed under the
Event Manager-approved scoped-gate exception, recorded in its Resolution. The completed Wave 10
presentation scope is the Unified Player. Other Guest Mode screens were not migrated.

## Verified gates

| Gate | Ticket 10.9 result |
| --- | --- |
| `npm run typecheck --workspace pic-web` | Passed |
| `npm run build --workspace pic-web` | Passed; existing bundle and dynamic-import warnings |
| `npm run depcruise --workspaces --if-present` | Passed; zero violations in engine and web |
| Deterministic local Vitest | 291 passed, 9 skipped, 33 files |
| Primary-checkout `npm test` with remote Supabase access | 329 passed, 16 skipped, 37 files; zero dependency violations |
| `npm run test:browser --workspace pic-web -- --workers=1 --global-timeout=120000` | 16 passed, exit 0 |
| Owned-file ESLint, 130-character line check, `git diff --check` | Passed |

The browser matrix covers compact phone (320 × 568), modern phone (390 × 844), tablet (768 × 1024),
desktop (1440 × 900), a half-size CSS viewport, 200 percent CDP page scale, keyboard focus, reduced
motion, and RTL. Composed Player tests verify document lock, internal guidance/table/Sheet scrolling,
safe-area fallback padding, action budgets, and sovereign access to Navigation Tree and Finish Anyway.
Desktop Chromium cannot reproduce a physical device cutout; the frame's `env(safe-area-inset-*)`
rules remain the implementation for that hardware case.

## Seam status

All Wave 10 runtime, styling, and browser-test changes are in `packages/pic-web`. `pic-engine`,
adapters, migrations, parsing, content, persistence, and domain semantics were untouched. The
Player reflects session units and Terminal NEMAR response from existing engine actions. Sheet
navigation still calls `jumpTo`; Finish and Finish Anyway still call
`SessionEngine.onFinishRequested`.

The prior Playwright `webServer` command passed assertions but hung on Windows plugin teardown and
left Vite listening. Programmatic Vite setup owns a strict-port server in the Playwright process
and closes it on teardown. A clean-port focused test and the full 16-test suite both exit 0.

## Repository-wide verification exceptions

- Root `npm run typecheck` fails on eight unique pre-existing nullability errors in unchanged
  `pic-engine` tests: six in `repository-port.contract.ts` and two in `session-engine.test.ts`.
  Contract errors also repeat in adapter workspace output. Scoped web typecheck passes.
- Root `npm run lint -- --quiet` reports 25 pre-existing errors in unrelated web tests,
  `promote-path.ts`, and `scripts/supabase-connectivity-check.mjs`. Owned-file ESLint passes.
- The isolated worktree lacked ignored `.env.local`, so it ran deterministic local Vitest. After
  integration, the primary checkout ran `npm test` with remote Supabase access: 329 passed, 16
  skipped, and zero engine or web dependency violations.

## Should-fix carry-forward

1. Repair the root typecheck errors and lint baseline in separately scoped tickets, then restore
   the root gates to green. Do not mix those edits into a web presentation ticket.
2. Resolve the completed-unit revisit behavior noted in Ticket 10.6 through a domain decision:
   the current engine does not reflect a completed unit as active after a backward jump.
3. Verify actual safe-area insets on a device with a cutout. Desktop Chromium covers the padding
   fallback and viewport geometry but cannot emulate the hardware inset faithfully.
4. Revisit the existing Vite bundle-size and ineffective dynamic-import warnings during a future
   performance pass; they do not block this proof of concept.
