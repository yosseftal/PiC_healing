# 10.9 — Responsive Hardening and Wave Closure

**What to build:** prove the complete Unified Player proof of concept across the approved browser and
accessibility matrix, fix only in-scope presentation defects, and preserve the Wave 10 decisions in a
durable handoff.

**Blocked by:** 10.8 — Terminal NEMAR Progressive Action Pattern.

**Status:** ready-for-agent

## Frozen Requirements

- Validate compact phone, modern phone, tablet, and desktop viewports.
- Validate 200 percent zoom, reduced motion, keyboard use, and RTL geometry.
- Prove document lock, card-local scrolling, Sheet-local scrolling, safe areas, focus movement, action
  budgets, and GFM containment.
- All existing 255-plus tests and new Wave 10 tests must be green.
- Runtime and styling changes remain in `pic-web`; root lockfile remains the sole source/config exception.
- Every ticket must end with a `## Resolution` that maps every acceptance criterion.
- Write a Wave 10 handoff with closed tickets, gates, seam status, and Should-fix carry-forward.

## Do Not Touch / Out of Scope

- Do not expand visual migration to another Guest Mode screen.
- Do not change engine, adapter, database, parser, content, or domain semantics.
- Do not weaken, delete, or skip an existing test to obtain a green gate.
- Do not add dark mode, localization delivery, gestures, rationale disclosure, or authentication redesign.

## Acceptance Criteria

- [ ] Real-browser tests pass at all four approved viewport classes.
- [ ] The document never scrolls; long Atomic Unit, table, and Sheet content remain internally reachable.
- [ ] Safe areas, 200 percent zoom, keyboard focus, reduced motion, and RTL geometry pass.
- [ ] Main Player content never exceeds two direct actions or two cards or banners.
- [ ] Navigation Tree and Finish Anyway remain sovereign and accessible.
- [ ] All fixes discovered by hardening remain within `pic-web`.
- [ ] Root tests, typecheck, `pic-web` build, workspace depcruise, browser tests, lint, and line-length checks
      pass.
- [ ] Changed-path verification finds no source/config change outside `pic-web` except root lockfile.
- [ ] Every Wave 10 ticket contains a complete `## Resolution` and `Status: done`.
- [ ] Closed ticket records and `docs/audits/wave-10-handoff.md` preserve the completed wave and open
      Should-fix items.
