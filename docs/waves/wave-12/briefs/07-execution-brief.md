# W12-07 execution brief

## Identity

- Ticket: W12-07 — Register and verify email while preserving the Guest inquiry
- Ticket specification: `.scratch/pic-tracer-bullet/issues/07-wave-12-registration-and-verification.md`
- Wave: 12. Dispatch authority covers all remaining Wave 12 tickets, 04 → 09 sequentially.
- Authorized for implementation after all declared blockers are closed and the preceding ticket is committed.
- Escalation: report concrete spec/contract conflicts to the orchestrator; do not widen scope.

## Permissions

Read-write: owned implementation/test modules inside `packages/pic-web` and this ticket's Resolution.
Own registration and verification UI/messages, signUp and verification/resend coordination, and their web integration tests.
Reuse 05's profile/promotion path and 06's recovery behavior.
Read-only: approved Wave 12 spec, CONTEXT.md, decisions.md, CLAUDE.md, public engine/adapter contracts,
and sibling tickets. Orchestrator owns seam map, handoff, tracking documents, and final commits.
- Implementation and tests: 100% inside `packages/pic-web`. This active ticket's Resolution is the documentation exception.
- Zero edits to `packages/pic-engine`, either adapter package or their tests, database migrations, backend schemas,
  RPC definitions, seeds, root tooling, manifests, or lockfiles. Read public contracts; call them unchanged.
- Adapter access stays in the existing web composition root/promote boundary; screens use contexts/actions.
- Preserve Dumb Reflection, Event Manager sovereignty, blind ratings, at most two direct main-frame choices,
  WCAG AA in RTL/LTR, and the approved scope exclusions.
- Treat the Wave 12 spec as frozen. Report an unmet public-contract dependency rather than widening this ticket.

## Frozen requirements (verbatim)

> A non-null signup user alone is not verified identity.

Read the full approved `docs/specs/wave-12-spec.md` section cited in the ticket before implementation.
Prior tracer-bullet/skill paths are historical references, not replacements for this Wave 12 specification.

## Glossary injection

> **Event Manager**:
> The user's role: active director of their own healing, not a passive patient or generic end-user.

> **Atomic Focus**:
> One muscle-test question at a time; small sequential steps in the Player.

Read relevant DEC entries in the approved spec's references when a therapeutic invariant is involved.
Canonical identifiers remain unchanged; the approved Wave 12 UI terminology takes precedence for presentation.

## Seam map excerpt

- Seam: Signup → verification → promotion.
- Owns: registration and same-browser verification.
- Consumer/downstream: 09 assembled journey.
- Risk to verify: Email delivery/return URL are environment prerequisites.
- Full map: `docs/audits/wave-12-seam-map.md`.

## Execution contract

1. Apply `C:/Users/benda/.agents/skills/implement/SKILL.md`; use its TDD workflow at these existing seams.
2. Make one complete verifiable slice. Preserve prior-ticket changes; this is a shared checkout with serialized writers.
3. Run scoped typecheck, scoped web tests, depcruise, relevant browser tests, and lint. Do not weaken baseline coverage.
   Root-cwd commands: `npm run typecheck -w packages/pic-web`, `npm test -w packages/pic-web`,
   `npm run depcruise -w packages/pic-web`. Browser tests run from the web workspace with two workers.
4. Keep every new/changed line within the repository's 130-character limit; do not add dependencies or change lockfiles.
5. Report AC-by-AC evidence and update Resolution. Leave status pending closure until orchestrator verifies.
6. Ask orchestrator for the review fixed point after implementation; the orchestrator conducts the two-axis
   code-review and commits verified work with `[W12-07]`. Do not commit or dispatch another implementation yourself.
7. If sandbox infrastructure blocks a test, report the exact failure promptly; do not bypass TLS, skip tests,
   or alter application behavior to accommodate the harness.

## Acceptance Criteria (checklist)

- [ ] AC-01: Provide Name/Email/Password registration and login-mode switching with correct labels/autocomplete. Trim name,
  store full_name in Auth metadata, retain non-secret input/focus between modes, and keep passwords transient and untrimmed.
- [ ] AC-02: Use installed Supabase signUp. Require email verification before anchoring; a user without session enters
  verification pending, makes no therapeutic server writes, and retains the Guest draft and pending gate.
- [ ] AC-03: Preserve group/session IDs, terminal answer, pending Finish kind, and existing locally persisted work across
  opening email and same-browser reload while verification is pending.
- [ ] AC-04: After verification, establish a verified session via sign-in on the original browser or an allowed return
  callback, then reuse own-profile preparation and safe promotion without a second inquiry or duplicate success.
- [ ] AC-05: Provide neutral delivery/resend guidance and recoverable states for expired links, rate limits, rejected
  credentials, offline status, and missing configuration. These states never discard the draft.
- [ ] AC-06: Explain that another-device verification does not transfer the original local draft; direct the Event Manager
  back to the original browser without claiming cross-device Guest synchronization.
- [ ] AC-07: Ordinary dismissal and switching forms preserve work. Explicit abandonment uses the existing discard
  confirmation; cancellation restores the same pending verification/Gate state.
- [ ] AC-08: Ignore duplicate/stale verification callbacks and enforce owner/generation binding before promotion. Pending
  operations participate in the shared reset serialization.
- [ ] AC-09: Verify a truly new signup with no manually seeded profile, actual email confirmation, own-profile
  initialization, and exactly one linked/unlinked promotion outcome through the existing pipeline.
- [ ] AC-10: Verify RTL/LTR keyboard operation, live messages without focus theft, internal scrolling on small screens, and
  continuity through reload and retry.


## Approved verification facility (2026-10-15)

The user explicitly selected a Supabase-generated verification link for an isolated test account.
Use real signUp and real confirmation/session establishment through that link; do not replace signup with
admin-createUser(email_confirm:true) or manually seed the missing profile case.
Admin capabilities remain test-only link retrieval/fixture cleanup; never ship service-role credentials.
This proves Auth confirmation, not SMTP/mailbox delivery. Record delivery evidence separately and truthfully.

Primary API references checked during preflight:
- [Supabase generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink)
- [Supabase verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp)

Read installed SDK types before selecting signup-token verification arguments. Keep generated links/tokens
out of logs. Confirm the genuinely new signUp identity first, then generate its confirmation link in the
test-only admin fixture and establish verified identity in the original browser. Assert user-ID continuity.

## Verified dispatch base

W12-06 closed at 49800f1ed7aec50bfc394da85884e71bcfa2793b; working tree clean.
Its exact frozen recovery coordinator, public promotion guards, separate recovery store, and reset serialization
are authoritative. Reuse them; do not introduce an alternate save path. Web305/Chromium24/reviews0-0 passed.

## Resume authorization 2026-10-15

User authorizes synthetic signup test-e2e@pic-healing.com, alternatively automated-test@pic-healing.com.
Check unused before signup; never delete preexisting accounts. Use test-only PIC_REGISTRATION_TEST_EMAIL.
Stash86e88ae0b8629b350e81cd0d6d43d7457814f3c0 restored at49800f1; keep stash until verified commit.
Quota refreshed to primary0% / weekly0%, ordinary allowed. Resume07 then08 then09 sequentially.
Final prior fixes need independent re-review and all final gates; see active07 Resolution checkpoint.
