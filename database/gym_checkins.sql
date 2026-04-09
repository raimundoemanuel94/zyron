-- ZYRON - Gym Check-in table (native iOS check-in flow)
-- Phase 4: start / heartbeat / end endpoints support

create extension if not exists pgcrypto;

create table if not exists public.gym_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_session_id text null,
  gym_id text not null,

  status text not null default 'active' check (status in ('active', 'ended')),
  mode text not null default 'auto' check (mode in ('auto', 'manual')),
  source text not null check (source in ('gps', 'network', 'manual')),
  timezone text not null,

  started_at_utc timestamptz not null,
  started_at_local timestamptz not null,
  started_lat double precision null,
  started_lng double precision null,
  started_accuracy_m double precision null,

  last_heartbeat_at_utc timestamptz null,
  last_heartbeat_lat double precision null,
  last_heartbeat_lng double precision null,
  last_heartbeat_accuracy_m double precision null,
  heartbeat_source text null check (heartbeat_source in ('gps', 'network', 'manual')),
  heartbeat_count integer not null default 1 check (heartbeat_count >= 0),

  ended_at_utc timestamptz null,
  ended_at_local timestamptz null,
  ended_lat double precision null,
  ended_lng double precision null,
  ended_accuracy_m double precision null,
  ended_reason text null,
  end_source text null check (end_source in ('gps', 'network', 'manual')),
  duration_minutes integer not null default 0 check (duration_minutes >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gym_checkins_user_status on public.gym_checkins(user_id, status);
create index if not exists idx_gym_checkins_user_started_at on public.gym_checkins(user_id, started_at_utc desc);
create unique index if not exists uq_gym_checkins_one_active_per_user
  on public.gym_checkins(user_id)
  where status = 'active';
create unique index if not exists uq_gym_checkins_client_session
  on public.gym_checkins(user_id, client_session_id)
  where client_session_id is not null;

create or replace function public.set_gym_checkins_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_gym_checkins_updated_at on public.gym_checkins;
create trigger trg_gym_checkins_updated_at
before update on public.gym_checkins
for each row
execute function public.set_gym_checkins_updated_at();

alter table public.gym_checkins enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_checkins'
      and policyname = 'gym_checkins_select_own'
  ) then
    create policy gym_checkins_select_own
      on public.gym_checkins
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_checkins'
      and policyname = 'gym_checkins_insert_own'
  ) then
    create policy gym_checkins_insert_own
      on public.gym_checkins
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'gym_checkins'
      and policyname = 'gym_checkins_update_own'
  ) then
    create policy gym_checkins_update_own
      on public.gym_checkins
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

