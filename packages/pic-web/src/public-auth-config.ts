/** The only deployment values substituted into browser code. Never expose an environment prefix. */
export function publicAuthDefines(env: Record<string, string | undefined>): Record<string, string> {
  return {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? ""),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY ?? ""),
  };
}
