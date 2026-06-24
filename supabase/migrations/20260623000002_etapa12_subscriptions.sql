-- Etapa 12.2 — Tabela de assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id               text NOT NULL REFERENCES public.plans(id) DEFAULT 'trial',
  status                text NOT NULL DEFAULT 'trial'
                        CHECK (status IN ('trial','active','overdue','suspended','cancelled','especial')),
  trial_ends_at         timestamptz,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  grace_period_ends_at  timestamptz,
  asaas_subscription_id text,
  asaas_customer_id     text,
  cancelled_at          timestamptz,
  notes                 text,                           -- observações admin (ex: "concedido manualmente")
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT subscriptions_user_unique UNIQUE (user_id)
);

CREATE INDEX idx_subscriptions_status     ON public.subscriptions (status);
CREATE INDEX idx_subscriptions_trial_ends ON public.subscriptions (trial_ends_at)
  WHERE status = 'trial';
CREATE INDEX idx_subscriptions_period_end ON public.subscriptions (current_period_end)
  WHERE status = 'active';

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas a própria assinatura
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Apenas service_role escreve
CREATE POLICY "subscriptions_admin" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- updated_at automático
CREATE OR REPLACE FUNCTION public.set_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_subscriptions_updated_at();
