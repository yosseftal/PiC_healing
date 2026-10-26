import { expect, type Page } from "@playwright/test";
import type { FinalizedSymptomGroup, MembershipRevisionInput, PlayerSession, Symptom, SymptomGroup } from "pic-engine";
import { prepareMembershipRevision, membershipRevisionFingerprint, TRACER_BULLET_SEED_TREATMENTS } from "pic-engine";

type Row = Record<string, unknown>;
export interface PromotionPayload {
  p_guest_group: Omit<FinalizedSymptomGroup, "symptoms"> | null;
  p_symptoms: (Symptom & { priority_position?: number })[];
  p_player_session: PlayerSession & { payload_version?: 2 | 3 };
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
  let losePromotionResponse = false;
  let failRevision = false;
  let loseRevisionResponse = false;
  const revisions: MembershipRevisionInput[] = [];
  const revisionReceipts = new Map<string, string>();
  const receipts = new Map<string, { payload: string; result: Row }>();
  const readGroup = (id: string): SymptomGroup | null => {
    const group = tables.symptom_groups!.find((row) => row.id === id && row.user_id === user.id);
    if (!group) return null;
    return { id: group.id, name: group.name, created_at: group.created_at, revision: group.revision ?? 0,
      ...(group.membership_revision === undefined ? {} : {
        membership_revision: group.membership_revision,
        joint_treatment_membership_revision: group.joint_treatment_membership_revision,
      }),
      joint_treatment_muscle_test: group.joint_treatment_muscle_test, joint_treatment_test_at: group.joint_treatment_test_at,
      symptoms: tables.symptoms!.filter((row) => row.group_id === id && row.user_id === user.id)
      .sort((a, b) => Number(a.priority_position) - Number(b.priority_position))
      .map((symptom) => ({ id: symptom.id, name: symptom.name, polarity: symptom.polarity,
        intensity: symptom.intensity, rated_at: symptom.rated_at ?? null })) } as unknown as SymptomGroup;
  };
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
    if (table === "commit_membership_revision") {
      expect(method).toBe("POST");
      const { p_request: input } = request.postDataJSON() as { p_request: MembershipRevisionInput };
      revisions.push(input);
      if (failRevision) {
        failRevision = false;
        await route.fulfill({ status: 503, json: { message: "Temporarily unavailable" } }); return;
      }
      const current = readGroup(input.groupId);
      if (current === null) {
        await route.fulfill({ status: 404, json: { message: "Group not found" } }); return;
      }
      const previous = revisionReceipts.get(input.operationId);
      const fingerprint = membershipRevisionFingerprint(input);
      if (previous !== undefined) {
        expect(fingerprint).toBe(previous);
        await route.fulfill({ json: current }); return;
      }
      if (current.revision !== input.expectedRevision) {
        await route.fulfill({ status: 409, json: { code: "P0001", message: "group_revision_conflict" } }); return;
      }
      const committed = prepareMembershipRevision(current, input);
      const { symptoms, ...group } = committed;
      Object.assign(tables.symptom_groups!.find((row) => row.id === group.id)!, group);
      symptoms.forEach((symptom, priority_position) => {
        const old = tables.symptoms!.find((row) => row.id === symptom.id);
        const saved = { ...symptom, group_id: group.id, user_id: user.id, priority_position };
        if (old) Object.assign(old, saved); else tables.symptoms!.push(saved);
      });
      revisionReceipts.set(input.operationId, fingerprint);
      if (loseRevisionResponse) {
        loseRevisionResponse = false;
        await route.fulfill({ status: 503, json: { message: "Committed response lost" } }); return;
      }
      await route.fulfill({ json: readGroup(group.id) }); return;
    }
    if (["get_symptom_group", "save_symptom_group", "reorder_group_symptoms"].includes(table)) {
      expect(method).toBe("POST");
      const body = request.postDataJSON() as { p_group_id?: string; p_group?: SymptomGroup;
        p_ordered_symptom_ids?: string[]; p_expected_revision?: number };
      const id = body.p_group_id ?? body.p_group!.id;
      const current = readGroup(id);
      if (table === "get_symptom_group") { await route.fulfill({ json: current }); return; }
      const incoming = body.p_group;
      const unchanged = incoming && current && JSON.stringify({ ...incoming, revision: 0 }) ===
        JSON.stringify({ ...current, revision: 0 });
      if (current && !unchanged && (incoming?.revision ?? body.p_expected_revision) !== current.revision) {
        await route.fulfill({ status: 409, json: { code: "P0001", message: "group_revision_conflict" } }); return;
      }
      if (table === "save_symptom_group") {
        if (!unchanged) {
          expect(incoming).toBeDefined();
          if (current) expect(incoming!.symptoms.slice(0, current.symptoms.length).map(({ id }) => id))
            .toEqual(current.symptoms.map(({ id }) => id));
          const { symptoms, ...group } = incoming!;
          const existing = tables.symptom_groups!.find((row) => row.id === id);
          const saved = { ...group, user_id: user.id, revision: current ? current.revision! + 1 : group.revision ?? 0 };
          if (existing) Object.assign(existing, saved); else tables.symptom_groups!.push(saved);
          symptoms.forEach((symptom, priority_position) => {
            const row = tables.symptoms!.find((entry) => entry.id === symptom.id);
            const savedSymptom = { ...symptom, group_id: id, user_id: user.id, priority_position };
            if (row) Object.assign(row, savedSymptom); else tables.symptoms!.push(savedSymptom);
          });
        }
        await route.fulfill({ json: null }); return;
      }
      expect(current).not.toBeNull();
      const ids = body.p_ordered_symptom_ids!;
      expect([...ids].sort()).toEqual(current!.symptoms.map(({ id }) => id).sort());
      expect(new Set(ids).size).toBe(ids.length);
      if (ids.some((id, index) => current!.symptoms[index]!.id !== id)) {
        ids.forEach((id, priority_position) =>
          Object.assign(tables.symptoms!.find((row) => row.id === id)!, { priority_position }));
        tables.symptom_groups!.find((row) => row.id === id)!.revision = current!.revision! + 1;
      }
      await route.fulfill({ json: readGroup(id) }); return;
    }
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
      const key = payload.p_guest_group?.id ?? session.id;
      const previous = receipts.get(key);
      if (previous) {
        expect(JSON.stringify(payload)).toBe(previous.payload);
        await route.fulfill({ json: previous.result }); return;
      }
      if ((session.payload_version === 2 || session.payload_version === 3) && payload.p_guest_group) {
        expect(payload.p_guest_group.revision).toEqual(expect.any(Number));
        expect(payload.p_symptoms.map(({ priority_position }) => priority_position))
          .toEqual(payload.p_symptoms.map((_, index) => index));
      }
      if (session.payload_version === 3 && payload.p_guest_group) {
        expect(payload.p_guest_group.membership_revision).toEqual(expect.any(Number));
        expect(payload.p_guest_group.joint_treatment_membership_revision)
          .toBe(payload.p_guest_group.membership_revision);
      }
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
      const result = { group_id: payload.p_guest_group?.id ?? null, session_id: session.id,
        library_row_id: "journey-library", timeline_event_id: session.id };
      receipts.set(key, { payload: JSON.stringify(payload), result });
      if (losePromotionResponse) {
        losePromotionResponse = false;
        await route.fulfill({ status: 503, json: { message: "Committed response lost" } }); return;
      }
      await route.fulfill({ json: result });
      return;
    }
    const rows = tables[table];
    if (!rows) throw new Error(`Unexpected REST table: ${table}`);
    if (["symptom_groups", "symptoms"].includes(table)) expect(method).toBe("GET");
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
  return { tables, promotions, revisions, requests, user, confirm: () => { confirmed = true; },
    failNextPromotion: () => { failPromotion = true; },
    loseNextPromotionResponse: () => { losePromotionResponse = true; },
    failNextRevision: () => { failRevision = true; },
    loseNextRevisionResponse: () => { loseRevisionResponse = true; },
    counts: () => ({ signups, logins }) };
}
