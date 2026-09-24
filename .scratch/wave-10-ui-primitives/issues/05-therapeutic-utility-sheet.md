# 10.5 — Accessible Therapeutic Utility Sheet

**What to build:** one locally owned shadcn/Radix pull-out Sheet that keeps sovereign and non-linear
utilities available without crowding the active therapeutic frame.

**Blocked by:** 10.1 — Web Visual Foundation and Design Tokens.

**Status:** done

## Frozen Requirements

- The Sheet opens from logical inline-end and reverses naturally under RTL document direction.
- It has a visible title, optional description, explicit close control, and a minimum 44-pixel trigger.
- Opening traps focus and makes background content inert.
- Escape and overlay activation close it; closing restores focus to the trigger.
- Long utility content scrolls only inside the Sheet.
- The Sheet is a separate modal context and does not relax the obscured main frame's two-action limit.

## Do Not Touch / Out of Scope

- Do not integrate Navigation Tree, Finish Anyway, or another product utility.
- Do not generate the broad shadcn/ui catalog.
- Do not import engines, repositories, adapters, or domain state.
- Do not modify `pic-engine`, adapters, migrations, or core tests.
- Do not turn the Sheet into general application navigation.

## Acceptance Criteria

- [ ] Trigger, title, description, close control, and modal semantics are accessible.
- [ ] Keyboard focus is trapped while open and restored to the trigger after every supported close path.
- [ ] Escape and overlay activation dismiss the Sheet.
- [ ] Background content is inert and unavailable to assistive technology while open.
- [ ] Oversized Sheet content scrolls internally without moving the document.
- [ ] Compact-phone and desktop widths remain usable.
- [ ] RTL mode opens from the opposite physical edge through logical direction behavior.
- [ ] Existing tests and all ticket gates remain green with zero boundary violations.

## Resolution

Implemented and integrated in commit `5e76f5b`.

- [x] The trigger has an accessible label and a 44-pixel minimum target. The modal has a visible title,
      optional description, explicit close control, and Radix Dialog semantics.
- [x] Radix traps focus while open. Escape, overlay activation, and the explicit close control all restore
      focus to the trigger.
- [x] Escape and overlay activation dismiss the Sheet.
- [x] Background content receives native `inert` and `aria-hidden` while the Sheet is open, then restores
      its previous state.
- [x] Oversized utility content scrolls inside a bounded, overscroll-contained Sheet without moving the
      document.
- [x] Browser coverage verifies usable geometry at 320 by 568 and 1440 by 900.
- [x] Logical inline-end placement opens from the right in LTR and the left in RTL.
- [x] Independent gates passed: 4 Vitest tests, 4 Chromium tests, `pic-web` typecheck and build, zero
      dependency-cruiser violations, owned-file ESLint, and the 130-character line check.

No specification deviations occurred. The implementation added no Player, engine, adapter, package,
lockfile, shared-barrel, or existing-screen changes.
