# 15 — `PersistenceGateModal`

**What to build:** the dumb-reflection component that renders only when `SessionEngine` signals
gate-triggered, offers Social Auth / Magic Link, and shows a retry affordance on failure — never a
"partially saved" state.

**Blocked by:** 14 (`pic-web` app shell).

**Status:** ready-for-agent

**Source:** `docs/specs/tracer-bullet-happy-path.md` §F, User Stories 34–39, `CONTEXT.md` Persistence Gate
entry, `decisions.md` DEC-017 §3 (auth mechanism).

## Objective

> `PersistenceGateModal` (renders only when `SessionEngine` signals gate-triggered; shows a retry
> affordance on promotion failure, never a "partially saved" state)

> 34. As a Guest EM who presses [Finish] or [Finish Anyway], I want to be prompted to authenticate at
>     exactly that moment (not before)...
> 37. ...I want the system to guarantee I never end up with a half-saved account — either everything from
>     my Guest session lands, or nothing does — so that I can safely retry without fear of silent data
>     loss or duplication.

## Locked Engine Interface (Dumb Reflection Contract — this component may read/call only this shape)

```ts
sessionEngine.getState(): {
  mode: 'guest' | 'authenticated';
  gateTriggered: boolean;
  promotionStatus: 'idle' | 'pending' | 'failed' | 'succeeded';
}
sessionEngine.promote(newUserId: string): Promise<void>;
sessionEngine.discardGuestState(): void;
```

If ticket 09's actual shipped API differs from this sketch (field/method names), use ticket 09's real
public API verbatim — do not invent new `SessionEngine` surface from this UI ticket. Update this note to
match the real shape before writing the component if it has drifted.

## Definition of Done

- Renders nothing when `gateTriggered` is `false`.
- Renders auth options (Social Auth buttons + Magic Link input) when `gateTriggered` is `true` and
  `promotionStatus` is `idle`. Real OAuth/Magic Link provider wiring may be stubbed/mocked for this tracer
  bullet if a real provider isn't configured yet — label any stub clearly as a stub in code and in the PR
  description, never silently fake success.
- On `promotionStatus === 'failed'`, shows a retry button that re-calls `sessionEngine.promote(...)` —
  never renders any "partially saved" or "some data was lost" copy, per the manifesto's positive-language
  rule and DEC-015's "Integrating, never Failed" pattern applied here to promotion.
- Component holds **no local `useState`** for anything derivable from `sessionEngine.getState()` — every
  conditional render is a direct read of engine state.

## Do Not Touch / Out of Scope

- Do not call any `RepositoryPort` method directly from this component — only `sessionEngine.promote(...)`
  / `discardGuestState()`.
- Do not implement account deletion, biometric unlock, or the 30-day offline grace window UI — all Out of
  Scope for this spike.
- Do not implement a fully custom OAuth provider integration if it requires new backend infrastructure
  beyond Supabase Auth defaults — stub clearly and flag as a follow-up rather than blocking this ticket on
  it.

## Testing Requirement — Test-First Acceptance Criteria (thin smoke tests only)

- [ ] `it('renders nothing when gateTriggered is false')`
- [ ] `it('renders auth options when gateTriggered is true and promotionStatus is idle')`
- [ ] `it('renders a retry affordance, not a partial-save message, when promotionStatus is failed')`
- [ ] `it('calls sessionEngine.promote exactly once per button press, never automatically')`

## Acceptance Criteria

- [ ] All four smoke tests pass.
- [ ] Component contains zero business-rule assertions (e.g. nothing here computes `use_count` or reasons
      about `player_sessions` state directly).
- [ ] No `useState` mirrors engine-derivable state.
