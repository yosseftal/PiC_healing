# Wave 12 execution seam map

Date: 2026-10-13. Start commit: `772df65`. Current authorization: W12-01 → W12-02 → W12-03 sequentially.

## Scope and inventory

Approved requirements: `docs/waves/wave-12/specs/wave-12-spec.md`.
All nine open tickets: `docs/waves/*-wave-12-*.md`.
All nine prepared briefs: `docs/waves/wave-12/briefs/NN-execution-brief.md`.
Only 01, 02, and 03 execute in this run. Later tickets remain ready-for-agent with their original blockers.

Functional dependencies: 01 none; 02 none; 03 none; 04 ← 03; 05 ← 04; 06 ← 05;
07 ← 06; 08 ← 06; 09 ← 01, 02, 07, 08. Sequential frontier scheduling is a user requirement,
not an added functional dependency.

Runtime, test, and configuration edits stay inside packages/pic-web.
Engine, adapters, SQL, seeds, manifests, lockfiles, and root tooling remain unchanged.
Planning, briefs, active ticket Resolution, closed-ticket records, and frontier handoff are documentation exceptions.
The existing untracked approved spec is preserved. No implementation is hidden in planning artifacts.

## Seams and risks

### W12-01: CSS tokens → rendered controls

- Owner: visual-foundation CSS and color verification.
- Downstream: all existing token consumers.
- Must-fix within owning ticket: White on official primary fails normal-text AA; use approved dark derivative.

### W12-02: LocaleProvider → typed messages → UI

- Owner: i18n and affected presentation callers/tests.
- Downstream: current inquiry state.
- Must-fix within owning ticket: Resolve default per fallback language; render alias as literal bidi-isolated data.

### W12-03: Sheet → reset coordinator → flow facts

- Owner: non-Player reset and web composition/draft lifecycle.
- Downstream: 04 Player/Gate reset.
- Must-fix within owning ticket: Wait for writes, suppress stale reads, clear storage last; preserve recoverable draft on
  failure.

### W12-04: Player/Gate → reset coordinator

- Owner: Player and Gate reset integration.
- Downstream: 05 Auth.
- Must-fix within owning ticket: No Finish side effects on reset; one focus owner.

### W12-05: Auth → profile → promotion

- Owner: login and web identity bootstrap.
- Downstream: 06 recovery.
- Must-fix within owning ticket: Existing profile RLS must support own-row creation; no backend edits.

### W12-06: Promotion → completion → cleanup

- Owner: web recovery envelope and retry.
- Downstream: 07 and 08.
- Must-fix within owning ticket: Committed-but-lost response must reuse exact payload/key.

### W12-07: Signup → verification → promotion

- Owner: registration and same-browser verification.
- Downstream: 09 assembled journey.
- Must-fix within owning ticket: Email delivery/return URL are environment prerequisites.

### W12-08: Restored identity → writes

- Owner: web auth lifecycle and owner caches.
- Downstream: 09 assembled journey.
- Must-fix within owning ticket: Engine has no authenticated-bootstrap setter; preserve scope limits.

### W12-09: App → end-to-end evidence

- Owner: assembled web journeys and quality evidence.
- Downstream: wave closure.
- Must-fix within owning ticket: Required remote/manual evidence cannot be silently skipped.

## Frontier decisions

- 01 changes palette through existing CSS tokens only. Verify all existing foreground uses before selecting derivatives.
- 02 uses existing message/context seams and public presentation interfaces. Custom aliases never become healing payload
  data.
- 03 owns reset in creation, symptom addition, joint inquiry, summary, and selection only.
  Player and Gate-specific reset UI belongs to 04; do not accidentally expose incomplete behavior there through shared Frame.
- 03 uses engine APIs unchanged; only the composition root/promote boundary accesses adapters.
  Resolve write ordering, persisted flow facts, and rollback/recovery behavior through web-owned orchestration.
- No new public core API is presumed. A proven missing public contract is escalated rather than bypassed.
- Shared dictionaries/composition have one implementation writer at a time.
- No algorithmic normalization consolidation outside web is allowed. Cross-boundary dedup review is read-only.

## Verification and closure

For each ticket: scoped web typecheck, full scoped web tests, depcruise, lint, and relevant browser tests.
Capture a fixed base before each implementation. Run independent Standards and Spec reviews against its exact diff,
resolve actionable findings, then make a scoped English commit with [W12-NN] before dispatching the next ticket.
Do not claim the historical 442/161 baseline was re-run unless the corresponding full command actually ran.
Full Wave 12 end-to-end/remote/manual gates remain W12-09; this run closes only the authorized frontier.
