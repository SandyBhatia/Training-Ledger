-- ============================================================
--  TRAVEL MODE + ACCOUNTABILITY NUDGES
--  Run in Supabase -> SQL Editor.
-- ============================================================

-- Push subscriptions (one row per device/browser)
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push_subs_all_own" on public.push_subscriptions;
create policy "push_subs_all_own" on public.push_subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Declared travel windows: whole date ranges that run in travel mode
create table if not exists public.travel_windows (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  start_date date not null,
  end_date   date not null,
  label      text,
  created_at timestamptz default now()
);
alter table public.travel_windows enable row level security;
drop policy if exists "travel_all_own" on public.travel_windows;
create policy "travel_all_own" on public.travel_windows for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Nudge bookkeeping: what we asked, what they answered, when we last pinged
create table if not exists public.nudges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  sent_at     timestamptz default now(),
  gap_days    int,
  responded   boolean default false,
  response    text,          -- 'travelling' | 'rough_patch' | 'unwell' | 'busy' | 'back_on_it'
  adjusted_to date           -- plan eased until this date
);
alter table public.nudges enable row level security;
drop policy if exists "nudges_all_own" on public.nudges;
create policy "nudges_all_own" on public.nudges for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Eased-plan state lives on the profile
alter table public.profiles add column if not exists eased_until date;
alter table public.profiles add column if not exists eased_reason text;
alter table public.profiles add column if not exists nudges_enabled boolean default true;
alter table public.profiles add column if not exists last_nudge_at timestamptz;
