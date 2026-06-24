-- Etapa 12.4 — Log de eventos de cobrança (webhooks Asaas)
CREATE TABLE IF NOT EXISTS public.billing_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subscription_id   uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  event_type        text NOT NULL,                      -- PAYMENT_CONFIRMED, PAYMENT_OVERDUE, etc.
  asaas_payment_id  text,
  asaas_event_id    text UNIQUE,                        -- idempotência: impede processar 2x
  amount_cents      integer,
  status_before     text,
  status_after      text,
  payload           jsonb,                              -- raw do webhook
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_events_user      ON public.billing_events (user_id);
CREATE INDEX idx_billing_events_type      ON public.billing_events (event_type);
CREATE INDEX idx_billing_events_created   ON public.billing_events (created_at DESC);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- Apenas service_role acessa
CREATE POLICY "billing_events_admin" ON public.billing_events
  FOR ALL USING (auth.role() = 'service_role');
