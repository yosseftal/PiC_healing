import type {
  GuestSessionGateState,
  PromoteGuestToAccountInput,
  PromoteGuestToAccountResult,
  RepositoryPort,
  SymptomGroup,
} from "./repository-port";
import type { LibraryRow, LibraryRowProvenance, PlayerSession, TimelineEvent } from "./types";

/**
 * A `RepositoryPort` wrapper that forwards every call to a swappable inner provider (Wave 7.5 adapter
 * rebind). All engines are constructed against one `DelegatingRepositoryPort` instance; after promotion
 * succeeds, `swapProvider` retargets every engine to the authenticated adapter without reconstruction.
 */
export class DelegatingRepositoryPort implements RepositoryPort {
  constructor(private provider: RepositoryPort) {}

  swapProvider(provider: RepositoryPort): void {
    this.provider = provider;
  }

  getProvider(): RepositoryPort {
    return this.provider;
  }

  getGroup(groupId: string): Promise<SymptomGroup | null> {
    return this.provider.getGroup(groupId);
  }

  saveGroup(group: SymptomGroup): Promise<void> {
    return this.provider.saveGroup(group);
  }

  getPlayerSession(sessionId: string): Promise<PlayerSession | null> {
    return this.provider.getPlayerSession(sessionId);
  }

  savePlayerSession(session: PlayerSession): Promise<void> {
    return this.provider.savePlayerSession(session);
  }

  getOrCreateLibraryRow(treatmentId: string, provenance: LibraryRowProvenance): Promise<LibraryRow> {
    return this.provider.getOrCreateLibraryRow(treatmentId, provenance);
  }

  incrementUseCount(libraryRowId: string, idempotencyKey: string): Promise<LibraryRow> {
    return this.provider.incrementUseCount(libraryRowId, idempotencyKey);
  }

  appendTimelineEvent(event: Omit<TimelineEvent, "id" | "created_at">): Promise<TimelineEvent> {
    return this.provider.appendTimelineEvent(event);
  }

  promoteGuestToAccount(input: PromoteGuestToAccountInput): Promise<PromoteGuestToAccountResult> {
    return this.provider.promoteGuestToAccount(input);
  }

  getGuestSessionGate(): Promise<GuestSessionGateState> {
    return this.provider.getGuestSessionGate();
  }

  saveGuestSessionGate(state: GuestSessionGateState): Promise<void> {
    return this.provider.saveGuestSessionGate(state);
  }

  listTreatments() {
    return this.provider.listTreatments();
  }
}
