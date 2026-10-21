# 10.2 — TherapeuticFrame and Internal Content Scrolling

**What to build:** a reusable therapeutic viewport frame and bounded content card that keep the browser
page still while preserving comfortable access to long Atomic Unit content.

**Blocked by:** 10.1 — Web Visual Foundation and Design Tokens.

**Status:** done

## Frozen Requirements

- `TherapeuticFrame` owns a `100dvh` by `100vw` viewport, safe areas, stable header, clipped stage, and
  optional utility trigger.
- `TherapeuticContentCard` is the only vertical scrolling surface for oversized active content.
- The document, frame, and stage never become vertical or horizontal scrollers.
- Use logical properties, constrained reading width, `min-h-0`, `min-w-0`, overscroll containment, and
  stable scrollbar geometry.
- Wide Structured Markdown tables must remain inside a card-local horizontal scroller.
- Browser zoom up to 200 percent must preserve access.

## Do Not Touch / Out of Scope

- Do not integrate a product screen.
- Do not add Player, Group, Session, repository, or adapter knowledge.
- Do not modify `pic-engine`, adapters, migrations, or core tests.
- Do not add navigation, action-budget, or domain behavior.

## Acceptance Criteria

- [ ] The frame exposes one named viewport and stage with safe-area-aware layout.
- [ ] Adopted frames lock the document to the dynamic viewport with a compatible `100vh` fallback.
- [ ] Oversized content scrolls inside one named content card and cannot chain scrolling to the body.
- [ ] Header and stage geometry remain stable while the card scrolls.
- [ ] Wide tables cannot widen the frame.
- [ ] LTR and RTL geometry use logical directions.
- [ ] Real-browser tests cover compact phone, desktop, internal overflow, table containment, and 200
      percent zoom.
- [ ] Primitive tests verify accessible naming and contract behavior without asserting private class
      strings.
- [ ] Existing tests and all ticket gates remain green with zero boundary violations.

## Resolution

Implemented and integrated in commit `bbd66fc`.

- [x] The frame exposes a named, safe-area-aware viewport and stage through its title or external label
      plus `stageLabel`.
- [x] Adopted frames lock `html`, `body`, and `#root`; CSS provides a `100vh` fallback and uses `100dvh`
      when supported.
- [x] Oversized content scrolls only inside the named content card with overscroll containment.
- [x] Header and stage geometry remain stable while card content scrolls.
- [x] Wide tables use a bounded, card-local horizontal scroll region.
- [x] Logical properties provide verified LTR and RTL geometry.
- [x] Browser coverage verifies 320 by 568 and 1440 by 900 viewports, overflow, table containment, and
      200 percent zoom.
- [x] Primitive tests verify accessible naming, slots, document-lock restoration, and scroll-region
      contracts without private class-string assertions.
- [x] Independent and post-integration gates passed: 3 unit tests, 5 Chromium tests, `pic-web` typecheck
      and build, zero dependency-cruiser violations, owned-file ESLint, and line-length checks.

No specification deviations occurred and no existing source file was modified.
