import { spawnSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";
import process from "node:process";

// Use the repository config and cwd: existing source fixtures resolve paths from the repository root.
const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const vitest = fileURLToPath(new URL("../../../node_modules/vitest/vitest.mjs", import.meta.url));
const result = spawnSync(process.execPath, [vitest, "run", "packages/pic-web/src", ...process.argv.slice(2)], {
  cwd: repositoryRoot,
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
