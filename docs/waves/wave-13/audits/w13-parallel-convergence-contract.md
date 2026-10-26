# Wave 13 parallel convergence contract

Date: 2026-10-26. Baseline: `ca6441e`, W13-01/02/03/04/06 closed; 711 root tests and 26 targeted browser cases pass.
The user's latest parallel charter supersedes earlier serial dispatch wording without changing ticket ACs or safety gates.
W13-05, W13-07 and W13-08 are unblocked. W13-09 starts only after their actual required evidence is resolved.

## Ownership and dynamic models

| Owner | Model | Writable scope | Read-only shared seams |
| --- | --- | --- | --- |
| W13-05 | gpt-6.1-sol/high | Summary/rating presentation, feature messages, own tests | Composition/router/shared chrome |
| W13-07 | gpt-6-luna/high | Welcome/guide/video, messages, own tests | Navigation/composition/chrome |
| W13-08 | gpt-6-luna/high | New completion controller/view, feature messages, own tests | Finish/promotion/router integration |
| Root | Lead architect | Shared integration, source research, wave docs, final gates/commits | Engine/adapters/schema/content |

Each implementation owner reads its complete existing isolated brief/ticket plus this contract before editing.
Do not edit another owner's files. Root alone edits composition-root, guest-flow facts/router/screens,
questionnaire navigation/recovery, app providers, shared Frame/chrome, core messages and existing assembled browser fixtures.
Request a concrete typed integration seam from root if needed; do not patch a shared file concurrently.
All feature runtime and tests stay inside pic-web. No engine, adapter, migration, dependency or treatment-content edits.
Documentation belongs to root; agents report AC evidence without changing ticket status or committing shared work.

## W13-05 public seam

Own SymptomGroupSummaryScreen, RatingControl, bounded new summary/re-rating modules/styles and feature-specific tests.
SymptomAddStep may receive only required counter cleanup; no welcome/route changes there.
Use existing composition priority actions and public rating actions. View grouping never writes or infers urgency.
Retain original manual priority numerals; distinguish rated zero from rated_at-null placeholder.
Blind input must unmount adjacent history/grouping, including accessible/hidden DOM. One topic is active at a time.
Retain unsaved rating state across help/remount and owner/generation boundaries; propose any needed root wiring first.
Use typed feature messages through the established resolver/locale metadata; do not edit core-messages concurrently.

## W13-07 component/content seam

Build isolated click-to-load official-video and educational surface components with typed props/callbacks.
Use existing Frame/Card/locale primitives; emit no therapeutic writes, counts, Timeline events or viewing tracking.
No iframe/provider request before activation; normal controls, no autoplay, explicit unavailable fallback and teardown.
The source is `https://www.youtube.com/watch?v=txSeLG4kJ6Y`; real embed permission/playback remains a separate proof.
Root owns welcome precedence and exact guide-return integration above transient screens.
Components may accept approved section data; no unapproved physical instructions may enter product content.
Root researches official sources and prepares concrete timestamped copy for the ticket's human approval checkpoint.
If no usable transcript/verification exists, report that precise blocker and keep practical-text AC open.
No video download, offline media cache, custom Player, captions claim or production allowlist weakening.

## W13-08 completion seam

Reproduce the existing public Finish/projection and the three known source IDs before a remedy.
Provide a typed web completion controller/view for root wiring at confirmed success only.
Root integrates normal Finish, successful promotion and boot recovery; no success on request/pending/uncertain state.
Bind completion evidence to owner/provider/generation and exact session; retain explicit return/catalog choice safely on reload.
Return goes to current questionnaire summary, or the existing confirmed reset workflow when no group is available.
Choose another treatment is explicit; no implicit catalog, startSession, Finish repeat or new execution side effect.
Keep the catalog distinct from Personal Treatment Library. Do not filter/hide or delete the three seeds/overlays.
Report precise confirmed routing evidence versus content candidates; root updates the preserved audit.

## Agreed test seams and runners

Approved rendered provider/composition, public repository/engine boundaries and browser journeys remain the TDD seams.
Each owner captures meaningful red-to-green behavior within its vertical slice, never mocks private engine state.
Only one focused test runner at a time, one worker per agent; coordinate the slot through root.
Root alone runs heavy/browser/full/remote gates sequentially, with two workers, normal TLS and the approved signup address.
Fixture/Auth cleanup remains limited to UUIDs created by that exact run; no existing database row or content file deletion.
Use ignored workspace TEMP/TMP if sandbox cache rename fails. No root-linted scratch helper scripts.
Before closure: source freeze, independent Standards/Spec review, typecheck/lint/depcruise, exact npm test, browser evidence.
Preserve original assertion strength while updating integration expectations for deliberate welcome/completion routes.
Every changed/new line stays within 130 Unicode characters; preserve all historical documents and source content.

## Convergence and external evidence

The actual procedural text still needs explicit approval of the source-checked revision before shipping.
W13-09 requires actual native/manual results or an explicit human decision accepting pending status.
Neither the parallel charter nor passing automation silently waives those two gates.
Continue independent authorized work while gathering them; keep blocked ACs and partial tickets honest.
At context capacity, finish the current bounded unit, run gates, commit passing progress and write the exact next entry.
