# 07: Register and verify email while preserving the Guest inquiry

**Ticket ID:** W12-07

**Wave:** 12

**Status:** done

**What to build:** A new user registers with Name, Email, and Password, verifies the email address, and saves the same inquiry,
including after reloading the original browser during verification.

**Blocked by:** W12-06 — Recover interrupted promotion without loss or duplicate success.

**Source:** [Approved Wave 12 specification][relocation-link-1], Implementation Decisions D (Auth and Verification continuity);
User Stories 20, 22-25 and 28-30.
The nine-ticket breakdown and dependencies were approved without changes on 2026-10-13.

## Context Injection (verbatim)

> A non-null signup user alone is not verified identity.

## Owned vertical slice

Own registration and verification UI/messages, signUp and verification/resend coordination, and their web integration tests. Reuse
05's profile/promotion path and 06's recovery behavior.

## Acceptance criteria

- [x] AC-01: Provide Name/Email/Password registration and login-mode switching with correct labels/autocomplete. Trim name, store
  full_name in Auth metadata, retain non-secret input/focus between modes, and keep passwords transient and untrimmed.
- [x] AC-02: Use installed Supabase signUp. Require email verification before anchoring; a user without session enters
  verification pending, makes no therapeutic server writes, and retains the Guest draft and pending gate.
- [x] AC-03: Preserve group/session IDs, terminal answer, pending Finish kind, and existing locally persisted work across opening
  email and same-browser reload while verification is pending.
- [x] AC-04: After verification, establish a verified session via sign-in on the original browser or an allowed return callback,
  then reuse own-profile preparation and safe promotion without a second inquiry or duplicate success.
- [x] AC-05: Provide neutral delivery/resend guidance and recoverable states for expired links, rate limits, rejected credentials,
  offline status, and missing configuration. These states never discard the draft.
- [x] AC-06: Explain that another-device verification does not transfer the original local draft; direct the Event Manager back to
  the original browser without claiming cross-device Guest synchronization.
- [x] AC-07: Ordinary dismissal and switching forms preserve work. Explicit abandonment uses the existing discard confirmation;
  cancellation restores the same pending verification/Gate state.
- [x] AC-08: Ignore duplicate/stale verification callbacks and enforce owner/generation binding before promotion. Pending
  operations participate in the shared reset serialization.
- [x] AC-09: Verify a truly new signup with no manually seeded profile, actual email confirmation, own-profile initialization, and
  exactly one linked/unlinked promotion outcome through the existing pipeline.
- [x] AC-10: Verify RTL/LTR keyboard operation, live messages without focus theft, internal scrolling on small screens, and
  continuity through reload and retry.

## Verification and prior art

Use deterministic Auth responses for UI branches and real signup/verification evidence with a controlled test mailbox or approved
verification facility. Keep confirmation enabled and clean up isolated fixtures.

## Dependencies and exclusions

Environment prerequisites: email confirmation, working delivery, allowed return URL, and deployed own-profile RLS. Missing
settings are reported as external blockers; no hosted configuration or schema changes are part of this ticket. Coordinate shared
Auth writers with 08; no extra dependency edge is implied.

## Isolation bounds

- Implementation and tests: 100% inside `packages/pic-web`. This active ticket's Resolution is the documentation exception.
- Zero edits to `packages/pic-engine`, either adapter package or their tests, database migrations, backend schemas,
  RPC definitions, seeds, root tooling, manifests, or lockfiles. Read public contracts; call them unchanged.
- Adapter access stays in the existing web composition root/promote boundary; screens use contexts/actions.
- Preserve Dumb Reflection, Event Manager sovereignty, blind ratings, at most two direct main-frame choices,
  WCAG AA in RTL/LTR, and the approved scope exclusions.
- Treat the Wave 12 spec as frozen. Report an unmet public-contract dependency rather than widening this ticket.

## Completion contract

- Add behavioral tests at the existing application/feature seam and run relevant unit/browser checks, web typecheck,
  lint, and dependency isolation checks; preserve the inherited 442 unit/integration and 161 browser coverage.
- Record exact verification commands/results and changed-path evidence. Required unavailable infrastructure is
  unverified, not a skipped green result. Full assembled-wave gates belong to W12-09.
- Before implementation dispatch, the orchestrator supplies the seam map and ticket-specific spawn brief and checks
  blockers. Shared-file writer coordination is separate from the approved functional dependency graph.
- During implementation, complete a per-AC Resolution and ticket-scoped atomic commit using this ticket ID.
  Ticket persistence alone does not check off acceptance criteria, create implementation commits, or dispatch work.

## Resolution

