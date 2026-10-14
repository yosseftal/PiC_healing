import { describe, expect, it } from "vitest";
import { publicAuthDefines } from "./public-auth-config";

describe("public Auth configuration", () => {
  it("exposes exactly URL and anon key even when private deployment credentials exist", () => {
    const defines = publicAuthDefines({
      SUPABASE_URL: "https://public.invalid", SUPABASE_ANON_KEY: "public-anon",
      SUPABASE_SERVICE_ROLE_KEY: "never-ship", PIC_TRACER_TEST_USER_PASSWORD: "never-ship-either",
    });
    expect(defines).toEqual({
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://public.invalid"),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify("public-anon"),
    });
    expect(JSON.stringify(defines)).not.toContain("never-ship");
  });
});
