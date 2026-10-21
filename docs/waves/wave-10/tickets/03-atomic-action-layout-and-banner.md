# 10.3 — AtomicActionLayout and TherapeuticBanner

**What to build:** a descriptor-driven main-frame layout that structurally limits therapeutic choices
and supporting banners while preserving accessible button, link, pressed, disabled, and recovery
semantics.

**Blocked by:** 10.1 — Web Visual Foundation and Design Tokens.

**Status:** done

## Frozen Requirements

- The main content frame permits zero, one, or two direct actions and never a third.
- It permits zero, one, or two cards or banners and never a third.
- Tuple types enforce both limits at compile time.
- The primitive renders action controls; consumers cannot inject an arbitrary action collection.
- Primary content and banners reject unintended interactive descendants during development, while
  authored Markdown links remain valid.
- Narrow layouts stack actions without reordering them.
- Recovery language remains positive and non-blocking.

## Do Not Touch / Out of Scope

- Do not integrate Terminal NEMAR or another product screen.
- Do not build the utility Sheet or count its hidden controls as main-frame actions.
- Do not modify engine state, adapters, migrations, or core tests.
- Do not introduce new domain statuses or completion gates.

## Acceptance Criteria

- [ ] Zero, one, and two action descriptors render with correct accessible semantics.
- [ ] Zero, one, and two banners render in neutral, confirmation, reflection, and recovery styles.
- [ ] Compile-time fixtures prove that three actions and three banners are rejected.
- [ ] Disabled and pressed controls are distinguishable without color alone.
- [ ] Development validation catches unintended interactive slot descendants without breaking Markdown
      links in production output.
- [ ] Narrow responsive layout preserves action order and minimum touch targets.
- [ ] Recovery banners use `role="status"` and avoid Failed, Error, and Invalid framing.
- [ ] Existing tests and all ticket gates remain green with zero boundary violations.

## Resolution

Implemented and integrated in commit `4ca2503`.

- [x] Zero, one, and two descriptor-driven actions preserve button, link, accessible-label, callback,
      pressed, and disabled semantics.
- [x] Zero, one, and two banners support neutral, confirmation, reflection, and recovery intents.
- [x] Compile-time fixtures reject third actions and third banners.
- [x] Disabled and pressed controls include visible non-color indicators plus native semantics.
- [x] Development validation rejects unintended interactive descendants. Explicitly marked authored
      Markdown links remain valid, and production validation is disabled.
- [x] Responsive actions stack without DOM reordering and use the 44-pixel touch-target token.
- [x] Recovery banners use polite `role="status"` semantics and reject Failed, Error, and Invalid
      language during development.
- [x] Independent and post-integration gates passed: 8 targeted tests, combined primitive tests,
      `pic-web` typecheck and build, zero dependency-cruiser violations, ESLint, and line-length checks.

No specification deviations occurred. Terminal NEMAR integration remains owned by Ticket 10.8.
