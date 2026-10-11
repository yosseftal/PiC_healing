# 11.3 — Localized Unified Player Controls

**What to build:** An Event Manager reads Player controls, unit-state display labels, Terminal NEMAR,
sovereign Finish controls, recovery messages, and accessibility text in the chosen language without changing
the session's meaning or authority. Language access remains available in every Player content phase.

**Blocked by:** [11.1 — Persistent Language Choice](01-persistent-language-choice.md).

**Status:** ready-for-agent

**Dispatch state:** Not dispatched; resolve the Player-copy prerequisites and complete 11.1 first.

**Source:** [Approved Wave 11 specification](../../../docs/specs/wave-11-i18n-spec.md), sections 3.3–3.4, 4, and 6.2.

**Spec coverage:** AC-03–05, AC-08–10, AC-13–14, AC-24–25.

## Context Injection (verbatim)

> Separate **language access** from **Player utility eligibility**. The Sheet trigger remains available while Player content
> is resolving, empty, or reconnecting. Those phases may expose language controls alone; do not expose Finish or navigation
> where the existing source-content guard prohibits them. This preserves the Zero-H3 behavior and global language access.

> Localize engine-origin **display labels** such as Continuous Guidance and unit states through explicit semantic mappings;
> preserve the raw domain enum values and canonical parser output. Preserve stable test IDs and automation identities.

## External Prerequisites

Spec OQ-01/OQ-02/OQ-05: Approved Player, navigation/state, Terminal NEMAR, Finish, recovery/Zero-H3,
and assistive copy in both locales. Integrating and Finish Anyway remain pending until explicitly approved.
No invented Hebrew values, automatic translations, or placeholder values may satisfy this ticket.

## Owned Slice and Integration Boundary

- Own Player chrome, Navigation Tree display state labels, Terminal NEMAR/Finish messages, recovery presentation,
  guidance-region accessible names, and corresponding feature dictionary entries and tests.
- Consume 11.1's selector and locale API; keep Player utility eligibility distinct from language availability.
- Leave authored treatment bodies, translated catalog titles, and content resolution to 11.7.
  Establish localized display/accessibility surfaces that 11.7 can consume without replacing canonical unit records.
- Coordinate composition edits with 11.2; this ticket does not own shared CSS or animation mechanisms.

## Acceptance Criteria

- [ ] TB-01: Both approved dictionaries cover all Player chrome, utility title/description/close/content labels,
      navigation-state labels, guidance accessible names, and step announcements owned by this ticket.
      Use full-message templates and escaped/isolate dynamic text; no English concatenation or title lowercasing.
- [ ] TB-02: Switching updates the active Player presentation in place while preserving unit/session IDs, current
      engine state, pending async actions, stable test IDs, and already-established focus ownership.
- [ ] TB-03: Ordinary units, Continuous Guidance system labels, and Terminal NEMAR display labels are localized;
      raw enum values and canonical parser records are never translated, rewritten, or persisted as display strings.
- [ ] TB-04: Yes, No, Change response, Finish, and Finish Anyway retain their existing actions and eligibility.
      No response remains Integrating; language changes never declare success, alter use counts, or add a gate.
- [ ] TB-05: Language-only Sheet access works during resolving, empty, and recovery phases. Source-content guards
      still suppress prohibited Player utilities and execution; localization never creates a Finish bypass for empty source.
- [ ] TB-06: Main therapeutic controls stay within the two-choice contract. Navigation Tree remains the exclusive
      manual non-linear navigation mechanism; the utility selector adds no main action or new gesture.
- [ ] TB-07: Recovery and recorded-response banners retain calm, factual meaning in both locales. Async actions
      settling after a language change display current-locale messages without replaying the original action.
- [ ] TB-08: Required keys/parameters have parity and no unintended fallback; unknown runtime keys cannot leak.
      Fallback text carries actual-language metadata. Approved copy is required before this slice is complete.
- [ ] TB-09: Integration tests prove no therapeutic mutation on selection; browser tests exercise ordinary units,
      Terminal NEMAR Yes/No, Finish Anyway, resolving/recovery/empty phases, keyboard access and truthful metadata.
- [ ] TB-10: A demonstrable bilingual Player control flow passes scoped tests, root typecheck, web depcruise/build,
      lint, line-length and scope checks. Treatment-body localization remains explicitly deferred to 11.7.

## Isolation Bounds / Do Not Touch

All application, dictionary, styling, configuration, and UI test changes stay inside `packages/pic-web`.
Only this ticket markdown may be updated for later Resolution; spec and siblings remain read-only.
Zero edits to `packages/pic-engine`, adapters, migrations, domain enums/interfaces/tests, seeds, or root lockfile.
Do not change Player rules, rating behavior, auth, content parsing/caching, clinical instructions, or frozen motion tokens.

## Verification and Completion Evidence

Reuse existing Player, Terminal NEMAR, Navigation Tree, and Finish integration seams and browser fixtures.
Assert outward messages and existing action calls, not the dictionary's internal representation.
Later Resolution must address TB-01–TB-10 with real gate evidence and the approved-copy reference.
