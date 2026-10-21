# 03: Start a new Symptom Group during creation and inquiry

**Ticket ID:** W12-03

**Wave:** 12

**Status:** done

**What to build:** From creation, symptom addition, joint inquiry, summary, or treatment selection, the Event Manager can
explicitly start a fresh group and cancel without losing the current draft.

**Blocked by:** None (can start immediately).

**Source:** [Approved Wave 12 specification](../../specs/wave-12-spec.md), Implementation Decisions A; User Stories 1-10.
The nine-ticket breakdown and dependencies were approved without changes on 2026-10-13.

## Context Injection (verbatim)

> A fresh group is created through
> GroupEngine only when the Event Manager submits the new name; reset itself creates no empty persisted group.

## Owned vertical slice

Own the common utility reset action, web reset coordinator, draft-dirty reporting, flow generation/facts, and non-Player inquiry
integration. Necessary small prefactoring belongs in this working slice; Player and Gate integration is 04.

## Acceptance criteria

- [x] AC-01: Expose קבוצת סימפטומים חדשה / New symptom group in the common Utility Drawer on group creation, symptom
  addition/rating, joint treatment, summary, and treatment selection; add no third direct main-frame choice.
- [x] AC-02: An empty initial screen resets without prompting. Typed group text before an ID exists, unsaved symptom/rating
  input, and unanchored Guest records require confirmation; active-ID presence alone is not the dirty predicate.
- [x] AC-03: Confirmation offers keeping the inquiry or discarding its local draft and starting new. Cancel, Escape, and outside
  dismissal preserve exact inputs, screen, records, and rating visibility.
- [x] AC-04: Confirmed reset clears active group/player pointers, addition/finalization/summary flags, local draft/recovery
  state, and reveal overrides in one visible transition to a clean creation screen, even if the current screen is already
  creation.
- [x] AC-05: Settle outstanding writes before cleanup and invalidate stale callbacks with a web-owned flow generation; a delayed
  create/add/rate/load cannot reopen or recreate the discarded inquiry.
- [x] AC-06: Clear owned Guest storage after flow setters have finished writing. Storage or pending-write failure retains
  recoverable work and presents localized retry, without a false success announcement or global browser-storage clear.
- [x] AC-07: Reset detaches focus without deleting/archiving/renaming saved groups or invoking Finish, Finish Anyway, sign-out,
  or use-count changes. Locale/identity providers remain mounted and existing preferences remain intact.
- [x] AC-08: Use controlled Sheet confirmation without stacked focus traps; initial focus favors keeping work, cancel restores
  the trigger, and success closes the Sheet and focuses/announces the initial heading or name field in both locales.
- [x] AC-09: Introduce a production action through existing web contexts/composition, not a test-reset helper or engine-internal
  mutation. New group creation still uses the public GroupEngine contract after the next name submission.

## Verification and prior art

Extend assembled flow/creation/rating tests and keyboard browser cases. Include initial typed-only data, finalized Guest data,
persisted records via existing test seams, delayed async responses, and storage rejection.

## Dependencies and exclusions

This ticket starts the reset lifecycle seam consumed by 04 and later auth integration. It does not depend on 01 or 02; preserve
provider state generically.

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

Implemented, reviewed, and verified. Implementation fixed point: `4fb71c3`.

### Solution Path

| AC | Evidence and outcome |
| --- | --- |
| AC-01 | Explicit reset eligibility on creation, add/rate, joint, summary, and picker Frames; common Sheet utility. |
| AC-02 | Dirty reports include typed-only names and symptom/rating drafts; Guest ownership requires confirmation. |
| AC-03 | Controlled Sheet offers keep/discard; cancellation retains inputs and rating values. Keyboard tests cover Escape. |
| AC-04 | Reset clears group/player pointers and all addition/finalization/summary flags; flow generation remounts drafts. |
| AC-05 | Entire UI compounds and public engine actions are tracked; drain closes admission before asynchronous cleanup. |
| AC-06 | Flow persistence is awaited and failures reported; pointer rollback retains work when owned-storage removal fails. |
| AC-07 | Saved-port tests preserve records, provider/identity, locale, and alias; reset never invokes Player Finish actions. |
| AC-08 | One Sheet confirmation, keep-first focus, cancellation trigger restoration, initial-input focus and localized status. |
| AC-09 | Production reset context/composition action; no engine-private or test-reset API use; name submission creates group. |

