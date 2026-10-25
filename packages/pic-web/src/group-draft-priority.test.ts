// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { LocalGuestRepository } from "pic-adapter-local-guest";
import { GroupEngine, GroupRevisionConflictError } from "pic-engine";
import { createGroupStaging } from "./group-staging";
import { createAuthenticatedDraft, readAuthenticatedDraft } from "./authenticated-draft";
import { createAuthLifecycle } from "./auth-lifecycle";

afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

it("stages a complete reordered aggregate through GroupEngine without writing intermediate rows", async () => {
  const port = new LocalGuestRepository();
  const save = vi.spyOn(port, "saveGroup");
  const staging = createGroupStaging(port);
  const engine = new GroupEngine(staging.port);
  const group = await staging.build(async () => {
    const id = await engine.createDraftGroup("One snapshot");
    const first = await engine.addSymptom(id, "First");
    const last = await engine.addSymptom(id, "Last");
    const before = (await staging.port.getGroup(id))!;
    await engine.reorderSymptoms(id, [last, first], before.revision!);
    await expect(staging.port.saveGroup({ ...before, name: "Stale" })).rejects.toBeInstanceOf(GroupRevisionConflictError);
    return id;
  });
  expect(group.symptoms.map(({ name }) => name)).toEqual(["Last", "First"]);
  expect(save).not.toHaveBeenCalled();
  await port.saveGroup(group);
  expect((await new LocalGuestRepository().getGroup(group.id))?.symptoms).toEqual(group.symptoms);
});

async function draftFixture() {
  const client = createClient("https://draft.invalid", "fixture-public", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const user = { id: "owner", email_confirmed_at: "2026-10-25", app_metadata: {}, user_metadata: {},
    aud: "authenticated", created_at: "2026-10-25" };
  vi.spyOn(client.auth, "getUser").mockResolvedValue({ data: { user }, error: null });
  const auth = createAuthLifecycle(() => client, () => {});
  await auth.verify(); auth.bind(user.id);
  const cloud = new LocalGuestRepository();
  const save = vi.spyOn(cloud, "saveGroup");
  const draft = createAuthenticatedDraft(null, auth);
  const port = draft.decorate(cloud, user.id);
  const engine = new GroupEngine(port);
  const id = await engine.createDraftGroup("Unanswered");
  const first = await engine.addSymptom(id, "First");
  const last = await engine.addSymptom(id, "Last");
  return { draft, port, engine, id, first, last, save, cloud, auth };
}

it("keeps authenticated reorder local until the actual joint answer and protects the frozen flush", async () => {
  const f = await draftFixture();
  const before = (await f.port.getGroup(f.id))!;
  const ordered = await f.engine.reorderSymptoms(f.id, [f.last, f.first], before.revision!);
  expect(ordered.symptoms.map(({ id }) => id)).toEqual([f.last, f.first]);
  expect(readAuthenticatedDraft()?.group).toEqual(ordered);
  expect(f.save).not.toHaveBeenCalled();
  await expect(f.port.saveGroup({ ...before, name: "Stale" })).rejects.toBeInstanceOf(GroupRevisionConflictError);
  f.save.mockRejectedValueOnce(new Error("Lost connection"));
  await expect(f.engine.setJointTreatmentMuscleTest(f.id, "together")).rejects.toThrow("Lost connection");
  const frozen = (await f.port.getGroup(f.id))!;
  await expect(f.engine.reorderSymptoms(f.id, [f.first, f.last], frozen.revision!)).rejects.toThrow("pending");
  expect(f.draft.store.getSnapshot()?.group).toEqual(frozen);
  await f.draft.retrySave();
  expect(f.save.mock.calls[1]![0]).toEqual(f.save.mock.calls[0]![0]);
  const anchored = (await f.port.getGroup(f.id))!;
  await f.engine.reorderSymptoms(f.id, [f.first, f.last], anchored.revision!);
  expect((await f.cloud.getGroup(f.id))?.symptoms.map(({ id }) => id)).toEqual([f.first, f.last]);
});
