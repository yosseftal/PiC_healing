// @vitest-environment jsdom
/**
 * Wave 8 Ticket 08-09: continuous happy-path integration — Guest bootstrap through atomic promotion.
 * Skips when `.env.local` remote credentials are unavailable.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DEFAULT_GUEST_STORAGE_KEY } from "pic-adapter-local-guest";
import { TERMINAL_NEMAR_UNIT_ID, TRACER_BULLET_SEED_TREATMENTS } from "pic-engine";
import { AppProviders } from "./app-providers";
import { compositionRoot } from "./composition-root";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";
import { GuestFlowRouter } from "./guest-flow-router";
import { GuestModeShell } from "./GuestModeShell";

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

function assignTracerEnv(env: Record<string, string>, email: string, password: string): void {
  const pairs: Record<string, string> = {
    SUPABASE_URL: env.SUPABASE_URL ?? "",
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY ?? "",
    VITE_SUPABASE_URL: env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? "",
    VITE_SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? "",
    PIC_TRACER_TEST_USER_EMAIL: email,
    PIC_TRACER_TEST_USER_PASSWORD: password,
    VITE_PIC_TRACER_TEST_USER_EMAIL: email,
    VITE_PIC_TRACER_TEST_USER_PASSWORD: password,
  };
  for (const [key, value] of Object.entries(pairs)) {
    if (value !== "") {
      vi.stubEnv(key, value);
      (import.meta.env as Record<string, string>)[key] = value;
    }
  }
}

function renderHappyPathApp() {
  return render(
    <AppProviders>
      <GuestModeShell>
        <GuestFlowRouter />
      </GuestModeShell>
    </AppProviders>,
  );
}

const envPath = join(process.cwd(), ".env.local");
let remoteEnv: Record<string, string> | null = null;
try {
  remoteEnv = loadEnvLocal(envPath);
} catch {
  remoteEnv = null;
}

const hasRemoteCredentials =
  remoteEnv !== null &&
  remoteEnv.SUPABASE_URL !== undefined &&
  remoteEnv.SUPABASE_ANON_KEY !== undefined &&
  remoteEnv.SUPABASE_SERVICE_ROLE_KEY !== undefined;

describe.skipIf(!hasRemoteCredentials)("happy path E2E (Ticket 08-09)", () => {
  const TEST_USER_PASSWORD = `pic-happy-path-${randomUUID()}`;
  let serviceClient: SupabaseClient;
  let testEmail: string;
  let testUserId: string;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const env = remoteEnv!;
    serviceClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    testEmail = `pic-happy-path-${randomUUID()}@example.com`;
    const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
      email: testEmail,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
    });
    if (createError !== null || created.user === null) {
      throw new Error(`Failed to create ephemeral test user: ${createError?.message ?? "no user"}`);
    }
    testUserId = created.user.id;

    const { error: profileError } = await serviceClient.from("profiles").insert({ id: testUserId });
    if (profileError !== null) {
      throw new Error(`Failed to seed profiles row: ${profileError.message}`);
    }

    assignTracerEnv(env, testEmail, TEST_USER_PASSWORD);
  });

  afterAll(async () => {
    if (serviceClient !== undefined && testUserId !== undefined) {
      await serviceClient.from("timeline_events").delete().eq("user_id", testUserId);
      await serviceClient.from("personal_treatment_library").delete().eq("user_id", testUserId);
      await serviceClient.from("player_sessions").delete().eq("user_id", testUserId);
      await serviceClient.from("symptom_groups").delete().eq("user_id", testUserId);
      await serviceClient.auth.admin.deleteUser(testUserId);
    }
    vi.unstubAllEnvs();
  });

  it(
    "runs Guest → symptoms → joint test → summary → player → gate → promotion → cloud verification",
    async () => {
      localStorage.clear();
      resetGuestFlowFactsForTest();
      fetchSpy = vi.spyOn(globalThis, "fetch");
      const guestPhaseFetchBaseline = fetchSpy.mock.calls.length;

      const seedTreatment = TRACER_BULLET_SEED_TREATMENTS[0]!;

      renderHappyPathApp();

      // Step 1–2: Guest bootstrap + symptom group creation (blind-rated)
      fireEvent.change(screen.getByLabelText("Group name"), { target: { value: "E2E Group" } });
      fireEvent.click(screen.getByTestId("confirm-group-name"));

      await waitFor(() => {
        expect(screen.getByLabelText("Symptom name")).toBeTruthy();
      });

      fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "Back Pain" } });
      fireEvent.click(screen.getByTestId("add-symptom-action"));

      await waitFor(() => {
        expect(screen.getByTestId("finish-symptom-addition")).toBeTruthy();
      });

      expect(screen.queryByTestId("revealed-prior-rating")).toBeNull();

      fireEvent.click(screen.getByTestId("finish-symptom-addition"));

      // Joint treatment muscle test — sovereign "Yes" path
      await waitFor(() => {
        expect(screen.getByTestId("muscle-test-yes")).toBeTruthy();
      });
      expect(fetchSpy.mock.calls.length).toBe(guestPhaseFetchBaseline);

      fireEvent.click(screen.getByTestId("muscle-test-yes"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-group-summary")).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId("confirm-group-summary"));

      await waitFor(() => {
        expect(screen.getByTestId("guest-flow-pick-treatment")).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId("link-to-group-toggle"));
      fireEvent.click(screen.getByTestId(`pick-treatment-${seedTreatment.id}`));

      await waitFor(() => {
        expect(screen.getByTestId("guest-flow-player")).toBeTruthy();
      });

      expect(fetchSpy.mock.calls.length).toBe(guestPhaseFetchBaseline);

      // Step 3: Player — forward jump (skipped), revisit, Terminal NEMAR, Finish Anyway
      await waitFor(() => {
        expect(screen.getByTestId("navigation-tree-panel")).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId(`navigation-tree-jump-${TERMINAL_NEMAR_UNIT_ID}`));

      await waitFor(() => {
        const practiceButton = screen.getByTestId("navigation-tree-jump-practice");
        expect(practiceButton.textContent).toContain("skipped");
      });

      fireEvent.click(screen.getByTestId("navigation-tree-jump-practice"));

      await waitFor(() => {
        expect(screen.getByTestId("atomic-unit-practice")).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId(`navigation-tree-jump-${TERMINAL_NEMAR_UNIT_ID}`));

      await waitFor(() => {
        expect(screen.getByTestId("terminal-nemar-unit")).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId("terminal-nemar-no"));
      fireEvent.click(screen.getByTestId("finish-anyway-button"));

      // Step 4: Persistence Gate + promotion
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });

      const fetchBeforePromotion = fetchSpy.mock.calls.length;
      fireEvent.click(screen.getByRole("button", { name: "Sign in (dev tracer stub)" }));

      await waitFor(
        () => {
          expect(compositionRoot.sessionEngineStore.getSnapshot().promotionStatus).toBe("succeeded");
        },
        { timeout: 30_000 },
      );

      expect(fetchSpy.mock.calls.length).toBeGreaterThan(fetchBeforePromotion);

      // Step 5: Persistence verification
      expect(compositionRoot.sessionEngineStore.getSnapshot().mode).toBe("authenticated");
      expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();

      const activeGroupId = compositionRoot.groupEngineStore.getSnapshot().activeGroupId;
      expect(activeGroupId).not.toBeNull();

      const { data: remoteGroup, error: groupError } = await serviceClient
        .from("symptom_groups")
        .select("id, user_id")
        .eq("id", activeGroupId!)
        .maybeSingle();
      expect(groupError).toBeNull();
      expect(remoteGroup?.user_id).toBe(testUserId);

      const { data: libraryRows, error: libraryError } = await serviceClient
        .from("personal_treatment_library")
        .select("treatment_id, use_count")
        .eq("user_id", testUserId);
      expect(libraryError).toBeNull();
      expect(libraryRows).toHaveLength(1);
      expect(libraryRows![0]!.treatment_id).toBe(seedTreatment.id);
      expect(libraryRows![0]!.use_count).toBe(1);

      const { data: timelineRows, error: timelineError } = await serviceClient
        .from("timeline_events")
        .select("id, treatment_id, user_id")
        .eq("user_id", testUserId);
      expect(timelineError).toBeNull();
      expect(timelineRows).toHaveLength(1);
      expect(timelineRows![0]!.treatment_id).toBe(seedTreatment.id);

      const { data: remoteSessions, error: sessionError } = await serviceClient
        .from("player_sessions")
        .select("treatment_id")
        .eq("user_id", testUserId);
      expect(sessionError).toBeNull();
      expect(remoteSessions).toHaveLength(1);
      expect(remoteSessions![0]!.treatment_id).toBe(seedTreatment.id);

      cleanup();
      fetchSpy.mockRestore();
    },
    60_000,
  );
});
