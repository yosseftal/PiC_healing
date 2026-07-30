# 08 — `PlayerEngine` (flat 4-state machine, Navigation Tree, Terminal NEMAR, Finish sovereignty)

**What to build:** the Unified Player's complete state machine: unit state transitions, Navigation Tree
forward/backward logic, mandatory Terminal NEMAR, and sovereign `finish()` / `finishAnyway()`. Has no
import of, call into, or awareness of `GroupEngine`.

**Blocked by:** 02 (`RepositoryPort` + domain types), 03 (fake port + contract suite), 04 (module-isolation
guardrail), 05 (`LibraryEngine`), 06 (`TimelineEngine`) — `PlayerEngine` calls both of the latter as its
exactly-once side effects.

**Status:** ready-for-agent

**Note on size:** the spec itself flags this as "the largest ticket, may want its own split by
state-machine section." If a single session cannot complete all transitions plus Terminal NEMAR plus
Finish sovereignty, split along those three seams (transitions / Terminal NEMAR / Finish) into follow-up
tickets rather than shipping a partial state machine.

## Objective

`PlayerEngine`'s public surface ends at `success_declared` and the Library/Timeline side effects. It never
triggers, reads, or writes a rating, and it never calls `GroupEngine`. This is the mirror image of ticket
07's isolation guarantee, and ticket 04's dependency-cruiser rule is the automated backstop for both.

## Context Injection (copied verbatim from the spec §D — this is the single source of truth)

> **States (flat enum):** `unseen`, `in_view` (ephemeral, never persisted), `skipped`, `completed`.
>
> **Transitions:** `unseen → in_view` on render; `in_view → completed` on navigate-forward;
> `unseen → skipped` on Navigation-Tree forward jump (applies to every intermediate unit between current
> and target); `skipped → in_view → completed` on revisit-then-advance ("upgrade," no duplicate side
> effects).
>
> **Navigation Tree is the only manual jump mechanism** — `PlayerEngine` exposes exactly one navigation
> entry point (`jumpTo(unitId)`) plus an implicit `advance()` triggered by rendering the next unit in
> sequence; there is no `skip()` API and no component may implement one.
>
> **Terminal NEMAR** is a regular Atomic Unit (last in sequence, always injected by `PlayerEngine` even if
> the seed content forgets it) whose only special behavior is: `response === 'yes'` unlocks `finish()`,
> `response === 'no'` sets `integrating_reason = 'terminal_nemar_no'` but does not block `finishAnyway()`.
>
> **Sovereign success declaration — the literal database expression of DEC-015 §4:** `finish()` and
> `finishAnyway()` are the **only** two calls that set `success_declared = true`. Critically,
> `finishAnyway()` sets `success_declared = true` **unconditionally** — regardless of
> `terminal_nemar_response` (including `'no'`) and regardless of any unit's `skipped` / `unseen` state.
> There is no code path where a negative Terminal NEMAR result, or an incomplete unit, can leave
> `success_declared` false after `finishAnyway()` was called... `finish()` and `finishAnyway()` write
> identically; they differ only in which UI button reached them, never in what they persist.
>
> **The Player ends here.** Neither `finish()` nor `finishAnyway()` triggers, queues, or references any
> rating action. `GroupEngine` is never called from `PlayerEngine`.
>
> **Exactly-once side effects:** `PlayerEngine` calls `LibraryEngine.recordUse(treatmentId)` and
> `TimelineEngine.recordExecution(...)` exactly once per `finish()`/`finishAnyway()` call, never on
> revisiting an already-`success_declared` session (DEC-006 §5).

Also carry the two "non-obvious past-state cases" the Testing Decisions section calls out explicitly:
revisiting a `completed` unit doesn't revert it, and jumping backward to a `skipped` unit then advancing
upgrades it to `completed` without a duplicate `use_count` increment.

## Definition of Done

- `PlayerEngine.startSession(treatmentId: string, linkedGroupId: string | null): Promise<string>` (returns
  `sessionId`); a Terminal NEMAR unit is always appended to the unit sequence at construction time, even if
  the seed content's Structured Markdown omits it.
- `PlayerEngine.advance(sessionId: string): Promise<void>` — implicit "render the next unit" transition:
  marks the just-left unit `completed` (if it was `in_view`) and the newly-rendered unit `in_view`.
- `PlayerEngine.jumpTo(sessionId: string, unitId: string): Promise<void>` — the **only** manual navigation
  entry point. A forward jump marks every intermediate `unseen` unit `skipped`. A backward jump to a
  `completed` unit leaves it `completed` (pure revisiting). A backward jump to a `skipped` unit renders it
  `in_view` again, and a subsequent `advance()` upgrades it to `completed` with no duplicate side effect.
