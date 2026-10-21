# W12-08 review checkpoint — 2026-10-15

Base/last verified commit:05bad952703626cb5bbb2d42682848c4c8adb66d (W12-07).
W12-08 is unverified and must not be closed or committed as complete. W12-09 is not dispatched.

## Standards review

One P2: permit a safe exit from uncertain Finish. composition-root.ts rejects reset when a paused Finish has
partial completion; auth-lifecycle.ts parks an ambiguous Timeline append permanently. The uncertain modal hides
reauthentication, so New symptom group has no successful path. CLAUDE.md §4 requires avoiding dead-end UX.
Retain owner-bound unresolved outcome, forbid replay/Saved claims, and allow explicit informed focus detachment
without deleting anchored records. No other actionable documented-standard/Fowler findings were reported.

## Spec review

- P1: PersistenceGateModal pending/submitting/ref state remains locked by the original signInAndPromote promise.
  Expiry during that promise pauses the exact port call, but pending hides reauthentication and reset. AC-04
  requires localized reauthentication preserving intent. Use independent reauthentication submission state and
  prove original form submit -> expiry -> same-owner credentials through dialog -> exact-once completion.
- P2: reset clears authenticated-focus marker; subsequent authenticated createDraftGroup/startSession does not
  restore it before persisting active pointers. Reload can then use Guest storage to hydrate server-only IDs.
  For a Player, UnifiedPlayerScreen returns null for its missing Guest record, producing a blank app.
  Mark authenticated focus before publishing/persisting new authenticated work; prove reset -> new Player -> reload
  and answered staged group -> reload cannot restore authenticated workspace through Guest storage.

## Bounded fix plan accepted by orchestrator

1. Independent reauthentication submitting/ref state, preserving original save serialization and exact call resume.
2. Confirmed uncertain focus detachment durably records owner/generation/session/uncertain Timeline facts BEFORE
   canceling parked continuation. Retain anchored records, never replay/claim Saved, do not carry old partial
   markers into new focus. Unconfirmed reset and cancellation retain work; storage failure prevents detachment.
3. Mark successful subsequent authenticated group/Player focus before persisted facts can be interpreted as Guest.

No backend/schema/engine/adapter edits, general receipt reconciliation or authenticated workspace hydration.
Each material fix needs red/green proof and narrow independent re-review before verified closure.

## User decisions already resolved

- Owner-bound web draft staging APPROVED; accidental earlier blocker-only answer withdrawn. Do not re-ask.
- Full reload retained staged envelopes are same-verified-owner read-only; public hydration limits are explicit.
- Manual physical keyboard/safe-area/zoom/Hebrew screen-reader checks: Pending Manual QA Verification in final
  docs/waves/wave-12/handoffs/wave-12-handoff.md. Automated Playwright/ARIA checks remain required; do not re-ask device
  availability.
- Actual signup may use test-e2e@pic-healing.com or automated-test@pic-healing.com via PIC_REGISTRATION_TEST_EMAIL.
  Generated verification links approved; no claim of SMTP delivery. Marker-owned isolated cleanup remains required.

## Verification known before final writer checkpoint

- Focused65/65 in4files green. Typecheck and lint passed before full scoped run.
- Real returning-identity journey5/5 passed, including full scoped run: SDK restore/sign-out/same-owner reauth,
  raw23502 limitation, real promotion, new staged group/symptom/rating, zero therapeutic rows before actual answer,
  same IDs saved after answer, subsequent linked Finish Timeline2/use_count2, reset preserves saved group.
- Initial combined remote case exceeded unchanged5000ms; split into explicit state checkpoints with all assertions
  retained and no timeout increase. Final combined returning remote+deterministic run22/22 passed14.10s.
- Late partial-Finish/reset row uses removed-guard sensitivity proof, not a claim of historical test-first order.
- Full scoped run68.45s:37 passed/2 failed files;339 passed/1 failed tests plus source-cache suite import failure.
  Real registration failed over_email_send_rate_limit; do not skip, weaken, or call it green.
- source-cache Node import failure came from eager localStorage access. Writer applied a minimal environment
  guard after freeze; its final verification is in the active ticket Resolution/writer checkpoint.
- Browser session75904 was the sole running command at quota halt; writer must record final output before stash.

## Final preservation result

- All15 web paths preserved with --include-untracked in stashac51f52dd23fbeb5589be1117b663a3ffa965db4.
- HEAD remains verified07:05bad952703626cb5bbb2d42682848c4c8adb66d. git status --porcelain=v1 is empty.
- No active writer/test processes remain. Browser75904 completed16/16 in27.8s; not interrupted.
- Node source-cache regression after minimal guard passed2/2 in1.03s. Subsequent typecheck/lint/depc passed;
  depcruise766modules/1668dependencies,zero violations. Full scoped gate was NOT rerun; signup quota stillunverified.
- Resume using git stash apply ac51f52dd23fbeb5589be1117b663a3ffa965db4 on checked clean verified07.
  Do NOT apply superseded07 stash86e88ae. Keep backups until verified08 closure.
- Active08 Resolution contains complete AC evidence/chronology/resume checklist. All3 review fixes remain open.

Quota92% primary at halt. Resume08 fixes/gates/reviews before any09 dispatch; do not commit unverified WIP as done.
