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

- [ ] `it('recordExecution appends an event with log_type "treatment_execution"')`
- [ ] `it('recordExecution links treatment_id and library_row_id without embedding any content or markdown
      snapshot')`
- [ ] `it('recordExecution accepts a null linked_group_id when no group link was chosen')`
- [ ] `it('recordExecution accepts a linked_group_id when the EM opted to link the treatment to a Symptom
      Group')`

## Acceptance Criteria

- [ ] `recordExecution` matches the signature and behavior above exactly.
- [ ] All four tests pass against the fake `RepositoryPort` from ticket 03.
- [ ] No content/markdown field ever appears in a constructed event, verified by an explicit test asserting
      the absence of those keys.
