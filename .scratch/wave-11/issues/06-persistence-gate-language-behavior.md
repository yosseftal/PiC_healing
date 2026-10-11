# 11.6 — Persistence Gate Language Behavior

**What to build:** An Event Manager reaching the Persistence Gate sees its title, explanation, anchoring,
retry, and continue-without-saving states in the selected language. Existing auth/promotion authority remains
unchanged, and saving or discarding guest work preserves the independent language preference.

**Blocked by:** [11.1 — Persistent Language Choice](01-persistent-language-choice.md).

**Status:** ready-for-agent

**Dispatch state:** Not dispatched; complete 11.1 and resolve Persistence Gate copy prerequisites first.

**Source:** [Approved Wave 11 specification](../../../docs/specs/wave-11-i18n-spec.md), sections 2, 3.2–3.5, 4, and 6.2.

**Spec coverage:** AC-02, AC-05, AC-08, AC-11, AC-17, AC-20–21, AC-23–25.

## Context Injection (verbatim)

>   Promotion, guest discard, and sign-in do not clear the independent preference or copy it into therapeutic records.

> Radix portal content is outside the frame's DOM subtree. Explicitly bind the same locale/direction to Sheet content
> and any other portalled dialogs; do not rely on frame inheritance. The Persistence Gate also consumes the same authority.

## External Prerequisites

Spec OQ-01/OQ-02/OQ-05: Approved keep-work, sign-in, anchoring, retry, continue-without-saving,
and assistive text, including accurate labels for existing development auth affordances.
This ticket localizes the existing gate; it does not authorize real auth-provider implementation or new copy.

## Owned Slice and Integration Boundary

- Own Persistence Gate presentation, selected-locale metadata, gate message namespace, and UI/integration tests.
- Consume 11.1's mounted provider and independent preference; existing SessionEngine signals and promotion
  actions remain the only authority over gate visibility, pending state, success, failure, and guest discard.
- Retain existing focus handoff from Player Finish to the gate. Do not change shared Sheet/motion contracts,
  add a main-screen language control, or require a second locale confirmation before anchoring work.

## Acceptance Criteria

- [ ] TB-01: Opening the existing gate after choosing either locale produces approved localized title/body,
      sign-in labels, pending/recovery messages, retry, and continue-without-saving actions.
- [ ] TB-02: The gate uses the same locale authority and correct `lang`/`dir`, even outside the Frame subtree.
      Accessible names and translated full messages update without remounting the gate or engine providers.
- [ ] TB-03: A locale update while the gate is mounted retains pending request, promotion state, inputs,
      guest work, and focus ownership; pending work settling afterward displays the current-locale system message.
- [ ] TB-04: Gate visibility, auth capability/disabled states, retry behavior, and action payloads retain their
      current semantics. Locale changes never request Finish, trigger auth/promotion, or discard guest work.
- [ ] TB-05: Successful promotion, sign-in, and explicit guest discard leave `pic-web.locale.v1` intact.
      No locale or direction field enters guest snapshots, promotion payloads, timeline events, or account records.
- [ ] TB-06: Preference read/write failure preserves in-memory localization without blocking gate actions
      or introducing a new error/confirmation flow; reload falls back according to 11.1's preference contract.
- [ ] TB-07: Both locales retain reachable keyboard controls, proper existing focus handoff, bounded internal
      overflow, 44 x 44 CSS px targets, readable AA contrast, and unchanged personal content.
- [ ] TB-08: Integration tests prove locale preservation across promotion/discard through existing fake/real
      action seams without implementing or contacting a new auth service. Browser cases cover idle/pending/recovery states.
- [ ] TB-09: All approved gate keys/parameters have parity; no raw key, placeholder, or unintended fallback ships.
      Existing auth stubs stay factually identified rather than being presented as completed production capabilities.
- [ ] TB-10: Scoped tests/checks pass, existing gate/domain behavior remains intact, and implementation is web-only.

## Isolation Bounds / Do Not Touch

All application, dictionary, styling, configuration, and UI test changes stay inside `packages/pic-web`.
The active ticket may receive later Resolution; the approved spec and sibling tickets remain read-only.
Zero edits to `packages/pic-engine`, adapters, RPCs/migrations, auth schemas, domain tests, seed data, or root lockfile.
Do not implement auth providers, alter atomic promotion/idempotency, add account locale sync, or weaken existing gate tests.

## Verification and Completion Evidence

Extend existing Persistence Gate and guest-promotion UI tests at their established context/action seams.
Choose language through existing utilities before browser gate scenarios; use the provider seam for mounted-update tests.
Run affected unit/integration/browser tests, root typecheck, web depcruise/build, lint, line-length and scope checks.
Later Resolution must address TB-01–TB-10, including exact evidence that therapeutic payloads exclude locale preferences.
