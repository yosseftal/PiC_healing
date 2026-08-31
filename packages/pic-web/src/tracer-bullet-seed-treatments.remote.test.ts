import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { TRACER_BULLET_SEED_TREATMENTS } from "pic-engine";
import {
  createSupabaseRepositoryFromClient,
  readSupabasePublicConfigFromEnv,
} from "./promote-path";

const CANONICAL_SEED_TREATMENTS = [
  {
    id: "2c6e77bd-61db-4898-8612-84e976587ff7",
    title: "Settling the Nervous System",
  },
  {
    id: "c818490b-10ed-46c2-9890-1f35d34f4e25",
    title: "Grounding Through the Feet",
  },
  {
    id: "92be9fb3-7092-4a78-9fa2-4aee9ba34bc6",
    title: "Loosening the Shoulders and Neck",
  },
] as const;

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
    "the three canonical ids resolve to their Supabase global treatment rows",
    async () => {
      const config = readSupabasePublicConfigFromEnv(remoteEnv!)!;
      const { createSupabaseBrowserClient } = await import("./promote-path");
      const client = createSupabaseBrowserClient(config);
      const repository = createSupabaseRepositoryFromClient(client);
      const remoteTreatments = await repository.listTreatments();

      expect(TRACER_BULLET_SEED_TREATMENTS).toEqual(CANONICAL_SEED_TREATMENTS);

      for (const canonical of CANONICAL_SEED_TREATMENTS) {
        const remote = remoteTreatments.find((row) => row.title === canonical.title);
        expect(remote, `missing remote treatment titled "${canonical.title}"`).toBeDefined();
        expect(remote!.id).toBe(canonical.id);
      }
    },
    15_000,
  );
});
