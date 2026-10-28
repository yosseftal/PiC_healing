# W13-09 — Prove the complete Wave 13 journeys and deliver the reviewed handoff

**Status:** closed — approved convergence scope verified 2026-10-28; explicit content/manual exceptions recorded.
**Specification:** [Approved Wave 13 charter](../specs/wave-13-spec.md).
**Blocked by:** [W13-04][relocation-link-1], [W13-05][relocation-link-2], [W13-06][relocation-link-3],
[W13-07][relocation-link-4], [W13-08][relocation-link-5].
**Blocking:** None.
**Execution gate:** Upstream convergence verified; W13-09 execution and final quality gates authorized.
**Domain decisions:** DEC-010–DEC-018; all approved Wave 13 decisions.

## Objective & Context

Demonstrate the complete user journey from welcome through topic entry, durable priority, renewed
joint inquiry, treatment and clear return in both Guest and authenticated modes, including recovery.
This final verification slice proves interoperability of the earlier independently runnable slices.

Wave 12 closed with 560 root tests and 179 Chromium cases, plus explicitly pending manual checks.
Those counts are historical, not a substitute for current evidence. The approved Wave 13 spec, content audit
and all per-ticket Resolutions are the requirement sources; this ticket cannot waive their blockers.

## What to Build / Exact Scope

1. Assemble bilingual journeys with actual App providers/composition and public engine seams, controlling
   transport only where needed. Include real isolated persistence-contract evidence for the new transactions.
2. Prove: welcome/help/video return → untitled topics → manual priority → initial ratings → joint answer →
   add topic → fresh full-list answer → summary → treatment → persistence → clear completion/return.
3. Cover negative joint response and sovereign continuation, blind 0–10 re-rating with historical zero,
   optional polarity view, Guest promotion replay, verified unsaved drafts and changed-owner isolation.
4. Exercise failed ordering, atomic revision rollback, pending last-topic input, interrupted identity and
   external-video failure. Assert exact IDs, positions, answers, ratings and one intended completion.
5. Run root typecheck/lint/tests, all-workspace dependency checks, production build and full bilingual Chromium
   suite, with sequential heavy runners and two workers per established stable workflow.
6. Record actual manual mobile keyboard/viewport, safe-area, zoom and native Hebrew screen-reader results.
   If unavailable, report Pending Manual QA Verification and obtain an explicit closure decision; do not
   copy the prior wave's waiver or claim automated geometry proves native behavior.
7. Complete independent Standards and Spec reviews at implementation time, resolve actionable findings,
   and produce a handoff linking exact commits, AC evidence, content approval, migration status and limitations.
8. Update the wave and ticket indexes only to actual status. Keep every historical specification, audit and
   ticket; a completed wave is not authorization to remove documents or treatment content.

## End-to-End Demonstration

Run the full Guest and verified-account journeys with a deliberate failed save and a fresh joint No after
adding a topic. Show persisted ordering, explicit content return, unchanged ownership and exactly one Finish.
Provide an evidence index that a reviewer can follow from each AC to test/manual output and its commit.

## Acceptance Criteria

- [ ] **AC-01:** All upstream ticket ACs are resolved with actual evidence; the final DAG contains no silently waived dependency.
- [x] **AC-02:** Both languages complete the full assembled journey with and without a questionnaire title.
- [x] **AC-03:** Order and renewed joint answer survive authorized storage/promotion round-trips without partial records.
- [x] **AC-04:** Back/help/video/locale changes retain work and do not cross owner or inquiry-generation boundaries.
- [x]  **AC-05:** Initial ratings, blind re-rating, actual zero history and optional polarity summary meet their distinct
      contracts.
- [x] **AC-06:** All intended completion paths increment once; failure, Integrating and return-only actions do not.
- [x] **AC-07:** Full required automated gates pass on the final reviewed tree with no hidden skip/retry/threshold weakening.
- [x] **AC-08:** Manual checks have actual results or explicitly accepted pending status; video and text approvals are recorded.
- [x] **AC-09:** Independent Standards/Spec reviews are complete and remaining risks are accurately stated.
- [x] **AC-10:** Handoff and indexes cite exact implementation commits; no content or database deletion is part of closure.

## Testing Requirements

- Prefer assembled observable journeys over duplicating every lower-level test from tickets 01–08.
- Run all affected database/RLS/transaction/promotion compatibility checks in an explicitly authorized environment.
- Preserve original assertion strength; classify environment failures separately from product failures.
- Record command, scope, date, exit status, tested commit and relevant artifact for each final gate.
- A documentation-only preflight must not execute these implementation tests or mutate remote data now.

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

No unrelated optimization, broad refactor, new features, invented test passes, copied waivers,
data deletion, production deployment, automatic merge/push or implementation beyond the approved tickets.
Any newly discovered behavior gap is resolved in its owning ticket before final closure.

