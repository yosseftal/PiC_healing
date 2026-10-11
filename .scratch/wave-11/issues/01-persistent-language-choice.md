# 11.1 — Persistent Language Choice in the Player Drawer

**What to build:** An Event Manager opens Player utilities, selects Hebrew or English, and sees the shared
utility text and semantic language/direction update in place. The preference survives reload without changing
the current healing work. This is a working UI-to-preference tracer bullet, not an isolated context implementation.

**Blocked by:** None (no implementation-ticket dependencies).

**Status:** ready-for-agent

**Dispatch state:** Not dispatched. Applicable copy prerequisites must be resolved before completing this slice.

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
