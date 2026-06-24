-- Etapa 8 — Configurações do sistema (chave-valor)
CREATE TABLE IF NOT EXISTS system_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON system_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO system_settings (key, value, description) VALUES
  ('asaas_env',              'sandbox', 'Ambiente Asaas: sandbox | production'),
  ('premium_price_cents',    '4990',    'Preço do plano Premium em centavos'),
  ('trial_days',             '7',       'Duração do trial em dias'),
  ('support_whatsapp',       '',        'Número WhatsApp de suporte (ex: 5511999999999)'),
  ('support_email',          '',        'E-mail de suporte exibido aos usuários'),
  ('platform_name',          'SuaAgenda.Pro', 'Nome da plataforma'),
  ('app_url',                'https://app.suaagendapro.com', 'URL do app'),
  ('evolution_instance',     'suaagendapro', 'Nome da instância Evolution API'),
  ('notifications_email',    'true',    'Habilitar notificações por email'),
  ('notifications_whatsapp', 'true',    'Habilitar notificações por WhatsApp')
ON CONFLICT (key) DO NOTHING;
