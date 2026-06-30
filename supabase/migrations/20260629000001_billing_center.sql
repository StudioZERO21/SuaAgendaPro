-- Central de Cobranças (Super Admin)
-- Log de notificações de assinatura enviadas + histórico de execuções do cron.

-- ─── Log de notificações de assinatura ───────────────────────────────────────
create table if not exists public.subscription_notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null,   -- trial_3d | trial_1d | trial_expired | billing_3d | billing_1d | suspended_overdue
  channel    text not null,   -- email | whatsapp
  status     text not null,   -- sent | failed
  target     text,            -- email ou telefone para o qual foi enviado
  error      text,            -- mensagem de erro (quando status=failed)
  created_at timestamptz not null default now()
);

create index if not exists idx_sub_notif_user    on public.subscription_notifications (user_id, created_at desc);
create index if not exists idx_sub_notif_kind    on public.subscription_notifications (kind, created_at desc);

alter table public.subscription_notifications enable row level security;
-- Sem policies: apenas o service role (cron / super admin) acessa.

-- ─── Histórico de execuções de cron ──────────────────────────────────────────
create table if not exists public.cron_runs (
  id          uuid primary key default gen_random_uuid(),
  job         text not null,                 -- 'subscription-cron'
  notified    integer not null default 0,
  suspended   integer not null default 0,
  errors      integer not null default 0,
  duration_ms integer,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_cron_runs_job on public.cron_runs (job, created_at desc);

alter table public.cron_runs enable row level security;
-- Sem policies: apenas o service role acessa.
