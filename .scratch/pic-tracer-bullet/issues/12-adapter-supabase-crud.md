# 12 — `pic-adapter-supabase` — standard CRUD methods

**What to build:** every `RepositoryPort` method **except** `promoteGuestToAccount`, implemented against
real Supabase Postgres/Auth, always scoped by `auth.uid()`.

**Blocked by:** 02 (`RepositoryPort` + domain types), 03 (fake port + contract suite), 11 (Supabase schema
migration).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md` §A, Testing Decisions ("Contract tests, run against
both adapters" — "the latter against a local Supabase instance via `supabase start`, not a mocked client").

## Objective

> `pic-adapter-supabase` — implements `RepositoryPort` against Supabase Postgres/Auth, always scoped by
> `auth.uid()`.

This ticket proves the port contract and shared contract suite hold against a real Postgres/RLS setup
before the highest-risk piece (the promotion RPC, ticket 13) is layered on top.

## Definition of Done

- Implements `getGroup`, `saveGroup`, `getPlayerSession`, `savePlayerSession`, `getOrCreateLibraryRow`,
  `incrementUseCount`, `appendTimelineEvent` against the tables from ticket 11, using the Supabase JS
  client.
- Every query relies on RLS (`auth.uid() = user_id`) as the enforcement layer — do not add manual
  client-side `user_id` filtering as the *only* guard; the database policy from ticket 11 is the real
  boundary, matching the existing migration's pattern.
- `promoteGuestToAccount` on this adapter is an explicit, clearly-labeled stub (e.g. throws `"not
  implemented — see ticket 13"`) — this ticket does not implement the RPC call itself.
- The shared contract-test suite from ticket 03 is run against this adapter, against a **local Supabase
  instance started via `supabase start`** — not a mocked client — all green except the
  `promoteGuestToAccount`-specific assertions (deferred to ticket 13).

## Do Not Touch / Out of Scope

- Do not implement `promoteGuestToAccount` — ticket 13 exclusively owns the RPC and its wiring here.
- Do not implement or modify the schema migration itself — ticket 11.
- Do not add any UI code.
- Do not add manual application-level authorization checks that duplicate RLS — trust the policy from
  ticket 11 as the single enforcement point, per the existing migration's own pattern.

## Testing Requirement — Test-First Acceptance Criteria (run against local Supabase, not mocked)

- [ ] `it('getOrCreateLibraryRow creates and returns a row scoped to auth.uid()')`
- [ ] `it('incrementUseCount is idempotent under retry against the real table')`
- [ ] `it('appendTimelineEvent never mutates or removes prior events in the real table')`
- [ ] `it('a query for another user\'s data returns empty due to RLS, never an error that leaks
      existence')`

## Acceptance Criteria

- [ ] All seven non-promotion `RepositoryPort` methods are implemented against real Supabase.
- [ ] The shared contract suite passes against a local `supabase start` instance.
- [ ] `promoteGuestToAccount` is a clearly-labeled stub, not a silent no-op.
- [ ] No manual `user_id` filtering exists as a substitute for RLS.
