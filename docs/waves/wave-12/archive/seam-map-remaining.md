# Wave 12 remaining-frontier seam addendum

Date: 2026-10-14 (Asia/Jerusalem). Starting implementation checkpoint: bdb4a3d.
Approved specification tracking checkpoint: 20c60a7 (user explicitly authorized existing-file documentation exception).
This addendum supersedes the earlier seam map's run-authorization paragraph only.
All remaining tickets are authorized, sequentially: 04 -> 05 -> 06 -> 07 -> 08 -> 09.
Functional blockers remain exactly the approved graph. Every remaining brief was refreshed before dispatch04.

## Ownership and must-fix risks

-04: shared reset coordinator -> Player/Gate. Keep one focus owner; preserve pending Finish kind after cleanup failure.
  Use public gate reads and public onFinishRequested/discard contracts, with a web recovery envelope if needed.
  Track the whole auth/snapshot/provider-switch operation, not just SessionEngine.promote.
-05: Gate -> web Auth -> own-profile RLS -> existing promotion. Single client, verified ID, no tracer credentials.
  Test actual missing-profile bootstrap and preservation using isolated remote accounts; never expose service role.
-06: frozen snapshot/owner/generation -> recovery envelope -> idempotent completion and cleanup.
  Prove each adversarial matrix row red before green; never change RPC fingerprinting or normalization rules.
-07: signup without session -> verification pending -> original-browser recovery -> same promotion path.
  Require real confirmation evidence; admin fixture helpers cannot stand in for real signup and verification.
-08: SDK identity != therapeutic engine mode. Pause expired-owner writes without deleting saved data or private mutation.
-09: assembled bilingual journeys + all root/web/browser gates + real/manual release evidence.
  Historical442/161 counts are coverage baselines, not ceilings or substitutes for running all newly added cases.

## Operational controls

- One implementation writer, fresh isolated agent per ticket; parent conducts independent Standards/Spec reviews.
- Sequential final tests: scoped typecheck, full web tests, depcruise/lint, then browser checks (two workers).
  Avoid full Vitest and Chromium concurrently; this host previously hit unchanged default test timeouts under load.
- Commit each verified ticket immediately; update docs/waves/wave-12/archive/wave-12-status.md with full hash and next.
- Before a graceful context/quota halt, preserve any unverified web-only work in a named recoverable Git stash,
  record the stash identity and resume instructions, and leave HEAD at the last verified ticket.
  Never label an unverified implementation commit as a completed ticket, and never discard user changes.
- Scope: runtime/tests in packages/pic-web; only explicitly required planning/status/Resolution/handoff metadata elsewhere.
- No engine, backend adapter, migration, schema, dependency/lockfile, hosted-setting, or TLS-policy edits.
- Remote preflight passed; details in connectivity-preflight.md. Actual auth/RLS/verification evidence still required.
- Physical-device/mobile keyboard, safe-area, zoom, and Hebrew screen-reader evidence cannot be inferred from Chromium.
  Request the user's manual evidence when the completed UI and concrete checklist are ready, not before.
