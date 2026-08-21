import type { Treatment, TreatmentListItem } from "./repository-port";

/** Verbatim from `supabase/migrations/20260730194911_tracer_bullet_schema.sql` — Settling the Nervous System. */
const SETTLING_THE_NERVOUS_SYSTEM_MARKDOWN = `### Settle Into Stillness

Find a comfortable seated or lying position. Take three slow breaths, letting your shoulders
drop a little further with each exhale.

### Scan the Sensation

Bring your attention to the area you chose to focus on today. Notice temperature, tension, and
any subtle pulsing, without trying to change anything yet.

### Release on the Exhale

With each exhale, imagine the tension softening by ten percent. Continue for about a minute,
then gently let your attention return to the room around you.`;

/** Verbatim from `supabase/migrations/20260730194911_tracer_bullet_schema.sql` — Grounding Through the Feet. */
const GROUNDING_THROUGH_THE_FEET_MARKDOWN = `### Feel the Ground

Stand or sit with both feet flat on the floor. Notice the points of contact between your feet
and the ground beneath you.

### Root and Rise

Imagine roots extending from your feet into the earth on the inhale, and a gentle lengthening
through your spine on the exhale. Repeat for five full breaths.

### Return to the Room

Open your eyes if they were closed, and take a moment to notice how your body feels now compared
to when you started.`;

/** Verbatim from `supabase/migrations/20260730194911_tracer_bullet_schema.sql` — Loosening the Shoulders and Neck. */
const LOOSENING_THE_SHOULDERS_AND_NECK_MARKDOWN = `### Notice the Holding Pattern

Bring gentle awareness to your shoulders and neck. Notice where you may be holding tension
without realizing it.

### Slow Rolls

Slowly roll your shoulders backward five times, then forward five times, keeping the movement
slow and unforced.

### Soften the Neck

Gently tilt your head toward one shoulder, hold for three breaths, then repeat on the other
side. Let your neck feel a little longer with each breath.`;

/**
 * Full bundled tracer-bullet treatment rows for Guest Mode (flight-mode / no network). Content is
 * byte-identical to the Supabase seed migration; IDs are FK-aligned for Atomic Promotion.
 */
export const TRACER_BULLET_SEED_TREATMENT_ROWS: readonly Treatment[] = [
  {
    id: "2c6e77bd-61db-4898-8612-84e976587ff7",
    title: "Settling the Nervous System",
    structured_markdown: SETTLING_THE_NERVOUS_SYSTEM_MARKDOWN,
    content_format: "structured_markdown",
  },
  {
    id: "c818490b-10ed-46c2-9890-1f35d34f4e25",
    title: "Grounding Through the Feet",
    structured_markdown: GROUNDING_THROUGH_THE_FEET_MARKDOWN,
    content_format: "structured_markdown",
  },
  {
    id: "92be9fb3-7092-4a78-9fa2-4aee9ba34bc6",
    title: "Loosening the Shoulders and Neck",
    structured_markdown: LOOSENING_THE_SHOULDERS_AND_NECK_MARKDOWN,
    content_format: "structured_markdown",
  },
] as const;

/**
 * Flat picker catalog derived from `TRACER_BULLET_SEED_TREATMENT_ROWS` — keeps `listTreatments()` cheap.
 */
export const TRACER_BULLET_SEED_TREATMENTS: readonly TreatmentListItem[] =
  TRACER_BULLET_SEED_TREATMENT_ROWS.map(({ id, title }) => ({ id, title }));
