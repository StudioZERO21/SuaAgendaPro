-- Etapa 12.3 — Mapeamento user_id ↔ Asaas customer_id
CREATE TABLE IF NOT EXISTS public.asaas_customers (
  user_id            uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  asaas_customer_id  text NOT NULL UNIQUE,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;

-- Apenas service_role acessa
CREATE POLICY "asaas_customers_admin" ON public.asaas_customers
  FOR ALL USING (auth.role() = 'service_role');