Implementation is explicitly dispatched by the user's final W13-09 charter.

## Resolution

### Solution path and architecture

Implementation: 8401180, dispatched from 6a6622b; verified closure: 2026-10-28 (Asia/Jerusalem).
The new actual-App HE untitled and EN titled journeys reuse the existing HTTP-only fixture/transport.
No runtime, fixture, transport, engine, adapter, migration, dependency or treatment-content change was needed.
Presentation row IDs survive editing/help/locale/reorder; engine-allocated committed IDs survive every later operation.
The browser fixture proves assembled behavior. Actual SQL/RLS/rollback/replay is verified separately by the root remote suite.
See [verification matrix and independent review](../audits/w13-09-verification-and-review.md) and
[final handoff](../handoffs/wave-13-final-handoff.md).

### Acceptance evidence

- AC-01: ACCEPTED SCOPE EXCEPTION, not passed. The strict upstream criterion remains pending W13-07 AC-01's verified copy.
  Tickets 01–08 have evidence-bearing Resolutions; W13-07 closes only its explicitly approved Scope 2 / AC-08 fallback.
  Both W13-07 AC-01 and this dependent criterion remain unchecked, rather than claiming completed practical text.
  W13-06's header checklist was synchronized to its seven already checked original Resolution entries.
- AC-02: both assembled cases pass: HE without a title and EN with a title, from welcome/guide through completion/return.
- AC-03: exact committed IDs, order, ratings, timestamps, fresh No and membership association survive Guest promotion.
  The real remote contracts verify atomic revision, late rollback, competing writers, owner rejection and receipt replay.
- AC-04: guide/Back/locale return retains exact pending fields and row identity. Existing reload, identity, navigation,
  promotion and completion matrices verify changed-owner, provider and inquiry-generation isolation.
- AC-05: initial blank scores offer 1–10; independent polarity and manual priority remain distinct. Fresh blind re-rating
  hides adjacent history/grouping, saves actual zero, and reveals zero history only on explicit request.
- AC-06: HE terminal Yes/Finish and EN No/Integrating then Finish Anyway retain exactly one intended completion.
  Lost-response retry is the same frozen payload; explicit questionnaire return creates no execution or library increment.
- AC-07: final exact npm test passes 75 files / 787 tests, zero failures or skips, 144.99s, exit 0 on 2026-10-28.
  All-workspace dependency checks pass: engine 76 modules / 215 dependencies; web 807 / 1887, zero violations.
  Frozen-source typecheck/lint pass; complete bilingual Chromium and production build pass 205/205, 5.5m.
- AC-08: Pending Manual QA Verification for Wave 13 is explicitly recorded under the current user's allowed alternative.
  No native mobile/keyboard/safe-area/Hebrew screen-reader pass is claimed. This is not a copied Wave 12 waiver.
  Approved r1, the verified official embed and the pending practical-copy requirement remain separate evidence.
- AC-09: fresh independent source Standards (gpt-6-luna/high) and Spec (gpt-6.1-sol/high) reviews found no actionable issue.
  Final Standards review found the dependent AC-01 checkbox overstated upstream completion; it is now explicitly unchecked.
  Approved-scope closure and the accepted exception remain distinct from a passed criterion.
  Both independent reviewers confirmed the corrected final documents with no remaining finding on 2026-10-28.
- AC-10: the handoff/indexes cite exact implementation SHAs and preserved checkpoints. Final read-only inventory matches
  all seven baseline counts and all three shared-source/reference inventories. No existing data, content or source file deleted.

### Commands, provenance and limits

Final root log: .scratch/w13-09-root-20261028-final.log. Real signup and all current database contracts pass.
The command ran on beefd85 plus documentation-only updates; runtime/test sources remain identical to 8401180.
Typecheck/lint logs: .scratch/w13-09-typecheck-final.log and .scratch/w13-09-lint-final.log.
Full browser/build log: .scratch/w13-09-chromium-full.log; focused 2/2 log: .scratch/w13-09-focused-third.log.
Preservation logs: .scratch/w13-09-inventory-20261028-before.log and -after.log; exact comparison passed.
Earlier full attempts were 786/787 with signup email quota, then 786/787 with a Cloudflare 502 read.
Both are retained as failures; no assertion, email-security setting, runtime retry or threshold was weakened.
Only exact same-run UUID fixture/Auth cleanup was authorized and performed. No deployment, push or new wave work.

[relocation-link-1]: w13-04-reversible-questionnaire-and-recovery.md
[relocation-link-2]: w13-05-clean-summary-and-polarity-view.md
[relocation-link-3]: w13-06-drawer-greeting-and-identity.md
[relocation-link-4]: w13-07-welcome-text-guide-and-video.md
[relocation-link-5]: w13-08-post-finish-routing-and-content-hygiene.md
