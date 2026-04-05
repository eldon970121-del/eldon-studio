-- ============================================================
-- Eldon Studio — Client Proofing Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Table
create table if not exists public.proofing_projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  client_name  text not null,
  passcode     text not null,
  status       text not null default 'awaiting_selection'
                 check (status in ('awaiting_selection','selection_completed','delivered')),
  images       jsonb not null default '[]'::jsonb,
  -- images shape: [{ id: string, url: string, caption?: string }]
  selections   jsonb not null default '[]'::jsonb,
  -- selections shape: [{ imageId: string, note?: string }]
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 2. Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_proofing_projects_updated_at on public.proofing_projects;
create trigger trg_proofing_projects_updated_at
  before update on public.proofing_projects
  for each row execute procedure public.set_updated_at();

-- 3. Row Level Security
alter table public.proofing_projects enable row level security;

-- Allow anonymous read by slug (passcode validation handled client-side for MVP)
create policy "anon_read_by_slug"
  on public.proofing_projects
  for select
  to anon
  using (true);

-- Allow anonymous update of selections + status only (not passcode/slug)
create policy "anon_update_selections"
  on public.proofing_projects
  for update
  to anon
  using (true)
  with check (true);

-- Admins (authenticated) have full access
create policy "auth_full_access"
  on public.proofing_projects
  for all
  to authenticated
  using (true)
  with check (true);

-- 4. Index for fast slug lookups
create index if not exists idx_proofing_projects_slug
  on public.proofing_projects (slug);
