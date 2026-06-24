-- Etapa 12.5 — Seed: dados iniciais dos planos
INSERT INTO public.plans (id, display_name, price_cents, billing_cycle, trial_days, is_active, is_visible, features, sort_order)
VALUES
  ('trial', 'Acesso Livre', 0, 'none', 7, true, false,
   '["Agenda completa","Clientes ilimitados","Notificações WhatsApp","Agendamento online","7 dias grátis"]'::jsonb, 0),

  ('premium', 'Premium', 4990, 'monthly', 0, true, true,
   '["Agenda completa","Clientes ilimitados","Notificações WhatsApp","Agendamento online","Portfólio","Relatórios","Sem limite de serviços"]'::jsonb, 1),

  ('premium_ia', 'Premium IA', 7990, 'monthly', 0, false, false,
   '["Tudo do Premium","Assistente IA","Sugestões automáticas","Respostas inteligentes"]'::jsonb, 2),

  ('especial', 'Especial', 0, 'none', 0, true, false,
   '["Acesso completo","Sem cobrança","Por convite"]'::jsonb, 3)

ON CONFLICT (id) DO NOTHING;
