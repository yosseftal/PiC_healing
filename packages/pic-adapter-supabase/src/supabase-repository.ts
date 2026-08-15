/**
 * `pic-adapter-supabase` - the real Postgres/Auth-backed `RepositoryPort` implementation (ticket 12),
 * always scoped by `auth.uid()` via Row Level Security (RLS) rather than any client-side filter this
 * adapter adds itself. See `SupabaseRepository`'s own doc comment for the full design.
 *
 * **Identity injection.** `RepositoryPort`'s seven non-promotion methods take no `userId` parameter -
 * per `pic-engine/src/types.ts`'s header comment, "ownership / RLS scoping is an adapter concern, never a
 * shape the engines reason about." This adapter's constructor is therefore where identity enters: it
 * takes an already-authenticated `SupabaseClient` and reads the current Event Manager's id lazily, via
 * `client.auth.getUser()`, only when building an insert payload that must satisfy an RLS `with check` on
 * `user_id` (`getOrCreateLibraryRow`, `savePlayerSession`, `saveGroup`). Every read relies solely on RLS
 * to scope results - this file never adds a manual `.eq("user_id", ...)` filter as a substitute for the
 * database policy (ticket 11's migration is the single enforcement point).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FinalizedSymptomGroup,
  GuestSessionGateState,
  LibraryRow,
  LibraryRowProvenance,
  PlayerSession,
  PlayerUnit,
  PromoteGuestToAccountInput,
  PromoteGuestToAccountResult,
  RepositoryPort,
  Symptom,
  SymptomGroup,
  SymptomGroupDraft,
  TimelineEvent,
  TreatmentListItem,
} from "pic-engine";
import { DEFAULT_GUEST_SESSION_GATE_STATE, normalizeInViewUnit, PromoteGuestToAccountIdentityMismatchError } from "pic-engine";

/** Thrown when an operation needs the current Event Manager's identity but no session is present. */
export class SupabaseRepositoryNotAuthenticatedError extends Error {
  constructor() {
    super(
      "SupabaseRepository: no authenticated session on the given SupabaseClient (client.auth.getUser() " +
        "returned no user). This adapter always requires an already-authenticated client - construct it " +
        "only after a real sign-in, never for Guest Mode (use pic-adapter-local-guest there instead).",
    );
    this.name = "SupabaseRepositoryNotAuthenticatedError";
  }
}

/** Thrown by `incrementUseCount` when `libraryRowId` does not resolve to a row visible to this session. */
export class SupabaseLibraryRowNotFoundError extends Error {
  constructor(libraryRowId: string) {
    super(
      `SupabaseRepository.incrementUseCount: no personal_treatment_library row with id "${libraryRowId}" ` +
        "is visible to the current session (either it does not exist, or RLS is correctly hiding a row " +
        "that belongs to a different Event Manager).",
    );
    this.name = "SupabaseLibraryRowNotFoundError";
  }
}

/** Wraps a PostgREST/Supabase error with the failing operation's name, preserving the original as `cause`. */
function wrapError(operation: string, error: { message: string; code?: string }): Error {
  return new Error(`SupabaseRepository.${operation}: ${error.message}`, { cause: error });
}

/**
 * Row shape of `public.symptom_groups` (`supabase/migrations/20260730194911_tracer_bullet_schema.sql`).
 * `joint_treatment_muscle_test` is `not null` at the column level (backfilled by that migration), so a
 * `SymptomGroupDraft` whose test is still unanswered (`null`) cannot currently be persisted here - see
 * `saveGroup`'s doc comment for this known, escalated schema gap.
 */
interface SymptomGroupRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  joint_treatment_muscle_test: string;
  joint_treatment_test_at: string;
}

/** Row shape of `public.symptoms` (includes `rated_at` from ticket 01 / Wave 6.5). */
interface SymptomRow {
  id: string;
  group_id: string;
  user_id: string;
  name: string;
  polarity: string;
  intensity: number;
  rated_at: string | null;
}

