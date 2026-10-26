# W13-03 — Add to an answered list and confirm the full revised list again

**Status:** in progress — implementation reviewed; new additive database migration awaits manual application.
**Specification:** [Approved Wave 13 charter](../specs/wave-13-spec.md).
**Blocked by:** [W13-02](w13-02-durable-manual-priority.md).
**Blocking:** [W13-04](w13-04-reversible-questionnaire-and-recovery.md).
**Execution gate:** Authorized; complete prerequisites and wait for serial dispatch.
**Domain decisions:** DEC-002, DEC-010, DEC-013, DEC-014, DEC-017, DEC-018; W13-D4.
**Execution contract:** [Membership/answer public seam and ownership](../audits/w13-03-membership-contract.md).

## Objective & Context

After returning to an answered questionnaire, the Event Manager can add a topic, rate it and answer
the joint-treatment question for the entire updated list. The saved version changes atomically only with
the actual fresh answer. A previous answer cannot silently apply to newly expanded membership.

The user explicitly confirmed W13-D4: after adding a topic, confirm again whether the full list can be
treated together. Both Yes and No remain valid; No retains the advisory and sovereign continuation.
The existing engine/server contract has no answer-to-membership revision, so this slice owns its bounded extension.

## What to Build / Exact Scope

1. Provide a return-to-list/edit entry from the current joint/advisory/summary journey using the shared flow seam.
   Preserve existing member IDs and show new topics as a pending questionnaire revision, not already anchored work.
2. Permit progressive additions with stable IDs and their initial 1–10 rating pass; retain pending text on Back.
   Multiple additions before answering produce one fresh question about the latest complete membership.
3. Bind an answer to the membership revision through a public GroupEngine command that commits the new members
   and actual answer together. Reject stale owner/revision state; exact retries must not duplicate topics.
4. Extend the port, Guest representation and Supabase atomic transaction accordingly. Read original membership,
   current order and response consistently; keep the prior committed version usable until the new commit succeeds.
5. A prior Yes or No cannot authorize continuation with an expanded list. A pure reorder leaves the answer valid.
   Do not reset or fabricate a server answer as an intermediate write to work around a NOT NULL constraint.
6. A fresh No persists split_suggested for the new version and offers existing advisory/continue choices.
   Never force Yes, auto-split, archive or delete a group in order to proceed.
7. Serialize with pending persistence/promotion. Freeze payloads before sending; retain old frozen promotion
   requests for exact replay. Resolve pending anchoring before accepting a new persisted revision.
8. Expose save failure and conflict recovery while retaining staged additions and the actual fresh response.
   Preserve previous rating/history fields, priority positions, Timeline and library use counts.

## End-to-End Demonstration

Complete the joint question with Yes, go back, add a third topic, and attempt to continue.
Observe a new full-list question. Answer No and use the sovereign advisory continuation.
Inject a save failure: the previously committed group remains intact and retry commits the new version once.

## Acceptance Criteria

- [ ] **AC-01:** Adding at least one topic after any previous joint answer requires a new answer for the full updated list.
- [ ] **AC-02:** Pure reordering never forces another joint answer.
- [ ] **AC-03:** Back and retry retain pending additions, text, ratings, IDs, order and the actual fresh answer.
- [ ] **AC-04:** Original membership and answer remain committed together until the revised transaction succeeds.
- [ ] **AC-05:** A successful revision persists membership, order and its fresh answer together in Guest and Supabase.
- [ ] **AC-06:** Fresh No is accepted with the existing non-blocking advisory; no forced Yes or automatic split occurs.
- [ ] **AC-07:** A stale/concurrent revision or different owner is rejected without partial writes or overwriting newer work.
- [ ] **AC-08:** Same-operation retry after failure/lost response does not duplicate topics or change completion counts.
- [ ] **AC-09:** Prior history, existing ratings, source IDs and anchored group continuity remain intact.
- [ ] **AC-10:** Pending Guest promotion is settled or retained for exact replay before a divergent revision is committed.

## Testing Requirements

- App journey: initial Yes/No → return → add one/many → initial rating → new joint answer → summary.
- Pure reorder after Yes/No is a control case proving no new question is required.
- GroupEngine/port contracts verify answer-to-membership association and exact retry identity.
- Both adapters plus a real isolated database verify atomic rollback, conflict and owner checks.
- Inject failure before transaction, lost response after commit, reset/identity change during pending work.
- Regression: no Timeline append, Player Finish or use-count increment from questionnaire revision.

Run typecheck, lint, dependency isolation and affected unit/integration/browser checks for the owned slice.
Use the scripts actually present in the repository; record commands and outcomes in Resolution.
Changes crossing persistence require both public-contract tests and real authorized database evidence.
The user permits cleanup only of fixture rows and Auth users created in the same test run, by that run's UUIDs.
No existing content, unrelated database rows or treatment-content files may be deleted.

## Definition of Done

- The complete demonstration works; every AC is linked to concrete passing evidence in Resolution.
- Relevant tests, typecheck, lint and dependency checks pass on the final diff.
- Existing owner isolation, Dumb Reflection, Blind-by-Default and EM Sovereignty contracts remain intact.
- Changes stay within this slice; shared modules have one writer at a time.
- Required content approvals and manual/environment limitations are recorded honestly.
- A scoped implementation commit references this ticket after authorization and review.
- The ticket index reflects its actual state; documentation and historical evidence remain preserved.

