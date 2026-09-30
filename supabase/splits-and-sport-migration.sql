-- Run in Supabase -> SQL Editor.
-- Adds split style, custom day builder, and daily sport mobility.
-- Safe to run more than once.

-- ---------------- split style, custom days, sport ----------------
alter table public.profiles add column if not exists split_style text default 'auto';
alter table public.profiles add column if not exists custom_days jsonb;
alter table public.profiles add column if not exists sport text;
alter table public.profiles add column if not exists sport_minutes int default 15;
