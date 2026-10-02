import { createServer } from "vite";

/** Own Vite in the Playwright setup process so Windows has no shell child to orphan. */
export default async function browserSetup(): Promise<() => Promise<void>> {
  const server = await createServer({
    server: { host: "127.0.0.1", port: 4173, strictPort: true },
  });
  await server.listen();
  return async () => {
    await server.close();
  };
}
