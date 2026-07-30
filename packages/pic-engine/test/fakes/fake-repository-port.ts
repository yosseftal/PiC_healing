import type { LibraryRow, LibraryRowProvenance, PlayerSession, TimelineEvent } from "../../src/types";
import type {
  PromoteGuestToAccountInput,
  PromoteGuestToAccountResult,
  RepositoryPort,
  SymptomGroup,
} from "../../src/repository-port";

/**
 * In-memory `RepositoryPort` test double (spec's "Primary seam, primary test target"; ticket 03). Every
 * engine ticket (05-09) writes its unit tests against this class; it is exercised here only through the
 * shared contract suite (`../contract/repository-port.contract.ts`).
 *
 * Deliberately does NOT validate any business rule (e.g. an out-of-range `intensity`, or a group whose
 * `joint_treatment_muscle_test` is unset) - it only stores and returns whatever it is given. That
 * validation belongs to `GroupEngine` (ticket 07), never to a `RepositoryPort` implementation.
 */
export class FakeRepositoryPort implements RepositoryPort {
  private readonly groupsById = new Map<string, SymptomGroup>();
  private readonly playerSessionsById = new Map<string, PlayerSession>();
  private readonly libraryRowsById = new Map<string, LibraryRow>();
  private readonly libraryRowIdByTreatmentId = new Map<string, string>();
  private readonly usedIncrementIdempotencyKeysByRowId = new Map<string, Set<string>>();
  private readonly promotionResultsByIdempotencyKey = new Map<string, PromoteGuestToAccountResult>();

  private nextGeneratedIdSuffix = 0;

  private generateId(prefix: string): string {
    this.nextGeneratedIdSuffix += 1;
    return `${prefix}-${this.nextGeneratedIdSuffix}`;
  }

  async getGroup(groupId: string): Promise<SymptomGroup | null> {
    return this.groupsById.get(groupId) ?? null;
  }

  async saveGroup(group: SymptomGroup): Promise<void> {
    this.groupsById.set(group.id, group);
  }

  async getPlayerSession(sessionId: string): Promise<PlayerSession | null> {
    return this.playerSessionsById.get(sessionId) ?? null;
  }

  async savePlayerSession(session: PlayerSession): Promise<void> {
    this.playerSessionsById.set(session.id, session);
  }

  async getOrCreateLibraryRow(treatmentId: string, provenance: LibraryRowProvenance): Promise<LibraryRow> {
    const existingRowId = this.libraryRowIdByTreatmentId.get(treatmentId);
    const existingRow = existingRowId === undefined ? undefined : this.libraryRowsById.get(existingRowId);
    if (existingRow !== undefined) {
      return existingRow;
    }

    const newRow: LibraryRow = {
      id: this.generateId("library-row"),
      treatment_id: treatmentId,
      use_count: 0,
      provenance,
      variant_type: "original",
      global_reference_id: treatmentId,
      protocol_content: null,
      created_at: new Date().toISOString(),
    };
    this.libraryRowsById.set(newRow.id, newRow);
    this.libraryRowIdByTreatmentId.set(treatmentId, newRow.id);
    return newRow;
  }

  async incrementUseCount(libraryRowId: string, idempotencyKey: string): Promise<LibraryRow> {
    const row = this.libraryRowsById.get(libraryRowId);
    if (row === undefined) {
      throw new Error(`FakeRepositoryPort.incrementUseCount: no library row with id "${libraryRowId}"`);
    }

    let usedKeys = this.usedIncrementIdempotencyKeysByRowId.get(libraryRowId);
    if (usedKeys === undefined) {
      usedKeys = new Set<string>();
      this.usedIncrementIdempotencyKeysByRowId.set(libraryRowId, usedKeys);
    }

    if (!usedKeys.has(idempotencyKey)) {
      usedKeys.add(idempotencyKey);
      row.use_count += 1;
    }

    return row;
  }

  async appendTimelineEvent(event: Omit<TimelineEvent, "id" | "created_at">): Promise<TimelineEvent> {
    const fullEvent: TimelineEvent = {
      ...event,
      id: this.generateId("timeline-event"),
      created_at: new Date().toISOString(),
    };
    return fullEvent;
  }

  async promoteGuestToAccount(input: PromoteGuestToAccountInput): Promise<PromoteGuestToAccountResult> {
    const existingResult = this.promotionResultsByIdempotencyKey.get(input.idempotencyKey);
    if (existingResult !== undefined) {
      return existingResult;
    }

    await this.saveGroup(input.group);
    await this.savePlayerSession(input.playerSession);

    const libraryRow = await this.getOrCreateLibraryRow(input.playerSession.treatment_id, {
      source: "guest_promotion",
      first_seen_at: new Date().toISOString(),
    });

    const timelineEvent = await this.appendTimelineEvent({
      log_type: "treatment_execution",
      treatment_id: input.playerSession.treatment_id,
      library_row_id: libraryRow.id,
      linked_group_id: input.playerSession.linked_group_id,
      metadata: null,
    });

    const result: PromoteGuestToAccountResult = {
      group: input.group,
      playerSession: input.playerSession,
      libraryRow,
      timelineEvent,
    };

    this.promotionResultsByIdempotencyKey.set(input.idempotencyKey, result);
    return result;
  }
}
