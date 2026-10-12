# 11.1 — Persistent Language Choice in the Player Drawer

**What to build:** An Event Manager opens Player utilities, selects Hebrew or English, and sees the shared
utility text and semantic language/direction update in place. The preference survives reload without changing
the current healing work. This is a working UI-to-preference tracer bullet, not an isolated context implementation.

**Blocked by:** None (no implementation-ticket dependencies).

**Status:** done

**Dispatch state:** Done; committed and independent Standards/Spec reviews closed.

**Source:** [Approved Wave 11 specification](../../../docs/specs/wave-11-i18n-spec.md), sections 3.2–3.4 and 6.2.

**Spec coverage:** AC-01–03, AC-05–10, AC-22–25; later tickets extend this behavior to remaining screens.

## Context Injection (verbatim)

> - Reserve the independent versioned key `pic-web.locale.v1`, containing only `he` or `en`. Read/write failures are caught.
>   A failed write leaves the new in-memory locale active for this visit; no blocking banner or auth gate is introduced.

> - Keep the provider and all engine/content providers mounted across changes. Never key the application, screen, Sheet,
>   or active Atomic Unit by locale. Locale changes rerender presentation, not service construction or domain navigation.

## External Prerequisites

- Spec OQ-01, OQ-02, and OQ-05: Approved shared utility/selector labels, accessible names, and generic fallback copy.
- Use verified terminology and supplied autonyms; do not invent pending Hebrew values or ship placeholder strings.
  Approval of this ticket breakdown does not supply the missing copy.

## Owned Slice and Integration Boundary

- Own the single web locale authority, typed message-resolution contract, core dictionary namespace, guarded storage,
  provider mounting, static startup metadata, explicit Frame/Sheet metadata bindings, and shared language selector.
- Integrate the selector into the existing Player drawer; preserve existing Player utility eligibility.
  Ticket 11.3 expands language access to resolving/empty/recovery phases without widening therapeutic eligibility.
- Expose stable contracts for locale, derived direction, typed messages/fallback metadata, and language selection.
  Feature tickets add only their own approved message namespaces; no per-screen locale store is permitted.
- Subsequent layout/motion work belongs to 11.2; broad Player copy and controls belong to 11.3.

## Acceptance Criteria

- [ ] TB-01: A real Player utility interaction changes `he`/RTL to `en`/LTR and back without reload or auth.
      Hebrew is selected on first use; valid saved locale is applied before the first visible application layout.
- [ ] TB-02: Missing, empty, malformed, or unsupported stored values resolve to Hebrew. Unavailable window/storage,
      read errors, and write/quota errors do not throw or prevent an in-memory language change.
- [ ] TB-03: The independent `pic-web.locale.v1` key stores only `he` or `en`; reload restores the selection.
      Selecting the current locale is a no-op. StrictMode does not cause duplicate domain work.
- [ ] TB-04: Document, TherapeuticFrame, and portalled Sheet expose matching `lang` and `dir` from one authority.
      Provider cleanup restores previous document metadata without altering viewport-lock ownership.
- [ ] TB-05: The selector is a labelled group of two native buttons with autonyms, per-label language/direction,
      and `aria-pressed`. Tab/Shift+Tab and Enter/Space work; no main-screen action or flag is added.
- [ ] TB-06: Selection keeps the Sheet open, retains button identity/focus and background inertness, and preserves
      existing Escape/overlay/close dismissal and trigger focus restoration. Targets are at least 44 x 44 CSS px.
- [ ] TB-07: Typed resolution supports selected locale, Hebrew then English fallback, declared interpolation/plurals,
      escaped inserted text, and actual-language fallback metadata. Raw keys/parameter tokens never reach the UI.
      Missing required approved keys are validation failures, not accepted runtime fallbacks.
- [ ] TB-08: No browser-language negotiation, account sync, or unsolicited cross-tab language change is introduced.
      The active tab keeps its locale; the next reload reads the latest saved preference.
- [ ] TB-09: Switching does not remount engines/screens/active units or invoke jump, response, Finish, reveal,
      promotion, or other therapeutic actions; current unit/session IDs and source-content cache remain stable.
- [ ] TB-10: Unit/integration tests exercise storage failures and resolution contracts; a browser test uses the
      real selector to prove switch, focus, metadata, and reload behavior. Scoped checks pass and scope is verified.

