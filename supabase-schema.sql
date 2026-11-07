-- ==============================================================================
-- XKETCH GFX - SUPABASE DATABASE & STORAGE INITIALIZATION SCRIPT
-- ==============================================================================
-- IMPORTANT: In the Supabase SQL Editor, ensure NO text is highlighted/selected
-- before clicking "Run", or press Ctrl+A to select all.

-- 1. Create table for camera captures
create table if not exists public.camera_captures (
  id uuid primary key default gen_random_uuid(),
  capture_id text not null unique,
  image_url text not null,
  storage_path text not null,
  device_type text default 'unknown',
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Index for chronological queries
create index if not exists idx_camera_captures_created_at on public.camera_captures (created_at desc);

-- 3. Enable Row Level Security (RLS)
alter table public.camera_captures enable row level security;

-- 4. Clean RLS Policy for camera_captures (handles insert, select, delete)
drop policy if exists "Allow public to insert captures" on public.camera_captures;
drop policy if exists "Allow public to select captures" on public.camera_captures;
drop policy if exists "Allow deletion of captures" on public.camera_captures;
drop policy if exists "Allow all on camera_captures" on public.camera_captures;

create policy "Allow all on camera_captures"
  on public.camera_captures
  for all
  to public
  using (true)
  with check (true);

-- 5. Safe Realtime Publication (idempotent - won't error if already enabled)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'camera_captures'
  ) then
    alter publication supabase_realtime add table public.camera_captures;
  end if;
end $$;

-- 6. Setup Storage Bucket for Captured Photos
insert into storage.buckets (id, name, public)
values ('captured-photos', 'captured-photos', true)
on conflict (id) do update set public = true;

-- 7. Storage Policies for 'captured-photos' bucket
drop policy if exists "Allow public upload to captured-photos" on storage.objects;
drop policy if exists "Allow public read from captured-photos" on storage.objects;
drop policy if exists "Allow public delete from captured-photos" on storage.objects;
drop policy if exists "Allow all on captured-photos" on storage.objects;

create policy "Allow all on captured-photos"
  on storage.objects
  for all
  to public
  using (bucket_id = 'captured-photos')
  with check (bucket_id = 'captured-photos');