Implementation verified at base `49800f1ed7aec50bfc394da85884e71bcfa2793b`; ticket closed by the orchestrator.
Independent final runtime and cleanup-only delta reviews report Standards 0 / Spec 0. AC-09 now has actual new-signup
confirmation, own-profile and linked/unlinked promotion evidence. Post-correction live reruns are externally blocked
by the hosted email-send rate limit. Full-suite evidence precedes only the test-error-reporting correction;
frontend behavior and signup assertions are unchanged. Repeat live gates remain required for the final wave release.

### Solution Path

- AC-01: Name/Email/Password registration and login switch use native labels, name/email/new-password/current-password
  autocomplete. Mode switches retain name/email and the same focused switch; passwords clear on mode switch and
  submission. Installed SDK receives trimmed `full_name` and exact untrimmed password. Modal and registration tests pass.
- AC-02: `register` invokes installed SDK `signUp`. A user without session creates only a web verification envelope;
  engine remains Guest and pending Finish/snapshot stay intact. No therapeutic adapter invocation occurs at registration.
- AC-03: Existing Guest repository retains group/session IDs, terminal answer, unit progress and Finish kind. The
  credential-free verification envelope restores email/generation intent and original pending session. Browser checks compare
  the non-null exact Guest blob before signup, after signup and after reload. An already frozen failed-login snapshot
  also survives registration/reload; a changed live response never replaces its original payload.
- AC-04: Original-browser explicit password sign-in re-verifies Auth identity, requires same-email verified owner/current
  generation/session/Finish kind, and reuses own-profile preparation and the existing promotion pipeline. Deterministic
  owner/freeze/recovery evidence passes. Actual new-signup confirmation, own-profile bootstrap and promotion passed
  with an isolated fresh account, including same-ID confirmation and original-client password sign-in.
- AC-05: Auth error categories map to authored Hebrew/English guidance for unconfirmed/expired/rejected/rate-limited
  requests, offline status and missing public config; provider text is never rendered. Resend uses SDK `resend` for the
  bound signup email. Error-state modal tests and browser resend/unconfirmed retry preserve the same draft.
- AC-06: Both locales explicitly explain that other-device verification does not transfer the local draft and instruct
  returning to the original browser. The real fixture uses a separate verification client then original-browser login;
  both the separate-client confirmation and original-client sign-in passed in the actual remote fixture.
- AC-07: Ordinary dismissal retains the existing Gate behavior. Mode switches preserve non-secret fields/work. The
  existing discard confirmation remains authoritative; cancellation restores the pending Gate and verification state.
  Browser checks prove focused cancellation restores the same non-null Guest blob in RTL/LTR.
- AC-08: Shared exclusive flow operations deduplicate signup/resend and serialize reset across their entire lifetimes.
  Reset clears the verification binding; stale save attempts cannot promote old work. Changed verified owner is rejected
  before profile/therapeutic writes. No automatic Auth callback invokes promotion. Verification cleanup occurs while
  durable promotion recovery remains available; reload retries its exact payload and retains one success effect.
- AC-09: VERIFIED by two actual remote passes using the user-approved test-only signup address, including the full
  web suite. Paginated admin lookup first proved the address unused. Installed SDK `signUp` created a fresh marked
  unconfirmed identity without a session, profile or therapeutic rows. The approved admin-generated signup link and
  separate-client `verifyOtp` confirmed the same Auth ID. Original-client password sign-in initialized its own profile
  through RLS and promoted linked/unlinked work with unchanged session IDs, units, terminal answers and Finish kinds.
  Each session produced one Timeline event and one use increment; duplicate save was rejected. Finally removed only
  the proven new marker-owned therapeutic rows and Auth account. No profile was manually seeded. Generated tokens,
  passwords/service-role credentials remained test-only and unprinted. SMTP delivery was not measured.
- AC-10: Chromium at 320x568 passes both Hebrew RTL and English LTR registration/verification/reload/resend/retry and
  discard-cancel flows, keyboard mode switching, preserved focus, internal scrolling and no horizontal overflow.
  Physical keyboard/visual viewport and Hebrew screen-reader checks remain manual release evidence.

### Architectural Decisions

- All runtime/tests/config remain inside `packages/pic-web`; this active Resolution is the sole document exception.
- One existing web-owned Supabase client serves signup, resend and verified login. Signup never manufactures engine
  authentication or promotes. SDK tokens remain SDK-owned; custom continuity contains only identity/display metadata,
  email/generation/pending Finish intent, and an owner-unbound already frozen snapshot when one exists.
- Reuse the existing own-profile RLS bootstrap, provider swap, safe promotion and recovery coordinator unchanged in
  purpose. The original frozen payload is never overwritten during mode switching or confirmation/reload.
- No engine/adapter/schema/migration/seed/root-tooling/manifest/lockfile/public-contract changes.

### Verification

- Red proof: `registration.test.ts` first failed because `register` was missing; trimmed metadata/exact password and
  session-null Guest preservation then passed.
