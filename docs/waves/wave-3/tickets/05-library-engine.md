# 05 — `LibraryEngine`

**What to build:** the `use_count` increment rule (Finish-only, exactly-once) and first-execution
Personal Treatment Library row creation.

**Blocked by:** 02 (`RepositoryPort` + domain types), 03 (fake port + contract suite).

**Status:** done

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

- [x] `it('recordUse creates a new library row on first execution of a treatment')`
- [x] `it('recordUse increments use_count by exactly 1 on the created row')`
- [x] `it('recordUse on a treatment already in the library reuses the existing row rather than creating a
      duplicate')`
- [x] `it('recordUse sets variant_type to "original" and provenance.source to "standalone_player" on first
      creation')`
- [x] `it('LibraryEngine never imports GroupEngine, PlayerEngine, TimelineEngine, or SessionEngine')`
      (a simple source-scan — see `src/library-engine/library-engine.test.ts`'s "module isolation"
      block; ticket 04's dependency-cruiser rule is explicitly scoped to only the player-engine <->
      group-engine pair, so it does not cover this module).

## Acceptance Criteria

- [x] `recordUse` matches the signature and behavior above, with one resolved deviation — see
      "## Resolution" below.
- [x] All four business-rule tests pass against the fake `RepositoryPort` from ticket 03 (plus extra
      coverage: call-order/count, retry-idempotency, and adversarial cross-treatment isolation).
- [x] Zero cross-engine imports.

## Resolution

**Status:** Implemented (Wave 3).

Implemented in `packages/pic-engine/src/library-engine/index.ts` /
`library-engine.test.ts`, exactly as specified, with one deliberate, documented signature
deviation from this ticket's draft text:

- **`recordUse(treatmentId: string, idempotencyKey: string): Promise<LibraryRow>`** — this ticket's
  original text above reads `recordUse(treatmentId, userId)`. The ratified `RepositoryPort` (ticket 02,
  already implemented and Wave-2.5-audited by the time this ticket was picked up) has no
  `userId`/`user_id` concept anywhere except `promoteGuestToAccount`'s `newUserId`, whose own doc
  comment explains that parameter exists only because that one call crosses from no-identity Guest
  state into a real identity — "unlike the port's other seven methods." `getOrCreateLibraryRow` and
  `incrementUseCount` are two of those other seven: per `types.ts`'s file header, identity/RLS scoping
  is an adapter concern, never a shape an engine reasons about. Concretely, this means the `user_id` on
  a `personal_treatment_library` row must be **explicitly supplied by the authenticated adapter/RPC at
  write time**; Postgres RLS acts as a sanctuary gate, rejecting any mismatch against the authenticated
  identity, but it does not assign the value itself (corrected from an earlier draft of this note, which
  incorrectly stated RLS populates `user_id` — the live schema shows the column is `not null` with no
  `default` and no trigger, so an adapter/RPC must still set it explicitly; RLS only ever rejects a bad
  or missing value, never fills one in). Threading a `userId` through `LibraryEngine` would still be
  architectural drift *away from* ticket 02's actual contract regardless of that correction — the
  decision to drop it rests on `types.ts`'s "identity is an adapter concern" principle, not on any
  specific RLS mechanism — so it was dropped. In its place, `recordUse` takes the `idempotencyKey` that
  `incrementUseCount`'s own doc comment already calls for ("should naturally be sourced from the
  completing `PlayerSession.id`"); this is the only way `LibraryEngine` can honor that method's
  documented retry-safety contract, since it is never told about sessions at all. See the "Resolved
  architectural note" doc comment at the top of `index.ts` for the full reasoning, and the identical
  ruling applied to `TimelineEngine.recordExecution` (ticket 06).

This was resolved directly (not escalated) because it is fully grounded in already-merged,
Wave-2.5-audited Living Documentation (`repository-port.ts`, `types.ts`, the live migration) rather
than a new architectural judgment call.
