CREATE TABLE public.mercado_pago_account_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mercado_pago_account_secrets_user_unique UNIQUE (user_id),
  CONSTRAINT mercado_pago_account_secrets_token_len CHECK (char_length(access_token) <= 1024)
);

GRANT ALL ON public.mercado_pago_account_secrets TO service_role;

ALTER TABLE public.mercado_pago_account_secrets ENABLE ROW LEVEL SECURITY;

INSERT INTO public.mercado_pago_account_secrets (user_id, access_token)
SELECT user_id, mercado_pago_access_token
FROM public.professional_payment_settings
WHERE mercado_pago_access_token IS NOT NULL
  AND mercado_pago_access_token <> ''
ON CONFLICT (user_id) DO UPDATE SET
  access_token = EXCLUDED.access_token,
  updated_at = now();

ALTER TABLE public.professional_payment_settings
DROP COLUMN mercado_pago_access_token;

CREATE TRIGGER update_mercado_pago_account_secrets_updated_at
BEFORE UPDATE ON public.mercado_pago_account_secrets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();