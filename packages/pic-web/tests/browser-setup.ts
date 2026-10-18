import { build, createServer, preview } from "vite";

/** Own Vite in the Playwright setup process so Windows has no shell child to orphan. */
export default async function browserSetup(): Promise<() => Promise<void>> {
  // Exercise shipped assets as well as the explicitly enabled component harnesses.
  await build({ mode: "production" });
  const production = await preview({
    mode: "production",
    preview: { host: "127.0.0.1", port: 4174, strictPort: true },
  });
  const server = await createServer({
    mode: "browser-test",
    server: { host: "127.0.0.1", port: 4173, strictPort: true },
  });
  try { await server.listen(); }
  catch (error) { await production.close(); await server.close(); throw error; }
  return async () => {
    await Promise.all([server.close(), production.close()]);
  };
}
