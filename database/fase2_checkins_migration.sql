-- FASE 2: gym_checkins migration
-- Execute no Supabase SQL Editor

alter table public.gym_checkins
  add column if not exists last_seen_at timestamptz null;

create index if not exists idx_checkins_user_status
  on public.gym_checkins (user_id, status);

create unique index if not exists idx_one_active_checkin
  on public.gym_checkins (user_id)
  where status = 'active';

-- Preencher last_seen_at retroativamente onde possível
update public.gym_checkins
  set last_seen_at = coalesce(last_heartbeat_at_utc, started_at_utc)
  where last_seen_at is null;
