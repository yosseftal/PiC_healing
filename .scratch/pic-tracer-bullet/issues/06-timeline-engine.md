# 06 — `TimelineEngine`

**What to build:** Chronological Timeline event construction — `log_type`, links to the Personal Treatment
Library entry, and explicitly no content snapshot.

**Blocked by:** 02 (`RepositoryPort` + domain types), 03 (fake port + contract suite).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md` §A, §B (`timeline_events` schema), User Stories 42–43,
`CONTEXT.md` Chronological Timeline / Linked Journey entries, `decisions.md` DEC-007 §3, DEC-008.

## Objective

> `TimelineEngine` — event construction (`log_type`, links, no snapshot).

> 42. As an EM, I want a Timeline event to be written for this execution, linking to the Personal Treatment
>     Library entry (not a content snapshot), so that reviewing this event later always renders the library
>     entry's current state (DEC-015 §4, DEC-016 §5).
> 43. As an EM, I want the Timeline event to carry a `log_type` (e.g. `treatment_execution`) so that it can
>     be filtered alongside other event types later without special-casing (DEC-007 §3).

## Context Injection (copied verbatim from the spec)

`timeline_events` row shape (§B):

> `timeline_events` (new): `id`, `user_id`, `log_type` (`'treatment_execution'` for this spike; enum left
> open for future types per DEC-007 §3), `treatment_id` (nullable), `library_row_id` (nullable FK),
> `linked_group_id` (nullable FK — Smart-Link per DEC-008), `metadata` (jsonb), `created_at`.

From `CONTEXT.md`'s Linked Journey vs. Toolbox Model entry:

> A Timeline event never embeds protocol content; it **links** to the Personal Treatment Library entry via
> `treatment_id`. Reviewing a past execution renders through that entry's **current** state... Historical
> integrity means **temporal/provenance** integrity (when it happened, that it happened, what it links to)
> — not a verbatim record of the exact wording followed at that moment.

## Definition of Done

- `TimelineEngine.recordExecution({ userId, treatmentId, libraryRowId, linkedGroupId, metadata }):
  Promise<TimelineEvent>` calls `RepositoryPort.appendTimelineEvent` with `log_type: 'treatment_execution'`.
- `linkedGroupId` is nullable and optional in the call signature — treatment→group linking is optional per
  user story 19 ("Smart-Linking's 'intentional, never automatic' rule").
- The constructed event object contains no `content`, `markdown`, or `protocol_content` field anywhere —
  this is the literal "no snapshot" rule.
- `TimelineEngine` is constructed only against `RepositoryPort` — no import of `PlayerEngine`,
  `GroupEngine`, or `LibraryEngine`.

## Do Not Touch / Out of Scope

- Do not embed any treatment content or markdown in the timeline event payload under any circumstance.
- Do not implement Smart-Link unlinking UI or multi-group linking — this ticket only accepts a single
  optional `linkedGroupId` per event, matching the spec's Out of Scope note on the full Smart-Linking
  surface.
- Do not implement any other `log_type` beyond `'treatment_execution'` — the enum is "left open for future
  types" but this spike only ever produces one value.
- Do not implement timeline filtering/smart-filtering UI — that is a `pic-web` concern outside this spike's
  scope entirely.

## Testing Requirement — Test-First Acceptance Criteria

- [x] `it('recordExecution appends an event with log_type "treatment_execution"')`
- [x] `it('recordExecution links treatment_id and library_row_id without embedding any content or markdown
      snapshot')`
- [x] `it('recordExecution accepts a null linked_group_id when no group link was chosen')`
- [x] `it('recordExecution accepts a linked_group_id when the EM opted to link the treatment to a Symptom
      Group')`

## Acceptance Criteria

- [x] `recordExecution` matches the signature and behavior above, with one resolved deviation — see
      "## Resolution" below.
- [x] All four tests pass against the fake `RepositoryPort` from ticket 03 (plus extra coverage:
      call-count, adversarial cross-treatment isolation, and a dedicated module-isolation test).
- [x] No content/markdown field ever appears in a constructed event, verified by an explicit test asserting
      the absence of those keys.

## Resolution

**Status:** Implemented (Wave 3).

Implemented in `packages/pic-engine/src/timeline-engine/index.ts` / `timeline-engine.test.ts`, exactly
as specified, with one deliberate, documented signature deviation from this ticket's draft text:

- **`recordExecution({ treatmentId, libraryRowId, linkedGroupId?, metadata? }): Promise<TimelineEvent>`**
  — this ticket's original text above reads `{ userId, treatmentId, libraryRowId, linkedGroupId,
  metadata }`. The ratified `TimelineEvent` domain type and `RepositoryPort.appendTimelineEvent`
  signature (ticket 02, already implemented and Wave-2.5-audited by the time this ticket was picked up)
  carry no `user_id` field at all. Concretely, this means the `user_id` on a `timeline_events` row must
  be **explicitly supplied by the authenticated adapter/RPC at write time**; Postgres RLS acts as a
  sanctuary gate, rejecting any mismatch against the authenticated identity, but it does not assign the
  value itself (corrected from an earlier draft of this note, which incorrectly stated RLS populates
  `user_id` — the live schema shows the column is `not null` with no `default` and no trigger, so an
  adapter/RPC must still set it explicitly; RLS only ever rejects a bad or missing value, never fills
  one in). Threading a `userId` through `TimelineEngine` would still be architectural drift *away from*
  ticket 02's actual contract regardless of that correction — the decision to drop it rests on
  `types.ts`'s "identity is an adapter concern" principle, not on any specific RLS mechanism — so it was
  dropped; identity/RLS scoping stays exactly where `types.ts` already documents it living (the adapter,
  never the engine). See the "Resolved architectural note" doc comment at the top of `index.ts` for the
  full reasoning, and the identical ruling applied to `LibraryEngine.recordUse` (ticket 05).

This was resolved directly (not escalated) because it is fully grounded in already-merged,
Wave-2.5-audited Living Documentation (`repository-port.ts`, `types.ts`, the live migration) rather
than a new architectural judgment call.
