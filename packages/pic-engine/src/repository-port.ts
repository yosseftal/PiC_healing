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

/** Input to `promoteGuestToAccount`: the full Guest state to move to the newly authenticated account. */
export interface PromoteGuestToAccountInput {
  /**
   * Client-generated idempotency key (the Guest Group's client-side UUID, reused as the eventual
   * `symptom_groups.id` - spec §E). Calling `promoteGuestToAccount` twice with the same key and payload
   * must be a no-op the second time.
   */
  idempotencyKey: string;
  group: SymptomGroup;
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

  incrementUseCount(libraryRowId: string): Promise<LibraryRow>;

  appendTimelineEvent(event: Omit<TimelineEvent, "id" | "created_at">): Promise<TimelineEvent>;

  /**
   * Promotes a Guest Group in place to a newly authenticated account (DEC-017, spec §E).
   *
   * Atomic-or-nothing: implemented as a single transaction, idempotent under retry via a client-supplied
   * idempotency key, with no partial writes ever observable by the caller.
   */
  promoteGuestToAccount(input: PromoteGuestToAccountInput): Promise<PromoteGuestToAccountResult>;
}
