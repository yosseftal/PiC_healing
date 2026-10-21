# Wave 12 handoff

Date: 2026-10-18 (Asia/Jerusalem).

All nine Wave 12 tickets are closed. Required automated quality gates passed on the final reviewed implementation.
Physical-device and native Hebrew screen-reader checks remain **Pending Manual QA Verification**, under the user's
explicit approval to complete automated W12-09 with those checks outstanding. No automated blocker remains.

The frozen [Wave 12 specification](../specs/wave-12-spec.md) and closed records under `docs/specs/tickets/`
remain the requirement/evidence sources. This handoff supersedes the initial frontier-only execution status in the
Wave 12 seam map and historical scratch checkpoints. Implementation baseline: `772df65`.

## Delivered tickets and atomic commits

| Ticket | Commit | Delivered behavior |
| --- | --- | --- |
| W12-01 | `018bf5274c9615053db219094b6cd14478c798a4` | Official palette with accessible CSS/Tailwind tokens |
| W12-02 | `4fb71c3a542c3e123355fb5dadafbe7eacda3957` | Explicit terminology and client-only custom alias |
| W12-03 | `bdb4a3d73f75a3253e1f5bad10534a7d30cac527` | Confirmed inquiry reset with stale-callback protection |
| W12-04 | `e98618bb6eb53d043fac7dbeb3ab8679c0ead988` | Safe reset from Player and Persistence Gate |
| W12-05 | `e88f19e4cd3dcc716195a26b61cf88a725fbee13` | Real password login and verified Guest promotion |
| W12-06 | `49800f1ed7aec50bfc394da85884e71bcfa2793b` | Durable promotion recovery and replay protection |
| W12-07 | `05bad952703626cb5bbb2d42682848c4c8adb66d` | Registration and email verification retaining Guest work |
| W12-08 | `bf1ecf26848aa9ca0eeeeda255c00d4c11079295` | Restored identity, expiry and owner-bound draft staging |
| W12-09 | `f8887fa0c14ef37e6d1fd7f977ee3a59d7ed78a6` | Assembled bilingual journeys and final quality gates |

Approved specification checkpoint: `20c60a7e4b2e8ec6128f17a5f340e57ddf821696`.
W12-09 changes six web test/fixture files and its closed ticket; no additional runtime changes were required.
This handoff is committed separately so every implementation commit above is concrete and independently recoverable.

## Final automated verification

All final commands passed on 2026-10-18. Browser, build and unit runners were sequential, with two workers for tests.

| Command / scope | Final result |
| --- | --- |
| Root `npm run typecheck` | PASS;  four workspaces, 15.45 s |
| Root `npm run lint` | PASS; 11.34 s |
| Root `npm test` | PASS; 560 tests / 54 files, Vitest 107.23 s, then all-workspace dependency checks |
| `npm test -w packages/pic-web -- --maxWorkers=2` | PASS; 347 tests / 39 files, 76.51 s |
| `npm run depcruise -w packages/pic-web` | PASS; 766 modules / 1670 dependencies, zero violations, 11.46 s |
| `npm run build -w packages/pic-web` | PASS; 2708 modules, 5.85 s wall time |
| Web `npx playwright test --workers=2` | PASS; 179 Chromium cases, 4.5 min |
| Focused corrected/interrupted browser cases | PASS; 22 cases, 1.5 min |
| Independent final W12-09 Standards / Spec reviews | 0 findings / 0 findings |

Root npm test also passed the engine dependency check: 72 modules / 199 dependencies, zero violations; its web check
passed 766 / 1670, zero violations. The root process used VITEST_MAX_WORKERS=2. Root and scoped unit runs used the
approved controlled-address test environment and normal TLS. Existing assertions, retries and thresholds remain.
Historical baseline of 442 unit/integration and 161 Chromium cases grew to 560 and 179; inherited coverage was preserved.

The final six W12-09 web files stayed unchanged through review and all final gates. Composite SHA256:
`9458BF3A52956126897A6E92E0F71B337C8769492916FBB5209AB531FEE85D6E`.
Whitespace and 130-character checks passed. No skip/todo/only cases, retry changes or longer test timeouts were added.

### Journey and accessibility evidence

Four new assembled Chromium journeys use actual AppProviders, Guest shell/router, Auth SDK, composition root,
engines and unchanged Supabase adapter, controlling HTTP responses only. Both languages cover linked registration
and unlinked returning login, reset/cancel/confirm, Player/Terminal, verification, recovery, promotion and a subsequent
inquiry. They assert exact group/session identities, symptom ratings, unit progress, Terminal response, pending
Finish kind and one intended Timeline/use increment, including sovereign Finish Anyway.

