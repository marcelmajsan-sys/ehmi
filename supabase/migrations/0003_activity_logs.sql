-- 0003_activity_logs.sql — SIGURNO za git
-- Praćenje aktivnosti: posjeti/logini (visit_log) + upiti u Istraži korelacije (query_log).
-- Čita samo admin (RLS). Upis ide preko service_role klijenta sa servera (zaobilazi RLS).

-- ============ UPITI (Istraži korelacije) ============
create table if not exists query_log (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete set null,
  email      text,
  role       text,
  question   text not null,
  sql        text,
  row_count  int,
  success    boolean not null default true,
  error      text,
  created_at timestamptz not null default now()
);
create index if not exists idx_query_log_user    on query_log(user_id);
create index if not exists idx_query_log_created on query_log(created_at desc);

-- ============ POSJETI / LOGINI ============
create table if not exists visit_log (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete set null,
  email      text,
  role       text,
  event_type text not null default 'login' check (event_type in ('login','page_view')),
  path       text,
  created_at timestamptz not null default now()
);
create index if not exists idx_visit_log_user    on visit_log(user_id);
create index if not exists idx_visit_log_created on visit_log(created_at desc);

-- ============ RLS — čita samo admin ============
alter table query_log enable row level security;
alter table visit_log enable row level security;

drop policy if exists ql_admin on query_log;
create policy ql_admin on query_log for select using (is_admin());

drop policy if exists vl_admin on visit_log;
create policy vl_admin on visit_log for select using (is_admin());
