# 21 — Clear Stale Session Pointers on Completion / Discard / Promotion

**Wave:** 9.2 (P0 Audit Remediation: Terminal Completion & Rehydration Synchronization)

**Blocked by:** none (Wave 9 already merged; `composition-root.ts`, `guest-flow-facts.ts`,
`SessionEngine` all exist and are stable).

**Status:** done

**Source (verbatim from Event Manager remediation request):**

> **Context:** The audit returned `Verdict: REFACTOR` due to stale session pointers on completion/promotion
> and lack of visual transition on Terminal NEMAR response submission.
>
> 1. **Clear Stale Session Pointers on Completion / Discard / Promotion:**
>    * Update `composition-root.ts` and `guest-flow-facts.ts` so that completing, promoting, or discarding a
>      session explicitly resets `activePlayerSessionId` to `null`.
>    * Ensure the `playerSessionStore` refreshes immediately after authenticated `SessionEngine.finish`.
>
> 3. **Strict /tdd & Regression Tests:**
>    * Write failing tests in `unified-player-screen.test.tsx` proving that promotion, finish, and discard
>      cleanly navigate the EM away from the player screen and clear `activePlayerSessionId`.
>    * Verify all 279+ tests pass and `npm run depcruise --workspaces` returns 0 violations.

## Objective

Today, three composition-root actions leave the EM stranded on `UnifiedPlayerScreen` with a stale
`activePlayerSessionId` pointer once the player session is no longer meaningfully active:

1. **Authenticated Finish.** `SessionEngine.onFinishRequested` calls `this.playerEngine.finish(sessionId)`
   directly (`session-engine/index.ts:140` `runFinish`) when `mode === "authenticated"` — bypassing
   `composition-root.ts`'s `playerEngineActions.finish` wrapper entirely, so `playerSessionStore` is never
   refreshed and `activePlayerSessionId` is never cleared. `FinishBar` hides itself
   (`session.success_declared`) but `UnifiedPlayerScreen` keeps rendering the (now contentless) player
   subtree forever — the EM cannot navigate away without a full reload.
2. **Promotion.** `sessionEngineActions.promote` (`composition-root.ts:135-137`) awaits
   `sessionEngine.promote(...)` (which may internally replay a pending Finish via the same direct
   `runFinish` path) but never resets `activePlayerSessionId`, even though the guest player session no
   longer exists under the pre-promotion identity once storage is cleared and the provider is swapped.
3. **Discard.** `sessionEngineActions.discardGuestState` (`composition-root.ts:139-142`) clears all guest
   storage via `guestRepository.clear()` but never resets `activePlayerSessionId` — the EM is left on a
   player screen reflecting a session that literally no longer exists in the repository
   (`usePlayerSession` will resolve `null`, and `UnifiedPlayerScreen` renders nothing, forever, with no way
   forward).

