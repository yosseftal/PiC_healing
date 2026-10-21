# 01: Official brand palette and accessible inquiry surfaces

**Ticket ID:** W12-01

**Wave:** 12

**Status:** done

**What to build:** The Event Manager sees the official PiC palette throughout the inquiry, Player, Utility Drawer, and Persistence
  Gate, with readable text and visible interaction states.

**Blocked by:** None (can start immediately).

**Source:** [Approved Wave 12 specification](../wave-12-spec.md), Implementation Decisions B; User Stories 11-13.
The nine-ticket breakdown and dependencies were approved without changes on 2026-10-13.

## Context Injection (verbatim)

> Palette implementation changes only Tailwind v4/CSS token definitions and aliases in the web package. Updating
> web test expectations for the new contract is permitted; per-component hardcoded replacements are not the strategy.

## Owned vertical slice

Own the visual-foundation color tokens, semantic aliases, and their web tests. Runtime palette edits are CSS/Tailwind token edits
  only. Preserve component markup, typography, layout, dimensions, motion, and interaction behavior.

## Acceptance criteria

- [x] AC-01: Declare exact official bases: primary #5B9C85, secondary #9B89A3, accent #81C7AF, and surface #FFFFFF; use the
  specification's observed neutral #454545 where appropriate. Do not import arbitrary plugin colors.
- [x] AC-02: Map existing sage/lavender consumers to the official bases and documented accessibility derivatives, including
  surfaces, borders, focus offsets, gradients, and shadows; no independent provisional green palette remains.
- [x] AC-03: Record each adopted derivative's base, sRGB mixing proportion, resolved value, and measured contrast. Use the
  specification's proposed #447564 button fill and #65596A focus shade unless measured roles require a documented adjustment.
- [x] AC-04: Normal text reaches 4.5:1; large text and required control/focus boundaries reach 3:1 against actual backgrounds,
  including gradients and alpha composition. Check default, hover, pressed, selected, recovery, and focus states.
- [x] AC-05: Selection, pending, and recovery retain non-color cues. Keyboard focus remains visible without relying on the pale
  accent ring alone.
- [x] AC-06: Render the assembled inquiry, Player, Sheet, and Gate in Hebrew/RTL and English/LTR with the updated tokens; preserve
  the single viewport, internal scrolling, and reduced-motion behavior.
- [x] AC-07: Update frozen palette expectations for the intentional new contract while retaining existing behavioral and contrast
  coverage. Component-specific hardcoded color substitutions are absent.

## Verification and prior art

Use existing visual-foundation token/contrast tests and browser fixtures for the Frame, controls, Sheet, and Player. Inspect
  computed styles rather than treating a source hex match as sufficient contrast proof.

## Dependencies and exclusions

This ticket can run independently of 02 and 03. Coordinate shared fixture edits with their owners; palette runtime ownership
  remains confined to CSS tokens.

## Isolation bounds

- Implementation and tests: 100% inside `packages/pic-web`. This active ticket's Resolution is the documentation exception.
- Zero edits to `packages/pic-engine`, either adapter package or their tests, database migrations, backend schemas,
  RPC definitions, seeds, root tooling, manifests, or lockfiles. Read public contracts; call them unchanged.
- Adapter access stays in the existing web composition root/promote boundary; screens use contexts/actions.
- Preserve Dumb Reflection, Event Manager sovereignty, blind ratings, at most two direct main-frame choices,
  WCAG AA in RTL/LTR, and the approved scope exclusions.
- Treat the Wave 12 spec as frozen. Report an unmet public-contract dependency rather than widening this ticket.

## Completion contract

- Add behavioral tests at the existing application/feature seam and run relevant unit/browser checks, web typecheck,
  lint, and dependency isolation checks; preserve the inherited 442 unit/integration and 161 browser coverage.
- Record exact verification commands/results and changed-path evidence. Required unavailable infrastructure is
  unverified, not a skipped green result. Full assembled-wave gates belong to W12-09.
- Before implementation dispatch, the orchestrator supplies the seam map and ticket-specific spawn brief and checks
  blockers. Shared-file writer coordination is separate from the approved functional dependency graph.
- During implementation, complete a per-AC Resolution and ticket-scoped atomic commit using this ticket ID.
  Ticket persistence alone does not check off acceptance criteria, create implementation commits, or dispatch work.

## Resolution

Implementation complete. Orchestrator review and closure passed on 2026-10-13.

### Solution Path

- AC-01: `visual-foundation.css` declares exact primary `#5B9C85`, secondary `#9B89A3`, accent `#81C7AF`,
  surface `#FFFFFF`, and observed neutral ink `#454545`. Frozen public token expectations were updated.
- AC-02: Existing sage/lavender consumers retain their classes through brand aliases and derived tints.
  Sterile, quiet, line, focus offset, gradients, and shadows now derive only from those bases or neutral ink.
  Runtime changes are confined to CSS token definitions; component markup and behavior are unchanged.
- AC-03: The derivative ledger below records rounded sRGB values and measured WCAG contrast.
  The proposed dark button `#447564` and focus `#65596A` are adopted without adjustment.
- AC-04: Browser checks measure computed foregrounds against actual ancestor backgrounds, including five samples
  along gradients and alpha composition. Enabled input/button text, boundaries and outlines are checked at 4.5/3/3.
  Default, hover, Space-pressed, selected, pending, recovery and focused states retain their checks.
