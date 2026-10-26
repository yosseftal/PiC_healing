// @vitest-environment jsdom
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { GroupEngine } from "pic-engine";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { createAuthLifecycle } from "./auth-lifecycle";
import { createSupabaseRepositoryFromClient, ensureOwnProfile, getVerifiedUser } from "./promote-path";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).flatMap((line) => {
  const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
  return match ? [[match[1]!, match[2]!.replace(/^['"]|['"]$/g, "")]] : [];
}));
const marker = randomUUID();
const admin = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false, storageKey: `identity-admin-${marker}` },
});
const client = createClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
  auth: { persistSession: true, autoRefreshToken: false, storageKey: `identity-browser-${marker}` },
});
const email = `pic-returning-${marker}@example.com`;
const password = `isolated-${randomUUID()}`;
let userId: string | undefined;
let treatmentId: string;
let root: typeof import("./composition-root").compositionRoot;
let groupId: string;
let releaseRoot: () => void = () => undefined;
let staged: import("pic-engine").SymptomGroup | null;
let symptom: string;

beforeAll(async () => {
  const created = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { pic_test_fixture: marker },
  });
  if (created.error || !created.data.user) throw new Error("Returning identity fixture creation failed");
  userId = created.data.user.id;
  const login = await client.auth.signInWithPassword({ email, password });
  if (login.error) throw new Error("Returning identity fixture login failed");
  await ensureOwnProfile(client, await getVerifiedUser(client));
  const catalog = await admin.from("treatments").select("id").is("user_id", null).limit(1).single();
  if (catalog.error || !catalog.data) throw new Error("Returning fixture requires a Global treatment");
  treatmentId = String(catalog.data.id);
});

afterAll(async () => {
  releaseRoot();
  vi.restoreAllMocks(); vi.unstubAllEnvs();
  if (!userId) return;
  const owned = await admin.auth.admin.getUserById(userId);
  if (owned.error || owned.data.user.user_metadata.pic_test_fixture !== marker) {
    throw new Error("Returning fixture cleanup cannot establish marker ownership");
  }
  for (const table of ["timeline_events", "personal_treatment_library", "player_sessions", "symptom_groups"]) {
    const removed = await admin.from(table).delete().eq("user_id", userId);
    if (removed.error) throw new Error(`Returning fixture ${table} cleanup failed`);
  }
  const deleted = await admin.auth.admin.deleteUser(userId);
  if (deleted.error) throw new Error("Returning fixture Auth cleanup failed");
  localStorage.clear();
});

it("restores SDK identity and reauthenticates the same real owner; raw unanswered drafts retain the 23502 constraint",
async () => {
  const restored = createClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: true, autoRefreshToken: false, storageKey: `identity-browser-${marker}` },
  });
  const lifecycle = createAuthLifecycle(() => restored, () => undefined);
  lifecycle.bind(userId!);
  const release = lifecycle.start();
  try {
    await vi.waitFor(() => expect(lifecycle.store.getSnapshot()).toEqual({
      status: "verified", owner: userId, revision: expect.any(Number),
    }));
    const originalRevision = lifecycle.store.getSnapshot().revision;
    const signedOut = await restored.auth.signOut();
    if (signedOut.error) throw new Error("Returning fixture sign-out failed");
    await vi.waitFor(() => expect(lifecycle.store.getSnapshot().status).toBe("reauthenticate"));
    await expect(lifecycle.verify()).rejects.toThrow("Verified sign-in");
    const again = await restored.auth.signInWithPassword({ email, password });
    if (again.error) throw new Error("Returning fixture reauthentication failed");
    await lifecycle.verify();
    expect(lifecycle.store.getSnapshot()).toEqual({ status: "verified", owner: userId, revision: expect.any(Number) });
    expect(lifecycle.store.getSnapshot().revision).toBeGreaterThan(originalRevision);
    const loginAgain = await client.auth.signInWithPassword({ email, password });
    if (loginAgain.error) throw new Error("Returning original fixture reauthentication failed");
  } finally { release(); }
  const engine = new GroupEngine(createSupabaseRepositoryFromClient(client));
  let rejection: unknown;
  try { await engine.createDraftGroup("Isolated unanswered draft"); } catch (error) { rejection = error; }
  expect(rejection instanceof Error ? rejection.cause : null).toMatchObject({ code: "23502" });
});

