# W12-08 authenticated draft contract decision

Status: APPROVED by the Event Manager on 2026-10-15.

## Verified problem

`GroupEngine.createDraftGroup` honestly creates a group with an unanswered joint-treatment muscle test.
The unchanged authenticated adapter forwards that null answer to Supabase, whose live schema rejects it.
`returning-identity.remote.test.ts` verified PostgreSQL code23502 using an isolated confirmed Auth fixture,
normal login and own-profile initialization. The owned fixture was cleaned up; no signup email was consumed.
This is negative contract evidence, not successful authenticated new-group evidence.

The approved spec retains the authenticated provider after a real promotion. It does not choose a workaround
for this older schema limitation. A fabricated answer, private engine mutation, or schema/adapter change is excluded.

## Proposed bounded web seam

1. Add an owner-bound draft store/decorator inside `packages/pic-web`, at the existing composition boundary.
   Only genuinely new unanswered groups enter it; previously anchored groups never become disposable drafts.
2. Keep the same authenticated provider and SessionEngine mode. Use unchanged public GroupEngine methods for
   creation, symptoms, ratings and the real joint-treatment answer. Local draft reads return honest public types.
3. Stage the exact draft UUID/content locally with owner and flow generation. Reflect it as unsaved local work.
   Do not write a fake answer or call Guest promotion to make authentication appear complete.
4. Once the Event Manager supplies a real answer, save the exact group through the existing authenticated
   `saveGroup` contract. Clear local staging only after confirmed completion; partial failure remains recoverable.
5. Serialize staging/flush with expiry, reauthentication and reset. Confirm local draft loss, cancel safely,
   reject another owner/stale generation, and never delete already-anchored server records.
6. Preserve draft data in owner-bound browser storage. Stay within supported active-flow public contracts on reload;
   do not add general authenticated workspace hydration or mutate the engine's private symptom index. If public
   restoration cannot preserve a required flow, report that exact additional dependency instead of guessing.

## Required proof before closure

- Actual authenticated create/add/rate/real-answer sequence, unchanged authenticated adapter and stable IDs.
- No therapeutic server rows while the answer is absent; correct complete group/symptoms after confirmed save.
- No success metadata until the existing Finish path; no synthetic answer, Guest promotion or private engine mutation.
- Owner/generation rejection, reset confirmation/cancellation, expiry, partial-save failure, cleanup and reload safeguards.
- Existing tests/reviews/gates and strict web-only implementation; documentation records the chosen seam explicitly.

## Alternative

Keep the existing provider behavior and record an external domain/schema dependency. Independent identity/expiry
work can continue, but W12-08's real new-group acceptance and Wave12 closure remain blocked until a separately
authorized contract solution exists. No backend/schema change is authorized by this proposal.

## Recorded approval

The earlier blocker-only selection was explicitly withdrawn as accidental. The user then approved:
"Approve owner-bound web draft staging (Recommended)".
Implement the bounded web seam above; engine, adapters and schema remain unchanged.
