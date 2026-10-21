# W13-09 isolated implementation brief

## Identity and authorization

Ticket: [W13-09](../tickets/w13-09-integrated-journeys-and-wave-handoff.md).
User approved implementation of the full suite after preflight. Work only when dispatched in serial order.
Read AGENTS.md, CLAUDE.md, CONTEXT.md, decisions.md, the active specification and the complete ticket before editing.
The older preflight-only instructions describe that earlier turn; this execution charter supersedes that gate.

## Permissions

Read-write: active ticket and its owned source/tests inside packages/pic-web.
Read-only: packages/pic-engine, adapters, migrations and all sibling-ticket implementations.
Read-only: spec, other tickets and the [execution seam map](../audits/wave-13-execution-seam-map.md).
Off limits: unrelated code, treatment files, destructive database cleanup and any undeclared seam extension.
Shared files have one writer. Escalate ambiguities to the orchestrator before guessing semantics.

## Frozen requirements (verbatim)

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


## Domain references

Read the ticket's cited DEC entries in full. Canonical terms remain Symptom Group, Symptom,
Polarity, Intensity, Event Manager and Inquiry Session; Questionnaire is presentation language only.
DEC-010: independent valence and magnitude; W13-D2 narrows initial entry to 1–10 only.
DEC-011: both prior dimensions hidden by default; explicit Reveal remains available for re-rating.
DEC-017: actual verified identity and persistence are distinct; never invent a joint answer to save a draft.

## Seam map excerpt

Read the 09 row of the execution seam map and the ticket's blocked-by edges.
UI reaches GroupEngine through contexts/composition; durable domain changes belong to public engine/port contracts.
Preserve inquiry generation, owner checks, stable IDs and retry serialization across transient mounts.
Resolve Must-fix risks in the active slice before reporting DoD complete.

## Execution contract

Use /implement and /tdd at the agreed seams. Read their local SKILL.md instructions.
Capture failing regression evidence before the fix; run focused tests as work progresses.
Run root npm run typecheck, npm run depcruise -w packages/pic-web, npm test, and affected lint/browser checks.
No live database row cleanup or treatment-content deletion. Use local test doubles unless a remote gate is authorized.
Before committing, provide the orchestrator the final diff and test evidence for independent Standards/Spec review.
Commit scoped passing work with [W13-09] in its message. Update Resolution for every AC and use Status: closed
only after the orchestrator confirms complete evidence. Never fabricate passes or waive tests silently.
Stop after this ticket; do not begin another ticket or modify sibling source ownership.

## Acceptance criteria (verbatim)

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


## Out of scope (verbatim)

No unrelated optimization, broad refactor, new features, invented test passes, copied waivers,
data deletion, production deployment, automatic merge/push or implementation beyond the approved tickets.
Any newly discovered behavior gap is resolved in its owning ticket before final closure.

Implementation is authorized by the user; wait for prerequisites and serial dispatch.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.

[relocation-link-1]: w13-04-reversible-questionnaire-and-recovery.md
[relocation-link-2]: w13-05-clean-summary-and-polarity-view.md
[relocation-link-3]: w13-06-drawer-greeting-and-identity.md
[relocation-link-4]: w13-07-welcome-text-guide-and-video.md
[relocation-link-5]: w13-08-post-finish-routing-and-content-hygiene.md
