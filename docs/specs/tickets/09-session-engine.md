# 09 — `SessionEngine` (Guest Mode bootstrap + Persistence Gate orchestration)

**What to build:** Guest Mode bootstrap, Persistence Gate trigger detection as a side effect of
`PlayerEngine.finish()`/`finishAnyway()` while still on `local-guest`, and promotion orchestration that
calls the already-atomic `RepositoryPort.promoteGuestToAccount` as a black box.

**Blocked by:** 05 (`LibraryEngine`), 06 (`TimelineEngine`), 07 (`GroupEngine`), 08 (`PlayerEngine`) — per
the spec's own ticketing note: "`SessionEngine` (Guest/Promotion, depends on all four)".

**Status:** done

**Source:** `docs/specs/tracer-bullet-happy-path.md` §E in full, User Stories 1–5, 34–39, `CONTEXT.md`
Guest Group / Persistence Gate entries, `decisions.md` DEC-017.

## Objective

`SessionEngine` is the orchestration layer, not a re-implementation of promotion's atomicity. The actual
single-transaction Postgres RPC lives in ticket 13; this ticket only decides **when** to call it and what
to do with the active adapter before/after that call succeeds or fails.

## Context Injection (copied verbatim from the spec §E — this is the single source of truth)

> App boot: `SessionEngine` starts against `pic-adapter-local-guest` with no network call, unconditionally.
>
> The Persistence Gate is not a screen the EM can navigate to directly — it is a side effect
> `SessionEngine` triggers only when `PlayerEngine.finish()`/`finishAnyway()` is about to run its one-time
> side effects (§D) and the current adapter is still `local-guest`.
>
> **Atomic Promotion is a hard requirement, not a design preference.** On successful auth,
> `SessionEngine.promote(guestState, newUserId)` calls `RepositoryPort.promoteGuestToAccount(...)`...
>
> **No partial adapter swap:** `pic-web` only swaps its active adapter from `local-guest` to `supabase`,
> and only clears the local Guest state, **after** the RPC call returns success. A failed or timed-out
> call leaves the EM exactly where they were, on `local-guest`, free to retry — never in a state where the
> UI believes it's authenticated but the promotion silently didn't land.
>
> On decline/close, nothing is written; the in-memory/`localStorage` Guest state is simply abandoned (or
> explicitly cleared) — no server contact ever happened.

## Definition of Done

- `SessionEngine.getState(): { mode: 'guest' | 'authenticated', gateTriggered: boolean, promotionStatus:
  'idle' | 'pending' | 'failed' | 'succeeded' }`.
- `SessionEngine.onFinishRequested(sessionId: string, kind: 'finish' | 'finishAnyway'): Promise<void>` —
  when `mode === 'guest'`, sets `gateTriggered = true` and does **not** call `PlayerEngine.finish()` /
  `finishAnyway()` yet; when `mode === 'authenticated'`, calls straight through with no gate.
- `SessionEngine.promote(guestState: GuestSnapshot, newUserId: string): Promise<void>` — sets
  `promotionStatus = 'pending'`, calls `RepositoryPort.promoteGuestToAccount(guestState, newUserId)`; on
  success, flips `mode` to `'authenticated'`, sets `promotionStatus = 'succeeded'`, and signals that the
  local Guest state may now be cleared, then (since the gate was blocking a pending Finish) completes the
  originally-requested `finish()`/`finishAnyway()` call against the new authenticated adapter/session; on
  failure, sets `promotionStatus = 'failed'`, leaves `mode` as `'guest'`, and does **not** clear any state —
  the caller is free to call `promote()` again.
- `SessionEngine.discardGuestState(): void` — abandons/clears the local Guest state; never contacts a
  network adapter under any circumstance.

## Do Not Touch / Out of Scope

- Do not implement the actual Postgres RPC or SQL transaction — ticket 13 owns that. This ticket calls
  `RepositoryPort.promoteGuestToAccount` as an already-atomic black box per its ticket-02 contract, and only
  orchestrates *when* to call it and what to do with adapter/state timing around that call.
- Do not implement any UI (`PersistenceGateModal`) — ticket 15 renders whatever signal this engine emits.
- Do not implement authentication itself (Social Auth / Magic Link token exchange) — treat "the EM
  successfully authenticated, here is `newUserId`" as an input this engine receives, not something it
  produces.
- Do not implement account deletion, biometric unlock, or the 30-day offline grace window — all explicitly
  Out of Scope for this spike (DEC-017 §4, §6).