it("promotes at a real Gate then stages exact new group/symptom/rating UUIDs until the real answer saves them",
async () => {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", env.SUPABASE_URL!);
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", env.SUPABASE_ANON_KEY!);
  const path = await import("./promote-path");
  vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(client);
  root = (await import("./composition-root")).compositionRoot;
  releaseRoot = root.authLifecycle.start();
  await vi.waitFor(() => expect(root.promotePathActions.hasVerifiedIdentity()).toBe(true));
  const initial = await root.playerEngineActions.startSession(treatmentId, null, ["one"]);
  await root.sessionEngineActions.onFinishRequested(initial, "finishAnyway");
  await root.promotePathActions.signInAndPromote();
  expect(root.sessionEngineStore.getSnapshot().mode).toBe("authenticated");
  await root.inquiryResetActions.resetInquiry(true);
});

it("stages the new authenticated group and ratings without therapeutic server rows before the real answer",
async () => {
  groupId = await root.groupEngineActions.createDraftGroup("Real staged returning group");
  symptom = await root.groupEngineActions.addSymptom(groupId, "Real returning symptom");
  await root.groupEngineActions.rate(symptom, { polarity: "positive", intensity: 7 });
  staged = await root.groupEngineActions.getGroup(groupId);
  expect(staged?.joint_treatment_muscle_test).toBeNull();
  const absent = await client.from("symptom_groups").select("id").eq("id", groupId);
  expect(absent.error).toBeNull(); expect(absent.data).toEqual([]);
  const absentSymptoms = await client.from("symptoms").select("id").eq("group_id", groupId);
  expect(absentSymptoms.error).toBeNull(); expect(absentSymptoms.data).toEqual([]);
});

it("saves the exact staged UUIDs and ratings through the unchanged authenticated port after the real answer",
async () => {
  await root.groupEngineActions.setJointTreatmentMuscleTest(groupId, "together");
  await root.groupEngineActions.finalizeGroup(groupId);
  const anchored = await root.groupEngineActions.getGroup(groupId);
  expect(anchored).toEqual({ ...staged, revision: staged!.revision! + 1, joint_treatment_muscle_test: "together",
    joint_treatment_test_at: expect.any(String) });
  expect(anchored?.symptoms[0]).toMatchObject({ id: symptom, polarity: "positive", intensity: 7 });
  expect(root.authenticatedDraft.store.getSnapshot()).toBeNull();
  const timeline = await client.from("timeline_events").select("id").eq("user_id", userId!);
  expect(timeline.error).toBeNull(); expect(timeline.data).toHaveLength(1);
});

it("finishes the subsequent linked authenticated Player once without another promotion and preserves the saved group",
async () => {
  const id = await root.playerEngineActions.startSession(treatmentId, groupId, ["one"]);
  await root.sessionEngineActions.onFinishRequested(id, "finishAnyway");
  const timeline = await client.from("timeline_events").select("id").eq("user_id", userId!);
  expect(timeline.error).toBeNull(); expect(timeline.data).toHaveLength(2);
  const library = await client.from("personal_treatment_library").select("use_count").eq("user_id", userId!).single();
  expect(library.error).toBeNull(); expect(library.data?.use_count).toBe(2);
  expect(root.sessionEngineStore.getSnapshot().mode).toBe("authenticated");
  const group = await root.groupEngineActions.getGroup(groupId);
  await root.inquiryResetActions.resetInquiry(true);
  expect(await root.groupEngineActions.getGroup(groupId)).toEqual(group);
});
