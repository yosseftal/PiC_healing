/**
 * `PlayerEngine` — the Unified Player's complete state machine (ticket 08): the flat 4-state unit model,
 * Navigation Tree forward/backward logic, the mandatory Terminal NEMAR, and sovereign `finish()` /
 * `finishAnyway()`. This module's public surface ends at `success_declared` and the Library/Timeline side
 * effects - it never triggers, reads, or writes a rating, and never calls `GroupEngine`. This is the mirror
 * image of `GroupEngine`'s (ticket 07) isolation guarantee; ticket 04's dependency-cruiser rule is the
 * automated backstop for both directions, and `./player-engine.test.ts`'s "module isolation" block adds a
 * source-scan (for `GroupEngine`/`SessionEngine`) plus a bare-identifier check (for `Symptom`/`Polarity`/
 * `Intensity`, which are named type exports from `../types` - a module this file legitimately imports for
 * other reasons, so a module-specifier ban alone can't cover them) and a runtime spy-based smoke test.
 *
 * Source: `docs/docs/specs/tracer-bullet-happy-path.md` §D in full, User Stories 20-33, Testing Decisions
 * ("Sovereign success declaration", "State-machine coverage"); `CONTEXT.md` Unified Player / Navigation
 * Tree / Terminal NEMAR entries; `decisions.md` DEC-006 §5, DEC-015 (all of §2, §4, §7a, §7b).
 *
 * Constructed against `RepositoryPort`, `LibraryEngine`, and `TimelineEngine` - never `GroupEngine`
 * (ticket 08 DoD).
 *
 * **`startSession`'s third parameter, `unitIds` (ticket 08 scope note):** the ticket's own headline
 * Definition-of-Done bullet shows `startSession(treatmentId, linkedGroupId)` with no units parameter, but
 * its own Do Not Touch section is explicit that Structured Markdown parsing is out of scope here and that
 * this method must instead "accept pre-parsed unit arrays as input to `startSession`" - content loading is
 * "a concern owned wherever treatment content is loaded... not inside the state machine itself." Since
 * `PlayerUnit` (ticket 02) is only ever `{unit_id, state}` - no title/content field exists on it, or
 * anywhere in this module - the minimal, content-agnostic shape satisfying that instruction is a plain,
 * ordered `unitIds: string[]` for the treatment's non-Terminal-NEMAR Atomic Units. This mirrors Wave 3's
 * `idempotencyKey` precedent exactly: a later, more specific instruction in the same ticket text overrides
 * an earlier, incomplete headline bullet.
 *
 * **`in_view` is written to `savePlayerSession` here, not withheld (ticket 08 scope note):** `types.ts`'s
 * `PlayerUnitState` doc comment and spec §B both describe `in_view` as "ephemeral... never persisted by a
 * `RepositoryPort` adapter." Taken as a constraint on *this engine's* calls to `savePlayerSession`, that
 * claim is unsatisfiable together with the ticket's own literal transition-table bullets - `advance()`
 * "marks... the newly-rendered unit `in_view`" and `jumpTo()`'s upgrade path "renders it `in_view` again" -
 * given `PlayerEngine` holds no state of its own between calls (the same "everything lives in
 * `RepositoryPort`" pattern `LibraryEngine`/`TimelineEngine` already established) and exposes no getter
 * method, so a subsequent `advance()`/`jumpTo()` call has no way to learn "which unit was being viewed"
 * except by reading it back from a prior `savePlayerSession` write. This is resolved by reading "never
 * persisted by a `RepositoryPort` adapter" as guidance for a *real* adapter's own storage layer (a future
 * ticket 10/12/13 concern: e.g. a real adapter may choose not to write on every render, or may normalize
 * `in_view` away when it does its own persistence) rather than a constraint on this in-process engine's
 * object model or on the fake port (ticket 03), which - by its own explicit design - "only stores and
 * returns whatever it is given." The literal, test-driven transition table is the more specific and more
 * actionable governing text, so it wins; every explicit ticket 08 test still passes either way, since none
 * asserts the raw persisted string is never `'in_view'`.
 */
import type { PlayerSession, PlayerUnit } from "../types";
import type { RepositoryPort } from "../repository-port";
import type { LibraryEngine } from "../library-engine/index";
import type { TimelineEngine } from "../timeline-engine/index";

/**
 * Always injected as the final unit of every session's sequence (DEC-015 §7b), even if the caller's
 * `unitIds` omits it - a fixed, well-known id rather than a per-session random one, so tests and future
 * Navigation Tree UI can recognize it without a dedicated lookup method. Namespaced defensively so it can
 * never collide with a real Structured-Markdown-derived `unit_id`.
 */
