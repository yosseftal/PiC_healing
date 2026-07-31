import type {
  FinalizedSymptomGroup,
  LibraryRow,
  LibraryRowProvenance,
  PlayerSession,
  SymptomGroupDraft,
  TimelineEvent,
} from "./types";

/** Either lifecycle state of a Symptom Group, as persisted via `getGroup` / `saveGroup`. */
export type SymptomGroup = SymptomGroupDraft | FinalizedSymptomGroup;

/**
 * Thrown by `RepositoryPort.promoteGuestToAccount` when a call reuses an `idempotencyKey` that already
 * produced a promotion, but pairs it with a `newUserId`, `group`, or `playerSession` that does not match
 * what was recorded on the original call (Wave 2.5 hardening decision, amending the original ticket 03/13
 * design).
 *
 * This is a **hard rejection**, not the silent no-op a same-key-same-payload retry gets: silently
 * returning the first call's result here would let the second caller's client believe *its own* payload
 * was the thing durably persisted, when in fact different data - possibly belonging to a different account
 * - was what got kept. That silent-misattribution failure mode is at least as severe as the "vanishes or
 * gets double-counted" failure modes ticket 13 already calls out as the worst possible failure mode in
 * this product, so every `RepositoryPort` implementation (fake and real adapters alike) must reject
 * instead of ever returning - or writing - a result that doesn't match what this caller actually sent.
 *
 * Scope: **any** payload mismatch rejects, not only a mismatched `newUserId`. The original "same key and
 * payload" wording on `idempotencyKey` below already implied a mismatched `group`/`playerSession` was
 * outside the safe no-op guarantee, even under the *same* `newUserId` - so this closes that gap uniformly
 * instead of special-casing identity alone. A same-account retry that resubmits a divergent (e.g. stale)
 * group/session payload is the same class of silent-misattribution danger as a cross-account one; it is
 * just data misattribution instead of identity misattribution, and deserves the identical treatment.
 */
export class PromoteGuestToAccountIdentityMismatchError extends Error {
  constructor(idempotencyKey: string) {
    super(
      `promoteGuestToAccount: idempotencyKey "${idempotencyKey}" was already used with a different ` +
        "newUserId, group, or playerSession payload. Refusing to silently reuse the original promotion's " +
        "result or write a second, divergent one under the same key - retries must resubmit the exact " +
        "same payload as the original call.",
    );
    this.name = "PromoteGuestToAccountIdentityMismatchError";
  }
}

/** Input to `promoteGuestToAccount`: the full Guest state to move to the newly authenticated account. */
export interface PromoteGuestToAccountInput {
  /**
   * Client-generated idempotency key (the Guest Group's client-side UUID, reused as the eventual
   * `symptom_groups.id` - spec §E). Calling `promoteGuestToAccount` twice with the same key and payload
   * must be a no-op the second time.
   *
   * Calling it twice with the same key but a **different** payload (a different `newUserId`, `group`, or
   * `playerSession`) must instead **reject** with `PromoteGuestToAccountIdentityMismatchError` (or an
   * equivalent error) - never silently return the first call's result, and never write a second, divergent
   * result under the same key. See that error class's doc comment for the full rationale and scope
   * decision (any payload field, not just `newUserId`).
   *
   * Forward note for the real Supabase adapter (ticket 13, not yet built): the RPC must implement this via
   * an explicit comparison of the incoming payload against whatever was already recorded for that
   * idempotency key *before* deciding to no-op or write (e.g. checking the incoming `p_new_user_id`, and
   * the rest of the payload, against the existing `symptom_groups` row for that id) - relying solely on
   * `on conflict do nothing` per table would silently succeed-as-first-writer instead, which is exactly the
   * behavior being corrected here.
   */
  idempotencyKey: string;
  /**
   * Promotion only ever fires on an already-finalized group: ticket 13's RPC skeleton inserts
   * `joint_treatment_muscle_test` directly into a Postgres `not null` column, so a Guest Group can only
   * reach `promoteGuestToAccount` once `GroupEngine.finalizeGroup` has already accepted it.
   */
  group: FinalizedSymptomGroup;
  playerSession: PlayerSession;
  /**
   * The newly authenticated account's identity, per spec §E:
   * `SessionEngine.promote(guestState, newUserId)` calls `RepositoryPort.promoteGuestToAccount(...)`.
   * Required because this is the one `RepositoryPort` method that crosses from no-identity (Guest) to a
   * real identity - there is no ambient `auth.uid()` session on the Guest side for an adapter to rely on,
   * unlike the port's other seven methods.
   */
  newUserId: string;
}

/** The five entities `promoteGuestToAccount` lands atomically, now owned by the new account. */
export interface PromoteGuestToAccountResult {
  group: FinalizedSymptomGroup;
  playerSession: PlayerSession;
  libraryRow: LibraryRow;
  timelineEvent: TimelineEvent;
}

/**
 * The one interface every `pic-engine` module depends on for persistence (spec §A "Modules"). No engine
 * may import a concrete adapter (`pic-adapter-local-guest`, `pic-adapter-supabase`) directly - every
 * engine speaks only to this port.
 */
export interface RepositoryPort {
  getGroup(groupId: string): Promise<SymptomGroup | null>;

  saveGroup(group: SymptomGroup): Promise<void>;

  getPlayerSession(sessionId: string): Promise<PlayerSession | null>;

  savePlayerSession(session: PlayerSession): Promise<void>;

  getOrCreateLibraryRow(treatmentId: string, provenance: LibraryRowProvenance): Promise<LibraryRow>;

  /**
   * Increments a `LibraryRow`'s `use_count` by exactly one (DEC-006). Spec's Testing Decisions require
   * this call to be "idempotent under retry": `idempotencyKey` should naturally be sourced from the
   * completing `PlayerSession.id` - the same session retrying its own Finish call must never double-count
   * `use_count`, while a different session later finishing the same treatment must still increment.
   */
  incrementUseCount(libraryRowId: string, idempotencyKey: string): Promise<LibraryRow>;

  appendTimelineEvent(event: Omit<TimelineEvent, "id" | "created_at">): Promise<TimelineEvent>;

  /**
   * Promotes a Guest Group in place to a newly authenticated account (DEC-017, spec §E).
   *
   * Atomic-or-nothing: implemented as a single transaction, idempotent under retry via a client-supplied
   * idempotency key, with no partial writes ever observable by the caller.
   *
   * Rejects with `PromoteGuestToAccountIdentityMismatchError` (or an equivalent error) if `idempotencyKey`
   * was already used with a different `newUserId`, `group`, or `playerSession` - see `idempotencyKey`'s own
   * doc comment above, and `PromoteGuestToAccountIdentityMismatchError`'s doc comment, for the full
   * rationale and scope decision.
   */
  promoteGuestToAccount(input: PromoteGuestToAccountInput): Promise<PromoteGuestToAccountResult>;
}
