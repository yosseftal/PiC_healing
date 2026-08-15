import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { TRACER_BULLET_SEED_TREATMENTS } from "pic-engine";
import {
  createSupabaseRepositoryFromClient,
  readSupabasePublicConfigFromEnv,
} from "./promote-path";

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

const envPath = join(process.cwd(), ".env.local");
let remoteEnv: Record<string, string> | null = null;
try {
  remoteEnv = loadEnvLocal(envPath);
} catch {
  remoteEnv = null;
}

const hasRemoteCredentials = remoteEnv !== null && readSupabasePublicConfigFromEnv(remoteEnv) !== null;

describe.skipIf(!hasRemoteCredentials)("tracer bullet seed treatments remote parity", () => {
  beforeAll(() => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  });

  it(
    "TRACER_BULLET_SEED_TREATMENTS ids match Supabase global treatment rows by title",
    async () => {
      const config = readSupabasePublicConfigFromEnv(remoteEnv!)!;
      const { createSupabaseBrowserClient } = await import("./promote-path");
      const client = createSupabaseBrowserClient(config);
      const repository = createSupabaseRepositoryFromClient(client);
      const remoteTreatments = await repository.listTreatments();

      for (const seed of TRACER_BULLET_SEED_TREATMENTS) {
        const remote = remoteTreatments.find((row) => row.title === seed.title);
        expect(remote, `missing remote treatment titled "${seed.title}"`).toBeDefined();
        expect(remote!.id).toBe(seed.id);
      }
    },
    15_000,
  );
});
