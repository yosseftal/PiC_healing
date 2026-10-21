# Wave 10 remediation handoff

**Date:** 2026-10-06
**Status:** done; all requested gates verified green before scoped commits.
**Approved baseline:** `22d48ca`.

The Event Manager approved the Wave 10 audit and explicitly authorized UI affordance fixes,
root lint and test typing repairs, and removal of test skips and TLS overrides.
This approval extends the earlier web-only boundary to test files and root tooling.
Runtime engines and repository interfaces remain unchanged. Restored remote coverage exposed a real
promotion timestamp loss: the adapter omitted `rated_at`, and the RPC omitted its persisted column.
The correction adds that payload field and one additive RPC migration. The Event Manager confirmed
manual SQL Editor application; real rated-snapshot and changed-timestamp replay checks pass.

## Ticket chain

- 10.R1: Shared control affordance, labelled recovery utilities, drawer motion, headings, and card focus.
- 10.R2: Root lint configuration, unused bindings, and two session-engine test nullability guards.
- 10.R3: Six contract guards, adapter capability tests, real fixtures, verified TLS, and rating timestamp repair.

Canonical tickets and implementation briefs are under `docs/specs/tickets/10.R*.md`.

## Verification

| Gate | Result |
| --- | --- |
| Full root `npm test` | 343 passed, zero skipped, 37 files; normal TLS; dependency checks passed |
| Root `npm run typecheck` | All four workspaces passed, including `pic-web` |
| Scoped `pic-web` typecheck | Passed |
| Root `npm run lint` | Passed, no rule suppression |
| Full Chromium suite | 21 passed with the standard Playwright command |
| `pic-web` production build | Passed; existing bundle/dynamic-import warnings |
| Changed source/test line lengths | All 38 paths passed the 130-character check |

The final root tests were rerun after the legacy receipt correction. Final root static gates and build
also passed. The full Chromium suite passed after the animation-observation race was corrected,
using its unchanged four-worker default. Source scans found no TLS override, skip, only, or todo registrations.

Initial real rated-snapshot coverage failed when both input rating timestamps returned as `null`.
Unrated fixture substitution was rejected because it would hide the bug. The additive migration
`20261006185500_promote_guest_to_account_rated_at.sql` preserves timestamps in the existing transaction.
Remote teardown now checks every deletion response and respects FK ordering. Recovery removed only
this run's verified 32 treatment fixtures and 12 test owners; later complete teardown passed.

## Seam and deduplication review

Presentation utilities call the existing context actions. Engine snapshots retain authority over navigation,
Terminal NEMAR responses, and Finish eligibility. Empty guidance retains the Zero-H3 guard.
Shared control styling has one owner in `packages/pic-web/src/control-affordance.ts`.
Persistence normalization remains owned by `packages/pic-engine/src/normalize-in-view-unit.ts`;
SessionEngine and both storage adapters reuse its exported helpers. No normalization was duplicated.
No glossary or DEC additions are required.

## Standards review

No hard documented-standard breaches. Context actions, engine-owned state, Blind-by-Default ratings,
Zero-H3 protection, checked FK teardown, and strict non-null timestamp fingerprints remain intact.
One optional judgement call remains: the ordered test-owner cleanup loop is repeated in three remote
test files. A future shared test-support helper could reduce ordering drift; current behavior is correct.

## Spec review

Two initial presentation findings were resolved: RTL safe-area inset mapping and disabled-control contrast.
The reviewed implementation meets the approved remediation requirements. Legacy unrated receipt replay
has an independent real Supabase regression; legacy rated receipt divergence remains documented.
An animation regression timing race was corrected by observing animationstart before the action;
no retries, worker changes, filtered final suite, or weakened animation assertions were introduced.

## Carry-forward

- Legacy repository documentation line lengths remain outside the approved remediation scope.
- Optional test-support cleanup deduplication; normalization and port shaping remain shared already.
- Physical device cutouts and true desktop browser zoom require device/manual verification.
- Legacy rated promotion receipts may reject retries after the payload gains a timestamp never transmitted
  before; fingerprints remain strict, and no historic receipt or rating timestamp was rewritten.
  Legacy unrated receipts retain their original wire shape and are covered by a real no-duplication replay test.
- Existing Event Manager changes to skill files, `CLAUDE.md`, and `package-lock.json` are preserved separately.
