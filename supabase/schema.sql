-- Ladda: schema for the Supabase project.
-- Paste into the Supabase SQL editor and run. Safe to re-run.
-- No original SQL was found in the repo; columns are derived from
-- app/api/intake/complete/route.ts, middleware.ts and lib/contract.

-- ---------------------------------------------------------------- tables

create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  stage             text check (stage in ('aspirant', 'studying', 'graduating')),
  target_role_id    text,
  hours_per_week    integer check (hours_per_week between 1 and 60),
  horizon_weeks     integer check (horizon_weeks >= 1), -- null = until graduation
  profile_complete  boolean not null default false,
  created_at        timestamptz not null default now()
);

create table if not exists public.user_nodes (
  user_id     uuid not null references auth.users (id) on delete cascade,
  skill_id    text not null,
  status      text not null check (status in ('todo', 'known', 'in_progress', 'verified')),
  source      text check (source in ('cv', 'manual', 'task')),
  updated_at  timestamptz not null default now(),
  primary key (user_id, skill_id)
);

-- The route upserts with onConflict "user_id,skill_id"; the primary key above
-- provides that unique constraint.

-- --------------------------------------------------- signup trigger

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users that signed up before the trigger existed (e.g. the demo account).
insert into public.profiles (id)
select id from auth.users
on conflict do nothing;

-- ------------------------------------------------------------------ RLS
-- Writes happen only through the service-role key (bypasses RLS), so there
-- are intentionally no insert/update/delete policies.

alter table public.profiles   enable row level security;
alter table public.user_nodes enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "user_nodes: read own" on public.user_nodes;
create policy "user_nodes: read own"
  on public.user_nodes for select
  to authenticated
  using (auth.uid() = user_id);

-- --------------------------------------------------------------- grants
-- "Grant API access to new tables automatically" is OFF, so grant explicitly.

grant usage on schema public to authenticated, service_role;

grant select on public.profiles   to authenticated;
grant select on public.user_nodes to authenticated;

grant all privileges on public.profiles   to service_role;
grant all privileges on public.user_nodes to service_role;
grant all privileges on all sequences in schema public to service_role;
