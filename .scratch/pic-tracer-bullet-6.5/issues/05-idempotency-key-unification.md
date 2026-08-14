# 05 — Idempotency Unification: single `uuid[]` standard

**What to build:** move `SupabaseRepository.incrementUseCount`'s idempotency-key tracking off its
ticket-12-era JSONB piggyback (`provenance._usedIncrementIdempotencyKeys`) onto a dedicated
`personal_treatment_library` `uuid[]` column — the same clean pattern ticket 13's own
`promoted_session_ids` already proved out, once a migration was actually available.

**Blocked by:** 02 (touches the same file, `packages/pic-adapter-supabase/src/supabase-repository.ts`, as
the `rated_at` adapter change — sequencing after it avoids a merge conflict; no deeper logical dependency).

**Status:** paused — manual-apply checkpoint (awaiting Event Manager)

**Source:** `docs/audits/wave-6-handoff.md` Should-fix item 3 (names both mechanisms and recommends
reconciling them); ticket 12's Deviation #3 (the JSONB workaround, explicitly framed as "a deliberate
ticket-12-era choice made under that ticket's own 'no new migrations' constraint"); ticket 13's
`promoted_session_ids` column (the pattern to converge on).

## Objective

> Ticket 13's own `promoted_session_ids` (a real `uuid[]` column) shows the cleaner pattern once a migration
> is available; worth reconciling the two mechanisms in a future pass rather than carrying both indefinitely.
> — Wave 6 handoff, verbatim

Two idempotency-tracking mechanisms currently coexist in the same package for the same underlying concern
(has this call already been counted): `incrementUseCount`'s JSONB-namespaced key list, and
`promoteGuestToAccount`'s real `uuid[]` column. This ticket ends the JSONB mechanism, converging on one
standard.

## Definition of Done

- New migration adds a dedicated `personal_treatment_library.used_increment_idempotency_keys uuid[] not
  null default '{}'` column (naming is a suggestion — pick whatever reads clearly alongside
  `promoted_session_ids`).
- `SupabaseRepository.incrementUseCount` reads/writes this column directly instead of
  `provenance._usedIncrementIdempotencyKeys`; the `USED_INCREMENT_IDEMPOTENCY_KEYS_FIELD` constant and
  `stripInternalProvenanceFields`'s handling of it are removed once nothing writes through that path anymore
  (leave `stripInternalProvenanceFields` itself in place if `provenance` still needs general internal-field
  stripping for other reasons — check before deleting the whole function).
- `incrementUseCount`'s existing idempotent-under-retry guarantee (ticket 12's own requirement) is
  unchanged in observable behavior — this is a storage-mechanism swap, not a semantics change.

## Do Not Touch / Out of Scope

- Do not touch `promoteGuestToAccount` or `promoted_session_ids` — already correct, this ticket converges
  the *other* mechanism onto its pattern, not the reverse.
- Do not touch the migration(s) from tickets 01/02 (`symptoms.rated_at`) — unrelated column, unrelated table
  concern, even though both may land in adjacent migration files.
- Do not change `incrementUseCount`'s public signature or its callers (`LibraryEngine.recordUse`).

## Testing Requirement — Test-First Acceptance Criteria

- [ ] `it('incrementUseCount is idempotent under retry using the new uuid[] column')` (replaces/updates
      ticket 12's equivalent JSONB-backed test).
- [ ] `it('a LibraryRow returned to a caller never exposes the idempotency-key column or the old ' +
      '_usedIncrementIdempotencyKeys provenance field')`.
- [ ] `it('two distinct idempotency keys against the same row both increment use_count, once each')`.

## Acceptance Criteria

- [ ] All tests pass against the real remote project.
- [ ] No trace of `_usedIncrementIdempotencyKeys` remains in `provenance` for any row written after this
      ticket lands (pre-existing rows written before this ticket may still carry the old field in their
      stored `provenance` — reading them must not crash; decide and document whether one-time migration of
      old rows is in scope or explicitly deferred).
- [ ] Zero regressions: `pic-adapter-supabase`'s full suite green at its baseline count (adjusted for the
      tests updated above); `npx tsc --noEmit` and `depcruise` unchanged.

## Resolution (checkpoint — not closed)

**Commit:** pending — migration + adapter rewrite + red tests

### Red-test proof (pre-apply)

`PGRST204`: `Could not find the 'used_increment_idempotency_keys' column of 'personal_treatment_library' in the schema cache`

### Manual-apply checkpoint — Event Manager action required

Apply in Supabase SQL Editor:

```sql
alter table public.personal_treatment_library
  add column if not exists used_increment_idempotency_keys uuid[] not null default '{}';
```

File: `supabase/migrations/20260814131500_used_increment_idempotency_keys.sql`

After apply:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run packages/pic-adapter-supabase
```

Expect **29 passed, 5 skipped** (was 27 + 2 new idempotency tests).
