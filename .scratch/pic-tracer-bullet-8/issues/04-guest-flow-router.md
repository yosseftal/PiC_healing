# 08-04 — Guest Happy-Path Flow Router

**What to build:** minimal screen-state machine — engine-derived navigation between guest flow steps without
business logic in the router. Separate ticket to preserve module isolation and Atomic Focus routing.

**Blocked by:** — (Wave 6.5 baseline; 08-01/08-02 done). May parallel 08-03.

**Status:** done

**Brief:** `.scratch/pic-tracer-bullet-8/briefs/04-guest-flow-router-brief.md`

## Screen states (tracer bullet)

`create-group` → `joint-treatment` → `pick-treatment` → `player` (stubs OK until Tickets 08-05–08).

## Definition of Done

- Typed discriminated union `GuestFlowScreen`; active screen **derived** from composition-layer facts +
  `SessionEngine` state — **no `useState` screen flags in components**.
- `useSyncExternalStore` + `guestFlowStore` in composition layer (or dedicated module).
- Router holds **no** engine business rules — only which stub screen mounts.
- `PersistenceGateModal` remains mounted globally (via `GuestModeShell`).
- Smoke tests: default `create-group`; flow API advances rendered screen.

## Do Not Touch

- Engine context files (08-03), `composition-root` engine construction.
- Adapter imports, Supabase, real screen implementations.

## Testing

- [x] `it('starts on create-group screen')`
- [x] `it('flow API switches the rendered screen component without component useState')`

## Resolution

Implemented engine-derived guest flow routing in `packages/pic-web/src/`:

- **`guest-flow-facts.ts`** — `GuestFlowFacts` snapshot (`activeGroupId`, `activePlayerSessionId`,
  `sessionState`, `groupFinalized`), pure `deriveGuestFlowScreen()`, `guestFlowStore` with
  `useSyncExternalStore`, `initGuestFlowFacts()` wired from `composition-root.ts`, and test helpers
  `advanceGuestFlowForTest()` / `resetGuestFlowFactsForTest()`.
- **`guest-flow-context.tsx`** — `useGuestFlowScreen()` hook.
- **`guest-flow-router.tsx`** — mounts one stub from `guest-flow-screens.tsx` based on derived screen.
- **`guest-flow-screens.tsx`** — stub screens with `data-testid={`guest-flow-${screen}`}`.
- **`App.tsx`** — `AppProviders` → `GuestModeShell` → `GuestFlowRouter` (placeholder `<main>` removed).
- **`composition-root.ts`** (minimal) — `initGuestFlowFacts` subscription, `setGuestFlowGroupFinalized` on
  `finalizeGroup`, `setGuestFlowPlayerSession` on `startSession`, `resetGroupFlowFactsForTest` for test isolation.

Derivation rules: `activePlayerSessionId` → `player`; no `activeGroupId` → `create-group`; draft group →
`joint-treatment`; finalized group → `pick-treatment`. Default empty facts → `create-group`.

Tests: `guest-flow-router.test.tsx` (derive + smoke), `app-shell.test.tsx` updated for create-group stub.
`depcruise` — 0 violations.
