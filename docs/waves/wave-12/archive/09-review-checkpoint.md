# W12-09 resume checkpoint

Base/last verified commit:bf1ecf26848aa9ca0eeeeda255c00d4c11079295 (W12-08).
Recoverable stash:5b8bc6d9dc30355b98868f85226a5b48bde82490. Includes6webpaths, working tree CLEAN.
Apply this stash once onto checked clean08. Do NOT apply old08ac51f52 or07stash86e88ae.
No active writer/runners remain. W12-09 is unverified, not committed or closed.

## Completed implementation and review

- Four new files:tests/wave12-journey.browser.test.ts, wave12-journey.fixture.tsx/.html, wave12-transport.ts.
  Actual AppProviders/GuestModeShell/GuestFlowRouter, Auth SDK, engine and adapter calls; mocks intercept HTTP only.
  Four cases cover each locale's linked registration/confirmation/promotion/subsequent inquiry and unlinked returning
  login/FinishAnyway/recovery, IDs/ratings/progress/terminal/pendingkind/counts, locale/alias and explicit ARIA snapshots.
- All4cases passed13.0s and passed within the first full run. Initial test-setup expectation fixes are recorded.
- Full179run163passed/16failed6.3m, solely two inherited expectation patterns,8locale/viewport cases each:
  bilingual-guest-flow measured inaccessible Player contrast after modal Gate; localized-player expected immediate
  background Sheet access after reload instead of restored Gate. No runtime defect or other browser failure found.
- Corrected bilingual-guest-flow.browser.test.ts retains all frame/document geometry and nonempty4.5contrast:
  Frame before Gate, active Gate afterward. Corrected localized-player.browser.test.ts asserts restored Gate,
  snapshots pending work, Escape dismisses and preserves exact snapshot, then all original Sheet/FinishAnyway checks.
- Initial independent Standards0/Spec0; final narrow re-review of those two corrections also Standards0/Spec0.
  No skips/retries/threshold changes. The corrections are frozen but NOT yet rerun (quota halt94%).

## Gates and current blockers

- Root typecheck/lint PASS. Scoped typecheck/depc/build PASS; build2708modules with inherited warnings.
- Exact root npm test used VITEST_MAX_WORKERS=2 and approved PIC_REGISTRATION_TEST_EMAIL, normalTLS.
  FAILED107.53s:53passed/1failedfiles,559passed/1failedtests(560). Sole failure is actual signup
  over_email_send_rate_limit. At14:16UTC result reported; earlier sends passed13:46UTC and13:51UTC.
  Do not retry until real provider cooldown/state change; no hosted settings edits or fixture bypass.
- Root test's chained dependency gate did NOT execute, but parent then ran exact
  npm run depcruise --workspaces --if-present separately:PASS9.61s,engine72modules/199dependencies,
  web766modules/1670dependencies,zero violations.
- Scoped web347/39 pass on final08 source is still exact for all runtime/unit/scripts/config, since09 changes only
  browser files. Final root suite must pass and includes all those web cases; do not consume needless signup probes.
- Hosted quota and corrected full Chromium rerun are outstanding gates, not waived/skipped/green.

## Resume sequence

1. Verify clean08, apply exact09stash. Read active09 Resolution's13AC evidence map and09 execution brief.
2. No implementation rewrite needed. Run corrected targeted20cases (new4+bilingual8+localizedPlayer8), then
   full npx playwright test --workers=2 from packages/pic-web. Use established escalated host Chromium access.
3. Run exact root npm test with processenv VITEST_MAX_WORKERS=2 and approved synthetic email after actual cooldown.
   Preserve fixture cleanup/TLS/assertions. Heavy Vitest/Chromium runners remain sequential.
4. Verify unchanged source equivalence, final line/diff/seam audit and gate counts. Re-review any material new delta.
5. Once required automated gates pass, parent persists closed09record, atomic09commit and immediate status checkpoint.
6.  Create docs/waves/wave-12/handoffs/wave-12-handoff.md with all verified commit hashes/results/approvals; final notes already
   prepared.
   Record physical keyboard/safe areas/zoom/Hebrew reader as Pending Manual QA Verification (explicit user approval).
7. Commit final handoff documentation and verify completely clean Git tree. Report Wave12 completion only then.

Runtime/tests remain strictly packages/pic-web; no engine/adapter/schema/migration/dependency/root-tooling edits.
Owner-bound staging/read-only reload and generated verification links are already approved; do not re-ask.
