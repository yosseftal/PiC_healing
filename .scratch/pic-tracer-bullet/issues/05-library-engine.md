# 05 — `LibraryEngine`

**What to build:** the `use_count` increment rule (Finish-only, exactly-once) and first-execution
Personal Treatment Library row creation.

**Blocked by:** 02 (`RepositoryPort` + domain types), 03 (fake port + contract suite).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md` §A, §B (`personal_treatment_library` schema), §D
("Exactly-once side effects"), `CONTEXT.md` Personal Treatment Library entry, `decisions.md` DEC-005/DEC-006.

## Objective

> `LibraryEngine` — `use_count` increment rule (Finish-only, exactly-once), first-execution row creation.

> **Exactly-once side effects:** `PlayerEngine` calls `LibraryEngine.recordUse(treatmentId)` and
> `TimelineEngine.recordExecution(...)` exactly once per `finish()`/`finishAnyway()` call, never on
> revisiting an already-`success_declared` session (DEC-006 §5).

## Context Injection (copied verbatim from the spec)

`personal_treatment_library` row shape (§B):

> `personal_treatment_library` (new): `id`, `user_id`, `treatment_id` (FK), `use_count` (int, default 0),
> `provenance` (jsonb, e.g. `{source: 'standalone_player', first_seen_at}`), `variant_type` (`'original'`
> for this spike — `'course_extracted'` / `'personal'` are out of scope), `global_reference_id` (FK to
> `treatments.id`, null only for future `'personal'` rows), `protocol_content` (null for this spike —
> Pointer state only), `created_at`.

## Definition of Done

- `LibraryEngine.recordUse(treatmentId: string, userId: string): Promise<LibraryRow>` calls
  `RepositoryPort.getOrCreateLibraryRow` then `RepositoryPort.incrementUseCount`, in that order, exactly
  once per call.
- First call for a treatment never previously recorded creates the row with
  `provenance: { source: 'standalone_player', first_seen_at: <now> }` and `variant_type: 'original'`, then
  increments `use_count` to `1` in the same call (never left at `0` after `recordUse` resolves).
- `LibraryEngine` is constructed only against `RepositoryPort` — no import of `PlayerEngine`, `GroupEngine`,
  `TimelineEngine`, or `SessionEngine`.
- `npx tsc --noEmit` passes; the depcruise check from ticket 04 remains green (this module doesn't touch
  `group-engine` or `player-engine` at all).

## Do Not Touch / Out of Scope

- Do not implement any "exactly once per Finish" deduplication logic beyond what `getOrCreateLibraryRow`'s
  idempotency (ticket 03) already guarantees — enforcing that `recordUse` is called exactly once per
  `finish()`/`finishAnyway()` is `PlayerEngine`'s responsibility (ticket 08), not `LibraryEngine`'s.
- Do not implement `TimelineEngine` logic (ticket 06) or reference `PlayerEngine`/`GroupEngine` types.
- Do not implement manual `use_count` editing from a Library screen — explicitly Out of Scope for this
  spike (DEC-007 §2).
- Do not implement `'course_extracted'` or `'personal'` `variant_type` handling — this spike only ever
  creates `'original'` rows.

## Testing Requirement — Test-First Acceptance Criteria

- [ ] `it('recordUse creates a new library row on first execution of a treatment')`
- [ ] `it('recordUse increments use_count by exactly 1 on the created row')`
- [ ] `it('recordUse on a treatment already in the library reuses the existing row rather than creating a
      duplicate')`
- [ ] `it('recordUse sets variant_type to "original" and provenance.source to "standalone_player" on first
      creation')`
- [ ] `it('LibraryEngine never imports GroupEngine, PlayerEngine, TimelineEngine, or SessionEngine')`
      (a simple source-scan or reliance on ticket 04's tooling scope — document which).

## Acceptance Criteria

- [ ] `recordUse` matches the signature and behavior above exactly.
- [ ] All four business-rule tests pass against the fake `RepositoryPort` from ticket 03.
- [ ] Zero cross-engine imports.
