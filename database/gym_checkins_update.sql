-- ZYRON - FASE 2: Atualizar gym_checkins com campos de FASE 2
-- Adiciona last_seen_at e garante campos necessários

alter table public.gym_checkins
  add column if not exists last_seen_at timestamptz null;

comment on column public.gym_checkins.last_seen_at
  is 'Atualizado em cada heartbeat — usado para detectar inatividade';

-- Preencher last_seen_at com last_heartbeat_at_utc onde existir
update public.gym_checkins
set last_seen_at = last_heartbeat_at_utc
where last_seen_at is null and last_heartbeat_at_utc is not null;

-- Index para detectar check-ins inativos eficientemente
create index if not exists idx_gym_checkins_active_last_seen
  on public.gym_checkins(user_id, last_seen_at)
  where status = 'active';
