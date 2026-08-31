-- Align Global Content seed ids with the canonical ids bundled for Guest Mode.
update public.treatments
set id = '2c6e77bd-61db-4898-8612-84e976587ff7'
where title = 'Settling the Nervous System'
  and user_id is null
  and id <> '2c6e77bd-61db-4898-8612-84e976587ff7';

update public.treatments
set id = 'c818490b-10ed-46c2-9890-1f35d34f4e25'
where title = 'Grounding Through the Feet'
  and user_id is null
  and id <> 'c818490b-10ed-46c2-9890-1f35d34f4e25';

update public.treatments
set id = '92be9fb3-7092-4a78-9fa2-4aee9ba34bc6'
where title = 'Loosening the Shoulders and Neck'
  and user_id is null
  and id <> '92be9fb3-7092-4a78-9fa2-4aee9ba34bc6';

-- Re-apply the GFM content update now that the Grounding row has its canonical id.
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
