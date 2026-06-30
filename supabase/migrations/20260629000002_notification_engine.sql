-- Motor de Notificações: fila + configurações
-- subscription_notifications passa a ser fila E log (status: pending|sent|failed|skipped)

alter table public.subscription_notifications
  add column if not exists scheduled_for timestamptz,   -- quando pode ser enviado (janela de horário)
  add column if not exists sent_at       timestamptz,   -- quando foi efetivamente enviado
  add column if not exists attempts      integer not null default 0;

-- Índice para o worker pegar pendentes prontos para envio
create index if not exists idx_sub_notif_pending
  on public.subscription_notifications (status, scheduled_for)
  where status = 'pending';

-- ─── Configurações do motor (linha única) ────────────────────────────────────
create table if not exists public.notification_settings (
  id                boolean primary key default true,
  -- canal por tipo de aviso: "email" | "whatsapp" | "both" | "off"
  channels          jsonb   not null default '{
    "trial_3d":"email",
    "trial_1d":"whatsapp",
    "trial_expired":"whatsapp",
    "billing_3d":"email",
    "billing_1d":"whatsapp",
    "suspended_overdue":"whatsapp"
  }'::jsonb,
  window_start_hour integer not null default 9,   -- só envia a partir desta hora (BRT)
  window_end_hour   integer not null default 20,  -- e até esta hora
  throttle_per_run  integer not null default 8,   -- máx. de envios por execução do worker
  send_delay_ms     integer not null default 1500,-- intervalo entre cada envio
  timezone          text    not null default 'America/Sao_Paulo',
  updated_at        timestamptz not null default now(),
  constraint notification_settings_single_row check (id)
);

insert into public.notification_settings (id) values (true)
  on conflict (id) do nothing;

alter table public.notification_settings enable row level security;
-- Sem policies: apenas service role (cron/worker/super admin) acessa.
