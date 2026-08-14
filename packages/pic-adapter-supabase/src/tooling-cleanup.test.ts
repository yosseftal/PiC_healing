import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));

describe("tooling cleanup (ticket 06)", () => {
  it("active adapter test sources do not reference the deleted wave6 audit script", () => {
    const files = [
      "packages/pic-adapter-supabase/src/supabase-repository.test.ts",
      "packages/pic-adapter-supabase/src/symptoms-rated-at-schema.test.ts",
    ];
    for (const rel of files) {
      const content = readFileSync(`${repoRoot}/${rel}`, "utf8");
      expect(content).not.toContain("wave6-supabase-audit");
    }
  });

  it("supabase-connectivity-check.mjs exists as the durable replacement", () => {
    expect(existsSync(`${repoRoot}/scripts/supabase-connectivity-check.mjs`)).toBe(true);
    expect(existsSync(`${repoRoot}/scripts/wave6-supabase-audit.mjs`)).toBe(false);
  });
});