Locale changes cover draft, Player, Gate, verification and recovery. Literal custom alias display remains
presentation-only; the default Hebrew phrase is **נכון ומדויק**, with no production alias editor or alias persistence.
Inherited browser matrices retain both locales at 320x568, 390x844, 768x1024 and 1440x900 CSS pixels, offline Guest flow
after assets load, geometry, keyboard focus/traps/restoration, reduced motion and atomic main-screen choices.
Computed contrast retains 4.5:1 normal text and 3:1 control/focus thresholds. Chromium ARIA snapshots check confirmation,
Terminal terminology, auth labels and recovery; blind ratings and non-judgmental Integrating wording remain.

### Real Supabase evidence

Both final unit commands passed real isolated signup, session-null/unconfirmed account checks, generated same-owner
confirmation, original-client password login, own-profile RLS/bootstrap, linked/unlinked promotion and owned cleanup.
Returning-identity tests exercise SDK restore/sign-out/reauthentication, raw unanswered-group error 23502, actual Gate
promotion, owner-bound staging with zero server rows before the real answer, exact-ID save afterward, a subsequent
authenticated Finish with Timeline 2 / use_count 2 and saved-group preservation after reset.

The approved generated-link facility proves Supabase Auth confirmation and identity continuity. It does **not** prove
SMTP inbox delivery. Tests precheck address ownership, mark newly created fixtures and delete only owned data/users.
No credentials were printed. Hosted settings, existing users and database schema remained unchanged.

## Architectural and approval record

- Runtime, UI, CSS tokens, client Auth, reset and tests remain 100% inside `packages/pic-web`.
  Final whole-wave audit: 80 web paths plus 13 approved documentation paths, zero forbidden paths.
  No engine, either adapter, migrations, schema, RPC, seed, root tooling, manifest, dependency or lockfile edits.
- Read-only cross-boundary duplication review confirms `pic-engine/src/normalize-in-view-unit.ts` owns shared
  normalization/rehydration. SessionEngine and both repositories consume it unchanged. Web introduces no competing
  clinical normalizer, SQL fingerprint or backend row shaping; no cross-boundary consolidation was needed.
- DEC-017 remains the Auth basis; no glossary or DEC additions. Engines/public ports retain clinical and persistence
  authority. Identity restoration alone does not mark local therapeutic work Saved.
- User approved existing shell/Gate test seams, email verification before account persistence and Guest retention
  while waiting; generated verification links with isolated project-domain addresses; official brand bases with
  documented derived shades only for accessibility; and committing the approved specification separately.
- User explicitly approved owner-bound web staging after withdrawing an accidental blocker-only answer.
  New unanswered authenticated groups stay honestly unsaved locally until the Event Manager supplies the actual
  joint-treatment answer; the same objects/UUIDs then save through the unchanged authenticated port. No fake answer.
- Staged work is usable in the same runtime. Full reload retains an exact same-owner, verified read-only envelope;
  general authenticated workspace/private engine hydration remains outside the approved public seam.
- Ordinary authenticated Timeline append has no public lost-response receipt contract. Durable owner/session facts
  deny uncertain replay; informed focus detachment preserves anchored records and permits fresh work. General
  receipt reconciliation remains outside scope; uncertain work is never falsely reported Saved.

## Pending Manual QA Verification

The user reported no physical device or native screen reader available and approved automated closure with the
following evidence outstanding, following the Wave 11 handoff pattern:

| Check | Status |
| --- | --- |
| Physical mobile keyboard / visual viewport | Pending Manual QA Verification |
| Physical-device safe areas | Pending Manual QA Verification |
| Device/browser zoom | Pending Manual QA Verification |
| Native Hebrew screen-reader navigation | Pending Manual QA Verification |

Chromium geometry/keyboard/ARIA coverage does not establish those physical or native behaviors. Safari, Firefox,
cross-device Guest transfer and SMTP delivery are also not claimed. Offline evidence begins after assets are loaded.

## Earlier failures and carry-forward

The original full browser run failed 16 stale modal/reload expectations. Corrections retain geometry, contrast and
pending-work/Finish Anyway assertions and were independently reviewed. On this resume, two unchanged English Player
cases encountered Chromium session-closed/protocol interruptions (one trace also ERR_NETWORK_IO_SUSPENDED).
Both passed unchanged in the 22-case rerun and full 179-case gate; no application exception was captured.

An earlier root 559/560 run failed actual signup due hosted email quota. It was not waived; final root 560/560 and
scoped 347/347 passes supersede it. Sandbox cache/browser limitations used the existing authorized host runtime,
with no browser installation, TLS weakening, fixture skip or hosted-setting change.

Build retains informational warnings for extensionless public-auth-config/native loading, mixed static/dynamic
imports in guest-flow-facts, and a >500 kB chunk (869.75 kB; 256.11 kB gzip). Bundle optimization is carry-forward work;
no configured gate failed. Manual checks and the explicit public-contract limitations above remain visible.

All nine implementation tickets have atomic commits and closed per-AC Resolutions. The ignored status checkpoint
records the latest verified commit and no remaining implementation dispatch. Safety stashes are retained as
superseded recovery backups and must not be reapplied to the completed implementation.
