# 03 — Fake in-memory `RepositoryPort` + shared contract test suite

**What to build:** the in-memory test double every engine ticket (05–09) writes its unit tests against, plus
the one shared contract-test suite that both real adapters (tickets 10, 12/13) must also pass unmodified.

**Blocked by:** 02 (`RepositoryPort` interface + domain types).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md`, Testing Decisions — "Primary seam, primary test
target" and "Contract tests, run against both adapters".

## Objective

> **Primary seam, primary test target:** `pic-engine`'s public API... is tested directly, in-process,
> against a fake in-memory `RepositoryPort` implementation — no DOM, no React, no real Supabase. This is
> the highest, and intended to be close to the *only*, place business-rule tests live.

> **Contract tests, run against both adapters:** one shared test suite asserts `RepositoryPort` behavior
> (e.g. "`incrementUseCount` is idempotent under retry," "`promoteGuestToAccount` moves all five entities
> atomically") and is run once against `pic-adapter-local-guest` and once against `pic-adapter-supabase`
> (the latter against a local Supabase instance via `supabase start`, not a mocked client) — this is what
> guarantees Web/Native parity without duplicating business-rule tests per adapter.

## Definition of Done

- `packages/pic-engine/test/fakes/fake-repository-port.ts` implements `RepositoryPort` fully in memory
  (plain objects/`Map`s), no I/O, synchronous logic wrapped in resolved Promises to match the interface's
  async shape.
- `packages/pic-engine/test/contract/repository-port.contract.ts` exports a function shaped like
  `runRepositoryPortContractTests(makePort: () => RepositoryPort): void` containing `describe`/`it` blocks
  parameterized so any adapter can be plugged in without copy-pasting test bodies.
- This ticket invokes the contract suite once against the fake, in this package, all green.
- The exported contract-suite function is the exact file tickets 10 and 13 import later — do not let it
  depend on anything fake-specific (no reaching into the fake's internals from the suite).

## Do Not Touch / Out of Scope

- Do not implement `pic-adapter-local-guest` (real `localStorage`) — ticket 10.
- Do not implement `pic-adapter-supabase` — tickets 12/13.
- Do not add any engine business logic (`GroupEngine`, `PlayerEngine`, etc.) — the fake only stores and
  returns data; it must not validate business rules (e.g. it should accept an out-of-range intensity
  without complaint — that validation belongs to `GroupEngine`, ticket 07, not the port implementation).

## Testing Requirement — Test-First Acceptance Criteria

Write these `it()` blocks inside the shared contract-suite function, then make the fake pass all of them:

- [ ] `it('incrementUseCount increments use_count by exactly 1')`
- [ ] `it('incrementUseCount called twice with the same idempotency key increments exactly once')`
- [ ] `it('getOrCreateLibraryRow creates a new row on first call and returns the same row id on a second
      call for the same user+treatment')`
- [ ] `it('appendTimelineEvent never removes or mutates previously appended events')`
- [ ] `it('promoteGuestToAccount writes group, symptoms, player session, library row, and timeline event
      all under the new user id')`
- [ ] `it('promoteGuestToAccount called twice with the same idempotency key results in exactly one set of
      rows (no duplication)')`

## Acceptance Criteria

- [ ] `FakeRepositoryPort` implements all eight `RepositoryPort` methods with in-memory storage only.
- [ ] The contract-suite function is adapter-agnostic (takes a `makePort` factory, asserts only through the
      `RepositoryPort` interface).
- [ ] All six contract tests above pass against the fake in this ticket.
- [ ] No business-rule validation lives inside the fake.
