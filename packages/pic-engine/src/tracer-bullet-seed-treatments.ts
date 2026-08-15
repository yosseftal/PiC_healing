import type { TreatmentListItem } from "./repository-port";

/**
 * Bundled tracer-bullet treatment catalog for Guest Mode (flight-mode / no network). Titles match
 * `supabase/migrations/20260730194911_tracer_bullet_schema.sql` seed rows. IDs are stable client-side
 * handles for `PlayerEngine.startSession` in guest mode; remote promotion requires a `treatment_id` that
 * exists in the EM's Supabase `treatments` table (see Ticket 08-07 Resolution).
 */
export const TRACER_BULLET_SEED_TREATMENTS: readonly TreatmentListItem[] = [
  { id: "2c6e77bd-61db-4898-8612-84e976587ff7", title: "Settling the Nervous System" },
  { id: "c818490b-10ed-46c2-9890-1f35d34f4e25", title: "Grounding Through the Feet" },
  { id: "92be9fb3-7092-4a78-9fa2-4aee9ba34bc6", title: "Loosening the Shoulders and Neck" },
] as const;
