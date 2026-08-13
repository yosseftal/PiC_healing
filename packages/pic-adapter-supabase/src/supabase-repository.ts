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
} from "pic-engine";
import { DEFAULT_GUEST_SESSION_GATE_STATE } from "pic-engine";

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

/**
 * `promoteGuestToAccount` is exclusively ticket 13's RPC-wiring responsibility (see this file's header
 * comment and the ticket's Definition of Done: "this ticket does not implement the RPC call itself").
 * This is a clearly-labeled stub, not a silent no-op - it always throws, on every call, with no partial
 * behavior.
 */
export class SupabaseRepositoryPromotionNotImplementedError extends Error {
  constructor() {
    super(
      "SupabaseRepository.promoteGuestToAccount: not implemented - see ticket 13. This adapter's other " +
        "seven RepositoryPort methods (ticket 12) are ready; the atomic promotion RPC and its wiring here " +
        "are ticket 13's exclusive scope.",
    );
    this.name = "SupabaseRepositoryPromotionNotImplementedError";
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

/**
 * Row shape of `public.symptoms`. **Known schema gap (Wave 4/5 audit SF-1, carried into this ticket's
 * scope):** the live migration adds `polarity`/`intensity` but never added a `rated_at` column - ticket
 * 12's own permission table forbids adding a new migration, so this adapter cannot close that gap by
 * adding the column here. See `rowToSymptom` / `symptomToRow` for the resulting honest (lossy, not
 * fabricated) mapping, and this ticket's Resolution Deviations section for the full writeup.
 */
interface SymptomRow {
  id: string;
  group_id: string;
  user_id: string;
  name: string;
  polarity: string;
  intensity: number;
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

/**
 * Internal-only bookkeeping key, namespaced with a leading underscore, smuggled inside the otherwise
 * free-form `personal_treatment_library.provenance` jsonb column. See `incrementUseCount`'s doc comment
 * for why this table needs idempotency-key tracking with no dedicated column available to hold it.
 */
const USED_INCREMENT_IDEMPOTENCY_KEYS_FIELD = "_usedIncrementIdempotencyKeys";

interface StoredProvenance extends Partial<LibraryRowProvenance> {
  [USED_INCREMENT_IDEMPOTENCY_KEYS_FIELD]?: string[];
}

interface PersonalTreatmentLibraryRow {
  id: string;
  user_id: string;
  treatment_id: string;
  use_count: number;
  provenance: StoredProvenance | null;
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
 * DEC-015's flat 4-state Unified Player model treats `in_view` as ephemeral, never a state a permanent
 * store should durably persist - the exact same rule `pic-adapter-local-guest` already enforces (see that
 * package's `withInViewNormalized` doc comment for the full rationale this adapter matches verbatim).
 * Applied identically on write (`savePlayerSession`) and, defensively, on read (`getPlayerSession`).
 */
function withInViewNormalized(unit: PlayerUnit): PlayerUnit {
  return unit.state === "in_view" ? { ...unit, state: "unseen" } : unit;
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

/**
 * `rated_at` is always reported as `null` when read from Supabase - see this file's header comment on
 * `SymptomRow` for why: the live `public.symptoms` schema has no column to hold it, and no migration may
 * be added in this ticket to introduce one. This is an honest, documented degradation (never a fabricated
 * timestamp) - `GroupEngine.hasPriorRating` will therefore always answer "never rated" for any symptom
 * loaded through this adapter today. Flagged in this ticket's Resolution as needing a fast-follow
 * migration (a real `rated_at timestamptz null` column) before Blind-by-Default rating is trustworthy
 * against Supabase.
 */
function rowToSymptom(row: SymptomRow): Symptom {
  return {
    id: row.id,
    name: row.name,
    polarity: row.polarity as Symptom["polarity"],
    intensity: row.intensity,
    rated_at: null,
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
  };
}

function rowToPlayerSession(row: PlayerSessionRow): PlayerSession {
  return {
    id: row.id,
    treatment_id: row.treatment_id,
    linked_group_id: row.linked_group_id,
    units: row.units.map(withInViewNormalized),
    terminal_nemar_response: row.terminal_nemar_response,
    success_declared: row.success_declared,
    finished_at: toNullableTimestamp(row.finished_at),
    integrating_reason: row.integrating_reason as PlayerSession["integrating_reason"],
  };
}

function stripInternalProvenanceFields(provenance: StoredProvenance | null): LibraryRowProvenance | null {
  if (provenance === null) {
    return null;
  }
  if (provenance.source === undefined || provenance.first_seen_at === undefined) {
    return null;
  }
  return { source: provenance.source, first_seen_at: provenance.first_seen_at };
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
 * `promoteGuestToAccount` is intentionally not implemented here - see
 * `SupabaseRepositoryPromotionNotImplementedError`'s doc comment; ticket 13 owns it exclusively.
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
    const normalizedUnits = session.units.map(withInViewNormalized);

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
    const { data: existingRow, error: selectError } = await this.client
      .from("personal_treatment_library")
      .select("*")
      .eq("treatment_id", treatmentId)
      .maybeSingle();
    if (selectError) {
      throw wrapError("getOrCreateLibraryRow", selectError);
    }
    if (existingRow) {
      return rowToLibraryRow(existingRow as PersonalTreatmentLibraryRow);
    }

    const userId = await this.currentUserId();
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
   * `usedIncrementIdempotencyKeysByRowId` pattern - but persisted differently, because
   * `personal_treatment_library` has no dedicated column to hold a per-row list of previously-used
   * idempotency keys (a real schema gap, same category as `SymptomRow`'s `rated_at` above; adding a
   * column requires a migration, which this ticket's permission table forbids). The already-existing,
   * otherwise-free-form `provenance` jsonb column is the least invasive place to keep this bookkeeping:
   * the list lives under a clearly namespaced `_usedIncrementIdempotencyKeys` key
   * (`USED_INCREMENT_IDEMPOTENCY_KEYS_FIELD`) alongside the real `LibraryRowProvenance` fields, and is
   * always stripped back out by `stripInternalProvenanceFields` before any `LibraryRow` is returned to a
   * caller - the public shape never leaks this adapter's internal storage choice.
   *
   * Not wrapped in a single atomic SQL statement (a plain read-check-write, like the fake/local adapters):
   * acceptable for this tracer-bullet ticket's scope, since the required test is "idempotent under
   * *retry*" (a sequential resubmission), not concurrent-write safety - true atomicity for concurrent
   * increments is explicitly ticket 13's (`promoteGuestToAccount`'s RPC) concern, not this method's.
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
    const usedKeys = currentRow.provenance?.[USED_INCREMENT_IDEMPOTENCY_KEYS_FIELD] ?? [];
    if (usedKeys.includes(idempotencyKey)) {
      return rowToLibraryRow(currentRow);
    }

    const nextProvenance: StoredProvenance = {
      ...currentRow.provenance,
      [USED_INCREMENT_IDEMPOTENCY_KEYS_FIELD]: [...usedKeys, idempotencyKey],
    };
    const { data: updatedRow, error: updateError } = await this.client
      .from("personal_treatment_library")
      .update({ use_count: currentRow.use_count + 1, provenance: nextProvenance })
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

  async promoteGuestToAccount(input: PromoteGuestToAccountInput): Promise<PromoteGuestToAccountResult> {
    void input; // never read - see SupabaseRepositoryPromotionNotImplementedError's doc comment for why
    throw new SupabaseRepositoryPromotionNotImplementedError();
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
