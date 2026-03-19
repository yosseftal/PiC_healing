-- 1. Profiles Table: Personal space and language settings
-- Manages user identity and the NAMER (נמ"ר) terminology
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  -- We store the NAMER terms here so each user can customize their inquiry style later
  language_preferences jsonb default '{
    "positive_terms": ["נכון", "מדויק", "רצוי"],
    "inquiry_placeholder": "על איזה קבוצת סימפטומים אתה רוצה לעבוד עכשיו?"
  }'::jsonb,
  updated_at timestamp with time zone default now()
);

-- 2. Symptom Groups: Logical organization of inquiry topics
create table public.symptom_groups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default now()
);

-- 3. Symptoms: The core units of inquiry
create table public.symptoms (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.symptom_groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  inquiry_prompts text[] default '{}',
  created_at timestamp with time zone default now()
);

-- 4. Treatment Logs: Documentation of sessions and discoveries
create table public.treatment_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  symptom_id uuid references public.symptoms(id) on delete set null,
  is_surrogate boolean default false,
  finding text,
  created_at timestamp with time zone default now()
);

-- Security Configuration: Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.symptom_groups enable row level security;
alter table public.symptoms enable row level security;
alter table public.treatment_logs enable row level security;

-- Policies: Ensuring a private and safe space for each user
create policy "Users manage own profiles" on public.profiles for all using (auth.uid() = id);
create policy "Users manage own groups" on public.symptom_groups for all using (auth.uid() = user_id);
create policy "Users manage own symptoms" on public.symptoms for all using (auth.uid() = user_id);
create policy "Users manage own logs" on public.treatment_logs for all using (auth.uid() = user_id);