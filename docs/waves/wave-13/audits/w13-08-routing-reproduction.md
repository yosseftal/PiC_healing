# W13-08 routing reproduction and preserved content

Date: 2026-10-27 (Asia/Jerusalem).
[Original preliminary audit](wave-13-content-audit.md) remains preserved with its historical scope.
This record adds actual local production-artifact and read-only database evidence; no deployed URL was tested.

## Reproduced before the routing remedy

The already built production assets from the five-case W13-05/07 browser run were served at local port 4174.
The production App, providers, public engine actions and repository adapter ran unchanged. Only HTTP transport
was controlled using the existing synthetic journey fixture; no real account signup or remote write occurred.
No development fixture route or runtime state injection was used in the shipped app.

The journey created an untitled Guest questionnaire, answered the joint question, selected source
2c6e77bd-61db-4898-8612-84e976587ff7 without a group link, answered Terminal Yes and completed the persistence gate.
After confirmed promotion, the settled route was Pick Treatment. Opening its existing utilities drawer showed
all three existing shared source IDs. There was one Player session, one Timeline execution and use_count = 1.
No treatment auto-started and no extra content record was created by returning to that list.
The required explicit completion surface was absent: the new production regression failed at that exact assertion.

Evidence: .scratch/w13-08-routing-red.log and the attached post-finish-source-observation JSON from
content-routing.browser.test.ts. Two initial harness attempts needed correct drawer access and settled-animation
inspection; they were not counted as meaningful feature failures. The final red reached actual successful Finish.

This reproduces catalog-return behavior, not the identity of any particular unexpected file reported by the user.
The production regression now remains as a required post-remedy proof, including explicit catalog choice and
unchanged source/session/execution/use-count assertions.

## Read-only live inventory

Normal TLS; service access was used only for necessary aggregate counts and the three known source IDs.
No unrelated profile, symptom, treatment body, journal or personal content was exported.

| Table | Count |
| --- | ---: |
| profiles | 31 |
| symptom_groups | 23 |
| symptoms | 22 |
| treatments | 23 |
| player_sessions | 30 |
| personal_treatment_library | 23 |
| timeline_events | 26 |

All seven totals match the pre-run baseline after authorized same-run fixture cleanup.
All three exact treatments exist as shared rows (user_id is null), with existing references:

| Source ID | Player references | Library references | Timeline references |
| --- | ---: | ---: | ---: |
| 2c6e77bd-61db-4898-8612-84e976587ff7 | 26 | 20 | 23 |
| 92be9fb3-7092-4a78-9fa2-4aee9ba34bc6 | 1 | 1 | 1 |
| c818490b-10ed-46c2-9890-1f35d34f4e25 | 1 | 1 | 1 |

Evidence: .scratch/w13-parallel-database-inventory.log. These references support retaining valid source identities.
Final post-gate check: .scratch/w13-parallel-database-inventory-final.log, 2026-10-27, exit 0.
All seven counts and every source-reference count above remain identical after the full 787-test run.
They do not classify any source as junk or authorize deletion, hiding, unpublishing or archival.
The three source modules/translation overlays and historical migrations remain intact.

## Safety outcome

Zero proven junk files or rows; zero treatment-content deletions. Only same-run UUID fixture/Auth cleanup is authorized.
Any future proposed deletion still requires exact targets, dependency review and explicit human permission.
