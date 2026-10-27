# W13-09 assembled verification and independent review

Date: 2026-10-27 (Asia/Jerusalem). Fixed baseline: 6a6622b. Execution explicitly authorized by the final W13-09 charter.
The previous 787 root tests / 203 Chromium cases are historical evidence, not the new final gate.

## Ownership and seams

The fresh implementation owner uses gpt-6.1-sol/high for the stateful assembled journey and owns only
packages/pic-web/tests/w13-integrated-journeys.browser.test.ts. Root owns docs, all runners and commits.
Independent read-only Standards and Spec reviewers receive the frozen final diff separately.
Use the existing actual-App wave12-journey fixture and installJourneyTransport HTTP boundary.
Do not replace application actions, engines or repositories. The browser transport is synthetic and does not prove SQL/RLS.
The separately authorized full root remote suite provides actual database contract evidence.
No runtime, fixture, engine, adapter, migration, dependency or treatment-content changes are planned.

The approved public seams are actual App interaction/accessibility, committed Guest storage, authenticated HTTP requests,
and returned public entities. The existing lower-level suites supply adverse matrices rather than duplicating them here.
No new domain normalization, preparation, transaction or port-shaping owner is introduced.

## Evidence mapping

| Requirement / AC | Current owning evidence |
| --- | --- |
| Upstream / AC-01 | Ticket 01–08 Resolutions; explicit W13-07 Scope 2 / AC-08 exception keeps AC-01 pending |
| Bilingual titled/untitled journey / AC-02 | New assembled HE untitled / EN titled cases; focused 2/2 passed |
| Atomic order and renewed answer / AC-03 | New payload/Guest assertions; durable-priority and membership browser cases |
| Actual SQL rollback, ownership, replay / AC-03 | supabase-repository.test.ts plus shared priority/membership contracts |
| Back/help/locale / AC-04 | New retained-draft path; questionnaire-navigation and education browser cases |
| Owner/generation isolation / AC-04 | returning-identity, questionnaire-reload, promotion-recovery, completion-integration |
| Initial 1–10, blind 0–10, zero, polarity / AC-05 | New assembled path; summary-presentation browser and rendered summary tests |
| Once-only completion/recovery / AC-06 | New lost-response promotion path; completion/promotion suites and real remote replay |
| Automated gates / AC-07 | Fresh final command results to be recorded below |
| Content and manual status / AC-08 | r1 and real embed in W13-07 copy review; current pending-manual decision below |
| Independent review / AC-09 | Two fresh read-only review results to be recorded after source freeze |
| SHAs and preservation / AC-10 | Final handoff/index links; diff deletion/seam checks and read-only inventory |

Actual SQL evidence includes forced late membership failure rolling back members, positions, answer and receipt;
competing reorder/append/rating; rejection of another owner/direct writes; exact UUID/timestamp retries; legacy v1/v2
and current v3 promotion; failed aggregate writes and one logical library/Timeline execution under dropped-response replay.
The browser HTTP fixture must not be described as independently proving those server transactions.

## Current manual and content decisions

Pending Manual QA Verification for Wave 13.
No physical mobile device, OS keyboard/safe-area result or native Hebrew screen-reader result has been obtained in this run.
Desktop Chromium geometry, zoom, focus and accessibility snapshots are automated browser evidence only.
The user's current final W13-09 directive explicitly permits recording this pending status instead of actual device results.
This is a current Wave 13 instruction, not an inherited Wave 12 waiver or an assertion that native testing passed.

W13-07 AC-01 remains pending verified practical Hebrew transcript/copy. The earlier explicit human fallback decision
permits approved r1 introductions and the official click-to-load video/link without inventing physical instructions.
Real embedded playback was previously verified and is linked in the copy review; controlled media failure is separate.

## Final commands and reviews

The source is frozen after focused verification and both independent review axes. Its SHA-256 is
9282BC9A1591BE1DCC459855D8E0F3A1125BE65622377044926891DC64E78682.

- Focused: npm run test:browser -w packages/pic-web -- tests/w13-integrated-journeys.browser.test.ts
  --project=chromium --workers=2: 2/2 passed, production build passed, 11.2s, exit 0.
  Log: .scratch/w13-09-focused-third.log.
- npm run typecheck: all workspaces passed, exit 0 (.scratch/w13-09-typecheck-final.log).
- npm run lint: passed, exit 0 (.scratch/w13-09-lint-final.log).
- Standards: gpt-6-luna/high, fresh read-only review against 6a6622b and repo guidance; no actionable findings.
- Spec: gpt-6.1-sol/high, fresh read-only review against the ticket, approved entry plan and latest directive;
  no actionable findings. Adverse evidence references were checked; neither review substitutes for runtime gates.
- Full Chromium, exact npm test, dependency and final preservation results remain pending actual execution.

Test authoring corrected two initial assumptions: scope language metadata to approved content rather than the outer HE frame;
and distinguish presentation row UUIDs from public addSymptom's initial domain UUID allocation.
Draft row IDs must survive help/locale/reorder. Actual committed IDs must survive every subsequent operation.
A second run exposed an immediate read before the returned row mounted; an observable visibility wait fixes the test.
No product/runtime defect, delay, timeout increase, skip or weaker continuity assertion was introduced.

Run heavy runners sequentially with at most two workers and normal TLS. No skips/retries/threshold weakening.
Only same-run UUID fixtures and Auth users may be cleaned. Existing treatment/data/source files remain intact.