- Red proof: modal registration first lacked the `Create an account` control; mode/input/focus behavior then passed.
- Red proof: resend/reset test first lacked `resendVerification`; serialized/deduplicated resend then passed.
- Red proof: four modal cases lacked rate-limit/expired/unconfirmed/rejected guidance; all then passed.
- Red proof: failed-login -> registration rejected owner-unbound work; same-session registration then passed.
- Red proof: registration/reload initially submitted changed `yes` instead of frozen `no`; persisted freeze then passed.
- Red proof: verification cleanup failure left no promotion envelope; cleanup ordering/reload retry then passed.
- Scoped commands: `npx vitest run packages/pic-web/src/registration.test.ts --maxWorkers=1` passed 5 tests;
  `npx vitest run packages/pic-web/src/persistence-gate-modal.test.tsx --maxWorkers=1` passed 15;
  `npx vitest run packages/pic-web/src/promotion-recovery.test.ts --maxWorkers=1` passed 25.
- `npm run typecheck -w packages/pic-web` passed at runtime/test freeze.
- From web workspace: `npx playwright test tests/registration.browser.test.ts --workers=2` passed 2 Chromium tests.
- With test-only `PIC_REGISTRATION_TEST_EMAIL` set to the approved synthetic address, the escalated normal-TLS command
  `npx vitest run packages/pic-web/src/registration.remote.test.ts --maxWorkers=1` passed 1/1 in 13.25s
  (actual remote test 8.67s), including fixture cleanup. No hosted configuration/schema changes.
- `npm run typecheck -w packages/pic-web` passed. With that same process-only email,
  `npm test -w packages/pic-web -- --maxWorkers=2` passed 37 files / 319 tests in 61.80s, including a second
  actual new-signup/confirmation/profile/promotion/cleanup pass. No skipped tests.
- `npm run depcruise -w packages/pic-web` passed: 762 modules / 1641 dependencies, zero violations.
- Initial `npx eslint packages/pic-web` found two `no-unsafe-finally` errors in remote-fixture cleanup. Parent approved
  a test-only correction preserving the primary failure and any cleanup failure in an `AggregateError` after cleanup.
  Assertions, ownership proof, timeout and TLS are unchanged. Final typecheck and the same ESLint command passed.
- Post-correction actual remote rerun reached real SDK signup and explicitly failed with
  `over_email_send_rate_limit` in 1.43s (4.19s total). This hosted prerequisite remains blocked; it is not a green/skip.
  Earlier successful Auth evidence remains valid for unchanged pipeline/assertions. No rate-limit bypass attempted.
- At 10:10:05 local time, over two minutes after the 10:07:43 primary attempt, the one authorized bounded alternative
  address run also failed with `over_email_send_rate_limit` (1.16s test / 2.71s total). Remote signup attempts stopped.
  A separate normal-TLS read-only paginated admin lookup then confirmed both approved addresses unregistered (zero).
- Before that test-only correction, from `packages/pic-web`, the combined Chromium command passed 18/18 in 33.4s:
  `npx playwright test tests/registration.browser.test.ts tests/persistence-gate.browser.test.ts`
  `tests/player-reset.browser.test.ts tests/inquiry-reset.browser.test.ts --workers=2` (one command).
  Final repeat after the correction passed 18/18 in 29.7s. Both runs used two workers and the owned Vite setup on 4173;
  neither overlapped the unit suite. Registration 2 + Persistence Gate 8 + Player reset 4 + inquiry reset 4 passed.
- Parent independently re-reviewed the final identity/storage fixes and the cleanup-only error-preservation delta:
  Standards 0 / Spec 0, including final formatting. Runtime remained frozen throughout final gates.
- Final line-length checks passed for all 15 changed/new web files; `git diff --check` passed. All Git worktree
  changes remain inside `packages/pic-web`; this ignored active-ticket Resolution is the sole documentation exception.
  HEAD remains `49800f1ed7aec50bfc394da85884e71bcfa2793b`; the original WIP stash remains intact for parent cleanup.
- A sandbox Vitest temp-cache rename produced EPERM once; the same scoped command passed with approved escalation.
  TLS verification was retained throughout; no timeout/retry weakening or skipped required tests.

### Deviations and external prerequisites

- Actual email confirmation and resulting new-profile promotion passed twice. The post-cleanup-correction rerun is
  blocked by hosted `over_email_send_rate_limit`; no test was skipped or weakened. The required remote case also
  fails explicitly if its test-only authorized address is unset.
- Approved generated-link verification proves Auth confirmation and same identity; it does not prove mailbox delivery.
  SMTP delivery/allowed return settings remain deployment evidence. Original-browser password sign-in is the selected
  continuity mechanism; custom callback-driven promotion is unnecessary and not implemented.
- No ticket commit is made by the implementation agent; parent owns independent reviews, final gates and closure.

[relocation-link-1]: ../specs/wave-12-spec.md
