# 10 — `pic-adapter-local-guest`

**What to build:** the `localStorage`-backed `RepositoryPort` implementation Guest Mode runs against, with
zero network calls.

**Blocked by:** 02 (`RepositoryPort` + domain types), 03 (fake port + contract suite).

**Status:** done

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

- [x] `it('runs the full RepositoryPort contract suite from ticket 03 against LocalGuestRepository, all
      green except promotion-specific cases')`
- [x] `it('never calls fetch, XMLHttpRequest, or any Supabase client method')` (assert via a dependency
      check forbidding imports of network/Supabase libraries in this package, or a runtime spy in test
      setup that fails if either global is touched)
- [x] `it('data persists across two separate LocalGuestRepository instances backed by the same storage key,
      simulating a page reload')`

## Acceptance Criteria

- [x] All seven non-promotion `RepositoryPort` methods are implemented and pass the contract suite.
- [x] Zero network-library imports anywhere in this package.
- [x] The page-reload persistence test passes.
- [x] `promoteGuestToAccount`'s behavior on this adapter is documented and intentional, not accidental.

## Resolution

### Solution Path

`LocalGuestRepository` in `packages/pic-adapter-local-guest/src/index.ts` implements the full
`RepositoryPort` surface against a single JSON blob (`GuestRepositorySnapshot`) in one `localStorage` key
(`DEFAULT_GUEST_STORAGE_KEY = "pic:guest-repository:v1"`), with a per-instance `Map` fallback for Node /
Vitest. Every read-modify-write is atomic from the caller's perspective.

All seven non-promotion methods are implemented: `getGroup` / `saveGroup`, `getPlayerSession` /
`savePlayerSession` (with DEC-015 `in_view` → `unseen` normalization on read and write),
`getOrCreateLibraryRow`, `incrementUseCount` (idempotent per `idempotencyKey`), and `appendTimelineEvent`.

`promoteGuestToAccount` always rejects with `GuestRepositoryCannotPromoteError` — Guest data cannot promote
against itself; promotion targets `pic-adapter-supabase` (ticket 13).

`local-guest-repository.test.ts` runs `runRepositoryPortContractTests(..., { skipPromoteGuestToAccount:
true })` so the five promotion `describe` blocks are visibly skipped, plus adapter-specific tests for CRUD
round-trips, `in_view` normalization, page-reload persistence, promotion rejection, and network isolation
(static import scan of `index.ts`).

### Architectural Decisions

- **Fixed storage key (DEC-017):** `DEFAULT_GUEST_STORAGE_KEY` is not random so a browser page reload
  reconnects to the same guest blob — required for Guest Mode persistence across refresh.
- **Refresh resilience (Wave 7.5):** `getGuestSessionGate` / `saveGuestSessionGate` / `getGuestSessionGateSync`
  persist `GuestSessionGateState` inside the same blob as guest entities. `SessionEngine` rehydrates gate
  flags at boot via `composition-root.ts` calling `getGuestSessionGateSync()`.
- **Promotion boundary:** Typed error (not silent no-op) so the composition root and `SessionEngine` never
  enter a false-authenticated limbo against this adapter.

### Deviations

- **Symptom persistence gap (Wave 4 carry-over):** `saveGroup` persists groups but there is no separate
  symptom-by-id path; `GroupEngine`'s in-memory symptom index is not rebuilt from storage on reload —
  documented in ticket 07's Resolution. Not in ticket 10's original DoD.
- **Gate state only:** `promotionStatus` is intentionally not persisted (in-memory on `SessionEngine`) so a
  mid-RPC refresh never surfaces stale pending UI — per `repository-port.ts` doc comment.

### Verification

`npm test` on `release/wave-5-7-finalization`: 4 contract passes + 10 adapter-specific tests in
`local-guest-repository.test.ts` (5 promotion contract cases skipped); zero network imports; wired as the
inner provider of `DelegatingRepositoryPort` in `composition-root.ts`.
