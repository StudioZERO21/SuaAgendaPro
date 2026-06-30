-- Analytics histórico: snapshot diário de métricas de assinatura.
create table if not exists public.metrics_snapshots (
  date        date primary key,
  total       integer not null default 0,
  active      integer not null default 0,
  trial       integer not null default 0,
  suspended   integer not null default 0,
  cancelled   integer not null default 0,
  especial    integer not null default 0,
  mrr_cents   bigint  not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.metrics_snapshots enable row level security;
-- Sem policies: apenas service role acessa.

-- Função que captura o snapshot do dia (idempotente — upsert por data).
create or replace function public.capture_metrics_snapshot()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.metrics_snapshots (date, total, active, trial, suspended, cancelled, especial, mrr_cents)
  select
    current_date,
    count(*),
    count(*) filter (where s.status = 'active'),
    count(*) filter (where s.status = 'trial'),
    count(*) filter (where s.status = 'suspended'),
    count(*) filter (where s.status = 'cancelled'),
    count(*) filter (where s.status = 'especial'),
    coalesce(sum(p.price_cents) filter (where s.status = 'active'), 0)
  from public.subscriptions s
  left join public.plans p on p.id = s.plan_id
  on conflict (date) do update set
    total     = excluded.total,
    active    = excluded.active,
    trial     = excluded.trial,
    suspended = excluded.suspended,
    cancelled = excluded.cancelled,
    especial  = excluded.especial,
    mrr_cents = excluded.mrr_cents,
    created_at = now();
$$;

-- Captura imediata para já ter um ponto de dado hoje.
select public.capture_metrics_snapshot();
