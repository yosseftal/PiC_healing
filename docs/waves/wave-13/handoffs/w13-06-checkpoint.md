# W13-06 verified checkpoint and W13-02 entry

Date: 2026-10-22, Asia/Jerusalem. Working tree clean at the implementation checkpoint.

## Completed and committed

- W13-01 remains closed at `8443a35`, with prior checkpoint `6a28ed5`.
- W13-02 preparation is preserved at `56f5c93`: agreed contract, reviewed unapplied SQL, red-test drafts and rollout notes.
- W13-06 is closed at `ec74ff0`: shared owner-safe greeting/status in both service drawers.
  Its [Resolution](../tickets/w13-06-drawer-greeting-and-identity.md) maps every AC to concrete evidence.

Final W13-06 gates: root typecheck and lint pass; web depcruise has zero violations;
`npm test` passes 57 files / 587 tests and engine/web dependency checks.
Focused identity/provider tests pass 31 cases. Eleven Chromium cases pass, including Hebrew/English assembled journeys,
Sheet focus trap/return, retained owner-bound drafts, RTL, small viewport and reduced motion.
Both independent review axes pass after correcting verification precedence and retained-recovery feedback.

Normal TLS remained enabled. Final read-only remote counts match the earlier baseline:
profiles 31, groups 23, symptoms 22, treatments 23, Player sessions 30, personal library 23, timeline 26.
Only same-run fixture UUID cleanup was authorized. Counts are cleanup evidence, not a content audit.
No migration or live privilege change was applied; no existing content or historical document was deleted.

## Active W13-02 frontier

Runtime implementation is next; W13-03/04/05/07/08/09 remain open. W13-08 read-only routing discovery is complete.
Continue from [the contract](../audits/w13-02-contract-proposal.md) and
[SQL rollout review](../audits/w13-02-sql-rollout-review.md), then the ticket, brief and seam map.
The later user charter permits independent branches; their shared files must still have one writer.

Prepared files are preserved outside automatic discovery under `audits/w13-02-test-drafts/`:
the `.sql.txt` migration and two public reorder contract drafts. Restore them to their owned runtime locations only
when implementing the complete storage slice. The current root suite has not had its gates weakened or skipped.

First repair the SQL-extraction test helper with a `FOR UPDATE` regression, then restore the migration.
The old treatment extractor parses that locking clause as a standalone UPDATE statement. Preserve row locks and content checks.
Implement whole-group revision/CAS, complete-permutation reorder and coherent projection through engine, both adapters and web.
All whole-blob Guest writers need one storage-key lock; unsupported persistent locking fails recoverably, with reads retained.
Preserve frozen v1 wire shapes, including legacy pending gate-only requests; new intents explicitly opt into version 2.
Do not derive promotion wire version from normalized group revision or storage schema version.
Preserve timestamp microseconds and ordinary-save no-op equality; promotion fingerprinting stays raw and exact.

Prepare the complete reviewable runtime/SQL diff and real red contracts before the manual SQL Editor checkpoint.
The user must confirm application before green database verification and W13-02 closure.
The existing fixture-cleanup authorization persists; it does not permit deleting existing data or treatment files.
No renewed implementation permission is required to continue the approved suite.
