import type { TreatmentListItem } from "./repository-port";

/**
 * Bundled tracer-bullet treatment catalog for Guest Mode (flight-mode / no network). Titles match
 * `supabase/migrations/20260730194911_tracer_bullet_schema.sql` seed rows. IDs are stable client-side
 * handles for `PlayerEngine.startSession` in guest mode; remote promotion requires a `treatment_id` that
 * exists in the EM's Supabase `treatments` table (see Ticket 08-07 Resolution).
 */
export const TRACER_BULLET_SEED_TREATMENTS: readonly TreatmentListItem[] = [
  { id: "00000000-0000-4000-8000-000000000001", title: "Settling the Nervous System" },
  { id: "00000000-0000-4000-8000-000000000002", title: "Grounding Through the Feet" },
  { id: "00000000-0000-4000-8000-000000000003", title: "Loosening the Shoulders and Neck" },
] as const;
