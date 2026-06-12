create extension if not exists "pgcrypto";

create type public.project_type as enum (
  'annual_leave',
  'parenting_leave',
  'kindergarten',
  'custom'
);

create type public.unit_mode as enum (
  'half_or_full_day',
  'whole_child_day'
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  type public.project_type not null default 'custom',
  quota_days numeric(6, 1) not null check (quota_days >= 0),
  cycle_start date not null,
  cycle_end date not null,
  unit_mode public.unit_mode not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cycle_end >= cycle_start)
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  date date not null,
  amount_days numeric(6, 1) not null check (amount_days > 0),
  note text not null default '',
  child_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects(user_id);
create index children_user_id_idx on public.children(user_id);
create index entries_project_id_date_idx on public.entries(project_id, date desc);

alter table public.projects enable row level security;
alter table public.children enable row level security;
alter table public.entries enable row level security;

create policy "users can read own projects"
on public.projects for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users can insert own projects"
on public.projects for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can update own projects"
on public.projects for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can delete own projects"
on public.projects for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "users can read own children"
on public.children for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users can insert own children"
on public.children for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can update own children"
on public.children for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can delete own children"
on public.children for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "users can read own entries"
on public.entries for select
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = entries.project_id
      and projects.user_id = (select auth.uid())
  )
);

create policy "users can insert own entries"
on public.entries for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects
    where projects.id = entries.project_id
      and projects.user_id = (select auth.uid())
  )
);

create policy "users can update own entries"
on public.entries for update
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = entries.project_id
      and projects.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = entries.project_id
      and projects.user_id = (select auth.uid())
  )
);

create policy "users can delete own entries"
on public.entries for delete
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = entries.project_id
      and projects.user_id = (select auth.uid())
  )
);
