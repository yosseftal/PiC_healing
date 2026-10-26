# W13-03 implementation review and database verification frontier

Date: 2026-10-26, Asia/Jerusalem. Implementation review baseline: `be61cdd`.
W13-02 is closed in `851cc97` after 64 files / 632 tests passed against its applied real schema.
This record concerns the next additive W13-03 migration, which has not been applied by the agent.

## Architecture and delivery

The questionnaire utility returns to the current list, preserving existing topic IDs, values and timestamps.
New rows retain explicit initial 1–10 ratings and manual priority in a tab-lived composition draft.
After any addition to an answered list, Finish opens a fresh question for the complete revised membership.
The prior committed group and actual answer remain usable until the new transaction succeeds.
Fresh No persists `split_suggested` and retains the advisory and sovereign continuation.
Pure order changes retain the existing membership/answer association and use the editor's original CAS token.

The approved public command crosses GroupEngine, RepositoryPort, Fake, Guest and Supabase.
Shared membership validation, preparation and canonical operation identity live in pic-engine.
Adapters own locking and atomic persistence. Guest receipts live inside the existing storage blob;
Supabase receipts are private, owner/group-bound and unavailable through ordinary authenticated table access.
Receipt replay checks ownership first, then returns the current group without replaying obsolete order or ratings.
The new command never appends Timeline events, invokes Player Finish or increments library use counts.

Initially unanswered local assembly has a narrow staging exception: retain every old member, prepare public
add/rate/reorder calls in memory, then save the frozen whole aggregate once under the original base revision.
No intermediate null-answer cloud write or separate append-then-reorder persistence is introduced.
Generic answered saves reject additions, counter forgery and clearing an answer to bypass membership validation.
Legacy omitted-counter shapes remain readable, including an actual answer without a historical timestamp.
Such a timestamp is never invented; public finalization still requires a valid actual timestamp.

New Finish requests explicitly use promotion version 3. Frozen absent/v2 requests retain their wire shapes,
version and identity through recovery, rearming and reset. Matching old receipts cannot reset newer membership.
Draft admission uses the composition owner/provider/generation; send-time authority is checked around awaits.
Same-owner reauthentication can retry the unchanged frozen request; another owner cannot inherit it.

## Independent reviews

- Standards: **PASS**, gpt-6.1-sol/high, read-only review against repo standards and approved scope.
- Spec: **PASS after fixes**, gpt-6.1-sol/high. Two P2 findings received red-to-green regressions:
  stale editor order previously borrowed the newest token, and legacy undated No could falsely reach summary.
  Changed order now uses the editor base token; explicit review retains intended order only with unchanged membership.
  Pure return preserves valid prior finalization/advisory state and checks timestamp and membership association.
- SQL/compatibility: **PASS after fixes**, gpt-6-astra/high. Constraint/table creation is rerunnable;
  stale ordinary saves report the revision conflict before current-token counter-forgery rejection.
  Ownership precedes receipt replay, replay precedes stale CAS, and all group writers share the existing lock.
  V1/v2 raw promotion fingerprint branches remain intact; the old applied W13-02 SQL has no diff.

These are static reviews, not PostgreSQL compilation or real transaction execution evidence.
The core/storage and web implementations had separate strong-reasoning owners; root owns final heavy runners and commits.
The deduplication sweep retained one shared TypeScript owner for membership normalization/preparation and port shaping.
SQL repeats the necessary server checks at the persistence boundary; it does not rely on preliminary UI/engine reads.

## Evidence and limits

Final root, browser and pre-application remote results are recorded in the
[ticket Resolution](../tickets/w13-03-renewed-joint-answer-after-addition.md).
Focused owner counts overlap: core 19 files / 212 tests; final web formatting verification 3 files / 88 tests.
These must not be added together or presented as the complete suite total.
The final web semantic regression batch passed 5 files / 71 tests before formatting-only edits.

Sandbox temporary-cache rename EPERM prevented collection in an initial attempt.
A workspace-cache retry ran local tests but denied remote and localhost network access; its skips are not green evidence.
The final exact root command therefore runs outside the network-restricted sandbox, with normal TLS verification.
No test or production configuration was weakened to accommodate the old schema.

An earlier mixed local/remote command was interrupted before its remote cases completed; a read-only sweep
confirmed unchanged baseline counts. That attempt supplies no remote pass evidence.
Only same-run UUID fixtures and Auth users may be cleaned up; no existing content or historical file may be deleted.

## Manual application and required closure

Apply only the new `supabase/migrations/20261026120000_atomic_membership_answer_revision.sql` through
the established [manual remote-testing checkpoint](../../../testing/supabase-remote-testing.md).
The human's W13-02 application confirmation does not apply this separate migration.
The new file adds membership markers and receipts and replaces checked RPC bodies without deleting existing rows.
The applied `20261022120000_durable_group_priority.sql` remains byte-for-byte unchanged.

After human confirmation, verify real owner rejection, late transactional rollback and same-UUID retry,
competing reorder/member/rating writers, current-state replay, new v3 promotion and unchanged frozen v1/v2 identity.
The late-failure fixture uses a raw RPC-only marker after writes and before receipt insertion; it raises immediately.
The ordinary adapter whitelist cannot emit that marker. The test requires its exact diagnostic and unchanged aggregate,
then proves the unreserved UUID succeeds exactly once through the ordinary serializer.
Keep W13-03 open until the exact full test suite and all ACs pass on the applied schema.

## Final applied-schema result — 2026-10-26

The human confirmed application. W13-03 is now closed: the exact root gate passes 66 files / 686 tests,
no failures or skips, 110.28 seconds. Root typecheck/lint and both dependency graphs pass.
The initial applied run's only failures were two old rated-at fixture setups attempting forbidden answered append.
They now create complete new initial groups; exact timestamp/null assertions remain and the focused 2/2 rerun passes.
The production runtime and applied migration were not changed, so the prior 14/14 browser evidence remains valid.
Final row counts equal baseline; same-run UUID cleanup was the only deletion scope used.
See [verified closure](../handoffs/w13-03-verified-and-w13-04-entry.md) for the current frontier.
