import { runMembershipRevisionContract } from "pic-engine/test/contract/membership-revision.contract";
import { LocalGuestRepository } from "./index";
import { expect, it } from "vitest";
import { GroupEngine } from "pic-engine";
runMembershipRevisionContract(() => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); } };
  return { port: new LocalGuestRepository({ storage }), fresh: () => new LocalGuestRepository({ storage }) };
});

it("keeps the old committed group and receipt absent when storage fails, then retries the same frozen request", async () => {
  const values = new Map<string, string>();
  let fail = false;
  const storage = { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { if (fail) throw new Error("storage unavailable"); values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); } };
  const port = new LocalGuestRepository({ storage });
  const engine = new GroupEngine(port);
  const id = await engine.createDraftGroup("Atomic initial");
  await engine.setJointTreatmentMuscleTest(id, "together");
  const before = (await port.getGroup(id))!;
  const addition = { id: crypto.randomUUID(), name: "New", polarity: "negative" as const, intensity: 2 };
  const request = { operationId: crypto.randomUUID(), groupId: id, expectedRevision: before.revision!,
    expectedMembershipRevision: 0, additions: [addition], orderedSymptomIds: [addition.id],
    answer: "split_suggested" as const, answeredAt: "2026-10-26T10:00:00.000Z" };
  fail = true;
  await expect(engine.commitMembershipRevision(request)).rejects.toThrow("storage unavailable");
  expect(await port.getGroup(id)).toEqual(before);
  await expect(engine.hasPriorRating(addition.id)).rejects.toThrow();
  fail = false;
  const committed = await engine.commitMembershipRevision(request);
  expect((await new LocalGuestRepository({ storage }).commitMembershipRevision(request))).toEqual(committed);
  expect(committed.symptoms).toHaveLength(1);
});

it("atomically replaces only initial unanswered assembly with its full retained permutation and additions", async () => {
  const port = new LocalGuestRepository();
  const engine = new GroupEngine(port);
  const id = await engine.createDraftGroup("Initial assembly");
  const first = await engine.addSymptom(id, "First");
  const second = await engine.addSymptom(id, "Second");
  const base = (await port.getGroup(id))!;
  const addition = { id: crypto.randomUUID(), name: "New", polarity: "negative" as const,
    intensity: 4, rated_at: "2026-10-26T10:00:00.000Z" };
  await port.saveGroup({ ...base, symptoms: [base.symptoms[1]!, addition, base.symptoms[0]!] });
  const committed = (await port.getGroup(id))!;
  expect(committed.symptoms.map((s) => s.id)).toEqual([second, addition.id, first]);
  expect(committed.revision).toBe(base.revision! + 1);
  expect(committed).not.toHaveProperty("membership_revision");
  await engine.setJointTreatmentMuscleTest(id, "together");
  await expect(port.saveGroup({ ...(await port.getGroup(id))!, joint_treatment_muscle_test: null,
    joint_treatment_test_at: null })).rejects.toThrow();
});
