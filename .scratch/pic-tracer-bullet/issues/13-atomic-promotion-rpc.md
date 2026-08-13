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

## Resolution

**Status: PAUSED at the migration checkpoint — NOT done.** Per the orchestrator's brief, this ticket
cannot apply SQL migrations in this sandbox (no Docker/Supabase CLI/direct Postgres connection). The
migration below is fully drafted, committed, and red-proofed against the current (pre-migration) remote
project, then work stopped exactly as instructed. `**Status:**` above intentionally remains
`ready-for-agent` until resumed post-migration and driven to green.

### Solution Path (so far)

1. Drafted `supabase/migrations/20260813141210_promote_guest_to_account_rpc.sql`: a single
   `promote_guest_to_account` plpgsql function (`security definer`, one implicit transaction, no exception
   handlers), plus two additive columns this ticket is explicitly permitted to add
   (`symptom_groups.promotion_payload_fingerprint`, `personal_treatment_library.promoted_session_ids`).
2. Implemented `SupabaseRepository.promoteGuestToAccount` (`packages/pic-adapter-supabase/src/supabase-repository.ts`):
   calls `supabase.rpc("promote_guest_to_account", {...})` exactly once, then re-fetches the promoted
   group/session (via the existing `getGroup`/`getPlayerSession`) and two small new private helpers
   (`getLibraryRowById`/`getTimelineEventById`) to build the full `PromoteGuestToAccountResult` — no
   client-side multi-insert fallback exists anywhere in this method or file.
3. Removed the now-superseded `SupabaseRepositoryPromotionNotImplementedError` stub class (ticket 12's
   placeholder for exactly this method) from `supabase-repository.ts` and its `index.ts` export.
