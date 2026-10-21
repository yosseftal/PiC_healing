# Wave 13 — Read-only treatment-content audit

Date: 2026-10-20, Asia/Jerusalem. Baseline: `853a696`.

Scope: checked-in catalog, content resolution, completion routing, seed sources and translation overlays.
No runtime reproduction or live database inventory was performed. No treatment file or database row was deleted.
This is a source-based preliminary finding, not a claim to have identified the user's exact unexpected item.

## Finding 1: successful completion can lead back to the shared catalog

In `packages/pic-web/src/composition-root.ts`, the wrapped Finish request refreshes the Player session and
clears the active Player pointer when `success_declared` is true.

`packages/pic-web/src/guest-flow-facts.ts` then derives the next screen from retained questionnaire facts.
When the group is finalized and its summary acknowledged, the result is `pick-treatment`.
This is also relevant to the wrapped promotion/Finish path; an uncertain or uncommitted Finish is not success.

`packages/pic-web/src/TreatmentPickerScreen.tsx` reads the catalog through `useCatalogActions`.
The composition root delegates that to `RepositoryPort.listTreatments()`.

- Local Guest returns the three bundled tracer-bullet treatment records.
- Supabase selects IDs and titles from `treatments`, ordered by title, under existing RLS.
- Neither call is a query for “only the treatment just performed” or the Personal Treatment Library.
- A selection must explicitly resolve content and call `startSession`; the listing itself is not a new execution.

**Inference:** unexpected items after Finish may be the normal catalog becoming visible again.
The code does not establish that Finish creates stray content files.
Reproduction should distinguish a newly visible list from an unsolicited Player launch or a newly persisted row.

## Finding 2: three bundled records are candidates for human classification, not proven junk

All three are in `packages/pic-engine/src/tracer-bullet-seed-treatments.ts`.
They are deliberately included for offline Guest operation and are aligned with the SQL seed IDs.

| Stable treatment ID | Title | Classification |
| --- | --- | --- |
| `2c6e77bd-61db-4898-8612-84e976587ff7` | Settling the Nervous System | Bundled seed; retain pending human classification. |
| `c818490b-10ed-46c2-9890-1f35d34f4e25` | Grounding Through the Feet | Bundled seed; retain pending human classification. |
| `92be9fb3-7092-4a78-9fa2-4aee9ba34bc6` | Loosening the Shoulders and Neck | Bundled seed; retain pending human classification. |

Candidate source locations requiring review if the user identifies these as unwanted:

- `packages/pic-engine/src/tracer-bullet-seed-treatments.ts`: shared module containing all three full protocols.
- `packages/pic-web/src/content-localization/treatment-1.ts`: approved display copy for the first ID.
- `packages/pic-web/src/content-localization/treatment-2.ts`: approved display copy for the second ID.
- `packages/pic-web/src/content-localization/treatment-3.ts`: approved display copy for the third ID.
- `packages/pic-web/src/content-localization/approved-content.ts`: registers those presentation overlays.

**Do not delete these files.** Translation overlays are not separate catalog records or proof of duplication.
The existing permission marker records user approval of the bundled product translations on 2026-10-11.
Prior approval does not mean the user wants them displayed forever; equally, the word “seed” does not mean junk.
No orphaned standalone treatment file was established by this audit.

Related migration evidence:

- `supabase/migrations/20260730194911_tracer_bullet_schema.sql`: original seed protocols.
- `supabase/migrations/20260827220000_widen_treatment_gfm_table.sql`: expanded Grounding formatting.
- `supabase/migrations/20260831193914_align_seed_treatment_ids.sql`: UUID alignment and Grounding update.

These are historical migrations, not disposable duplicate treatment files.
Live existence, owner, actual references and downstream dependencies remain unverified.

## Finding 3: deleting catalog sources can damage valid healing records

DEC-016 permits live Pointer references from Personal Treatment Library rows to a master treatment.
Player sessions, promotion inputs and course references may also depend on source IDs.
Removing a global row or changing its ID can break foreign keys, promotion, live content resolution, and
historical Timeline rendering. A Hard Copy has different ownership semantics and must not be conflated with a seed.

Before any proposed deletion, inventory:

1. Exact file path or database environment/table/primary key, ownership and provenance.
2. Incoming Player, library, course, timeline and content-overlay references, including cascade behavior.
3. Whether the symptom is routing, source selection, translation, stale cache, or actual unwanted content.
4. A non-deletion remedy, if suitable, and its effect on Guest offline access and legitimate references.
5. A target-specific retention/recovery plan and explicit human permission.

Do not inspect or export unrelated personal content to diagnose a global catalog issue.
If live read access is later used, gather only necessary IDs, classification and reference counts.

## Finding 4: source cache and production build boundaries warrant targeted reproduction

The composition root caches parsed content and source data by treatment ID for the tab lifetime.
The existence of a cache is not evidence of stale or cross-owner leakage. Verify returned IDs, cache lifetime,
and identity changes if the reported symptom points there; do not clear content indiscriminately.

The inspected baseline already gates development artifacts in production builds. Vite has one production input,
no public directory, and multi-page app behavior rather than universal fallback for unknown URLs.
Do not assume a development fixture page is a production treatment route.
Use the actual production build in W13-08 if the report concerns a deployed URL.

## Required W13-08 reproduction

Record initial identity, chosen source ID, group link choice, Finish/Finish Anyway or Integrating outcome,
gate/promotion result, next screen and visible catalog IDs. Compare Guest and verified-account paths.
Verify that a list appearing is not counted as another execution and that no content is auto-started.
Compare the reported unexpected item to the three exact seed IDs before proposing removal.

Potential remedies to evaluate after reproduction:

- Clarify the post-completion surface and require explicit selection to view another treatment.
- Correct an incorrect source or route if reproduced.
- Preserve legitimate source data and distinguish shared catalog from personal executed-work library.

These are candidates for a later implementation ticket, not changes made during this audit.

## Explicit deletion gate

No deletion is requested or authorized by this report.
Never delete a treatment content file or any database row without asking the human user and receiving explicit
permission for the exact targets. Do not delete in tests, cleanup scripts, replacement migrations or cascades as
an incidental way to “fix” presentation. Do not silently archive, unpublish, or hide the three IDs as a substitute.

**Current outcome:** plausible catalog-return explanation; three known seed records for classification;
zero proven junk files, zero verified junk database rows, zero deletions.