interface PlayerSessionRow {
  id: string;
  user_id: string;
  treatment_id: string;
  linked_group_id: string | null;
  units: PlayerUnit[];
  terminal_nemar_response: "yes" | "no" | null;
  success_declared: boolean;
  integrating_reason: string | null;
  finished_at: string | null;
}

interface PersonalTreatmentLibraryRow {
  id: string;
  user_id: string;
  treatment_id: string;
  use_count: number;
  provenance: LibraryRowProvenance | null;
  used_increment_idempotency_keys: string[];
  promoted_session_ids?: string[];
  variant_type: "original";
  global_reference_id: string | null;
  protocol_content: string | null;
  created_at: string;
}

interface TimelineEventRow {
  id: string;
  user_id: string;
  log_type: string;
  treatment_id: string | null;
  library_row_id: string | null;
  linked_group_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Postgres's `timestamptz` columns round-trip through PostgREST as e.g. `"2026-08-13T11:32:10.31+00:00"`
 * - valid ISO 8601, but not byte-identical to the `Timestamp` strings this codebase writes via
 * `new Date().toISOString()` (e.g. `"2026-08-13T11:32:10.310Z"`, always millisecond-padded and
 * `Z`-suffixed). Re-parsing and re-formatting every timestamp column on read is what makes `toEqual`
 * round-trip checks against a caller-constructed object pass - without this, a value that is genuinely the
 * same instant would fail strict equality on string shape alone.
 */
function toTimestamp(value: string): string {
  return new Date(value).toISOString();
}

function toNullableTimestamp(value: string | null): string | null {
  return value === null ? null : toTimestamp(value);
}

function rowToSymptomGroup(row: SymptomGroupRow, symptoms: Symptom[]): SymptomGroup {
  const draftOrFinalized: SymptomGroupDraft | FinalizedSymptomGroup = {
    id: row.id,
    name: row.name,
    symptoms,
    created_at: toTimestamp(row.created_at),
    joint_treatment_muscle_test: row.joint_treatment_muscle_test as FinalizedSymptomGroup["joint_treatment_muscle_test"],
    joint_treatment_test_at: toTimestamp(row.joint_treatment_test_at),
  };
  return draftOrFinalized;
}

function rowToSymptom(row: SymptomRow): Symptom {
  return {
    id: row.id,
    name: row.name,
    polarity: row.polarity as Symptom["polarity"],
    intensity: row.intensity,
    rated_at: toNullableTimestamp(row.rated_at),
  };
}

function symptomToRow(symptom: Symptom, groupId: string, userId: string): SymptomRow {
  return {
    id: symptom.id,
    group_id: groupId,
    user_id: userId,
    name: symptom.name,
    polarity: symptom.polarity,
    intensity: symptom.intensity,
    rated_at: symptom.rated_at,
  };
}

function rowToPlayerSession(row: PlayerSessionRow): PlayerSession {
  return {
    id: row.id,
    treatment_id: row.treatment_id,
    linked_group_id: row.linked_group_id,
    units: row.units.map(normalizeInViewUnit),
    terminal_nemar_response: row.terminal_nemar_response,
    success_declared: row.success_declared,
    finished_at: toNullableTimestamp(row.finished_at),
    integrating_reason: row.integrating_reason as PlayerSession["integrating_reason"],
  };
}

/** Legacy rows may still carry ticket-12's `_usedIncrementIdempotencyKeys` in provenance jsonb — never expose it. */
function stripInternalProvenanceFields(
  provenance: LibraryRowProvenance | Record<string, unknown> | null,
): LibraryRowProvenance | null {
  if (provenance === null) {
    return null;
  }
  const source = provenance.source;
  const firstSeenAt = provenance.first_seen_at;
  if (typeof source !== "string" || typeof firstSeenAt !== "string") {
    return null;
  }
  return { source, first_seen_at: firstSeenAt };
}

function rowToLibraryRow(row: PersonalTreatmentLibraryRow): LibraryRow {
  return {
    id: row.id,
    treatment_id: row.treatment_id,
    use_count: row.use_count,
    provenance: stripInternalProvenanceFields(row.provenance),
    variant_type: row.variant_type,
    global_reference_id: row.global_reference_id,
    protocol_content: row.protocol_content,
    created_at: toTimestamp(row.created_at),
  };
}

function rowToTimelineEvent(row: TimelineEventRow): TimelineEvent {
  return {
    id: row.id,
    log_type: row.log_type,
    treatment_id: row.treatment_id,
    library_row_id: row.library_row_id,
    linked_group_id: row.linked_group_id,
    metadata: row.metadata,
    created_at: toTimestamp(row.created_at),
  };
}

/**
 * The Supabase Postgres/Auth-backed `RepositoryPort` implementation (ticket 12). Every method below reads
 * or writes through a `SupabaseClient` whose queries are scoped entirely by RLS (`auth.uid() = user_id`,
 * ticket 11's migration) - none of them adds a `.eq("user_id", ...)` filter of its own, per this ticket's
 * "RLS is the enforcement layer, not a backup" requirement. The one place `user_id` is supplied at all is
 * on inserts that must satisfy the policy's `with check` clause, via `currentUserId()` below.
 *
 * `promoteGuestToAccount` (ticket 13) is the one exception to "RLS is the enforcement layer": it calls
 * the `promote_guest_to_account` Postgres RPC (`security definer`, one implicit transaction - see that
 * migration's own header comment for the full atomicity/idempotency design), which necessarily bypasses
 * RLS for its own internal inserts. See that method's own doc comment for why this is still safe.
 */
export class SupabaseRepository implements RepositoryPort {
  constructor(private readonly client: SupabaseClient) {}

