CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.professional_payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  mercado_pago_connected BOOLEAN NOT NULL DEFAULT false,
  mercado_pago_account_email TEXT,
  mercado_pago_public_key TEXT,
  mercado_pago_access_token TEXT,
  pix_enabled BOOLEAN NOT NULL DEFAULT false,
  pix_key_type TEXT NOT NULL DEFAULT 'email' CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  pix_key TEXT,
  pix_beneficiary_name TEXT,
  pix_city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT professional_payment_settings_user_unique UNIQUE (user_id),
  CONSTRAINT professional_payment_settings_email_len CHECK (mercado_pago_account_email IS NULL OR char_length(mercado_pago_account_email) <= 255),
  CONSTRAINT professional_payment_settings_public_key_len CHECK (mercado_pago_public_key IS NULL OR char_length(mercado_pago_public_key) <= 255),
  CONSTRAINT professional_payment_settings_token_len CHECK (mercado_pago_access_token IS NULL OR char_length(mercado_pago_access_token) <= 1024),
  CONSTRAINT professional_payment_settings_pix_key_len CHECK (pix_key IS NULL OR char_length(pix_key) <= 255),
  CONSTRAINT professional_payment_settings_pix_name_len CHECK (pix_beneficiary_name IS NULL OR char_length(pix_beneficiary_name) <= 80),
  CONSTRAINT professional_payment_settings_pix_city_len CHECK (pix_city IS NULL OR char_length(pix_city) <= 40)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_payment_settings TO authenticated;
GRANT ALL ON public.professional_payment_settings TO service_role;

ALTER TABLE public.professional_payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view their payment settings"
ON public.professional_payment_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Professionals can create their payment settings"
ON public.professional_payment_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Professionals can update their payment settings"
ON public.professional_payment_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Professionals can delete their payment settings"
ON public.professional_payment_settings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  appointment_id TEXT,
  client_name TEXT NOT NULL,
  service_name TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  method TEXT NOT NULL CHECK (method IN ('pix_manual', 'mercado_pago')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  external_reference TEXT,
  mercado_pago_payment_id TEXT,
  pix_payload TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_transactions_client_name_len CHECK (char_length(client_name) <= 120),
  CONSTRAINT payment_transactions_service_name_len CHECK (service_name IS NULL OR char_length(service_name) <= 160),
  CONSTRAINT payment_transactions_external_ref_len CHECK (external_reference IS NULL OR char_length(external_reference) <= 160),
  CONSTRAINT payment_transactions_mp_id_len CHECK (mercado_pago_payment_id IS NULL OR char_length(mercado_pago_payment_id) <= 160),
  CONSTRAINT payment_transactions_pix_payload_len CHECK (pix_payload IS NULL OR char_length(pix_payload) <= 1024)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view their payment transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Professionals can create their payment transactions"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Professionals can update their payment transactions"
ON public.payment_transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Professionals can delete their payment transactions"
ON public.payment_transactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_professional_payment_settings_updated_at
BEFORE UPDATE ON public.professional_payment_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX payment_transactions_user_created_idx ON public.payment_transactions (user_id, created_at DESC);
CREATE INDEX payment_transactions_user_status_idx ON public.payment_transactions (user_id, status);