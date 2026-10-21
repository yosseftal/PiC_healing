# W13-06 — Show a personal greeting and accurate account state in the drawer

**Status:** awaiting-human-review — implementation is not authorized.
**Specification:** [Approved Wave 13 charter](../specs/wave-13-spec.md).
**Blocked by:** None.
**Blocking:** [W13-09](w13-09-integrated-journeys-and-wave-handoff.md).
**Execution gate:** Human green light for the ticket suite, then completed prerequisites.
**Domain decisions:** DEC-017; Wave 12 owner-bound identity and recovery contracts.

## Objective & Context

Opening the service drawer shows the Event Manager's available name and truthful identity state,
without implying that an authenticated account has already saved the current local inquiry.

Wave 12 separates verified SDK identity from SessionEngine mode and therapeutic persistence.
Use the existing auth lifecycle and profile composition seam. The generic TherapeuticSheet remains an accessible
presentation primitive; identity belongs in its shared Frame composition.

## What to Build / Exact Scope

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

## End-to-End Demonstration

Open the drawer as Guest, then with a verified account with a name, then without one.
Expire identity while work remains unsaved and simulate a late prior-owner name response; no stale name appears.

## Acceptance Criteria

- [ ] **AC-01:** Verified own name produces a warm greeting; missing/failed name reads fall back without blocking the drawer.
- [ ] **AC-02:** The literal placeholder “השם שלך” and default email-as-name are never displayed.
- [ ] **AC-03:** Guest, checking, verified, verification pending, expired and uncertain states are truthfully distinguished.
- [ ] **AC-04:** Identity status never claims that the current group or Finish is saved.
- [ ] **AC-05:** Late name responses and cached names cannot cross account/revision boundaries.
- [ ] **AC-06:** Profile reads do not become component-owned adapter calls or writes.
- [ ] **AC-07:** Existing Sheet accessibility, reset confirmation and bilingual rendering remain intact.

## Testing Requirements

- Existing identity lifecycle integration tests plus drawer rendering with real provider composition.
- Exercise missing profile/name, fetch failure, delayed response, sign-out and two different account IDs.
- Prove a verified account with an unsaved draft still shows both facts distinctly.
- Keyboard/screen-reader-name and focus-return browser coverage in Hebrew and English.

Run typecheck, lint, dependency isolation and affected unit/integration/browser checks for the owned slice.
Use the scripts actually present in the repository; record commands and outcomes in Resolution.
Changes crossing persistence require both public-contract tests and real authorized database evidence.
No treatment-content file or database-row deletion is permitted without explicit target-specific human approval,
including fixture cleanup. Use an agreed isolated environment and retain fixtures if cleanup is not authorized.

## Definition of Done

- The complete demonstration works; every AC is linked to concrete passing evidence in Resolution.
- Relevant tests, typecheck, lint and dependency checks pass on the final diff.
- Existing owner isolation, Dumb Reflection, Blind-by-Default and EM Sovereignty contracts remain intact.
- Changes stay within this slice; shared modules have one writer at a time.
- Required content approvals and manual/environment limitations are recorded honestly.
- A scoped implementation commit references this ticket after authorization and review.
- The ticket index reflects its actual state; documentation and historical evidence remain preserved.

## Do Not Touch / Out of Scope

No auth mechanism changes, profile editing, identity entitlement inference, new storage tables,
therapy state changes, sign-out side effects on opening the drawer, or deletion of personal data.

The current preflight creates this document only. Do not execute its implementation steps until the user
approves the generated suite. Approval of the specification is not an instruction to start coding in this turn.

## Resolution

Not implemented. To complete after authorization: solution path, decisions, deviations, test evidence,
review outcome, commit, and explicit resolution for every AC above.
