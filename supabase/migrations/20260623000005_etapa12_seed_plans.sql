-- Etapa 12.5 — Seed: 4 planos iniciais
INSERT INTO public.plans (id, display_name, price_cents, billing_cycle, trial_days, is_active, is_visible, features, sort_order)
VALUES
  (
    'trial',
    'Acesso Livre',
    0,
    'none',
    7,
    true,
    true,
    '["Agenda ilimitada","Clientes ilimitados","Agendamento online","Pagamentos PIX","Notificações WhatsApp","Portfólio profissional"]'::jsonb,
    0
  ),
  (
    'premium',
    'Premium',
    4990,
    'monthly',
    0,
    true,
    true,
    '["Tudo do Acesso Livre","Múltiplos serviços","Relatórios avançados","Personalização completa","Suporte prioritário","Sem anúncios"]'::jsonb,
    1
  ),
  (
    'premium_ia',
    'Premium IA',
    7990,
    'monthly',
    0,
    false,
    true,
    '["Tudo do Premium","Assistente IA para agenda","Sugestões automáticas","Análise de clientes com IA","Respostas automáticas WhatsApp"]'::jsonb,
    2
  ),
  (
    'especial',
    'Especial',
    0,
    'none',
    0,
    true,
    false,
    '["Tudo do Premium","Acesso vitalício","Sem cobrança","Por convite"]'::jsonb,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  display_name  = EXCLUDED.display_name,
  price_cents   = EXCLUDED.price_cents,
  features      = EXCLUDED.features,
  is_active     = EXCLUDED.is_active,
  is_visible    = EXCLUDED.is_visible,
  sort_order    = EXCLUDED.sort_order;
