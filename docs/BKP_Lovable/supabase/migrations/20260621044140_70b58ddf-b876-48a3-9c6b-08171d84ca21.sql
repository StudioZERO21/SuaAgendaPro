CREATE TABLE public.mercado_pago_oauth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'started',
  reason text,
  redirect_uri text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

GRANT SELECT ON public.mercado_pago_oauth_attempts TO authenticated;
GRANT ALL ON public.mercado_pago_oauth_attempts TO service_role;

ALTER TABLE public.mercado_pago_oauth_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their OAuth attempts"
  ON public.mercado_pago_oauth_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages OAuth attempts"
  ON public.mercado_pago_oauth_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX mercado_pago_oauth_attempts_user_idx
  ON public.mercado_pago_oauth_attempts(user_id, created_at DESC);