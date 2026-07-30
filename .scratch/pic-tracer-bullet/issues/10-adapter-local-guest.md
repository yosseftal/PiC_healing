# 10 — `pic-adapter-local-guest`

**What to build:** the `localStorage`-backed `RepositoryPort` implementation Guest Mode runs against, with
zero network calls.

**Blocked by:** 02 (`RepositoryPort` + domain types), 03 (fake port + contract suite).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md` §A, Testing Decisions ("Contract tests, run against
both adapters"), `decisions.md` DEC-017 ("Guest Group data is not modeled in Supabase at all").

## Objective

> `pic-adapter-local-guest` — implements `RepositoryPort` against an in-memory/`localStorage`-backed store.
> No network calls. This is what Guest Mode runs against.

This ticket proves the port contract (ticket 02) and the shared contract suite (ticket 03) are real,
adapter-agnostic guarantees — not just true for the fake.

## Definition of Done

- Implements every `RepositoryPort` method from ticket 02, backed by `localStorage` in a browser
  environment and an in-memory fallback for Node/test environments — **no `fetch`, no `XMLHttpRequest`, no
  Supabase client import anywhere in this package.**
- `promoteGuestToAccount` on this adapter is a deliberate no-op-or-error: Guest data structurally cannot
  "promote" against itself — promotion always targets `pic-adapter-supabase` (ticket 13). Document the
  *why* in a short comment (this is a non-obvious constraint, not narration of obvious code) and decide
  which behavior (throw vs. reject with a typed error) fits the composition root in ticket 14/09 — do not
  silently swallow a call to it.
- Passes the shared contract-test suite from ticket 03
  (`runRepositoryPortContractTests(() => new LocalGuestRepository())`), excluding the
  `promoteGuestToAccount`-specific assertions (document explicitly, in the test file, which contract-suite
  assertions this adapter is exempt from and why).

## Do Not Touch / Out of Scope

- Do not implement `pic-adapter-supabase` — tickets 11–13.
- Do not implement any network or auth call of any kind.
- Do not add UI wiring — constructing and injecting this adapter is `pic-web`'s job (ticket 14), not this
  package's.

## Testing Requirement — Test-First Acceptance Criteria

- [ ] `it('runs the full RepositoryPort contract suite from ticket 03 against LocalGuestRepository, all
      green except promotion-specific cases')`
- [ ] `it('never calls fetch, XMLHttpRequest, or any Supabase client method')` (assert via a dependency
      check forbidding imports of network/Supabase libraries in this package, or a runtime spy in test
      setup that fails if either global is touched)
- [ ] `it('data persists across two separate LocalGuestRepository instances backed by the same storage key,
      simulating a page reload')`

## Acceptance Criteria

- [ ] All seven non-promotion `RepositoryPort` methods are implemented and pass the contract suite.
- [ ] Zero network-library imports anywhere in this package.
- [ ] The page-reload persistence test passes.
- [ ] `promoteGuestToAccount`'s behavior on this adapter is documented and intentional, not accidental.
