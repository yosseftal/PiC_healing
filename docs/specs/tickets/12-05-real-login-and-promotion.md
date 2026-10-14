# 05: Real Email/Password login and Guest promotion

**Ticket ID:** W12-05

**Wave:** 12

**Status:** done

**What to build:** An existing account holder signs in at the Persistence Gate and anchors the active Guest inquiry under their
verified identity without losing therapeutic continuity.

**Blocked by:** W12-04 — Start anew from the Player and Persistence Gate.

**Source:** [Approved Wave 12 specification](../wave-12-spec.md), Implementation Decisions D (Form, Profile,
Promotion contracts); User Stories 19, 21, 24-30.
The nine-ticket breakdown and dependencies were approved without changes on 2026-10-13.

## Context Injection (verbatim)

> Auth success and saved work are separate states.

## Owned vertical slice

Own the accessible login Gate, web Auth client/context coordination, own-profile preparation in the existing promote boundary,
and normal-path promotion/recovery integration. Use existing engine, adapter, and RLS contracts.

## Acceptance criteria

- [x] AC-01: Keep full Guest inquiry available before anchoring. At Finish/Finish Anyway show a real Email/Password form using
  the installed Supabase signInWithPassword API and a single web-owned client lifecycle.
- [x] AC-02: Replace production tracer-credential sign-in and disabled provider placeholders. Production behavior uses public
  Supabase configuration only and does not read or ship tracer-user passwords.
- [x] AC-03: Provide Hebrew/English labels, email/password autocomplete, linked validation/recovery messages, pending state, and
  duplicate-submission prevention. Do not trim passwords or persist/log credentials in custom storage, URLs, or telemetry.
- [x] AC-04: Use the existing Radix dialog foundation for inert background, focus trap/restoration, title/description, and
  internal form scrolling. Preserve 04's explicit discard confirmation and the main frame's two-choice limit.
- [x] AC-05: Derive the owner from a verified authenticated identity, never a form-supplied user ID. Auth success alone must not
  announce that work is saved.
- [x] AC-06: Before promotion, ensure the authenticated user's own profiles row exists using existing RLS; insert a missing
  ID/name idempotently, re-read after concurrent creation, and preserve existing name/preferences. No profile migration, trigger,
  or service-role browser client.
- [x] AC-07: Promote finalized linked-group and group:null snapshots through the existing authenticated repository binding and
  SessionEngine contract. Preserve UUIDs, ratings, links, progress, terminal answer, and pending Finish kind.
- [x] AC-08: Normal success produces exactly one intended timeline/use-count effect, retains authenticated provider continuity in
  the runtime, and does not append a UI-driven second Finish call.
- [x] AC-09: Credential/config/network/profile/RPC rejection retains Guest work and supports localized retry. A still-valid
  authenticated identity can retry saving without another password prompt; restore the previous provider on promotion failure.
- [x] AC-10: Freeze one request per flow generation/owner, serialize reset during provider switching, and reject stale or
  changed-owner requests. Interruption/reload recovery is completed by 06.
- [x] AC-11: Real Supabase evidence covers own-profile creation and preservation plus linked/unlinked promotion. Do not hide
  bootstrap behavior by manually pre-seeding the missing-profile case.

## Verification and prior art

Extend Gate and promotion-path component tests plus browser login scenarios. Run applicable existing remote checks with isolated
accounts and cleanup; mocks prove UI states, not deployed RLS/Auth behavior.

## Dependencies and exclusions

Deployment prerequisite: working public configuration and own-profile RLS. Report missing environment capability without schema
changes. Registration is 07, advanced recovery 06, identity restoration 08.

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

Implementation, independent review, and final scoped gates complete; awaiting orchestrator closure.


### Solution Path

- AC-01: Guest inquiry still reaches Finish/Finish Anyway before authentication. The existing Radix Gate now presents
  a real Email/Password login. One lazy composition-owned Supabase client handles sign-in and verified identity.
- AC-02: Removed production tracer credential readers/sign-in helpers and disabled provider placeholders. Vite disables
  automatic environment-prefix exposure and explicitly defines only the public URL and anon key.
- AC-03: Typed Hebrew/English labels include email/current-password autocomplete, linked validation/recovery, busy state,
  and duplicate-submit exclusion. Passwords remain untrimmed, transient, and clear after submission or explicit discard.
  Tests cover whitespace preservation, invalid input, duplicate submissions, locale changes, and retry validation.
- AC-04: Reused Radix modal focus trapping, background isolation, focus restoration, title/description, and internal
  scrolling. Shared04 reset controls still require explicit discard confirmation and preserve work on cancellation.
  Bilingual keyboard browser cases cover four viewport widths; the main Player retains its two-choice layout.
