-- ZYRON - Application Logs Table
-- Replaces in-memory logging with persistent database storage
-- Suporta múltiplas categorias e contexto rich em JSONB

create extension if not exists pgcrypto;

create table if not exists public.app_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Log classification
  type text not null check (type in ('sync', 'checkin', 'auth', 'ai', 'error', 'warning', 'info', 'user_action')),
  level text not null check (level in ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')) default 'INFO',

  -- Core message
  message text not null,

  -- Rich context
  context jsonb null,
  meta jsonb null,

  -- Timestamps
  created_at timestamptz not null default now(),
  client_timestamp timestamptz null,

  -- Optional references
  workout_id uuid null references public.workout_logs(id) on delete set null,
  checkin_id uuid null references public.gym_checkins(id) on delete set null,
  request_id text null,

  -- Expiry for cleanup
  expires_at timestamptz null
);

-- Indexes for common queries
create index if not exists idx_app_logs_user_created on public.app_logs(user_id, created_at desc);
create index if not exists idx_app_logs_type_user on public.app_logs(type, user_id, created_at desc);
create index if not exists idx_app_logs_level on public.app_logs(level, created_at desc);
create index if not exists idx_app_logs_expires on public.app_logs(expires_at) where expires_at is not null;

-- Row Level Security
alter table public.app_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'app_logs'
      and policyname = 'app_logs_select_own'
  ) then
    create policy app_logs_select_own
      on public.app_logs
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
      and tablename = 'app_logs'
      and policyname = 'app_logs_insert_own'
  ) then
    create policy app_logs_insert_own
      on public.app_logs
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Function to auto-delete expired logs
create or replace function public.cleanup_expired_app_logs()
returns void
language sql
as $$
  delete from public.app_logs
  where expires_at is not null and expires_at < now();
$$;

-- Grant function permissions
grant execute on function public.cleanup_expired_app_logs() to service_role;
