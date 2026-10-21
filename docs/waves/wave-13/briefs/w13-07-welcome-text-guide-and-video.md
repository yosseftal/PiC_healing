# W13-07 isolated implementation brief

## Identity and authorization

Ticket: [W13-07](../tickets/w13-07-welcome-text-guide-and-video.md).
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

1. Prepare a source-checked Hebrew adaptation with timestamp references for actual physical steps, and concise
   welcome/background copy grounded in official PIC pages. Present the concrete copy for human approval.
   Preserve the user's exact questionnaire preparation; do not substitute it with the adaptation.
2. If the source cannot be transcribed/verified, retain the source link and draft structure, record the precise
   content blocker, and do not claim the practical-text AC complete. No invented technique or medical interpretation.
3. Implement the welcome surface with **לתחילת השאלון** and **על השיטה ומבחן השרירים** as the two primary choices.
   Existing active work, Player, verification and persistence recovery take precedence over first-run welcome.
4. Provide freely accessible, skippable educational text and a drawer entry to revisit it. Return to the exact
   invoking questionnaire step using W13-04's lifecycle; reading is not a persistence or treatment event.
5. Embed the verified official YouTube source using a click-to-load container, normal playback controls,
   no autoplay, a localized title and an external source-link fallback. Verify actual embed permission.
6. Stop/unmount playback when leaving or closing the guide. Do not collect viewing completion, use count,
   Timeline events or therapeutic state from video activity.
7. Keep the approved text usable without the external video/network after application assets are available.
   Show a calm unavailable-video fallback; do not block the questionnaire when YouTube is unreachable.
8. Use typed Hebrew/English content, stable section IDs and provenance. Confirm any caption track before
   promising it; an approved text alternative remains required. English fallback must identify its actual language.
9. Test keyboard focus across the embed, narrow-screen dimensions, zoom, return controls and reduced motion.
   Respect the production artifact boundary; do not package an MP4 or add offline media caching.


## Domain references

Read the ticket's cited DEC entries in full. Canonical terms remain Symptom Group, Symptom,
Polarity, Intensity, Event Manager and Inquiry Session; Questionnaire is presentation language only.
DEC-010: independent valence and magnitude; W13-D2 narrows initial entry to 1–10 only.
DEC-011: both prior dimensions hidden by default; explicit Reveal remains available for re-rating.
DEC-017: actual verified identity and persistence are distinct; never invent a joint answer to save a draft.

## Seam map excerpt

Read the 07 row of the execution seam map and the ticket's blocked-by edges.
UI reaches GroupEngine through contexts/composition; durable domain changes belong to public engine/port contracts.
Preserve inquiry generation, owner checks, stable IDs and retry serialization across transient mounts.
Resolve Must-fix risks in the active slice before reporting DoD complete.

## Execution contract

Use /implement and /tdd at the agreed seams. Read their local SKILL.md instructions.
Capture failing regression evidence before the fix; run focused tests as work progresses.
Run root npm run typecheck, npm run depcruise -w packages/pic-web, npm test, and affected lint/browser checks.
No live database row cleanup or treatment-content deletion. Use local test doubles unless a remote gate is authorized.
Before committing, provide the orchestrator the final diff and test evidence for independent Standards/Spec review.
Commit scoped passing work with [W13-07] in its message. Update Resolution for every AC and use Status: closed
only after the orchestrator confirms complete evidence. Never fabricate passes or waive tests silently.
Stop after this ticket; do not begin another ticket or modify sibling source ownership.

## Acceptance criteria (verbatim)

- [ ] **AC-01:** A source-verified practical Hebrew adaptation is explicitly approved before being shipped.
- [ ] **AC-02:** Welcome explains purpose, available actions and Sigal’s background with traceable copy provenance.
- [ ] **AC-03:** Education remains free, skippable and revisitable without an account or therapeutic completion event.
- [ ] **AC-04:** Active inquiry/Player/persistence recovery is never replaced by onboarding.
- [ ] **AC-05:** The W13-07V container plays the official source only after activation and actual embedding is verified.
- [ ] **AC-06:** Playback stops on close/leave; the exact questionnaire draft and return location survive.
- [ ] **AC-07:** Blocked/unavailable video has a source-link fallback and never blocks text or questionnaire use.
- [ ] **AC-08:** No captions, translation or physical instructions are claimed without verification/approval.
- [ ] **AC-09:** Hebrew/English, keyboard focus, small-screen sizing and screen-reader frame naming are usable.
- [ ] **AC-10:** No bundled video, custom player infrastructure, treatment metadata or tracking events are introduced.


## Out of scope (verbatim)

No custom streaming stack, video download/redistribution, offline media cache, autoplay, CMS,
view tracking, Unified Player instance, therapeutic completion marker, new clinical claims or invented instructions.
Do not weaken the production output allowlist to admit an arbitrary media asset.

Implementation is authorized by the user; wait for prerequisites and serial dispatch.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.
