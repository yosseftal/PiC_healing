/**
 * `GroupEngine` — Symptom Group / symptom creation and validation, the Joint Treatment Muscle Test gate,
 * and the three-call Blind-by-Default rating API (ticket 07). This is the **only** module in the entire
 * system that touches ratings, `Polarity`, or `Intensity` — `PlayerEngine` (ticket 08) has zero import of,
 * call into, or awareness of this module, verified both by ticket 04's dependency-cruiser rule and the
 * source-scan "module isolation" test in `./group-engine.test.ts`.
 *
 * Source: `docs/docs/specs/tracer-bullet-happy-path.md` §C in full, User Stories 6-17, Testing Decisions
 * ("Joint Treatment Muscle Test gate", "Blind-by-Default is tested at the API shape", "Rating dimension
 * independence"); `CONTEXT.md` Symptom Group / Blind (re-)rating / Polarity / Intensity entries;
 * `decisions.md` DEC-002, DEC-009, DEC-010, DEC-011.
 *
 * Constructed only against `RepositoryPort` - zero import of `PlayerEngine`, `LibraryEngine`,
 * `TimelineEngine`, or `SessionEngine` anywhere in this module (ticket 07 acceptance criterion, verified by
 * the source-scan test in `./group-engine.test.ts`).
 *
 * **Symptom-id-only lookups and the in-memory index (ticket 07 scope note):** `hasPriorRating`, `rate`, and
 * `revealPriorRating` all take a bare `symptomId` - no `groupId` - matching both this ticket's Definition of
 * Done and the spec §C text verbatim. `RepositoryPort` has no `getSymptom` / "find group by symptom id" /
 * list-all-groups method, so the only way to resolve a bare `symptomId` back to its owning group is an
 * in-memory `Map` populated by `addSymptom` (and re-populated by `createDraftGroup`/`addSymptom` calls made
 * through *this* engine instance). This works for every path this spike exercises: spec §C's two in-scope
 * rating trigger points are (1) "during Symptom Group Initialization," always immediately preceded by this
 * same instance's own `addSymptom` call, and (2) the "resume an existing group" session-scoped trigger,
 * which ticket 07's own Out of Scope section explicitly excludes from this spike ("this spike's happy path
 * only ever creates a new group"). A fresh `GroupEngine` instance asked to `rate()` a `symptomId` it never
 * saw via its own `addSymptom` (e.g. after a real page reload, without first re-adding the symptom through
 * this instance) throws `UnknownSymptomError` - a known, deliberate limitation inherited directly from that
 * Out-of-Scope boundary, not an oversight. A future ticket implementing trigger point 2 will need to either
 * rebuild this index from `RepositoryPort.getGroup` on resume, or widen `RepositoryPort` with a lookup
 * method; this comment flags that boundary for whoever picks that up, per the Do Not Touch note on trigger
 * point 2 in the ticket file.
 *
 * **`rate()`'s update shape is `Partial<{polarity, intensity}>`, not both-required (ticket 07 scope note):**
 * the ticket text's own Definition of Done also states "flipping `polarity` in a `rate()` call without
 * passing a new `intensity` leaves the existing `intensity` untouched, and vice versa" - which only has
 * meaning if a caller may omit either field. The signature is implemented as `{ polarity?: Polarity;
 * intensity?: Intensity }` (at least one of the two required at the call site, enforced at runtime) rather
 * than the both-mandatory literal shape the ticket's own headline bullet shows, to make that independence
 * requirement satisfiable at all. This mirrors Wave 3's `idempotencyKey` precedent: a later bullet in the
 * same ticket text overrides an earlier, less precise one; the fuller, more specific requirement wins.
 */
import type { FinalizedSymptomGroup, Intensity, JointTreatmentMuscleTestResult, Polarity, Symptom } from "../types";
import type { RepositoryPort, SymptomGroup } from "../repository-port";

/** `addSymptom`'s placeholder rating for a not-yet-rated symptom - see `Symptom.rated_at`'s doc comment. */
const UNRATED_PLACEHOLDER_POLARITY: Polarity = "negative";
const UNRATED_PLACEHOLDER_INTENSITY: Intensity = 0;

/** Thrown by `finalizeGroup` when `joint_treatment_muscle_test` is still unset (spec §C, ticket 07 DoD). */
export class JointTreatmentMuscleTestNotSetError extends Error {
  constructor(groupId: string) {
    super(
      `GroupEngine.finalizeGroup: group "${groupId}" cannot be finalized because its ` +
        "joint_treatment_muscle_test answer is unset. Call setJointTreatmentMuscleTest first.",
    );
    this.name = "JointTreatmentMuscleTestNotSetError";
  }
}

