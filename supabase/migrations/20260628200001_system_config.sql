-- System-wide configuration singleton (row id=1 always)
CREATE TABLE IF NOT EXISTS public.system_config (
  id                      INTEGER  PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  -- Test mode
  test_mode_active        BOOLEAN  NOT NULL DEFAULT false,
  test_mode_expires_at    TIMESTAMPTZ,
  test_session_id         UUID     NOT NULL DEFAULT gen_random_uuid(),

  -- Maintenance mode
  maintenance_mode_active BOOLEAN  NOT NULL DEFAULT false,
  maintenance_ends_at     TIMESTAMPTZ,
  maintenance_message     TEXT     NOT NULL DEFAULT 'O sistema está passando por uma manutenção preventiva. Voltamos em breve!',

  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT
);

INSERT INTO public.system_config (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read — needed for maintenance overlay before auth
CREATE POLICY "public_read_system_config" ON public.system_config
  FOR SELECT USING (true);

GRANT SELECT ON public.system_config TO anon, authenticated;
GRANT ALL   ON public.system_config TO service_role;

-- Add _test_sid column to key business tables (test data isolation)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS _test_sid UUID;
ALTER TABLE public.clients      ADD COLUMN IF NOT EXISTS _test_sid UUID;
ALTER TABLE public.services     ADD COLUMN IF NOT EXISTS _test_sid UUID;

CREATE INDEX IF NOT EXISTS appointments_test_sid_idx ON public.appointments (_test_sid) WHERE _test_sid IS NOT NULL;
CREATE INDEX IF NOT EXISTS clients_test_sid_idx      ON public.clients      (_test_sid) WHERE _test_sid IS NOT NULL;
CREATE INDEX IF NOT EXISTS services_test_sid_idx     ON public.services     (_test_sid) WHERE _test_sid IS NOT NULL;

-- Cached helper: returns current test session UUID (NULL when test mode is off)
CREATE OR REPLACE FUNCTION public.current_test_sid()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT CASE WHEN test_mode_active THEN test_session_id ELSE NULL END
  FROM public.system_config WHERE id = 1
$$;

-- Trigger: auto-tag inserts with the current test session when test mode is active
CREATE OR REPLACE FUNCTION public.tag_test_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v UUID := public.current_test_sid();
BEGIN
  IF v IS NOT NULL THEN NEW._test_sid = v; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tag_appointments_test ON public.appointments;
CREATE TRIGGER tag_appointments_test BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.tag_test_insert();

DROP TRIGGER IF EXISTS tag_clients_test ON public.clients;
CREATE TRIGGER tag_clients_test BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.tag_test_insert();

DROP TRIGGER IF EXISTS tag_services_test ON public.services;
CREATE TRIGGER tag_services_test BEFORE INSERT ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.tag_test_insert();