- AC-05: Server-verified getUser plus confirmed email determines the owner. Editable login fields never supply an owner
  ID. Authentication and saved-work states remain separate; authenticated retry explains that saving is still pending.
- AC-06: Own-profile bootstrap uses the authenticated anon client and existing RLS: read, insert missing ID/name, re-read
  after insertion or concurrent creation. Existing profiles are returned unchanged, preserving name and preferences.
- AC-07: Frozen finalized linked-group and group:null snapshots reuse the existing repository/SessionEngine promotion
  contracts. Tests preserve UUIDs, links, unit progress, terminal Yes/No, and Finish/Finish Anyway intent. The inherited
  public request mirror and04 reset recovery continue to preserve pending intent across cleanup trouble.
- AC-08: Existing engine/RPC owns Finish effects. Real linked/unlinked promotion each produces one timeline row and
  use_count1; successful promotion retains the authenticated provider and clears Guest residue. UI adds no Finish call.
- AC-09: Failed login/config/profile/RPC leaves Guest work intact. RPC failure restores the previous repository provider.
  A verified identity retries without another password, using the same frozen snapshot; localized recovery remains calm.
- AC-10: One operation per flow generation freezes owner, snapshot, and pending kind. A web exclusive-operation barrier
  drains previously admitted writes before freezing work and prevents new therapeutic writes across provider switching.
  Reset tracks the whole operation and waits. Changed-owner requests reject before RPC; duplicate login runs once.
- AC-11: Real normal-TLS Supabase tests use isolated Auth fixtures and cleanup. A genuinely absent profile is asserted
  before authenticated RLS bootstrap, with no manual profile seed. A preservation test retains edited full_name and
  language_preferences. Linked Finish and unlinked Finish Anyway verify persisted progress, terminal answer, and counts.

### Architectural Decisions

- Keep adapter construction/profile bootstrap in the existing web composition/promote boundary; screens use context.
  SDK identity never fabricates therapeutic engine mode or reaches private engine state.
- The exclusive web operation drains earlier writes and registers the entire login/save operation with04 settlement.
  Its nested engine promotion uses the existing untracked composition action to avoid waiting on its own operation.
- Retry request state is memory-only and contains no credentials. Durable interruption/reload envelopes, response-loss
  reconciliation, registration/verification, and restored identity/expiry remain tickets06/07/08.
- Preserve the existing cleanup contract; advanced interrupted post-RPC cleanup correction remains06.
- Set Vite envPrefix to an empty list as well as the explicit public define allowlist. This prevents legacy VITE tracer
  password variables from leaking when runtime code reads import.meta.env as an object.

### Verification

- Red/green: missing real Hebrew form labels failed then passed; installed-SDK real sign-in helper failed then passed.
  The concurrent-login test first observed two sign-ins, then passed with one frozen operation and verified retries.
- Review regressions: failed-login then empty Retry produced duplicate message IDs/alerts before the single-message fix.
  Explicit discard then reopening the same mounted Gate retained the password before transient-state cleanup.
- Scoped typecheck passed after corrections. Full web suite passed alone before Chromium:34 files/279 tests,
  exit0 in29.62 seconds.
- Dependency isolation passed:756 modules/1611 dependencies, zero violations. Web ESLint passed.
- Final focused Chromium passed24 cases with two workers in41.8 seconds after review corrections, exit0.
  Command from packages/pic-web: npx playwright test tests/inquiry-reset.browser.test.ts
  tests/player-reset.browser.test.ts tests/persistence-gate.browser.test.ts tests/unified-player.browser.test.ts --workers=2
- Production build passed. Bundle scan confirmed public URL/anon key present and private deployment credential values
  absent, without printing them. A further production build under a synthetic legacy VITE tracer password reported
  zero sentinel/key-marker leaks. Public-config contract asserts an exact two-key allowlist.
- promote-path.test.ts real remote checks passed with isolated fixture cleanup; the complete web suite also reran them.
  happy-path-e2e.test.tsx enters fixture email/password through the real Gate and verifies cloud persistence.
- Sandbox Vite cache rename EPERM required escalated test execution. No TLS, timeout, retries, or dependency changes.
- git diff --check passed; every changed/new web line is at most130 characters. All runtime/test/config edits stay
  inside packages/pic-web. Independent Standards and Spec reviews both report zero remaining findings.

### Deviations

- No public-contract or scope deviation. All runtime/tests/config changes stay in packages/pic-web; this Resolution
  is the sole documentation exception. No engine/adapter/schema/migration/root/manifests/lockfiles changed.
- Registration and real email confirmation delivery belong07; interrupted promotion recovery belongs06; restored
  identity/expiry belongs08. Physical-device and assistive-technology release evidence remains09.
