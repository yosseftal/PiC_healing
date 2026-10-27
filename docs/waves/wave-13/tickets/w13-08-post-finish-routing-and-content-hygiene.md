# W13-08 — Return clearly after Finish while preserving all treatment content

**Status:** closed — reviewed and verified, 2026-10-27.
**Specification:** [Approved Wave 13 charter](../specs/wave-13-spec.md).
**Blocked by:** None.
**Blocking:** [W13-09](w13-09-integrated-journeys-and-wave-handoff.md).
**Execution gate:** Parallel implementation authorized by the latest user charter.
**Domain decisions:** DEC-004, DEC-005, DEC-006, DEC-013, DEC-015, DEC-016, DEC-017, DEC-018.

## Objective & Context

After a genuinely successful Finish, the Event Manager gets a clear completion/return choice rather
than unexpectedly confronting a catalog that looks like newly added treatments. Choosing another treatment
is explicit, and the audit can distinguish source content from the personal executed-work library.

The approved read-only audit traces successful Finish clearing the active Player pointer, then routing
to the shared catalog. It identifies three known bundled seeds, not proven junk. The user approved a
routing-based hygiene approach and explicitly forbids deletion without separate exact-target permission.

## What to Build / Exact Scope

1. Reproduce Guest promotion, authenticated Finish, Finish Anyway and Integrating outcomes. Record source ID,
   link choice, next route, visible IDs and whether a new execution was actually created.
2. Add an explicit completion/return presentation only after the existing public state confirms success.
   Offer return to the current questionnaire summary when available, or new questionnaire through the established
   reset workflow when no group is in scope; offer choose-another-treatment as the other main choice.
3. Open the shared catalog only on the EM's explicit choice. Keep catalog naming distinct from Personal Treatment
   Library; selecting a source remains the only trigger for a new Player session.
4. Integrating, Terminal No without sovereign completion, failed/uncertain persistence and pending promotion
   retain their truthful existing recovery routes. Never show a successful-completion card on request alone.
5. Preserve same-session receipt/replay guarantees on rerender/reload. A presentation return action cannot
   call Finish again, auto-link a group, create library variants or increment use counts.
6. Confirm the three exact seed IDs and overlays from the audit against the reproduced symptom.
   Retain their content, translations, SQL history, IDs and incoming references. Do not filter them out by title/ID.
7. Extend the evidence report with confirmed versus inferred behavior, source provenance and any remaining
   candidate inventory. If a true unwanted file/row is identified, report exact targets and references for a
   separate human decision; no cleanup command belongs in this ticket.

## End-to-End Demonstration

Complete a treatment and see the explicit return choices. Return to the questionnaire without another
execution; then explicitly choose another treatment and inspect the unchanged catalog.
Repeat with lost-response uncertainty and demonstrate that no success is falsely announced.

## Acceptance Criteria

- [x] **AC-01:** The reported experience is reproduced or its precise unreproduced limitation is recorded with source evidence.
- [x]  **AC-02:** Successful Finish/Finish Anyway reaches a clear return surface rather than automatically exposing another
      catalog.
- [x] **AC-03:** Another treatment/catalog opens only by explicit choice; no unsolicited Player session is started.
- [x] **AC-04:** A failed, pending, uncertain or Integrating outcome is never announced as successful completion.
- [x] **AC-05:** Return/reload/rerender does not repeat Finish, increment counts or create new library/timeline records.
- [x] **AC-06:** Current questionnaire continuity, explicit linking and reset confirmations are preserved.
- [x] **AC-07:** All treatment files, seed IDs, overlays and database rows remain intact; no hidden-ID cleanup is substituted.
- [x] **AC-08:** Shared catalog and Personal Treatment Library are not conflated in copy or source selection.
- [x] **AC-09:** The updated audit clearly separates confirmed routing behavior from candidate content and unverified live data.

## Testing Requirements

- App/transport journeys cover Guest promotion, verified Finish, sovereign Finish Anyway, Integrating and uncertainty.
- Assert no extra startSession, onFinishRequested, library mutation or Timeline append from return actions.
- Reload and lost-response tests retain the existing exact-payload receipt behavior.
- Seed/overlay integrity and unchanged catalog-ID assertions prove no content disappears as a presentation fix.
- Real production-build route check distinguishes development fixtures from actual served pages.
- Do not run destructive remote fixtures or data-cleanup SQL as part of this ticket.

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

No treatment content file or database-row deletion, soft-delete/unpublish substitute, seed replacement,
hardcoded title/ID filtering, automatic treatment execution, Player semantic changes, or library/schema cleanup.
Any later deletion requires separate human approval of exact targets and impacts.

Implementation is authorized; parallel dispatch and integration ownership are recorded in the convergence audit.

## Resolution

### Solution path and architecture

Implemented a confirmed-completion surface with explicit questionnaire/catalog choices and bounded web-only recovery.
See [routing reproduction and inventory](../audits/w13-08-routing-reproduction.md) and
[integration review](../audits/w13-07-08-implementation-review.md).
A hidden hint precedes Guest cleanup; visible success requires exact public revalidation after cleanup settles.
Read-only account recovery does not hydrate engines, swap the active provider or create a profile.

### Acceptance evidence

- AC-01: local production assets reproduced the catalog return; the exact user's unexpected item remains unidentified.
- AC-02: confirmed Finish/Finish Anyway displays explicit return; request alone does not announce success.
- AC-03: production regression requires an explicit catalog choice and retains one session/execution/use count.
- AC-04: pending, failed, Integrating and uncertain paths retain recovery; owner/provider/generation guards reject stale reads.
- AC-05: controller/integration tests retain exact receipts and prove return/reload are read/navigation-only.
- AC-06: public current-group verification, retained manual priority and existing reset confirmations remain intact.
- AC-07: all three shared IDs and translation/seed files are preserved; read-only reference/count inventory matches baseline.
- AC-08: copy explicitly names the shared catalog; no Personal Treatment Library query is substituted.
- AC-09: the new audit separates actual routing, synthetic HTTP evidence, live aggregate counts and unidentified content.

### Test and review evidence

Focused completion/controller/composition/recovery: 4 files / 119 tests passed, zero skips/errors.
Actual production regression reached confirmed success and explicit return without another execution.
Full final npm test passed: 75 files / 787 tests, zero failures or skips, 204.89s, exit 0.
All-workspace dependency checks passed: engine 76 modules / 215 dependencies; web 807 / 1887.
Root typecheck and lint passed. Full Chromium and production build passed: 203/203 cases, 5.6m, exit 0.
Logs: .scratch/w13-parallel-root-final.log, -typecheck-final.log, -lint-final.log; .scratch/w13-browser-verified.log.
The runtime was frozen for the browser pass; subsequent changes only adapt Vitest entry helpers and documentation.
Independent Standards/Spec reviews completed; both actionable Spec findings were fixed and re-reviewed.
No content deletion or unrelated data cleanup was performed.