- AC-05: Existing native checked states, `aria-pressed`, selected labels, pending/recovery text, and focus outlines
  remain intact. Focus checks require the dark 3px outline to pass independently of the pale green ring.
- AC-06: Assembled bilingual guest-flow tests cover inquiry, Player, Sheet and Gate in Hebrew/RTL and English/LTR
  at 320x568, 390x844, 768x1024 and 1440x900. Existing internal-scrolling, viewport and reduced-motion tests remain.
  Full Chromium regression passed all 161 cases.
- AC-07: Updated frozen token and rendered-color expectations only where the approved palette contract changes.
  No scenarios, contrast thresholds, retry settings, component classes or dependencies were removed/changed.

### Architectural Decisions

All percentages below use sRGB channel mixing, rounded to the nearest 8-bit channel for opaque tokens.
Contrast values use the WCAG relative-luminance formula and are rounded to two decimals for this ledger.
`white` means the official `#FFFFFF` surface; `ink` means the official observed neutral `#454545`.

| Token / role | Base and mix | Resolved value | Measured contrast and role |
| --- | --- | --- | --- |
| sterile / focus offset | 4% accent + 96% white | `#FAFDFC` | Ink 9.37:1; focus offset uses this alias. |
| sage-50 | 8% accent + 92% white | `#F5FBF9` | Ink 9.15:1; hover/confirmation surface. |
| sage-100 | 16% accent + 84% white | `#EBF6F2` | Ink 8.67:1; healing gradient stop. |
| sage-200 | 30% accent + 70% white | `#D9EEE7` | Ink 7.91:1; decorative confirmation boundary. |
| sage-500 | Exact primary alias | `#5B9C85` | White 3.21:1; supplemental ring only. |
| sage-700 | 75% primary + 25% black | `#447564` | White text 5.28:1; against lavender-100 4.71:1. |
| lavender-50 | 6% secondary + 94% white | `#F9F8F9` | Ink 9.05:1; reflection surface. |
| lavender-100 | 12% secondary + 88% white | `#F3F1F4` | Ink 8.54:1; recovery/gradient surface. |
| lavender-200 | 25% secondary + 75% white | `#E6E2E8` | Ink 7.49:1; decorative reflection boundary. |
| lavender-500 | Exact secondary alias | `#9B89A3` | White 3.23:1; identity, not normal white-text fill. |
| lavender-700 / focus | 65% secondary + 35% black | `#65596A` | White 6.58:1; lavender-100 5.86:1. |
| quiet | Exact ink alias | `#454545` | White 9.59:1; lavender-100 8.54:1. |
| line | 70% ink + 30% white | `#7D7D7D` | White 4.12:1; lavender-100 3.67:1. |
| card shadow | 8% ink + 92% transparent | ink alpha .08 | Over white `#F0F0F0`, 1.14:1; decorative. |
| Sheet shadow | 16% ink + 84% transparent | ink alpha .16 | Over white `#E1E1E1`, 1.31:1; decorative. |
| Existing Sheet overlay | Ink at 30% alpha | ink alpha .30 | Over white `#C7C7C7`, 1.69:1; decorative. |

Healing gradient interpolates sage-100 to lavender-100: minimum ink contrast 8.54:1.
Confirmation interpolates white to sage-50: minimum ink contrast 9.15:1.
Reflection interpolates white to lavender-50: minimum ink contrast 9.05:1.
Shadows/overlay are decorative; readable Sheet/Gate contents have opaque white surfaces above them.
The neutral line mix is intentionally darker because the same token forms the secondary action boundary;
its former pale value cannot meet the required 3:1 control contrast. Pale banner borders remain decorative,
with readable written confirmation/recovery cues. No new semantic role or per-component replacement was needed.

### Verification

Commands run from repository root unless a web working directory is stated:

- `npx vitest run packages/pic-web/src/visual-foundation/visual-foundation.test.ts`: observed RED for missing
  official primary, then GREEN with 4 tests after the token-only implementation.
- `npm run typecheck -w packages/pic-web`: PASS.
- `npm test -w packages/pic-web`: PASS, 31 files / 229 tests.
- `npm run depcruise -w packages/pic-web`: PASS, 746 modules / 1551 dependencies, no violations.
- `npx eslint packages/pic-web/src packages/pic-web/tests`: PASS.
- Web cwd: `npx playwright test tests/control-affordance.browser.test.ts tests/visual-foundation.browser.test.ts
  --workers=2`: PASS, 3 tests using the normal installed Chromium profile.
- Web cwd: `npx playwright test --workers=2`: PASS, 161 cases with unchanged retry policy.
- `git diff --check`: PASS. All changed web files and the active ticket satisfy the 130-character line limit.

Changed paths are the foundation CSS and token test, browser palette helper, and existing visual-foundation,
control-affordance, unified-player, bilingual-guest-flow and persistence-gate browser tests. The active ticket's
Resolution is the only documentation exception. No engine, adapter, database, dependency or manifest changes.

### Deviations and limits

The first sandbox browser run could not locate Chromium under the sandbox AppData profile. The same focused
command passed with authorized escalation against the normal installed browser; no install, bypass or skips.
All browser cases passed; Standards review: 0 findings; Spec review: 0 findings.
Root remote integration suites and physical-device,
mobile-keyboard, safe-area, zoom and Hebrew screen-reader evidence belong to the assembled Wave 12 validation;
this ticket does not claim those checks or the historical 442 root tests were rerun.