`inquiry-reset.test.tsx` exercises typed-only cancellation/reset, empty reset, delayed create, failed storage removal,
compound add/rate failure, delayed picker parsing/session creation, admission during cleanup, and all inquiry stages.
`composition-root.test.ts` adds outstanding pointer-write rejection/retry and anchored ownership with/without unsaved input.
Four browser cases exercise Hebrew/English keyboard focus, cancellation, confirmed reset, storage cleanup, and creation
only after the next submitted name at 320px and 1440px.

### Architectural Decisions

- Reset orchestration stays in web composition, consuming unchanged public engine/adapter APIs.
- The operation drain covers complete UI callbacks, including add-then-rate and parse-then-start continuations.
  A failure epoch detects nested failures even when a UI recovery hook handles the rejection.
- Operation admission closes synchronously when draining completes and reopens after confirmation evaluation/cleanup.
- The coordinator awaits persisted flow writes, writes cleared pointers, removes only the owned Guest blob last,
  and publishes cleared in-memory flow facts only after cleanup succeeds. Cleanup failure restores persisted pointers.
- Generation invalidates reflected Player reads and remounts only the routed flow subtree; providers retain identity,
  locale, and the in-memory terminology alias. The initiating screen remains visible while reset settles/confirms.
- Controlled utility presentation survives creation-frame replacement while a write settles. Confirmation replaces
  Sheet content without opening another modal focus trap. Player and Gate reset entry points remain W12-04 work.
- W12-03 owns non-Player reset; W12-04 explicitly owns Player/Gate integration and the existing Gate discard path.
  The existing discard wrapper retains its original lifecycle with an ordering-only persistence await before cleanup.
  The coordinator refuses a pending Gate or promotion lifecycle, preserving its Finish intent for W12-04.
  A reset initiated in the picker still settles its delayed startSession continuation before clearing that pointer.

### Verification

- `npm run typecheck -w packages/pic-web`: passed.
- `npm run lint`: passed.
- `npm run depcruise -w packages/pic-web`: passed, 751 modules / 1589 dependencies.
- Focused Vitest reset + composition + Gate + Sheet suites: passed, 38 tests.
- `npx playwright test tests/inquiry-reset.browser.test.ts --workers=2`: passed, 4 Chromium cases.
- Full `npm test -w packages/pic-web`: passed after corrections, 32 files / 250 tests, 47.75s.
  The first concurrent run had 245 pass / 2 test timeouts at 5000ms; the final full rerun ran alone.
  No test timeout or retry policy changed.
- Full `npx playwright test --workers=2`: concurrent run stopped at 10/167 after two 60000ms journey timeouts.
  Final separate rerun passed all 167 cases in 6.8 minutes, exit code 0; no tests were skipped.
- `git diff --check`: passed. New/changed web lines are at most 130 characters.

### Review

Orchestrator's independent Standards review: zero actionable findings. Spec review initially found pending Gate
intent could be cleared before fallible cleanup. The corrected coordinator refuses that W12-04-owned stage;
the existing Gate discard lifecycle is retained with persistence ordering corrected. Corrected Spec review:
zero remaining findings. Final Chromium evidence confirms 167 passing cases; the orchestrator closed this ticket.

### Deviations

No specification or implementation-scope deviation. The initial sandbox Vitest run hit `EPERM` renaming its temporary
cache; rerunning with `require_escalated` resolved infrastructure access. No tests were skipped or weakened.
Red behavior evidence included the initially absent utility, a slow-create frame replacement losing confirmation,
and a nested rating-write rejection swallowed by the compound UI callback. Each was corrected and retested.
Review also established a red regression where a direct pending-Gate reset resolved and discarded its Finish intent.
The corrected non-Player coordinator refuses that stage. The preexisting Gate discard lifecycle is retained
with the ordering-only persistence await.
Two further red public-wrapper regressions proved delayed pointer writes could recreate Guest storage after
existing discard/promotion cleanup. Awaiting flow persistence before their final cleanup corrects that ordering.
This follows approved ticket ownership; W12-04 integrates the shared lifecycle with Player/Gate recovery.
Full-wave remote/manual/auth release requirements remain W12-09; no hosted account settings or backend schemas changed.
