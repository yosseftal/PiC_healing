import { describe, expect, it } from "vitest";
import type { RepositoryPort, SymptomGroup } from "../../src/repository-port";
import { GroupEngine } from "../../src/group-engine";
import { GroupRevisionConflictError, InvalidSymptomOrderError } from "../../src/group-revision";

export function runGroupOrderContract(makePorts: () => { port: RepositoryPort; fresh: () => RepositoryPort }) {
  describe("durable manual priority", () => {
    it("treats empty, singleton and identical permutations as no-ops but still validates the revision", async () => {
      const { port, fresh } = makePorts();
      for (const count of [0, 1, 3]) {
        const group: SymptomGroup = {
          id: crypto.randomUUID(), name: "No-op", revision: 0,
          created_at: "2026-10-20T00:00:00.000Z", joint_treatment_muscle_test: "together",
          joint_treatment_test_at: "2026-10-20T00:00:00.000Z",
          symptoms: Array.from({ length: count }, (_, index) => ({ id: crypto.randomUUID(), name: `Topic ${index}`,
            polarity: "negative", intensity: 0, rated_at: null })),
        };
        await port.saveGroup(group);
        const order = group.symptoms.map((s) => s.id);
        expect(await port.reorderSymptoms(group.id, order, 0)).toEqual(group);
        await expect(port.reorderSymptoms(group.id, order, 1)).rejects.toBeInstanceOf(GroupRevisionConflictError);
        expect(await fresh().getGroup(group.id)).toEqual(group);
      }
    });
    it("rejects revision overflow without changing the aggregate", async () => {
      const { port, fresh } = makePorts();
      const group: SymptomGroup = {
        id: crypto.randomUUID(), name: "Bounded token", revision: Number.MAX_SAFE_INTEGER,
        created_at: "2026-10-20T00:00:00.000Z", joint_treatment_muscle_test: "together",
        joint_treatment_test_at: "2026-10-20T00:00:00.000Z",
        symptoms: ["a", "b"].map((name) => ({ id: crypto.randomUUID(), name,
          polarity: "negative", intensity: 0, rated_at: null })),
      };
      await port.saveGroup(group);
      await expect(port.reorderSymptoms(group.id, group.symptoms.map((s) => s.id).reverse(), group.revision!))
        .rejects.toBeInstanceOf(GroupRevisionConflictError);
      await expect(port.saveGroup({ ...group, name: "Changed" })).rejects.toBeInstanceOf(GroupRevisionConflictError);
      expect(await fresh().getGroup(group.id)).toEqual(group);
    });

    it("rejects incomplete permutations and stale append/rating writes while exact retries keep the revision", async () => {
      const { port, fresh } = makePorts();
      const engine = new GroupEngine(port);
      const id = crypto.randomUUID();
      await port.saveGroup({ id, name: "CAS", symptoms: [], revision: 0,
        created_at: "2026-10-20T00:00:00.000Z", joint_treatment_muscle_test: "together",
        joint_treatment_test_at: "2026-10-20T00:00:00.000Z" });
      const first = crypto.randomUUID(), second = crypto.randomUUID();
      await engine.commitMembershipRevision({ operationId: crypto.randomUUID(), groupId: id,
        expectedRevision: 0, expectedMembershipRevision: 0, additions: [
          { id: first!, name: "First", polarity: "negative", intensity: 1 },
          { id: second!, name: "Second", polarity: "negative", intensity: 1 }],
        orderedSymptomIds: [first!, second!], answer: "together", answeredAt: "2026-10-20T00:00:00.000Z" });
      const before = (await port.getGroup(id))!;
      for (const order of [[first], [first, first], [first, crypto.randomUUID()]]) {
        await expect(port.reorderSymptoms(id, order, before.revision!)).rejects.toBeInstanceOf(InvalidSymptomOrderError);
      }
      const after = await port.reorderSymptoms(id, [second, first], before.revision!);
      await expect(port.saveGroup({ ...before, name: "Stale" })).rejects.toBeInstanceOf(GroupRevisionConflictError);
      await expect(port.saveGroup({ ...after, revision: undefined, name: "Missing" }))
        .rejects.toBeInstanceOf(GroupRevisionConflictError);
      await expect(port.saveGroup({ ...after, symptoms: [after.symptoms[0]!] }))
        .rejects.toBeInstanceOf(InvalidSymptomOrderError);
      await port.saveGroup({ ...after, revision: undefined });
      await expect(port.reorderSymptoms(id, [second, first], before.revision!))
        .rejects.toBeInstanceOf(GroupRevisionConflictError);
      expect(await fresh().getGroup(id)).toEqual(after);
      after.symptoms[0]!.name = "Caller mutation";
      expect((await fresh().getGroup(id))!.symptoms[0]!.name).toBe("Second");
    });
    it("reorders through GroupEngine and reads unchanged identities and ratings from a fresh port", async () => {
      const { port, fresh } = makePorts();
      const engine = new GroupEngine(port);
      const groupId = crypto.randomUUID();
      await port.saveGroup({ id: groupId, name: "", symptoms: [], revision: 0,
        created_at: "2026-10-20T00:00:00.000Z", joint_treatment_muscle_test: "together",
        joint_treatment_test_at: "2026-10-20T00:00:00.000Z" });
      const first = crypto.randomUUID(), second = crypto.randomUUID(), third = crypto.randomUUID();
      await engine.commitMembershipRevision({ operationId: crypto.randomUUID(), groupId,
        expectedRevision: 0, expectedMembershipRevision: 0, additions: [
          { id: first, name: "First", polarity: "negative", intensity: 1 },
          { id: second, name: "Second", polarity: "negative", intensity: 1 },
          { id: third, name: "Third", polarity: "negative", intensity: 1 }],
        orderedSymptomIds: [first, second, third], answer: "together", answeredAt: "2026-10-20T00:00:00.000Z" });
      await engine.rate(first, { intensity: 0, polarity: "positive" });
      await engine.rate(second, { intensity: 5 });
      await engine.rate(third, { intensity: 9 });
      await engine.setJointTreatmentMuscleTest(groupId, "together");
      const before = (await port.getGroup(groupId)) as SymptomGroup;
      const committed = await engine.reorderSymptoms(groupId, [third, first, second], before.revision!);
      expect(committed.symptoms).toEqual([before.symptoms[2], before.symptoms[0], before.symptoms[1]]);
      expect(committed.joint_treatment_test_at).toBe(before.joint_treatment_test_at);
      expect(committed.revision).toBe(before.revision! + 1);
      expect(await fresh().getGroup(groupId)).toEqual(committed);
    });
  });
}
