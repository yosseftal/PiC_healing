import { describe, expect, it } from "vitest";
import { GroupEngine } from "../../src/group-engine";
import type { RepositoryPort, SymptomGroup } from "../../src/repository-port";
import type { MembershipRevisionInput } from "../../src/repository-port";
import { GroupRevisionConflictError } from "../../src/group-revision";
import { InvalidMembershipRevisionError } from "../../src/membership-state";

export function runMembershipRevisionContract(makePorts: () => { port: RepositoryPort; fresh: () => RepositoryPort }) {
  describe("answered membership revision", () => {
    it("reads an unrevised legacy answer with no timestamp without rewriting or fabricating finalization", async () => {
      const { port, fresh } = makePorts();
      const group: SymptomGroup = { id: crypto.randomUUID(), name: "Legacy", revision: 0,
        created_at: "2026-10-20T00:00:00.000Z", symptoms: [],
        joint_treatment_muscle_test: "split_suggested", joint_treatment_test_at: null };
      await port.saveGroup(group);
      expect(await fresh().getGroup(group.id)).toEqual(group);
      await expect(new GroupEngine(port).finalizeGroup(group.id)).rejects.toThrow();
      expect(await fresh().getGroup(group.id)).toEqual(group);
    });
    it("rejects generic answered append and forged counters without changing the saved list", async () => {
      const { port } = makePorts();
      const group: SymptomGroup = { id: crypto.randomUUID(), name: "Answered", revision: 0,
        created_at: "2026-10-20T00:00:00.000Z", symptoms: [], joint_treatment_muscle_test: "together",
        joint_treatment_test_at: "2026-10-20T00:00:00.000Z" };
      await port.saveGroup(group);
      await expect(port.saveGroup({ ...group, symptoms: [{ id: crypto.randomUUID(), name: "Bypass",
        polarity: "negative", intensity: 0, rated_at: null }] })).rejects.toThrow();
      await expect(port.saveGroup({ ...group, membership_revision: 1,
        joint_treatment_membership_revision: 1 })).rejects.toThrow();
      await expect(port.saveGroup({ ...group, joint_treatment_muscle_test: null,
        joint_treatment_test_at: null })).rejects.toThrow();
      expect(await port.getGroup(group.id)).toEqual(group);
    });
    for (const previous of ["together", "split_suggested"] as const) {
      for (const answer of ["together", "split_suggested"] as const) {
        it(`binds fresh ${answer} after ${previous} to all additions and keeps pure reorder valid`, async () => {
          const { port } = makePorts();
          const engine = new GroupEngine(port);
          const group: SymptomGroup = { id: crypto.randomUUID(), name: "Full list", revision: 0,
            created_at: "2026-10-20T00:00:00.000Z", symptoms: [], joint_treatment_muscle_test: previous,
            joint_treatment_test_at: "2026-10-20T00:00:00.000Z" };
          await port.saveGroup(group);
          const additions = ["First", "Second"].map((name) => ({ id: crypto.randomUUID(), name,
            polarity: "positive" as const, intensity: 10 }));
          const committed = await engine.commitMembershipRevision({ operationId: crypto.randomUUID(), groupId: group.id,
            expectedRevision: 0, expectedMembershipRevision: 0, additions, orderedSymptomIds: additions.map((s) => s.id),
            answer, answeredAt: "2026-10-26T10:00:00.000Z" });
          await engine.reorderSymptoms(group.id, committed.symptoms.map((s) => s.id).reverse(), committed.revision!);
          const final = await engine.finalizeGroup(group.id);
          expect(final.splitAdvisory).toBe(answer === "split_suggested");
          expect(final.group).toMatchObject({ membership_revision: 1, joint_treatment_membership_revision: 1,
            joint_treatment_muscle_test: answer });
        });
      }
    }
    it("rejects stale, foreign, duplicate and invalid requests without partial membership or receipt writes", async () => {
      const { port, fresh } = makePorts();
      const makeGroup = (): SymptomGroup => ({ id: crypto.randomUUID(), name: "Owned", revision: 0,
        created_at: "2026-10-20T00:00:00.000Z", joint_treatment_muscle_test: "together",
        joint_treatment_test_at: "2026-10-20T00:00:00.000Z", symptoms: [{ id: crypto.randomUUID(),
          name: "Existing", polarity: "positive", intensity: 0, rated_at: null }] });
      const group = makeGroup(), foreign = makeGroup();
      await port.saveGroup(group); await port.saveGroup(foreign);
      const addition = { id: crypto.randomUUID(), name: "New", polarity: "negative" as const, intensity: 1 };
      const request: MembershipRevisionInput = { operationId: crypto.randomUUID(), groupId: group.id,
        expectedRevision: 0, expectedMembershipRevision: 0, additions: [addition],
        orderedSymptomIds: [group.symptoms[0]!.id, addition.id], answer: "together", answeredAt: "2026-10-26T10:00:00.000Z" };
      const invalid: MembershipRevisionInput[] = [
        { ...request, expectedRevision: 1 }, { ...request, expectedMembershipRevision: 1 },
        ...[0, 11, 1.5].map((intensity) => ({ ...request, additions: [{ ...addition, intensity }] })),
        { ...request, additions: [addition, addition] }, { ...request, orderedSymptomIds: [addition.id] },
        { ...request, additions: [{ ...addition, id: foreign.symptoms[0]!.id }],
          orderedSymptomIds: [group.symptoms[0]!.id, foreign.symptoms[0]!.id] },
      ];
      for (const input of invalid) {
        await expect(port.commitMembershipRevision(input)).rejects.toThrow();
        expect(await fresh().getGroup(group.id)).toEqual(group);
      }
      // The rejected requests did not reserve the operation UUID.
      expect((await port.commitMembershipRevision(request)).symptoms).toHaveLength(2);
      expect(await fresh().getGroup(foreign.id)).toEqual(foreign);
    });
    it("commits new membership with its fresh No, preserving old values and exact retry after later reorder", async () => {
      const { port, fresh } = makePorts();
      const group: SymptomGroup = { id: crypto.randomUUID(), name: "Continuity", revision: 0,
        created_at: "2026-10-20T00:00:00.000Z", joint_treatment_muscle_test: "together",
        joint_treatment_test_at: "2026-10-20T00:00:00.000Z",
        symptoms: [{ id: crypto.randomUUID(), name: "Old zero", polarity: "positive", intensity: 0,
          rated_at: "2026-10-20T00:00:00.000Z" }] };
      await port.saveGroup(group);
      const addition = { id: crypto.randomUUID(), name: "New", polarity: "negative" as const, intensity: 7 };
      const request = { operationId: crypto.randomUUID(), groupId: group.id, expectedRevision: 0,
        expectedMembershipRevision: 0, additions: [addition], orderedSymptomIds: [addition.id, group.symptoms[0]!.id],
        answer: "split_suggested" as const, answeredAt: "2026-10-26T10:00:00.000Z" };
      const engine = new GroupEngine(port);
      const committed = await engine.commitMembershipRevision(request);
      expect(committed).toMatchObject({ revision: 1, membership_revision: 1,
        joint_treatment_membership_revision: 1, joint_treatment_muscle_test: "split_suggested",
        joint_treatment_test_at: request.answeredAt });
      expect(committed.symptoms).toEqual([{ ...addition, rated_at: request.answeredAt }, group.symptoms[0]]);
      expect(await engine.hasPriorRating(addition.id)).toBe(true);
      const reordered = await port.reorderSymptoms(group.id, [...request.orderedSymptomIds].reverse(), 1);
      await engine.rate(addition.id, { intensity: 0 });
      const latest = (await port.getGroup(group.id))!;
      expect(latest.symptoms.map((s) => s.id)).toEqual(reordered.symptoms.map((s) => s.id));
      expect(await engine.commitMembershipRevision({ ...request, additions: [{ intensity: 7,
        polarity: "negative", name: "New", id: addition.id }] })).toEqual(latest);
      await expect(port.commitMembershipRevision({ ...request, answer: "together" })).rejects.toThrow();
      await expect(port.saveGroup({ ...latest, membership_revision: undefined,
        joint_treatment_membership_revision: undefined })).rejects.toBeInstanceOf(InvalidMembershipRevisionError);
      await expect(port.saveGroup({ ...latest, revision: 0, name: "Stale snapshot", membership_revision: undefined,
        joint_treatment_membership_revision: undefined })).rejects.toBeInstanceOf(GroupRevisionConflictError);
      expect(await fresh().getGroup(group.id)).toEqual(latest);
    });
  });
}
