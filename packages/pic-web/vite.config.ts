import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { publicAuthDefines } from "./src/public-auth-config";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  envPrefix: [],
  define: publicAuthDefines(loadEnv(mode, fileURLToPath(new URL("../../", import.meta.url)), "")),
}));