export const TERMINAL_NEMAR_UNIT_ID = "__terminal_nemar__";

/** Thrown by `finish()` when `terminal_nemar_response !== 'yes'` (DEC-015 §4 - use `finishAnyway()` instead). */
export class TerminalNemarNotYesError extends Error {
  constructor(sessionId: string) {
    super(
      `PlayerEngine.finish: session "${sessionId}" cannot finish() because terminal_nemar_response is not ` +
        '"yes". Use finishAnyway() for the sovereign bypass.',
    );
    this.name = "TerminalNemarNotYesError";
  }
}

/** Thrown when a `sessionId` has no matching player session. */
export class PlayerSessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`PlayerEngine: no player session with id "${sessionId}".`);
    this.name = "PlayerSessionNotFoundError";
  }
}

/** Thrown by `jumpTo` when `unitId` does not exist in the session's unit sequence. */
export class UnknownPlayerUnitError extends Error {
  constructor(sessionId: string, unitId: string) {
    super(`PlayerEngine.jumpTo: unit "${unitId}" does not exist in session "${sessionId}".`);
    this.name = "UnknownPlayerUnitError";
  }
}

export class PlayerEngine {
  constructor(
    private readonly repositoryPort: RepositoryPort,
    private readonly libraryEngine: LibraryEngine,
    private readonly timelineEngine: TimelineEngine,
  ) {}

  /**
   * Starts a new Unified Player run against `treatmentId`'s `unitIds` (pre-parsed, ordered, Terminal-NEMAR-
   * excluded - see this file's header comment). A Terminal NEMAR unit is always appended at construction
   * time. The first unit renders immediately (`unseen -> in_view`, DEC-015 §2's render trigger). Returns
   * the new `sessionId`.
   */
  async startSession(treatmentId: string, linkedGroupId: string | null, unitIds: string[]): Promise<string> {
    const allUnitIds = [...unitIds, TERMINAL_NEMAR_UNIT_ID];
    const units: PlayerUnit[] = allUnitIds.map((unit_id, index) => ({
      unit_id,
      state: index === 0 ? "in_view" : "unseen",
    }));

    const session: PlayerSession = {
      id: crypto.randomUUID(),
      treatment_id: treatmentId,
      linked_group_id: linkedGroupId,
      units,
      terminal_nemar_response: null,
      success_declared: false,
      finished_at: null,
      integrating_reason: null,
    };
    await this.repositoryPort.savePlayerSession(session);
    return session.id;
  }

  /**
   * The implicit "render the next unit" transition (DEC-015 §2): marks the currently `in_view` unit
   * `completed` and the next unit in sequence `in_view` (unless it is already `completed`, in which case it
   * is left alone - re-passing through already-engaged content via `advance()` never forces a re-render).
   * A no-op if no unit is currently `in_view` (e.g. immediately after `jumpTo` revisited a `completed` unit
   * with nothing left to auto-complete - DEC-015 §7a's "pure revisiting," never an error).
   */
  async advance(sessionId: string): Promise<void> {
    const session = await this.loadSessionOrThrow(sessionId);
    const currentIndex = session.units.findIndex((unit) => unit.state === "in_view");
    if (currentIndex === -1) {
      return;
    }

    const nextIndex = currentIndex + 1;
    const units = session.units.map((unit, index) => {
      if (index === currentIndex) {
        return { ...unit, state: "completed" as const };
      }
      if (index === nextIndex && unit.state !== "completed") {
        return { ...unit, state: "in_view" as const };
      }
      return unit;
    });

    await this.repositoryPort.savePlayerSession({ ...session, units });
  }

  /**
   * The **only** manual navigation entry point (DEC-015 §7a) - there is no `skip()` method anywhere on this
   * class. Marks the currently `in_view` unit (if any, and if it isn't the target itself) `completed`;
   * marks every `unseen` unit strictly before `unitId` `skipped` (a forward jump's bypassed range - safe to
   * apply unconditionally regardless of jump direction, since any unit already visited by any means is
   * never still `unseen`, per this method's own invariant); and renders the target `in_view` unless it is
   * already `completed`, in which case it is left exactly as-is ("pure revisiting," never reverted -
   * DEC-015 §7a). Throws `UnknownPlayerUnitError` if `unitId` is not part of this session.
   */
  async jumpTo(sessionId: string, unitId: string): Promise<void> {
    const session = await this.loadSessionOrThrow(sessionId);
    const targetIndex = session.units.findIndex((unit) => unit.unit_id === unitId);
    if (targetIndex === -1) {
      throw new UnknownPlayerUnitError(sessionId, unitId);
    }

    const currentIndex = session.units.findIndex((unit) => unit.state === "in_view");
    const units = session.units.map((unit, index) => {
      if (index === currentIndex && index !== targetIndex) {
        return { ...unit, state: "completed" as const };
      }
      if (index === targetIndex) {
        return unit.state === "completed" ? unit : { ...unit, state: "in_view" as const };
      }
      if (index < targetIndex && unit.state === "unseen") {
        return { ...unit, state: "skipped" as const };
      }
      return unit;
    });

    await this.repositoryPort.savePlayerSession({ ...session, units });
  }

