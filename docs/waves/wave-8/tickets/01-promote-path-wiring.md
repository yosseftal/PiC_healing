# 08-01 — Promote Path Wiring (Supabase factory + adapter swap)

**What to build:** composition-layer wiring that assembles a `GuestSnapshot` from the active guest
store, constructs an authenticated `SupabaseRepository`, swaps the `DelegatingRepositoryPort` provider
**before** `SessionEngine.promote()` (so `promoteGuestToAccount` hits Supabase, not
`GuestRepositoryCannotPromoteError`), and exposes a dev **auth stub** ("Sign in as test user") for the
tracer bullet.

**Blocked by:** Wave 6.5 baseline (Tickets 12–13, 01–06 — all done).

**Status:** done

**Source:** `docs/specs/tracer-bullet-happy-path.md` §E, User Stories 34–39; DEC-017 Persistence Gate;
Ticket 13 Atomic Promotion RPC.

## Objective

Connect Ticket 13's RPC to the `pic-web` composition root so Ticket 08-02 (`PersistenceGateModal`) can call
a single orchestrated action after auth — never importing adapters or Supabase clients from UI components.

## Locked seams

- **Only** `composition-root.ts` and `promote-path.ts` may import `pic-adapter-supabase` (depcruise).
- `swapToSupabaseAdapter(port)` registers the authenticated port; provider swap for the RPC must happen
  **before** `promote()`, with rollback to `LocalGuestRepository` when `promotionStatus === 'failed'`.
- `onPromotionSucceeded` continues to swap (idempotent) and `guestRepository.clear()` (Ticket 03 / DEC-017).
- Auth stub: `signInWithPassword` against env-configured test credentials — clearly labeled stub in code.

## Definition of Done

- `assembleGuestSnapshotForPendingGate()` reads `pendingFinishRequest.sessionId` from guest gate state and
  returns `{ group, playerSession }` or `null` when incomplete.
- `createSupabaseRepositoryFromClient(client)` factory wraps `new SupabaseRepository(client)`.
- `promoteWithAuthenticatedRepository(port, snapshot, newUserId)` swaps provider → promotes → rolls back
  provider on failure.
- `signInAsTestUser()` dev stub returns `{ userId, client, repository }` from env credentials.
- Integration test (remote Supabase, skippable without `.env.local`) proves end-to-end promotion + storage
  clear + provider swap.

## Do Not Touch / Out of Scope

- No `PersistenceGateModal` markup (Ticket 08-02).
- No OAuth provider UI beyond password stub.
- No schema/SQL changes — manual-apply only if a gap is discovered.

## Testing Requirement — Test-First Acceptance Criteria

- [x] `it('assembleGuestSnapshotForPendingGate returns null when no pending finish request')`
- [x] `it('assembleGuestSnapshotForPendingGate returns group+session for a gated guest session')`
- [x] `it('promoteWithAuthenticatedRepository swaps to Supabase before promote and rolls back on failure')`
- [x] `it('promoteWithAuthenticatedRepository leaves guest storage clear and provider swapped on success')`
- [x] `it('remote integration: atomic promotion via SupabaseRepository after provider swap')` (remote)

## Acceptance Criteria

- [x] All tests pass (remote integration may skip without credentials).
- [x] `npm run depcruise` in `pic-web` — 0 violations.
- [x] No UI component imports `pic-adapter-supabase`.

## Resolution

**Deliverables**

- `packages/pic-web/src/promote-path.ts` — `assembleGuestSnapshotForPendingGate`, `createSupabaseBrowserClient`,
  `createSupabaseRepositoryFromClient`, `signInAsTestUser` (dev stub), `promoteWithAuthenticatedRepository` with
  provider swap-before-promote and rollback on `promotionStatus === 'failed'`.
- `packages/pic-web/src/composition-root.ts` — `promotePathActions` surface for Ticket 08-02; `swapToSupabaseAdapter`
  registered via `registerAuthenticatedPort` in promote path.
- `packages/pic-web/.dependency-cruiser.cjs` — `promote-path.ts` allowed to import adapters; `from.path: ^src/`
  prevents false positives on adapter-internal imports.
- `packages/pic-web/package.json` — `pic-adapter-supabase`, `@supabase/supabase-js` dependencies.

**Verification**

- `npx vitest run packages/pic-web` — 10 passed (remote integration runs when `.env.local` present).
- `npm run depcruise` in `pic-web` — 0 violations.
- `npm run typecheck` in `pic-web` — clean.

**Notes**

- Remote integration tests use `vi.resetModules()` + dynamic `import('./composition-root')` so singleton state does not
  leak across tests that need a fresh guest-mode boot.
- Guest fixture ids use `randomUUID()` (not prefixed strings) so Postgres uuid columns accept promotion payloads.
