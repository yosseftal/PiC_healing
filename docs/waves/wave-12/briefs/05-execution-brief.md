# W12-05 execution brief

## Identity

- Ticket: W12-05 — Real Email/Password login and Guest promotion
- Ticket specification: `docs/waves/wave-12/tickets/drafts/05-wave-12-real-login-and-promotion.md`
- Wave: 12. Dispatch authority covers all remaining Wave 12 tickets, 04 → 09 sequentially.
- Authorized for implementation after all declared blockers are closed and the preceding ticket is committed.
- Escalation: report concrete spec/contract conflicts to the orchestrator; do not widen scope.

## Permissions

Read-write: owned implementation/test modules inside `packages/pic-web` and this ticket's Resolution.
Own the accessible login Gate, web Auth client/context coordination, own-profile preparation in the existing promote
boundary, and normal-path promotion/recovery integration. Use existing engine, adapter, and RLS contracts.
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

> Auth success and saved work are separate states.

Read the full approved `docs/waves/wave-12/specs/wave-12-spec.md` section cited in the ticket before implementation.
Prior tracer-bullet/skill paths are historical references, not replacements for this Wave 12 specification.

## Glossary injection

> **Event Manager**:
> The user's role: active director of their own healing, not a passive patient or generic end-user.

> **Atomic Focus**:
> One muscle-test question at a time; small sequential steps in the Player.

Read relevant DEC entries in the approved spec's references when a therapeutic invariant is involved.
Canonical identifiers remain unchanged; the approved Wave 12 UI terminology takes precedence for presentation.

## Seam map excerpt

- Seam: Auth → profile → promotion.
- Owns: login and web identity bootstrap.
- Consumer/downstream: 06 recovery.
- Risk to verify: Existing profile RLS must support own-row creation; no backend edits.
- Full map: `docs/waves/wave-12/audits/wave-12-seam-map.md`.

## Execution contract

1. Apply `C:/Users/benda/.agents/skills/implement/SKILL.md`; use its TDD workflow at these existing seams.
2. Make one complete verifiable slice. Preserve prior-ticket changes; this is a shared checkout with serialized writers.
3. Run scoped typecheck, scoped web tests, depcruise, relevant browser tests, and lint. Do not weaken baseline coverage.
   Root-cwd commands: `npm run typecheck -w packages/pic-web`, `npm test -w packages/pic-web`,
   `npm run depcruise -w packages/pic-web`. Browser tests run from the web workspace with two workers.
4. Keep every new/changed line within the repository's 130-character limit; do not add dependencies or change lockfiles.
5. Report AC-by-AC evidence and update Resolution. Leave status pending closure until orchestrator verifies.
6. Ask orchestrator for the review fixed point after implementation; the orchestrator conducts the two-axis
   code-review and commits verified work with `[W12-05]`. Do not commit or dispatch another implementation yourself.
7. If sandbox infrastructure blocks a test, report the exact failure promptly; do not bypass TLS, skip tests,
   or alter application behavior to accommodate the harness.

## Acceptance Criteria (checklist)

- [ ] AC-01: Keep full Guest inquiry available before anchoring. At Finish/Finish Anyway show a real Email/Password form
  using the installed Supabase signInWithPassword API and a single web-owned client lifecycle.
- [ ] AC-02: Replace production tracer-credential sign-in and disabled provider placeholders. Production behavior uses public
  Supabase configuration only and does not read or ship tracer-user passwords.
- [ ] AC-03: Provide Hebrew/English labels, email/password autocomplete, linked validation/recovery messages, pending state,
  and duplicate-submission prevention. Do not trim passwords or persist/log credentials in custom storage, URLs, or
  telemetry.
- [ ] AC-04: Use the existing Radix dialog foundation for inert background, focus trap/restoration, title/description, and
  internal form scrolling. Preserve 04's explicit discard confirmation and the main frame's two-choice limit.
- [ ] AC-05: Derive the owner from a verified authenticated identity, never a form-supplied user ID. Auth success alone must
  not announce that work is saved.
- [ ] AC-06: Before promotion, ensure the authenticated user's own profiles row exists using existing RLS; insert a missing
  ID/name idempotently, re-read after concurrent creation, and preserve existing name/preferences. No profile migration,
  trigger, or service-role browser client.
- [ ] AC-07: Promote finalized linked-group and group:null snapshots through the existing authenticated repository binding
  and SessionEngine contract. Preserve UUIDs, ratings, links, progress, terminal answer, and pending Finish kind.
- [ ] AC-08: Normal success produces exactly one intended timeline/use-count effect, retains authenticated provider
  continuity in the runtime, and does not append a UI-driven second Finish call.
- [ ] AC-09: Credential/config/network/profile/RPC rejection retains Guest work and supports localized retry. A still-valid
  authenticated identity can retry saving without another password prompt; restore the previous provider on promotion
  failure.
- [ ] AC-10: Freeze one request per flow generation/owner, serialize reset during provider switching, and reject stale or
  changed-owner requests. Interruption/reload recovery is completed by 06.
- [ ] AC-11: Real Supabase evidence covers own-profile creation and preservation plus linked/unlinked promotion. Do not hide
  bootstrap behavior by manually pre-seeding the missing-profile case.


## Dispatch preflight discovered after Frontier 1

Remote connectivity and expected schema/RPC presence passed with normal TLS.
Public Auth settings: email enabled, signup allowed, email confirmation enabled.
Evidence: docs/waves/wave-12/archive/connectivity-preflight.md. No hosted settings were changed.
Root .env.local has SUPABASE_URL/ANON_KEY and a test-only SERVICE_ROLE_KEY, with no VITE aliases or tracer credentials.
The current Vite configuration does not expose root non-VITE values to browser import.meta.env.
Resolve public configuration inside pic-web if required, exposing exactly URL+anon key; never use a broad SUPABASE_ prefix.
Real missing-profile RLS/bootstrap and linked/unlinked promotion evidence is required, using isolated fixtures and cleanup.
Admin helpers belong to test-only setup/cleanup. Browser runtime must never import a service-role client or password fixture.
Session success must be based on verified Auth identity; do not fabricate therapeutic engine mode to implement login.
