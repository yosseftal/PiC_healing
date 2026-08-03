/**
 * `SessionEngine` — Guest Mode bootstrap and Persistence Gate orchestration (ticket 09, Wave 5). This
 * module is the orchestration layer sitting in front of `PlayerEngine.finish()`/`finishAnyway()`, not a
 * re-implementation of promotion's atomicity: the single-transaction Postgres RPC lives in ticket 13, and
 * this engine calls `RepositoryPort.promoteGuestToAccount` as an already-atomic black box, deciding only
 * *when* to call it and what to do with the pending Finish request around that call.
 */
import type { RepositoryPort } from "../repository-port";
import type { FinalizedSymptomGroup, PlayerSession, PlayerUnit } from "../types";
import type { PlayerEngine } from "../player-engine/index";

export type SessionMode = "guest" | "authenticated";
export type PromotionStatus = "idle" | "pending" | "failed" | "succeeded";

export interface SessionState {
  mode: SessionMode;
  gateTriggered: boolean;
  promotionStatus: PromotionStatus;
}

export interface GuestSnapshot {
  group: FinalizedSymptomGroup;
  playerSession: PlayerSession;
}

type PendingFinishKind = "finish" | "finishAnyway";

interface PendingFinishRequest {
  sessionId: string;
  kind: PendingFinishKind;
}

function normalizeForPermanentStore(session: PlayerSession): PlayerSession {
  if (!session.units.some((unit) => unit.state === "in_view")) {
    return session;
  }
  const units: PlayerUnit[] = session.units.map((unit) =>
    unit.state === "in_view" ? { ...unit, state: "unseen" } : unit,
  );
  return { ...session, units };
}

export class SessionEngine {
  private mode: SessionMode = "guest";
  private gateTriggered = false;
  private promotionStatus: PromotionStatus = "idle";
  private pendingFinishRequest: PendingFinishRequest | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly repositoryPort: RepositoryPort,
    private readonly playerEngine: PlayerEngine,
  ) {}

  /**
   * Subscribes to any `SessionEngine` state mutation so dumb-reflection subscribers observe
   * `promotionStatus: 'pending'` immediately when `promote()` starts, not only after the RPC resolves.
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

  async onFinishRequested(sessionId: string, kind: PendingFinishKind): Promise<void> {
    if (this.mode === "authenticated") {
      await this.runFinish(sessionId, kind);
      return;
    }
    this.gateTriggered = true;
    this.pendingFinishRequest = { sessionId, kind };
    this.notify();
  }

  async promote(guestState: GuestSnapshot, newUserId: string): Promise<void> {
    this.promotionStatus = "pending";
    this.notify();

    try {
      await this.repositoryPort.promoteGuestToAccount({
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

    const pending = this.pendingFinishRequest;
    this.mode = "authenticated";
    this.promotionStatus = "succeeded";
    this.gateTriggered = false;
    this.pendingFinishRequest = null;
    this.notify();

    if (pending !== null) {
      await this.runFinish(pending.sessionId, pending.kind);
    }
  }

  discardGuestState(): void {
    this.gateTriggered = false;
    this.promotionStatus = "idle";
    this.pendingFinishRequest = null;
    this.notify();
  }

  private async runFinish(sessionId: string, kind: PendingFinishKind): Promise<void> {
    if (kind === "finish") {
      await this.playerEngine.finish(sessionId);
    } else {
      await this.playerEngine.finishAnyway(sessionId);
    }
  }
}
