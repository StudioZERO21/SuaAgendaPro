-- Schema isolado para IA — SEM dados pessoais (PII)
-- Aplicar manualmente no PostgreSQL da VPS:
--   psql $VPS_DATABASE_URL -f src/lib/db-vps-schema.sql

-- Padrões de agendamento (sem nome, telefone ou email do cliente)
CREATE TABLE IF NOT EXISTS ai_appointment_patterns (
  id              BIGSERIAL PRIMARY KEY,
  professional_id UUID        NOT NULL,
  service_id      UUID        NOT NULL,
  day_of_week     SMALLINT    NOT NULL,  -- 0=dom … 6=sáb
  hour_of_day     SMALLINT    NOT NULL,
  month           SMALLINT    NOT NULL,
  year            SMALLINT    NOT NULL,
  count           INT         NOT NULL DEFAULT 1,
  avg_price_cents INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_appt_patterns_unique UNIQUE (professional_id, service_id, day_of_week, hour_of_day, month, year)
);

CREATE INDEX IF NOT EXISTS idx_ai_patterns_prof
  ON ai_appointment_patterns (professional_id, day_of_week, hour_of_day);

-- Estatísticas de serviços (sem clientes)
CREATE TABLE IF NOT EXISTS ai_service_stats (
  id              BIGSERIAL PRIMARY KEY,
  professional_id UUID        NOT NULL,
  service_id      UUID        NOT NULL,
  service_name    TEXT        NOT NULL,
  category        TEXT,
  duration_min    INT,
  total_bookings  INT         NOT NULL DEFAULT 0,
  avg_rating      NUMERIC(3,2),
  price_cents     INT,
  period_month    SMALLINT    NOT NULL,
  period_year     SMALLINT    NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (service_id, period_month, period_year)
);

-- Resumo por profissional (sem dados pessoais do profissional)
CREATE TABLE IF NOT EXISTS ai_professional_summary (
  professional_id UUID        PRIMARY KEY,
  specialty       TEXT,
  city            TEXT,
  state           TEXT,
  total_clients   INT         NOT NULL DEFAULT 0,  -- contagem, nunca lista
  total_bookings  INT         NOT NULL DEFAULT 0,
  avg_rating      NUMERIC(3,2),
  active_services INT         NOT NULL DEFAULT 0,
  plan_id         TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Avaliações (anonimizadas — sem client_name, sem client_avatar)
CREATE TABLE IF NOT EXISTS ai_reviews_anonymized (
  id              BIGSERIAL   PRIMARY KEY,
  professional_id UUID        NOT NULL,
  service_id      UUID,
  rating          SMALLINT    NOT NULL,
  sentiment       TEXT,       -- positivo / neutro / negativo (pre-processado)
  has_text        BOOLEAN     NOT NULL DEFAULT false,
  created_at      DATE        NOT NULL  -- apenas data, sem hora exata
);

CREATE INDEX IF NOT EXISTS idx_ai_reviews_prof
  ON ai_reviews_anonymized (professional_id, rating);
