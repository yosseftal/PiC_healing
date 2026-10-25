# W13-02 implementation review and verification frontier

Date: 2026-10-25, Asia/Jerusalem. Baseline: `11482da5add2240600c7d555d075d04576c53ebc` plus untracked runtime files.
W13-01 and W13-06 remain closed. W13-02 is implemented and reviewed, but remains open for real database verification.

## Independent review

Standards: PASS. Spec: PASS. Fresh independent gpt-6.1-sol contexts reviewed both axes in parallel.
No actionable must-fix or should-fix finding remained in the frozen implementation.
Earlier SQL review by gpt-6-astra found timestamp comparison/precision loss; its correction passed static re-review.
The latest runtime reviews also inspected SQL/adapter consistency, explicit ownership and all-writer concurrency.
Static review is not PostgreSQL compilation or transaction execution evidence.

The approved bounded engine/adapter/schema extension stays inside W13-02.
UI submits explicit permutations through composition and GroupEngine. Storage owns authorization, locks and revision checks.
Priority stays independent of polarity/intensity. Existing answers survive reorder; no private engine hydration was added.
Legacy payload omission is preserved, including gate-only recovery; new intents explicitly select version 2.
Exact replay returns current entities and cannot restore obsolete order or ratings.

## Local and browser evidence

- Root typecheck, lint and web dependency isolation pass; web graph: 774 modules / 1709 dependencies, zero violations.
- Core/Guest/transport/parser/Session batch: 10 files / 112 tests pass before the final answered-fixture adjustment.
- Final shared answered-group fixture rerun: 2 files / 8 tests pass, preserving the cloud NOT NULL answer constraint.
- Guest lock suite: 5 tests pass, including held-lock writers across separate ports and unsupported-lock read retention.
- Focused web priority/draft/recovery batch: 3 files / 36 tests pass.
- Chromium: 6 cases pass across `durable-priority.browser.test.ts` and `wave12-journey.browser.test.ts`.
  Coverage includes Hebrew/English keyboard moves, focus at a boundary, committed data/order, actual joint answer,
  lost promotion response, identical retry and one completion. Browser setup builds production assets.
- Actual Supabase serializer with controlled HTTP verifies a literal historical v1 receipt, microsecond timestamp,
  actual zero, unrated timestamp omission and normalized local revision without adding new wire metadata.
  Controlled transport is not real database evidence.

These focused counts overlap and must not be summed into one test total.
Windows sandbox temporary-cache EPERM interrupted some retries before collection; zero executed tests were not called passes.

## Full gate before applying SQL

The first exact `npm test` run on this slice reported 579 passing / 53 failing tests, 54 passing / 10 failing files.
Remote failures include PGRST202 for missing checked RPCs and PGRST204 for missing revision/position columns.
It also exposed old local exact expectations for new revision/version metadata and visible priority labels.
Those expectations are being corrected with exact shapes, preserving their data and idempotency assertions.
The next exact run reports 587 passing / 45 failing tests. Two local test calls still supplied manually constructed
unversioned inputs while expecting new-intent metadata; they now pass the actual public assembled snapshot.
The final local run then passes 58 files / 563 tests, with five mixed-file remote cases filtered only in that local command.
Root `npm test` remains unchanged and includes all remote suites; no full green result is claimed before application.

An unlinked remote lost-response case's extra Timeline row follows a prior linked case failing before its inline cleanup
against the old schema. Its strict one-row assertion remains; no product defect is inferred from that cascade.
Likewise later undefined group IDs in returning-identity tests follow earlier missing-RPC failures.
The original unanswered-cloud 23502 assertion remains mandatory after application.

The post-run read-only sweep matches the prior baseline: profiles 31, groups 23, symptoms 22,
treatments 23, Player sessions 30, personal library 23, Timeline 26. Counts are fixture-cleanup evidence, not a content audit.
Only same-run UUID fixtures/Auth users were cleaned up. No existing content, treatment file or unrelated row was deleted.
All three original preparation `.txt` documents are preserved verbatim; separate runtime copies contain the final implementation.

## Required closure evidence

Apply the reviewed additive SQL through the established manual checkpoint, then run the full gate and real contracts.
Verify coherent ordering, owner rejection, old-DML fail-closed grants, transactional rollback,
competing reorder/append/rating, typed ordinary-save no-ops, preserved microseconds, new ordered promotion,
frozen legacy replay and strict changed-payload rejection.
The coordinated rollout must account for old direct-write clients and old Guest tabs; see the SQL rollout review.
Keep W13-02 open and ACs unchecked until this evidence passes. Do not start its dependent W13-03/04/05 implementation.