/** Thrown by `rate` when `intensity` is not an integer in the inclusive 0-10 range (DEC-010 §1, ticket 07). */
export class InvalidIntensityError extends Error {
  constructor(intensity: number) {
    super(`GroupEngine.rate: intensity ${intensity} is invalid - it must be an integer between 0 and 10.`);
    this.name = "InvalidIntensityError";
  }
}

/** Thrown by `rate` when called with neither `polarity` nor `intensity` - see this file's header comment. */
export class EmptyRatingUpdateError extends Error {
  constructor(symptomId: string) {
    super(`GroupEngine.rate: called for symptom "${symptomId}" with neither polarity nor intensity set.`);
    this.name = "EmptyRatingUpdateError";
  }
}

/** Thrown when a `groupId` has no matching group (unknown id, or never created via this port). */
export class GroupNotFoundError extends Error {
  constructor(groupId: string) {
    super(`GroupEngine: no symptom group with id "${groupId}".`);
    this.name = "GroupNotFoundError";
  }
}

/** Thrown when a `symptomId` was never seen by this engine instance - see the file header's scope note. */
export class UnknownSymptomError extends Error {
  constructor(symptomId: string) {
    super(
      `GroupEngine: symptom "${symptomId}" is unknown to this engine instance. hasPriorRating/rate/` +
        "revealPriorRating can only resolve symptoms added via this same instance's addSymptom() - see " +
        "./index.ts's file header for why (trigger point 2 / resume-existing-group flows are out of scope " +
        "for ticket 07).",
    );
    this.name = "UnknownSymptomError";
  }
}

function isValidIntensity(intensity: number): boolean {
  return Number.isInteger(intensity) && intensity >= 0 && intensity <= 10;
}

export class GroupEngine {
  /** `symptomId -> groupId`, populated by `addSymptom` - see this file's header comment for why. */
  private readonly groupIdBySymptomId = new Map<string, string>();

  constructor(private readonly repositoryPort: RepositoryPort) {}

  /** Creates and persists a new, unfinalized Symptom Group with no symptoms yet. Returns its `groupId`. */
  async createDraftGroup(name: string): Promise<string> {
    const group: SymptomGroup = {
      id: crypto.randomUUID(),
      name,
      symptoms: [],
      created_at: new Date().toISOString(),
      joint_treatment_muscle_test: null,
      joint_treatment_test_at: null,
    };
    await this.repositoryPort.saveGroup(group);
    return group.id;
  }

  /**
   * Adds a new, not-yet-rated symptom (name only) to `groupId`. Returns the new `symptomId`. The symptom is
   * seeded with the placeholder `polarity`/`intensity` documented on `Symptom.rated_at` (`rated_at: null`
   * is the actual "unrated" signal `hasPriorRating` reads - the placeholder values are never observable
   * through this engine's public API before a real `rate()` call, per `revealPriorRating`'s own guard).
   */
  async addSymptom(groupId: string, name: string): Promise<string> {
    const group = await this.loadGroupOrThrow(groupId);
    const symptom: Symptom = {
      id: crypto.randomUUID(),
      name,
      polarity: UNRATED_PLACEHOLDER_POLARITY,
      intensity: UNRATED_PLACEHOLDER_INTENSITY,
      rated_at: null,
    };
    const updatedGroup: SymptomGroup = { ...group, symptoms: [...group.symptoms, symptom] };
    await this.repositoryPort.saveGroup(updatedGroup);
    this.groupIdBySymptomId.set(symptom.id, groupId);
    return symptom.id;
  }

  /**
   * Safe to call anytime (DEC-011): tells the caller whether a "Reveal" affordance should even be shown,
   * without exposing the prior value itself. `true` iff `rate()` has been called at least once for
   * `symptomId` (tracked via `Symptom.rated_at`, never via the placeholder polarity/intensity values).
   */
  async hasPriorRating(symptomId: string): Promise<boolean> {
    const { symptom } = await this.findSymptomOrThrow(symptomId);
    return symptom.rated_at !== null;
  }

