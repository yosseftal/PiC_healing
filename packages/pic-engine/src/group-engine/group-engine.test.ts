import { describe, expect, it } from "vitest";
import { FakeRepositoryPort } from "../../test/fakes/fake-repository-port";
import { findForbiddenModuleReference, getModuleSpecifiersFromFile } from "../test-helpers/isolation-scanner";
import {
  EmptyRatingUpdateError,
  GroupEngine,
  InvalidIntensityError,
  JointTreatmentMuscleTestNotSetError,
} from "./index";

/**
 * Ticket 07's Test-First Acceptance Criteria, run against the fake `RepositoryPort` (ticket 03). Each
 * `it()` below is titled to match a checkbox in `.scratch/pic-tracer-bullet/issues/07-group-engine.md`
 * exactly, plus additional coverage for `createDraftGroup`/`addSymptom` plumbing, the `splitAdvisory` flag,
 * and adversarial cross-symptom isolation.
 */
describe("GroupEngine", () => {
  async function createGroupWithOneSymptom(engine: GroupEngine) {
    const groupId = await engine.createDraftGroup("Lower Back + Neck");
    const symptomId = await engine.addSymptom(groupId, "Lower Back Pain");
    return { groupId, symptomId };
  }

  describe("createDraftGroup / addSymptom", () => {
    it("createDraftGroup persists a new group with joint_treatment_muscle_test unset", async () => {
      const port = new FakeRepositoryPort();
      const engine = new GroupEngine(port);

      const groupId = await engine.createDraftGroup("Lower Back + Neck");

      const group = await port.getGroup(groupId);
      expect(group?.name).toBe("Lower Back + Neck");
      expect(group?.joint_treatment_muscle_test).toBeNull();
      expect(group?.symptoms).toEqual([]);
    });

    it("addSymptom appends a not-yet-rated symptom to the group", async () => {
      const port = new FakeRepositoryPort();
      const engine = new GroupEngine(port);
      const { groupId, symptomId } = await createGroupWithOneSymptom(engine);

      const group = await port.getGroup(groupId);
      const symptom = group?.symptoms.find((s) => s.id === symptomId);
      expect(symptom?.name).toBe("Lower Back Pain");
      expect(symptom?.rated_at).toBeNull();
    });
  });

  describe("hasPriorRating / rate / revealPriorRating (DEC-011 Blind-by-Default)", () => {
    it("hasPriorRating returns false before any rating exists and true after the first rate() call", async () => {
      const engine = new GroupEngine(new FakeRepositoryPort());
      const { symptomId } = await createGroupWithOneSymptom(engine);

      expect(await engine.hasPriorRating(symptomId)).toBe(false);

      await engine.rate(symptomId, { polarity: "negative", intensity: 6 });

      expect(await engine.hasPriorRating(symptomId)).toBe(true);
    });

    it("rate()'s return value contains no previousPolarity or previousIntensity field", async () => {
      const engine = new GroupEngine(new FakeRepositoryPort());
      const { symptomId } = await createGroupWithOneSymptom(engine);
      await engine.rate(symptomId, { polarity: "negative", intensity: 6 });

      const returnValue = await engine.rate(symptomId, { polarity: "positive", intensity: 2 });

      // `rate()` is typed `Promise<void>` - there is structurally no field to inspect, which is itself the
      // guarantee DEC-011 asks for. This assertion documents that guarantee explicitly rather than relying
      // solely on the type signature being read correctly by a future maintainer.
      expect(returnValue).toBeUndefined();
      expect(Object.keys(returnValue as object | undefined ?? {})).not.toContain("previousPolarity");
      expect(Object.keys(returnValue as object | undefined ?? {})).not.toContain("previousIntensity");
    });

    it("revealPriorRating only returns a value when explicitly called, never as a side effect of rate()", async () => {
      const engine = new GroupEngine(new FakeRepositoryPort());
      const { symptomId } = await createGroupWithOneSymptom(engine);

      expect(await engine.revealPriorRating(symptomId)).toBeNull();

      await engine.rate(symptomId, { polarity: "negative", intensity: 6 });

      // rate() itself never returns or exposes the value; only a caller's own explicit revealPriorRating()
      // call surfaces it, and only after it exists.
      expect(await engine.revealPriorRating(symptomId)).toEqual({ polarity: "negative", intensity: 6 });
    });

    it("flipping polarity via rate() leaves the existing intensity value untouched when intensity is omitted", async () => {
      const engine = new GroupEngine(new FakeRepositoryPort());
      const { symptomId } = await createGroupWithOneSymptom(engine);
      await engine.rate(symptomId, { polarity: "negative", intensity: 8 });

      await engine.rate(symptomId, { polarity: "positive" });

      expect(await engine.revealPriorRating(symptomId)).toEqual({ polarity: "positive", intensity: 8 });
    });

    it("changing intensity via rate() leaves the existing polarity value untouched when polarity is omitted", async () => {
      const engine = new GroupEngine(new FakeRepositoryPort());
      const { symptomId } = await createGroupWithOneSymptom(engine);
      await engine.rate(symptomId, { polarity: "negative", intensity: 8 });

      await engine.rate(symptomId, { intensity: 3 });

      expect(await engine.revealPriorRating(symptomId)).toEqual({ polarity: "negative", intensity: 3 });
    });

    it("intensity outside the 0-10 range is rejected", async () => {
      const engine = new GroupEngine(new FakeRepositoryPort());
      const { symptomId } = await createGroupWithOneSymptom(engine);

      await expect(engine.rate(symptomId, { intensity: 11 })).rejects.toThrow(InvalidIntensityError);
      await expect(engine.rate(symptomId, { intensity: -1 })).rejects.toThrow(InvalidIntensityError);
      await expect(engine.rate(symptomId, { intensity: 5.5 })).rejects.toThrow(InvalidIntensityError);
    });

    it("rate() called with neither polarity nor intensity is rejected", async () => {
      const engine = new GroupEngine(new FakeRepositoryPort());
      const { symptomId } = await createGroupWithOneSymptom(engine);

      await expect(engine.rate(symptomId, {})).rejects.toThrow(EmptyRatingUpdateError);
    });

    it("adversarial: rate() for symptoms in two unrelated groups never leaks a rating between them", async () => {
      // Two *independent* groups (matching Wave 3's "unrelated treatments" precedent for
      // LibraryEngine/TimelineEngine) - not two symptoms sharing one group's mutable `symptoms` array.
      // Concurrent rate() calls for two symptoms *within the same group* are a real, accepted limitation of
      // a plain get/save RepositoryPort with no compare-and-swap primitive; DEC-009 §3's Atomic Focus rule
      // ("only one symptom rated at a time") is the product-level guarantee that makes this a non-issue in
      // practice, and ticket 07 documents no requirement to serialize writes within one group.
      const engine = new GroupEngine(new FakeRepositoryPort());
      const groupIdA = await engine.createDraftGroup("Group A");
      const groupIdB = await engine.createDraftGroup("Group B");
      const symptomA = await engine.addSymptom(groupIdA, "Symptom A");
      const symptomB = await engine.addSymptom(groupIdB, "Symptom B");

      await Promise.all([
        engine.rate(symptomA, { polarity: "negative", intensity: 9 }),
        engine.rate(symptomB, { polarity: "positive", intensity: 1 }),
      ]);

      expect(await engine.revealPriorRating(symptomA)).toEqual({ polarity: "negative", intensity: 9 });
      expect(await engine.revealPriorRating(symptomB)).toEqual({ polarity: "positive", intensity: 1 });
    });
  });

  describe("setJointTreatmentMuscleTest / finalizeGroup (Joint Treatment Muscle Test gate)", () => {
    it("finalizeGroup throws when joint_treatment_muscle_test is unset", async () => {
      const engine = new GroupEngine(new FakeRepositoryPort());
      const groupId = await engine.createDraftGroup("Lower Back + Neck");

      await expect(engine.finalizeGroup(groupId)).rejects.toThrow(JointTreatmentMuscleTestNotSetError);
    });

    it('finalizeGroup succeeds when joint_treatment_muscle_test is "together"', async () => {
      const engine = new GroupEngine(new FakeRepositoryPort());
      const groupId = await engine.createDraftGroup("Lower Back + Neck");
      await engine.setJointTreatmentMuscleTest(groupId, "together");

      const { group, splitAdvisory } = await engine.finalizeGroup(groupId);

      expect(group.joint_treatment_muscle_test).toBe("together");
      expect(splitAdvisory).toBe(false);
    });

    it('finalizeGroup succeeds when joint_treatment_muscle_test is "split_suggested"', async () => {
      const engine = new GroupEngine(new FakeRepositoryPort());
      const groupId = await engine.createDraftGroup("Lower Back + Neck");
      await engine.setJointTreatmentMuscleTest(groupId, "split_suggested");

      const { group, splitAdvisory } = await engine.finalizeGroup(groupId);

      expect(group.joint_treatment_muscle_test).toBe("split_suggested");
      expect(splitAdvisory).toBe(true);
    });

    it("split_suggested informs but never blocks finalization (EM sovereignty)", async () => {
      const engine = new GroupEngine(new FakeRepositoryPort());
      const groupId = await engine.createDraftGroup("Lower Back + Neck");
      await engine.setJointTreatmentMuscleTest(groupId, "split_suggested");

      await expect(engine.finalizeGroup(groupId)).resolves.not.toThrow();
    });
  });

  describe("module isolation", () => {
    it("never imports PlayerEngine, LibraryEngine, TimelineEngine, or SessionEngine", () => {
      // GroupEngine is "fully self-contained relative to the rest of the engine layer" (ticket 07's Do Not
      // Touch section) - stricter than ticket 04's dependency-cruiser rule, which only covers the
      // player-engine <-> group-engine pair. Verified here via the same shared source-scan helper Wave 3
      // extracted for LibraryEngine/TimelineEngine.
      const specifiers = getModuleSpecifiersFromFile(new URL("./index.ts", import.meta.url));

      for (const forbiddenModule of ["player-engine", "library-engine", "timeline-engine", "session-engine"]) {
        expect(findForbiddenModuleReference(specifiers, forbiddenModule)).toBeUndefined();
      }
    });
  });
});
