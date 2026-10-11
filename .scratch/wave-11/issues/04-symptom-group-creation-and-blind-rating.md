# 11.4 — Symptom Group Creation and Blind Rating

**What to build:** An Event Manager creates a Symptom Group, adds symptoms, and rates them in the selected
language with accessible utilities and a bounded therapeutic viewport. Switching preserves personal wording,
draft values, and Blind-by-Default behavior throughout that complete flow.

**Blocked by:** [11.2 — Dynamic RTL Layout and Motion](02-dynamic-rtl-layout-and-motion.md).

**Status:** done

**Dispatch state:** Implemented and verified; review pending.

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


## Resolution — 2026-10-11

Hebrew UI copy is product-approved by the user on 2026-10-11; newly drafted labels are not website quotations.
The existing group-engine actions and rating history remain the domain authority. No engine, adapter,
contract, schema, seed, dependency, root tooling, or shared primitive was changed.

- TB-01: Done. Creation and symptom addition each compose one shared TherapeuticScreenFrame, content card,
  internal scrolling, and shared Sheet language selector. The stages never nest frames.
- TB-02: Done. Hebrew/English titles, names, placeholders, rating dimensions, reveal, retries, assistive
  labels, and symptom-count plurals use typed messages; display formatting does not change domain values.
- TB-03: Done. Integration and Chromium selection retain personal drafts, input DOM, active group identity,
  polarity/intensity, and pending save/reveal requests, without invoking another therapeutic action.
- TB-04: Done. Personal inputs use unknown-language/auto-direction markup; displayed group names use bdi.
  Mixed Hebrew/English names reach existing create/add actions unchanged apart from existing submission trim.
- TB-05: Done. A fixture with an actual rated symptom verifies both prior dimensions stay hidden until
  explicit reveal. Revealed history and drafts survive selection. Existing symptom-ID effect guards remain.
- TB-06: Done. Real-engine creation/addition and exact action-payload assertions retain positive/negative
  polarity independent of intensity, derived counts, and retries that do not add a symptom twice.
- TB-07: Done. Add and Done are the two main choices; symptom/load retries live in Sheet utilities.
  Native Enter submission, selector keyboard focus, Escape, and Sheet trigger restoration remain verified.
- TB-08: Done within browser evidence. Actual Hebrew labels and long personal wording fit 320/390px cards;
  targets are at least 44px. Existing native control focus/border/color checks pass; no typography was shrunk.
- TB-09: Done. Four focused integration cases cover complete creation, hidden/revealed real history,
  pending reveal, and pending save/retry. Eight Hebrew/English phone cases cover drafts/history/containment.
- TB-10: Done. Required dictionary parameter/plural parity and all scoped gates pass. This slice has its own
  fixture independent of 11.5; personal text, persisted identifiers, timestamps, and engine data are unchanged.

Verification: genuine red (missing Hebrew group label) to green complete creation test; focused component/
message run: 3 files, 15 tests. Full web suite: 27 files, 190 tests. Owned Chromium: 8/8; affected existing
control-affordance case: 1/1. Web typecheck, root workspace typecheck, web depcruise (733 modules/1488
relationships), production build, owned ESLint, 130-character checks, and git diff --check all pass.
Sandbox temporary-file EPERM and missing sandbox Chromium were rerun with approved escalation; no skips.
Build retains existing bundle-size/dynamic-import warnings. The legacy affordance fixture now selects
creation or picker per query stage, preserving its checkbox checks without stacking screens.

A common reachable 40px card offset survives selection; a locale-dependent maximum may naturally clamp
when translated content is shorter. Real device cutouts, mobile keyboard, desktop zoom, and Hebrew
screen-reader pronunciation were not manually verified and remain follow-up evidence for the final wave.
