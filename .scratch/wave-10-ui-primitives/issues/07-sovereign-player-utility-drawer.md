# 10.7 — Sovereign Player Utility Drawer

**What to build:** move Player utilities into the accessible Sheet so the active guidance stays calm while
Navigation Tree movement and Finish Anyway remain fully available to the Event Manager.

**Blocked by:** 10.5 — Accessible Therapeutic Utility Sheet; 10.6 — Unified Player Atomic Guidance Frame.

**Status:** ready-for-agent

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

- [ ] Navigation Tree and Finish Anyway are absent from the main content frame and present in the Sheet.
- [ ] Navigation Tree items continue to call `jumpTo` with the same session and unit identifiers.
- [ ] Finish Anyway continues to call `SessionEngine.onFinishRequested`.
- [ ] The Sheet closes after successful reflected navigation and stays open with retry UI on rejection.
- [ ] Finish Anyway is present and enabled for null, Yes, and No Terminal NEMAR responses.
- [ ] No confirmation or technical gate is added before Finish Anyway.
- [ ] Opening and closing the Sheet preserves active unit and content-card scroll position.
- [ ] Player recovery copy avoids Failed, Error, and Invalid framing.
- [ ] Existing promotion, discard, rating-isolation, and Player tests remain green.
