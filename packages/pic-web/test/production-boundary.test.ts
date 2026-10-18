import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { build, createServer } from "vite";
import { productionBoundary } from "../build/production-boundary";

async function bundle(entry: string, extraPage = false) {
  return build({
    configFile: false,
    logLevel: "silent",
    plugins: [
      {
        name: "boundary-probe",
        resolveId(id) { if (id.startsWith("/boundary-probe/")) return id; },
        load(id) { if (id.startsWith("/boundary-probe/")) return "console.log('probe')"; },
        generateBundle() {
          if (extraPage) this.emitFile({ type: "asset", fileName: "debug.html", source: "debug" });
        },
      },
      productionBoundary("production"),
    ],
    build: { write: false, rolldownOptions: { input: entry } },
  });
}

describe("production artifact boundary", () => {
  it("builds a product entry", async () => {
    await expect(bundle("/boundary-probe/main.js")).resolves.toBeDefined();
  });
  it.each([
    "tests/harness.js", "src/mock.fixture.js", "src/domain.test.js",
    "src/domain.spec.js", "src/i18n/terminology-test-fixture.js",
    "src/action-layout/action.type-fixtures.js", "test-helpers/fake.js", "dev/debug.js",
  ])("rejects a development module: %s", async (entry) => {
    await expect(bundle(`/boundary-probe/${entry}`)).rejects.toThrow("Development artifact in production graph");
  });
  it("rejects an extra HTML entry emitted by a plugin", async () => {
    await expect(bundle("/boundary-probe/main.js", true)).rejects.toThrow("Unapproved production output: debug.html");
  });
  it.each([["development", 404], ["browser-test", 200]] as const)(
    "serves harnesses only in explicit browser-test mode (%s)", async (mode, status) => {
      const server = await createServer({
        configFile: false,
        root: fileURLToPath(new URL("../", import.meta.url)),
        plugins: [productionBoundary(mode)],
        optimizeDeps: { noDiscovery: true, include: [] },
        server: { host: "127.0.0.1", port: 0 },
      });
      try {
        await server.listen();
        const baseURL = server.resolvedUrls!.local[0]!;
        const response = await fetch(new URL("tests/unified-player.fixture.html", baseURL));
        expect(response.status).toBe(status);
      } finally { await server.close(); }
    },
  );
});
