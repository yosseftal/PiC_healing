# 10.6 — Unified Player Atomic Guidance Frame

**What to build:** apply the therapeutic viewport, internal content card, and directional movement to the
Unified Player so one reflected Atomic Unit remains visually dominant without changing Player behavior.

**Blocked by:** 10.2 — TherapeuticFrame and Internal Content Scrolling; 10.4 — Directional
HorizontalSlideContainer.

**Status:** ready-for-agent

## Frozen Requirements

- Resolving, recovery, active Atomic Unit, and Terminal NEMAR phases use stable frame geometry.
- The active key and unit ordering come from the reflected Player session.
- Structured Markdown scrolls only inside the active content card.
- Wide GFM tables remain card-local.
- Reflected unit changes animate horizontally; loading, retry, and Sheet state do not imitate navigation.
- Content resolution, Zero-H3 protection, engine subscriptions, selectors, and rating isolation remain
  unchanged.

## Do Not Touch / Out of Scope

- Do not move Navigation Tree or Finish Anyway yet; ticket 10.7 owns utility integration.
- Do not apply the progressive Terminal NEMAR action pattern; ticket 10.8 owns it.
- Do not change parser, cache, treatment content, Player state, persistence, or promotion behavior.
- Do not modify `pic-engine`, adapters, migrations, or core tests.
- Do not add gestures or manual Back, Skip, or Done controls.

## Acceptance Criteria

- [ ] Every existing Unified Player phase renders inside one stable therapeutic frame.
- [ ] Exactly one active Atomic Unit or Terminal NEMAR view is interactively exposed.
- [ ] Long real Structured Markdown scrolls inside the content card without document scroll.
- [ ] GFM tables remain contained.
- [ ] Forward and backward reflected unit changes use the correct direction; unknown order is neutral.
- [ ] User-initiated movement focuses the incoming heading after transition completion.
- [ ] Reduced-motion mode performs no horizontal translation.
- [ ] Zero-H3 recovery, action calls, test selectors, and zero-rating-control guarantees remain intact.
- [ ] Existing high-seam Unified Player tests and all ticket gates remain green.
