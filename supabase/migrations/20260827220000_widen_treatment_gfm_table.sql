-- Wave 9.1 Decision D (GFM Lockstep): widen one existing Global Content treatment's
-- structured_markdown with a real GFM table, in lockstep with the TypeScript Guest seed
-- (packages/pic-engine/src/tracer-bullet-seed-treatments.ts). The already-applied INSERT
-- migration (20260730194911_tracer_bullet_schema.sql) is never rewritten in place - this is
-- an UPDATE-only migration targeting the same row by its known FK-aligned id (ADR-0001: seed
-- rows are Global Content, user_id is null). No fourth id is introduced.
update public.treatments
set structured_markdown = $$### Feel the Ground

Stand or sit with both feet flat on the floor. Notice the points of contact between your feet
and the ground beneath you.

### Root and Rise

Imagine roots extending from your feet into the earth on the inhale, and a gentle lengthening
through your spine on the exhale. Repeat for five full breaths.

### Return to the Room

Open your eyes if they were closed, and take a moment to notice how your body feels now compared
to when you started.

| Before | After |
| --- | --- |
| ~~Unsteady~~ | Grounded |
| Tense | Settled |

- [x] Felt both feet on the floor
- [ ] Noticed the shift in my breath$$
where id = 'c818490b-10ed-46c2-9890-1f35d34f4e25' and user_id is null;
