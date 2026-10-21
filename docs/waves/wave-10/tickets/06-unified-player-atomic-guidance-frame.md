# 10.6 — Unified Player Atomic Guidance Frame

**What to build:** apply the therapeutic viewport, internal content card, and directional movement to the
Unified Player so one reflected Atomic Unit remains visually dominant without changing Player behavior.

**Blocked by:** 10.2 — TherapeuticFrame and Internal Content Scrolling; 10.4 — Directional
HorizontalSlideContainer.

**Status:** done

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

- [x] Every existing Unified Player phase renders inside one stable therapeutic frame.
- [x] Exactly one active Atomic Unit or Terminal NEMAR view is interactively exposed.
- [x] Long real Structured Markdown scrolls inside the content card without document scroll.
- [x] GFM tables remain contained.
- [x] Forward and backward reflected unit changes use the correct direction; unknown order is neutral.
- [x] User-initiated movement focuses the incoming heading after transition completion.
- [x] Reduced-motion mode performs no horizontal translation.
- [x] Zero-H3 recovery, action calls, test selectors, and zero-rating-control guarantees remain intact.
- [x] Existing high-seam Unified Player tests and all ticket gates remain green.

## Resolution

### Solution path

`UnifiedPlayerScreen` now keeps resolving, recovery, active Atomic Unit, and Terminal NEMAR content
within one `TherapeuticFrame`. The active slide key and ordered keys come solely from the reflected
`PlayerSession.units`. `AtomicUnitView` places parsed Markdown inside `TherapeuticContentCard`; GFM
tables use `TherapeuticTableScroller`. Navigation Tree and Finish Anyway remain in their original
positions for 10.7. No engine, adapter, migration, content, or action contract changed.

### Acceptance evidence

1. A screen integration test observes the same named frame through resolving, active, and Terminal
   phases; the existing recovery tests retain the Zero-H3 guard and suppress Active controls.
2. `HorizontalSlideContainer` exposes only its active panel as interactive; the Player screen renders
   one reflected active unit. Existing Player tests cover the Terminal phase and zero rating controls.
3. A screen integration test renders actual parsed Markdown inside the card. Chromium frame tests
   verify the viewport lock and card-local vertical scrolling. Ticket 10.9 owns composed Player browser
   geometry across viewports.
4. The screen integration test checks a GFM table inside `TherapeuticTableScroller`; a Chromium frame
   test verifies its horizontal containment.
5. A screen integration test exercises forward and backward Navigation Tree jumps through reflected
   sessions. The existing slide contract test verifies neutral motion for unknown or reordered keys.
6. The screen integration test verifies focus on the incoming heading after a user-requested jump.
   Navigation failures clear the pending focus request; loading and response changes do not change
   the slide key.
7. The existing slide contract test verifies no horizontal translation under reduced motion.
8. Existing high-seam tests retain recovery copy, action routing, selectors, and zero rating controls.
9. Ticket gates: `pic-web` typecheck and build passed; `pic-web` depcruise reported zero violations;
   focused Player tests passed 21/21; deterministic local Vitest passed 282 tests (10 skipped);
   three Chromium frame tests passed; owned-file ESLint, 130-character limit, and `git diff --check`
   passed. Full `npm test` in this isolated worktree could not load two remote Supabase suites because
   its ignored `.env.local` file is absent; 282 tests passed before that environment failure.

### Architectural decision and carry-forward risk

The Player does not infer an active unit that is absent from its reflected session. A completed-unit
revisit is an upstream domain limitation: after `jumpTo(sessionId, "unit-1")` on a session where
`unit-1` is `completed` and `unit-3` is `in_view`, the engine leaves `unit-1` completed, clears the
prior `in_view`, and `findActiveUnit` selects the next unseen unit. Backward motion is verified here
through the supported skipped-to-in-view path. Changing the engine to reflect completed revisits is
outside Wave 10's web-only seam and requires a separate domain decision.
