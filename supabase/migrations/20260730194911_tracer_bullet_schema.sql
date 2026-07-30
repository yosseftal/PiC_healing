-- Tracer bullet schema (docs/docs/specs/tracer-bullet-happy-path.md §B):
-- DEC-017 profiles columns, symptom_groups/symptoms extensions, and the four new
-- tables (treatments, player_sessions, personal_treatment_library, timeline_events)
-- backing the Guest -> Group -> Standalone Treatment -> Finish happy path.
--
-- Ownership model (docs/adr/0001-hybrid-ownership-for-shared-reference-tables.md):
-- `treatments` is a HYBRID table (nullable user_id: NULL = Global Content, a real
-- uuid = Personal Content) because it is a shared seed catalog today with a
-- plausible future of EM-authored rows in the same table. Every other new table
-- here (player_sessions, personal_treatment_library, timeline_events) is strictly
-- owned (user_id not null) because it is real per-EM health data, never shared.

-- 1. Profiles: add the DEC-017 §5 columns missing from the initial migration.
-- deletion_status / deletion_requested_at are intentionally NOT added here (out of scope).
alter table public.profiles
  add column if not exists email text,
  add column if not exists consent_timestamp timestamptz,
  add column if not exists role text not null default 'event_manager',
  add column if not exists last_server_auth_at timestamptz;

-- 2. Symptom Groups: DEC-002 Joint Treatment Muscle Test.
-- Safe backfill pattern: add nullable, backfill any existing rows, then enforce not null.
-- (No rows are expected in a fresh local dev database, but this migration must not
-- fail if some already exist, so 'together' is used as the safe default backfill value.)
alter table public.symptom_groups
  add column if not exists joint_treatment_muscle_test text,
  add column if not exists joint_treatment_test_at timestamptz;

update public.symptom_groups
  set joint_treatment_muscle_test = 'together'
  where joint_treatment_muscle_test is null;

alter table public.symptom_groups
  alter column joint_treatment_muscle_test set not null;

alter table public.symptom_groups
  add constraint symptom_groups_joint_treatment_muscle_test_check
  check (joint_treatment_muscle_test in ('together', 'split_suggested'));

-- 3. Symptoms: DEC-009 polarity + DEC-010 intensity (independent dimensions).
-- Same safe backfill pattern as symptom_groups above; 'negative' / 0 are the safe
-- default backfill values for any pre-existing rows.
alter table public.symptoms
  add column if not exists polarity text,
  add column if not exists intensity int;

update public.symptoms
  set polarity = coalesce(polarity, 'negative'),
      intensity = coalesce(intensity, 0)
  where polarity is null or intensity is null;

alter table public.symptoms
  alter column polarity set not null,
  alter column intensity set not null;

alter table public.symptoms
  add constraint symptoms_polarity_check check (polarity in ('positive', 'negative')),
  add constraint symptoms_intensity_check check (intensity between 0 and 10);

-- 4. Treatments: minimal seed table for this spike only (not GQ-020's Treatments Table).
-- Hybrid ownership (ADR-0001): user_id is NULLABLE. NULL = Global Content (system-seeded,
-- shared catalog, readable by everyone); a real uuid = Personal Content (an EM's own row).
-- Only migrations/seed scripts run as service_role may write here for now — no
-- insert/update/delete policy is added in this ticket (no EM-authored-treatment feature
-- exists yet).
create table public.treatments (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  structured_markdown text not null,
  content_format text not null default 'structured_markdown',
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Seed rows are Global Content: user_id is explicitly NULL (system-seeded, shared).
insert into public.treatments (title, structured_markdown, user_id) values
(
  'Settling the Nervous System',
  '### Settle Into Stillness

Find a comfortable seated or lying position. Take three slow breaths, letting your shoulders
drop a little further with each exhale.

### Scan the Sensation

Bring your attention to the area you chose to focus on today. Notice temperature, tension, and
any subtle pulsing, without trying to change anything yet.

### Release on the Exhale

With each exhale, imagine the tension softening by ten percent. Continue for about a minute,
then gently let your attention return to the room around you.',
  null
),
(
  'Grounding Through the Feet',
  '### Feel the Ground

Stand or sit with both feet flat on the floor. Notice the points of contact between your feet
and the ground beneath you.

### Root and Rise

Imagine roots extending from your feet into the earth on the inhale, and a gentle lengthening
through your spine on the exhale. Repeat for five full breaths.

### Return to the Room

Open your eyes if they were closed, and take a moment to notice how your body feels now compared
to when you started.',
  null
),
(
  'Loosening the Shoulders and Neck',
  '### Notice the Holding Pattern

Bring gentle awareness to your shoulders and neck. Notice where you may be holding tension
without realizing it.

### Slow Rolls

Slowly roll your shoulders backward five times, then forward five times, keeping the movement
slow and unforced.

### Soften the Neck

Gently tilt your head toward one shoulder, hold for three breaths, then repeat on the other
side. Let your neck feel a little longer with each breath.',
  null
);

-- 5. Player Sessions: the Unified Player's persisted state (DEC-015). Strict ownership.
create table public.player_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  treatment_id uuid references public.treatments(id) not null,
  linked_group_id uuid references public.symptom_groups(id),
  units jsonb not null default '[]'::jsonb,
  terminal_nemar_response text check (terminal_nemar_response in ('yes', 'no')),
  success_declared boolean not null default false,
  integrating_reason text check (integrating_reason in ('mid_exit', 'terminal_nemar_no')),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

-- 6. Personal Treatment Library: per-user toolbox rows (DEC-005, DEC-006, DEC-016).
-- Strict ownership. variant_type is pinned to 'original' for this spike only.
create table public.personal_treatment_library (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  treatment_id uuid references public.treatments(id) not null,
  use_count int not null default 0,
  provenance jsonb,
  variant_type text not null default 'original' check (variant_type = 'original'),
  global_reference_id uuid references public.treatments(id),
  protocol_content text,
  created_at timestamptz not null default now()
);

-- 7. Timeline Events: the chronological, multitype timeline spine (DEC-007, DEC-008).
-- Strict ownership.
create table public.timeline_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  log_type text not null default 'treatment_execution',
  treatment_id uuid references public.treatments(id),
  library_row_id uuid references public.personal_treatment_library(id),
  linked_group_id uuid references public.symptom_groups(id),
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Security Configuration: Row Level Security (RLS) on all four new tables.
alter table public.treatments enable row level security;
alter table public.player_sessions enable row level security;
alter table public.personal_treatment_library enable row level security;
alter table public.timeline_events enable row level security;

-- treatments: hybrid SELECT policy (ADR-0001) — a row is readable when it is Global
-- Content (user_id is null) or Personal Content owned by the caller. No insert/update/
-- delete policy in this ticket — out of scope until an EM-authored-treatment feature
-- exists; only service_role (migrations/seed scripts) may write to this table for now.
create policy "Treatments are readable when global or owned" on public.treatments
  for select using (user_id is null or auth.uid() = user_id);

create policy "Users manage own player sessions" on public.player_sessions
  for all using (auth.uid() = user_id);
create policy "Users manage own library rows" on public.personal_treatment_library
  for all using (auth.uid() = user_id);
create policy "Users manage own timeline events" on public.timeline_events
  for all using (auth.uid() = user_id);
