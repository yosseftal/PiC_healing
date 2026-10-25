import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { FinalizedSymptomGroup, PromoteGuestToAccountInput } from "pic-engine";
import { GroupRevisionConflictError, InvalidSymptomOrderError } from "pic-engine";
import { SupabaseRepository } from "./supabase-repository";

const group: FinalizedSymptomGroup = {
  id: "10000000-0000-0000-0000-000000000001", name: "Precision", revision: 7,
  created_at: "2026-10-20T00:00:00.123456Z", joint_treatment_muscle_test: "together",
  joint_treatment_test_at: "2026-10-20T00:00:00.000Z",
  symptoms: [{ id: "20000000-0000-0000-0000-000000000001", name: "Zero", polarity: "positive",
    intensity: 0, rated_at: "2026-10-20T00:00:00.987654Z" }],
};

function transport(response: unknown, status = 200) {
  const requests: { path: string; body: unknown }[] = [];
  const client = createClient("https://fixture.invalid", "fixture-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (url, init) => {
      requests.push({ path: new URL(String(url)).pathname, body: init?.body ? JSON.parse(String(init.body)) : null });
      return new Response(JSON.stringify(response), { status, headers: { "Content-Type": "application/json" } });
    } },
  });
  return { port: new SupabaseRepository(client), requests };
}

describe("checked group RPC transport", () => {
  it("saves through one checked RPC and returns the reorder transaction projection", async () => {
    const { port, requests } = transport(group);
    await port.saveGroup(group);
    expect(await port.reorderSymptoms(group.id, [group.symptoms[0]!.id], 7)).toEqual(group);
    expect(requests).toEqual([
      { path: "/rest/v1/rpc/save_symptom_group", body: { p_group: group } },
      { path: "/rest/v1/rpc/reorder_group_symptoms", body: {
        p_group_id: group.id, p_ordered_symptom_ids: [group.symptoms[0]!.id], p_expected_revision: 7,
      } },
    ]);
  });

  it("maps conflicts and invalid membership separately from permission failures", async () => {
    for (const [message, errorType] of [
      ["GROUP_REVISION_CONFLICT: stale", GroupRevisionConflictError],
      ["GROUP_MEMBERSHIP: omitted", InvalidSymptomOrderError],
    ] as const) {
      await expect(transport({ message }, 400).port.saveGroup(group)).rejects.toBeInstanceOf(errorType);
    }
    const permission = transport({ message: "GROUP_PERMISSION: another owner" }, 403);
    await expect(permission.port.saveGroup(group)).rejects.not.toBeInstanceOf(GroupRevisionConflictError);
  });

  it("keeps the frozen legacy wire shape and adds explicit metadata only for v2, including unlinked intents", async () => {
    const input: PromoteGuestToAccountInput = {
      idempotencyKey: group.id, group, newUserId: "owner",
      playerSession: { id: "session", treatment_id: "treatment", linked_group_id: group.id,
        units: [], terminal_nemar_response: "yes", success_declared: false, finished_at: null, integrating_reason: null },
    };
    const { port, requests } = transport({ message: "transport receipt stop" }, 400);
    await expect(port.promoteGuestToAccount(input)).rejects.toThrow("transport receipt stop");
    const legacy = requests[0]!.body;
    expect(legacy).toEqual({
      p_guest_group: { id: group.id, name: "Precision", created_at: "2026-10-20T00:00:00.123456Z",
        joint_treatment_muscle_test: "together", joint_treatment_test_at: "2026-10-20T00:00:00.000Z" },
      p_symptoms: [{ id: group.symptoms[0]!.id, name: "Zero", polarity: "positive", intensity: 0,
        rated_at: "2026-10-20T00:00:00.987654Z" }],
      p_player_session: input.playerSession, p_new_user_id: "owner",
    });
    await expect(port.promoteGuestToAccount({ ...input, promotionPayloadVersion: 2 })).rejects.toThrow();
    expect(requests[1]!.body).toMatchObject({ p_guest_group: { revision: 7 },
      p_symptoms: [{ priority_position: 0 }], p_player_session: { payload_version: 2 } });
    await expect(port.promoteGuestToAccount({ ...input, idempotencyKey: "session", group: null,
      playerSession: { ...input.playerSession, linked_group_id: null }, promotionPayloadVersion: 2 })).rejects.toThrow();
    expect(requests[2]!.body).toMatchObject({ p_guest_group: null, p_symptoms: [], p_player_session: { payload_version: 2 } });
    await expect(port.promoteGuestToAccount({ ...input,
      group: { ...group, symptoms: [{ ...group.symptoms[0]!, rated_at: null }] } })).rejects.toThrow();
    expect(requests[3]!.body).toMatchObject({ p_symptoms: [expect.not.objectContaining({ rated_at: null })] });
  });
  it("reads one coherent projection and preserves timestamp microseconds", async () => {
    const { port, requests } = transport(group);
    expect(await port.getGroup(group.id)).toEqual(group);
    expect(requests).toEqual([{ path: "/rest/v1/rpc/get_symptom_group", body: { p_group_id: group.id } }]);
  });
});