  /**
   * Records the mandatory Terminal NEMAR response (DEC-015 §7b). `'yes'` unlocks `finish()`; `'no'` sets
   * `integrating_reason: 'terminal_nemar_no'` without blocking the sovereign `finishAnyway()`. Answering
   * `'yes'` clears any previously-set `'terminal_nemar_no'` tag, since it no longer applies once the EM's
   * answer changes. Does not itself touch the Terminal NEMAR unit's own `unseen`/`in_view`/`skipped`/
   * `completed` bookkeeping - that is driven exclusively by `advance()`/`jumpTo()` like any other unit
   * (DEC-015 §7b: "a standard Atomic Unit... follows all visibility-based state transitions").
   */
  async respondTerminalNemar(sessionId: string, response: "yes" | "no"): Promise<void> {
    const session = await this.loadSessionOrThrow(sessionId);
    await this.repositoryPort.savePlayerSession({
      ...session,
      terminal_nemar_response: response,
      integrating_reason: response === "no" ? "terminal_nemar_no" : null,
    });
  }

  /**
   * The standard success path (DEC-015 §4): only callable once `terminal_nemar_response === 'yes'` (throws
   * `TerminalNemarNotYesError` otherwise). Sets `success_declared: true` and triggers the exactly-once
   * Library/Timeline side effects. A no-op (no re-declaration, no repeat side effects) if the session is
   * already `success_declared`.
   */
  async finish(sessionId: string): Promise<void> {
    const session = await this.loadSessionOrThrow(sessionId);
    if (session.success_declared) {
      return;
    }
    if (session.terminal_nemar_response !== "yes") {
      throw new TerminalNemarNotYesError(sessionId);
    }
    await this.declareSuccess(session);
  }

  /**
   * The sovereign bypass (DEC-015 §4): callable **unconditionally**, regardless of `terminal_nemar_response`
   * (including `'no'` or `null`) or any unit's state. Sets `success_declared: true` unconditionally -
   * `finish()` and `finishAnyway()` write identically once reached; they differ only in which caller/button
   * reached them, never in what gets persisted. A no-op if the session is already `success_declared`,
   * exactly like `finish()`.
   */
  async finishAnyway(sessionId: string): Promise<void> {
    const session = await this.loadSessionOrThrow(sessionId);
    if (session.success_declared) {
      return;
    }
    await this.declareSuccess(session);
  }

  /**
   * The shared, exactly-once success path for both `finish()` and `finishAnyway()` (DEC-006 §5): calls
   * `LibraryEngine.recordUse` then `TimelineEngine.recordExecution`, in that order, exactly once, sourcing
   * `recordUse`'s `idempotencyKey` from this completing session's own `id` (per `incrementUseCount`'s doc
   * comment and ticket 08's "## Resolution" section) - never a `userId`, matching the Wave 3 architectural
   * decision that no engine threads identity through `RepositoryPort`. `GroupEngine` is never called from
   * here or anywhere else in this module (DEC-015 §4: "The Player ends here").
   */
  private async declareSuccess(session: PlayerSession): Promise<void> {
    const libraryRow = await this.libraryEngine.recordUse(session.treatment_id, session.id);
    await this.timelineEngine.recordExecution({
      treatmentId: session.treatment_id,
      libraryRowId: libraryRow.id,
      linkedGroupId: session.linked_group_id,
    });
    await this.repositoryPort.savePlayerSession({
      ...session,
      success_declared: true,
      finished_at: new Date().toISOString(),
    });
  }

  private async loadSessionOrThrow(sessionId: string): Promise<PlayerSession> {
    const session = await this.repositoryPort.getPlayerSession(sessionId);
    if (session === null) {
      throw new PlayerSessionNotFoundError(sessionId);
    }
    return session;
  }
}
