-- Tabela para armazenar secrets TOTP dos super admins
-- Acessível apenas via service role key (RLS bloqueia anon/authenticated)

CREATE TABLE IF NOT EXISTS super_admin_mfa (
  email       TEXT PRIMARY KEY,
  totp_secret TEXT NOT NULL,
  enabled     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE super_admin_mfa ENABLE ROW LEVEL SECURITY;
-- Sem policies = apenas service role tem acesso (nunca exposto ao cliente)
