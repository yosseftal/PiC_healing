/**
 * `LibraryEngine` — the Personal Treatment Library's `use_count` increment rule (Finish-only) and
 * first-execution row creation (ticket 05).
 *
 * Source: `docs/docs/specs/tracer-bullet-happy-path.md` §A, §B (`personal_treatment_library` schema), §D
 * ("Exactly-once side effects"); `CONTEXT.md` "Personal Treatment Library"; `decisions.md` DEC-005,
 * DEC-006.
 *
 * Constructed only against `RepositoryPort` - zero import of `GroupEngine`, `PlayerEngine`,
 * `TimelineEngine`, or `SessionEngine` anywhere in this module (ticket 05 acceptance criterion, verified
 * by the source-scan test in `./library-engine.test.ts`).
 *
 * **Pointer vs. Hard Copy (ADR-0002, DEC-016 §5):** `recordUse` never sets or reads `protocol_content` or
 * `variant_type` - those are entirely `RepositoryPort.getOrCreateLibraryRow`'s concern. The fake adapter
 * (ticket 03) already creates every brand-new row as a Pointer (`protocol_content: null`,
 * `variant_type: 'original'`), and both real adapters (`pic-adapter-local-guest`,
 * `pic-adapter-supabase` - tickets 10/12/13, still empty stubs as of Wave 3) are expected to honor the
 * same contract once built. This engine only ever drives a row into existence and increments its
 * counter. Lazy Flip (Copy-on-Write to Hard Copy) is a library-*editing* concern with no call site in
 * this spike (ticket 05's Out of Scope) - `recordUse` cannot flip a row even by accident, because it
 * never touches the two fields that distinguish Pointer from Hard Copy.
 *
 * **Resolved architectural note (Orchestrator ruling, Wave 3):** ticket 05's draft text described this
 * method as `recordUse(treatmentId, userId)`. The ratified `RepositoryPort` (ticket 02, already
 * implemented and Wave-2.5-audited) has no `userId`/`user_id` concept anywhere except
 * `promoteGuestToAccount`'s `newUserId` - which that method's own doc comment explains is required
 * *only* because it is the one call that crosses from no-identity Guest state into a real identity,
 * "unlike the port's other seven methods." `getOrCreateLibraryRow` and `incrementUseCount` are two of
 * those other seven: identity / RLS scoping is an adapter concern (see `types.ts`'s file header - "no
 * field expresses an adapter-specific identity concept... ownership / RLS scoping is an adapter concern,
 * never a shape the engines reason about"). Concretely, this means the `user_id` on a
 * `personal_treatment_library` row must be **explicitly supplied by the authenticated adapter/RPC at
 * write time** - Postgres RLS acts as a sanctuary gate, rejecting any mismatch against the authenticated
 * identity, but it never assigns the value itself (confirmed by the live schema,
 * `supabase/migrations/20260730194911_tracer_bullet_schema.sql`: `user_id` is `not null` with no
 * `default` and no trigger, so *something* upstream of this engine - the adapter's own insert, or ticket
 * 13's RPC via its explicit `p_new_user_id`-style parameter - must still set it). So `recordUse` here
 * takes no `userId` - not because RLS would fill the gap (it would not: an insert omitting `user_id`
 * fails the `not null` constraint before RLS is ever consulted, and one supplying the wrong value fails
 * RLS's check), but because *which* adapter call supplies it, and how, is exactly the kind of
 * identity-plumbing decision `types.ts` already assigns to the adapter layer, never to an engine.
 * Threading a `userId` through `LibraryEngine` would be architectural drift *away from* ticket 02's
 * actual, already-shipped contract, not toward it. In its place, `recordUse` takes the `idempotencyKey`
 * that `incrementUseCount`'s own doc comment already calls for ("should naturally be sourced from the
 * completing `PlayerSession.id`") - `LibraryEngine` has no other way to obtain a stable, retry-safe key,
 * since it is never told about sessions at all.
 */
import type { LibraryRow } from "../types";
import type { RepositoryPort } from "../repository-port";

/**
 * This spike's only execution path into the library is a standalone (non-course) Unified Player run -
 * ticket 05's Out of Scope note explicitly excludes `'course_extracted'` / `'personal'` provenance
 * handling, so this is the one fixed provenance source `recordUse` ever stamps on first creation.
 */
const STANDALONE_PLAYER_PROVENANCE_SOURCE = "standalone_player";

export class LibraryEngine {
  constructor(private readonly repositoryPort: RepositoryPort) {}

  /**
   * Ensures a Personal Treatment Library row exists for `treatmentId` - creating one (Pointer state,
   * `variant_type: 'original'`, `provenance.source: 'standalone_player'`) on the treatment's first
   * recorded execution - then increments its `use_count` by exactly one.
   *
   * Calls `getOrCreateLibraryRow` then `incrementUseCount`, in that order, exactly once per call (ticket
   * 05 DoD). `use_count` is never left at `0` after this resolves: a first-time call creates the row at
   * `use_count: 0` and this same call immediately increments it to `1`.
   *
   * `idempotencyKey` is forwarded verbatim to `RepositoryPort.incrementUseCount` - callers (ultimately
   * `PlayerEngine`, ticket 08) should source it from the completing `PlayerSession.id` per that method's
   * own doc comment, so a network-level retry of the *same* Finish call never double-counts, while a
   * later Finish of the same treatment (a new session, a new key) still increments. `LibraryEngine`
   * itself does not decide *when* it is safe to call `recordUse` exactly once per Finish - ticket 05's
   * Out of Scope note explicitly assigns that sequencing responsibility to `PlayerEngine`.
   */
  async recordUse(treatmentId: string, idempotencyKey: string): Promise<LibraryRow> {
    const row = await this.repositoryPort.getOrCreateLibraryRow(treatmentId, {
      source: STANDALONE_PLAYER_PROVENANCE_SOURCE,
      first_seen_at: new Date().toISOString(),
    });

    return this.repositoryPort.incrementUseCount(row.id, idempotencyKey);
  }
}
