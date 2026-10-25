# W13-02 additive SQL review and rollout

Prepared migration destination: `supabase/migrations/20261022120000_durable_group_priority.sql`.
The original `.sql.txt` draft remains preserved verbatim under `audits/w13-02-test-drafts/` as historical evidence.
The runtime migration at the destination above includes the final reviewed safeguards; use that file for application.
Status: unapplied; static review passed. Runtime implementation is present; final review and database verification are open.
Use the established manual-application checkpoint; this document grants no permission to apply SQL or change live privileges.

## Reviewed behavior

- Adds whole-group revision and zero-based symptom positions, retaining all existing rows and treatment content.
- Backfills only null positions by creation time then ID. Historical manual intent cannot be reconstructed.
- Rerunning uses guarded columns/constraints and replaceable functions; existing revision and manual positions remain intact.
- One coherent projection supplies ordered symptoms and the matching revision to reads and mutation responses.
- Save and reorder lock the group key and row. Aggregate saves retain every member in order and allow appended members only.
- Every actual aggregate mutation advances revision, including ratings. Stale or missing write tokens reject.
- Exact full-content aggregate retries are no-ops and cannot decrease revision. Reorder always checks the supplied token.
- Ordinary retry equality compares database-typed fields, including UUIDs and timestamps, rather than raw JSON spellings.
- Group timestamps retain PostgreSQL microseconds; normal millisecond values retain the existing JavaScript ISO spelling.
- Symptom upserts check group/owner both before writing and in the conflict branch; a racing foreign-ID collision rolls back.
- Reorder changes only position/revision, retaining ratings, timestamps, IDs and joint answers.
- Promotion shares the group lock and also locks its session key. Same-key different payloads cannot pass an absent-row race.
- Receipt equality returns existing IDs without replaying old symptoms or order over later legitimate changes.
- A matching receipt also checks session/library/timeline owner and treatment associations and ownership of current group links.
- Null/scalar player-session payloads reject before writing. Receipt checks leave mutable content and ratings untouched.
- The legacy md5 input expression remains identical; existing receipt fingerprints are never rewritten.
- V2 metadata is explicit and fingerprinted. Legacy omitted metadata is never normalized into wire null/zero values.
- Legacy group-present/session-unlinked payloads retain their former behavior; v2 requires the explicit matching group link.
- The existing connection-drop fixture still sleeps three seconds and raises, now after initial group writes to prove rollback.

## Coordinated rollout impact

Authenticated/anonymous/public INSERT, UPDATE and DELETE grants on group/symptom tables are revoked.
Existing SELECT policies and RLS remain. Checked SECURITY DEFINER RPCs use a fixed search_path and authenticated EXECUTE grants.
Service-role fixture cleanup remains available; only UUIDs created in the same run may be cleaned up.
Do not grant old direct writers a bypass: they could erase order metadata or overwrite newer scores without a revision check.
Older deployed clients will fail closed after application; deploy the matching client as a coordinated rollout step.
Rolling back presentation leaves schema/data intact. Re-enabling the old blind-write client is not a safe rollback.
Close/refresh old browser tabs so all Guest writers participate in the new storage-key Web Lock.
Persistent Guest storage requires Web Locks (or an explicitly supplied equivalent lock); unsupported writes fail recoverably.
Existing Guest data stays readable when locks are unavailable. The product must never silently use an unsafe persistent fallback.

New pending Finish intents carry promotionPayloadVersion 2. Existing pending intents preserve an absent marker.
This includes old gate-only blobs with no recovery envelope: they may already have a v1 receipt after a lost response.
Group-read revision normalization must not upgrade their wire version. Reset/rearming/constructor recovery retain the marker.

## Evidence and next checks

Independent architectural SQL review used gpt-6-astra with high reasoning in a fresh read-only context.
It found a no-op comparison problem with equivalent timestamp spellings and precision loss in the initial projection.
The draft now canonicalizes ordinary saves through database types and preserves microseconds; static re-review passes.
The exact legacy promotion fingerprint comparison still passes. This review is not PostgreSQL execution evidence.

Static checks passed: exact legacy fingerprint expression comparison, no row/table deletion statements, all SQL lines <=130.
The migration has seven CREATE OR REPLACE functions, guarded constraints/columns and a null-only backfill.
No local PostgreSQL, psql or Docker executable was available; SQL compilation and database behavior have not been verified.
No migration or live privilege change was executed. No remote fixture tests were run for this preparation phase.
One public engine/repository regression was run red: `engine.reorderSymptoms is not a function` (1 failed test).
The contract implementations are under `packages/pic-engine/test/contract/`; original `.txt` drafts remain preserved.
The original scanner mistook PL/pgSQL `FOR UPDATE;` for a standalone UPDATE statement;
the bounded helper now handles locking clauses while retaining actual treatment writes. Its focused integrity batch passes.
The SQL and contracts are included in automatic discovery again; no migration exclusion or scanner waiver was introduced.

Runtime ownership is released; core/adapter contracts and their agreed test matrix are being verified.
Before manual application: review the complete SQL/runtime diff and capture red remote contract evidence with isolated fixtures.
After the user confirms application: verify owner rejection, coherent reads, rollback, stale/competing reorder/append/rating,
new ordered promotion, exact/lost-response replay, old frozen and gate-only v1 recovery, and changed-payload rejection.
Adapt direct authenticated schema mutation tests to checked RPC writes without weakening owner isolation or rating assertions.
Add ordinary-save retries with `00Z` versus `00.000Z`, equivalent timezone offsets and uppercase UUIDs, both with omitted
revision and a supplied current revision. Equal typed content must remain a no-op without advancing the stored revision.
Seed timestamp microseconds in same-run fixtures; verify read/reorder/unrelated aggregate save retain every fractional digit.
Verify a real microsecond difference remains a change, and equivalent timestamp spellings still reject on frozen promotion replay.
The Supabase group mapper must preserve the RPC's timestamp strings directly, never truncate them through JavaScript Date.
Do not close W13-02 or claim the full root suite green while its required schema remains unapplied.
