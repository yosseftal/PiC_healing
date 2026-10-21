# Wave 10 Sub-Agent Brief — Ticket 10.1

## Identity

- **Ticket:** 10.1 — Web Visual Foundation and Design Tokens
- **Wave:** 10 — Therapeutic UX and Visual Primitives
- **Orchestrator escalation channel:** stop and report; do not guess

## Permissions

- **Read-Write:** Ticket 10.1; `pic-web` package manifest, Vite setup, entry point, new visual
  foundation source, and new foundation tests; root lockfile only for dependency resolution.
- **Read-Only:** Approved Wave 10 specification; domain docs and decisions; existing web screens and
  tests.
- **Off limits:** `pic-engine`; both adapters; migrations; core tests; product-screen refactors; every
  unrelated dirty working-tree file.

## Frozen Requirements

Implement the ticket at:
`.scratch/wave-10-ui-primitives/issues/01-web-visual-foundation-and-design-tokens.md`.

Use the approved source specification at:
`.scratch/wave-10-ui-primitives.md`.

Verbatim requirements:

> Runtime and source changes live only in `packages/pic-web`.

> The root `package-lock.json` is the sole permitted file exception, and only for dependencies declared by
> `pic-web`.

> Use Tailwind CSS v4 in `pic-web`, integrated through the Tailwind Vite plugin.

> Use a local shadcn/ui Sheet component backed by Radix Dialog behavior. Do not install or generate the
> wider shadcn/ui catalog.

> Use the `motion` React package for presence-aware horizontal transitions.

> Global CSS is limited to token declaration, normalization of `html`, `body`, and `#root`,
> reduced-motion handling, and base typography.

This ticket installs the later-ticket dependencies but does not implement the Sheet, frame, slide,
action layout, or a screen redesign.

## Glossary Injection

- **Event Manager (EM):** the sovereign user managing their healing work.
- **Atomic Focus:** one therapeutic subject or choice set at a time; not a persistence entity.
- **Dumb Reflection:** UI reflects engine state and calls existing actions; it does not own domain state.
- **Safe Container:** a stable, positive, non-punitive experience that does not invent barriers.
- **Integrating:** the positive non-failure state; never rename it to Failed or incomplete.

## Seam Map Excerpt

| Seam | This ticket owns | Upstream | Downstream | Risk |
|------|------------------|----------|------------|------|
| Tailwind/Vite toolchain | yes | existing Vite app | all Wave 10 primitives | Must-fix: build must remain green |
| CSS semantic tokens | yes | approved spec values | frame, actions, Sheet, motion | Must-fix: exact names and values |
| Typed motion token parity | yes | approved motion contract | slide primitive | Must-fix: prevent CSS/TS drift |
| Engine/context APIs | no | `pic-engine` and composition root | current screens | Off limits |
| Browser harness | yes | existing Vite app | layout tickets | Clear if isolated to `pic-web` |

## Execution Contract

Use strict test-first implementation. Read current package and Vite conventions before writing.

1. Establish a deterministic baseline and record the result in the ticket Resolution. The ordinary root
   run currently stalls after remote Supabase suites read `.env.local`; do not modify those suites or the
   environment file. Distinguish the deterministic local baseline from the remote integration limitation.
2. Add only the minimal dependencies approved by the ticket. Install through npm workspaces so only the
   `pic-web` manifest and root lockfile change.
3. Add a failing token/motion/build contract test before implementation.
4. Implement tokens, normalization, typed motion parity, and browser-test harness without redesigning a
   product screen.
5. Do not edit or stage unrelated pre-existing working-tree changes.
6. Run targeted tests, root deterministic tests, root typecheck, `pic-web` build, workspace depcruise,
   lint, and explicit changed-file line-length checks.
7. Update the ticket to `Status: done` and append `## Resolution`, mapping every AC with evidence.
8. Commit only owned implementation files and root lockfile with an English `[10.1]` commit message.
   The ignored scratch ticket/brief may remain uncommitted.

## Acceptance Criteria

Copy and satisfy every unchecked criterion from Ticket 10.1. Stop and escalate if exact package versions,
the browser harness, or a required gate would force a write outside the allowed seam.
