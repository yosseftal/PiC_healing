# 08-03 — Engine Context Expansion (`GroupEngine` + `PlayerEngine`)

**What to build:** dumb-reflection React context for `GroupEngine` and `PlayerEngine`, mirroring the
`SessionEngine` pattern — composition root constructs once; screens read/call via hooks only.

**Blocked by:** — (Wave 6.5 baseline; 08-01/08-02 done).

**Status:** done

**Brief:** `.scratch/pic-tracer-bullet-8/briefs/03-engine-context-expansion-brief.md`

## Definition of Done

- `GroupEngineProvider` / `useGroupEngineActions` (+ optional `useGroupEngineState` for flow facts only).
- `PlayerEngineProvider` / `usePlayerSession(sessionId)` + player action hooks.
- `app-providers.tsx` nests Session → Group → Player providers.
- Composition root constructs `GroupEngine` against shared `DelegatingRepositoryPort`; reuses existing
  `playerEngine` singleton.
- `depcruise` — 0 violations; no adapter imports outside composition layer.

## Do Not Touch

- Screen markup (Tickets 08-05, 08-08).
- `SessionEngine` internals.
- `guest-flow-router` files (Ticket 08-04).

## Testing

- [x] `it('GroupEngine hooks throw outside provider')`
- [x] `it('PlayerEngine hooks throw outside provider')`
- [x] `it('composition root exposes a single shared DelegatingRepositoryPort to all engines')`

## Resolution

- **`composition-root.ts`:** constructs `groupEngine` against the existing `DelegatingRepositoryPort`;
  exports `groupEngine`, `playerEngine`, `groupEngineActions`, `groupEngineStore` (flow fact:
  `activeGroupId`), `playerEngineActions`, and `playerSessionStore` (sync cache + `refresh` after each
  wrapped mutation). Reuses the single `playerEngine` singleton — no second instance.
- **`group-engine-context.tsx`:** `GroupEngineProvider`, `useGroupEngineActions`, `useGroupEngineState`
  (composition-layer `activeGroupId` only).
- **`player-engine-context.tsx`:** `PlayerEngineProvider`, `usePlayerEngineActions`,
  `usePlayerSession(sessionId)` via `useSyncExternalStore` + `playerSessionStore`; reads from port-backed
  cache, no adapter imports.
- **`app-providers.tsx`:** nests `SessionEngineProvider` → `GroupEngineProvider` → `PlayerEngineProvider`.
- **`App.tsx`:** minimal swap to `<AppProviders>` wrapper only.
- **Tests:** `group-engine-context.test.tsx`, `player-engine-context.test.tsx`, extended
  `composition-root.test.ts` for shared port wiring.
- **`depcruise`:** 0 violations (`344 modules, 606 dependencies cruised`).
