import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { publicAuthDefines } from "./src/public-auth-config.ts";
import { productionBoundary } from "./build/production-boundary.ts";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), productionBoundary(mode)],
  // Product navigation is engine-derived at /; unknown URLs must never fall back to the app.
  appType: "mpa",
  publicDir: false,
  build: {
    rolldownOptions: {
      input: fileURLToPath(new URL("./index.html", import.meta.url)),
      output: {
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: "supabase", test: /node_modules[\\/]@supabase[\\/]/ },
            { name: "vendor", test: /node_modules/ },
          ],
        },
      },
    },
  },
  envPrefix: [],
  define: publicAuthDefines(loadEnv(mode, fileURLToPath(new URL("../../", import.meta.url)), "")),
}));
