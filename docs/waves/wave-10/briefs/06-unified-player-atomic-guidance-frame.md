# Wave 10 Sub-Agent Brief — Ticket 10.6

## Identity

- **Ticket:** 10.6 — Unified Player Atomic Guidance Frame
- **Wave:** 10 — Frontier 3
- **Escalation:** stop and report; do not guess

## Permissions

- **Read-Write:** Unified Player presentation composition, Atomic Unit rendering, minimal
  presentation-only navigation-origin plumbing, their `pic-web` tests, and Ticket 10.6 when available.
- **Read-Only:** Wave 10 specification; completed frame, content-card, slide, action, and Sheet primitives;
  existing contexts/actions; domain docs.
- **Off limits:** `pic-engine`, adapters, migrations, package manifests, lockfile, visual primitive
  contracts, Terminal NEMAR progressive actions, utility-Sheet integration, unrelated files.

## Frozen Requirements

Implement Ticket 10.6 from:
`.scratch/wave-10-ui-primitives/issues/06-unified-player-atomic-guidance-frame.md`.

Use the approved specification at `.scratch/wave-10-ui-primitives.md`, especially the Atomic Guidance
Pattern and proof-of-concept Steps 4, 5, and 8.

- Every existing Player phase uses stable `TherapeuticFrame` geometry.
- Active reflected unit identity and ordering control `HorizontalSlideContainer`.
- Long Structured Markdown scrolls only inside `TherapeuticContentCard`.
- GFM tables use `TherapeuticTableScroller`.
- Only reflected unit changes animate. Loading, recovery, retries, and unrelated UI state do not.
- Existing content resolution, Zero-H3 guard, actions, selectors, copy, and rating isolation remain intact.

## Seam Map

- Highest integration seam: `UnifiedPlayerScreen`.
- Upstream authority: existing Player/content/session React contexts.
- Presentation seam: frame and slide props derived from reflected session state.
- Atomic content seam: existing parsed-content lookup and ReactMarkdown rendering.
- Navigation-origin plumbing may identify user-requested movement but may not perform or duplicate it.

## Conflict Avoidance

- Do not move Navigation Tree or Finish Anyway into the Sheet; Ticket 10.7 owns that change.
- Do not apply `AtomicActionLayout` to Terminal NEMAR; Ticket 10.8 owns that change.
- Do not change frame, slide, action-layout, Sheet, or visual-foundation implementation.
- Do not add gestures, Back, Skip, Done, or a new navigation action.

## Execution Contract

1. Use strict test-first integration at `UnifiedPlayerScreen`.
2. Preserve existing test selectors and assertions unless adding coverage for the approved visual behavior.
3. Test forward, backward, neutral/unknown order, reduced motion, focus, loading, recovery, markdown
   scrolling, table containment, and zero RatingControl.
4. Run scoped `pic-web` typecheck/build/depcruise, owned-file lint/line length, targeted and deterministic
   local tests, and relevant browser tests.
5. Use the approved environment exception; do not modify pre-existing root engine/remote gates.
6. Commit only owned files with an English `[10.6]` message.
7. Return a complete draft `## Resolution`; do not write the original workspace's ignored scratch ticket
   from an isolated worktree.