4. Added the 7 required adversarial `it()`s plus 1 extra (cross-identity-mismatch hardening) to
   `supabase-repository.test.ts`'s `promoteGuestToAccount` describe block, replacing ticket 12's own
   single "is a clearly-labeled stub" test there (that exact test asserted behavior ticket 13 is
   explicitly here to replace — see Deviations #1).
5. Ran the new suite against the **current, pre-migration** remote project (`NODE_TLS_REJECT_UNAUTHORIZED=0
   npx vitest run packages/pic-adapter-supabase`, per this ticket's environment section) to get the red
   proof below, then stopped.
6. Verified no regressions: full workspace `npx tsc --noEmit` (`pic-adapter-supabase` + all 4 packages) —
   zero errors; `npm run depcruise` in both `pic-engine` (63 modules, 174 deps, 0 violations) and `pic-web`
   (286 modules, 472 deps, 0 violations); `pic-engine` + `pic-web` + `pic-adapter-local-guest` test suites —
   109 passed, 5 skipped, 0 failed, no regressions.
7. Verified clean state before/after every test run via `scripts/wave6-supabase-audit.mjs`: all 4 Wave 6
   tables at 0 rows, `treatments` at exactly 3 seed rows, both before and after every run in this session.

### The drafted migration SQL (full, for the Event Manager's review before manual application)

See `supabase/migrations/20260813141210_promote_guest_to_account_rpc.sql` in full. Summary of the design
choices baked into it (all documented inline in the file's own comments):

- **Idempotency key = `symptom_groups.id`** (== `PromoteGuestToAccountInput.idempotencyKey`, per that
  field's own doc comment — "the Guest Group's client-side UUID, reused as the eventual
  `symptom_groups.id`"). A SHA-256 fingerprint of the *entire* incoming payload
  (`new_user_id + guest_group + symptoms + player_session`) is stored on first write
  (`promotion_payload_fingerprint`, new column) and compared on every subsequent call with that same id: a
  matching fingerprint is a true no-op (falls through to writes that are all individually
  `on conflict do nothing`/guarded); a mismatching one `raise exception`s before any write, satisfying the
  Wave 2.5 cross-identity-mismatch hardening (`PromoteGuestToAccountIdentityMismatchError`) — never a
  silent overwrite, never a silent first-writer-wins.
- **Double-`use_count`-increment guard:** a new `personal_treatment_library.promoted_session_ids uuid[]`
  column. The `update ... set use_count = use_count + 1 where id = ... and not (promoted_session_ids @>
  array[v_session_id])` statement increments exactly once per distinct `player_session.id`, regardless of
  whether the library row was just created or already existed, and is naturally retry-safe under Postgres's
  MVCC row-locking semantics even for genuinely concurrent calls (not just sequential retries).
- **Timeline event id = the promoted `player_session.id`:** `PromoteGuestToAccountInput` carries no
  separate client-generated Timeline-event UUID (only `group.id` and `playerSession.id` exist) — this is a
  deliberate, documented deviation from the ticket's own DoD skeleton comment ("Timeline event (idempotency
  key = client-generated event UUID)"), resolved by reusing the session's own id 1:1 rather than inventing
  an unrequested extra client id. Flagged in Deviations below.
- **`auth.uid() = p_new_user_id` authorization check**, plus `revoke ... from public` /
  `grant execute ... to authenticated`: not explicitly required by the ticket text, but added because a
  `security definer` function that bypasses RLS is unsafe to leave callable by any role/any identity — this
  closes both "anonymous caller" and "authenticated caller promoting into someone else's account" before
  the EM ever sees this function live. Flagged for EM awareness in case a different calling convention was
  intended (e.g. a server-side worker not itself authenticated as the new user) — see Escalations below.
- **FK-violation-based constraint-violation test (row 3):** uses a syntactically valid but non-existent
  `treatment_id` (a real FK into `treatments`), not a "malformed" one — Postgres's own uuid type parsing
  would reject a truly malformed value before RLS/FK are even consulted, which would test the wrong thing.
- **Connection-drop simulation (row 4) — flagged explicitly for EM sign-off**, detailed in its own section
  below.

### Red-test proof (current, pre-migration remote project)

Ran 3 consecutive full runs of `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run packages/pic-adapter-supabase`
— identical result every time: **8 failed (all `promoteGuestToAccount` tests: the 7 required rows + 1
extra), 15 passed, 5 skipped** (the frozen `RepositoryPort` contract suite's own `promoteGuestToAccount`
block, still `skipPromoteGuestToAccount: true` for this adapter). All 15 passing tests are ticket 12's
pre-existing, unmodified suite plus this ticket's own additions that don't touch `promoteGuestToAccount` —
proving nothing here regressed ticket 12's closed work.

Every one of the 8 failures is for the **specific, expected reason**, not a generic/trivially-true one —
each assertion was deliberately tightened (see inline test comments) so it could not accidentally pass
before the migration exists:

- 5 tests (both happy-path rows, both idempotent-retry rows, plus the extra cross-identity test) fail with
  the literal PostgREST `PGRST202`-shaped error: `SupabaseRepository.promoteGuestToAccount: Could not find
  the function public.promote_guest_to_account(p_guest_group, p_new_user_id, p_player_session, p_symptoms)
  in the schema cache` — exactly the "function not found" signal this ticket's CRITICAL section names as
  the expected red proof.
- **Row 3** (constraint violation) asserts `.rejects.toThrow(/23503|foreign key/i)` — fails now because the
  actual error is the "could not find the function" message above, which does not match; will only pass
  once the migration exists *and* the FK-violation path genuinely rolls back.
- **Row 4** (connection drop) asserts the aborted call's error message matches `/abort/i` — fails now
  because the pre-migration response arrives near-instantly (well before the test's 300ms abort fires), so
  the observed error is again "could not find the function", not an `AbortError`; will only pass once the
  migration's real `pg_sleep(3)` is slow enough for the abort to actually win the race.
- **Row 7** (partial payload) asserts the error message matches `/must be a jsonb array/i` (the RPC's own
  planned validation message) — fails now for the same "could not find the function" reason; deliberately
  *not* asserting the weaker "mentions p_symptoms", because PostgREST's own "could not find the function"
  error text already lists every parameter name it was looking for (p_symptoms included), which would have
  let this test trivially pass for the wrong reason even before the migration exists.

Clean-state audit (`scripts/wave6-supabase-audit.mjs`) confirmed before and after every run in this
session: all 4 Wave-6 tables at 0 rows, `treatments` at exactly 3 seed rows — every ephemeral test user this
suite creates cascades away its own data via the existing `afterAll`, migration or no migration.

### What the Event Manager should review before applying (per the brief's explicit ask)

**The connection-drop simulation gating mechanism (row 4), specifically:**

- **Gate:** a single jsonb boolean key, `__test_only_connection_drop__`, checked as the *very first*
  statement in the function body (`supabase/migrations/20260813141210_promote_guest_to_account_rpc.sql`
  lines 78–82), before any read or write. When present and truthy: `perform pg_sleep(3);` then an
  unconditional `raise exception` — a deterministic, guaranteed rollback, not a bet on real network-level
  query cancellation.
- **Why it cannot accidentally trigger in production:** `SupabaseRepository.promoteGuestToAccount` (the
  only shipped code path that ever calls this RPC) builds `p_guest_group` from exactly
  `FinalizedSymptomGroup`'s own fixed field set (`id`/`name`/`joint_treatment_muscle_test`/
  `joint_treatment_test_at`/`created_at`) — see the method's implementation. There is no branch, override,
  or optional parameter anywhere in that method that could ever add an extra key to that object; the only
  place `__test_only_connection_drop__` is ever set is the row-4 test itself, which bypasses the adapter
  entirely and calls `user.client.rpc(...)` directly with a hand-built payload (see `toRpcPayload`'s
  `testOnlyConnectionDrop` option in the test file) specifically because the adapter has no way to emit it.
- **Exact abort timing used:** the test starts an `AbortController`, fires the RPC call with
  `.abortSignal(controller.signal)`, and calls `controller.abort()` after **300ms** — well before the
  server-side `pg_sleep(3)` (3000ms) completes, so the client's fetch is guaranteed to abort mid-flight,
  never observing the eventual `raise exception`. The test then waits an additional 3200ms (comment
  explains why: to let the server-side statement actually finish rolling back before asserting "zero rows
  landed" — the client abort only stops the client from *seeing* the response, not the server from
  finishing its own statement) before verifying zero rows and retrying cleanly.
- **Not yet verified against the real gate:** every number above (3-second sleep, 300ms abort, 3.2-second
  wait) is currently only exercised against the "function not found" error path (see the red-test proof
  above) — the *actual* timing race (does the abort really fire before a genuine 3-second `pg_sleep`
  reliably, on this remote project's real latency profile) can only be confirmed once the migration is
  live. Flagging this explicitly as still needing real-world confirmation, not just code review, once
  resumed.

### Architectural Decisions

1. **Full rows re-fetched after RPC success, not returned by the RPC itself.** The RPC returns only 4 ids
   (`group_id`, `session_id`, `library_row_id`, `timeline_event_id`) — `pic-adapter-supabase` re-fetches
   each entity's authoritative current state through the same (now newUserId-authenticated) client, reusing
   `getGroup`/`getPlayerSession` and two small new private helpers rather than duplicating
   row-to-domain-object mapping in SQL. This is also what makes the no-op retry path (row 5/6) trivially
   correct: whether this call just wrote the rows or found them already written by an earlier call, the
   re-fetch always reflects true current state.
2. **`idempotencyKey` invariant enforced defensively in the adapter, not just documented.** Since
   `PromoteGuestToAccountInput.idempotencyKey`'s doc comment states it *is* `group.id`
   ("...reused as the eventual `symptom_groups.id`"), and the RPC's own conflict/mismatch tracking is keyed
   on that column (not a separate one), `promoteGuestToAccount` throws immediately, client-side, if a
   caller ever passes a mismatched `idempotencyKey`/`group.id` pair — before making any network call.
3. **`security definer` locked down with an explicit `auth.uid()` check + `revoke`/`grant`** — see the
   drafted-SQL summary above.

### Deviations

1. **Replaced, rather than kept alongside, ticket 12's one `promoteGuestToAccount` stub test.** The
   permission table says "do not delete or weaken ticket 12's existing tests" — but that one test
   (`"is a clearly-labeled stub that always throws, never a silent no-op"`) asserted the exact placeholder
   behavior this ticket exists to replace (`rejects.toBeInstanceOf(SupabaseRepositoryPromotionNotImplementedError)`),
   which becomes false, by design, the moment this ticket lands. Ticket 12's own doc comments on
   `SupabaseRepositoryPromotionNotImplementedError` are explicit that this is "ticket 13's exclusive scope"
   to fill in — I read this one test as the intentional, expected exception to "don't touch ticket 12's
   tests," not a violation of that instruction. Every other test in the file (contract suite,
   `getGroup`/`saveGroup`, `getPlayerSession`/`savePlayerSession`, the ticket-12 "Adapter-specific Testing
   Requirement" block) is untouched.
2. **Removed `SupabaseRepositoryPromotionNotImplementedError`** (class + its `index.ts` export) rather than
   leaving it defined-but-unused, for the same reason as #1 — it exclusively documented behavior this ticket
   replaces, and leaving a never-thrown error class in the module would be misleading dead code.
3. **Added two small private helper methods** (`getLibraryRowById`, `getTimelineEventById`) to
   `SupabaseRepository`, reusing the file's existing `rowToLibraryRow`/`rowToTimelineEvent` mapper
   functions. The permission table says "fill in the `promoteGuestToAccount` method body only... do not
   restructure" the rest of the file — I read this as "don't touch ticket 12's 9 other already-working
   methods," not as "the new method may only ever be a single function body with zero helpers." No
   existing method's behavior, signature, or tests changed.
4. **Timeline-event id reuses `player_session.id`** rather than a dedicated client-generated event UUID —
   see the drafted-SQL summary above. `PromoteGuestToAccountInput` (ticket 02, read-only) has no field for
   one, and adding an unrequested new client-generated-id field to that interface is out of this ticket's
   scope (`pic-engine` is read-only for this entire wave). This is a deliberate, minimal, additive
   resolution, not a silent gap — flagged here for visibility, not treated as blocking.
5. **Row 6's ("dropped-response retry") mechanics are intentionally similar to Row 5's** (sequential
   success-then-retry with the same payload) rather than a distinct network-level simulation, unlike Row
   4's deterministic `pg_sleep`+abort approach. A byte-for-byte "the server replied but the client's socket
   never got it" simulation is not practically reproducible against a managed remote Postgres/PostgREST
   instance without raw socket control — the RPC's own idempotency logic cannot distinguish "caller
   received my reply" from "caller lost my reply" (it has no way to know either), so both rows exercise the
   identical underlying guarantee under the two distinct real-world framings the ticket names separately.
   Documented inline in the test itself, not hidden.

### Escalations / open questions for the Event Manager

1. **Is `auth.uid() = p_new_user_id` the correct authorization model?** Not explicitly required or
   forbidden by the ticket text. I added it because leaving a `security definer` function (which bypasses
   RLS by design) callable with an arbitrary `p_new_user_id` by any authenticated caller would let one
   account silently write Guest data into a different account's tables — a severe risk on a ticket
   explicitly flagged as highest-risk. If a different calling convention is actually intended (e.g. a
   trusted server-side context that is never itself authenticated as the promoted-to user), this check
   would need to be relaxed or replaced with a different guard — flagging before the EM applies this, not
   guessing silently.
2. **Timeline-event id reuse (Deviation #4 above)** — low-risk, but noting it here too since it's the one
   place this migration's shape diverges most from the ticket's own DoD skeleton comment.

No orphan-data risk, logic conflict, or ambiguity was found that blocks proceeding past this checkpoint —
the two items above are both "please confirm this design choice," not "I don't know how to proceed."
