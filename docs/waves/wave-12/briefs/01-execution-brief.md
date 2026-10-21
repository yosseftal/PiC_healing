# W12-01 execution brief

## Identity

- Ticket: W12-01 — Official brand palette and accessible inquiry surfaces
- Ticket specification: `.scratch/pic-tracer-bullet/issues/01-wave-12-brand-palette.md`
- Wave: 12. Dispatch authority for this run covers 01 → 02 → 03 sequentially only.
- Authorized frontier ticket; wait for previous ticket verification and commit.
- Escalation: report concrete spec/contract conflicts to the orchestrator; do not widen scope.

## Permissions

Read-write: owned implementation/test modules inside `packages/pic-web` and this ticket's Resolution.
Own the visual-foundation color tokens, semantic aliases, and their web tests. Runtime palette edits are CSS/Tailwind token
edits only. Preserve component markup, typography, layout, dimensions, motion, and interaction behavior.
Read-only: approved Wave 12 spec, CONTEXT.md, decisions.md, CLAUDE.md, public engine/adapter contracts,
and sibling tickets. Orchestrator owns seam map, handoff, tracking documents, and final commits.
- Implementation and tests: 100% inside `packages/pic-web`. This active ticket's Resolution is the documentation exception.
- Zero edits to `packages/pic-engine`, either adapter package or their tests, database migrations, backend schemas,
  RPC definitions, seeds, root tooling, manifests, or lockfiles. Read public contracts; call them unchanged.
- Adapter access stays in the existing web composition root/promote boundary; screens use contexts/actions.
- Preserve Dumb Reflection, Event Manager sovereignty, blind ratings, at most two direct main-frame choices,
  WCAG AA in RTL/LTR, and the approved scope exclusions.
- Treat the Wave 12 spec as frozen. Report an unmet public-contract dependency rather than widening this ticket.

## Frozen requirements (verbatim)

> Palette implementation changes only Tailwind v4/CSS token definitions and aliases in the web package. Updating
> web test expectations for the new contract is permitted; per-component hardcoded replacements are not the strategy.

Read the full approved `docs/specs/wave-12-spec.md` section cited in the ticket before implementation.
Prior tracer-bullet/skill paths are historical references, not replacements for this Wave 12 specification.

## Glossary injection

> **Event Manager**:
> The user's role: active director of their own healing, not a passive patient or generic end-user.

> **Atomic Focus**:
> One muscle-test question at a time; small sequential steps in the Player.

Read relevant DEC entries in the approved spec's references when a therapeutic invariant is involved.
Canonical identifiers remain unchanged; the approved Wave 12 UI terminology takes precedence for presentation.

## Seam map excerpt

- Seam: CSS tokens → rendered controls.
- Owns: visual-foundation CSS and color verification.
- Consumer/downstream: all existing token consumers.
- Risk to verify: White on official primary fails normal-text AA; use approved dark derivative.
- Full map: `docs/audits/wave-12-seam-map.md`.

## Execution contract

1. Apply `C:/Users/benda/.agents/skills/implement/SKILL.md`; use its TDD workflow at these existing seams.
2. Make one complete verifiable slice. Preserve prior-ticket changes; this is a shared checkout with serialized writers.
3. Run scoped typecheck, scoped web tests, depcruise, relevant browser tests, and lint. Do not weaken baseline coverage.
   Root-cwd commands: `npm run typecheck -w packages/pic-web`, `npm test -w packages/pic-web`,
   `npm run depcruise -w packages/pic-web`. Browser tests run from the web workspace with two workers.
4. Keep every new/changed line within the repository's 130-character limit; do not add dependencies or change lockfiles.
5. Report AC-by-AC evidence and update Resolution. Leave status pending closure until orchestrator verifies.
6. Ask orchestrator for the review fixed point after implementation; the orchestrator conducts the two-axis
   code-review and commits verified work with `[W12-01]`. Do not commit or dispatch another implementation yourself.
7. If sandbox infrastructure blocks a test, report the exact failure promptly; do not bypass TLS, skip tests,
   or alter application behavior to accommodate the harness.

## Acceptance Criteria (checklist)

- [ ] AC-01: Declare exact official bases: primary #5B9C85, secondary #9B89A3, accent #81C7AF, and surface #FFFFFF; use the
  specification's observed neutral #454545 where appropriate. Do not import arbitrary plugin colors.
- [ ] AC-02: Map existing sage/lavender consumers to the official bases and documented accessibility derivatives, including
  surfaces, borders, focus offsets, gradients, and shadows; no independent provisional green palette remains.
- [ ] AC-03: Record each adopted derivative's base, sRGB mixing proportion, resolved value, and measured contrast. Use the
  specification's proposed #447564 button fill and #65596A focus shade unless measured roles require a documented adjustment.
- [ ] AC-04: Normal text reaches 4.5:1; large text and required control/focus boundaries reach 3:1 against actual
  backgrounds, including gradients and alpha composition. Check default, hover, pressed, selected, recovery, and focus
  states.
- [ ] AC-05: Selection, pending, and recovery retain non-color cues. Keyboard focus remains visible without relying on the
  pale accent ring alone.
- [ ] AC-06: Render the assembled inquiry, Player, Sheet, and Gate in Hebrew/RTL and English/LTR with the updated tokens;
  preserve the single viewport, internal scrolling, and reduced-motion behavior.
- [ ] AC-07: Update frozen palette expectations for the intentional new contract while retaining existing behavioral and
  contrast coverage. Component-specific hardcoded color substitutions are absent.