## Testing Requirement — Test-First Acceptance Criteria

- [x] `it('onFinishRequested signals gateTriggered=true and does not run Finish side effects when mode is
      guest')`
- [x] `it('onFinishRequested passes straight through to finish()/finishAnyway() with no gate signal when
      mode is authenticated')`
- [x] `it('promote() on success flips mode from guest to authenticated and signals guest state can be
      cleared')`
- [x] `it('promote() on success completes the originally-requested finish()/finishAnyway() call that
      triggered the gate')`
- [x] `it('promote() on failure leaves mode as guest and does not clear guest state, permitting retry')`
- [x] `it('discardGuestState() never invokes any RepositoryPort method that would contact a network
      adapter')`

## Acceptance Criteria

- [x] All four public methods exist with the exact signatures above.
- [x] All six tests pass against the fake `RepositoryPort` from ticket 03 (promotion success/failure can be
      simulated by configuring the fake's `promoteGuestToAccount` to resolve or reject).
- [x] No SQL, RPC, or auth-provider code exists in this ticket's diff.

## Resolution

### Solution Path

`SessionEngine` lives in `packages/pic-engine/src/session-engine/index.ts` and is constructed against
`RepositoryPort` and `PlayerEngine` only (zero `GroupEngine` import; verified by the isolation scanner
test). Guest-mode `onFinishRequested` sets `gateTriggered` and remembers the pending Finish kind without
calling `PlayerEngine.finish()`/`finishAnyway()`. Authenticated mode passes straight through.

`promote()` calls `RepositoryPort.promoteGuestToAccount` as a black box with `idempotencyKey =
guestState.group.id`, flips `mode` to `'authenticated'` only after the RPC resolves, and replays the gated
Finish request once. Failures set `promotionStatus: 'failed'` without rethrowing, leaving the Event
Manager on `local-guest` with retryable state.

`subscribe()`/`notify()` (Wave 7.5) let `pic-web` wire `useSyncExternalStore` so dumb-reflection
subscribers observe `promotionStatus: 'pending'` before the RPC resolves — the contract ticket 15 needs for
pending-state UI.

`saveGuestSessionGate` / `initialGateState` (Wave 7.5) persist `gateTriggered` and the pending Finish
request in `LocalGuestRepository` so a page refresh reopens the Persistence Gate; `promotionStatus`
stays in-memory so a mid-RPC refresh never surfaces stale pending UI.

`onPromotionSucceeded` (Wave 7.5) fires after a successful RPC so the composition root can
`DelegatingRepositoryPort.swapProvider()` before the replayed Finish runs against the authenticated
adapter.

`discardGuestState()` clears gate bookkeeping via `saveGuestSessionGate` and never calls promotion or
other network-facing port methods.

### Architectural Decisions

- **Pending notify (Wave 7.5):** `promote()` sets `promotionStatus = 'pending'` and calls `notify()`
  immediately, before `await promoteGuestToAccount`. The composition root subscribes once at module load
  and forwards mutations into a cached `useSyncExternalStore` snapshot.
- **Refresh resilience (Wave 7.5):** `GuestSessionGateState` on `RepositoryPort`; gate flags live in the
  same `localStorage` blob as guest entities. `SessionEngine` rehydrates from `initialGateState` at
  construction (composition root reads `getGuestSessionGateSync()`).
- **Adapter rebind (Wave 7.5):** All engines hold a `DelegatingRepositoryPort` wrapper. Post-promotion
  `swapProvider` retargets every engine to the authenticated port without reconstruction — resolving the
  readonly `RepositoryPort` binding that would otherwise leave replayed Finish side effects on the guest
  adapter.
- **Persistence boundary normalization (DEC-015):** `normalizeForPermanentStore()` maps `in_view` → `unseen`
  at the `promote()` boundary (defensive re-normalize even if the adapter already normalized on read).

### Deviations

- `discardGuestState()` is `async` in the as-built code because it awaits `saveGuestSessionGate` (Wave 7.5
  refresh path). The ticket's `void` signature is satisfied at the call-site level via fire-and-forget
  wrappers in `composition-root.ts`.
- Replay after promotion still runs against the same `RepositoryPort` instance in unit tests; production
  wiring relies on `DelegatingRepositoryPort` + `swapToSupabaseAdapter()` (ticket 14/15 seam).
- `LocalGuestRepository.promoteGuestToAccount` deliberately throws — E2E promotion remains blocked until
  ticket 13/15 route promote to Supabase; engine-layer gate semantics are complete and tested against the
  fake port.
