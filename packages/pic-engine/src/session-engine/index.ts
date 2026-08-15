/**
 * `SessionEngine` — Guest Mode bootstrap and Persistence Gate orchestration (ticket 09, Wave 5). This
 * module is the orchestration layer sitting in front of `PlayerEngine.finish()`/`finishAnyway()`, not a
 * re-implementation of promotion's atomicity: the single-transaction Postgres RPC lives in ticket 13, and
 * this engine calls `RepositoryPort.promoteGuestToAccount` as an already-atomic black box, deciding only
 * *when* to call it and what to do with the pending Finish request around that call.
 *
 * Source: `docs/docs/specs/tracer-bullet-happy-path.md` §E in full, User Stories 1-5, 34-39; `CONTEXT.md`
 * Guest Group / Persistence Gate entries; `decisions.md` DEC-017.
 *
 * Constructed against `RepositoryPort` and `PlayerEngine` only - never `GroupEngine` (this ticket's
 * `GuestSnapshot` carries an already-`FinalizedSymptomGroup` as inert data; `SessionEngine` never calls a
 * `GroupEngine` method, matching `PlayerEngine`'s own zero-knowledge-of-`GroupEngine` isolation on the
 * other side of the Player/Group boundary).
 *
 * **Single-adapter scope (ticket 09 note):** ticket 09's own Definition of Done requires "all six tests
 * pass against the fake `RepositoryPort` from ticket 03" - i.e. exactly one port instance for the engine's
 * entire lifecycle, not a guest port plus a separately-constructed authenticated one. The spec prose's
 * "completes the ... call against the new authenticated adapter/session" describes the *real* production
 * wiring goal (ticket 14/20: `pic-web` swaps its active `RepositoryPort` from `local-guest` to `supabase`
 * once promotion succeeds) - not a second constructor parameter this ticket must add. Within this engine's
 * own tested scope, "the new authenticated adapter" and "the adapter `promote()` was already constructed
 * against" are the same object; the mode/gate bookkeeping below is what actually distinguishes guest from
 * authenticated behavior, not which concrete `RepositoryPort` instance is in hand.
 *
 * **Known cross-ticket seam for whoever builds ticket 13's real RPC:** because `promote()` always finishes
 * by replaying the gated `finish()`/`finishAnyway()` call (below), and ticket 13's own RPC skeleton already
 * writes a Library row and a Timeline event as part of the same atomic promotion payload, a *real* RPC
 * implementation must apply the same idempotency discipline `incrementUseCount` already documents (keying
 * off this same `playerSession.id`) so the replayed `finish()` call's own `LibraryEngine.recordUse` never
 * double-increments `use_count` - this already works correctly against the ticket-03 fake and this file's
 * own tests never assert on Timeline event *count*, deliberately, since that count is ticket 13's contract
 * to honor, not this ticket's.
 */
import { normalizeInViewUnit } from "../normalize-in-view-unit";
import type { GuestSessionGateState, PromoteGuestToAccountResult, RepositoryPort } from "../repository-port";
import type { FinalizedSymptomGroup, PlayerSession } from "../types";
import type { PlayerEngine } from "../player-engine/index";

export type SessionMode = "guest" | "authenticated";
export type PromotionStatus = "idle" | "pending" | "failed" | "succeeded";

export interface SessionState {
  mode: SessionMode;
  gateTriggered: boolean;
  promotionStatus: PromotionStatus;
}

/**
 * The full Guest state `promote()` hands off to `RepositoryPort.promoteGuestToAccount` - deliberately just
 * the two entities that method's own `PromoteGuestToAccountInput` needs beyond `idempotencyKey` (derived
 * here from `group.id`, see `promote()`) and `newUserId` (supplied by the caller alongside `guestState`).
 */
export interface GuestSnapshot {
  group: FinalizedSymptomGroup;
  playerSession: PlayerSession;
}

type PendingFinishKind = "finish" | "finishAnyway";

interface PendingFinishRequest {
  sessionId: string;
  kind: PendingFinishKind;
}

export interface SessionEngineOptions {
  /**
   * Called after `promoteGuestToAccount` resolves successfully and *before* the replayed gated Finish
   * request runs - the composition root uses this to `swapProvider` on a `DelegatingRepositoryPort` so the
   * replay targets the authenticated adapter (Wave 7.5 adapter rebind).
   */
  onPromotionSucceeded?: () => void;
  /**
   * Gate flags rehydrated at boot from `LocalGuestRepository` (DEC-017 refresh resilience). Omitted in
   * unit tests that do not model page reload.
   */
  initialGateState?: GuestSessionGateState;
}

/**
 * Persistence Boundary Normalization (DEC-015): re-applies `normalizeInViewUnit` defensively at the
 * guest-to-account crossing point. `guestState.playerSession` is expected to already be normalized by
 * whatever `RepositoryPort` it was read from, but `promote()` does not trust an upstream caller it does
 * not control.
 */
function normalizeForPermanentStore(session: PlayerSession): PlayerSession {
  if (!session.units.some((unit) => unit.state === "in_view")) {
    return session;
  }
  return { ...session, units: session.units.map(normalizeInViewUnit) };
}

