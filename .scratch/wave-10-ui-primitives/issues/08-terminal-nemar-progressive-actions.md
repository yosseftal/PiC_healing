# 10.8 — Terminal NEMAR Progressive Action Pattern

**What to build:** give Terminal NEMAR a calm two-choice main frame that progressively reveals Finish or
response revision while keeping Finish Anyway sovereign in the utility Sheet.

**Blocked by:** 10.3 — AtomicActionLayout and TherapeuticBanner; 10.7 — Sovereign Player Utility Drawer.

**Status:** ready-for-agent

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

- [ ] Null response presents exactly Yes and No as main direct actions.
- [ ] Yes response presents one confirmation banner, Finish, and Change response.
- [ ] No response presents one Integrating banner and Change response, with no standard Finish.
- [ ] Change response restores Yes and No without mutating the persisted response by itself.
- [ ] Selecting a new answer still calls the existing `respondTerminalNemar` action.
- [ ] Finish and Finish Anyway still route through `SessionEngine.onFinishRequested`.
- [ ] Finish Anyway remains present and enabled in the Sheet for all response values.
- [ ] Main content never exceeds two direct actions or two cards or banners.
- [ ] Pressed semantics and positive recovery language remain accessible.
- [ ] Existing Terminal NEMAR and Unified Player tests plus all ticket gates remain green.
