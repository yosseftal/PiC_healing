# W13-09 — Prove the complete Wave 13 journeys and deliver the reviewed handoff

**Status:** in progress — implemented at 8401180; full remote signup quota retry pending, 2026-10-27.
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
- [ ] **AC-02:** Both languages complete the full assembled journey with and without a questionnaire title.
- [ ] **AC-03:** Order and renewed joint answer survive authorized storage/promotion round-trips without partial records.
- [ ] **AC-04:** Back/help/video/locale changes retain work and do not cross owner or inquiry-generation boundaries.
- [ ]  **AC-05:** Initial ratings, blind re-rating, actual zero history and optional polarity summary meet their distinct
      contracts.
- [ ] **AC-06:** All intended completion paths increment once; failure, Integrating and return-only actions do not.
- [ ] **AC-07:** Full required automated gates pass on the final reviewed tree with no hidden skip/retry/threshold weakening.
- [ ] **AC-08:** Manual checks have actual results or explicitly accepted pending status; video and text approvals are recorded.
- [ ] **AC-09:** Independent Standards/Spec reviews are complete and remaining risks are accurately stated.
- [ ] **AC-10:** Handoff and indexes cite exact implementation commits; no content or database deletion is part of closure.

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

Execution started from clean checkpoint 6a6622b. Prior convergence evidence is 787 root tests and 203 Chromium cases;
those results are historical until the required final commands run again.
See [exact entry and assembled journey plan](../handoffs/w13-parallel-checkpoint-and-w13-09-entry.md).
W13-07 AC-01 is explicitly deferred under the user-approved fallback; never report it as passed.
The latest W13-09 directive explicitly allows recording "Pending Manual QA Verification for Wave 13" when actual
device/accessibility results are unavailable. Record that current decision, never a copied Wave 12 waiver.
Final solution, AC mapping, commands, reviews and SHAs will be recorded after actual verification.

The new assembled file passes 2/2 focused cases; the complete Chromium suite passes 205/205 with production build.
Final source typecheck, lint and all-workspace dependency checks pass. Both independent review axes found no actionable issue.
The first exact npm test passed 786/787 tests; real signup alone returned over_email_send_rate_limit.
The unchanged full command is queued for retry; this ticket is not yet closed.
See [current evidence](../audits/w13-09-verification-and-review.md) and
[active final-gate handoff](../handoffs/wave-13-final-handoff.md).

[relocation-link-1]: w13-04-reversible-questionnaire-and-recovery.md
[relocation-link-2]: w13-05-clean-summary-and-polarity-view.md
[relocation-link-3]: w13-06-drawer-greeting-and-identity.md
[relocation-link-4]: w13-07-welcome-text-guide-and-video.md
[relocation-link-5]: w13-08-post-finish-routing-and-content-hygiene.md