export class SessionEngine {
  private mode: SessionMode = "guest";
  private gateTriggered = false;
  private promotionStatus: PromotionStatus = "idle";
  private pendingFinishRequest: PendingFinishRequest | null = null;
  private readonly listeners = new Set<() => void>();
  private readonly onPromotionSucceeded?: () => void;

  constructor(
    private readonly repositoryPort: RepositoryPort,
    private readonly playerEngine: PlayerEngine,
    options: SessionEngineOptions = {},
  ) {
    this.onPromotionSucceeded = options.onPromotionSucceeded;
    if (options.initialGateState !== undefined) {
      this.applyGateState(options.initialGateState);
    }
  }

  /**
   * Subscribes to any `SessionEngine` state mutation. The composition root wires this to its
   * `useSyncExternalStore` adapter so dumb-reflection subscribers observe `promotionStatus: 'pending'`
   * immediately when `promote()` starts, not only after the RPC resolves.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  getState(): SessionState {
    return { mode: this.mode, gateTriggered: this.gateTriggered, promotionStatus: this.promotionStatus };
  }

  /**
   * The single entry point a caller uses instead of calling `PlayerEngine.finish()`/`finishAnyway()`
   * directly. Authenticated callers pass straight through with no gate; guest callers are gated - this
   * call returns without running any Player side effect, and the request is remembered so `promote()` can
   * complete it later.
   */
  async onFinishRequested(sessionId: string, kind: PendingFinishKind): Promise<void> {
    if (this.mode === "authenticated") {
      await this.runFinish(sessionId, kind);
      return;
    }
    this.gateTriggered = true;
    this.pendingFinishRequest = { sessionId, kind };
    await this.persistGateState();
    this.notify();
  }

  /**
   * Calls the already-atomic `RepositoryPort.promoteGuestToAccount` as a black box. No partial adapter
   * swap: `mode` only flips to `'authenticated'` after that call resolves successfully - a rejection (a
   * dropped connection, an RPC timeout - an expected, retryable condition, never a partial write per
   * DEC-017) leaves `mode` as `'guest'` and every field the EM's pending Finish depends on untouched, so a
   * subsequent `promote()` call with the identical `guestState` is always safe to retry.
   *
   * Deliberately never rethrows: `promotionStatus` (not an unhandled rejection) is the one signal a caller
   * observes, matching the "dumb reflection" property this whole architecture is built around - see
   * `.scratch/pic-tracer-bullet/issues/15-persistence-gate-modal.md`'s retry-button contract, which reads
   * `promotionStatus` rather than catching an exception.
   */
  async promote(guestState: GuestSnapshot, newUserId: string): Promise<void> {
    this.promotionStatus = "pending";
    this.notify();

    let promotionResult: PromoteGuestToAccountResult;
    try {
      promotionResult = await this.repositoryPort.promoteGuestToAccount({
        idempotencyKey: guestState.group.id,
        group: guestState.group,
        playerSession: normalizeForPermanentStore(guestState.playerSession),
        newUserId,
      });
    } catch {
      this.promotionStatus = "failed";
      this.notify();
      return;
    }

    this.onPromotionSucceeded?.();

    const pending = this.pendingFinishRequest;
    this.mode = "authenticated";
    this.promotionStatus = "succeeded";
    this.gateTriggered = false;
    this.pendingFinishRequest = null;
    await this.persistGateState();
    this.notify();

    if (pending !== null) {
      const finishAppliedByPromotion =
        promotionResult.timelineEvent.id === promotionResult.playerSession.id;
      if (finishAppliedByPromotion) {
        const session = await this.repositoryPort.getPlayerSession(pending.sessionId);
        if (session !== null && !session.success_declared) {
          await this.repositoryPort.savePlayerSession({
            ...session,
            success_declared: true,
            finished_at: new Date().toISOString(),
          });
        }
      } else {
        await this.runFinish(pending.sessionId, pending.kind);
      }
    }
  }

  /**
   * On decline/close: abandons the gate and any pending Finish request. Never touches `mode` (there is
   * nothing to "log out" of - the EM was never promoted) and never calls any network-facing
   * `RepositoryPort` method - only clears the locally persisted gate flags via `saveGuestSessionGate`,
   * matching spec §E's "nothing is written... no server contact ever happened" guarantee for this path.
   */
  async discardGuestState(): Promise<void> {
    this.gateTriggered = false;
    this.promotionStatus = "idle";
    this.pendingFinishRequest = null;
    await this.persistGateState();
    this.notify();
  }

  private applyGateState(state: GuestSessionGateState): void {
    this.gateTriggered = state.gateTriggered;
    this.pendingFinishRequest = state.pendingFinishRequest;
  }

  private async persistGateState(): Promise<void> {
    await this.repositoryPort.saveGuestSessionGate({
      gateTriggered: this.gateTriggered,
      pendingFinishRequest: this.pendingFinishRequest,
    });
  }

  private async runFinish(sessionId: string, kind: PendingFinishKind): Promise<void> {
    if (kind === "finish") {
      await this.playerEngine.finish(sessionId);
    } else {
      await this.playerEngine.finishAnyway(sessionId);
    }
  }
}
