/**
 * `TimelineEngine` — Chronological Timeline event construction: `log_type`, links to the Personal
 * Treatment Library entry, and explicitly no content snapshot (ticket 06).
 *
 * Source: `docs/docs/specs/tracer-bullet-happy-path.md` §A, §B (`timeline_events` schema), User Stories
 * 42-43; `CONTEXT.md` "Chronological Timeline" / "Linked Journey vs. Toolbox Model"; `decisions.md`
 * DEC-007 §3, DEC-008.
 *
 * Constructed only against `RepositoryPort` - zero import of `GroupEngine`, `PlayerEngine`,
 * `LibraryEngine`, or `SessionEngine` anywhere in this module (ticket 06 acceptance criterion, verified
 * by the source-scan test in `./timeline-engine.test.ts`).
 *
 * **No snapshot, ever (DEC-016 §5, GQ-025):** the constructed event links to the treatment and library
 * row by id only. There is no `content`, `markdown`, or `protocol_content` field anywhere on
 * `RecordExecutionInput` or the persisted `TimelineEvent` shape - reviewing this event later always
 * renders the library entry's *current* state (Pointer or Hard Copy), never a frozen copy of what this
 * event's own moment looked like.
 *
 * **Resolved architectural note (Orchestrator ruling, Wave 3):** ticket 06's draft text described this
 * method as accepting `{ userId, treatmentId, libraryRowId, linkedGroupId, metadata }`. The ratified
 * `TimelineEvent` domain type and `RepositoryPort.appendTimelineEvent` signature (ticket 02, already
 * implemented and Wave-2.5-audited) carry no `user_id` field at all. Concretely, this means the
 * `user_id` on a `timeline_events` row must be **explicitly supplied by the authenticated adapter/RPC at
 * write time** - Postgres RLS acts as a sanctuary gate, rejecting any mismatch against the authenticated
 * identity, but it never assigns the value itself (confirmed by the live schema,
 * `supabase/migrations/20260730194911_tracer_bullet_schema.sql`: `user_id` is `not null` with no
 * `default` and no trigger, so *something* upstream of this engine - the adapter's own insert, or ticket
 * 13's RPC via its explicit `p_new_user_id`-style parameter - must still set it). Threading a `userId`
 * through this engine would be architectural drift *away from* ticket 02's actual contract regardless -
 * not because RLS would silently cover the gap, but because *which* adapter call supplies the value, and
 * how, is exactly the kind of identity-plumbing decision `types.ts` already assigns to the adapter layer,
 * never to an engine. So `recordExecution` here omits `userId`; identity / RLS scoping stays exactly
 * where `types.ts` already documents it living - the adapter, never the engine. See
 * `../library-engine/index.ts`'s matching note for the identical reasoning applied to
 * `LibraryEngine.recordUse`.
 */
import type { TimelineEvent } from "../types";
import type { RepositoryPort } from "../repository-port";

const TREATMENT_EXECUTION_LOG_TYPE = "treatment_execution";

/** Input to `TimelineEngine.recordExecution` (ticket 06). */
export interface RecordExecutionInput {
  treatmentId: string;
  /**
   * Nullable to match `timeline_events.library_row_id`'s own schema nullability exactly, even though
   * every call site in this spike's happy path (`PlayerEngine.finish()` / `finishAnyway()`, ticket 08)
   * always has a `LibraryRow` in hand by the time it calls `recordExecution` - `LibraryEngine.recordUse`
   * runs first per DEC-006 §5's exactly-once side-effect ordering.
   */
  libraryRowId: string | null;
  /**
   * Optional Smart-Link to a Symptom Group (DEC-008): "intentional, never automatic." Treatment-to-group
   * linking is opt-in per user story 19, so this is both nullable and omittable - never defaulted or
   * inferred from any ambient session context (ticket 06 DoD: "nullable and optional in the call
   * signature").
   */
  linkedGroupId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export class TimelineEngine {
  constructor(private readonly repositoryPort: RepositoryPort) {}

  /**
   * Appends a `'treatment_execution'` Chronological Timeline event linking `treatmentId` and
   * `libraryRowId` (and, optionally, a Smart-Linked `linkedGroupId`) - never a content or markdown
   * snapshot of any kind.
   */
  async recordExecution(input: RecordExecutionInput): Promise<TimelineEvent> {
    return this.repositoryPort.appendTimelineEvent({
      log_type: TREATMENT_EXECUTION_LOG_TYPE,
      treatment_id: input.treatmentId,
      library_row_id: input.libraryRowId,
      linked_group_id: input.linkedGroupId ?? null,
      metadata: input.metadata ?? null,
    });
  }
}