## Isolation Bounds / Do Not Touch

All implementation, styling, configuration, and UI tests stay inside `packages/pic-web`.
The active ticket markdown is the only planning-document write target during later resolution.
Zero edits to `packages/pic-engine`, adapters, RepositoryPort, migrations, seed content, domain tests, or root lockfile.
No new dependencies, content translations, course work, auth implementation, or engine-state mirror.
The approved spec and sibling tickets are read-only. Shared composition edits require coordinated ownership.

## Verification and Completion Evidence

Test the real provider and Player/Sheet composition at existing action seams, rather than hook internals.
Run affected frontend tests, `npm run typecheck`, `npm run depcruise --workspace=pic-web`, and the web build.
Verify owned browser behavior, lint, 130-character line limit, and web-only implementation diff.
Later implementation must record a Resolution addressing TB-01–TB-10; persistence alone satisfies none of them.

## Resolution

Implementation verified on 2026-10-11; ready for orchestrator review and the orchestrator-owned atomic commit.
No staging or commit was performed by the implementing agent. UI-copy approval was explicitly supplied on 2026-10-11:
"Yes; draft and use the Hebrew UI copy." Newly authored labels are product-approved application copy, not website quotations.
The orchestrator additionally authorized `app-providers.tsx` as this ticket's shared composition surface. It mounts one
`LocaleProvider` outside the existing engine/content providers without changing their order, constructors, or domain keys.

| Criterion | Result and evidence |
| --- | --- |
| TB-01 | Pass: real drawer switches he/RTL and en/LTR; fresh visits use Hebrew; reload restores English. |
| TB-02 | Pass: absent/empty/malformed/unsupported values, denied storage, read errors and quota failures are covered. |
| TB-03 | Pass: only `pic-web.locale.v1` holds preference; current selection does not write; StrictMode retains work. |
| TB-04 | Pass: document/Frame/portal agree; cleanup restores prior lang/dir without changing viewport-lock ownership. |
| TB-05 | Pass: labelled native-button group, autonyms, own lang/dir and pressed state; Enter/Space/Tab browser evidence. |
| TB-06 | Pass: open Sheet, DOM/focus and inertness persist; dismissal contracts and 44px targets pass. |
| TB-07 | Pass: typed parameters, he then en fallback, number/plural formatting and actual-language metadata. |
| TB-08 | Pass: no browser/account negotiation or storage subscription; other-tab changes apply next mount/reload. |
| TB-09 | Pass: StrictMode retains cache, repository/session, active unit and DOM; no therapeutic actions run. |
| TB-10 | Pass: storage/resolver/provider/screen tests and four real-selector Chromium viewport cases; scoped gates pass. |

TB-07 additionally has compile-only invalid-call fixtures, release validation of all nine required shared keys in both locales,
and a React text renderer with `<bdi>` inserts. Tests cover escaped personal text, unknown runtime keys, invalid/extra/missing
parameters, malformed string-valued plurals, absent/malformed plural variants, required availability text, Hebrew 0/1/2/3 and
fractional boundaries, and English singular/plural/count formatting. Required shipped keys never use runtime fallback.
The polite language-change message starts empty and updates only after an actual selector choice; no therapeutic announcement
is generated by selection. Full Player utility close/content messages are supplied to the Sheet, avoiding translated-title
lowercasing or concatenation. Standalone presentation primitives still inherit their embedding document without a provider.

### Red/green evidence

- Provider/presentation preservation and real selector composition were written before their missing modules/integration.
  The final observable tests retain the same draft, selector focus and active unit while changing language.
- Missing selected-locale message resolution first threw, then passed after Hebrew/English fallback was implemented.
- Declared plural resolution first failed, then passed after locale plural selection and numeric formatting were implemented.
- Unknown keys/invalid parameters first threw, then returned approved availability copy with truthful metadata.
- The polite selector announcement test first failed to find its live region, then passed with selection-only messaging.
- The malformed-plural regression first returned `Broken 2`, then correctly returned the valid Hebrew fallback variant.

### Verification

- `npm run test --workspace=pic-web`: **26 files / 160 tests passed** after review correction. The script runs root Vitest with
  repository-root `process.cwd`, preserving existing fixture paths and remote regression configuration.
