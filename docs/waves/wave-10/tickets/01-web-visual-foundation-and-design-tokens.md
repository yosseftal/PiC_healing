# 10.1 — Web Visual Foundation and Design Tokens

**What to build:** establish the green Wave 10 baseline and give `pic-web` one working visual toolchain
with semantic therapeutic tokens, global viewport normalization, motion-token parity, and a real-browser
test harness. This is enabling prefactoring; it must not redesign a product screen or change domain
behavior.

**Blocked by:** None — can start immediately.

**Status:** done

## Frozen Requirements

- Runtime and styling changes live only in `packages/pic-web`.
- Root `package-lock.json` is the sole source/config exception for dependencies.
- Use Tailwind CSS v4 through its Vite integration.
- Install Motion and the minimal local shadcn/Radix dependencies needed by later tickets.
- Define the Sage, Lavender, Sterile Background, Quiet Text, focus, typography, spacing, shape, gradient,
  and motion tokens from the approved Wave 10 specification.
- Normalize `html`, `body`, and `#root`; viewport overflow locking remains opt-in to an adopted
  therapeutic frame.
- Honor `prefers-reduced-motion`.
- CSS motion values and typed Motion values must have a tested parity contract.

## Do Not Touch / Out of Scope

- Do not modify `packages/pic-engine`, either adapter, migrations, domain interfaces, or core tests.
- Do not refactor the Unified Player or another product screen in this ticket.
- Do not generate the broad shadcn/ui catalog.
- Do not introduce dark mode, gestures, or a public theming API.
- Do not change existing application behavior, engine calls, test selectors, or recovery copy.

## Acceptance Criteria

- [ ] The pre-change root test count and dependency-cruiser result are recorded before implementation.
- [ ] Tailwind v4, Motion, minimal shadcn/Radix support, and a real-browser test harness are declared only
      by `pic-web`; root lockfile changes contain only their dependency resolution.
- [ ] The Tailwind entry stylesheet is loaded by the web entry point and the production build emits its
      styles successfully.
- [ ] Every approved color, typography, spacing, shape, focus, gradient, and motion token is available
      from the `pic-web` visual foundation.
- [ ] Root normalization removes default margins and establishes full-size app roots without globally
      clipping unadopted screens.
- [ ] Reduced-motion defaults are present.
- [ ] A contract test proves CSS and typed Motion duration/easing values remain aligned.
- [ ] Existing tests remain unchanged and green; new foundation tests are green.
- [ ] `npm test`, root typecheck, `pic-web` build, workspace depcruise, lint, and changed-file line-length
      checks pass.
- [ ] Changed source/config paths are limited to `packages/pic-web` plus root `package-lock.json`.

## Resolution

Implemented the Wave 10 visual foundation without redesigning a product screen or changing domain behavior.

### Acceptance Criteria

- [x] Pre-change baseline recorded: the deterministic local suite passed 254 tests in 29 files with 9
      remote-dependent tests skipped. Dependency-cruiser reported zero violations for `pic-engine`
      (72 modules, 199 dependencies) and `pic-web` (631 modules, 1,183 dependencies).
- [x] Dependencies are declared only by `pic-web`: Tailwind CSS v4 with `@tailwindcss/vite`, Motion,
      Radix Dialog, the minimal local shadcn utility set, and Playwright. The root `package-lock.json`
      contains their dependency resolution; no other package manifest changed.
- [x] `visual-foundation.css` is imported by the web entry point, Tailwind runs through the Vite plugin,
      and the production build emitted `dist/assets/index-CToMDaAC.css` (7.21 kB, 2.31 kB gzip).
- [x] The approved color, typography, spacing, shape, focus, gradient, elevation, and motion tokens are
      declared in the `pic-web` visual foundation and covered by the four-test token contract.
- [x] `html`, `body`, and `#root` are full-sized with the browser margin removed. Global overflow is not
      clipped, leaving viewport locking opt-in for the later `TherapeuticFrame`.
- [x] Reduced-motion defaults remove active spatial distances and duration. A real Chromium test verifies
      the computed reduced-motion values.
- [x] The CSS/typed Motion contract compares every duration, easing value, and distance token.
- [x] The deterministic local suite is green after implementation: 259 passed and 9 skipped across 31
      test-file runs. The three approved existing web-test repairs preserve assertions and runtime behavior.
- [x] Approved scoped gates are green: `pic-web` typecheck; owned-file lint and line length; `pic-web`
      production build; `pic-web` dependency-cruiser; four foundation tests; and two Chromium tests.
- [x] Owned source/config changes are limited to `packages/pic-web`; the root lockfile is the only
      source/config exception. Unrelated dirty files were neither edited nor staged.

### Test-First Evidence

- The foundation contract first failed because `motion-tokens` did not exist, then passed after the typed
  tokens and stylesheet were added.
- The Tailwind wiring contract first failed before the entry-point import and Vite plugin were added.
- The public visual-foundation seam first failed before its index export was added.
- The browser harness first failed before Playwright configuration existed, then passed after configuration
  and local Chromium installation.

### Final Gate Evidence

- Deterministic local Vitest suite: 259 passed, 9 skipped; 31 test-file runs.
- Approved type-repair target: 21 passed, 1 remote integration test skipped.
- Visual-foundation contract: 4 passed.
- Playwright Chromium: 2 passed.
- `npm run typecheck --workspace pic-web`: passed.
- Owned TypeScript/TSX/config ESLint: zero errors.
- Owned-file 130-character check: passed.
- `npm run build --workspace pic-web`: passed; 352 modules transformed and CSS emitted.
- `npm run depcruise --workspace pic-web`: zero violations; 636 modules and 1,190 dependencies cruised.
- WCAG contrast checks passed: white/Sage 700 6.48:1, Lavender 700/Lavender 100 6.68:1,
  Ink/Sterile 12.77:1, and Quiet/Sterile 5.94:1.
- `git diff --check`: passed.

### Deviations

1. **Event-Manager-approved narrow web-test repairs.** Three existing `pic-web` tests received type-only
   maintenance required by the current production contracts: RepositoryPort fakes gained `getTreatment`,
   nullable Guest promotion groups are narrowed correctly, and async mocks receive their required typed
   values. Assertions and tested runtime behavior were not weakened.
2. **Event-Manager-approved root-gate bypass for this machine.** The ordinary root test/typecheck gate was
   not claimed as passing. Unchanged `pic-engine` session tests and the shared RepositoryPort contract
   report nullable-group TypeScript errors on this environment, while the primary environment is green.
   The Event Manager explicitly directed Ticket 10.1 to use the scoped `pic-web` evidence above and the
   deterministic local suite, without modifying pre-existing engine or root-level tests.
3. The ordinary remote Supabase suites remain environment-dependent through `.env.local`. They were not
   changed, masked, or used as evidence for a passing root gate.
