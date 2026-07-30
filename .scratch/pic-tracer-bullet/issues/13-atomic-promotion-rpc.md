# 13 — Atomic Promotion RPC (`promoteGuestToAccount`) — HIGHEST RISK TICKET

**What to build:** the single Postgres RPC (`security definer`, one transaction, idempotent under retry)
that promotes a full Guest session — Symptom Group, symptoms, Player session, Library row, and Timeline
event — into a newly authenticated account, all-or-nothing. Then wire it into `pic-adapter-supabase`.

**Blocked by:** 09 (`SessionEngine` — defines the shape of `guestState`/`newUserId` this RPC receives), 11
(Supabase schema migration), 12 (`pic-adapter-supabase` standard CRUD + stub to fill in).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md` §E in full, Testing Decisions
("Guest→Promotion is the highest-risk integration point"), User Stories 34–39.

## Why this ticket gets the most scrutiny

> The single highest-value proof this tracer bullet is designed to produce isn't any one screen — it's
> that `pic-engine` can be fully exercised, and fully trusted, without ever booting `pic-web` or Supabase.
> If that property breaks down during implementation (business logic creeping into components, or into
> Supabase RPC functions instead of `pic-engine`)... treat it as a spec violation worth stopping for.

Do not treat this as "just another CRUD ticket." A bug here means a real EM's healing work either silently
vanishes or gets double-counted the moment they try to save it — the worst possible failure mode in this
product.

## Context Injection (copied verbatim from the spec §E — this is the single source of truth)

> **Atomic Promotion is a hard requirement, not a design preference.** On successful auth,
> `SessionEngine.promote(guestState, newUserId)` calls `RepositoryPort.promoteGuestToAccount(...)`, which
> **must** be implemented as a **single Supabase RPC (Postgres function, `security definer`, called via
> `supabase.rpc(...)`)** that writes the Symptom Group, symptoms, Player session, Library row, and Timeline
> event inside **one Postgres transaction**:
> - **All-or-nothing:** if any insert fails (constraint violation, connection drop mid-call), the entire
>   transaction rolls back — the client must never observe a state where, e.g., the group exists but the
>   timeline event doesn't. There is no client-side "insert five times and hope" implementation; the RPC
>   itself is the transaction boundary.
> - **Idempotent under retry:** the RPC accepts a client-generated idempotency key (the Guest Group's
>   client-side UUID, reused as the eventual `symptom_groups.id`); calling it twice with the same key and
>   payload is a no-op the second time (checked via `on conflict do nothing` / an existence check inside
>   the function), so a client retry after a dropped response never double-writes or double-increments
>   `use_count`.
> - **No partial adapter swap:** `pic-web` only swaps its active adapter from `local-guest` to `supabase`,
>   and only clears the local Guest state, **after** the RPC call returns success.

## Testing Decisions — adversarial test section (copied verbatim; do not treat as optional)

> **Guest→Promotion is the highest-risk integration point** and gets explicit, adversarial tests, not just
> a happy-path check:
> - **Happy path:** build a full Guest state (group with a muscle-test result and blind-rated symptoms +
>   finished player session, with and without an optional treatment→group link), call `promote()`, assert
>   all five Supabase rows exist, correctly `user_id`-scoped, and the local Guest state is gone.
> - **Simulated mid-transaction failure:** force the RPC to fail after partial internal work (e.g. inject a
>   constraint violation on the last insert inside the transaction, or use `pg_sleep` + connection kill in
>   the local Supabase instance) and assert **zero** rows landed — proving the "all-or-nothing" requirement
>   in §E is real, not aspirational prose.
> - **Retry idempotency:** call `promote()` twice with the same idempotency key (simulating a client retry
>   after a dropped response) and assert exactly one set of rows exists and `use_count` was incremented
>   exactly once, not twice.

## Definition of Done

- New migration `supabase/migrations/<timestamp>_promote_guest_to_account_rpc.sql` defines:

```sql
create function public.promote_guest_to_account(
  p_guest_group jsonb,
  p_symptoms jsonb,
  p_player_session jsonb,
  p_new_user_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_group_id uuid := (p_guest_group ->> 'id')::uuid;
  v_session_id uuid := (p_player_session ->> 'id')::uuid;
  v_library_row_id uuid;
  v_use_count int;
begin
  -- 1. Symptom Group (idempotency key = client-generated group UUID)
  insert into public.symptom_groups (id, user_id, name, joint_treatment_muscle_test, joint_treatment_test_at)
  values (v_group_id, p_new_user_id, p_guest_group ->> 'name',
          p_guest_group ->> 'joint_treatment_muscle_test',
          (p_guest_group ->> 'joint_treatment_test_at')::timestamptz)
  on conflict (id) do nothing;

  -- 2. Symptoms (each carries its own client-generated id; loop and on conflict do nothing)
  -- 3. Player session (idempotency key = client-generated session UUID), on conflict do nothing
  -- 4. Library row: get-or-create by (user_id, treatment_id); increment use_count only if this exact
  --    session_id has not already been recorded as promoted against this row (prevents double-increment
  --    on retry — track via a session-id marker column or a join, see Do Not Touch below for the
  --    constraint this must not violate)
  -- 5. Timeline event (idempotency key = client-generated event UUID), on conflict do nothing

  -- No exception handlers that swallow errors: let any failure raise and roll back the entire
  -- function body's implicit transaction.

  return jsonb_build_object('group_id', v_group_id, 'library_row_id', v_library_row_id);
end;
$$;
```

  (The above is a skeleton, not literal final SQL — fill in symptoms/timeline inserts and the
  double-increment guard fully; the *shape* — one function, one implicit transaction, `on conflict do
  nothing` per idempotency-keyed table, no swallowed exceptions — is the non-negotiable part.)
- If preventing a double `use_count` increment on retry requires a new column or unique constraint beyond
  what ticket 11 shipped (e.g. a `promoted_session_id` marker on `personal_treatment_library`, or a
  join/marker row), add it in **this ticket's own migration file**, not by editing ticket 11's
  already-applied file.
- `pic-adapter-supabase.promoteGuestToAccount(guestState, newUserId)` (ticket 12's stub) is now
  implemented: calls `supabase.rpc('promote_guest_to_account', { ... })` exactly once per invocation,
  passing the guest group's client UUID and the player session's client UUID as idempotency keys.
- The RPC's return value gives `SessionEngine` (ticket 09) enough to proceed: at minimum the promoted
  `group_id` and `library_row_id`.

## Do Not Touch / Out of Scope

- Do not modify `GroupEngine`, `PlayerEngine`, `LibraryEngine`, `TimelineEngine`, or `SessionEngine`
  business logic — this ticket's engine-side surface is limited to satisfying the already-defined
  `RepositoryPort.promoteGuestToAccount` signature from ticket 02.
- Do not implement any UI retry affordance — `PersistenceGateModal` (ticket 15) renders the retry button;
  this ticket only guarantees the RPC is safe to call repeatedly.
- Do not touch `symptom_groups`, `symptoms`, `player_sessions`, `personal_treatment_library`, or
  `timeline_events` column definitions from ticket 11 beyond adding whatever idempotency-tracking
  column/constraint is strictly necessary — do so in a new migration file layered on top, never by editing
  an already-applied one.

## Adversarial Test Matrix (mandatory — every row gets its own test, none may be skipped)

**1. Happy path, no group link**
Setup: Guest state — finalized group + rated symptoms + finished player session,
`linked_group_id: null`.
Assertion: all 5 rows exist under `newUserId`; local guest state cleared; `use_count = 1`.

**2. Happy path, with group link**
Setup: same as #1 but the player session has `linked_group_id` set.
Assertion: the timeline event and player session both carry the link; group promoted exactly once.

**3. Mid-transaction failure — forced constraint violation**
Setup: inject a constraint violation on the last insert inside the function (e.g. a malformed FK).
Assertion: zero rows landed in **any** of the 5 tables for this attempt — verify by querying all 4
new tables plus `symptom_groups` post-failure.

**4. Mid-transaction failure — connection drop**
Setup: use `pg_sleep` plus a killed connection mid-call on the local Supabase instance.
Assertion: zero rows landed; a subsequent retry with the same idempotency key succeeds cleanly with
exactly one full row-set.

**5. Retry idempotency — clean success then retry**
Setup: call `promote()` once (succeeds), then again with the identical guest state + idempotency key.
Assertion: exactly one row per table; `use_count` is `1`, not `2`; no duplicate timeline event.

**6. Retry idempotency — dropped-response retry**
Setup: simulate the RPC succeeding server-side but the client never receiving the response, then retry.
Assertion: same as #5 — no double-write, no double-increment.

**7. Partial-payload rejection**
Setup: call the RPC with a payload missing a required field (e.g. no symptoms array).
Assertion: the RPC rejects cleanly with an error; zero rows written; no orphaned group-only row.

## Testing Requirement — Test-First Acceptance Criteria

One `it()` per matrix row above, named after the scenario column, e.g.:

- [ ] `it('happy path with no group link promotes all five entities and clears local guest state')`
- [ ] `it('happy path with a group link carries the link onto the player session and timeline event')`
- [ ] `it('mid-transaction failure via forced constraint violation leaves zero rows in any table')`
- [ ] `it('mid-transaction failure via connection drop leaves zero rows and permits a clean retry')`
- [ ] `it('calling promote() twice with the same idempotency key produces exactly one row-set and one
      use_count increment')`
- [ ] `it('a dropped-response retry produces exactly one row-set and one use_count increment')`
- [ ] `it('a partial payload is rejected with zero rows written')`

## Acceptance Criteria

- [ ] All 7 adversarial matrix rows pass as independent tests against a local `supabase start` instance.
- [ ] `pic-adapter-supabase.promoteGuestToAccount` calls the RPC exactly once per invocation.
- [ ] No client-side multi-insert fallback exists anywhere — the RPC is the sole transaction boundary.
- [ ] `use_count` is never observed to be anything other than exactly `1` after any successful promotion,
      no matter how many retries preceded it.
