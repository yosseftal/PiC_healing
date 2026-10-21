# W13-06 isolated implementation brief

## Identity and authorization

Ticket: [W13-06](../tickets/w13-06-drawer-greeting-and-identity.md).
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

1. Add **שלום {name}** for a verified identity with an available nonblank own-profile name.
   Render literal text with bidi isolation. Use **שלום** when the name is missing or cannot be read.
2. Read the verified owner's existing profile through composition. Verified auth full_name may be a fallback;
   do not overwrite the profile or expose email as the default greeting.
3. Show **מצב אורח** for Guest and **מחוברת לחשבון** for verified identity, with accurate localized checking,
   reauthenticate and uncertainty states. Pending email verification is not verified authentication.
4. Keep separate unsaved, pending promotion and uncertain-completion feedback. Never infer saved work from a badge.
5. Bind name reads/cache to owner and auth revision. Clear stale results at sign-out, expiry, reset identity
   or account change; a delayed response for the previous owner cannot populate the drawer.
6. Preserve existing dialog focus trap, restore focus, reset confirmation and language controls.
   Do not introduce another auth client, profile-edit form or mandatory login.


## Domain references

Read the ticket's cited DEC entries in full. Canonical terms remain Symptom Group, Symptom,
Polarity, Intensity, Event Manager and Inquiry Session; Questionnaire is presentation language only.
DEC-010: independent valence and magnitude; W13-D2 narrows initial entry to 1–10 only.
DEC-011: both prior dimensions hidden by default; explicit Reveal remains available for re-rating.
DEC-017: actual verified identity and persistence are distinct; never invent a joint answer to save a draft.

## Seam map excerpt

Read the 06 row of the execution seam map and the ticket's blocked-by edges.
UI reaches GroupEngine through contexts/composition; durable domain changes belong to public engine/port contracts.
Preserve inquiry generation, owner checks, stable IDs and retry serialization across transient mounts.
Resolve Must-fix risks in the active slice before reporting DoD complete.

## Execution contract

Use /implement and /tdd at the agreed seams. Read their local SKILL.md instructions.
Capture failing regression evidence before the fix; run focused tests as work progresses.
Run root npm run typecheck, npm run depcruise -w packages/pic-web, npm test, and affected lint/browser checks.
No live database row cleanup or treatment-content deletion. Use local test doubles unless a remote gate is authorized.
Before committing, provide the orchestrator the final diff and test evidence for independent Standards/Spec review.
Commit scoped passing work with [W13-06] in its message. Update Resolution for every AC and use Status: closed
only after the orchestrator confirms complete evidence. Never fabricate passes or waive tests silently.
Stop after this ticket; do not begin another ticket or modify sibling source ownership.

## Acceptance criteria (verbatim)

- [ ] **AC-01:** Verified own name produces a warm greeting; missing/failed name reads fall back without blocking the drawer.
- [ ] **AC-02:** The literal placeholder “השם שלך” and default email-as-name are never displayed.
- [ ] **AC-03:** Guest, checking, verified, verification pending, expired and uncertain states are truthfully distinguished.
- [ ] **AC-04:** Identity status never claims that the current group or Finish is saved.
- [ ] **AC-05:** Late name responses and cached names cannot cross account/revision boundaries.
- [ ] **AC-06:** Profile reads do not become component-owned adapter calls or writes.
- [ ] **AC-07:** Existing Sheet accessibility, reset confirmation and bilingual rendering remain intact.


## Out of scope (verbatim)

No auth mechanism changes, profile editing, identity entitlement inference, new storage tables,
therapy state changes, sign-out side effects on opening the drawer, or deletion of personal data.

Implementation is authorized by the user; wait for prerequisites and serial dispatch.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.
