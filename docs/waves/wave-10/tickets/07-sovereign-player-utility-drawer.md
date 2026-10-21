# 10.7 — Sovereign Player Utility Drawer

**What to build:** move Player utilities into the accessible Sheet so the active guidance stays calm while
Navigation Tree movement and Finish Anyway remain fully available to the Event Manager.

**Blocked by:** 10.5 — Accessible Therapeutic Utility Sheet; 10.6 — Unified Player Atomic Guidance Frame.

**Status:** done

## Frozen Requirements

- Navigation Tree remains the only manual non-sequential Player navigation mechanism.
- Finish Anyway remains available whenever the existing session contract permits it.
- Both utilities live in the Player's header-triggered Sheet.
- Existing `jumpTo` and `SessionEngine.onFinishRequested` seams remain authoritative.
- Successful Navigation Tree movement closes the Sheet after reflected movement.
- A rejected movement or Finish request keeps the Sheet open with positive recovery nearby.
- Opening or closing the Sheet does not change unit state or reset card scroll position.

## Do Not Touch / Out of Scope

- Do not implement the progressive Terminal NEMAR main action pattern; ticket 10.8 owns it.
- Do not add confirmation before Finish Anyway.
- Do not call raw Player Finish methods from UI.
- Do not change navigation semantics, persistence, promotion, parser, or content.
- Do not modify `pic-engine`, adapters, migrations, or core tests.

## Acceptance Criteria

- [x] Navigation Tree and Finish Anyway are absent from the main content frame and present in the Sheet.
- [x] Navigation Tree items continue to call `jumpTo` with the same session and unit identifiers.
- [x] Finish Anyway continues to call `SessionEngine.onFinishRequested`.
- [x] The Sheet closes after successful reflected navigation and stays open with retry UI on rejection.
- [x] Finish Anyway is present and enabled for null, Yes, and No Terminal NEMAR responses.
- [x] No confirmation or technical gate is added before Finish Anyway.
- [x] Opening and closing the Sheet preserves active unit and content-card scroll position.
- [x] Player recovery copy avoids Failed, Error, and Invalid framing.
- [x] Existing promotion, discard, rating-isolation, and Player tests remain green.

## Resolution

### Solution path

`UnifiedPlayerScreen` places the existing `NavigationTreePanel` and `FinishBar` inside a
header-triggered `TherapeuticSheet`. The main Player layout now contains only the active guidance
card. Navigation still calls `PlayerEngineActions.jumpTo`, and Finish and Finish Anyway still call
`SessionEngineActions.onFinishRequested`. The Sheet closes once the requested unit is reflected as
active. A rejected action leaves its nearby positive retry in the open Sheet. Opening or closing
utilities does not remount the active card.

### Acceptance evidence

1. A new Player screen test verifies utilities are absent before opening the header Sheet and both
   controls are inside the named dialog after opening it.
2. Existing Player tests verify the session and unit IDs passed to `jumpTo`; the Wave 9.1 Continuous
   Guidance regression still navigates through its sole Navigation Tree entry point.
3. Existing Player tests verify Finish and Finish Anyway use `onFinishRequested` and never raw Player
   Finish methods. A new rejection test verifies Finish Anyway retry retains the same request kind.
4. Reflected forward and backward jumps close the Sheet and focus incoming guidance. If the incoming
   heading is not rendered yet, focus returns to the Sheet trigger and moves to the heading when it
   appears. Successful Finish and Finish Anyway requests also close the Sheet and focus the
   Persistence Gate when it opens. Rejected tree movement and rejected Finish requests keep the
   Sheet open with nearby retry controls. A consumed
   jump cannot close the Sheet again on a later Terminal NEMAR response.
5. Screen tests cover enabled Finish Anyway with null, Yes, and No responses; standard Finish remains
   conditional on Yes under the existing session contract.
6. Finish Anyway calls `onFinishRequested` directly without a confirmation step or new condition.
7. A screen test verifies the active unit, card element, scroll position, and reflected unit states
   survive Sheet open and close without a `jumpTo` call.
8. Recovery tests assert the Player and utility copy avoids Failed, Error, and Invalid language.
9. Deterministic local Vitest passed 282 tests, with 8 skipped, across 32 files. This includes
   promotion, discard, rating isolation,
   and Player coverage. Scoped `pic-web` typecheck, build, depcruise, owned-file ESLint, line-length,
   and `git diff --check` passed.

### Architectural decision and verification limit

The 10.5 Sheet normally restores focus to its trigger after closing. That conflicts with 10.6's
incoming-heading focus after a successful Player jump. A narrow optional close-focus callback lets
the Player restore heading focus only for that reflected navigation. When the incoming slide or
Markdown heading has not rendered, the Sheet restores trigger focus, and a Player-local DOM observer
focuses the heading once it appears. The observer disconnects on new navigation or unmount. Ordinary
Sheet closes still restore trigger focus; primitive and async content tests cover both paths.

### Post-integration follow-up

The remote happy path now opens Player utilities before each Navigation Tree or Finish Anyway
interaction and waits for the Sheet to close after each reflected jump. A Player high-seam test
covers both standard Finish and Finish Anyway: the existing `onFinishRequested` call resolves, the
Sheet closes, and focus lands in the Persistence Gate dialog. Rejected Finish requests retain their
Sheet-local retry. The Gate receives a programmatic focus target without changing its action flow.
The remote happy path is skipped in this isolated worktree because `.env.local` is absent; the
primary checkout owns its full remote run.

Nine focused Chromium Sheet/frame browser assertions passed. The Playwright command exited 1 only
because web-server plugin teardown exceeded its 90-second global timeout. A narrower retry was
initially blocked by port 4173 still held after that timed-out run. After the port cleared, a
single focused Sheet assertion passed, but its command also exited 1 on a 60-second plugin teardown
timeout. No browser assertion failed. The full
remote Supabase suite is left to the primary checkout, which has its ignored environment file.
