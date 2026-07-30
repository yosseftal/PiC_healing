/**
 * Shared domain types for `pic-engine` (spec `docs/docs/specs/tracer-bullet-happy-path.md` §B "Data
 * Schema" — Guest store shapes, generalized to be adapter-agnostic).
 *
 * These types are what every engine (`GroupEngine`, `PlayerEngine`, `LibraryEngine`, `TimelineEngine`,
 * `SessionEngine`) and `RepositoryPort` speak in. Neither `pic-adapter-local-guest` nor
 * `pic-adapter-supabase` is imported here, and no field expresses an adapter-specific identity concept
 * (e.g. `user_id`) — ownership / RLS scoping is an adapter concern, never a shape the engines reason
 * about (an engine never imports a concrete adapter — spec §A).
 *
 * Types only: no runtime validation lives here (e.g. Intensity's 0-10 bound is enforced by `GroupEngine`,
 * ticket 07, not by this file).
 */

/** ISO 8601 timestamp string. */
export type Timestamp = string;

/**
 * One named concern inside a Symptom Group (CONTEXT.md "Symptom"). `polarity` and `intensity` are
 * independent dimensions (DEC-009, DEC-010) - neither is ever derived from, or overwrites, the other.
 */
export interface Symptom {
  id: string;
  name: string;
  polarity: "positive" | "negative";
  intensity: number;
}

/** The Joint Treatment Muscle Test's persisted answer (DEC-002, spec §C). */
export type JointTreatmentMuscleTestResult = "together" | "split_suggested";

interface SymptomGroupFields {
  id: string;
  name: string;
  symptoms: Symptom[];
  created_at: Timestamp;
}

/**
 * A Symptom Group before finalization: symptoms may still be added, and the Joint Treatment Muscle Test
 * has not necessarily been answered yet. `GroupEngine.finalizeGroup` (ticket 07) refuses to promote a
 * draft to a `FinalizedSymptomGroup` while `joint_treatment_muscle_test` is unset (spec §C).
 */
export interface SymptomGroupDraft extends SymptomGroupFields {
  joint_treatment_muscle_test: JointTreatmentMuscleTestResult | null;
  joint_treatment_test_at: Timestamp | null;
}

/**
 * A Symptom Group once `GroupEngine.finalizeGroup` has accepted it: the Joint Treatment Muscle Test has
 * been answered. Either answer finalizes - `'split_suggested'` is a non-blocking advisory, never a
 * block on finalization (spec §C, EM sovereignty).
 */
export interface FinalizedSymptomGroup extends SymptomGroupFields {
  joint_treatment_muscle_test: JointTreatmentMuscleTestResult;
  joint_treatment_test_at: Timestamp;
}

/**
 * The Unified Player's flat 4-state model (DEC-015). `in_view` is ephemeral - never itself persisted by
 * a `RepositoryPort` adapter - but remains a valid value of this type because `PlayerSession.units[].state`
 * can legitimately hold it at read time (computed, not stored).
 */
export type PlayerUnitState = "unseen" | "in_view" | "skipped" | "completed";

/** One Atomic Unit's state within a `PlayerSession`. */
export interface PlayerUnit {
  unit_id: string;
  state: PlayerUnitState;
}

/**
 * `Integrating`'s two documented reasons (CONTEXT.md "Integrating"): an ordinary mid-session exit, or a
 * Terminal NEMAR "No" response. Never a new "failed" / "incomplete" label (DEC-006, DEC-015).
 */
export type IntegratingReason = "mid_exit" | "terminal_nemar_no";

/**
 * A Unified Player run against one treatment (spec §B `guest_player_session`). No rating field exists
 * here - ratings live exclusively on `SymptomGroupDraft` / `FinalizedSymptomGroup` symptoms, written only
 * from Symptom Group screens (spec §C). `PlayerEngine` never reads or writes a `Symptom`.
 */
export interface PlayerSession {
  id: string;
  treatment_id: string;
  linked_group_id: string | null;
  units: PlayerUnit[];
  terminal_nemar_response: "yes" | "no" | null;
  /** Set only by `finish()` / `finishAnyway()` - the DEC-015 §4 sovereign success declaration. */
  success_declared: boolean;
  finished_at: Timestamp | null;
  integrating_reason: IntegratingReason | null;
}

/**
 * Known shape of a `LibraryRow`'s `provenance` field, per spec §B's documented example
 * (`{source: 'standalone_player', first_seen_at}`). `source` is left as `string` (not narrowed to a
 * literal union) since the spec does not enumerate an exhaustive set of provenance sources.
 */
export interface LibraryRowProvenance {
  source: string;
  first_seen_at: Timestamp;
}

/**
 * A Personal Treatment Library row (CONTEXT.md "Personal Treatment Library"). `variant_type` is narrowed
 * to `'original'` because that is the only value this spike's `GroupEngine`/`LibraryEngine` can produce
 * or the Supabase schema currently accepts (see the `personal_treatment_library` CHECK constraint in
 * `supabase/migrations/20260730194911_tracer_bullet_schema.sql`); CONTEXT.md's `'course_extracted'` and
 * `'personal'` values are real future states of this same domain concept, out of scope for this spike, and
 * should widen this literal type (together with the DB constraint) when a later ticket implements them.
 */
export interface LibraryRow {
  id: string;
  treatment_id: string;
  use_count: number;
  provenance: LibraryRowProvenance | null;
  variant_type: "original";
  global_reference_id: string | null;
  protocol_content: string | null;
  created_at: Timestamp;
}

/**
 * A Chronological Timeline event (CONTEXT.md "Chronological Timeline"). `log_type` is left as `string`
 * (not narrowed to a literal union) because spec §B explicitly documents it as "enum left open for future
 * types" (DEC-007 §3) - this spike only ever writes `'treatment_execution'`.
 */
export interface TimelineEvent {
  id: string;
  log_type: string;
  treatment_id: string | null;
  library_row_id: string | null;
  linked_group_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Timestamp;
}