## Do Not Touch / Out of Scope

No topic removal, arbitrary group administration, required positive answer, full split UI, auto-archival,
cross-device editing product, generic event sourcing or modification of historical ratings.
No data deletion or workaround that bypasses the public engine seam.

Implementation is authorized by the user; wait for prerequisites and serial dispatch.

## Resolution

### Solution and architectural decisions

The composition-owned editor retains committed rows and stages new rated topics and priority locally.
After an addition, the full-list question collects an actual fresh Yes/No. One public
`commitMembershipRevision` command freezes operation UUID, topic IDs, order, response and timestamp.
GroupEngine, the port and both adapters preserve the old committed list until the atomic save succeeds.
Membership markers bind the answer to the new version; whole-aggregate revision remains the write-conflict token.
Private receipts make identical retries return current data without duplicating topics or replaying old ratings/order.
Generic saves reject answered-list additions, counter forgery and clearing an answer to bypass the command.

Pure reorder retains answer validity and uses the editor's original revision. Explicit conflict review can
refresh that base while retaining the EM's intended order when committed membership has not changed.
Existing values, zero ratings, timestamps and IDs remain immutable during membership revision.
Fresh No retains the advisory and sovereign continuation; legacy undated answers never acquire invented timestamps.
New Finish requests use promotion v3; already frozen absent/v2 requests retain exact wire identity through recovery.

The approved narrow initial unanswered staging exception uses public add/rate/reorder calls in memory, then
one aggregate save under the original base revision. No intermediate null-answer cloud save is added.
The [execution contract](../audits/w13-03-membership-contract.md) records this bounded scope.
The applied W13-02 migration is unchanged; W13-03 uses a separate additive SQL file.

### Reviews and verification

Independent Standards and Spec reviews pass. Both initial Spec P2 findings have regression evidence and pass re-review.
The independent SQL/compatibility review passes after rerun-safety and stale-error-classification fixes.
See [implementation review](../audits/w13-03-implementation-review.md) for architecture, review limits and runner evidence.
Final verification results and the exact manual-application entry point are recorded at the checkpoint below.
The full real database gate must pass after application before this ticket can close.

- Root `npm run typecheck` and `npm run lint`: pass on the final runtime.
- `npm run depcruise --workspaces --if-present`: zero violations; engine 76 modules / 215 dependencies, web 777 / 1726.
- Root `npm test`, workers 2, approved signup address, normal TLS: 663 pass / 23 fail, 686 total, no skips;
  61 passing / 5 failing files, 120.40 seconds. All failures are real integration paths against the pre-W13-03 schema.
  Missing membership RPC, old v3 rejection and missing generic answered-save guards remain explicit red evidence.
- Chromium final runtime: 14/14 pass, production build included, 24.5 seconds. Files:
  `membership-revision.browser.test.ts`, `durable-priority.browser.test.ts`,
  `wave12-journey.browser.test.ts` and `questionnaire.browser.test.ts`, with `--workers=2`.
- Final read-only cleanup sweep: profiles/groups/symptoms/treatments/Player/library/Timeline = 31/23/22/23/30/23/26,
  unchanged from baseline. Only same-run UUID fixtures/Auth users were cleaned up.

Run logs are ignored local artifacts: `.scratch/w13-03-before-migration-remote.log` and
`.scratch/w13-03-browser-final.log`. The full `npm test` remains unchanged and red until SQL application.
Continue from the [manual-application checkpoint](../handoffs/w13-03-manual-apply-checkpoint.md).

### Acceptance evidence mapping

| AC | Implemented evidence | Remaining closure gate |
| --- | --- | --- |
| 01 | Questionnaire regressions and bilingual browser return/add/fresh-answer journeys | Real revised-list persistence |
| 02 | Pure-order controls, stale-order conflict, unchanged-editor canonical read | Real metadata-preserving reorder |
| 03 | Stable draft rows, Back, frozen failure/lost-response retry and explicit conflict review | Real retry transaction |
| 04 | No publish before persistence; Guest/Fake atomic contracts; browser injected failure | Real late rollback |
| 05 | Shared command and Guest/Fake contracts; controlled Supabase transport | Applied-schema atomic command |
| 06 | Initial Yes/No × fresh Yes/No contract matrix and fresh-No advisory controls | Real persisted fresh No |
| 07 | Stale/foreign/invalid command matrix and composition owner/provider/generation guards | Real RLS/concurrent writers |
| 08 | Current-state receipt replay after later reorder/rating; browser lost-response retry | Real exactly-once receipt |
| 09 | Old values/zero/timestamps/IDs retained; browser no extra Finish/Timeline/library count | Real continuity/count checks |
| 10 | Frozen absent/v2 and fresh-v3 recovery, rearm, kind/reset and pending-save guards | Real promotion compatibility |

AC checkboxes remain open until the required applied-schema evidence passes. No therapeutic decision was inferred.
Only same-run UUID fixture cleanup is authorized. No content, existing row or historical artifact was deleted.
