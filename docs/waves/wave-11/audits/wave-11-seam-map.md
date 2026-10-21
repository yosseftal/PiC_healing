# Wave 11 execution seam map

Date: 2026-10-11. Baseline: `dddd56d`. Frozen source: `docs/waves/wave-11/specs/wave-11-i18n-spec.md`.

The approved tickets are at `docs/waves/wave-11/tickets/`; the latest dispatch request's
`docs/waves/` reference is stale. Reuse the existing eight ticket files.
Eight pre-dispatch briefs are at `docs/waves/wave-11/briefs/`. No duplicate ticket set is created.

| Ticket | Owned presentation seam | Depends on | Main risk |
| --- | --- | --- | --- |
| 11.1 | Locale authority, storage, typed messages, selector and metadata | None | Remount/state reset; approved product copy |
| 11.2 | Frame/card/Sheet logical layout, interrupted/reduced motion | 11.1 | Double reversal; focus/callback races |
| 11.3 | Player, NEMAR, navigation/Finish copy and recovery language access | 11.1 | Changing eligibility or state |
| 11.4 | Group creation, symptom addition and blind-rating UI | 11.2 | Draft loss or implicit history reveal |
| 11.5 | Joint inquiry, summary and picker shell/controls | 11.2 | Route or voluntary-link mutation |
| 11.6 | Persistence Gate copy and locale preservation | 11.1 | Locale enters promotion payload |
| 11.7 | Canonical-content display overlay through existing read seam | 11.3, 11.5 | Stale source or unit-ID drift |
| 11.8 | Complete-flow browser/coverage/boundary gates | 11.4, 11.6, 11.7 | Incomplete coverage claimed green |

The orchestrator serializes ticket mutations within each frontier, because composition and dictionaries
share files. Ticket independence does not authorize concurrent writes to the same surface.
Order: 11.1 -> 11.2 -> 11.3 -> 11.6 -> 11.4 -> 11.5 -> 11.7 -> 11.8.

## Fixed authority and boundaries

- All implementation, assets, test/config changes remain inside `packages/pic-web`; no dependency additions.
- Planning briefs/ticket resolutions and the requested final handoff are documentation exceptions only.
- Engines, adapters, RepositoryPort, schemas/migrations, canonical seeds and root dependency/tool metadata are read-only.
- One locale authority drives document, Frame and portal metadata without remounting providers or stable domain keys.
- Existing context actions own navigation, rating, Finish/Finish Anyway, promotion and persistence.
- Canonical parsed-content reads remain locale-independent for guards/startup; overlays change display fields only.
- Approved public test seams are provider/screen composition, existing context actions, and pure message/content resolution.

## Must-fix and decision log

1. On 2026-10-11 the user explicitly approved drafting and using Hebrew UI controls, banners and assistive text.
   This supersedes pending UI-copy prerequisites for this run. Record new wording as product-approved copy,
   grounded in official PIC terminology and tone; never claim new labels are website quotations.
2. The user authorized translating the three bundled treatments as product-approved content on 2026-10-11.
   This supersedes the official-content-pack prerequisite for this run; never claim website publication provenance.
3. The web workspace lacks a test script. Ticket 11.1 must add a scoped script using the root Vitest config,
   without modifying root tooling. Existing tests with English assertions need explicit English fixtures.
4. Initial sandbox Vitest failed before tests ran due to EPERM temporary-file renames. Approved rerun passed 22 files/130 tests.
5. Source-order Atomic Unit IDs require exact canonical source matching; translated Markdown cannot drive identity.
6. Player language access in empty/recovery phases must not expose prohibited navigation/Finish controls.
7. Real device cutouts, mobile keyboard, desktop zoom and Hebrew screen-reader pronunciation require manual evidence.
   Record these as unverified if no device/manual run occurs; do not claim Chromium proves them.

## Gate protocol

Per ticket: scoped typecheck, scoped frontend unit/component tests, depcruise, owned browser evidence and build/lint checks.
Review and append per-criterion Resolution before the orchestrator's clean ticket commit.
Use the scoped browser script (or invoke Playwright from the web workspace) so its configured test directory is used.
Final root gates: typecheck, lint, full tests and all configured Chromium browser tests.
External/sandbox failures remain distinct from implementation failures; never skip or weaken coverage to obtain green.
