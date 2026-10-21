# W13-04 isolated implementation brief

## Identity and authorization

Ticket: [W13-04](../tickets/w13-04-reversible-questionnaire-and-recovery.md).
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

1. Lift title, pending topic text, active initial-rating input, member IDs, order, pending revision and return
   destination above individual screen mounts. Use the existing inquiry owner and generation as lifecycle keys.
2. Add a persistent accessible Back control in questionnaire screen chrome, outside the two primary decisions.
   Entry returns to introduction/prior entry; rating returns to prior topic/list; joint returns to list;
   advisory returns to joint; summary permits revisiting; selection returns to summary.
3. Preserve committed engine facts while changing the displayed questionnaire location. A screen revisit is not
   an unfinalize operation and does not revoke an actual prior answer for unchanged membership.
4. Serialize navigation with in-flight writes. Expose progress/recovery; avoid clearing input while a write
   settles. Suppress stale callbacks after reset or owner change using the established lifecycle.
5. Use the existing explicit new-inquiry/reset confirmation only for discarding work. Back never invokes it.
   Cancel/reset behavior and separate account/locale provider lifetime remain as delivered in Wave 12.
6. If application browser Back participates, route it through the same transition owner; never use browser
   history as the authoritative domain state. Preserve safe return from help overlays.
7. Version retained web drafts and show honest reload limits. Guest records retain established recovery;
   authenticated reload remains same-owner verified read-only where no public resume contract exists.
8. Remove any directional dead ends introduced by questionnaire navigation. Player manual Back/Skip/Done
   controls remain excluded, and external tab closure is not promised as cross-device draft preservation.


## Domain references

Read the ticket's cited DEC entries in full. Canonical terms remain Symptom Group, Symptom,
Polarity, Intensity, Event Manager and Inquiry Session; Questionnaire is presentation language only.
DEC-010: independent valence and magnitude; W13-D2 narrows initial entry to 1–10 only.
DEC-011: both prior dimensions hidden by default; explicit Reveal remains available for re-rating.
DEC-017: actual verified identity and persistence are distinct; never invent a joint answer to save a draft.

## Seam map excerpt

Read the 04 row of the execution seam map and the ticket's blocked-by edges.
UI reaches GroupEngine through contexts/composition; durable domain changes belong to public engine/port contracts.
Preserve inquiry generation, owner checks, stable IDs and retry serialization across transient mounts.
Resolve Must-fix risks in the active slice before reporting DoD complete.

## Execution contract

Use /implement and /tdd at the agreed seams. Read their local SKILL.md instructions.
Capture failing regression evidence before the fix; run focused tests as work progresses.
Run root npm run typecheck, npm run depcruise -w packages/pic-web, npm test, and affected lint/browser checks.
No live database row cleanup or treatment-content deletion. Use local test doubles unless a remote gate is authorized.
Before committing, provide the orchestrator the final diff and test evidence for independent Standards/Spec review.
Commit scoped passing work with [W13-04] in its message. Update Resolution for every AC and use Status: closed
only after the orchestrator confirms complete evidence. Never fabricate passes or waive tests silently.
Stop after this ticket; do not begin another ticket or modify sibling source ownership.

## Acceptance criteria (verbatim)

- [ ] **AC-01:** Every questionnaire location exposes the specified accessible Back destination.
- [ ] **AC-02:** Pending topic, optional title, active score input, IDs, priority and revision survive screen remounts.
- [ ] **AC-03:** Back performs no reset, deletion, archival, finalization, Finish or use-count mutation.
- [ ] **AC-04:** Pending writes settle or expose retry without losing the draft; stale callbacks cannot reopen discarded work.
- [ ] **AC-05:** New-inquiry discard still requires its established confirmation; cancellation restores original focus/work.
- [ ] **AC-06:** Locale changes and opening/closing help preserve the draft and return target.
- [ ] **AC-07:** Identity changes cannot show or submit another owner’s retained draft.
- [ ] **AC-08:** Reload limitations are truthful; no private engine hydration is added to claim unsupported resumption.
- [ ] **AC-09:** Player Navigation Tree and exit semantics remain unchanged.
- [ ] **AC-10:** Keyboard focus and reduced-motion transitions work in both text directions.


## Out of scope (verbatim)

No new router-owned therapeutic state machine, clearing all localStorage, forced sign-out, data deletion,
general authenticated group hydration, or Player navigation redesign. No change to DEC-018 replay semantics.

Implementation is authorized by the user; wait for prerequisites and serial dispatch.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.

[relocation-link-1]: w13-01-instant-questionnaire-and-initial-rating.md
[relocation-link-2]: w13-03-renewed-joint-answer-after-addition.md
