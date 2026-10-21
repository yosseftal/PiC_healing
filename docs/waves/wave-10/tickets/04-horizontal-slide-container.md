# 10.4 — Directional HorizontalSlideContainer

**What to build:** a controlled, accessible horizontal transition primitive that represents reflected
forward and backward movement without creating a new navigation mechanism.

**Blocked by:** 10.1 — Web Visual Foundation and Design Tokens.

**Status:** done

## Frozen Requirements

- The active key and ordered keys are controlled by the consumer.
- Forward content enters from logical inline-end; backward content enters from logical inline-start.
- Initial mount does not slide, and unknown or reordered keys use a neutral replacement.
- Previous-key memory is presentation-only and never leaves `pic-web`.
- Only the active child is interactive or exposed to assistive technology.
- User-initiated movement focuses the incoming heading after transition completion.
- Reduced motion removes translation.
- The primitive must not implement drag, swipe, wheel, or keyboard navigation.

## Do Not Touch / Out of Scope

- Do not integrate the Unified Player or router.
- Do not call Player actions or infer domain state transitions.
- Do not modify `pic-engine`, adapters, migrations, or core tests.
- Do not add manual Back, Skip, or Done controls.

## Acceptance Criteria

- [ ] Stable ordered keys produce observable forward and backward transition direction.
- [ ] Initial, unknown, and reordered keys produce a neutral non-directional replacement.
- [ ] Exiting content is removed from the tab order and accessibility tree.
- [ ] Focus moves only after a user-initiated transition and lands on the incoming named region or heading.
- [ ] Reduced-motion preference produces no horizontal transform.
- [ ] RTL direction reverses the visual geometry through logical direction handling.
- [ ] The rendered primitive exposes no swipe, drag, wheel, or keyboard navigation handlers.
- [ ] Existing tests and all ticket gates remain green with zero boundary violations.

## Resolution

Implemented and integrated in commit `4d9ee50`.

- [x] Stable ordered keys produce observable forward and backward transition directions.
- [x] Initial, unknown, and concurrently reordered keys use neutral replacement.
- [x] Exiting content receives `inert` and `aria-hidden` before the incoming child becomes interactive.
- [x] Focus moves only after user-initiated transitions and targets the supplied heading or named region.
- [x] Reduced-motion preference removes horizontal translation while retaining a concise announcement.
- [x] Logical inline geometry reverses under RTL.
- [x] No swipe, drag, wheel, or keyboard navigation handlers were added.
- [x] Independent and Frontier 2 gates passed: 7 targeted tests; 281 deterministic tests with 9 skipped;
      11 Chromium tests; `pic-web` typecheck and build; zero dependency-cruiser violations; ESLint and
      line-length checks.

No specification deviations occurred. The component stores only prior visual identity and never performs
domain navigation.
