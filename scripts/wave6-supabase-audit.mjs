#!/usr/bin/env node
/**
 * Wave 6 one-off audit script — Connectivity Check + Schema Audit + Clean-state Sweep against the
 * Event Manager's real Supabase project (docker/local `supabase start` unavailable in this sandbox).
 *
 * Deliberately prints only sanitized, non-secret information: HTTP status codes, table/column
 * presence, and row counts. Never logs SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY values.
 *
 * This file is temporary tooling for Wave 6's Pre-flight, not part of any package — delete once the
 * wave closes.
 */
import { readFileSync } from "node:fs";

function loadEnvLocal(path) {
  const content = readFileSync(path, "utf8");
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnvLocal(".env.local");
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const restBase = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1`;
const authHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

async function fetchOpenApiSchema() {
  const res = await fetch(`${restBase}/`, {
    headers: { ...authHeaders, Accept: "application/openapi+json" },
  });
  const status = res.status;
  if (!res.ok) {
    return { status, ok: false, definitions: {}, paths: {} };
  }
  const body = await res.json();
  return { status, ok: true, definitions: body.definitions ?? {}, paths: body.paths ?? {} };
}

async function fetchRowCount(table) {
  const res = await fetch(`${restBase}/${table}?select=id&limit=1`, {
    headers: { ...authHeaders, Prefer: "count=exact" },
  });
  const status = res.status;
  if (status === 404 || status === 400) {
    let detail = null;
    try {
      detail = await res.json();
    } catch {
      // ignore body parse failure
    }
    return { table, status, exists: false, count: null, detail };
  }
  const contentRange = res.headers.get("content-range");
  let count = null;
  if (contentRange && contentRange.includes("/")) {
    const total = contentRange.split("/")[1];
    count = total === "*" ? null : Number(total);
  }
  return { table, status, exists: res.ok, count };
}

const EXPECTED_TABLES = [
  "profiles",
  "symptom_groups",
  "symptoms",
  "treatments",
  "player_sessions",
  "personal_treatment_library",
  "timeline_events",
];

const EXPECTED_COLUMNS = {
  profiles: ["id", "email", "consent_timestamp", "role", "last_server_auth_at"],
  symptom_groups: ["id", "user_id", "name", "joint_treatment_muscle_test", "joint_treatment_test_at"],
  symptoms: ["polarity", "intensity"],
  treatments: ["id", "title", "structured_markdown", "content_format", "user_id"],
  player_sessions: [
    "id",
    "user_id",
    "treatment_id",
    "linked_group_id",
    "units",
    "terminal_nemar_response",
    "success_declared",
    "integrating_reason",
    "finished_at",
  ],
  personal_treatment_library: [
    "id",
    "user_id",
    "treatment_id",
    "use_count",
    "provenance",
    "variant_type",
    "global_reference_id",
    "protocol_content",
  ],
  timeline_events: ["id", "user_id", "log_type", "treatment_id", "library_row_id", "linked_group_id", "metadata"],
};

// Ticket 13 (Wave 6): additive columns + the promotion RPC. Checked separately from ticket 11's own
// EXPECTED_COLUMNS above so a fresh pulse-audit can report which wave's schema surface is missing.
const TICKET_13_EXPECTED_COLUMNS = {
  symptom_groups: ["promotion_payload_fingerprint"],
  personal_treatment_library: ["promoted_session_ids"],
};
const TICKET_13_RPC_FUNCTION = "promote_guest_to_account";

async function main() {
  console.log("=== 1. Connectivity Check ===");
  console.log("SUPABASE_URL host:", new URL(SUPABASE_URL).host);

  const schema = await fetchOpenApiSchema();
  console.log("OpenAPI introspection status:", schema.status, schema.ok ? "OK" : "FAILED");

  if (!schema.ok) {
    console.log("Could not reach PostgREST schema endpoint — stopping here.");
    process.exit(1);
  }

  console.log("\n=== 2. Schema Audit (Ticket 11) ===");
  for (const table of EXPECTED_TABLES) {
    const def = schema.definitions[table];
    if (!def) {
      console.log(`[MISSING TABLE] ${table}`);
      continue;
    }
    const actualColumns = Object.keys(def.properties ?? {});
    const expectedCols = EXPECTED_COLUMNS[table] ?? [];
    const missingCols = expectedCols.filter((c) => !actualColumns.includes(c));
    if (missingCols.length > 0) {
      console.log(`[TABLE OK, COLUMNS MISSING] ${table}: missing [${missingCols.join(", ")}]`);
    } else {
      console.log(`[OK] ${table}: all expected columns present (${actualColumns.length} total columns)`);
    }
  }

  console.log("\n=== 2b. Schema Audit (Ticket 13) ===");
  for (const [table, cols] of Object.entries(TICKET_13_EXPECTED_COLUMNS)) {
    const def = schema.definitions[table];
    const actualColumns = Object.keys(def?.properties ?? {});
    const missingCols = cols.filter((c) => !actualColumns.includes(c));
    if (missingCols.length > 0) {
      console.log(`[MISSING COLUMN(S)] ${table}: missing [${missingCols.join(", ")}]`);
    } else {
      console.log(`[OK] ${table}: ${cols.join(", ")} present`);
    }
  }
  const rpcPath = `/rpc/${TICKET_13_RPC_FUNCTION}`;
  if (schema.paths[rpcPath]) {
    console.log(`[OK] RPC function present: ${TICKET_13_RPC_FUNCTION}`);
  } else {
    console.log(`[MISSING RPC] ${TICKET_13_RPC_FUNCTION} not found in schema cache`);
  }

  console.log("\n=== 3. Clean-state Sweep (row counts, service-role bypasses RLS) ===");
  for (const table of EXPECTED_TABLES) {
    const result = await fetchRowCount(table);
    if (!result.exists) {
      console.log(`[${table}] query failed — status ${result.status}`, result.detail ?? "");
      continue;
    }
    console.log(`[${table}] row count: ${result.count}`);
  }
}

main().catch((err) => {
  console.error("Audit script failed:", err.message);
  process.exit(1);
});
