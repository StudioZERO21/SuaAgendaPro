-- ============================================================
-- ETAPA 01 — Serviços, Horários e Datas Bloqueadas
-- ============================================================

-- ------------------------------------------------------------
-- TABELA: services
-- ------------------------------------------------------------
CREATE TABLE public.services (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  description        TEXT,
  duration_minutes   INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
  price_cents        INTEGER NOT NULL CHECK (price_cents >= 0),
  deposit_type       TEXT NOT NULL DEFAULT 'none' CHECK (deposit_type IN ('none', 'percent', 'fixed')),
  deposit_value      INTEGER NOT NULL DEFAULT 0 CHECK (deposit_value >= 0),
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT services_name_len CHECK (char_length(name) <= 100),
  CONSTRAINT services_description_len CHECK (description IS NULL OR char_length(description) <= 400),
  CONSTRAINT services_deposit_percent CHECK (
    deposit_type != 'percent' OR (deposit_value >= 0 AND deposit_value <= 100)
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT ON public.services TO anon;
GRANT ALL ON public.services TO service_role;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Profissional gerencia apenas os próprios serviços
CREATE POLICY "services_crud_own"
  ON public.services FOR ALL TO authenticated
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

-- Qualquer um pode ver serviços ativos (para booking público)
CREATE POLICY "services_select_public"
  ON public.services FOR SELECT TO anon
  USING (is_active = true);

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- TABELA: working_hours
-- ------------------------------------------------------------
CREATE TABLE public.working_hours (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open         BOOLEAN NOT NULL DEFAULT false,
  start_time      TIME,
  end_time        TIME,
  break_start     TIME,
  break_end       TIME,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, day_of_week),
  CONSTRAINT working_hours_times_valid CHECK (
    (NOT is_open) OR (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
  ),
  CONSTRAINT working_hours_break_valid CHECK (
    break_start IS NULL OR (break_end IS NOT NULL AND break_start < break_end)
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.working_hours TO authenticated;
GRANT SELECT ON public.working_hours TO anon;
GRANT ALL ON public.working_hours TO service_role;

ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "working_hours_crud_own"
  ON public.working_hours FOR ALL TO authenticated
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "working_hours_select_public"
  ON public.working_hours FOR SELECT TO anon
  USING (true);

CREATE TRIGGER working_hours_updated_at
  BEFORE UPDATE ON public.working_hours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- TABELA: blocked_dates
-- ------------------------------------------------------------
CREATE TABLE public.blocked_dates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_date    DATE NOT NULL,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, blocked_date),
  CONSTRAINT blocked_dates_reason_len CHECK (reason IS NULL OR char_length(reason) <= 200)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_dates TO authenticated;
GRANT SELECT ON public.blocked_dates TO anon;
GRANT ALL ON public.blocked_dates TO service_role;

ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked_dates_crud_own"
  ON public.blocked_dates FOR ALL TO authenticated
  USING (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "blocked_dates_select_public"
  ON public.blocked_dates FOR SELECT TO anon
  USING (true);
