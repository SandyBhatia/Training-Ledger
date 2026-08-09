-- ============================================================
--  TRAINING LEDGER — full schema + Row-Level Security
--  Run once in Supabase -> SQL Editor -> New query -> Run.
--  Every table is locked to its owner: a user can only ever
--  read or write their own rows. Essential for health data.
-- ============================================================

-- ---------------- profiles ----------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users on delete cascade,
  display_name   text,
  sex            text,
  birth_date     date,
  height_cm      numeric,
  weight_kg      numeric,
  conditions     text[] default '{}',
  conditions_other text,
  resting_bp     text,
  medications    text,
  goals          text,
  goal_type      text,
  target_date    date,
  experience     text,
  days_per_week  int default 5,
  session_minutes int default 60,
  exercise_prefs text[] default '{}',
  equipment      text,
  diet_style     text,
  allergies      text,
  rest_dow       int default 6,
  units          text default 'lbs',
  onboarded      boolean default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- ---------------- plans ----------------
create table if not exists public.plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  start_date  date default current_date,
  weeks       int default 12,
  workout     jsonb,
  nutrition   jsonb,
  micros      jsonb,
  meta        jsonb,
  active      boolean default true,
  created_at  timestamptz default now()
);
alter table public.plans enable row level security;
drop policy if exists "plans_all_own" on public.plans;
create policy "plans_all_own" on public.plans for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- workout logs ----------------
create table if not exists public.workout_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  log_date   date not null,
  payload    jsonb default '{}'::jsonb,   -- { ex:{id:bool}, w:{id:val}, notes }
  done       boolean default false,
  day_mode   text,                        -- null | 'rest' | 'work'  (skip / shift)
  updated_at timestamptz default now(),
  unique (user_id, log_date)
);
alter table public.workout_logs enable row level security;
drop policy if exists "workout_logs_all_own" on public.workout_logs;
create policy "workout_logs_all_own" on public.workout_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- weekly check-ins ----------------
create table if not exists public.checkins (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users on delete cascade,
  week     int not null,           -- 0 = baseline
  metrics  jsonb default '{}'::jsonb,
  feel     text,
  saved_at timestamptz default now(),
  unique (user_id, week)
);
alter table public.checkins enable row level security;
drop policy if exists "checkins_all_own" on public.checkins;
create policy "checkins_all_own" on public.checkins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- food log ----------------
create table if not exists public.food_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  log_date   date not null,
  meal       text default 'other',
  descr      text,
  macros     jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
alter table public.food_log enable row level security;
drop policy if exists "food_log_all_own" on public.food_log;
create policy "food_log_all_own" on public.food_log for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists food_log_user_date on public.food_log (user_id, log_date);

-- ---------------- wind-down ----------------
create table if not exists public.wind_down (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  log_date   date not null,
  items      jsonb default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique (user_id, log_date)
);
alter table public.wind_down enable row level security;
drop policy if exists "wind_down_all_own" on public.wind_down;
create policy "wind_down_all_own" on public.wind_down for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------- auto-create profile on signup ----------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
