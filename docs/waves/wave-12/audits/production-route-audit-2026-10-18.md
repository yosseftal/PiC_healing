# Production route and quality-gate audit — 18 October 2026

## Verdict: PASS

Scope: all entry points and runtime imports in `packages/pic-web`, its browser harnesses,
production output, and the requested repository-wide quality gates. Remediation was explicitly
authorized by the task. Engine, adapter, migration, and lock files are unchanged.

### Must-Fix Items

- None remaining. The enforced production boundary and all requested quality gates pass.

### Should-Fix Items

- No additional source remediation identified. Deploy using Vercel Root Directory
  `packages/pic-web`, so its checked-in `vercel.json` controls the build and output directory.
  Deployment itself is outside this remediation pass.

### Evidence Trail

- `src/main.tsx:1–15`, `src/App.tsx:1–15`: one product entry, provider tree,
  GuestModeShell, and GuestFlowRouter; no debug switch or URL-selected harness.
- `src/guest-flow-screens.tsx:11–29`: only group creation, joint treatment inquiry,
  group summary, treatment selection, and Unified Player. The inquiry and treatment picker
  are existing steps within the approved product flow.
- `src/GuestModeShell.tsx:12–18`: Persistence Gate is mounted within the product shell.
- `src/guest-flow-context.tsx:8–15`, `src/guest-flow-facts.ts:42–55`: navigation reflects
  external engine/composition state, preserving Dumb Reflection (DEC-015). No new UI state added.
- `src/RatingControl.tsx:29–73,100–116`: prior ratings remain hidden until explicit Reveal;
  local state controls disclosure only (DEC-011).
- `src/FinishBar.tsx:24–60`: Finish Anyway remains available independently of a negative
  Terminal NEMAR response, preserving EM Sovereignty (DEC-015).
- `../pic-engine/package.json:1–15`: no runtime UI/adapter dependency. Engine source scan found
  no runtime fetch, localStorage, window, or Supabase access; textual matches were comments.
- `../pic-engine/src/tracer-bullet-seed-treatments.ts:64–91`,
  `../../supabase/migrations/20260831193914_align_seed_treatment_ids.sql:1–18`, and
  `src/tracer-bullet-seed-treatments.remote.test.ts:76–99`: the three offline Guest treatments
  retain canonical production IDs; remote parity passed. They are product data needed for
  Guest Mode (DEC-017), not standalone mock pages.
- `build/production-boundary.ts:4–35`, `vite.config.ts:8–28`: enforced build and serving boundaries.
- `test/production-boundary.test.ts`: real bundler rejection tests and HTTP mode-gating tests.
- `tests/production.browser.test.ts`: compiled-preview URL denial and actual product journey checks.

## Findings and remediation

No orphan production screen or mock-route branch was found in `src`. Eleven standalone browser
harnesses exist under `tests/`, each with an HTML/TSX entry:

| Harness basename | Purpose | Disposition |
| --- | --- | --- |
| content-localization | Localized content and assembled guest flow | Explicit browser-test mode only |
| control-affordance | Control presentation | Explicit browser-test mode only |
| inquiry-selection | Inquiry and treatment selection | Explicit browser-test mode only |
| registration | Registration transport harness | Explicit browser-test mode only |
| returning-identity | Identity restoration harness | Explicit browser-test mode only |
| rtl-composition | RTL composition | Explicit browser-test mode only |
| symptom-creation | Symptom creation | Explicit browser-test mode only |
| therapeutic-frame | Frame/layout | Explicit browser-test mode only |
| therapeutic-sheet | Drawer behavior | Explicit browser-test mode only |
| unified-player | Player and mock content | Explicit browser-test mode only |
| wave12-journey | Assembled identity/reset journeys | Explicit browser-test mode only |

The baseline Vite build already emitted only `index.html` and its assets. The missing protection
was an enforced boundary against future accidental fixture imports, extra HTML entries, or
deployment configuration drift. This pass therefore gates the harnesses rather than deleting
the browser regression suite:

- Ordinary `npm run dev` denies test/fixture URLs. Playwright explicitly opts into
  `browser-test` mode; manual harness work uses `npm run dev -- --mode browser-test`.
- Every production build rejects test, spec, fixture, type-fixture, mock/debug directory, and
  test-helper modules in its graph, including `src/i18n/terminology-test-fixture.tsx`.
  The build guard applies regardless of mode.
- `index.html` is the explicit sole HTML input. Unapproved output files fail the build.
  Public-directory copying is disabled. The retained source/type fixtures are not shipped.
- Vite preview no longer falls back to the product page for unknown paths. Vercel is configured
  to serve `/`, `/index.html`, and built `/assets/` files and return 404 for other paths.
  See [Vercel static configuration](https://vercel.com/docs/project-configuration/vercel-json).
- Added `npm run preview -w packages/pic-web`. Playwright builds and starts a separate production
  preview on port 4174 in addition to its gated fixture server on port 4173.
- Fixed the extensionless Vite-config import and ineffective dynamic imports. Removed the
  reverse dependency from guest-flow facts to the composition root; reset wiring now follows
  its existing injected-dependency pattern. Async action/initialization scheduling is preserved.
- Split React, Supabase, and remaining vendor code into separate chunks, fixing the original
  oversized-chunk warning without suppressing warnings or raising thresholds.
- No product copy was changed; canonical Event Manager, Integrating, and Atomic Focus vocabulary
  remains unchanged. Rating and Finish behavior was verified rather than redesigned.

## Live deployment observation

Read-only GET checks against [the supplied Vercel deployment](https://pic-healing-pic-web.vercel.app/)
returned 200 for `/` and 404 for all eleven `/tests/<basename>.fixture.html` paths above,
`/src/main.tsx`, `/debug`, `/mock`, and `/@vite/client`.

The reported exposed dev page was not reproduced at these known URLs. This is an observation
of the existing deployment, not evidence that this cleanup has already been deployed.

## Quality gates

- **Gate:** `npm run depcruise -w packages/pic-web`
  **Result:** PASS — 766 modules, 1,669 dependencies, zero violations

- **Gate:** `npm run depcruise -w packages/pic-engine`
  **Result:** PASS — 72 modules, 199 dependencies, zero violations

- **Gate:** Root `npm run typecheck`
  **Result:** PASS — all four workspaces

- **Gate:** Root `npm run lint`
  **Result:** PASS

- **Gate:** Root `npm test`
  **Result:** PASS — 55 files, 572 tests, zero failures/skips; workspace depcruise passed

- **Gate:** `npx playwright test` in pic-web
  **Result:** PASS — 181/181 Chromium tests, 2.9 minutes, including compiled production preview

- **Gate:** `npm run build -w packages/pic-web`
  **Result:** PASS — zero warnings; one HTML entry, one CSS file, five JS files; largest JS chunk 322.69 kB

- **Gate:** Supplemental TypeScript check of new build/test/config files
  **Result:** PASS

- **Gate:** `git diff --check`
  **Result:** PASS


The 572 tests include twelve new production-boundary checks. Real signup used a fresh,
user-authorized timestamp alias on `@pic-healing.com`; the existing test owns its cleanup.
Initial sandbox-only test attempts failed on Windows filesystem permissions and were rerun
outside that sandbox with normal TLS verification. Initial overlapping suite runs had timeouts;
the final suites run separately. An initialization cycle introduced during warning cleanup was
reproduced in the focused guest-flow-facts test and corrected before the passing full run.

## Delivery state

All requested gates pass. The changes and this report are recorded together in a local commit;
the working tree is checked after that commit. The compiled bundle is ready for Vercel using
the package-root configuration described above. No push or Vercel deployment performed.
