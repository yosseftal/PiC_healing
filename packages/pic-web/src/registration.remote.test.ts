// @vitest-environment jsdom
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { FinalizedSymptomGroup, PlayerSession } from "pic-engine";
import { expect, it, vi } from "vitest";

it("new signup confirms the same owner then bootstraps its own profile and promotes linked/unlinked work once", async () => {
  const email = process.env.PIC_REGISTRATION_TEST_EMAIL;
  if (!email) throw new Error("PIC_REGISTRATION_TEST_EMAIL must name an authorized, genuinely new controlled signup address");
  const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).flatMap((line) => {
    const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    return match ? [[match[1]!, match[2]!.replace(/^['"]|['"]$/g, "")]] : [];
  }));
  const clientFor = (key: string, storageKey: string) => createClient(env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey },
  });
  const admin = clientFor(env.SUPABASE_SERVICE_ROLE_KEY!, `registration-admin-${randomUUID()}`);
  const client = clientFor(env.SUPABASE_ANON_KEY!, `registration-browser-${randomUUID()}`);
  const otherDevice = clientFor(env.SUPABASE_ANON_KEY!, `registration-other-device-${randomUUID()}`);
  const password = `isolated-${randomUUID()}`;
  const fixtureMarker = randomUUID();
  const startedAt = Date.now();
  let userId: string | undefined;
  let ownedUserId: string | undefined;
  let signupAttempted = false;
  const findControlledAddress = async () => {
    for (let page = 1; ; page++) {
      const listed = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (listed.error) throw new Error("Cannot establish isolated signup address ownership");
      const found = listed.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
      if (found) return found;
      if (listed.data.users.length < 1000) return null;
    }
  };
  if (await findControlledAddress()) {
    throw new Error("The controlled address is already registered; provide a fresh authorized alias");
  }
  const actualSignUp = client.auth.signUp.bind(client.auth);
  vi.spyOn(client.auth, "signUp").mockImplementation(async (credentials) => {
    signupAttempted = true;
    const result = await actualSignUp({ ...credentials, options: { ...credentials.options,
      data: { ...credentials.options?.data, pic_test_fixture: fixtureMarker },
    } });
    userId = result.data.user?.id;
    if (result.error) throw new Error(`Real signup unavailable: ${result.error.code ?? result.error.status}`);
    expect(result.data.session === null).toBe(true);
    expect(Boolean(result.data.user?.email_confirmed_at)).toBe(false);
    const created = await findControlledAddress();
    if (!created || created.id !== userId || created.user_metadata.pic_test_fixture !== fixtureMarker ||
      Date.parse(created.created_at) < startedAt - 1000) throw new Error("Cannot prove ownership of new signup fixture");
    ownedUserId = created.id;
    return result;
  });
  vi.stubEnv("VITE_SUPABASE_URL", env.SUPABASE_URL!);
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", env.SUPABASE_ANON_KEY!);
  const failures: unknown[] = [];
  const cleanupFixture = async () => {
    if (!ownedUserId && signupAttempted) {
      const created = await findControlledAddress();
      if (created && (!userId || created.id === userId) && created.user_metadata.pic_test_fixture === fixtureMarker &&
        Date.parse(created.created_at) >= startedAt - 1000) ownedUserId = created.id;
    }
    if (ownedUserId) {
      for (const table of ["timeline_events", "personal_treatment_library", "player_sessions", "symptom_groups"]) {
        const removed = await admin.from(table).delete().eq("user_id", ownedUserId);
        if (removed.error) throw new Error(`Isolated signup ${table} cleanup failed`);
      }
      const deleted = await admin.auth.admin.deleteUser(ownedUserId);
      if (deleted.error) throw new Error("Isolated signup Auth cleanup failed");
    }
  };
  try {
    const catalog = await admin.from("treatments").select("id").is("user_id", null).limit(1).single();
    if (catalog.error || !catalog.data) throw new Error("Real signup fixture requires an existing Global treatment");
    for (const linked of [true, false]) {
      vi.resetModules();
      localStorage.clear();
      const path = await import("./promote-path");
      vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(client);
      const { compositionRoot: root } = await import("./composition-root");
      const group: FinalizedSymptomGroup = {
        id: randomUUID(), name: "Isolated registration inquiry", symptoms: [], created_at: "2026-10-15T00:00:00Z",
        joint_treatment_muscle_test: "together", joint_treatment_test_at: "2026-10-15T00:00:00Z",
      };
      const session: PlayerSession = {
        id: randomUUID(), treatment_id: catalog.data.id as string, linked_group_id: linked ? group.id : null,
        units: [{ unit_id: "one", state: "completed" }, { unit_id: "two", state: "skipped" }],
        terminal_nemar_response: linked ? "yes" : "no", success_declared: false,
        finished_at: null, integrating_reason: null,
      };
      if (linked) await root.repositoryPort.saveGroup(group);
      await root.repositoryPort.savePlayerSession(session);
      await root.sessionEngineActions.onFinishRequested(session.id, linked ? "finish" : "finishAnyway");
      if (linked) {
        await root.promotePathActions.register({ name: "  New Event Manager  ", email, password });
        expect(Boolean(userId)).toBe(true);
        const missing = await admin.from("profiles").select("id").eq("id", userId!).maybeSingle();
        expect(missing.error === null && missing.data === null).toBe(true);
        for (const table of ["symptom_groups", "player_sessions", "timeline_events", "personal_treatment_library"]) {
          const rows = await admin.from(table).select("id").eq("user_id", userId!);
          expect(rows.error === null && rows.data?.length === 0).toBe(true);
        }
        const link = await admin.auth.admin.generateLink({ type: "signup", email, password });
        if (link.error) throw new Error(`Verification facility unavailable: ${link.error.code ?? link.error.status}`);
        expect(link.data.user.id === userId).toBe(true);
        const verified = await otherDevice.auth.verifyOtp({ type: "signup", token_hash: link.data.properties.hashed_token });
        if (verified.error) throw new Error(`Real confirmation unavailable: ${verified.error.code ?? verified.error.status}`);
        expect(verified.data.user?.id === userId && Boolean(verified.data.user?.email_confirmed_at)).toBe(true);
        expect((await client.auth.getSession()).data.session === null).toBe(true);
      }
      await root.promotePathActions.signInAndPromote({ email, password });
      expect(root.sessionEngineStore.getSnapshot().promotionStatus).toBe("succeeded");
      const owner = await path.getVerifiedUser(client);
      expect(owner.id === userId).toBe(true);
      const profile = await client.from("profiles").select("full_name").eq("id", userId!).single();
      expect(profile.data?.full_name).toBe("New Event Manager");
      const port = path.createSupabaseRepositoryFromClient(client);
      const saved = await port.getPlayerSession(session.id);
      expect(saved?.success_declared).toBe(true);
      expect(saved?.units).toEqual(session.units);
      expect(saved?.terminal_nemar_response).toBe(linked ? "yes" : "no");
      expect(saved?.linked_group_id).toBe(linked ? group.id : null);
      await expect(root.promotePathActions.signInAndPromote()).rejects.toThrow("pending work");
      const timeline = await client.from("timeline_events").select("id").eq("user_id", userId!);
      const library = await client.from("personal_treatment_library").select("use_count").eq("user_id", userId!);
      expect(timeline.data?.length).toBe(linked ? 1 : 2);
      expect(library.data?.map((row) => row.use_count)).toEqual([linked ? 1 : 2]);
      expect(root.verificationStore.getSnapshot()).toBeNull();
      expect(localStorage.getItem("pic:guest-repository:v1")).toBeNull();
    }
  } catch (error) {
    failures.push(error);
  } finally {
    vi.restoreAllMocks(); vi.unstubAllEnvs(); localStorage.clear();
    try { await cleanupFixture(); } catch (error) { failures.push(error); }
  }
  if (failures.length) throw new AggregateError(failures, "Isolated signup verification or cleanup failed");
}, 30000);
