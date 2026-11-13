-- VAANAM user workspace persistence
-- Run this once in Supabase Dashboard -> SQL Editor.
-- Uses the signed-in Supabase Auth user as the owner of each saved workspace.

create table if not exists public.vaanam_workspace_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace text not null check (
    workspace in (
      'home',
      'osm-history',
      'change-detection',
      'land-surface-temperature',
      'legal'
    )
  ),
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint vaanam_workspace_state_pkey primary key (user_id, workspace)
);

create index if not exists vaanam_workspace_state_updated_at_idx
  on public.vaanam_workspace_state (updated_at desc);

alter table public.vaanam_workspace_state enable row level security;

-- Only authenticated clients may use this table; row ownership is enforced below.
revoke all on table public.vaanam_workspace_state from anon, public;
grant select, insert, update, delete on table public.vaanam_workspace_state to authenticated;

-- Users can see only their own saved workspace records.
drop policy if exists "vaanam workspace select own" on public.vaanam_workspace_state;
create policy "vaanam workspace select own"
  on public.vaanam_workspace_state
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can create only records whose owner id is their own Auth id.
drop policy if exists "vaanam workspace insert own" on public.vaanam_workspace_state;
create policy "vaanam workspace insert own"
  on public.vaanam_workspace_state
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update only their own records.
drop policy if exists "vaanam workspace update own" on public.vaanam_workspace_state;
create policy "vaanam workspace update own"
  on public.vaanam_workspace_state
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete only their own records.
drop policy if exists "vaanam workspace delete own" on public.vaanam_workspace_state;
create policy "vaanam workspace delete own"
  on public.vaanam_workspace_state
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Private storage for source files used in a workspace.
-- 100 MiB per file. Supabase project-plan limits may be lower.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vaanam-workspace-assets',
  'vaanam-workspace-assets',
  false,
  104857600,
  array[
    'application/xml',
    'text/xml',
    'application/octet-stream',
    'image/tiff',
    'application/geotiff',
    'application/json',
    'text/csv'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Object names are stored as: <auth-user-id>/<workspace>/<input-id>/<file-name>
-- The first folder must always match the authenticated user id.
drop policy if exists "vaanam assets select own" on storage.objects;
create policy "vaanam assets select own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'vaanam-workspace-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vaanam assets insert own" on storage.objects;
create policy "vaanam assets insert own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'vaanam-workspace-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vaanam assets update own" on storage.objects;
create policy "vaanam assets update own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'vaanam-workspace-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'vaanam-workspace-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vaanam assets delete own" on storage.objects;
create policy "vaanam assets delete own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'vaanam-workspace-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- No public read access or service_role key is used by the website.