Boot-time rehydration (`composition-root.ts:267-288`, "clears a persisted pointer to an already-finished
player session at boot") already handles the **reload** case. This ticket closes the **same-tab, no-reload**
gap for the three explicit EM actions named in the remediation request.

## Locked contract (do not widen scope)

- `deriveGuestFlowScreen` (`guest-flow-facts.ts:43-49`) already returns to `"pick-treatment"` /
  `"create-group"` etc. as soon as `activePlayerSessionId` is `null` — **no router change needed**, only the
  pointer needs clearing.
- `setGuestFlowPlayerSession(sessionId: string | null)` (`guest-flow-facts.ts:160-164`) is the existing,
  correct primitive for this — it notifies both `guestFlowFactsStore` and `guestFlowStore` and persists.
  Reuse it; do not invent a second pointer-clearing mechanism.
- Do **not** touch `activeGroupId` / `symptomAdditionComplete` / `groupFinalized` / `summaryAcknowledged` in
  this ticket. The remediation request names `activePlayerSessionId` only. (Flag any residual staleness you
  notice in these other facts on discard as a Should-Fix in your Resolution — do not fix it here.)
- Do **not** change `SessionEngine` (`packages/pic-engine/src/session-engine/index.ts`) in this ticket. The
  fix belongs in the composition-root wrapper layer (`pic-web`), which is exactly where every other
  post-mutation refresh already lives (see `playerEngineActions.advance` / `.jumpTo` /
  `.respondTerminalNemar` for the existing "await engine call, then refresh the store" pattern to match).

## Required changes

1. **`sessionEngineActions.onFinishRequested`** (`composition-root.ts`): after
   `await sessionEngine.onFinishRequested(sessionId, kind)`, refresh `playerSessionStore` for that
   `sessionId` and, if the refreshed session has `success_declared === true`, clear the pointer via
   `setGuestFlowPlayerSession(null)` (dynamic-import `guest-flow-facts`, matching the existing convention at
   `composition-root.ts:150,165,175`). This must **not** fire for the guest-mode gate-triggered path (no
   actual finish happened yet — the session must remain visible behind the Persistence Gate modal).
2. **`sessionEngineActions.promote`** (`composition-root.ts`): after `await sessionEngine.promote(...)`
   resolves, if `sessionEngineStore.getSnapshot().promotionStatus === "succeeded"`, clear the pointer via
   `setGuestFlowPlayerSession(null)` unconditionally (regardless of whether a Finish was pending). Do not
   clear it on a failed promotion (EM must stay on the player/gate to retry).
3. **`sessionEngineActions.discardGuestState`** (`composition-root.ts`): after the existing
   `guestRepository.clear()`, clear the pointer via `setGuestFlowPlayerSession(null)`.

## Acceptance Criteria

- [ ] AC1: `composition-root.test.ts` — authenticated Finish (mode flipped via a real `promote()` call, no
      pending Finish, then a fresh `startSession` + `onFinishRequested(..., "finish")` against the
      authenticated port) results in `playerSessionStore.getSnapshot(sessionId).success_declared === true`
      **and** `guestFlowFactsStore.getSnapshot().activePlayerSessionId === null`, when that session was the
      active pointer.
- [ ] AC2: `composition-root.test.ts` — extend the existing promotion test (or add a new one) to assert
      `guestFlowFactsStore.getSnapshot().activePlayerSessionId` is `null` after a successful `promote()`,
      given it was set to the promoted session's id beforehand.
- [ ] AC3: `composition-root.test.ts` — extend the existing `discardGuestState` test (or add a new one) to
      assert `guestFlowFactsStore.getSnapshot().activePlayerSessionId` is `null` after discard, given it was
      set beforehand.
- [ ] AC4: A guest-mode gate-triggered `onFinishRequested("finish")` (no promotion, no discard) does **not**
      clear `activePlayerSessionId` — the pending-gate case must stay on the player screen. Add/keep this as
      an explicit regression assertion (guards against an overly broad fix).
- [ ] AC5: `unified-player-screen.test.tsx` — a rendered `UnifiedPlayerScreen` unmounts its player subtree
      (`screen.queryByTestId("guest-flow-player")` becomes `null`) after `discardGuestState()` is called on
      an active gated session.
- [ ] AC6: `unified-player-screen.test.tsx` — a rendered `UnifiedPlayerScreen` unmounts its player subtree
      after a promotion (gate-triggered Finish replayed by `promote()`) succeeds.
- [ ] AC7: All pre-existing tests in `composition-root.test.ts`, `guest-flow-facts.test.ts`,
      `guest-flow-router.test.tsx`, `unified-player-screen.test.tsx`, `persistence-gate-modal.test.tsx`,
      `promote-path.test.ts` still pass unmodified in intent (behavioral, not just green).
- [ ] AC8: `npm run test` (root) shows the same or greater passing-test count than the pre-change baseline
      (243 passing, excluding the 3 pre-existing network-dependent Supabase suites and their skips) and
      `npx depcruise --validate .dependency-cruiser.cjs src` (run from `packages/pic-web`) reports 0
      violations.

## Do Not Touch

- `packages/pic-engine/**` (no engine changes; this is a `pic-web` composition-root wiring fix).
- `TerminalNemarUnit.tsx`, `FinishBar.tsx` (owned by ticket 22).
- Any Supabase/remote-integration test (`supabase-repository.test.ts`,
  `symptoms-rated-at-schema.test.ts`, the remote block in `promote-path.test.ts`) — those fail in this
  sandbox for network reasons unrelated to this ticket; do not attempt to fix or unskip them.

## Resolution

**Implementation:** `composition-root.ts`'s `sessionEngineActions` now clears the guest-flow player-session
pointer (`setGuestFlowPlayerSession(null)`, dynamic-imported from `./guest-flow-facts` per the existing
convention) on all three completion paths, and `onFinishRequested` always refreshes `playerSessionStore`
after the underlying `SessionEngine` call so the authenticated bypass path (`SessionEngine.runFinish` ->
`playerEngine.finish` directly) is observed too. One implementation wrinkle surfaced during TDD: clearing
the pointer persists guest flow facts via a binding (`persistGuestFlowFacts` in `initGuestFlowFacts`) that
writes straight through the raw `guestRepository`, bypassing the delegating port's post-promotion swap —
calling it *after* `guestRepository.clear()` would resurrect the just-erased local storage blob. Both
`promote` and `discardGuestState` therefore call `guestRepository.clear()` **last**, after the pointer clear,
to preserve the pre-existing "no guest data left behind" invariant those actions already guaranteed.

- **AC1** — Authenticated Finish clears the pointer + refreshes `playerSessionStore`.
  - Test: `"AC1: authenticated Finish clears activePlayerSessionId and refreshes playerSessionStore"`
    (`packages/pic-web/src/composition-root.test.ts:262-291`).
  - Fix: `packages/pic-web/src/composition-root.ts:133-139` — `onFinishRequested` refreshes
    `playerSessionStore` unconditionally, then clears the pointer once `success_declared === true`.
- **AC2** — `promote()` clears the pointer on success, and leaves it alone on failure.
  - Tests: `"AC2: promote() clears activePlayerSessionId on a successful promotion"`
    (`composition-root.test.ts:293-317`) and `"AC2 (failed promotion): promote() does NOT clear
    activePlayerSessionId when the RPC rejects"` (`composition-root.test.ts:319-340`).
  - Fix: `composition-root.ts:141-151` — `promote` clears the pointer only when
    `promotionStatus === "succeeded"`, then re-clears guest storage (see wrinkle below).
- **AC3** — `discardGuestState()` clears the pointer.
  - Test: `"AC3: discardGuestState() clears activePlayerSessionId"` (`composition-root.test.ts:342-353`).
  - Fix: `composition-root.ts:153-160` — `discardGuestState` clears the pointer, then clears guest
    storage last.
- **AC4** — Guest-mode gate-triggered Finish does **not** clear the pointer (negative case).
  - Test: `"AC4: guest-mode gate-triggered Finish does NOT clear activePlayerSessionId (negative case)"`
    (`composition-root.test.ts:355-374`).
  - Passes without extra guarding: the `success_declared === true` check in AC1's fix
    (`composition-root.ts:135-138`) naturally excludes the gate-only path, since no `PlayerEngine.finish`
    call happens in guest mode.
- **AC5** — `UnifiedPlayerScreen` unmounts its player subtree after `discardGuestState()` on an active
  gated session.
  - Test: `"unmounts the player subtree after discardGuestState() clears an active gated session (AC5)"`
    (`packages/pic-web/src/unified-player-screen.test.tsx:595-628`).
  - Verified red against the pre-ticket `composition-root.ts` (`guest-flow-player` never disappeared)
    before the AC3 fix landed.
- **AC6** — `UnifiedPlayerScreen` unmounts its player subtree after a promotion that replays the gated
  Finish.
  - Test: `"unmounts the player subtree after a promotion replays the gated Finish (AC6)"`
    (`unified-player-screen.test.tsx:632-674`).
  - Uses `createFakeAuthenticatedPort` (`unified-player-screen.test.tsx:30-133`) so `SessionEngine
    .promote`'s replayed `runFinish` completes against a real in-memory port after the delegating port
    swap. Verified red against the pre-ticket `composition-root.ts` before the AC2 fix landed.
- **AC7** — All pre-existing tests in the five listed files still pass, unmodified in intent.
  - `composition-root.test.ts` 9/9 passed, `guest-flow-facts.test.ts` 3/3 passed, `guest-flow-router
    .test.tsx` 8/8 passed, `unified-player-screen.test.tsx` 16/16 passed, `persistence-gate-modal
    .test.tsx` 6/6 passed, `promote-path.test.ts` 7 passed / 1 skipped (network) — all via
    `npx vitest run <file>` from `packages/pic-web`.
- **AC8** — Root `npm run test` count >= baseline (243), `depcruise` 0 violations.
  - Root `npm run test` (`vitest run`): **250 passed**, 52 skipped (the 3 known pre-existing
    network-dependent suites: `supabase-repository.test.ts`, `symptoms-rated-at-schema.test.ts`,
    `promote-path.test.ts`'s remote block). 243 baseline + 7 new tests (AC1, AC2 success, AC2 failure,
    AC3, AC4, AC5, AC6) = 250, an exact match.
  - `npx depcruise --validate .dependency-cruiser.cjs src` from `packages/pic-web`:
    `✔ no dependency violations found (630 modules, 1178 dependencies cruised)`.

**Should-Fix (deliberately deferred, out of this ticket's scope per "Locked contract"):**

- `activeGroupId` is never reset on `discardGuestState()` (or on a successful `promote()`), even though the
  Guest Group it points to has just been erased from storage / migrated to the authenticated account. This
  didn't surface as a test failure here because `deriveGuestFlowScreen` only branches on
  `activePlayerSessionId` for the `"player"` screen and `activeGroupId` is otherwise only consulted once a
  new draft group is created — but a stale `activeGroupId` is the same class of "stranded pointer" bug this
  ticket fixes for `activePlayerSessionId`, just for the Symptom Group flow instead of the Player flow. The
  ticket's own "Locked contract" section explicitly named this out of scope ("Do not touch `activeGroupId` /
  `symptomAdditionComplete` / `groupFinalized` / `summaryAcknowledged` in this ticket"), so it is flagged
  here rather than fixed.
- The direct `guestRepository.saveGuestFlowFacts` binding in `initGuestFlowFacts`'s `persistGuestFlowFacts`
  callback bypasses the delegating port entirely (it never goes through `repositoryPort`, so it is blind to
  `swapProvider`). This is what caused the storage-resurrection wrinkle described above under
  **Implementation**; ordering `guestRepository.clear()` last works around it for this ticket's three call
  sites, but the underlying architectural mismatch (a guest-storage-specific persistence callback that
  outlives the guest session) remains and could resurface if a future call site clears the pointer without
  also being the one to call `guestRepository.clear()` afterward.