- **No `skip()` method exists anywhere on `PlayerEngine`'s public API.**
- `PlayerEngine.respondTerminalNemar(sessionId: string, response: 'yes' | 'no'): Promise<void>` — `'yes'`
  unlocks `finish()`; `'no'` sets `integrating_reason = 'terminal_nemar_no'` and does not block
  `finishAnyway()`.
- `PlayerEngine.finish(sessionId: string): Promise<void>` — only callable when `terminal_nemar_response ===
  'yes'`; sets `success_declared = true`.
- `PlayerEngine.finishAnyway(sessionId: string): Promise<void>` — callable **unconditionally**, regardless
  of `terminal_nemar_response` or any unit's state; sets `success_declared = true` **unconditionally**.
- Both `finish()` and `finishAnyway()` call `LibraryEngine.recordUse(treatmentId, userId)` and
  `TimelineEngine.recordExecution(...)` exactly once, and never again if called a second time on an
  already-`success_declared` session (idempotent no-op on repeat).
- Exiting mid-session while a unit is `in_view` persists it as `unseen` or `skipped` as appropriate — never
  silently `completed`.
- `PlayerEngine`'s module lives under `packages/pic-engine/src/player-engine/` (the directory ticket 04
  already reserved) and has zero import of anything under `group-engine/` — verified by ticket 04's
  dependency-cruiser check passing.
- Constructed against `RepositoryPort`, `LibraryEngine`, and `TimelineEngine` — never `GroupEngine`.

## Do Not Touch / Out of Scope

- Zero import of `GroupEngine`, `Symptom`, `Polarity`, or `Intensity` types anywhere in this module.
- No `skip()` method, no manual "Done"/"Back" button API — visibility (render) and `jumpTo` are the only
  triggers, per DEC-015.
- No rating field or method anywhere on `PlayerSession` or `PlayerEngine`'s public API.
- Do not implement `SessionEngine`'s Persistence Gate trigger detection (ticket 09) — `PlayerEngine` simply
  exposes `finish()`/`finishAnyway()`; deciding "we're still on `local-guest`, intercept and trigger the
  gate" is `SessionEngine`'s composition-level job, not something built into `PlayerEngine` itself.
- Do not implement Reflection Prompt units or the `unit_rationale` "info" affordance — explicitly Out of
  Scope for this spike.
- Do not implement Structured Markdown parsing in this ticket if a seed-content parser doesn't already
  exist — accept pre-parsed unit arrays as input to `startSession` and treat markdown-to-units parsing as a
  concern owned wherever treatment content is loaded (adapter or a small shared utility), not inside the
  state machine itself. Flag this boundary explicitly if it becomes ambiguous while implementing.

## Testing Requirement — Test-First Acceptance Criteria

Every transition below gets its own test before implementation (Testing Decisions: "every transition
listed in §D above gets its own test before implementation"):

- [ ] `it('a unit transitions from unseen to in_view when rendered')`
- [ ] `it('a unit transitions from in_view to completed when advancing to the next unit')`
- [ ] `it('jumpTo a future unit marks every intermediate unseen unit as skipped')`
- [ ] `it('jumping backward to a completed unit and re-advancing leaves it completed — revisiting never
      reverts state')`
- [ ] `it('jumping backward to a skipped unit, then advancing forward again, upgrades it to completed with
      no duplicate side effect')`
- [ ] `it('exiting while a unit is in_view leaves it persisted as unseen or skipped, never completed')`
- [ ] `it('Terminal NEMAR is always present as the final unit even if the seed content omits it')`
- [ ] `it('Terminal NEMAR response "yes" unlocks finish()')`
- [ ] `it('Terminal NEMAR response "no" sets integrating_reason to "terminal_nemar_no" and does not block
      finishAnyway()')`
- [ ] `it('finish() sets success_declared to true')`
- [ ] `it('finishAnyway() called with terminal_nemar_response "no" and one unit still unseen still sets
      success_declared to true')` — the literal Sovereign Success Declaration test from the spec.
- [ ] `it('finish() and finishAnyway() both call LibraryEngine.recordUse and TimelineEngine.recordExecution
      exactly once')`
- [ ] `it('calling finish()/finishAnyway() again on an already-success_declared session does not call
      recordUse/recordExecution a second time')`
- [ ] `it('PlayerEngine never calls any GroupEngine method')` — a runtime smoke assertion in addition to
      ticket 04's static-analysis backstop (construct with a `RepositoryPort` spy and assert no
      rating-shaped call ever occurs).

## Acceptance Criteria

- [ ] All transitions and the two non-obvious past-state cases pass as independent tests.
- [ ] The Sovereign Success Declaration test passes exactly as specified above.
- [ ] `npm run depcruise` (ticket 04) remains green after this ticket lands.
- [ ] No rating-shaped call or type is reachable from `PlayerEngine`'s public API or internals.
