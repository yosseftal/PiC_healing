# 10.9 — Responsive Hardening and Wave Closure

**What to build:** prove the complete Unified Player proof of concept across the approved browser and
accessibility matrix, fix only in-scope presentation defects, and preserve the Wave 10 decisions in a
durable handoff.

**Blocked by:** 10.8 — Terminal NEMAR Progressive Action Pattern.

**Status:** done

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

- [x] Real-browser tests pass at all four approved viewport classes.
- [x] The document never scrolls; long Atomic Unit, table, and Sheet content remain internally reachable.
- [x] Safe areas, 200 percent zoom, keyboard focus, reduced motion, and RTL geometry pass.
- [x] Main Player content never exceeds two direct actions or two cards or banners.
- [x] Navigation Tree and Finish Anyway remain sovereign and accessible.
- [x] All fixes discovered by hardening remain within `pic-web`.
- [ ] Root tests, typecheck, `pic-web` build, workspace depcruise, browser tests, lint, and line-length checks
      pass.
- [x] Changed-path verification finds no source/config change outside `pic-web` except root lockfile.
- [x] Every Wave 10 ticket contains a complete `## Resolution` and `Status: done`.
- [x] Closed ticket records and `docs/audits/wave-10-handoff.md` preserve the completed wave and open
      Should-fix items.

## Resolution

### Solution path

Composed Unified Player Chromium tests now run against the real web providers and Player engine with
long Structured Markdown, a wide GFM table, and enough reflected units to overflow the utility Sheet.
The Playwright web-server plugin spawned Vite through a Windows shell and hung in plugin teardown even
after its assertion passed. `browser-setup.ts` now owns Vite in the Playwright setup process, binds a
strict port, and closes that exact server in teardown. A clean-port single case and the full suite
both returned exit 0; no listener remained after the single case. No Player runtime change was needed.

### Acceptance evidence

1. One composed Player browser test checks 320 × 568, 390 × 844, 768 × 1024, and 1440 × 900. The
   frame matches each viewport, the document fits, and long guidance scrolls inside the card.
2. The same test keeps the header utility visible while the card scrolls. Another test reaches the
   end of a wide table and the overlong Sheet through their own scroll regions while the document
   remains fixed.
3. Chromium checks frame inset padding and 44-pixel utility targets. A 195 × 422 reflow viewport
   and a 200 percent CDP page scale keep guidance and utilities reachable. Keyboard Enter activates
   navigation, the incoming heading receives focus, Escape restores trigger focus, reduced motion
   removes slide translation, and RTL places the Sheet at inline end. Actual hardware cutouts are
   not available in desktop Chromium; safe-area handling also retains the primitive's `env()` CSS.
4. The composed Terminal NEMAR test observes two choices before response, one after No, and two
   after Yes, with at most one banner. The active guidance is one content card. Existing high-seam
   tests cover the other Player phases and action budgets.
5. Browser tests use the real Navigation Tree to jump to a reflected unit and Terminal NEMAR. Finish
   Anyway remains enabled in the Sheet for null, No, and Yes responses; Sheet keyboard behavior and
   focus restoration are also covered.
6. Runtime, fixture, browser test, and runner changes are confined to `packages/pic-web`. No engine,
   adapter, migration, parser, content, or persistence source changed.
7. The scoped `pic-web` typecheck and build passed. Workspace depcruise reported zero engine and web
   violations. Deterministic local Vitest passed 291 tests with 9 skipped; 16/16 Chromium browser
   tests passed with exit 0. Owned-file ESLint, 130-character line check, and `git diff --check`
   passed. After integration, the primary checkout's `npm test` passed 329 tests (16 skipped)
   with zero engine or web dependency violations, and Chromium passed 16/16 with exit 0. The root
   gate is **not green**: unchanged engine tests have eight unique nullability errors; root lint has
   25 pre-existing errors in unrelated files. These exceptions are outside Wave 10's web-only edit
   boundary and are carried forward in the handoff.
   Ticket 10.9 is closed under the Event Manager-approved scoped-gate exception; this repository-wide
   criterion remains unchecked.
8. The changed-path audit found only owned `pic-web` files, this ticket record, and the wave handoff.
   The latter two are required closure documents, not source/config exceptions; the lockfile did
   not change in 10.9.
9. Tickets 10.1–10.9 each have `Status: done` and `## Resolution` at this commit.
10. `docs/audits/wave-10-handoff.md` records the closed chain, passing scoped gates, seam state,
    baseline exceptions, and Should-fix carry-forward.
