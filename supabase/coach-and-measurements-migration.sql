-- Run this in Supabase -> SQL Editor.
-- Adds the coach conversation table and onboarding tape measurements.
-- Safe to run even if you already ran travel-push-migration.sql.

-- ---------------- coach conversation ----------------
create table if not exists public.coach_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  role       text not null,            -- 'user' | 'assistant'
  content    text not null,
  created_at timestamptz default now()
);
alter table public.coach_messages enable row level security;
drop policy if exists "coach_msgs_all_own" on public.coach_messages;
create policy "coach_msgs_all_own" on public.coach_messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists coach_msgs_user_time on public.coach_messages (user_id, created_at);

-- onboarding tape measurements
alter table public.profiles add column if not exists waist_in numeric;
alter table public.profiles add column if not exists neck_in numeric;
alter table public.profiles add column if not exists hips_in numeric;
