/**
 * Ticket 01 — direct Supabase-client round-trip tests for `public.symptoms.rated_at`.
 * Intentionally **not** routed through `SupabaseRepository` (adapter mapping is Ticket 02).
 *
 * `.env.local` loading mirrors `supabase-repository.test.ts` / `scripts/wave6-supabase-audit.mjs`.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

function loadEnvLocal(path: string): Record<string, string> {
  const content = readFileSync(path, "utf8");
  const env: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const envPath = fileURLToPath(new URL("../../../.env.local", import.meta.url));
const env = loadEnvLocal(envPath);
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "symptoms-rated-at-schema.test.ts: missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY " +
      "in .env.local - see ticket 12's Connectivity section.",
  );
}

const serviceClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USER_PASSWORD = `pic-healing-test-${randomUUID()}`;

interface TestUser {
  userId: string;
  client: SupabaseClient;
}

const createdTestUserIds: string[] = [];

async function createAuthenticatedTestUser(): Promise<TestUser> {
  const email = `pic-healing-test-${randomUUID()}@example.com`;
  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password: TEST_USER_PASSWORD,
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw new Error(`Failed to create ephemeral test user: ${createError?.message ?? "no user returned"}`);
  }
  const userId = created.user.id;
  createdTestUserIds.push(userId);

  const { error: profileError } = await serviceClient.from("profiles").insert({ id: userId });
  if (profileError) {
    throw new Error(`Failed to seed profiles row for ephemeral test user: ${profileError.message}`);
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password: TEST_USER_PASSWORD,
  });
  if (signInError) {
    throw new Error(`Failed to sign in ephemeral test user: ${signInError.message}`);
  }

  return { userId, client: anonClient };
}

afterAll(async () => {
  await Promise.all(createdTestUserIds.map((userId) => serviceClient.auth.admin.deleteUser(userId)));
});

describe("symptoms.rated_at column (ticket 01 — direct Supabase client)", () => {
  let user: TestUser;
  let groupId: string;

  beforeAll(async () => {
    user = await createAuthenticatedTestUser();
    groupId = randomUUID();
    const { error } = await user.client.from("symptom_groups").insert({
      id: groupId,
      user_id: user.userId,
      name: "Rated-at schema fixture group",
      joint_treatment_muscle_test: "together",
      joint_treatment_test_at: new Date().toISOString(),
    });
    if (error) {
      throw new Error(`Failed to seed symptom_groups fixture: ${error.message}`);
    }
  });

  it("a symptoms row written with a rated_at timestamp reads that exact value back", async () => {
    const symptomId = randomUUID();
    const ratedAt = "2026-08-14T10:30:00.000Z";

    const { error: insertError } = await user.client.from("symptoms").insert({
      id: symptomId,
      group_id: groupId,
      user_id: user.userId,
      name: "Lower Back Pain",
      polarity: "negative",
      intensity: 6,
      rated_at: ratedAt,
    });
    expect(insertError).toBeNull();

    const { data, error: selectError } = await user.client
      .from("symptoms")
      .select("rated_at")
      .eq("id", symptomId)
      .single();
    expect(selectError).toBeNull();
    expect(new Date(data?.rated_at ?? "").toISOString()).toBe(ratedAt);
  });

  it("a symptoms row written with no rated_at reads back as null (existing rows unaffected)", async () => {
    const symptomId = randomUUID();

    const { error: insertError } = await user.client.from("symptoms").insert({
      id: symptomId,
      group_id: groupId,
      user_id: user.userId,
      name: "Neck Tension",
      polarity: "positive",
      intensity: 3,
    });
    expect(insertError).toBeNull();

    const { data, error: selectError } = await user.client
      .from("symptoms")
      .select("rated_at")
      .eq("id", symptomId)
      .single();
    expect(selectError).toBeNull();
    expect(data?.rated_at).toBeNull();
  });
});
