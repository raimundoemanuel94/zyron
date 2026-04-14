-- ZYRON - Cardio logs vinculados ao treino

create table if not exists public.cardio_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_log_id uuid references public.workout_logs(id) on delete set null,
  workout_sync_id text,
  session_id text,
  workout_key text,
  cardio_type text not null,
  context text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  status text not null default 'active',
  source text not null default 'workout_session',
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cardio_logs_status_check check (status in ('active', 'completed', 'cancelled', 'aborted')),
  constraint cardio_logs_duration_check check (duration_seconds >= 0)
);

create index if not exists idx_cardio_logs_user_created
on public.cardio_logs(user_id, created_at desc);

create index if not exists idx_cardio_logs_user_status
on public.cardio_logs(user_id, status);

create index if not exists idx_cardio_logs_workout_log
on public.cardio_logs(workout_log_id);

create index if not exists idx_cardio_logs_workout_sync
on public.cardio_logs(user_id, workout_sync_id);

create or replace function public.set_cardio_logs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_cardio_logs_updated_at on public.cardio_logs;
create trigger trg_cardio_logs_updated_at
before update on public.cardio_logs
for each row
execute function public.set_cardio_logs_updated_at();

alter table public.cardio_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'cardio_logs'
      and policyname = 'cardio_logs_select_own'
  ) then
    create policy cardio_logs_select_own
      on public.cardio_logs
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'cardio_logs'
      and policyname = 'cardio_logs_insert_own'
  ) then
    create policy cardio_logs_insert_own
      on public.cardio_logs
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'cardio_logs'
      and policyname = 'cardio_logs_update_own'
  ) then
    create policy cardio_logs_update_own
      on public.cardio_logs
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'cardio_logs'
      and policyname = 'cardio_logs_delete_own'
  ) then
    create policy cardio_logs_delete_own
      on public.cardio_logs
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;
