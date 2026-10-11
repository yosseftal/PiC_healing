# 11.4 — Symptom Group Creation and Blind Rating

**What to build:** An Event Manager creates a Symptom Group, adds symptoms, and rates them in the selected
language with accessible utilities and a bounded therapeutic viewport. Switching preserves personal wording,
draft values, and Blind-by-Default behavior throughout that complete flow.

**Blocked by:** [11.2 — Dynamic RTL Layout and Motion](02-dynamic-rtl-layout-and-motion.md).

**Status:** ready-for-agent

**Dispatch state:** Not dispatched; complete 11.2 and obtain the group/symptom/rating copy first.

**Source:** [Approved Wave 11 specification](../../../docs/specs/wave-11-i18n-spec.md), sections 2, 3.3–3.5, 4, and 6.2.

**Spec coverage:** AC-04–05, AC-08–09, AC-11–12, AC-17–18, AC-20–21, AC-24–25.

## Context Injection (verbatim)

>   It must not reveal a hidden prior rating, reinitialize a rating draft, or call a therapeutic action.

> Add the same language utility section to each screen's Sheet. The current Player drawer already owns Navigation Tree
> and Finish Anyway; share the language section rather than duplicating it. Earlier screens need a thin composition with
> one TherapeuticFrame, bounded content, and a Sheet trigger. Do not nest a second frame around the Player.

## External Prerequisites

Spec OQ-01/OQ-02/OQ-05: Approved group creation, symptom addition/counts, polarity/intensity, prior-rating reveal,
recovery messages, and assistive copy. Reuse previously approved shared utility labels.
Repository glossary meaning governs the labels; unavailable Hebrew copy remains a prerequisite, not a guessed value.

## Owned Slice and Integration Boundary

- Own group creation, symptom addition, RatingControl presentation, their message namespaces, and UI tests.
- Adopt the thin frame/Sheet composition from 11.2 and shared selector from 11.1 without copying either mechanism.
- Existing group actions, derived counts, validation, rating inputs, and route progression retain their authority.
- Joint treatment, group summary, and picker belong to 11.5. This ticket does not change their behavior or dictionaries.

## Acceptance Criteria

- [ ] TB-01: Group-name creation and symptom-add/rate screens each have one bounded TherapeuticFrame,
      internal content scrolling, and a Sheet language selector; no nested full-height frame or document scrolling.
- [ ] TB-02: Both locales cover visible headings, labels, placeholders, actions, recovery states, accessible names,
      and symptom-count plural forms. Format display values only; domain values and timestamps remain unchanged.
- [ ] TB-03: Switch languages while editing group/symptom names and rating inputs. Drafts, active entity identities,
      polarity/intensity values, and form state survive; personal text is never passed through a translation dictionary.
- [ ] TB-04: Personal names use appropriate automatic-direction/isolation markup without altering stored strings
      or injecting bidi control characters into data. Hebrew/English/mixed names remain readable in either locale.
- [ ] TB-05: Prior polarity and intensity remain hidden by default. Selection never calls reveal or re-rating,
      resets a draft, or exposes history; an explicit reveal already chosen by the EM remains their choice.
- [ ] TB-06: The existing create/add/rate actions receive the same payload values and retain their submission,
      validation, and progression behavior. Polarity stays independent of intensity; counts remain derived.
- [ ] TB-07: The primary action area exposes at most two direct choices; tertiary utilities do not crowd it.
      Keyboard form behavior, Sheet focus restoration, and recovery affordances remain reachable in both locales.
- [ ] TB-08: Actual Hebrew and long labels wrap within the card; actionable targets remain at least 44 x 44 CSS px,
      AA contrast/focus visibility is preserved, and no clipping is hidden by smaller typography.
- [ ] TB-09: Integration tests demonstrate creation through symptom addition/rating, mid-draft switching,
      preserved hidden/revealed history, and zero action calls from selection. Browser tests prove phone containment.
- [ ] TB-10: Approved key/plural/parameter parity and all scoped checks pass; no personal data or engine state is
      rewritten by localization. The completed slice can be demonstrated independently of 11.5 using existing fixtures.

## Isolation Bounds / Do Not Touch

All implementation, dictionaries, styling, configuration, and UI tests stay inside `packages/pic-web`.
Only the active ticket markdown may gain its later Resolution; spec and sibling tickets remain read-only.
Zero edits to `packages/pic-engine`, adapters, schemas/migrations, domain interfaces/tests, seeds, or root lockfile.
No inferred clinical answers, new rating rules, automatic reveal, mandatory writing gate, or ownership changes.
Shared primitive changes remain owned by 11.2 and require coordination rather than duplicate local implementations.

## Verification and Completion Evidence

Use existing group-engine context and guest-flow seams; test real form behavior and explicit history reveal.
Run affected unit/integration/browser tests, root typecheck, web depcruise/build, lint, line-length and scope checks.
Later Resolution must address TB-01–TB-10 and record approved copy and genuine checks, not pending approvals as passes.
