# Wave 13 execution seam map

Implementation authorized by the user's Wave 13 orchestration charter; baseline `bf49e50`.
Execute serially W13-01 through W13-09. Ticket DoD and ACs remain authoritative.

## Ownership and risks

| Ticket | Owned seam | Upstream dependency | Risk to resolve in this slice |
| --- | --- | --- | --- |
| 01 | Questionnaire UI / composition draft / existing GroupEngine | None | Must-fix: retry IDs and stale callbacks |
| 02 | Priority controls / GroupEngine / port / adapters / SQL / promotion | 01 | Must-fix: atomic order and legacy replay |
| 03 | Revised list UI / joint-answer revision / atomic storage | 02 | Must-fix: answer belongs to current membership |
| 04 | Questionnaire navigation / inquiry draft lifetime | 01, 03 | Must-fix: preserve work and owner boundaries |
| 05 | Summary projection / blind rating controls | 01, 02 | Must-fix: no prior-rating leakage |
| 06 | TherapeuticSheet / verified auth identity | None | Must-fix: distinguish identity from persistence |
| 07 | Welcome and guide / questionnaire return / YouTube | 04 | Must-fix: source-verified approved actual text |
| 08 | Finish / route projection / existing catalog | None | Must-fix: diagnose route without content deletion |
| 09 | Assembled UI / persistence / bilingual journeys | 04–08 | Must-fix: actual gates and explicit manual evidence |

## W13-01 inspected boundaries

- Baseline SymptomGroupCreateScreen and SymptomAddStep require naming first and score immediately on Add.
- The approved refinement replaces this with unified local rows: name, explicit score, polarity and priority controls.
- RatingControl serves blind re-rating; preserve its 0–10 and explicit Reveal behavior.
- group-engine-context exposes composition-owned actions; components cannot call adapters directly.
- composition-root wraps createDraftGroup/addSymptom/rate and existing authenticated draft handling.
- inquiry-lifecycle owns generation changes and operation serialization; draft state must survive screen remounts.
- GroupEngine already accepts empty names and 1–10 ratings. No engine, adapter, schema or auth-policy edit in W13-01.
- Draft rows have no score until explicitly selected. Finish stages engine operations and flushes the entire local snapshot.
- Intermediate engine writes stay buffered in the web staging seam; publish no partial active group on failure.
- Stable submission IDs survive final-flush retries; ratedAt distinguishes placeholder zero from historical zero.
- Actual joint Yes/No and unsaved authenticated staging remain unchanged.

## Shared controls

Each numbered ticket has an isolated brief under ../briefs/. Dispatch only the current serial ticket.
No simultaneous writers to composition, dictionaries, contracts or persistence.
All nine briefs are prepared before the first dispatch. Update the relevant excerpt if inspection changes the seam.
No treatment-content file or existing database row may be deleted without target-specific human permission.
The user explicitly authorized same-run fixture/Auth cleanup by that run's UUIDs, including test-treatment fixtures.
Existing content and unrelated records remain protected. W13-01 owns no engine, adapter or schema change.
W13-02/03 must establish an authorized isolated database environment before remote validation.
W13-07 content approval and actual embed verification remain execution gates, not assumed results.

## Required checkpoints

Run root typecheck, web depcruise and root npm test per completed ticket, plus affected lint/browser checks.
Record every AC in Resolution and use Status: closed only when DoD passes.
Commit with [W13-NN] in the message. Preserve a clean checkpoint before context capacity is approached.