- `npm run typecheck --workspace=pic-web`: passed, including invalid-key/parameter compile fixtures.
- `npm run depcruise --workspace=pic-web`: passed, 730 modules / 1443 dependencies; locale code imports no engines or adapters.
- `npm run test:browser --workspace=pic-web -- tests/locale-choice.browser.test.ts tests/unified-player.browser.test.ts`:
  **12 Chromium cases passed**. Four selector cases cover 320x568, 390x844, 768x1024 and 1440x900, with real storage,
  focus/DOM identity, Enter/Space and Tab/Shift+Tab, metadata, inertness, active-unit preservation, no switch requests and reload.
  Eight existing Player cases retain guidance scrolling, touch targets, Terminal NEMAR/Finish authority and reduced-motion RTL.
- Scoped ESLint over every changed web source, browser fixture/test and `scripts/test.mjs`: passed.
- `npm run build --workspace=pic-web`: passed; existing large-bundle and mixed static/dynamic-import warnings remain.
- `scripts/check-max-line-length.py` over all changed/untracked web files, using bundled Python: passed at 130 characters.
- `git diff --check`: passed. All application changes are inside `packages/pic-web`; engines/adapters/root metadata are unchanged.

Initial sandbox Vite cache renames failed with EPERM and sandbox Chromium lookup could not locate its browser executable.
Approved outside-sandbox reruns passed; those environment failures were not treated as passing tests or weakened coverage.
Legacy English assertions now declare a valid saved English preference. Legacy RTL browser cases declare Hebrew through the
same stored locale and actual provider, while the new selector cases leave fresh/restored storage authoritative.

### Downstream contract and limitations

`useLocale()` exposes `locale`, derived `direction`, stable `selectLocale`, and typed `message(key, parameters)` resolution.
`ResolvedMessage` provides text, isolated render parts, actual `locale`/`direction` and `fallback`; `LocalizedMessage` renders it
as React-escaped text. Add later feature namespaces to the canonical definitions and complete dictionaries; keep the required
key validation test exhaustive. Locale-sensitive message callbacks must not enter domain/content-loading effect dependencies.
`TherapeuticSheet` accepts complete `closeLabel` and `contentLabel` strings for subsequent localized compositions.

This ticket localizes shared Player utilities only. Existing Player therapeutic/recovery strings, earlier Guest Flow screens,
Persistence Gate content and treatment overlays remain their owning later tickets; no broader bilingual release is claimed.
Player resolving/empty/recovery utility eligibility is unchanged here and will be extended by 11.3. Device cutouts, mobile
keyboard behavior, physical desktop zoom, Hebrew pronunciation and real screen-reader announcements remain manual QA limits.

### Review correction after `b617a0e`

Standards review found no actionable issue. Spec review identified one P2: section 6.2(1) requires unsupported-runtime-locale
dictionary resolution, independently of stored-preference normalization. Untyped `resolve("fr", "greeting", { name: "Alex" })`
previously accessed an absent dictionary and threw a TypeError. The ticket returned to in-progress/under-review during correction.

The public runtime boundary now validates the supplied locale before dictionary access or Intl number/plural formatting.
Unsupported input resolves through Hebrew, reports the static defect `Unsupported message locale`, and always marks the result
as fallback while retaining the actual resolved locale/direction. The typed public contract remains exactly `he | en`.

Six parameterized cases (`fr`, empty string, malformed `he_??`, unsupported `he-IL`, null and undefined) first failed with
`Cannot read properties of undefined (reading 'greeting')`, then passed after normalization. Each case verifies Hebrew greeting,
grouped numeric count and fractional plural resolution without an invalid-locale exception, plus defect reporting.

Corrective gates passed: resolver tests **14/14**, full scoped frontend suite **26 files / 160 tests**, scoped typecheck,
depcruise, changed-resolver ESLint, changed-file 130-character checks and `git diff --check`. Prior **12/12 Chromium** evidence
remains valid: supported locales, selector behavior, dictionaries and browser composition are unchanged by this fix.
The corrective diff is limited to `messages.ts`, its resolver tests and this Resolution. No staging or commit was performed.

## Orchestrator closure

Closed on 2026-10-12. Commits and separate review results: b617a0e, 2e69889; Standards 0; Spec runtime-locale finding closed.
All reported corrective findings are closed; no blocking Standards or Spec finding remains.
The original Resolution records slice verification at implementation time.
Final assembled-wave gates and manual limitations are recorded in docs/handoffs/wave-11-handoff.md.
