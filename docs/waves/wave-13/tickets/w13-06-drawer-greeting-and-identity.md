# W13-06 — Show a personal greeting and accurate account state in the drawer

**Status:** closed — implemented, independently reviewed and verified on 2026-10-22.
**Specification:** [Approved Wave 13 charter](../specs/wave-13-spec.md).
**Blocked by:** None.
**Blocking:** [W13-09](w13-09-integrated-journeys-and-wave-handoff.md).
**Execution gate:** Authorized as an independent branch alongside W13-02 architecture preparation.
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

No auth mechanism changes, profile editing, identity entitlement inference, new storage tables,
therapy state changes, sign-out side effects on opening the drawer, or deletion of personal data.

Implementation is authorized by the user; wait for prerequisites and serial dispatch.

## Resolution

### Solution path and decisions

The shared `IdentityDrawerStatus` appears in both the Frame and Player service drawers.
Composition reads the verified owner's profile, with verified Auth metadata as a fallback, and publishes
a presentation store keyed by owner and auth revision. Name reads neither write profiles nor establish identity.
The existing auth lifecycle publishes its revision; reset retains accurate Guest/verified status.
Inquiry draft bookkeeping now exposes a reactive read store so an unsubmitted topic appears as local work.
Identity, locally retained work, pending verification and promotion recovery are separate localized facts.
Unconfirmed saving never asserts that an RPC could not already have committed.

### Acceptance evidence

- [x] **AC-01:** Provider tests cover profile success, blank/missing name and profile-fetch failure fallback.
- [x] **AC-02:** Placeholder and email assertions pass; personal text is escaped and rendered with `bdi` isolation.
- [x] **AC-03:** Guest, checking, verified, pending verification, reauthentication and uncertainty are covered.
  A retained registration no longer masks checking, expiry or uncertain completion.
- [x] **AC-04:** Verified identity with an unsubmitted questionnaire still shows local-work feedback.
  A successful promotion followed by failed confirmation still exposes retained recovery separately.
- [x] **AC-05:** Delayed reads from a prior revision and a different account cannot replace the current name.
  The remote identity test also verifies revision advancement across sign-out and reauthentication.
- [x] **AC-06:** Only composition and the existing profile adapter seam read the profile; components use context stores.
  Browser transport permits only the verified owner's `GET profiles?select=full_name` and no therapeutic writes.
- [x] **AC-07:** Eleven Chromium cases cover both locales, Player/Frame greetings, reset confirmation,
  focus return, focus trap, inert background, small viewport, RTL direction and reduced motion.

### Verification and review

- `npm run typecheck`: pass across all workspaces.
- `npm run depcruise -w packages/pic-web`: pass, 771 modules / 1688 dependencies, zero violations.
- `npm run lint`: pass; changed-file 130-character and Git whitespace checks pass.
- `npm test`: 57 files / 587 tests pass, followed by engine and web dependency checks.
  Process-only worker cap 2 and the previously approved controlled registration address were supplied.
- Focused identity/provider suite: 2 files / 31 tests pass; both review regressions were observed red before green.
- `npm run test:browser -w packages/pic-web -- wave12-journey.browser.test.ts
  therapeutic-sheet.browser.test.ts returning-identity.browser.test.ts --workers=2`: 11 pass.
- Independent Standards and Spec reviews pass after corrections; see [review evidence](../audits/w13-06-implementation-review.md).
- Normal TLS remained enabled. One transient network failure was diagnosed with a read-only connectivity check
  before the successful full rerun. Final remote counts match the earlier baseline; no existing content was removed.

### Deviations and commit

The user's later orchestration charter explicitly permits this independent branch alongside W13-02 preparation.
The shared header also covers the Player's direct Sheet, within the same approved web-only presentation scope.
No engine, adapter, migration, auth mechanism or therapeutic behavior change belongs to this ticket.
The scoped implementation commit uses `[W13-06]`; the following checkpoint records its exact hash.
W13-02 remains in preparation; its unapplied SQL and red-test drafts are outside automatic discovery until its slice starts.
