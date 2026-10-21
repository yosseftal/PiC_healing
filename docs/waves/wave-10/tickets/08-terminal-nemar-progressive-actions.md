# 10.8 — Terminal NEMAR Progressive Action Pattern

**What to build:** give Terminal NEMAR a calm two-choice main frame that progressively reveals Finish or
response revision while keeping Finish Anyway sovereign in the utility Sheet.

**Blocked by:** 10.3 — AtomicActionLayout and TherapeuticBanner; 10.7 — Sovereign Player Utility Drawer.

**Status:** done

## Frozen Requirements

- Before response, the main frame shows exactly Yes and No.
- After Yes, it shows a calm confirmation banner plus Finish and Change response.
- After No, it shows an Integrating banner plus Change response.
- Change response returns presentation to Yes and No without changing engine state until a new answer is
  selected.
- Finish Anyway remains enabled in the Sheet for null, Yes, and No.
- The existing response, Finish, and Finish Anyway action seams remain unchanged.
- No state may use failure framing or invent a new completion gate.

## Do Not Touch / Out of Scope

- Do not duplicate `terminal_nemar_response` in local state.
- Presentation-only response-edit disclosure may be local but must not claim a different persisted answer.
- Do not modify PlayerEngine, SessionEngine, persistence, promotion, or adapters.
- Do not add celebration, delay, confirmation, or pressure-oriented progress.
- Do not modify `pic-engine`, migrations, or core tests.

## Acceptance Criteria

- [x] Null response presents exactly Yes and No as main direct actions.
- [x] Yes response presents one confirmation banner, Finish, and Change response.
- [x] No response presents one Integrating banner and Change response, with no standard Finish.
- [x] Change response restores Yes and No without mutating the persisted response by itself.
- [x] Selecting a new answer still calls the existing `respondTerminalNemar` action.
- [x] Finish and Finish Anyway still route through `SessionEngine.onFinishRequested`.
- [x] Finish Anyway remains present and enabled in the Sheet for all response values.
- [x] Main content never exceeds two direct actions or two cards or banners.
- [x] Pressed semantics and positive recovery language remain accessible.
- [x] Existing Terminal NEMAR and Unified Player tests plus all ticket gates remain green.

## Resolution

### Solution path

`TerminalNemarUnit` composes the existing question with `AtomicActionLayout`. The reflected Player
response chooses the null, Yes, or No presentation. A local `editing` flag only reveals the two
response choices; it never stores or alters `terminal_nemar_response`. Successful answer selection
still calls `respondTerminalNemar`. Standard Finish is now a Yes-only main action and calls
`SessionEngine.onFinishRequested(sessionId, "finish")`. `FinishBar` retains Finish Anyway in the
utility Sheet and calls the same session action with `"finishAnyway"`.

### Acceptance evidence

1. Unit tests verify null has exactly two main buttons, Yes and No, and zero banners.
2. Unit and Player tests verify Yes has one confirmation banner plus Finish and Change response.
3. Unit and Player tests verify No has one Integrating banner plus Change response, with no Finish.
4. A Player high-seam test verifies Change response leaves the reflected answer at Yes, then the
   next No selection calls `respondTerminalNemar` and reflects Integrating.
5. Existing Player tests verify both Finish kinds call `SessionEngine.onFinishRequested` and never
   raw Player Finish methods; the main Finish high-seam test verifies Persistence Gate focus.
6. Player tests verify Finish Anyway is enabled in the Sheet for null, Yes, and No responses.
7. The primary content slot is noninteractive. The action tuple never exceeds two buttons; each
   response state has one banner. Recovery replaces the main actions with a single retry and a
   positive status banner, preserving the action budget.
8. When answer choices are visible, `aria-pressed` reflects the persisted response, including
   while editing. Existing `data-testid` selectors remain stable on those buttons and Finish.
9. Focused Terminal NEMAR and Player tests passed 32/32. Deterministic local Vitest passed 291
   tests with 10 skipped across 34 files using two workers. Scoped web typecheck, build,
   depcruise (zero violations), owned-file ESLint, changed-line length, and `git diff --check`
   passed.

### Verification limit

The isolated worktree has no ignored `.env.local`; remote Supabase tests run from the primary
checkout. Existing remote happy-path code still follows No → open Sheet → Finish Anyway. All 11
existing Chromium browser assertions ran without an assertion failure, but the Playwright command
stalled during web-server/plugin teardown and was stopped after more than 60 seconds. Browser
runner repair remains with Ticket 10.9.
