create extension if not exists pgcrypto;

create table if not exists proof_projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  passcode text not null,
  status text not null default 'draft',
  payment_locked boolean default true,
  paid boolean default false,
  created_at timestamptz default now()
);

create table if not exists proof_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references proof_projects(id) on delete cascade,
  storage_path text not null,
  preview_url text,
  full_url text,
  file_name text,
  sort_order int default 0,
  is_delivery boolean default false,
  created_at timestamptz default now()
);

create table if not exists proof_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references proof_projects(id) on delete cascade,
  image_id uuid references proof_images(id) on delete cascade,
  author text not null,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists proof_selections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references proof_projects(id) on delete cascade,
  image_id uuid references proof_images(id) on delete cascade,
  selected_at timestamptz default now(),
  constraint proof_selections_project_image_key unique (project_id, image_id)
);

alter table proof_projects enable row level security;
alter table proof_images enable row level security;
alter table proof_notes enable row level security;
alter table proof_selections enable row level security;

create policy "anon can view published proof projects"
on proof_projects
for select
to anon
using (status = 'published');

create policy "anon can view proof images"
on proof_images
for select
to anon
using (true);

create policy "anon can insert proof selections"
on proof_selections
for insert
to anon
with check (true);

create policy "anon can delete proof selections"
on proof_selections
for delete
to anon
using (true);

create policy "anon client can add proof notes"
on proof_notes
for insert
to anon
with check (author = 'client');
