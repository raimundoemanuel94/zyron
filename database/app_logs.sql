-- ZYRON - Application Logs Table (v2 - corrigido)
-- Execute no Supabase SQL Editor

-- Step 1: Garantir extensão
create extension if not exists pgcrypto;

-- Step 2: Dropar tabela antiga se existir (para recriar corretamente)
drop table if exists public.app_logs cascade;

-- Step 3: Criar tabela com estrutura completa
create table public.app_logs (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,

  -- Classificação do log
  log_type      text        not null default 'info'
                            check (log_type in ('sync', 'checkin', 'auth', 'ai', 'error', 'warning', 'info', 'user_action')),
  log_level     text        not null default 'INFO'
                            check (log_level in ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),

  -- Mensagem principal
  message       text        not null,

  -- Contexto rich (JSONB)
  context       jsonb       null,
  meta          jsonb       null,

  -- Timestamps
  created_at    timestamptz not null default now(),
  client_timestamp timestamptz null,

  -- Referências opcionais (sem FK para evitar problemas se tabelas não existirem)
  workout_id    uuid        null,
  checkin_id    uuid        null,
  request_id    text        null,

  -- Auto-limpeza
  expires_at    timestamptz null
);

-- Step 4: Indexes para queries comuns
create index idx_app_logs_user_created   on public.app_logs(user_id, created_at desc);
create index idx_app_logs_type_user      on public.app_logs(log_type, user_id, created_at desc);
create index idx_app_logs_level          on public.app_logs(log_level, created_at desc);
create index idx_app_logs_expires        on public.app_logs(expires_at) where expires_at is not null;

-- Step 5: Row Level Security
alter table public.app_logs enable row level security;

create policy app_logs_select_own
  on public.app_logs for select
  to authenticated
  using (auth.uid() = user_id);

create policy app_logs_insert_own
  on public.app_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Step 6: Permitir service_role inserir (para server-side logging)
create policy app_logs_service_all
  on public.app_logs for all
  to service_role
  using (true)
  with check (true);

-- Step 7: Função de limpeza automática
create or replace function public.cleanup_expired_app_logs()
returns void
language sql
security definer
as $$
  delete from public.app_logs
  where expires_at is not null and expires_at < now();
$$;

grant execute on function public.cleanup_expired_app_logs() to service_role;
