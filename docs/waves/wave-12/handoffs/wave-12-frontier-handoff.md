# Wave 12 first frontier handoff

**Scope:** W12-01 → W12-02 → W12-03, executed sequentially under the approved Wave 12 specification.

**Date:** 2026-10-14 (Asia/Jerusalem).

**Status:** Authorized frontier complete; W12-01, W12-02, and W12-03 closed.

## Closed tickets

| Ticket | Commit | Evidence |
| --- | --- | --- |
| W12-01 | `018bf52` | [Brand palette Resolution](../tickets/12-01-brand-palette.md) |
| W12-02 | `4fb71c3` | [Explicit terminology Resolution](../tickets/12-02-explicit-terminology.md) |
| W12-03 | This `[W12-03]` commit | [Inquiry reset Resolution](../tickets/12-03-inquiry-session-reset.md) |

W12-01 declares official brand bases and documented accessible derivatives through CSS tokens.
W12-02 resolves explicit Hebrew terminology and literal custom aliases through the existing i18n provider.
W12-03 adds confirmed inquiry reset through web-owned operation tracking, storage cleanup, and draft remounting.

## Verified gates

| Gate | W12-01 | W12-02 | W12-03 |
| --- | --- | --- | --- |
| Scoped web typecheck | Passed | Passed | Passed |
| Scoped web unit tests | 229 passed | 235 passed | 250 passed |
| Full Chromium suite, two workers | 161 passed | 163 passed | 167 passed |
| Web dependency isolation | Zero violations | Zero violations | Zero violations |
| Web lint | Passed | Passed | Passed |
| Independent Standards / Spec review | 0 / 0 findings | 0 / 0 findings | 0 / 0 remaining findings |

W12-02's first browser run passed the 161 inherited cases and failed two new cases because of a test selector typo.
The corrected full rerun passed all 163 cases. No runtime correction was needed after independent review.

W12-03's initial concurrent Vitest/Chromium run hit two unit-test timeouts and two browser journey timeouts.
The browser run was stopped; final gates run sequentially. The separate web rerun passed all 250 tests.
The final separate full Chromium run passed all 167 cases in 6.8 minutes, exit code zero.
Its result was recovered after the implementation agent reached a usage limit; no additional rerun was needed.
No assertion was removed and no timeout/retry policy was widened. Cold fixture imports moved into setup.
Focused keyboard coverage passed four Hebrew/English cases at 320px and 1440px.
Standards found no actionable issue. Spec review found one Gate-scope/cleanup issue, corrected before final gates;
independent re-review confirmed zero remaining findings on both axes.

Root dependency verification uses `npm run depcruise --workspaces --if-present`; there is no root `depcruise` script.
After W12-02 it passed for engine (72 modules, 199 dependencies) and web (747 modules, 1560 dependencies).
The final W12-03 scoped and all-workspace dependency checks passed: web has 751 modules and 1589 dependencies;
engine remains at 72 modules and 199 dependencies, with zero violations in either package.
The historical 442 root unit/integration baseline is preserved as a requirement, not claimed as rerun evidence.

## Seam and deduplication audit

Implementation and tests remain inside `packages/pic-web`; ticket closure records and this handoff are documentation.
No engine, adapter, migration, schema, seed, manifest, or lockfile changes belong to this frontier.

A read-only normalization sweep found the existing shared `normalizeInViewUnit` owner in pic-engine, already consumed
by SessionEngine and both adapters. This frontier adds no competing normalization or port-shaping implementation.
No cross-boundary consolidation was needed or authorized.

No glossary or canonical DEC changes were made. The approved specification records the bounded Email/Password
mechanism choice for later tickets without rewriting DEC-017.

## Frontier completion

W12-03 owns non-Player inquiry reset, pending-write ordering, draft confirmation, and flow-generation invalidation.
Its Resolution addresses every AC. Typecheck, tests, lint, dependency isolation, and both independent reviews are complete.
This handoff and the closed W12-03 record are included in its atomic commit after W12-01 and W12-02.

## Downstream work

W12-04 reuses W12-03's reset lifecycle for Player and Persistence Gate interactions.
Its Gate cleanup must retain the pending Finish kind on storage failure. The public SessionEngine discard action
changes its in-memory pending request before storage completes, so a naive discard-then-clear sequence is insufficient.
W12-03 leaves the existing Gate wrapper behavior in place and refuses gated coordinator requests until W12-04 owns
that integration. The Wave 12 requirement to fix the wrapper spans the approved W12-03/W12-04 ticket boundary.
W12-05 → W12-06 implement login/promotion and recovery; W12-07 and W12-08 then cover registration and restored identity.
W12-09 assembles the full Wave 12 journey and remaining remote/manual gates.
These tickets were not dispatched in this authorized frontier.

The approved `docs/waves/wave-12/specs/wave-12-spec.md` was already untracked at dispatch and is preserved unchanged.
Open ticket files and execution briefs remain under `.scratch/`; the seam map is tracked beside this handoff.
