-- ============================================================
-- LGPD — consentimento marketing, aceite de termos, DSAR
-- ============================================================

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_opt_out    BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at  TIMESTAMPTZ;

-- Solicitações de titulares (clientes finais via profissional)
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type     TEXT NOT NULL CHECK (request_type IN (
    'access', 'rectification', 'deletion', 'portability', 'opposition'
  )),
  requester_name   TEXT NOT NULL,
  requester_email  TEXT NOT NULL,
  requester_phone  TEXT,
  professional_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message          TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.data_subject_requests TO service_role;
GRANT INSERT ON public.data_subject_requests TO anon;
GRANT SELECT, UPDATE ON public.data_subject_requests TO authenticated;

ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dsar_insert_public"
  ON public.data_subject_requests FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "dsar_select_own_professional"
  ON public.data_subject_requests FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "dsar_update_own_professional"
  ON public.data_subject_requests FOR UPDATE TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

CREATE TRIGGER data_subject_requests_updated_at
  BEFORE UPDATE ON public.data_subject_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
