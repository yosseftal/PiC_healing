import { expect, type Page } from "@playwright/test";
import type { FinalizedSymptomGroup, PlayerSession, Symptom } from "pic-engine";
import { TRACER_BULLET_SEED_TREATMENTS } from "pic-engine";

type Row = Record<string, unknown>;
export interface PromotionPayload {
  p_guest_group: Omit<FinalizedSymptomGroup, "symptoms"> | null;
  p_symptoms: Symptom[];
  p_player_session: PlayerSession;
  p_new_user_id: string;
}

/** HTTP-only fixture. No application action, engine, repository method, or provider is replaced. */
export async function installJourneyTransport(page: Page) {
  const user = { id: "wave12-owner", email: "journey@example.com", aud: "authenticated", app_metadata: {},
    user_metadata: { full_name: "Journey Event Manager" }, created_at: "2026-10-15T00:00:00Z" };
  const tables: Record<string, Row[]> = {
    profiles: [], symptom_groups: [], symptoms: [], player_sessions: [], personal_treatment_library: [], timeline_events: [],
    treatments: TRACER_BULLET_SEED_TREATMENTS.map((treatment) => ({ ...treatment })),
  };
  const promotions: PromotionPayload[] = [];
  const requests: { table: string; method: string }[] = [];
  let confirmed = false;
  let signups = 0;
  let logins = 0;
  let failPromotion = false;
  await page.route("**/auth/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/signup")) {
      signups++;
      expect(route.request().postDataJSON()).toMatchObject({ email: user.email,
        password: "  exact password  ", data: { full_name: user.user_metadata.full_name } });
      await route.fulfill({ json: user });
    } else if (path.endsWith("/token")) {
      logins++;
      if (!confirmed) {
        await route.fulfill({ status: 400, headers: { "x-supabase-api-version": "2024-01-01",
          "access-control-expose-headers": "x-supabase-api-version" },
          json: { code: "email_not_confirmed", msg: "Email not confirmed" } });
        return;
      }
      const token = [btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })),
        btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })), "fixture"].join(".");
      await route.fulfill({ json: { user: { ...user, email_confirmed_at: user.created_at }, access_token: token,
        refresh_token: "fixture-refresh", expires_in: 3600, token_type: "bearer" } });
    } else if (path.endsWith("/user")) {
      await route.fulfill({ json: confirmed ? { ...user, email_confirmed_at: user.created_at } : user });
    } else throw new Error(`Unexpected Auth request: ${path}`);
  });
  await page.route("**/rest/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const table = url.pathname.split("/").at(-1)!;
    const method = request.method();
    requests.push({ table, method });
    if (table === "promote_guest_to_account") {
      const payload = request.postDataJSON() as PromotionPayload;
      promotions.push(payload);
      if (failPromotion) {
        failPromotion = false;
        await route.fulfill({ status: 503, json: { message: "Temporarily unavailable" } });
        return;
      }
      const session = payload.p_player_session;
      const owner = payload.p_new_user_id;
      expect(owner).toBe(user.id);
      if (payload.p_guest_group) {
        tables.symptom_groups!.push({ ...payload.p_guest_group, user_id: owner });
        tables.symptoms!.push(...payload.p_symptoms.map((symptom) => ({
          ...symptom, group_id: payload.p_guest_group!.id, user_id: owner,
        })));
      }
      tables.player_sessions!.push({ ...session, user_id: owner });
      tables.personal_treatment_library!.push({ id: "journey-library", user_id: owner, treatment_id: session.treatment_id,
        use_count: 1, provenance: { source: "standalone", first_seen_at: user.created_at },
        used_increment_idempotency_keys: [], promoted_session_ids: [session.id], variant_type: "original",
        global_reference_id: session.treatment_id, protocol_content: null, created_at: user.created_at });
      tables.timeline_events!.push({ id: session.id, user_id: owner, log_type: "execution",
        treatment_id: session.treatment_id, library_row_id: "journey-library", linked_group_id: session.linked_group_id,
        metadata: { player_session_id: session.id }, created_at: user.created_at });
      await route.fulfill({ json: { group_id: payload.p_guest_group?.id ?? null, session_id: session.id,
        library_row_id: "journey-library", timeline_event_id: session.id } });
      return;
    }
    const rows = tables[table];
    if (!rows) throw new Error(`Unexpected REST table: ${table}`);
    const matches = (row: Row) => [...url.searchParams].every(([key, value]) => {
      if (value.startsWith("eq.")) return String(row[key]) === value.slice(3);
      if (value.startsWith("not.in.")) return !value.slice(8, -1).split(",").includes(String(row[key]));
      return true;
    });
    if (method === "GET") {
      const selected = rows.filter(matches);
      const single = request.headers().accept?.includes("vnd.pgrst.object");
      await route.fulfill({ json: single ? selected[0] ?? null : selected });
    } else if (method === "POST") {
      const body = request.postDataJSON() as Row | Row[];
      for (const row of Array.isArray(body) ? body : [body]) {
        expect(table === "profiles" ? row.id : row.user_id).toBe(user.id);
        const existing = rows.find((entry) => entry.id === row.id);
        if (existing) Object.assign(existing, row);
        else rows.push(row);
      }
      await route.fulfill({ status: 201, body: "" });
    } else if (method === "DELETE") {
      tables[table] = rows.filter((row) => !matches(row));
      await route.fulfill({ status: 204 });
    } else throw new Error(`Unexpected REST method: ${method} ${table}`);
  });
  return { tables, promotions, requests, user, confirm: () => { confirmed = true; },
    failNextPromotion: () => { failPromotion = true; },
    counts: () => ({ signups, logins }) };
}
