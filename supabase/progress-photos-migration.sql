-- Run this in Supabase -> SQL Editor if your database already exists.
-- ============================================================
--  PROGRESS PHOTOS
--  If your database already exists, run just this block.
-- ============================================================

create table if not exists public.progress_photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  week       int not null,                  -- 0 = baseline
  pose       text not null,                 -- 'front' | 'side' | 'back'
  path       text not null,                 -- object path in the 'progress' bucket
  taken_at   timestamptz default now(),
  unique (user_id, week, pose)
);
alter table public.progress_photos enable row level security;
drop policy if exists "progress_photos_all_own" on public.progress_photos;
create policy "progress_photos_all_own" on public.progress_photos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private storage bucket. Files live under <user_id>/... and these policies
-- make it impossible for one user to read another's photos.
insert into storage.buckets (id, name, public)
values ('progress', 'progress', false)
on conflict (id) do nothing;

drop policy if exists "progress_read_own" on storage.objects;
drop policy if exists "progress_insert_own" on storage.objects;
drop policy if exists "progress_update_own" on storage.objects;
drop policy if exists "progress_delete_own" on storage.objects;

create policy "progress_read_own" on storage.objects for select
  using (bucket_id = 'progress' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "progress_insert_own" on storage.objects for insert
  with check (bucket_id = 'progress' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "progress_update_own" on storage.objects for update
  using (bucket_id = 'progress' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "progress_delete_own" on storage.objects for delete
  using (bucket_id = 'progress' and (storage.foldername(name))[1] = auth.uid()::text);
