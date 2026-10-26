import type { FinalizedSymptomGroup, LibraryRow, LibraryRowProvenance, PlayerSession, TimelineEvent } from "../../src/types";
import { membershipState, membershipRevisionFingerprint, prepareMembershipRevision, MembershipRevisionIdentityMismatchError,
  InvalidMembershipRevisionError } from "../../src/membership-revision";
import type { MembershipRevisionInput } from "../../src/repository-port";
import {
  GroupRevisionConflictError, normalizeGroupRevision, prepareGroupSave, prepareSymptomReorder,
} from "../../src/group-revision";
import {
  PromoteGuestToAccountIdentityMismatchError,
  DEFAULT_GUEST_SESSION_GATE_STATE,
  type GuestSessionGateState,
  type PromoteGuestToAccountInput,
  type PromoteGuestToAccountResult,
  type RepositoryPort,
  type SymptomGroup,
  type Treatment,
  type TreatmentListItem,
} from "../../src/repository-port";

/** Mirror the versioned wire fields so read normalization cannot upgrade a legacy frozen receipt. */
function promotionPayload(input: PromoteGuestToAccountInput): string {
  const group = input.group;
  const membershipVersioned = input.promotionPayloadVersion === 3;
  const ordered = input.promotionPayloadVersion === 2 || membershipVersioned;
  return JSON.stringify({
    newUserId: input.newUserId,
    group: group === null ? null : {
      id: group.id, name: group.name, created_at: group.created_at,
      joint_treatment_muscle_test: group.joint_treatment_muscle_test,
      joint_treatment_test_at: group.joint_treatment_test_at,
      ...(ordered ? { revision: group.revision } : {}),
      ...(membershipVersioned ? { membership_revision: membershipState(group).membershipRevision,
        joint_treatment_membership_revision: membershipState(group).answerMembershipRevision } : {}),
      symptoms: group.symptoms.map((s, index) => ({ id: s.id, name: s.name, polarity: s.polarity, intensity: s.intensity,
        ...(s.rated_at === null ? {} : { rated_at: s.rated_at }), ...(ordered ? { priority_position: index } : {}) })),
    },
    playerSession: input.playerSession,
    ...(input.promotionPayloadVersion === undefined ? {} : { promotionPayloadVersion: input.promotionPayloadVersion }),
  });
}

function detached<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

/**
 * In-memory `RepositoryPort` test double (spec's "Primary seam, primary test target"; ticket 03). Every
 * engine ticket (05-09) writes its unit tests against this class; it is exercised here only through the
 * shared contract suite (`../contract/repository-port.contract.ts`).
 *
 * Ordinary rating validation belongs to GroupEngine. Aggregate concurrency and atomic membership
 * commands repeat their storage invariants here, matching both concrete adapters at the public seam.
 */
export class FakeRepositoryPort implements RepositoryPort {
  private readonly membershipReceipts = new Map<string, { groupId: string; fingerprint: string }>();
  async commitMembershipRevision(input: MembershipRevisionInput): Promise<FinalizedSymptomGroup> {
    const current = this.groupsById.get(input.groupId);
    if (!current) throw new Error(`Missing group ${input.groupId}`);
    const fingerprint = membershipRevisionFingerprint(input);
    const receipt = this.membershipReceipts.get(input.operationId);
    if (receipt) {
      if (receipt.groupId !== input.groupId || receipt.fingerprint !== fingerprint) {
        throw new MembershipRevisionIdentityMismatchError();
      }
      return detached(current) as FinalizedSymptomGroup;
    }
    const next = prepareMembershipRevision(current, input);
    if (input.additions.some((row) => [...this.groupsById.values()].some((g) => g.symptoms.some((s) => s.id === row.id)))) {
      throw new MembershipRevisionIdentityMismatchError();
    }
    this.groupsById.set(input.groupId, next);
    this.membershipReceipts.set(input.operationId, { groupId: input.groupId, fingerprint });
    return detached(next);
  }
  private readonly groupsById = new Map<string, SymptomGroup>();
  private readonly playerSessionsById = new Map<string, PlayerSession>();
  private readonly libraryRowsById = new Map<string, LibraryRow>();
  private readonly libraryRowIdByTreatmentId = new Map<string, string>();
  private readonly usedIncrementIdempotencyKeysByRowId = new Map<string, Set<string>>();
  private readonly promotionRecordsByIdempotencyKey = new Map<
    string,
    { input: PromoteGuestToAccountInput; result: PromoteGuestToAccountResult }
  >();

