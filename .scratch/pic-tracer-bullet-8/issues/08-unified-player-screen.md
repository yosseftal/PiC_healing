# 08-08 — `UnifiedPlayerScreen`

**What to build:** dumb-reflection Player screen — unit display, Navigation Tree stub, Finish → Persistence
Gate.

**Blocked by:** 08-03, 08-07 (done).

**Status:** done

**Brief:** `.scratch/pic-tracer-bullet-8/briefs/08-unified-player-screen-brief.md`

**Source:** `.scratch/pic-tracer-bullet/issues/19-unified-player-screen.md` (orig. Ticket 19).

## Definition of Done

- Renders current atomic unit from `PlayerEngine` state.
- Finish / Finish Anyway call `sessionEngine.onFinishRequested` (not raw `PlayerEngine.finish`).
- Terminal NEMAR stub unit before Finish (DEC-015 §7b).

## Do Not Touch

- `RatingControl` in player subtree.
- Full Navigation Tree polish beyond tracer stub.

## Resolution

- **Prefactor:** `TRACER_BULLET_SEED_TREATMENTS` ids aligned to remote `public.treatments` (`user_id IS NULL`) —
  Settling `2c6e77bd-61db-4898-8612-84e976587ff7`, Grounding `c818490b-10ed-46c2-9890-1f35d34f4e25`,
  Loosening `92be9fb3-7092-4a78-9fa2-4aee9ba34bc6`. Skippable remote parity test in
  `tracer-bullet-seed-treatments.remote.test.ts`.
- **Player subtree:** `UnifiedPlayerScreen`, `AtomicUnitView`, `NavigationTreePanel`, `TerminalNemarUnit`,
  `FinishBar`; `findActiveUnit` compensates for guest `in_view` normalization on read.
- **Finish gate:** `[Finish]` / `[Finish Anyway]` call `sessionEngineActions.onFinishRequested` only.
- **Wiring:** `guest-flow-screens.tsx` `player` branch → `UnifiedPlayerScreen`; session id from
  `useGuestFlowFacts().activePlayerSessionId`.
- **Tests:** 6 smoke tests in `unified-player-screen.test.tsx` (+ 1 remote parity). `depcruise` 0 violations
  (`pic-web`, `pic-engine`).