  /**
   * The **only** way to set a symptom's rating (DEC-011) - a first-time rating and a re-rating are the
   * identical call. `update` is a partial `{ polarity?, intensity? }`: passing only one dimension leaves
   * the other's current value untouched (DEC-010's independence requirement, ticket 07 DoD); passing
   * neither throws `EmptyRatingUpdateError`. Returns `void` - structurally, there is no return value for a
   * previous polarity/intensity to leak through (DEC-011's bias-prevention guarantee, enforced at the type
   * level, not just by convention).
   */
  async rate(symptomId: string, update: { polarity?: Polarity; intensity?: Intensity }): Promise<void> {
    if (update.polarity === undefined && update.intensity === undefined) {
      throw new EmptyRatingUpdateError(symptomId);
    }
    if (update.intensity !== undefined && !isValidIntensity(update.intensity)) {
      throw new InvalidIntensityError(update.intensity);
    }

    const { group, symptom } = await this.findSymptomOrThrow(symptomId);
    const ratedSymptom: Symptom = {
      ...symptom,
      polarity: update.polarity ?? symptom.polarity,
      intensity: update.intensity ?? symptom.intensity,
      rated_at: new Date().toISOString(),
    };
    const updatedGroup: SymptomGroup = {
      ...group,
      symptoms: group.symptoms.map((s) => (s.id === symptomId ? ratedSymptom : s)),
    };
    await this.repositoryPort.saveGroup(updatedGroup);
  }

  /**
   * The **only** call that returns a previous rating value, and only when the caller has explicitly
   * triggered the Reveal affordance (DEC-011). Never mutates state. Returns `null` until the first `rate()`
   * call exists for `symptomId`.
   */
  async revealPriorRating(symptomId: string): Promise<{ polarity: Polarity; intensity: Intensity } | null> {
    const { symptom } = await this.findSymptomOrThrow(symptomId);
    if (symptom.rated_at === null) {
      return null;
    }
    return { polarity: symptom.polarity, intensity: symptom.intensity };
  }

  /**
   * Persists the Joint Treatment Muscle Test's answer for `groupId` (spec §C). Either answer is a valid,
   * finalizable state - `'split_suggested'` is a non-blocking advisory, never a block (EM sovereignty).
   */
  async setJointTreatmentMuscleTest(groupId: string, answer: JointTreatmentMuscleTestResult): Promise<void> {
    const group = await this.loadGroupOrThrow(groupId);
    const updatedGroup: SymptomGroup = {
      ...group,
      joint_treatment_muscle_test: answer,
      joint_treatment_test_at: new Date().toISOString(),
    };
    await this.repositoryPort.saveGroup(updatedGroup);
  }

  /**
   * Finalizes `groupId`, refusing (throwing `JointTreatmentMuscleTestNotSetError`) while its Joint Treatment
   * Muscle Test answer is unset - the muscle test is a `GroupEngine` invariant, not a UI-only validation
   * (spec §C). `splitAdvisory` is `true` iff the answer is `'split_suggested'`: informs the caller of the
   * non-blocking suggestion without ever having blocked this call from succeeding.
   */
  async finalizeGroup(groupId: string): Promise<{ group: FinalizedSymptomGroup; splitAdvisory: boolean }> {
    const group = await this.loadGroupOrThrow(groupId);
    // `joint_treatment_test_at` is always set in the same call as `joint_treatment_muscle_test` (see
    // `setJointTreatmentMuscleTest` above), so this single condition also narrows `group` to satisfy
    // `FinalizedSymptomGroup` below - both fields are checked explicitly (rather than asserted) so a future
    // bug that ever violated that invariant fails loudly here instead of silently.
    if (group.joint_treatment_muscle_test === null || group.joint_treatment_test_at === null) {
      throw new JointTreatmentMuscleTestNotSetError(groupId);
    }

    const finalizedGroup: FinalizedSymptomGroup = {
      ...group,
      joint_treatment_muscle_test: group.joint_treatment_muscle_test,
      joint_treatment_test_at: group.joint_treatment_test_at,
    };
    await this.repositoryPort.saveGroup(finalizedGroup);
    return { group: finalizedGroup, splitAdvisory: finalizedGroup.joint_treatment_muscle_test === "split_suggested" };
  }

  private async loadGroupOrThrow(groupId: string): Promise<SymptomGroup> {
    const group = await this.repositoryPort.getGroup(groupId);
    if (group === null) {
      throw new GroupNotFoundError(groupId);
    }
    return group;
  }

  private async findSymptomOrThrow(symptomId: string): Promise<{ group: SymptomGroup; symptom: Symptom }> {
    const groupId = this.groupIdBySymptomId.get(symptomId);
    if (groupId === undefined) {
      throw new UnknownSymptomError(symptomId);
    }
    const group = await this.loadGroupOrThrow(groupId);
    const symptom = group.symptoms.find((s) => s.id === symptomId);
    if (symptom === undefined) {
      throw new UnknownSymptomError(symptomId);
    }
    return { group, symptom };
  }
}
