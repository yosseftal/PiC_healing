# W13-02 manual schema-application checkpoint

Date: 2026-10-25, Asia/Jerusalem. This is an open-ticket checkpoint, not Wave 13 closure.
Implementation commit: `5439a4f` — reviewed runtime, additive SQL and red database contracts.

## Completed frontier

W13-01 and W13-06 are closed and committed. W13-02 implementation is reviewed; local verification passes.
Both independent review axes pass. Root typecheck, lint and web dependency isolation pass.
Final workspace dependency checks pass: engine 74 modules / 205 dependencies; web 774 / 1709, zero violations.
The final local-only suite passes 58 files / 563 tests; its five filtered remote cases are not called green.
Six Chromium journeys pass. Root `npm test` remains unchanged and red against the old database schema.
See the [ticket Resolution](../tickets/w13-02-durable-manual-priority.md) and
[review evidence](../audits/w13-02-implementation-review.md) for the exact limits and overlapping focused counts.

The latest exact pre-final-fixture `npm test` reports 587 passing / 45 failing tests.
Two local fixture calls were subsequently corrected and the complete local suite passes.
Remote PGRST202/PGRST204 errors confirm missing checked RPCs/columns; cascading dependent assertions are not green evidence.
Normal TLS stayed enabled. Same-run UUID fixture cleanup is the only approved remote deletion scope.
Final read-only counts match baseline: profiles 31, groups 23, symptoms 22, treatments 23,
Player sessions 30, personal library 23, Timeline 26. The implementation checkpoint has no file deletions.

## Required human action

Review and apply `supabase/migrations/20261022120000_durable_group_priority.sql` using Supabase SQL Editor,
then confirm **migration applied**. No SQL has been applied by the agent.
This follows [the remote-testing guide](../../../testing/supabase-remote-testing.md):
“Agent commits migration SQL + red tests”; “Event Manager applies SQL in Supabase SQL Editor.”

Current runtime SQL SHA-256:
`1E74BBAFD8AB1D7D2A734BDB51102EB765BD9E91128A366708CE3FCE6E7635D4`.
The original `.sql.txt` and test drafts remain preserved verbatim in the audit directory; apply the runtime `.sql` file above.

The migration adds revision/priority metadata and checked RPCs without deleting rows or treatment content.
It revokes old authenticated direct group/symptom writes; coordinate use of the matching client and refresh old Guest tabs.
Existing SELECT/RLS and service-role fixture cleanup remain. Deployment is a separate action, not performed here.
After application, never edit this migration in place; any necessary repair requires another additive migration.

## Exact resume sequence

1. Read master/wave indexes, AGENTS.md, CLAUDE.md, W13-02 and this checkpoint; implementation authorization persists.
2. Obtain explicit human confirmation that this migration was applied; do not infer it from quota renewal or code approval.
3. Run root typecheck, lint, web depcruise and the exact root `npm test` with worker cap 2.
   Supply the previously approved controlled signup address; keep TLS verification enabled.
4. Verify real ownership/RLS/grants, coherent order, rollback, concurrent reorder/append/rating, timestamp precision,
   typed retries, versioned promotion, old frozen receipts and changed-payload rejection.
5. Re-run affected browser journeys if any runtime change is needed; retain stable IDs, focus and one-completion evidence.
6. Confirm same-run fixture cleanup with a read-only count sweep, map every AC to final evidence, close W13-02 and commit.
7. Continue W13-03, then its dependent W13-04 and W13-05. Independent W13-08 remains authorized when ownership allows.

W13-03/04/05/07/08/09 remain open. No dependent implementation started while W13-02 awaits verification.
Prior native/physical-device and W13-07 actual text/embed approvals remain explicit later-wave gates.
No fresh implementation permission is needed after this external schema checkpoint is satisfied.