  private guestSessionGate: GuestSessionGateState = { ...DEFAULT_GUEST_SESSION_GATE_STATE };

  private treatmentCatalog: TreatmentListItem[] = [];

  private treatmentsById = new Map<string, Treatment>();

  private nextGeneratedIdSuffix = 0;

  private generateId(prefix: string): string {
    this.nextGeneratedIdSuffix += 1;
    return `${prefix}-${this.nextGeneratedIdSuffix}`;
  }

  async getGroup(groupId: string): Promise<SymptomGroup | null> {
    const group = this.groupsById.get(groupId);
    return group ? normalizeGroupRevision(group) : null;
  }

  async saveGroup(group: SymptomGroup): Promise<void> {
    this.groupsById.set(group.id, prepareGroupSave(this.groupsById.get(group.id) ?? null, group));
  }

  async reorderSymptoms(groupId: string, orderedIDs: readonly string[], expectedRevision: number): Promise<SymptomGroup> {
    const current = this.groupsById.get(groupId);
    if (!current) throw new Error(`Missing group ${groupId}`);
    const next = prepareSymptomReorder(current, orderedIDs, expectedRevision);
    this.groupsById.set(groupId, next);
    return normalizeGroupRevision(next);
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
    const membershipVersioned = input.promotionPayloadVersion === 3;
    const ordered = input.promotionPayloadVersion === 2 || membershipVersioned;
    if (input.promotionPayloadVersion !== undefined && !ordered) {
      throw new Error("Unsupported promotion payload version");
    }
    if (ordered && input.group !== null &&
        (!Number.isSafeInteger(input.group.revision) || input.group.revision! < 0)) {
      throw new GroupRevisionConflictError(input.group.id);
    }
    if (membershipVersioned && input.group !== null &&
      (membershipState(input.group).answerMembershipRevision === null || input.group.joint_treatment_test_at === null)) {
      throw new InvalidMembershipRevisionError("V3 promotion requires the actual answer and its timestamp.");
    }
    const existingRecord = this.promotionRecordsByIdempotencyKey.get(input.idempotencyKey);
    if (existingRecord !== undefined) {
      if (promotionPayload(existingRecord.input) !== promotionPayload(input)) {
        throw new PromoteGuestToAccountIdentityMismatchError(input.idempotencyKey);
      }
      const result = existingRecord.result;
      return detached({ ...result,
        group: result.group === null ? null : await this.getGroup(result.group.id),
        playerSession: await this.getPlayerSession(result.playerSession.id),
        libraryRow: this.libraryRowsById.get(result.libraryRow.id),
      }) as PromoteGuestToAccountResult;
    }

    if (input.group !== null) {
      const promoted = membershipVersioned ? input.group : { ...input.group,
        membership_revision: undefined, joint_treatment_membership_revision: undefined };
      this.groupsById.set(input.group.id, normalizeGroupRevision(promoted));
    }
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
      group: input.group === null ? null : await this.getGroup(input.group.id) as FinalizedSymptomGroup,
      playerSession: input.playerSession,
      libraryRow,
      timelineEvent,
    };

    this.promotionRecordsByIdempotencyKey.set(input.idempotencyKey, { input: detached(input), result: detached(result) });
    return detached(result);
  }

  async getGuestSessionGate(): Promise<GuestSessionGateState> {
    return { ...this.guestSessionGate };
  }

  async saveGuestSessionGate(state: GuestSessionGateState): Promise<void> {
    this.guestSessionGate = { ...state };
  }

  /** Test helper: seed the flat treatment catalog returned by `listTreatments`. */
  seedTreatments(treatments: TreatmentListItem[]): void {
    this.treatmentCatalog = [...treatments];
  }

  /** Test helper: seed full treatment rows returned by `getTreatment`. */
  seedFullTreatments(treatments: Treatment[]): void {
    for (const treatment of treatments) {
      this.treatmentsById.set(treatment.id, treatment);
    }
  }

  async getTreatment(treatmentId: string): Promise<Treatment | null> {
    return this.treatmentsById.get(treatmentId) ?? null;
  }

  async listTreatments(): Promise<TreatmentListItem[]> {
    return [...this.treatmentCatalog];
  }
}
