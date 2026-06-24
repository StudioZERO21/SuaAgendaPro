-- Etapa 8 — Templates de mensagem (email + WhatsApp)
CREATE TABLE IF NOT EXISTS message_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
  event       TEXT NOT NULL,
  subject     TEXT,                        -- apenas para email
  body        TEXT NOT NULL,
  variables   JSONB NOT NULL DEFAULT '[]', -- ex: ["nome","dias_restantes"]
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS message_templates_event_type_idx ON message_templates(event, type);

CREATE OR REPLACE TRIGGER trg_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: somente service_role
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON message_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed de templates padrão
INSERT INTO message_templates (name, type, event, subject, body, variables) VALUES
(
  'Trial expirando em 3 dias — Email',
  'email',
  'trial_expiring_3d',
  'Seu período gratuito termina em {{dias_restantes}} dias',
  '<h2>Olá, {{nome}}!</h2>
<p>Seu período de teste no <strong>SuaAgenda.Pro</strong> termina em <strong>{{dias_restantes}} dias</strong>.</p>
<p>Para continuar usando a plataforma sem interrupções, escolha um plano agora:</p>
<p><a href="https://app.suaagendapro.com/plano" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Ver planos</a></p>
<p>Se tiver dúvidas, fale conosco pelo WhatsApp.</p>
<p>Equipe SuaAgenda.Pro</p>',
  '["nome","dias_restantes"]'
),
(
  'Trial expirando amanhã — WhatsApp',
  'whatsapp',
  'trial_expiring_1d',
  NULL,
  '⏰ *{{nome}}*, seu trial no SuaAgenda.Pro termina *amanhã*!

Para não perder acesso à sua agenda, clique abaixo e escolha seu plano:
👉 https://app.suaagendapro.com/plano

Qualquer dúvida, estou aqui! 😊',
  '["nome"]'
),
(
  'Trial expirado — WhatsApp',
  'whatsapp',
  'trial_expired',
  NULL,
  '🔒 *{{nome}}*, seu acesso ao SuaAgenda.Pro foi *suspenso* porque o trial de 7 dias terminou.

Reative agora para voltar a receber agendamentos:
👉 https://app.suaagendapro.com/plano

Precisa de ajuda? Me chama aqui mesmo! 🙏',
  '["nome"]'
),
(
  'Pagamento vencendo em 3 dias — Email',
  'email',
  'payment_overdue_3d',
  'Seu pagamento vence em {{dias_restantes}} dias',
  '<h2>Olá, {{nome}}!</h2>
<p>Seu pagamento da assinatura <strong>{{plano}}</strong> vence em <strong>{{dias_restantes}} dias</strong>.</p>
<p>Regularize agora para evitar a suspensão da conta:</p>
<p><a href="{{link_pagamento}}" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Pagar agora</a></p>',
  '["nome","plano","dias_restantes","link_pagamento"]'
),
(
  'Pagamento vencendo amanhã — WhatsApp',
  'whatsapp',
  'payment_overdue_1d',
  NULL,
  '⚠️ *{{nome}}*, seu pagamento do SuaAgenda.Pro vence *amanhã*!

Para não ter sua conta suspensa, pague agora:
💳 {{link_pagamento}}

Qualquer problema, fala comigo!',
  '["nome","link_pagamento"]'
),
(
  'Conta suspensa por inadimplência — WhatsApp',
  'whatsapp',
  'subscription_suspended',
  NULL,
  '🚫 *{{nome}}*, sua conta no SuaAgenda.Pro foi *suspensa* por falta de pagamento.

Para reativar e voltar a receber agendamentos:
💳 {{link_pagamento}}

Estamos aqui para ajudar! 💜',
  '["nome","link_pagamento"]'
),
(
  'Boas-vindas ao trial — Email',
  'email',
  'welcome_trial',
  'Bem-vindo(a) ao SuaAgenda.Pro! Seu trial de 7 dias começou 🎉',
  '<h2>Bem-vindo(a), {{nome}}! 🎉</h2>
<p>Seu período de teste de <strong>7 dias grátis</strong> no SuaAgenda.Pro começou agora!</p>
<p>Acesse sua agenda em:</p>
<p><a href="https://app.suaagendapro.com" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Entrar na plataforma</a></p>
<p>Seu link de agendamento público: <strong>https://app.suaagendapro.com/agendar/{{slug}}</strong></p>',
  '["nome","slug"]'
)
ON CONFLICT (event, type) DO NOTHING;
