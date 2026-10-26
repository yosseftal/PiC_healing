# W13-03 reviewed implementation: manual application checkpoint

Date: 2026-10-26, Asia/Jerusalem. Open-ticket checkpoint; neither W13-03 nor Wave 13 is closed.
W13-01, W13-02 and W13-06 are closed. W13-02 closure commit: `851cc97`.
Contract checkpoint: `be61cdd`. The scoped implementation commit follows this record in Git history.

## Verified frontier

The return-to-questionnaire editor stages additions, initial 1–10 ratings and complete manual priority locally.
An answered list requires a new actual full-list answer after an addition. Membership/order/answer commit atomically
through GroupEngine and the adapters; exact request replay returns current state without duplicating work.
Fresh No retains the advisory and sovereign continuation. Pure order keeps the answer valid under the original editor CAS.
Existing values/history stay intact; no questionnaire change creates Finish, Timeline or library completion effects.
New Finish intents use v3; frozen absent/v2 requests retain exact identity through recovery and reset.

Both independent review axes pass, as does the separate SQL/compatibility review.
Two Spec P2 findings were fixed with red-to-green regressions and explicit re-review.
Root typecheck and lint pass. Workspace dependency isolation passes with zero violations:
engine 76 modules / 215 dependencies; web 777 / 1726.
All 14 Chromium cases pass on the final runtime; production assets build successfully.
The [ticket Resolution](../tickets/w13-03-renewed-joint-answer-after-addition.md) maps every AC to its actual evidence.
The [review record](../audits/w13-03-implementation-review.md) preserves review limits and architecture decisions.

The exact root `npm test` before application reports **663 passing / 23 failing tests**, 61 passing / 5 failing files,
686 tests total, no skips, duration 120.40 seconds. All failures are in real database integration paths.
Missing `commit_membership_revision`, the old RPC's `unsupported payload_version`, and absent answered-save guards
prove the new contracts are red against the W13-02 schema. Dependent promotion/returning-identity assertions also fail.
The unchanged root command still includes all remote suites; no full green result or W13-03 closure is claimed.

Final read-only counts match baseline: profiles 31, groups 23, symptoms 22, treatments 23,
Player sessions 30, personal library 23, Timeline 26. Normal TLS remained enabled.
Only same-run UUID fixtures/Auth users were cleaned up. No existing content or historical file was deleted.

## Required manual action

Review and apply **only** `supabase/migrations/20261026120000_atomic_membership_answer_revision.sql`
in Supabase SQL Editor, then confirm **migration applied** for this filename.
The human's earlier confirmation applied W13-02; it does not cover this new migration.

This follows [the remote-testing guide](../../../testing/supabase-remote-testing.md):
“Agent commits migration SQL + red tests”; “Event Manager applies SQL in Supabase SQL Editor.”
No SQL has been applied by the agent. New file SHA-256:
`640ACFE68FC5F80BC764AF4F1CA236BD6B89E9A2836EA3C2EDE70FDBE61ADABD`.

The new file adds membership markers and a private receipt table, then replaces checked RPC bodies.
Its table/constraint creation is guarded for reruns; rerunning does not reset markers or receipts.
It preserves original rows, legacy promotion fingerprint branches, SELECT/RLS and same-run service-role fixture cleanup.
Generic answered-list append now fails closed; coordinate the matching client and refresh old running Guest tabs.
Deployment remains a separate action and has not been performed.

The already-applied `20261022120000_durable_group_priority.sql` remains unchanged, SHA-256:
`1E74BBAFD8AB1D7D2A734BDB51102EB765BD9E91128A366708CE3FCE6E7635D4`.
After applying W13-03, do not edit it in place; any SQL repair must be another additive migration.

## Exact resume sequence

1. Read AGENTS.md, CLAUDE.md, master/wave indexes, W13-03, its execution contract and this checkpoint.
2. Obtain human confirmation for this exact new migration; do not infer application from renewed quota or code approval.
3. Run root `npm run typecheck`, `npm run lint`, web depcruise and the exact `npm test`, worker cap 2.
   Use the previously approved controlled signup address and normal TLS; use the host runner for network access.
4. Verify real membership/answer atomicity, late rollback and unreserved same-UUID retry, owner/RLS rejection,
   racing reorder/member/rating writers, current-state replay, existing values/timestamps and generic-save bypass rejection.
5. Verify new v3 promotion and unchanged frozen absent/v2 recovery/fingerprint identity without duplicate completion effects.
6. Diagnose every failure; never call missing-function or wrong-error rejection proof of the intended constraint.
   Rerun affected browser cases only if runtime changes. Confirm fixture cleanup with a read-only sweep.
7. Map every AC to final passing evidence, close W13-03 and commit; then dispatch W13-04 from its prepared brief.

W13-04/05/07/08/09 remain open. No new implementation permission is needed after this external checkpoint.
Later source-copy/embed approvals and native/physical-device checks remain visible in their own tickets.
