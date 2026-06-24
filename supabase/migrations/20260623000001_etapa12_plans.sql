-- Etapa 12.1 — Tabela de planos
CREATE TABLE IF NOT EXISTS public.plans (
  id            text PRIMARY KEY,                        -- 'trial','premium','premium_ia','especial'
  display_name  text NOT NULL,
  price_cents   integer NOT NULL DEFAULT 0,             -- em centavos (4990 = R$49,90)
  billing_cycle text NOT NULL DEFAULT 'monthly'         -- 'monthly' | 'none'
                CHECK (billing_cycle IN ('monthly','none')),
  trial_days    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  is_visible    boolean NOT NULL DEFAULT true,          -- false = "Em breve" na UI
  features      jsonb NOT NULL DEFAULT '[]'::jsonb,     -- lista de features exibidas
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler planos
CREATE POLICY "plans_select" ON public.plans
  FOR SELECT USING (true);

-- Apenas service_role pode modificar
CREATE POLICY "plans_admin" ON public.plans
  FOR ALL USING (auth.role() = 'service_role');