  private async currentUserId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) {
      throw new SupabaseRepositoryNotAuthenticatedError();
    }
    return data.user.id;
  }

  async getGroup(groupId: string): Promise<SymptomGroup | null> {
    const { data: groupRow, error: groupError } = await this.client
      .from("symptom_groups")
      .select("*")
      .eq("id", groupId)
      .maybeSingle();
    if (groupError) {
      throw wrapError("getGroup", groupError);
    }
    if (!groupRow) {
      return null;
    }

    const { data: symptomRows, error: symptomsError } = await this.client
      .from("symptoms")
      .select("*")
      .eq("group_id", groupId);
    if (symptomsError) {
      throw wrapError("getGroup", symptomsError);
    }

    return rowToSymptomGroup(groupRow as SymptomGroupRow, (symptomRows ?? []).map((row) => rowToSymptom(row as SymptomRow)));
  }

  /**
   * Full-replace semantics, matching `pic-adapter-local-guest`'s `saveGroup` and the domain type's own
   * "complete list" contract for `symptoms`: every symptom in `group.symptoms` is upserted, and any
   * previously-stored symptom row for this group that is no longer present in that list is deleted - the
   * same "no orphaned data left behind on a full re-save" guarantee, applied to a real relational table
   * instead of one JSON blob.
   *
   * **Known schema gap (see `SymptomGroupRow`'s doc comment):** `joint_treatment_muscle_test` is `not
   * null` in the live schema, so saving a `SymptomGroupDraft` whose test is still unanswered
   * (`joint_treatment_muscle_test: null`) fails with a Postgres not-null violation. This is a real
   * limitation inherited from ticket 11's already-applied migration, not introduced by this method - the
   * only Guest state promoted into Supabase today is always a `FinalizedSymptomGroup`
   * (`PromoteGuestToAccountInput.group`'s own doc comment), so this path is not currently exercised by any
   * shipped feature.
   */
  async saveGroup(group: SymptomGroup): Promise<void> {
    const userId = await this.currentUserId();

    const { error: groupError } = await this.client.from("symptom_groups").upsert({
      id: group.id,
      user_id: userId,
      name: group.name,
      created_at: group.created_at,
      joint_treatment_muscle_test: group.joint_treatment_muscle_test,
      joint_treatment_test_at: group.joint_treatment_test_at,
    });
    if (groupError) {
      throw wrapError("saveGroup", groupError);
    }

    if (group.symptoms.length > 0) {
      const { error: symptomsUpsertError } = await this.client
        .from("symptoms")
        .upsert(group.symptoms.map((symptom) => symptomToRow(symptom, group.id, userId)));
      if (symptomsUpsertError) {
        throw wrapError("saveGroup", symptomsUpsertError);
      }
    }

    const currentSymptomIds = group.symptoms.map((symptom) => symptom.id);
    const deleteRemovedSymptoms = this.client.from("symptoms").delete().eq("group_id", group.id);
    const { error: deleteError } =
      currentSymptomIds.length > 0
        ? await deleteRemovedSymptoms.not("id", "in", `(${currentSymptomIds.join(",")})`)
        : await deleteRemovedSymptoms;
    if (deleteError) {
      throw wrapError("saveGroup", deleteError);
    }
  }

  async getPlayerSession(sessionId: string): Promise<PlayerSession | null> {
    const { data: row, error } = await this.client
      .from("player_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (error) {
      throw wrapError("getPlayerSession", error);
    }
    if (!row) {
      return null;
    }
    return rowToPlayerSession(row as PlayerSessionRow);
  }

  async savePlayerSession(session: PlayerSession): Promise<void> {
    const userId = await this.currentUserId();
    const normalizedUnits = session.units.map(normalizeInViewUnit);

    const { error } = await this.client.from("player_sessions").upsert({
      id: session.id,
      user_id: userId,
      treatment_id: session.treatment_id,
      linked_group_id: session.linked_group_id,
      units: normalizedUnits,
      terminal_nemar_response: session.terminal_nemar_response,
      success_declared: session.success_declared,
      integrating_reason: session.integrating_reason,
      finished_at: session.finished_at,
    });
    if (error) {
      throw wrapError("savePlayerSession", error);
    }
  }

  async getOrCreateLibraryRow(treatmentId: string, provenance: LibraryRowProvenance): Promise<LibraryRow> {
    const userId = await this.currentUserId();
    const { data: existingRow, error: selectError } = await this.client
      .from("personal_treatment_library")
      .select("*")
      .eq("treatment_id", treatmentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (selectError) {
      throw wrapError("getOrCreateLibraryRow", selectError);
    }
    if (existingRow) {
      return rowToLibraryRow(existingRow as PersonalTreatmentLibraryRow);
    }

    const { data: insertedRow, error: insertError } = await this.client
      .from("personal_treatment_library")
      .insert({
        user_id: userId,
        treatment_id: treatmentId,
        use_count: 0,
        provenance,
        variant_type: "original",
        global_reference_id: treatmentId,
        protocol_content: null,
      })
      .select("*")
      .single();
    if (insertError) {
      // unique(user_id, treatment_id) - a concurrent call already created this exact row between our
      // select above and this insert. Re-select rather than surface a spurious conflict error, matching
      // the fake/local adapters' "same row id on a second call for the same treatment" contract.
      if (insertError.code === "23505") {
        const { data: raceRow, error: raceError } = await this.client
          .from("personal_treatment_library")
          .select("*")
          .eq("treatment_id", treatmentId)
          .eq("user_id", userId)
          .maybeSingle();
        if (raceError) {
          throw wrapError("getOrCreateLibraryRow", raceError);
        }
        if (raceRow) {
          return rowToLibraryRow(raceRow as PersonalTreatmentLibraryRow);
        }
      }
      throw wrapError("getOrCreateLibraryRow", insertError);
    }
    return rowToLibraryRow(insertedRow as PersonalTreatmentLibraryRow);
  }

  /**
   * Idempotent per `idempotencyKey` (DEC-006), matching `LocalGuestRepository`'s
   * `usedIncrementIdempotencyKeysByRowId` pattern and ticket 13's `promoted_session_ids uuid[]` column
   * style. Keys are tracked in `personal_treatment_library.used_increment_idempotency_keys` (ticket 05) —
   * never in `provenance` jsonb.
   *
   * Plain read-check-write (not one atomic SQL statement): acceptable for sequential retry idempotency;
   * concurrent-write atomicity is ticket 13's RPC concern, not this method's.
   */
  async incrementUseCount(libraryRowId: string, idempotencyKey: string): Promise<LibraryRow> {
    const { data: row, error: selectError } = await this.client
      .from("personal_treatment_library")
      .select("*")
      .eq("id", libraryRowId)
      .maybeSingle();
    if (selectError) {
      throw wrapError("incrementUseCount", selectError);
    }
    if (!row) {
      throw new SupabaseLibraryRowNotFoundError(libraryRowId);
    }

    const currentRow = row as PersonalTreatmentLibraryRow;
    const usedKeys = currentRow.used_increment_idempotency_keys ?? [];
    const promotedSessionIds = currentRow.promoted_session_ids ?? [];
    if (usedKeys.includes(idempotencyKey) || promotedSessionIds.includes(idempotencyKey)) {
      return rowToLibraryRow(currentRow);
    }

    const { data: updatedRow, error: updateError } = await this.client
      .from("personal_treatment_library")
      .update({
        use_count: currentRow.use_count + 1,
        used_increment_idempotency_keys: [...usedKeys, idempotencyKey],
      })
      .eq("id", libraryRowId)
      .select("*")
      .single();
    if (updateError) {
      throw wrapError("incrementUseCount", updateError);
    }
    return rowToLibraryRow(updatedRow as PersonalTreatmentLibraryRow);
  }

  async appendTimelineEvent(event: Omit<TimelineEvent, "id" | "created_at">): Promise<TimelineEvent> {
    const userId = await this.currentUserId();
    const { data: insertedRow, error } = await this.client
      .from("timeline_events")
      .insert({
        user_id: userId,
        log_type: event.log_type,
        treatment_id: event.treatment_id,
        library_row_id: event.library_row_id,
        linked_group_id: event.linked_group_id,
        metadata: event.metadata,
      })
      .select("*")
      .single();
    if (error) {
      throw wrapError("appendTimelineEvent", error);
    }
    return rowToTimelineEvent(insertedRow as TimelineEventRow);
  }

  /** Internal-only fetch, used solely to re-hydrate `promoteGuestToAccount`'s return value below. */
  private async getLibraryRowById(id: string): Promise<LibraryRow | null> {
    const { data, error } = await this.client
      .from("personal_treatment_library")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      throw wrapError("promoteGuestToAccount", error);
    }
    return data ? rowToLibraryRow(data as PersonalTreatmentLibraryRow) : null;
  }

  /** Internal-only fetch, used solely to re-hydrate `promoteGuestToAccount`'s return value below. */
  private async getTimelineEventById(id: string): Promise<TimelineEvent | null> {
    const { data, error } = await this.client
      .from("timeline_events")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      throw wrapError("promoteGuestToAccount", error);
    }
    return data ? rowToTimelineEvent(data as TimelineEventRow) : null;
  }

  /**
   * Ticket 13. Calls the `promote_guest_to_account` RPC exactly once - see that migration's own header
   * comment for the full atomicity/idempotency design this method leans on entirely; there is no
   * client-side multi-insert fallback anywhere in this method (or this file).
   *
   * `input.idempotencyKey` is documented (`PromoteGuestToAccountInput`'s own doc comment) to always *be*
   * `input.group.id` ("the Guest Group's client-side UUID, reused as the eventual `symptom_groups.id`") -
   * the RPC's own conflict/mismatch tracking is keyed on that id, not on a separate column, so this
   * method asserts the invariant up front rather than silently ignoring a caller that violates it.
   *
   * Only `p_guest_group`/`p_symptoms`/`p_player_session`'s own fixed, known fields are ever sent - never
   * an arbitrary passthrough of `input.group/playerSession` - which is also what structurally guarantees
   * the RPC's test-only `__test_only_connection_drop__` gate can never be reached by this method (see the
   * migration's own doc comment on that gate).
   *
   * After the RPC returns success, every promoted entity is re-fetched through this same (RLS-scoped,
   * now-authenticated-as-`newUserId`) client rather than echoing back the caller's own input - correct on
   * both a fresh write and a matching-retry no-op, and reusing `getGroup`/`getPlayerSession` rather than
   * duplicating their row-to-domain-object mapping here.
   */
  async promoteGuestToAccount(input: PromoteGuestToAccountInput): Promise<PromoteGuestToAccountResult> {
    if (input.idempotencyKey !== input.group.id) {
      throw new Error(
        "SupabaseRepository.promoteGuestToAccount: idempotencyKey must equal group.id (see " +
          "PromoteGuestToAccountInput.idempotencyKey's doc comment) - this adapter's RPC tracks " +
          "idempotency/cross-identity-mismatch state on symptom_groups.id itself, not a separate column, " +
          "so a mismatched idempotencyKey/group.id pair cannot be honored.",
      );
    }

    const { data, error } = await this.client.rpc("promote_guest_to_account", {
      p_guest_group: {
        id: input.group.id,
        name: input.group.name,
        joint_treatment_muscle_test: input.group.joint_treatment_muscle_test,
        joint_treatment_test_at: input.group.joint_treatment_test_at,
        created_at: input.group.created_at,
      },
      p_symptoms: input.group.symptoms.map((symptom) => ({
        id: symptom.id,
        name: symptom.name,
        polarity: symptom.polarity,
        intensity: symptom.intensity,
      })),
      p_player_session: {
        id: input.playerSession.id,
        treatment_id: input.playerSession.treatment_id,
        linked_group_id: input.playerSession.linked_group_id,
        units: input.playerSession.units,
        terminal_nemar_response: input.playerSession.terminal_nemar_response,
        success_declared: input.playerSession.success_declared,
        integrating_reason: input.playerSession.integrating_reason,
        finished_at: input.playerSession.finished_at,
      },
      p_new_user_id: input.newUserId,
    });
    if (error) {
      if (error.message.includes("already used with a different payload")) {
        throw new PromoteGuestToAccountIdentityMismatchError(input.idempotencyKey);
      }
      throw wrapError("promoteGuestToAccount", error);
    }

    const rpcResult = data as {
      group_id: string;
      session_id: string;
      library_row_id: string;
      timeline_event_id: string;
    };

    const [group, playerSession, libraryRow, timelineEvent] = await Promise.all([
      this.getGroup(rpcResult.group_id),
      this.getPlayerSession(rpcResult.session_id),
      this.getLibraryRowById(rpcResult.library_row_id),
      this.getTimelineEventById(rpcResult.timeline_event_id),
    ]);
    if (!group || !playerSession || !libraryRow || !timelineEvent) {
      throw new Error(
        "SupabaseRepository.promoteGuestToAccount: the RPC reported success but at least one promoted " +
          "row could not be re-fetched immediately afterward - this should be structurally impossible " +
          "given the RPC's own atomicity guarantee, so this is surfaced as a hard error rather than a " +
          "partial result.",
      );
    }

    return { group: group as FinalizedSymptomGroup, playerSession, libraryRow, timelineEvent };
  }

  async listTreatments(): Promise<TreatmentListItem[]> {
    const { data, error } = await this.client.from("treatments").select("id, title").order("title");
    if (error) {
      throw wrapError("listTreatments", error);
    }
    return (data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
    }));
  }

  /**
   * The Persistence Gate (DEC-017) exists to give Guest Mode refresh resilience *before* an account
   * exists - by the time a `SupabaseRepository` can be constructed at all (an already-authenticated
   * client), the gate has already served its purpose for this Event Manager. There is no column anywhere
   * in the live schema to hold this per-account (adding one requires a migration, out of scope here), so
   * this always returns the same default, never-triggered state - a documented no-op, not a data loss:
   * nothing meaningful was ever going to be read back here in the authenticated phase of the product.
   */
  async getGuestSessionGate(): Promise<GuestSessionGateState> {
    return { ...DEFAULT_GUEST_SESSION_GATE_STATE };
  }

  /** See `getGuestSessionGate`'s doc comment - a documented no-op for the same reason. */
  async saveGuestSessionGate(state: GuestSessionGateState): Promise<void> {
    void state; // never persisted - see getGuestSessionGate's doc comment for why
  }
}
