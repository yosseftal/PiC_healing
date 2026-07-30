# 14 — `pic-web` app shell (`GuestModeShell` + adapter selection)

**What to build:** the single composition root that boots `SessionEngine` against `pic-adapter-local-guest`
on app start, provides it to the component tree, and owns routing — with zero business logic anywhere in
this ticket.

**Blocked by:** 09 (`SessionEngine`), 10 (`pic-adapter-local-guest`).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md` §A ("`pic-web`... contains no business logic"), §F
(component hierarchy, top level).

## Objective

> `pic-web` — React app. Owns routing/screens and renders `pic-engine` state via `useSyncExternalStore` or
> equivalent; contains no business logic — every conditional a component renders is a read of engine
> state, never a re-derivation of it. Selects the adapter at startup (local-guest until promotion, then
> Supabase) and hands it to the engine layer; components never import an adapter directly.

## Locked Component Hierarchy (copied verbatim from spec §F, top level only)

```
App
├── GuestModeShell                     (mounts SessionEngine against local-guest adapter on boot)
│   └── PersistenceGateModal           (renders only when SessionEngine signals gate-triggered;
│                                        shows a retry affordance on promotion failure, never a
│                                        "partially saved" state)
```

## Definition of Done

- `pic-web` boots, constructs exactly one `LocalGuestRepository` instance (ticket 10) at startup, and
  constructs exactly one `SessionEngine` instance (ticket 09) wired to it — this composition happens once,
  never inside a re-rendered component.
- The `SessionEngine` instance (and, by extension, the currently-active `RepositoryPort` and the engine
  instances built on it) is exposed to the component tree via React context — no prop-drilling required,
  but no adapter import outside this one composition point.
- `GuestModeShell` component exists and renders its children plus a mount point for `PersistenceGateModal`
  (ticket 15 fills in the modal's actual contents).
- No screen components are built in this ticket — a placeholder route/page (e.g. a stub `<div>`) is
  acceptable; tickets 16–19 build the real screens.
- Document (in this ticket's own notes, even if not fully automated) the convention that no component
  other than this composition root imports `pic-adapter-local-guest` or `pic-adapter-supabase` directly.

## Do Not Touch / Out of Scope

- Do not build `SymptomGroupCreateScreen`, `TreatmentPickerScreen`, `UnifiedPlayerScreen`, or any
  business-logic-bearing screen — tickets 16–19.
- Do not implement the actual Supabase adapter construction/swap beyond a stubbed function signature (e.g.
  `swapToSupabaseAdapter(session)`) — full wiring to the promotion flow happens in ticket 15/20.
- Do not add any component-level `useState` for anything derivable from engine state — that violates the
  "dumb reflection" property this entire spec is built around.

## Testing Requirement — Test-First Acceptance Criteria (thin smoke tests only, per Testing Decisions)

- [ ] `it('renders GuestModeShell without throwing given a freshly-booted SessionEngine')`
- [ ] `it('constructs exactly one LocalGuestRepository instance at boot, never inside a re-rendered
      component')`

## Acceptance Criteria

- [ ] App boots against `local-guest` with zero network calls at startup.
- [ ] Exactly one `SessionEngine` and one `RepositoryPort` instance exist per app session.
- [ ] No screen component imports an adapter directly.
- [ ] No business-logic conditionals exist in this ticket's code.
